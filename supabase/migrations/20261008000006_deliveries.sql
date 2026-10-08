-- 006 Deliveries received (replaces purchasing; no purchase orders, no supplier master)

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  delivery_date timestamptz not null default now(),
  supplier_name text not null,
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
  constraint chk_deliveries_supplier check (length(trim(supplier_name)) > 0),
  constraint chk_deliveries_total check (total_amount >= 0),
  constraint chk_deliveries_paid check (amount_paid >= 0),
  constraint chk_deliveries_balance check (balance >= 0),
  constraint chk_deliveries_balance_math check (balance = total_amount - amount_paid)
);

create index idx_deliveries_date on public.deliveries (delivery_date desc);
create index idx_deliveries_supplier on public.deliveries (supplier_name);
create index idx_deliveries_payment_status on public.deliveries (payment_status);

create trigger trg_deliveries_updated_at before update on public.deliveries
  for each row execute function public.set_updated_at();

create table public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete restrict,
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  rice_type text,
  variety text,
  quantity_sacks numeric(14,3) not null,
  sack_size_type public.sack_size_type not null,
  sack_size_kg numeric(14,3) not null,
  price_per_sack numeric(14,2) not null,
  total_amount numeric(14,2) not null,
  batch_number text,
  created_at timestamptz not null default now(),
  constraint chk_delivery_items_quantity check (quantity_sacks > 0),
  constraint chk_delivery_items_sack_size_kg check (sack_size_kg > 0),
  constraint chk_delivery_items_price check (price_per_sack >= 0),
  constraint chk_delivery_items_total check (total_amount >= 0)
);

create index idx_delivery_items_delivery on public.delivery_items (delivery_id);
create index idx_delivery_items_product on public.delivery_items (rice_product_id);

-- Immutable batch history created by every delivery
create table public.delivery_batches (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete restrict,
  delivery_item_id uuid references public.delivery_items(id) on delete restrict,
  batch_number text,
  transaction_number text not null,
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  rice_name_snapshot text not null,
  rice_type_snapshot text,
  variety_snapshot text,
  supplier_name text not null,
  quantity_sacks numeric(14,3) not null,
  sack_size_type public.sack_size_type not null,
  sack_size_kg numeric(14,3) not null,
  price_per_sack numeric(14,2) not null,
  received_date timestamptz not null,
  created_at timestamptz not null default now(),
  constraint chk_delivery_batches_quantity check (quantity_sacks > 0),
  constraint chk_delivery_batches_sack_size_kg check (sack_size_kg > 0),
  constraint chk_delivery_batches_price check (price_per_sack >= 0)
);

create index idx_delivery_batches_delivery on public.delivery_batches (delivery_id);
create index idx_delivery_batches_number on public.delivery_batches (batch_number);
create index idx_delivery_batches_product on public.delivery_batches (rice_product_id);
