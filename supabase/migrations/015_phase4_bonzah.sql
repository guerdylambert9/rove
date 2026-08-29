-- Phase 4 (slice 1–3): Bonzah soft-embed fields + insured profile snapshot columns

alter table public.coverages
  add column if not exists bonzah_quote_id text,
  add column if not exists bonzah_payment_id text,
  add column if not exists bonzah_policy_id text,
  add column if not exists bonzah_policy_no text,
  add column if not exists bonzah_covers jsonb not null default '{}'::jsonb,
  add column if not exists bonzah_premium numeric(10, 2),
  add column if not exists bonzah_pdf_ids jsonb not null default '{}'::jsonb,
  add column if not exists bonzah_raw jsonb,
  add column if not exists pickup_state text,
  add column if not exists verified_by uuid references public.profiles (id),
  add column if not exists verified_at timestamptz,
  add column if not exists rejection_reason text;

comment on column public.coverages.bonzah_policy_no is 'Bonzah BORD policy number after settle';
comment on column public.coverages.bonzah_covers is 'Selected covers: {cdw,rcli,sli,pai}';

alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists phone text,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists license_no text,
  add column if not exists license_state text;

comment on column public.profiles.date_of_birth is 'Insured DOB for Bonzah quote (Phase 4)';
