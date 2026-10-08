-- 001 Extensions, enums, and shared triggers
-- Brick Eight Trading Inc. — RIMS

create extension if not exists pgcrypto with schema extensions;

-- Sack sizes: 25 KG, 50 KG, OTHER (actual weight stored in sack_size_kg)
create type public.sack_size_type as enum ('25KG', '50KG', 'OTHER');

create type public.movement_type as enum (
  'DELIVERY_RECEIVED',
  'SALE',
  'TRANSFER_TO_RESELLER',
  'REBAGGING_OUT',
  'REBAGGING_IN',
  'PALAY_CONVERSION_IN',
  'REJECT',
  'STOCK_ADJUSTMENT'
);

create type public.payment_status as enum ('PAID', 'PARTIALLY_PAID', 'UNPAID');

create type public.payment_method as enum ('CASH', 'GCASH', 'BANK_TRANSFER', 'CARD', 'CREDIT');

create type public.selling_method as enum ('PER_SACK', 'PER_KG');

create type public.credit_type as enum ('SALE', 'RESELLER_TRANSFER');

create type public.credit_status as enum ('OPEN', 'PARTIALLY_PAID', 'PAID');

create type public.rebagging_type as enum ('RICE_TO_RICE');

create type public.transaction_status as enum ('COMPLETED', 'VOIDED');

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Generic BEFORE UPDATE trigger function setting updated_at = now().';
