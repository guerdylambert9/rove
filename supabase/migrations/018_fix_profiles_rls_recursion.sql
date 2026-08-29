-- Fix infinite recursion: profiles RLS must not query profiles directly.
-- Use a security definer helper instead.

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

-- Profiles: replace self-referential admin policy
drop policy if exists "Admins view profiles for coverage review" on public.profiles;
create policy "Admins view profiles for coverage review"
  on public.profiles for select
  using (public.is_admin ());

-- Coverages: use helper (avoids nested profile reads under RLS)
drop policy if exists "Admins update coverage verification" on public.coverages;
create policy "Admins update coverage verification"
  on public.coverages for update
  using (public.is_admin ());

drop policy if exists "Admins view all coverages" on public.coverages;
create policy "Admins view all coverages"
  on public.coverages for select
  using (public.is_admin ());

-- Storage policies that checked admin via profiles
drop policy if exists "Parties read coverage proofs" on storage.objects;
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

drop policy if exists "Parties read agreement signatures" on storage.objects;
create policy "Parties read agreement signatures"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'agreements'
    and (
      (storage.foldername (name))[1] = auth.uid ()::text
      or public.is_admin ()
      or exists (
        select 1
        from public.agreements a
        join public.trips t on t.id = a.trip_id
        where a.signature_ref = name
          and (t.renter_id = auth.uid () or t.owner_id = auth.uid ())
      )
    )
  );
