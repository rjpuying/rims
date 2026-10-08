-- 013 Transaction number generation (database-side, race-safe)
-- Format: <PREFIX>-YYYYMMDD-NNNN using Philippine business dates.

create table public.transaction_counters (
  prefix text not null,
  counter_date date not null,
  value bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (prefix, counter_date),
  constraint chk_transaction_counters_prefix check (
    prefix in ('DEL', 'PAL', 'SAL', 'REB', 'CON', 'TRF', 'PAY')
  )
);

create or replace function public.next_transaction_number(p_prefix text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_date date := (now() at time zone 'Asia/Manila')::date;
  v_value bigint;
begin
  if p_prefix not in ('DEL', 'PAL', 'SAL', 'REB', 'CON', 'TRF', 'PAY') then
    raise exception 'Invalid transaction prefix: %', p_prefix;
  end if;

  insert into public.transaction_counters (prefix, counter_date, value, updated_at)
  values (p_prefix, v_date, 1, now())
  on conflict (prefix, counter_date)
  do update set value = public.transaction_counters.value + 1, updated_at = now()
  returning value into v_value;

  return p_prefix || '-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_value::text, 4, '0');
end;
$$;

comment on function public.next_transaction_number(text) is
  'Generates the next human-readable transaction number for a prefix on the Philippine business date.';
