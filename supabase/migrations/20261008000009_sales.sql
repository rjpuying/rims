-- 009 Sales / POS

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  sale_date timestamptz not null default now(),
  customer_name text,
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  payment_status public.payment_status not null default 'UNPAID',
  payment_method public.payment_method not null default 'CASH',
  status public.transaction_status not null default 'COMPLETED',
  processed_by uuid references public.profiles(id) on delete set null,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_sales_subtotal check (subtotal >= 0),
  constraint chk_sales_discount check (discount_amount >= 0),
  constraint chk_sales_total check (total_amount >= 0),
  constraint chk_sales_paid check (amount_paid >= 0),
  constraint chk_sales_balance check (balance >= 0),
  constraint chk_sales_balance_math check (balance = total_amount - amount_paid),
  constraint chk_sales_discount_within check (discount_amount <= subtotal)
);

create index idx_sales_date on public.sales (sale_date desc);
create index idx_sales_customer on public.sales (customer_name);
create index idx_sales_payment_status on public.sales (payment_status);
create index idx_sales_processed_by on public.sales (processed_by);

create trigger trg_sales_updated_at before update on public.sales
  for each row execute function public.set_updated_at();

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  rice_name_snapshot text not null,
  rice_type_snapshot text,
  variety_snapshot text,
  selling_method public.selling_method not null,
  sack_size_type public.sack_size_type not null,
  sack_size_kg numeric(14,3) not null,
  quantity_sacks numeric(14,3) not null default 0,
  quantity_kg numeric(14,3) not null default 0,
  price_per_sack numeric(14,2) not null default 0,
  price_per_kg numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null,
  constraint chk_sale_items_sack_size_kg check (sack_size_kg > 0),
  constraint chk_sale_items_qty check (quantity_sacks >= 0 and quantity_kg >= 0),
  constraint chk_sale_items_price check (price_per_sack >= 0 and price_per_kg >= 0),
  constraint chk_sale_items_discount check (discount_amount >= 0),
  constraint chk_sale_items_line_total check (line_total >= 0),
  constraint chk_sale_items_per_sack check (
    selling_method <> 'PER_SACK' or (quantity_sacks > 0 and quantity_kg = 0 and price_per_sack > 0)
  ),
  constraint chk_sale_items_per_kg check (
    selling_method <> 'PER_KG' or (quantity_kg > 0 and quantity_sacks = 0 and price_per_kg > 0)
  )
);

create index idx_sale_items_sale on public.sale_items (sale_id);
create index idx_sale_items_product on public.sale_items (rice_product_id);

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  payment_method public.payment_method not null,
  amount numeric(14,2) not null,
  payment_date timestamptz not null default now(),
  confirmed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint chk_sale_payments_amount check (amount > 0)
);

create index idx_sale_payments_sale on public.sale_payments (sale_id);
create index idx_sale_payments_date on public.sale_payments (payment_date desc);
