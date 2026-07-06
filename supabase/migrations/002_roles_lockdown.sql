-- Phase 1b: Lock down profile roles; admin-only role changes

-- Valid role values
alter table public.profiles
  add constraint profiles_roles_valid
  check (roles <@ array['renter', 'owner', 'admin']::text[]);

-- Block non-admins from changing roles (SQL editor / postgres bypasses via null auth.uid())
create or replace function public.protect_profile_roles ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.roles is distinct from old.roles then
    -- Allow direct SQL from Supabase dashboard (no JWT session)
    if auth.uid () is null then
      return new;
    end if;

    if not exists (
      select 1
      from public.profiles p
      where p.id = auth.uid ()
        and 'admin' = any (p.roles)
    ) then
      raise exception 'Only admins can change roles';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_profile_roles
  before update on public.profiles
  for each row
  execute function public.protect_profile_roles ();

-- Callable by admins from the app (future); manual elevation uses SQL editor
create or replace function public.set_user_roles (target_id uuid, new_roles text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid ()
      and 'admin' = any (roles)
  ) then
    raise exception 'Only admins can change roles';
  end if;

  if not (new_roles <@ array['renter', 'owner', 'admin']::text[]) then
    raise exception 'Invalid role value';
  end if;

  update public.profiles
  set roles = new_roles
  where id = target_id;
end;
$$;

grant execute on function public.set_user_roles (uuid, text[]) to authenticated;
