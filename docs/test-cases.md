# RIMS Database Test Cases

Runnable suite covering `database_architecture.md` §74–77 (final database
tests, palay test, audit test, RLS test).

## How to run

```text
npm run test:db           # all files
npm run test:db 03        # only files whose name contains "03"
```

Runner: `scripts/run-tests.mjs`. Every file executes as
`begin; <tests/_bootstrap.sql> <file> rollback;`, so **the remote database is
never mutated**. The bootstrap creates five throwaway users (one per role) and
assertion helpers; impersonation is done by setting `request.jwt.claims` and
`set local role authenticated|anon`, so RLS and permission checks run exactly
as they would in production.

Failure = a raised `FAIL | …` assertion or any unexpected error; the runner
prints the offending message and exits non-zero.

## Coverage map

### `01_delivery_sale.sql` — §74 Tests 1–3 (16 assertions)

| Test | Spec | Checks |
| --- | --- | --- |
| T1 | Test 1 — Delivery | Receive 100 × 25 kg Princess Bea → stock 100, total ₱130,000, `PAID`, number `DEL-YYYYMMDD-NNNN`, one `DELIVERY_RECEIVED` movement |
| T2 | Test 2 — Sale | Sell 20 × 25 kg → 100 → 80 sacks, total ₱28,000, `PAID`, no credit |
| T3 | Test 3 — Insufficient | Selling 100 with 80 in stock → `INSUFFICIENT_INVENTORY`, stock unchanged, no sale row |
| AUDIT | §76 | `DELIVERY_RECEIVED`, `SALE_CREATED` entries exist |

### `02_transfer_credit.sql` — §74 Tests 4–6 (25 assertions)

| Test | Spec | Checks |
| --- | --- | --- |
| T4 | Test 4 — Transfer | 80 → 60 sacks, number `TRF-YYYYMMDD-NNNN` |
| T5 | Test 5 — Credit Transfer | Total ₱27,000, paid ₱10,000, balance ₱17,000, credit created, stock decreased |
| T6 | Test 6 — Credit Payment | Pay ₱7,000 → original 27,000 / paid 17,000 / balance 10,000; overpayment and negative payment rejected; final ₱10,000 → `PAID`; transfer row synced; two `credit_payments` |
| AUDIT | §76 | `RESELLER_TRANSFER_CREATED`, `CREDIT_PAYMENT_RECORDED` ×2 |

### `03_rebagging_palay.sql` — §74 Test 7 + §75 (28 assertions)

| Test | Spec | Checks |
| --- | --- | --- |
| T7 | Test 7 — Rebagging | 10 × 50 kg Princess Bea → 20 × 25 kg Hasmin Blue (500 KG both sides), loss 0; over-rebagging and identical source/destination rejected |
| PALAY | §75 — Palay | Receive 1,000 KG → convert to 28 × 25 kg: palay 1,000 → 0, yield 70 %, loss 300 KG, number `CON-…`; output > input and empty-palay conversions rejected |
| REJECT | reject flow | 20 → 15 available, 5 rejected; over-rejecting rejected |
| AUDIT | §76 | `PALAY_RECEIVED`, `RICE_REBAGGING_PROCESSED`, `PALAY_CONVERSION_PROCESSED`, `INVENTORY_REJECTED` |

### `04_pos_flows.sql` — POS rules + §76 (27 assertions)

| Test | Checks |
| --- | --- |
| PER_KG | Sell 10 KG from empty loose → opens 1 sack, 15 KG loose; sell 20 KG → opens 1 more, 20 KG loose; both sales recorded loose movements; 1,000 KG sale rejected; zero quantity rejected |
| CREDIT | Credit sale requires customer; total/balance/`PARTIALLY_PAID` correct; credit tracks paid/balance; paying above total rejected |
| ADJUST | Physical count 5 → 6 → 4 with `STOCK_ADJUSTMENT` movements; missing reason, no-op and negative counts rejected |
| AUDIT | `DELIVERY_RECEIVED`, `SALE_CREATED` ×3, `INVENTORY_ADJUSTED` ×2 |

### `05_rls_permissions.sql` — §77 RLS (33 assertions)

| Actor | Checks |
| --- | --- |
| SECRETARY | Product catalog + sale entry work; product master, inventory and movements unreadable (0 rows); sales/deliveries readable; audit log unreadable; only own profile visible; direct UPDATE silently affects 0 rows; direct INSERT blocked by RLS; `adjust_inventory` → `FORBIDDEN`; settings/profile writes denied; permission flags correct |
| OTHER_STAFF | `process_sale` and catalog → `FORBIDDEN`; sees no sales/products/inventory; no `sales.create` |
| ANONYMOUS | Sees nothing (0 rows on sales, products, inventory, profiles); RPCs → `NOT_AUTHENTICATED` |
| SUPER_ADMIN | Self-deactivation blocked by guard trigger; can change another user's role; reads audit entries; sees all profiles |

## Result

```text
5/5 test file(s) passed — 129 assertions
```
