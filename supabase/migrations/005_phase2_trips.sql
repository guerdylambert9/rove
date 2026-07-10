-- Phase 2: persisted bookings — RLS for coverages insert + vehicle read on booked trips

create policy "Renters can create coverage for own trips"
  on public.coverages for insert
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_id
        and t.renter_id = auth.uid ()
    )
  );

create policy "Trip parties can view booked vehicles"
  on public.vehicles for select
  using (
    exists (
      select 1
      from public.trips t
      where t.vehicle_id = vehicles.id
        and (t.renter_id = auth.uid () or t.owner_id = auth.uid ())
    )
  );
