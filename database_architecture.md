# SUPABASE DATABASE ARCHITECTURE & SCHEMA

## Brick Eight Trading Inc. — Rice POS & Inventory Management System

Design and implement the complete **Supabase PostgreSQL database architecture and schema** for the Brick Eight Trading Inc. Rice POS + Inventory Management System.

This task is **DATABASE ONLY**.

Do not build the Next.js UI yet.

The database must be designed so the Next.js + TypeScript + Tailwind + Vercel application can safely and reliably use it later.

The database must prioritize:

* Data integrity
* Inventory accuracy
* Transaction safety
* Auditability
* Role-based access
* Simplicity
* Scalability
* Easy reporting
* Atomic inventory operations
* Clear separation between Rice and Palay

---

# 1. TECHNOLOGY

Use:

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* PostgreSQL Functions / RPC
* Row Level Security (RLS)

The database must be compatible with:

```text
Next.js
TypeScript
Supabase JS
Vercel
```

Use UUID primary keys where appropriate.

Use PostgreSQL foreign keys, constraints, indexes, enums/domains where appropriate.

---

# 2. BUSINESS MODEL

Brick Eight Trading Inc. has:

```text
ONE warehouse
```

There is no multi-warehouse functionality.

The business handles:

```text
Rice
Palay
Rice deliveries
Palay purchases
Rice sales
Reseller/dealer transfers
Rice-to-rice rebagging
Palay-to-rice conversion
Credit transactions
Credit payments
Rejected stock
Inventory movements
Reports
Users and roles
Audit logs
```

---

# 3. CRITICAL BUSINESS RULES

These rules must be enforced by the database wherever possible.

## Rule 1 — One warehouse

There is exactly one operational warehouse.

Do NOT create a `warehouses` table.

Do NOT create warehouse-to-warehouse transfers.

The warehouse is conceptually:

```text
Brick Eight Trading Inc. Warehouse
```

---

## Rule 2 — No supplier master

Do NOT create:

```text
suppliers
```

Supplier names are stored directly on delivery transactions.

---

## Rule 3 — No customer master

Do NOT create:

```text
customers
```

Customer names are stored directly on sales/credit transactions.

---

## Rule 4 — No reseller master

Do NOT create:

```text
resellers
dealers
```

Reseller/dealer names are stored directly on reseller transfer transactions and related credits.

---

## Rule 5 — No farmer master

Do NOT create:

```text
farmers
```

Farmer names are stored directly on Palay Received transactions.

---

## Rule 6 — Prices are transaction-specific

Never store a permanent selling price for rice.

The following prices must be recorded per transaction:

```text
Rice delivery price per sack
Rice sale price
Reseller transfer price per sack
Palay purchase price per KG
```

Historical prices must never change when a new transaction uses a different price.

---

## Rule 7 — Rice and Palay are separate

Rice inventory and Palay inventory are completely separate concepts.

Rice:

```text
Sacks
Loose KG
Rejected sacks
```

Palay:

```text
KG
```

Never combine them into one generic inventory quantity.

---

# 4. DATABASE SCHEMA OVERVIEW

Create the following logical areas:

```text
AUTH / USERS
├── profiles
├── roles
├── permissions
└── role_permissions

RICE
├── rice_products
└── rice_product_images

DELIVERY
├── deliveries
├── delivery_items
└── delivery_batches

PALAY
├── palay_receipts
├── palay_receipt_items
├── palay_inventory_balances
└── palay_conversions

INVENTORY
├── inventory_balances
├── inventory_movements
└── rejected_stock

REBAGGING
├── rebagging_transactions
└── rebagging_items

SALES
├── sales
├── sale_items
└── sale_payments

RESELLER TRANSFERS
├── reseller_transfers
├── reseller_transfer_items
└── reseller_transfer_payments

CREDITS
├── credits
└── credit_payments

SYSTEM
├── audit_logs
└── system_settings
```

You may adjust the exact implementation if a better normalized design exists, but preserve the business concepts above.

---

# 5. UUIDS

Use PostgreSQL UUIDs for primary keys.

Use:

```sql
gen_random_uuid()
```

where appropriate.

Do not use sequential integers as primary keys for business entities.

---

# 6. TIMESTAMPS

Every transactional table should have:

```text
created_at
updated_at
```

Use:

```sql
timestamptz
```

with UTC storage.

The application can display Philippine time.

Prefer:

```sql
now()
```

as the database default.

---

# 7. USERS / PROFILES

Supabase Auth owns:

```text
auth.users
```

Create:

```text
profiles
```

Fields:

```text
id UUID PRIMARY KEY
auth_user_id UUID UNIQUE REFERENCES auth.users(id)
full_name TEXT NOT NULL
role_id UUID
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Do not duplicate passwords or authentication credentials.

Supabase Auth handles authentication.

---

# 8. ROLES

Create:

```text
roles
```

Required roles:

```text
SUPER_ADMIN
OWNER
MANAGER
SECRETARY
OTHER_STAFF
```

Suggested fields:

```text
id UUID PRIMARY KEY
name TEXT UNIQUE
description TEXT
created_at
updated_at
```

---

# 9. PERMISSIONS

Create:

```text
permissions
role_permissions
```

Example permission codes:

```text
dashboard.view

sales.view
sales.create
sales.update
sales.cancel

inventory.view
inventory.adjust
inventory.reject

delivery.view
delivery.create
delivery.update

palay.view
palay.create
palay.update

rebagging.view
rebagging.create

transfer.view
transfer.create
transfer.update

credits.view
credits.create
credits.payment

reports.view

users.view
users.create
users.update
users.deactivate

settings.view
settings.update
```

Keep permissions simple.

Do not create hundreds of unnecessary permissions.

---

# 10. RICE PRODUCTS

Create:

```text
rice_products
```

Fields:

```text
id UUID PRIMARY KEY
rice_name TEXT NOT NULL
rice_type TEXT
variety TEXT
low_stock_threshold NUMERIC NOT NULL DEFAULT 0
is_active BOOLEAN NOT NULL DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Add an appropriate uniqueness rule.

The same rice product should not accidentally be duplicated.

However, allow legitimate products that differ by rice type/variety.

Use a sensible uniqueness strategy such as:

```text
rice_name + rice_type + variety
```

where appropriate.

---

# 11. RICE PRODUCT IMAGES

Create:

```text
rice_product_images
```

Fields:

```text
id UUID PRIMARY KEY
rice_product_id UUID REFERENCES rice_products(id)
storage_path TEXT NOT NULL
public_url TEXT
is_primary BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

Supabase Storage bucket:

```text
rice-images
```

Do not store image binary data directly in PostgreSQL.

Store the Storage path/reference.

Only one primary image should normally exist per rice product.

---

# 12. SACK SIZE

Use a controlled representation for sack sizes.

Supported values:

```text
25 KG
50 KG
OTHER
```

Do not hardcode these values throughout the application.

Prefer a PostgreSQL enum or controlled lookup/domain.

For `OTHER`, store the actual KG weight separately.

For example:

```text
sack_size_type = OTHER
sack_size_kg = 40
```

This prevents ambiguity.

For 25kg:

```text
sack_size_type = 25KG
sack_size_kg = 25
```

For 50kg:

```text
sack_size_type = 50KG
sack_size_kg = 50
```

---

# 13. INVENTORY BALANCES

Create an efficient current-balance table:

```text
inventory_balances
```

This represents current available rice inventory.

Recommended fields:

```text
id UUID PRIMARY KEY

rice_product_id UUID NOT NULL
sack_size_type
sack_size_kg NUMERIC NOT NULL

full_sacks NUMERIC NOT NULL DEFAULT 0
loose_kg NUMERIC NOT NULL DEFAULT 0
rejected_sacks NUMERIC NOT NULL DEFAULT 0

created_at
updated_at
```

Create a unique constraint for:

```text
rice_product_id + sack_size_type + sack_size_kg
```

Important:

* `full_sacks` must never be negative.
* `loose_kg` must never be negative.
* `rejected_sacks` must never be negative.

---

# 14. IMPORTANT INVENTORY DESIGN

Inventory should use:

```text
inventory_movements
```

as the auditable source of stock changes.

`inventory_balances` is the fast current-state representation.

The two must remain synchronized through controlled database functions.

Do not allow ordinary clients to directly modify inventory balances.

---

# 15. INVENTORY MOVEMENTS

Create:

```text
inventory_movements
```

Fields should include:

```text
id UUID PRIMARY KEY

rice_product_id UUID

movement_type

sack_size_type
sack_size_kg

full_sacks_change NUMERIC DEFAULT 0
loose_kg_change NUMERIC DEFAULT 0
rejected_sacks_change NUMERIC DEFAULT 0

reference_type TEXT
reference_id UUID

notes TEXT

created_by UUID
created_at TIMESTAMPTZ
```

Movement types:

```text
DELIVERY_RECEIVED
SALE
TRANSFER_TO_RESELLER
REBAGGING_OUT
REBAGGING_IN
PALAY_CONVERSION_IN
REJECT
STOCK_ADJUSTMENT
```

Every inventory movement must reference its originating transaction where possible.

---

# 16. INVENTORY MOVEMENT RULE

Examples:

Delivery:

```text
+100 full sacks
```

Sale:

```text
-20 full sacks
```

Transfer:

```text
-20 full sacks
```

Rebagging out:

```text
-10 full sacks
```

Rebagging in:

```text
+20 full sacks
```

Reject:

```text
-3 available sacks
+3 rejected sacks
```

Palay → Rice:

```text
+rice inventory
```

---

# 17. INVENTORY TRANSACTION SAFETY

Inventory-changing operations MUST be atomic.

Never perform this from the client:

```text
UPDATE inventory_balances
SET full_sacks = full_sacks - 20
```

without a protected transaction.

Instead:

```text
RPC
↓
Validate
↓
Lock/check inventory
↓
Create business transaction
↓
Create inventory movement
↓
Update inventory balance
↓
Create audit log
↓
Commit
```

If anything fails:

```text
ROLLBACK
```

---

# 18. DELIVERY TABLE

Create:

```text
deliveries
```

Header-level fields:

```text
id UUID PRIMARY KEY
transaction_number TEXT UNIQUE
delivery_date DATE/TIMESTAMPTZ
supplier_name TEXT NOT NULL
amount_paid NUMERIC DEFAULT 0
payment_status
notes TEXT
received_by UUID
created_at
updated_at
```

Do not create a supplier foreign key.

Supplier name is historical transaction data.

---

# 19. DELIVERY ITEMS

Create:

```text
delivery_items
```

Fields:

```text
id UUID PRIMARY KEY
delivery_id UUID
rice_product_id UUID
rice_type TEXT
variety TEXT

quantity_sacks NUMERIC NOT NULL

sack_size_type
sack_size_kg NUMERIC NOT NULL

price_per_sack NUMERIC NOT NULL
total_amount NUMERIC NOT NULL

batch_number TEXT
created_at
```

Do not depend on current rice product information for historical reporting.

If rice type/variety is important historically, preserve the transaction values.

---

# 20. DELIVERY BALANCE

Calculate:

```text
delivery total
delivery amount paid
delivery balance
```

Prefer storing the authoritative transaction amounts where needed for historical integrity.

Do not allow:

```text
balance < 0
```

unless an explicit overpayment model is intentionally implemented.

---

# 21. DELIVERY BATCHES

Create:

```text
delivery_batches
```

or combine this concept into delivery_items if that is cleaner.

The system must preserve:

```text
Batch ID
Delivery
Rice
Supplier
Quantity
Sack Size
Price
Date
```

The batch must remain traceable.

---

# 22. PALAY RECEIPTS

Create:

```text
palay_receipts
```

Fields:

```text
id UUID PRIMARY KEY
transaction_number TEXT UNIQUE
receipt_date
farmer_name TEXT NOT NULL
amount_paid NUMERIC DEFAULT 0
payment_status
received_by UUID
notes TEXT
created_at
updated_at
```

No farmer foreign key.

---

# 23. PALAY RECEIPT ITEMS

Create:

```text
palay_receipt_items
```

Fields:

```text
id UUID PRIMARY KEY
palay_receipt_id UUID
rice_product_id UUID
rice_name_snapshot TEXT
variety TEXT
quantity_kg NUMERIC NOT NULL
price_per_kg NUMERIC NOT NULL
total_amount NUMERIC NOT NULL
created_at
```

Palay is measured in KG.

---

# 24. PALAY INVENTORY

Create:

```text
palay_inventory_balances
```

Fields:

```text
id UUID PRIMARY KEY
rice_product_id UUID
rice_name_snapshot TEXT
variety TEXT
quantity_kg NUMERIC NOT NULL DEFAULT 0
created_at
updated_at
```

Palay inventory must be separate from rice inventory.

Never store palay in `inventory_balances`.

---

# 25. PALAY INVENTORY UNIQUENESS

Use a sensible uniqueness key such as:

```text
rice_product_id + variety
```

if appropriate.

The system must prevent duplicate balance rows for the same Palay inventory dimension.

---

# 26. PALAY CONVERSIONS

Create:

```text
palay_conversions
```

Fields:

```text
id UUID PRIMARY KEY
transaction_number TEXT UNIQUE

source_palay_inventory_id UUID

palay_input_kg NUMERIC NOT NULL

destination_rice_product_id UUID

destination_sack_size_type
destination_sack_size_kg NUMERIC NOT NULL

rice_output_sacks NUMERIC NOT NULL
rice_output_kg NUMERIC NOT NULL

yield_percentage NUMERIC
loss_kg NUMERIC DEFAULT 0

loss_reason TEXT

processed_by UUID
created_at
updated_at
```

Formula:

```text
yield_percentage =
rice_output_kg / palay_input_kg × 100
```

Validate:

```text
palay_input_kg > 0
rice_output_kg >= 0
loss_kg >= 0
```

---

# 27. PALAY CONVERSION INVENTORY EFFECT

A Palay conversion must atomically:

```text
Palay inventory
- input KG

Rice inventory
+ output KG / sacks
```

Create the appropriate inventory movement(s).

Do not allow the Palay balance to become negative.

---

# 28. REBAGGING TRANSACTIONS

Create:

```text
rebagging_transactions
```

Fields:

```text
id UUID PRIMARY KEY
transaction_number TEXT UNIQUE

rebagging_type

processed_by UUID
notes TEXT

created_at
updated_at
```

Allowed types:

```text
RICE_TO_RICE
```

Palay conversion should use:

```text
palay_conversions
```

rather than pretending Palay is a rice rebagging transaction.

This keeps the database model clear.

---

# 29. REBAGGING ITEMS

Create:

```text
rebagging_items
```

or use explicit source/destination fields in the transaction.

The database must record:

```text
source rice
source sack size
source sack quantity
source KG

destination rice
destination sack size
destination sack quantity
destination KG

loss KG
```

Example:

```text
Source:
Princess Bea
10 × 50kg
500 KG

Destination:
Hasmin
20 × 25kg
500 KG
```

---

# 30. RICE → RICE REBAGGING RULE

The database must calculate conversion based on KG.

Do not assume:

```text
10 source sacks = 10 destination sacks
```

Instead:

```text
source_sacks × source_sack_size_kg
=
source_kg

source_kg ÷ destination_sack_size_kg
=
destination_sacks
```

Handle remaining KG if the conversion does not divide evenly.

Do not silently lose kilograms.

---

# 31. SALES

Create:

```text
sales
```

Fields:

```text
id UUID PRIMARY KEY
transaction_number TEXT UNIQUE
sale_date TIMESTAMPTZ

customer_name TEXT

subtotal NUMERIC
discount_amount NUMERIC DEFAULT 0
total_amount NUMERIC

payment_status
payment_method

amount_paid NUMERIC DEFAULT 0
balance NUMERIC DEFAULT 0

processed_by UUID

created_at
updated_at
```

No customer foreign key.

Customer name is transaction data.

---

# 32. SALE ITEMS

Create:

```text
sale_items
```

Fields:

```text
id UUID PRIMARY KEY
sale_id UUID
rice_product_id UUID

rice_name_snapshot TEXT
rice_type_snapshot TEXT
variety_snapshot TEXT

selling_method

sack_size_type
sack_size_kg

quantity_sacks
quantity_kg

price_per_sack
price_per_kg

discount_amount
line_total
```

Selling methods:

```text
PER_SACK
PER_KG
```

---

# 33. SALES INVENTORY RULES

For `PER_SACK`:

Decrease full sacks.

For `PER_KG`:

Use available loose KG and/or controlled opening of a full sack.

The database must not allow ambiguous inventory deduction.

Define clear rules for converting a full sack into loose KG when required.

Example:

```text
25 KG sack
↓
opened
↓
25 KG loose
↓
10 KG sold
↓
15 KG loose
```

Do not silently create or destroy KG.

---

# 34. SALE PAYMENTS

Create:

```text
sale_payments
```

Fields:

```text
id UUID PRIMARY KEY
sale_id UUID
payment_method
amount
payment_date
confirmed_by UUID
notes
created_at
```

Payment methods:

```text
CASH
GCASH
BANK_TRANSFER
CARD
CREDIT
```

Allow multiple payments only if the implementation requires it.

Otherwise keep the payment model simple.

---

# 35. RESELLER TRANSFERS

Create:

```text
reseller_transfers
```

Fields:

```text
id UUID PRIMARY KEY
transaction_number TEXT UNIQUE
transfer_date TIMESTAMPTZ

reseller_name TEXT NOT NULL

total_amount NUMERIC
amount_paid NUMERIC DEFAULT 0
balance NUMERIC DEFAULT 0

payment_status

confirmed_by UUID

notes TEXT

created_at
updated_at
```

No reseller foreign key.

---

# 36. RESELLER TRANSFER ITEMS

Create:

```text
reseller_transfer_items
```

Fields:

```text
id UUID PRIMARY KEY
reseller_transfer_id UUID

rice_product_id UUID

rice_name_snapshot TEXT
rice_type_snapshot TEXT
variety_snapshot TEXT

sack_size_type
sack_size_kg

quantity_sacks

price_per_sack
line_total
```

A transfer decreases available rice inventory.

---

# 37. RESELLER TRANSFER PAYMENTS

Create:

```text
reseller_transfer_payments
```

Fields:

```text
id UUID PRIMARY KEY
reseller_transfer_id UUID
payment_method
amount
payment_date
confirmed_by UUID
notes
created_at
```

A credit transfer can therefore have later payments.

---

# 38. UNIFIED CREDITS

Create:

```text
credits
```

This is the transaction-level outstanding balance record.

Fields:

```text
id UUID PRIMARY KEY

credit_type

source_transaction_type
source_transaction_id UUID

party_name TEXT NOT NULL

original_amount NUMERIC NOT NULL
amount_paid NUMERIC NOT NULL DEFAULT 0
balance NUMERIC NOT NULL

status

created_at
updated_at
```

Credit types may include:

```text
SALE
RESELLER_TRANSFER
```

Do not create customer/reseller master tables.

---

# 39. CREDIT PAYMENTS

Create:

```text
credit_payments
```

Fields:

```text
id UUID PRIMARY KEY
credit_id UUID
amount NUMERIC NOT NULL
payment_method
payment_date
confirmed_by UUID
notes
created_at
```

When payment is recorded:

```text
credit.amount_paid += payment
credit.balance -= payment
```

This must be atomic.

Do not allow:

```text
balance < 0
```

---

# 40. CREDIT STATUS

Possible statuses:

```text
OPEN
PARTIALLY_PAID
PAID
```

Automatically derive/update status based on:

```text
original_amount
amount_paid
balance
```

---

# 41. REJECTED STOCK

Create:

```text
rejected_stock
```

Fields:

```text
id UUID PRIMARY KEY

rice_product_id UUID
sack_size_type
sack_size_kg

quantity_sacks NUMERIC NOT NULL

reason TEXT

source_transaction_type
source_transaction_id UUID

processed_by UUID
created_at
```

Rejecting stock must:

```text
available stock -
rejected stock +
```

It must not remain sellable.

---

# 42. SYSTEM SETTINGS

Create:

```text
system_settings
```

Possible fields:

```text
id UUID PRIMARY KEY
setting_key TEXT UNIQUE
setting_value JSONB
updated_by UUID
updated_at
```

Keep settings minimal.

Examples:

```text
company_name
company_logo
currency
default_low_stock_threshold
sack_size_options
```

---

# 43. AUDIT LOGS

Create:

```text
audit_logs
```

Fields:

```text
id UUID PRIMARY KEY
user_id UUID
action TEXT
entity_type TEXT
entity_id UUID
old_data JSONB
new_data JSONB
metadata JSONB
created_at TIMESTAMPTZ
```

Track important actions.

Examples:

```text
SALE_CREATED
DELIVERY_RECEIVED
PALAY_RECEIVED
RICE_REBAGGING_PROCESSED
PALAY_CONVERSION_PROCESSED
RESELLER_TRANSFER_CREATED
CREDIT_PAYMENT_RECORDED
INVENTORY_REJECTED
INVENTORY_ADJUSTED
USER_ROLE_CHANGED
SETTINGS_UPDATED
```

Audit logs should generally be append-only.

Do not allow ordinary users to delete audit records.

---

# 44. TRANSACTION NUMBER GENERATION

Create a reliable mechanism for unique transaction numbers.

Prefixes:

```text
DEL
PAL
SAL
REB
CON
TRF
PAY
```

Examples:

```text
DEL-20261007-0001
PAL-20261007-0001
SAL-20261007-0001
REB-20261007-0001
CON-20261007-0001
TRF-20261007-0001
PAY-20261007-0001
```

Transaction numbers must be unique.

Do not rely solely on frontend-generated numbers.

Generate them safely in PostgreSQL.

---

# 45. DATABASE CONSTRAINTS

Implement database-level constraints wherever practical.

Examples:

```text
quantity > 0
price >= 0
amount_paid >= 0
balance >= 0
sack_size_kg > 0
palay_input_kg > 0
rice_output_kg >= 0
```

Prevent invalid records even if the frontend is bypassed.

---

# 46. FOREIGN KEY BEHAVIOR

Use explicit foreign-key behavior.

For historical transaction records, avoid cascading deletes that could destroy business history.

Prefer:

```text
ON DELETE RESTRICT
```

or appropriate protection.

Do not allow deleting a rice product that is referenced by historical transactions.

Use:

```text
is_active
```

to deactivate products instead.

---

# 47. INDEXING

Create indexes for common queries.

At minimum consider:

```text
profiles.auth_user_id

inventory_balances.rice_product_id

inventory_movements.rice_product_id
inventory_movements.created_at
inventory_movements.reference_id

deliveries.delivery_date
deliveries.supplier_name
deliveries.payment_status

delivery_items.rice_product_id

palay_receipts.receipt_date
palay_receipts.farmer_name

palay_inventory_balances.rice_product_id

palay_conversions.created_at

sales.sale_date
sales.customer_name
sales.payment_status

sale_items.rice_product_id

reseller_transfers.transfer_date
reseller_transfers.reseller_name
reseller_transfers.payment_status

credits.party_name
credits.status
credits.source_transaction_id

audit_logs.user_id
audit_logs.entity_type
audit_logs.entity_id
audit_logs.created_at
```

Do not create indexes blindly on every column.

---

# 48. RLS

Enable RLS on all application tables.

At minimum:

```text
profiles
roles
permissions
role_permissions
rice_products
rice_product_images
deliveries
delivery_items
delivery_batches
palay_receipts
palay_receipt_items
palay_inventory_balances
palay_conversions
inventory_balances
inventory_movements
rejected_stock
rebagging_transactions
rebagging_items
sales
sale_items
sale_payments
reseller_transfers
reseller_transfer_items
reseller_transfer_payments
credits
credit_payments
audit_logs
system_settings
```

---

# 49. RLS DESIGN

Create helper functions such as:

```text
get_current_user_profile()
get_current_user_role()
has_permission(permission_code)
```

Avoid duplicating complicated role logic in every policy.

Policies should be understandable.

Example concept:

```text
User authenticated
+
User has permission
=
Allowed
```

---

# 50. RLS FOR INVENTORY

Users should generally be able to read inventory if their role permits.

However:

Do NOT allow arbitrary direct client updates to:

```text
inventory_balances
inventory_movements
```

Inventory mutation must happen through controlled PostgreSQL functions.

---

# 51. RPC FUNCTIONS

Create secure database functions:

```text
receive_delivery()
receive_palay()
process_sale()
process_rice_rebagging()
process_palay_to_rice()
process_reseller_transfer()
record_reject()
record_credit_payment()
```

Each function must:

1. Verify authenticated user.
2. Verify permission.
3. Validate input.
4. Lock/check inventory where required.
5. Create transaction records.
6. Create inventory movement.
7. Update balance.
8. Create credit when necessary.
9. Create audit log.
10. Return useful transaction information.

---

# 52. PROCESS SALE RPC

`process_sale()` must:

```text
Validate user permission
↓
Validate sale data
↓
Validate inventory
↓
Calculate totals
↓
Create sale
↓
Create sale items
↓
Create payments
↓
Create inventory movements
↓
Update inventory balances
↓
Create credit if payment is incomplete
↓
Create audit log
↓
Return transaction number
```

Must be atomic.

---

# 53. PROCESS DELIVERY RPC

`receive_delivery()` must:

```text
Validate permission
↓
Validate delivery
↓
Calculate totals
↓
Create delivery
↓
Create delivery items
↓
Create batch
↓
Create inventory movement
↓
Update inventory balance
↓
Create audit log
↓
Return delivery number
```

---

# 54. PROCESS PALAY RPC

`receive_palay()` must:

```text
Validate permission
↓
Validate KG
↓
Calculate total
↓
Create Palay receipt
↓
Create Palay receipt item
↓
Increase Palay inventory
↓
Create audit log
↓
Return transaction number
```

Do NOT increase rice inventory.

---

# 55. PROCESS RICE REBAGGING RPC

`process_rice_rebagging()` must:

```text
Validate permission
↓
Validate source inventory
↓
Calculate source KG
↓
Calculate destination sacks/KG
↓
Lock/check source inventory
↓
Decrease source inventory
↓
Increase destination inventory
↓
Create rebagging transaction
↓
Create rebagging items
↓
Create inventory movements
↓
Create audit log
↓
Commit
```

---

# 56. PROCESS PALAY → RICE RPC

`process_palay_to_rice()` must:

```text
Validate permission
↓
Validate Palay inventory
↓
Validate Palay KG
↓
Calculate rice output
↓
Calculate yield
↓
Calculate loss
↓
Decrease Palay inventory
↓
Increase Rice inventory
↓
Create conversion record
↓
Create inventory movements
↓
Create audit log
↓
Commit
```

---

# 57. PROCESS RESELLER TRANSFER RPC

`process_reseller_transfer()` must:

```text
Validate permission
↓
Validate inventory
↓
Calculate total
↓
Create transfer
↓
Create transfer items
↓
Create payment if applicable
↓
Decrease rice inventory
↓
Create inventory movement
↓
Create credit if credit sale
↓
Create audit log
↓
Commit
```

---

# 58. CREDIT PAYMENT RPC

`record_credit_payment()` must:

```text
Validate permission
↓
Lock credit
↓
Validate payment <= balance
↓
Create payment
↓
Update paid amount
↓
Update balance
↓
Update status
↓
Create audit log
↓
Commit
```

Prevent race conditions where two users attempt to pay the same credit simultaneously.

---

# 59. INVENTORY CONCURRENCY

This is very important.

Two users may potentially sell or transfer the same inventory at nearly the same time.

Use PostgreSQL transactions and appropriate row locking such as:

```sql
SELECT ... FOR UPDATE
```

when modifying current inventory balances.

Never rely on:

```text
Frontend says 20 available
```

as the final validation.

The database must re-check the real inventory inside the transaction.

---

# 60. REPORTING VIEWS

Create database views where useful to simplify Next.js reporting.

Potential views:

```text
v_current_rice_inventory
v_rice_inventory_summary
v_inventory_movements
v_sales_summary
v_delivery_summary
v_palay_inventory
v_credit_balances
v_reseller_transfer_summary
v_rebagging_history
v_pal... 
```

Do not create unnecessary views.

Views should make reporting easier without duplicating data.

---

# 61. DASHBOARD DATA

Provide efficient database views/functions for:

```text
Today's sales
Today's transactions
Credit sales
Current inventory
Low stock
Out of stock
Outstanding credits
Unpaid deliveries
Recent transactions
```

Avoid making the dashboard perform dozens of expensive queries.

---

# 62. SNAPSHOT DATA

For historical accuracy, transaction items should preserve important snapshots.

For example:

```text
rice_name_snapshot
rice_type_snapshot
variety_snapshot
```

Historical transaction reports should remain meaningful even if the current rice product name/type/variety changes later.

---

# 63. DELETIONS

Do not casually delete business transactions.

Prefer:

```text
status
voided_at
voided_by
void_reason
```

where cancellation is required.

If transaction cancellation is implemented, it must also correctly reverse inventory through a controlled database transaction.

Never simply delete a completed sale that already changed inventory.

---

# 64. SOFT DELETION

For master/configuration data such as:

```text
rice_products
profiles
```

prefer:

```text
is_active
```

instead of deleting records referenced by history.

---

# 65. MONEY TYPES

Use:

```text
NUMERIC(14,2)
```

or an appropriate PostgreSQL numeric type for monetary values.

Never use floating-point types for money.

Examples:

```text
price
total
discount
amount_paid
balance
```

must use numeric/decimal types.

---

# 66. QUANTITY TYPES

Use appropriate numeric precision.

For sacks:

```text
NUMERIC
```

For KG:

```text
NUMERIC(14,3)
```

or suitable precision.

This allows accurate KG calculations.

Do not use floating-point types for inventory quantities if avoidable.

---

# 67. PAYMENT STATUS

Use controlled values:

```text
PAID
PARTIALLY_PAID
UNPAID
```

For credits, use:

```text
OPEN
PARTIALLY_PAID
PAID
```

Do not allow arbitrary status strings.

---

# 68. DATE / TIME

Use:

```text
TIMESTAMPTZ
```

for transaction timestamps.

Use `DATE` only where the exact time is not required.

The business operates in the Philippines, but the database should store timestamps consistently.

---

# 69. STORAGE

Create the Supabase Storage bucket:

```text
rice-images
```

Storage policies must prevent unauthorized users from deleting or modifying images.

Users with appropriate permissions should be able to upload/update product images.

---

# 70. MIGRATIONS

All database architecture must be delivered as Supabase migration files.

Example:

```text
supabase/
└── migrations/
    ├── 001_extensions.sql
    ├── 002_roles_permissions.sql
    ├── 003_profiles.sql
    ├── 004_rice_products.sql
    ├── 005_inventory.sql
    ├── 006_deliveries.sql
    ├── 007_palay.sql
    ├── 008_rebagging.sql
    ├── 009_sales.sql
    ├── 010_reseller_transfers.sql
    ├── 011_credits.sql
    ├── 012_audit_logs.sql
    ├── 013_rls.sql
    ├── 014_functions.sql
    └── 015_views.sql
```

The exact number of migrations may differ.

Keep migrations logical and ordered.

---

# 71. SEED DATA

Create development seed data for:

```text
Roles
Permissions
Example rice products
Example system settings
```

Use clearly fake development data.

Do NOT insert real business transactions.

Example rice products:

```text
Princess Bea
Hasmin Blue
Dinorado
```

The application should be usable for development immediately after running migrations and seed.

---

# 72. DATABASE DOCUMENTATION

Create a database documentation file:

```text
docs/database-architecture.md
```

Document:

* Entity relationships
* Tables
* Columns
* Foreign keys
* Indexes
* RLS
* RPC functions
* Inventory logic
* Credit logic
* Palay conversion logic
* Rebagging logic
* Transaction flow

---

# 73. ERD

Generate an ERD or Mermaid ER diagram.

It must clearly show:

```text
profiles
roles
permissions

rice_products

deliveries
delivery_items

palay_receipts
palay_receipt_items
palay_inventory_balances
palay_conversions

inventory_balances
inventory_movements

rebagging_transactions
rebagging_items

sales
sale_items
sale_payments

reseller_transfers
reseller_transfer_items
reseller_transfer_payments

credits
credit_payments

audit_logs
```

The ERD must make the separation between:

```text
PALAY
```

and:

```text
RICE
```

very clear.

---

# 74. FINAL DATABASE TESTS

Before considering the database complete, test the following.

## Test 1 — Delivery

```text
Receive:
100 × 25kg Princess Bea
```

Expected:

```text
Princess Bea 25kg
+100 sacks
```

---

## Test 2 — Sale

```text
Sell:
20 × 25kg Princess Bea
```

Expected:

```text
100 → 80 sacks
```

---

## Test 3 — Insufficient Inventory

Attempt:

```text
Sell 100 sacks
```

when only:

```text
80 sacks
```

are available.

Expected:

```text
Transaction rejected
Inventory unchanged
```

---

## Test 4 — Reseller Transfer

```text
Transfer:
20 × 25kg
```

Expected:

```text
80 → 60 sacks
```

---

## Test 5 — Credit Transfer

```text
Total:
₱27,000

Paid:
₱10,000

Balance:
₱17,000
```

Expected:

```text
Transfer recorded
Inventory decreased
Credit created
Balance = ₱17,000
```

---

## Test 6 — Credit Payment

Pay:

```text
₱7,000
```

Expected:

```text
Original = ₱27,000
Paid = ₱17,000
Balance = ₱10,000
```

---

## Test 7 — Rice Rebagging

Starting:

```text
Princess Bea
10 × 50kg
```

Convert to:

```text
Hasmin
25kg
```

Expected:

```text
Princess Bea
-10 × 50kg

Hasmin
+20 × 25kg
```

Both represent:

```text
500 KG
```

---

# 75. PALAY TEST

Receive:

```text
1,000 KG Dinorado Palay
```

Expected:

```text
Palay inventory:
+1,000 KG
```

Then convert:

```text
1,000 KG Palay
→
700 KG Rice
→
28 × 25kg
```

Expected:

```text
Palay:
1,000 → 0 KG

Rice:
+28 sacks

Yield:
70%

Loss:
300 KG
```

All changes must be atomic.

---

# 76. AUDIT TEST

Verify that the following create audit records:

```text
Delivery
Sale
Reseller Transfer
Palay Receipt
Rice Rebagging
Palay Conversion
Credit Payment
Inventory Reject
Inventory Adjustment
```

---

# 77. RLS TEST

Verify that:

```text
Secretary
```

cannot perform administrator-only actions.

Verify that:

```text
Other Staff
```

cannot access unauthorized operations.

Verify that an unauthenticated user cannot access business data.

Verify that a user cannot bypass the UI and directly modify protected inventory records.

---

# 78. DATABASE QUALITY REQUIREMENTS

The final database must:

* Be normalized appropriately
* Avoid unnecessary duplication
* Preserve historical transaction information
* Use foreign keys
* Use constraints
* Use indexes
* Use RLS
* Use atomic functions
* Prevent negative inventory
* Prevent negative credits
* Prevent invalid payment amounts
* Prevent orphaned records
* Prevent accidental historical deletion
* Support reporting efficiently
* Support concurrent transactions safely

---

# 79. DO NOT BUILD

For this task, do NOT build:

```text
Next.js pages
Dashboard UI
POS UI
Tailwind components
Forms
Charts
Frontend navigation
```

Only build/provide the **Supabase database architecture, migrations, functions, policies, seed data, views, and documentation**.

The frontend will be built separately after the database is finalized.

---

# 80. FINAL DELIVERABLES

The completed database work must include:

```text
1. Complete PostgreSQL schema
2. Supabase migration files
3. Tables
4. Foreign keys
5. Constraints
6. Indexes
7. Enums / controlled values
8. RLS policies
9. Helper authorization functions
10. Inventory RPC functions
11. Credit RPC functions
12. Transaction number generation
13. Reporting views where appropriate
14. Storage bucket configuration
15. Storage policies
16. Development seed data
17. ERD / Mermaid diagram
18. Database architecture documentation
19. Test cases
```

---

# 81. FINAL ARCHITECTURE

The final database should conceptually follow:

```text
                    SUPABASE
                       │
          ┌────────────┼────────────┐
          │            │            │
       AUTH        POSTGRES       STORAGE
          │            │         rice-images
          │            │
       profiles       │
          │            │
        roles         │
          │            │
     permissions      │
                       │
        ┌──────────────┼──────────────────┐
        │              │                  │
       RICE          PALAY            TRANSACTIONS
        │              │                  │
        │              │          ┌───────┼────────┐
        │              │          │       │        │
        │              │        SALES   TRANSFER  DELIVERY
        │              │          │       │        │
        │              │          └───────┼────────┘
        │              │                  │
        │              │               CREDITS
        │              │
        │         PALAY CONVERSION
        │              │
        └───────┬──────┘
                │
          INVENTORY LEDGER
                │
        ┌───────┴────────┐
        │                │
   INVENTORY          AUDIT LOG
   BALANCES
```

The critical principle is:

```text
BUSINESS TRANSACTION
        ↓
ATOMIC DATABASE FUNCTION
        ↓
INVENTORY MOVEMENT
        ↓
CURRENT INVENTORY BALANCE
        ↓
AUDIT LOG
```

The database must be the **single source of truth** for inventory and transaction history.

Build this architecture first. Do not proceed to frontend implementation until the schema, relationships, RLS, inventory functions, and transaction tests are working correctly.
