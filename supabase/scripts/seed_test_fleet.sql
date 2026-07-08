-- Test fleet: 6 diverse vehicles with photos (Unsplash).
-- Run in Supabase SQL Editor after migrations 001–003.
--
-- Option A: attach all cars to your owner account (replace the email):
-- Option B: leave owner_id null — cars still appear on Browse.

-- delete prior test seed ids if re-running
delete from public.vehicles
where id in (
  'test-tesla-model-3',
  'test-jeep-wrangler',
  'test-honda-civic',
  'test-ford-f150',
  'test-toyota-sienna',
  'test-bmw-330i'
);

insert into public.vehicles (
  id,
  owner_id,
  name,
  year,
  host_display_name,
  price_per_day,
  rating,
  trips_count,
  distance_mi,
  seats,
  range,
  drive,
  badge,
  gradient,
  status,
  status_label,
  photos,
  available
) values
  (
    'test-tesla-model-3',
    (select id from public.profiles where email = 'your-owner@email.com' limit 1),
    'Tesla Model 3',
    2023,
    'Kevin',
    89,
    4.9,
    42,
    3.2,
    5,
    '272 mi EPA',
    'Auto',
    '★ 4.9 · Electric',
    'linear-gradient(120deg, #134074, #3A86FF)',
    'idle',
    'Idle · open now',
    array['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80'],
    true
  ),
  (
    'test-jeep-wrangler',
    (select id from public.profiles where email = 'your-owner@email.com' limit 1),
    'Jeep Wrangler Rubicon',
    2022,
    'Kevin',
    95,
    4.8,
    28,
    5.1,
    4,
    '340 mi',
    'Auto',
    'Instant book',
    'linear-gradient(120deg, #0B2545, #5B6B7B)',
    'idle',
    'Idle · open now',
    array['https://images.unsplash.com/photo-1583267746897-2cf4150d6ecc?w=800&q=80'],
    true
  ),
  (
    'test-honda-civic',
    (select id from public.profiles where email = 'your-owner@email.com' limit 1),
    'Honda Civic Sport',
    2024,
    'Kevin',
    52,
    4.9,
    67,
    4.8,
    5,
    '400 mi',
    'Auto',
    '★ 4.9 · Great on gas',
    'linear-gradient(120deg, #1F3A4D, #5DB7AB)',
    'idle',
    'Idle · open now',
    array['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80'],
    true
  ),
  (
    'test-ford-f150',
    (select id from public.profiles where email = 'your-owner@email.com' limit 1),
    'Ford F-150 XLT',
    2023,
    'Kevin',
    78,
    4.7,
    19,
    7.4,
    5,
    '480 mi',
    'Auto',
    'Pickup · Tow ready',
    'linear-gradient(120deg, #2D1B4E, #9B5DE5)',
    'idle',
    'Idle · open now',
    array['https://images.unsplash.com/photo-1609521263047-74216a542023?w=800&q=80'],
    true
  ),
  (
    'test-toyota-sienna',
    (select id from public.profiles where email = 'your-owner@email.com' limit 1),
    'Toyota Sienna XLE',
    2023,
    'Kevin',
    72,
    4.8,
    31,
    6.2,
    7,
    '420 mi',
    'Auto',
    'Family · 7 seats',
    'linear-gradient(120deg, #1A3C34, #2EC4B6)',
    'idle',
    'Idle · open now',
    array['https://images.unsplash.com/photo-1621135802927-8f2ed840b3fe?w=800&q=80'],
    true
  ),
  (
    'test-bmw-330i',
    (select id from public.profiles where email = 'your-owner@email.com' limit 1),
    'BMW 330i',
    2022,
    'Kevin',
    98,
    4.9,
    24,
    2.9,
    5,
    '380 mi',
    'Auto',
    '★ 4.9 · Luxury',
    'linear-gradient(120deg, #0B2545, #3A86FF)',
    'idle',
    'Idle · open now',
    array['https://images.unsplash.com/photo-1555217690-8f47f0f8f705?w=800&q=80'],
    true
  );

-- verify
select id, name, year, price_per_day, seats, photos[1] as photo_url
from public.vehicles
where id like 'test-%'
order by name;
