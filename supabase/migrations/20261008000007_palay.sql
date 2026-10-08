-- 007 Palay: receipts, receipt items, palay inventory (KG only), palay → rice conversions
-- Palay is completely separate from rice inventory.

create table public.palay_receipts (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  receipt_date timestamptz not null default now(),
  farmer_name text not null,
  total_amount numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  payment_status public.payment_status not null default 'UNPAID',
  status public.transaction_status not null default 'COMPLETED',
  notes text,
  received_by uuid references public.profiles(id) on delete set null,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_palay_farmer check (length(trim(farmer_name)) > 0),
  constraint chk_palay_total check (total_amount >= 0),
  constraint chk_palay_paid check (amount_paid >= 0),
  constraint chk_palay_balance check (balance >= 0),
  constraint chk_palay_balance_math check (balance = total_amount - amount_paid)
);

create index idx_palay_receipts_date on public.palay_receipts (receipt_date desc);
create index idx_palay_receipts_farmer on public.palay_receipts (farmer_name);
create index idx_palay_receipts_payment_status on public.palay_receipts (payment_status);

create trigger trg_palay_receipts_updated_at before update on public.palay_receipts
  for each row execute function public.set_updated_at();

create table public.palay_receipt_items (
  id uuid primary key default gen_random_uuid(),
  palay_receipt_id uuid not null references public.palay_receipts(id) on delete restrict,
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  rice_name_snapshot text not null,
  variety text,
  quantity_kg numeric(14,3) not null,
  price_per_kg numeric(14,2) not null,
  total_amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  constraint chk_palay_items_quantity check (quantity_kg > 0),
  constraint chk_palay_items_price check (price_per_kg >= 0),
  constraint chk_palay_items_total check (total_amount >= 0)
);

create index idx_palay_items_receipt on public.palay_receipt_items (palay_receipt_id);
create index idx_palay_items_product on public.palay_receipt_items (rice_product_id);

create table public.palay_inventory_balances (
  id uuid primary key default gen_random_uuid(),
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  variety text,
  quantity_kg numeric(14,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_palay_balance_kg check (quantity_kg >= 0)
);

create unique index uq_palay_inventory_identity
  on public.palay_inventory_balances (rice_product_id, coalesce(variety, ''));

create index idx_palay_inventory_product on public.palay_inventory_balances (rice_product_id);

create trigger trg_palay_inventory_updated_at before update on public.palay_inventory_balances
  for each row execute function public.set_updated_at();

create table public.palay_conversions (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  source_palay_inventory_id uuid references public.palay_inventory_balances(id) on delete restrict,
  source_rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  source_variety text,
  palay_input_kg numeric(14,3) not null,
  destination_rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  destination_sack_size_type public.sack_size_type not null,
  destination_sack_size_kg numeric(14,3) not null,
  rice_output_sacks numeric(14,3) not null,
  rice_output_kg numeric(14,3) not null,
  yield_percentage numeric(6,2),
  loss_kg numeric(14,3) not null default 0,
  loss_reason text,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_conversion_input_kg check (palay_input_kg > 0),
  constraint chk_conversion_output_sacks check (rice_output_sacks >= 0),
  constraint chk_conversion_output_kg check (rice_output_kg >= 0),
  constraint chk_conversion_loss check (loss_kg >= 0),
  constraint chk_conversion_sack_size_kg check (destination_sack_size_kg > 0),
  -- Loss is input minus output; never produce more than the palay used
  constraint chk_conversion_math check (loss_kg = palay_input_kg - rice_output_kg),
  constraint chk_conversion_yield check (
    yield_percentage is null or (yield_percentage >= 0 and yield_percentage <= 100)
  )
);

create index idx_palay_conversions_created on public.palay_conversions (created_at desc);
create index idx_palay_conversions_source on public.palay_conversions (source_rice_product_id);
create index idx_palay_conversions_destination on public.palay_conversions (destination_rice_product_id);

create trigger trg_palay_conversions_updated_at before update on public.palay_conversions
  for each row execute function public.set_updated_at();
