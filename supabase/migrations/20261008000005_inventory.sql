-- 005 Inventory: balances (fast read model), movements (auditable ledger), rejected stock
-- Rice only — Palay lives in palay_inventory_balances (see 007).

create table public.inventory_balances (
  id uuid primary key default gen_random_uuid(),
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  sack_size_type public.sack_size_type not null,
  sack_size_kg numeric(14,3) not null,
  full_sacks numeric(14,3) not null default 0,
  loose_kg numeric(14,3) not null default 0,
  rejected_sacks numeric(14,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_inventory_balances unique (rice_product_id, sack_size_type, sack_size_kg),
  constraint chk_inventory_sack_size_kg check (sack_size_kg > 0),
  constraint chk_inventory_full_sacks check (full_sacks >= 0),
  constraint chk_inventory_loose_kg check (loose_kg >= 0),
  constraint chk_inventory_rejected_sacks check (rejected_sacks >= 0),
  constraint chk_inventory_sack_size_match check (
    (sack_size_type = '25KG' and sack_size_kg = 25)
    or (sack_size_type = '50KG' and sack_size_kg = 50)
    or (sack_size_type = 'OTHER')
  )
);

create index idx_inventory_balances_product on public.inventory_balances (rice_product_id);

create trigger trg_inventory_balances_updated_at before update on public.inventory_balances
  for each row execute function public.set_updated_at();

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  movement_type public.movement_type not null,
  sack_size_type public.sack_size_type not null,
  sack_size_kg numeric(14,3) not null,
  full_sacks_change numeric(14,3) not null default 0,
  loose_kg_change numeric(14,3) not null default 0,
  rejected_sacks_change numeric(14,3) not null default 0,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chk_movements_sack_size_kg check (sack_size_kg > 0),
  constraint chk_movements_has_change check (
    full_sacks_change <> 0 or loose_kg_change <> 0 or rejected_sacks_change <> 0
  ),
  constraint chk_movements_reference_type check (
    reference_type is null
    or reference_type in ('DELIVERY','SALE','TRANSFER','REBAGGING','PALAY_CONVERSION','REJECT','ADJUSTMENT')
  )
);

create index idx_inventory_movements_product on public.inventory_movements (rice_product_id, created_at desc);
create index idx_inventory_movements_reference on public.inventory_movements (reference_type, reference_id);
create index idx_inventory_movements_created_at on public.inventory_movements (created_at desc);
create index idx_inventory_movements_created_by on public.inventory_movements (created_by);

create table public.rejected_stock (
  id uuid primary key default gen_random_uuid(),
  rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  sack_size_type public.sack_size_type not null,
  sack_size_kg numeric(14,3) not null,
  quantity_sacks numeric(14,3) not null,
  reason text,
  source_transaction_type text,
  source_transaction_id uuid,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chk_rejected_quantity check (quantity_sacks > 0),
  constraint chk_rejected_sack_size_kg check (sack_size_kg > 0)
);

create index idx_rejected_stock_product on public.rejected_stock (rice_product_id, created_at desc);
create index idx_rejected_stock_source on public.rejected_stock (source_transaction_type, source_transaction_id);
