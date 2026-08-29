-- Phase 4 finish: coverage proof storage, agreements, admin verify, pickup gate helpers

-- Admin check helper (security definer — avoids profiles RLS recursion in policies)
create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid ()
      and 'admin' = any (roles)
  );
$$;

grant execute on function public.is_admin () to authenticated;

-- Agreements: extra fields for e-sign audit trail
alter table public.agreements
  add column if not exists signer_name text,
  add column if not exists signature_ref text,
  add column if not exists template_version text,
  add column if not exists acknowledgment_snapshot text;

-- Coverage proofs bucket (private — signed URLs for parties + admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coverage-proofs',
  'coverage-proofs',
  false,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Agreement documents bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agreements',
  'agreements',
  false,
  5242880,
  array['application/json', 'text/plain']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Renters upload own coverage proofs" on storage.objects;
drop policy if exists "Parties read coverage proofs" on storage.objects;
drop policy if exists "Renters upload own agreement signatures" on storage.objects;
drop policy if exists "Parties read agreement signatures" on storage.objects;

create policy "Renters upload own coverage proofs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'coverage-proofs'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );

create policy "Parties read coverage proofs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coverage-proofs'
    and (
      (storage.foldername (name))[1] = auth.uid ()::text
      or public.is_admin ()
      or exists (
        select 1
        from public.coverages c
        join public.trips t on t.id = c.trip_id
        where c.proof_file_ref = name
          and (t.renter_id = auth.uid () or t.owner_id = auth.uid ())
      )
    )
  );

create policy "Renters upload own agreement signatures"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'agreements'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );

create policy "Parties read agreement signatures"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'agreements'
    and (
      (storage.foldername (name))[1] = auth.uid ()::text
      or exists (
        select 1
        from public.agreements a
        join public.trips t on t.id = a.trip_id
        where a.signature_ref = name
          and (t.renter_id = auth.uid () or t.owner_id = auth.uid ())
      )
      or public.is_admin ()
    )
  );

-- Admins can update coverage verification status
drop policy if exists "Admins update coverage verification" on public.coverages;
create policy "Admins update coverage verification"
  on public.coverages for update
  using (public.is_admin ());

-- Admins can view all coverages pending review
drop policy if exists "Admins view all coverages" on public.coverages;
create policy "Admins view all coverages"
  on public.coverages for select
  using (public.is_admin ());

drop policy if exists "Admins view profiles for coverage review" on public.profiles;
create policy "Admins view profiles for coverage review"
  on public.profiles for select
  using (public.is_admin ());

-- Renter creates agreement on own trip
drop policy if exists "Renters create agreement for own trips" on public.agreements;
create policy "Renters create agreement for own trips"
  on public.agreements for insert
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_id
        and t.renter_id = auth.uid ()
    )
  );

drop policy if exists "Renters update agreement for own trips" on public.agreements;
create policy "Renters update agreement for own trips"
  on public.agreements for update
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_id
        and t.renter_id = auth.uid ()
    )
  );

drop policy if exists "Renters update own agreement signatures" on storage.objects;
create policy "Renters update own agreement signatures"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'agreements'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );

-- Notify renter when own-policy coverage is verified
create or replace function public.notify_coverage_verified ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle_name text;
begin
  if old.verification_status = new.verification_status then
    return new;
  end if;

  if new.verification_status <> 'verified' then
    return new;
  end if;

  select v.name into v_vehicle_name
  from public.trips t
  join public.vehicles v on v.id = t.vehicle_id
  where t.id = new.trip_id;

  insert into public.notifications (user_id, trip_id, type, title, body)
  select t.renter_id, t.id, 'coverage_verified', 'Coverage verified',
    format('Your coverage for %s is verified. Sign the rental agreement before pickup.',
      coalesce(v_vehicle_name, 'your trip'))
  from public.trips t
  where t.id = new.trip_id;

  update public.trips
  set state = 'coverage_verified'
  where id = new.trip_id
    and state = 'coverage_pending';

  return new;
end;
$$;

drop trigger if exists on_coverage_verified on public.coverages;
create trigger on_coverage_verified
  after update on public.coverages
  for each row
  execute function public.notify_coverage_verified ();
