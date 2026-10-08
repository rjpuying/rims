-- 008 Rebagging: RICE → RICE only (palay conversion lives in palay_conversions)

create table public.rebagging_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  rebagging_type public.rebagging_type not null default 'RICE_TO_RICE',
  status public.transaction_status not null default 'COMPLETED',
  notes text,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rebagging_transactions_created on public.rebagging_transactions (created_at desc);
create index idx_rebagging_transactions_processed_by on public.rebagging_transactions (processed_by);

create trigger trg_rebagging_transactions_updated_at before update on public.rebagging_transactions
  for each row execute function public.set_updated_at();

create table public.rebagging_items (
  id uuid primary key default gen_random_uuid(),
  rebagging_transaction_id uuid not null references public.rebagging_transactions(id) on delete restrict,
  source_rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  source_sack_size_type public.sack_size_type not null,
  source_sack_size_kg numeric(14,3) not null,
  source_sacks numeric(14,3) not null,
  source_kg numeric(14,3) not null,
  destination_rice_product_id uuid not null references public.rice_products(id) on delete restrict,
  destination_sack_size_type public.sack_size_type not null,
  destination_sack_size_kg numeric(14,3) not null,
  destination_sacks numeric(14,3) not null,
  destination_kg numeric(14,3) not null,
  -- Kilograms that do not fill a whole destination sack become loose KG
  destination_loose_kg numeric(14,3) not null default 0,
  loss_kg numeric(14,3) not null default 0,
  loss_reason text,
  created_at timestamptz not null default now(),
  constraint chk_rebag_source_sacks check (source_sacks > 0),
  constraint chk_rebag_source_kg check (source_kg > 0),
  constraint chk_rebag_source_size_kg check (source_sack_size_kg > 0),
  constraint chk_rebag_dest_size_kg check (destination_sack_size_kg > 0),
  constraint chk_rebag_dest_sacks check (destination_sacks >= 0),
  constraint chk_rebag_dest_kg check (destination_kg >= 0),
  constraint chk_rebag_dest_loose check (destination_loose_kg >= 0),
  constraint chk_rebag_loss check (loss_kg >= 0),
  -- Source KG must be conserved: output + loss never exceeds input
  constraint chk_rebag_kg_conserved check (destination_kg + loss_kg <= source_kg),
  constraint chk_rebag_dest_math check (
    destination_kg = destination_sacks * destination_sack_size_kg + destination_loose_kg
  )
);

create index idx_rebag_items_transaction on public.rebagging_items (rebagging_transaction_id);
create index idx_rebag_items_source on public.rebagging_items (source_rice_product_id);
create index idx_rebag_items_destination on public.rebagging_items (destination_rice_product_id);
