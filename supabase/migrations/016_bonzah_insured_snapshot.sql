-- Phase 4: insured details snapshot for Bonzah quote at booking time

alter table public.coverages
  add column if not exists insured_snapshot jsonb;

comment on column public.coverages.insured_snapshot is
  'Renter insured fields captured at booking for Bonzah quote/settle';
