-- ROMEX V3 catalog taxonomy
-- Run this once in Supabase SQL Editor after the original ROMEX migration.

alter table public.products
  add column if not exists collection text not null default 'gold'
    check (collection in ('gold', 'rose', 'silver'));

alter table public.products
  add column if not exists gender text not null default 'unisex'
    check (gender in ('men', 'women', 'unisex'));

-- Backfill the existing ROMEX catalog from its current product information.
update public.products
set collection = case
  when lower(coalesce(name, '') || ' ' || coalesce(specs ->> 'Strap', '')) like '%rose%'
    then 'rose'
  when lower(coalesce(name, '') || ' ' || coalesce(specs ->> 'Strap', '')) like '%silver%'
    then 'silver'
  else 'gold'
end;

-- Initial gender assignment for the current sample catalog.
-- These values are editable from the ROMEX Admin product editor.
update public.products
set gender = case
  when lower(coalesce(name, '') || ' ' || coalesce(specs ->> 'Strap', '')) like '%rose%'
    then 'women'
  else 'men'
end;

create index if not exists products_collection_idx
  on public.products (collection)
  where active = true;

create index if not exists products_gender_idx
  on public.products (gender)
  where active = true;
