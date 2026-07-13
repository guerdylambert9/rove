-- Re-sync vehicle status when calendar dates pass (trips only sync on insert/update/delete)

create or replace function public.sync_all_vehicle_rental_statuses ()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  for v in select id from public.vehicles
  loop
    perform public.sync_vehicle_rental_status (v.id);
  end loop;
end;
$$;

-- Fix vehicles stuck as "rented" after return date has passed
select public.sync_all_vehicle_rental_statuses ();
