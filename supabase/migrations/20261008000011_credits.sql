-- 011 Unified credits: transaction-level outstanding balances (no customer/reseller master)

create table public.credits (
  id uuid primary key default gen_random_uuid(),
  credit_type public.credit_type not null,
  source_transaction_type text not null,
  source_transaction_id uuid not null,
  party_name text not null,
  original_amount numeric(14,2) not null,
  amount_paid numeric(14,2) not null default 0,
  balance numeric(14,2) not null,
  status public.credit_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_credits_party check (length(trim(party_name)) > 0),
  constraint chk_credits_original check (original_amount > 0),
  constraint chk_credits_paid check (amount_paid >= 0),
  constraint chk_credits_balance check (balance >= 0),
  constraint chk_credits_balance_math check (balance = original_amount - amount_paid),
  constraint chk_credits_source_type check (source_transaction_type in ('SALE', 'TRANSFER')),
  constraint uq_credits_source unique (source_transaction_type, source_transaction_id)
);

create index idx_credits_party on public.credits (party_name);
create index idx_credits_status on public.credits (status);
create index idx_credits_created on public.credits (created_at desc);

create trigger trg_credits_updated_at before update on public.credits
  for each row execute function public.set_updated_at();

create table public.credit_payments (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid not null references public.credits(id) on delete restrict,
  amount numeric(14,2) not null,
  payment_method public.payment_method not null default 'CASH',
  payment_date timestamptz not null default now(),
  confirmed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint chk_credit_payments_amount check (amount > 0)
);

create index idx_credit_payments_credit on public.credit_payments (credit_id);
create index idx_credit_payments_date on public.credit_payments (payment_date desc);
