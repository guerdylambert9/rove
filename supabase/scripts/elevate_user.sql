-- Manual role elevation for founding team members.
-- Run in Supabase → SQL Editor (runs as postgres, bypasses the roles trigger).

-- 1. Find the user
select id, email, roles
from public.profiles
where email = 'kevin@example.com';

-- 2. Grant owner + admin (keeps renter for booking flow)
update public.profiles
set roles = array['renter', 'owner', 'admin']
where email = 'kevin@example.com';

-- Repeat for each founding account, e.g.:
-- update public.profiles
-- set roles = array['renter', 'owner', 'admin']
-- where email = 'you@example.com';

-- 3. Verify
select id, email, roles
from public.profiles
where 'admin' = any (roles);
