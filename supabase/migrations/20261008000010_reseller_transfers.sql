-- 010 Reseller transfers: My Warehouse → Reseller (single warehouse, no warehouse table)

create table public.reseller_transfers (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  transfer_date timestamptz not null default now(),
  reseller_name text not null,
  total_amount numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  payment_status public.payment_status not null default 'UNPAID',
  status public.transaction_status not null default 'COMPLETED',
  notes text,
  confirmed_by uuid references public.profiles(id) on delete set null,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_transfers_reseller check (length(trim(reseller_name)) > 0),
  constraint chk_transfers_total check (total_amount >= 0),
  constraint chk_transfers_paid check (amount_paid >= 0),
  constraint chk_transfers_balance check (balance >= 0),
  constraint chk_transfers_balance_math check (balance = total_amount - amount_paid)
);

create index idx_transfers_date on public.reseller_transfers (transfer_date desc);
create index idx_transfers_reseller on public.reseller_transfers (reseller_name);
create index idx_transfers_payment_status on public.reseller_transfers (payment_status);

create trigger trg_reseller_transfers_updated_at before update on public.reseller_transfers
  for each row execute function public.set_updated_at();

create table public.reseller_transfer_items (
  id uuid primary key default gen_random_uuid(),
  reseller_transfer_id uuid not null references public.reseller_transfers(id) on delete restrict,
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  rice_name_snapshot text not null,
  rice_type_snapshot text,
  variety_snapshot text,
  sack_size_type public.sack_size_type not null,
  sack_size_kg numeric(14,3) not null,
  quantity_sacks numeric(14,3) not null,
  price_per_sack numeric(14,2) not null,
  line_total numeric(14,2) not null,
  created_at timestamptz not null default now(),
  constraint chk_transfer_items_quantity check (quantity_sacks > 0),
  constraint chk_transfer_items_sack_size_kg check (sack_size_kg > 0),
  constraint chk_transfer_items_price check (price_per_sack >= 0),
  constraint chk_transfer_items_line_total check (line_total >= 0)
);

create index idx_transfer_items_transfer on public.reseller_transfer_items (reseller_transfer_id);
create index idx_transfer_items_product on public.reseller_transfer_items (rice_product_id);

create table public.reseller_transfer_payments (
  id uuid primary key default gen_random_uuid(),
  reseller_transfer_id uuid not null references public.reseller_transfers(id) on delete restrict,
  payment_method public.payment_method not null,
  amount numeric(14,2) not null,
  payment_date timestamptz not null default now(),
  confirmed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint chk_transfer_payments_amount check (amount > 0)
);

create index idx_transfer_payments_transfer on public.reseller_transfer_payments (reseller_transfer_id);
create index idx_transfer_payments_date on public.reseller_transfer_payments (payment_date desc);
