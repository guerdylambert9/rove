-- Phase 1 completion: owners/admins can manage their fleet

-- Owners can read their own vehicles (including unavailable)
create policy "Owners can view own vehicles"
  on public.vehicles for select
  using (auth.uid () = owner_id);

-- Owners/admins can add vehicles they own
create policy "Owners can insert vehicles"
  on public.vehicles for insert
  with check (
    auth.uid () = owner_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid ()
        and ('owner' = any (p.roles) or 'admin' = any (p.roles))
    )
  );

-- Owners can update their own vehicles
create policy "Owners can update own vehicles"
  on public.vehicles for update
  using (auth.uid () = owner_id)
  with check (auth.uid () = owner_id);

-- Admins can manage any vehicle
create policy "Admins can manage all vehicles"
  on public.vehicles for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid ()
        and 'admin' = any (p.roles)
    )
  );
