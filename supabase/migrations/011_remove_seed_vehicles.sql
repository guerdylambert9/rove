-- Remove demo fleet from 001_initial_schema.sql (no owner_id; not bookable).
-- Safe to re-run: only deletes known seed ids.

delete from public.trips
where vehicle_id in ('model3', 'wrangler', 'civic');

delete from public.vehicles
where id in ('model3', 'wrangler', 'civic');
