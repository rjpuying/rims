# BRICK EIGHT TRADING INC.

# RICE POS + INVENTORY MANAGEMENT SYSTEM

## FINAL DEVELOPMENT PROMPT

Build a production-ready **Rice POS + Inventory Management System** for **Brick Eight Trading Inc.**

This application will be developed and deployed using:

* **Next.js**
* **TypeScript**
* **Next.js App Router**
* **Supabase**
* **PostgreSQL**
* **Supabase Auth**
* **Supabase Storage**
* **Supabase Row Level Security (RLS)**
* **Supabase Database Functions / RPC**
* **GitHub**
* **Vercel**
* **Tailwind CSS**

The project must be structured as a professional, maintainable, secure full-stack web application.

---

# 1. TECHNOLOGY STACK — MANDATORY

Use the following stack and do not replace it with another framework.

## Frontend

```text
Next.js
TypeScript
App Router
Tailwind CSS
```

Use modern React patterns.

Prefer:

* Server Components by default
* Client Components only when interactivity requires them
* Server Actions where appropriate
* Route Handlers where appropriate
* Reusable components
* Strong TypeScript typing

Do not build the application as a separate React SPA.

The application must be a proper Next.js application.

---

# 2. BACKEND

Use:

```text
Supabase
PostgreSQL
Supabase Auth
Supabase Storage
Supabase RLS
PostgreSQL Functions / RPC
```

Supabase must be the primary backend and source of truth.

Do not create a separate Express.js, Node.js, Firebase, MongoDB, or custom backend unless absolutely necessary.

---

# 3. REPOSITORY / GITHUB

The project must be GitHub-ready.

Use a clean repository structure.

Recommended structure:

```text
/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── sales/
│   │   ├── inventory/
│   │   ├── deliveries/
│   │   ├── palay/
│   │   ├── rebagging/
│   │   ├── transfers/
│   │   ├── credits/
│   │   ├── reports/
│   │   ├── users/
│   │   └── settings/
│   │
│   ├── api/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── sales/
│   ├── inventory/
│   ├── deliveries/
│   ├── palay/
│   ├── rebagging/
│   ├── transfers/
│   ├── credits/
│   └── reports/
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── permissions/
│   ├── validations/
│   ├── calculations/
│   └── utils/
│
├── types/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed/
│
├── public/
│
├── middleware.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

Adapt the structure if necessary, but maintain clear separation of responsibilities.

---

# 4. DEPLOYMENT

The application must be designed for:

```text
GitHub
    ↓
Vercel
    ↓
Next.js Application
    ↓
Supabase
```

Use environment variables.

Never hardcode:

* Supabase URLs
* Supabase keys
* Secrets
* Service role keys
* API credentials

Use:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Only use server-side secrets where absolutely necessary.

Never expose the Supabase service-role key to the browser.

Create a `.env.example` file.

---

# 5. AUTHENTICATION

Use:

**Supabase Auth**

Implement:

* Login
* Logout
* Session persistence
* Protected routes
* Auth middleware
* User profile
* Role-based access

Unauthenticated users must be redirected to:

```text
/login
```

Authenticated users should access the application dashboard.

---

# 6. USER ROLES

Create exactly these roles:

```text
Super Admin
Owner
Manager
Secretary
Other Staff
```

Create appropriate role/permission tables.

Suggested:

```text
profiles
roles
permissions
role_permissions
```

Every authenticated user should have a profile.

Profile should include:

```text
id
auth_user_id
full_name
role_id
is_active
created_at
updated_at
```

---

# 7. ROLE PERMISSIONS

### Super Admin

Full access:

```text
Dashboard
Sales
Inventory
Delivery
Palay
Rebagging
Transfer
Credits
Reports
Users
Roles
Settings
```

### Owner

```text
Dashboard
Sales
Inventory
Delivery
Palay
Rebagging
Transfer
Credits
Reports
View Users
```

### Manager

```text
Dashboard
Sales
Inventory
Delivery
Palay
Rebagging
Transfer
Credits
Reports
```

### Secretary

```text
Dashboard
Sales
Delivery
Palay
Rebagging
Transfer
Credits
Daily Transactions
```

### Other Staff

Limited permissions assigned by administrator.

Permissions must be enforced in:

1. UI
2. Server
3. Supabase RLS / database functions

Do not rely only on frontend hiding.

---

# 8. UI FRAMEWORK

Use:

**Tailwind CSS**

Build a professional business dashboard.

Design characteristics:

* Clean
* Modern
* Fast
* Minimal
* Professional
* Responsive
* Easy to understand
* Desktop-first
* Mobile-friendly

Avoid excessive animations.

Use subtle transitions only when useful.

Use reusable UI components.

Examples:

```text
Button
Input
Select
Dialog
Modal
Dropdown
Card
Badge
Table
Tabs
Toast
Alert
Skeleton
Pagination
Date Picker
```

Do not duplicate UI code across pages.

---

# 9. APPLICATION LAYOUT

Authenticated pages should use:

```text
┌───────────────────────────────────────────────────┐
│ Header                                             │
├───────────────┬───────────────────────────────────┤
│ Sidebar       │                                   │
│               │        Page Content               │
│ Dashboard     │                                   │
│ Sales / POS   │                                   │
│ Inventory     │                                   │
│ Delivery      │                                   │
│ Palay         │                                   │
│ Rebagging     │                                   │
│ Transfer      │                                   │
│ Credits       │                                   │
│ Reports       │                                   │
│ Users         │                                   │
│ Settings      │                                   │
│               │                                   │
└───────────────┴───────────────────────────────────┘
```

Sidebar items must be dynamically hidden/disabled based on permissions.

---

# 10. BUSINESS PHILOSOPHY

This is NOT a generic ERP.

Keep the system simple.

Brick Eight Trading Inc. has:

* One warehouse
* Rice trading
* Palay purchasing
* Rice receiving
* Rice sales
* Reseller/dealer transfers
* Rebagging
* Palay → Rice conversion
* Credit tracking

Do NOT add unnecessary enterprise functionality.

---

# 11. DO NOT CREATE THESE

Do not create:

```text
warehouses
suppliers master
customers master
resellers master
cashier sessions
purchase orders
purchase invoices
accounting ledger
general ledger
COGS
FIFO
weighted average costing
inventory valuation
expenses
payroll
multi-company
multi-warehouse
```

Supplier, farmer, customer, and reseller names are transaction-level information.

---

# 12. MAIN NAVIGATION

Create:

```text
Dashboard
Sales / POS
Inventory
Delivery Received
Palay Received
Rebagging
Transfer to Reseller
Customer Credits
Reports
Users & Roles
Settings
```

---

# 13. RICE PRODUCTS

Create:

```text
rice_products
```

Fields:

```text
id
rice_name
rice_type
variety
image_url
low_stock_threshold
is_active
created_at
updated_at
```

Do NOT store fixed selling prices.

Prices are entered per transaction.

---

# 14. RICE PRODUCT IMAGES

Use Supabase Storage.

Bucket:

```text
rice-images
```

Example:

```text
rice-images/
├── princess-bea/
│   └── product-image.jpg
├── hasmin-blue/
│   └── product-image.jpg
└── dinorado/
    └── product-image.jpg
```

Display rice images prominently in:

* Dashboard
* Inventory
* POS
* Rebagging
* Product selection

The rice image is effectively the visual identity of the rice product.

---

# 15. INVENTORY MODEL

Rice inventory must be tracked by:

```text
Rice Product
Sack Size
Full Sacks
Loose KG
Rejected Sacks
```

Supported sack sizes:

```text
25 KG
50 KG
Other
```

Example:

```text
Princess Bea

25 KG
100 sacks

50 KG
25 sacks

Loose
8 KG

Rejected
2 sacks
```

Never mix 25kg and 50kg quantities.

---

# 16. INVENTORY DATABASE DESIGN

Use an inventory ledger.

Create:

```text
inventory_movements
```

Possible movement types:

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

Also maintain an efficient balance/read model such as:

```text
inventory_balances
```

The ledger remains the auditable source of inventory changes.

---

# 17. INVENTORY MOVEMENT EXAMPLE

```text
Princess Bea — 25 KG

Delivery       +100
Sale            -20
Transfer        -30
Rebagging       -10
Rejected         -3
--------------------
Current          37
```

Every movement must link to the transaction that caused it.

---

# 18. DASHBOARD

Build an operational dashboard.

Show:

### Today's Sales

```text
₱125,000
```

### Transactions

```text
32
```

### Credit Sales

```text
₱25,000
```

### Inventory

Use visual rice cards.

### Recent Transactions

Show:

```text
Date
Transaction
Name
Rice
Quantity
Amount
User
```

### Alerts

Show:

```text
Low Stock
Out of Stock
Rejected Stock
Outstanding Credits
Unpaid Deliveries
Palay Inventory
```

---

# 19. DELIVERY RECEIVED

Page:

```text
/deliveries
```

This replaces Purchasing.

No purchase orders.

No supplier master.

Form:

```text
Date
Supplier Name
Rice Name
Rice Type
Variety
Batch Number
Quantity
Sack Size
Price per Sack
Total
Amount Paid
Balance
Payment Status
Received By
Notes
```

Sack size:

```text
25 KG
50 KG
Other
```

Calculate automatically:

```text
Total = Quantity × Price
Balance = Total - Amount Paid
```

Payment status:

```text
Fully Paid
Partially Paid
Unpaid
```

Receiving a delivery must increase rice inventory.

---

# 20. DELIVERY BATCHES

Every delivery creates a batch.

Store:

```text
Batch ID
Transaction Number
Rice
Type
Variety
Supplier Name
Quantity
Sack Size
Price
Date
```

Batch history must remain immutable/auditable.

---

# 21. PALAY RECEIVED

Page:

```text
/palay
```

Palay is a separate inventory entity.

Form:

```text
Date
Farmer Name
Rice Name
Variety
Kilograms
Price per KG
Total
Amount Paid
Balance
Payment Status
Received By
Notes
```

Calculate:

```text
Total = KG × Price per KG
Balance = Total - Amount Paid
```

Palay inventory is measured in KG.

Example:

```text
Dinorado — 1,500 KG
Jasmine — 800 KG
```

Receiving palay must NOT automatically create rice inventory.

---

# 22. REBAGGING

Page:

```text
/rebagging
```

The first screen must clearly separate:

```text
RICE → RICE

PALAY → RICE
```

Use two large visual cards.

---

# 23. RICE → RICE

Workflow:

```text
Select source rice
↓
Select source sack size
↓
Enter source quantity
↓
Calculate source KG
↓
Select destination rice
↓
Select destination sack size
↓
Calculate destination quantity
↓
Show before/after
↓
Confirm
```

Support:

```text
25kg → 25kg
25kg → 50kg
50kg → 25kg
50kg → 50kg
```

Example:

```text
10 × 50kg
=
500 KG

500 KG ÷ 25kg
=
20 sacks
```

Never simply copy sack quantity.

---

# 24. RICE REBAGGING CONFIRMATION

Display:

```text
FROM

Princess Bea
10 × 50 KG
500 KG

TO

Hasmin
20 × 25 KG
500 KG

INVENTORY

Princess Bea
-10 sacks

Hasmin
+20 sacks
```

Allow optional loss:

```text
Input KG
Output KG
Loss KG
Reason
```

---

# 25. PALAY → RICE

Example:

```text
Palay:
Dinorado

Input:
1,000 KG

Rice:
Dinorado

Output:
28 × 25 KG

Produced:
700 KG

Yield:
70%

Loss:
300 KG
```

Transaction must:

```text
Palay Inventory
-1,000 KG

Rice Inventory
+700 KG
```

Store:

```text
palay_conversions
```

with:

```text
palay source
palay KG used
rice destination
sack size
sacks produced
rice KG produced
yield
loss
date
processed_by
```

---

# 26. SALES / POS

Page:

```text
/sales
```

Make this the fastest transaction screen in the application.

Customer name is manually entered.

Do not create a customer master.

Form:

```text
Customer Name
Rice
Selling Method
Sack Size
Quantity
Price
Discount
Total
Payment Method
Amount Paid
Balance
Processed By
```

Selling methods:

```text
Per Sack
Per KG
```

Payment:

```text
Cash
GCash
Bank Transfer
Card
Credit
```

---

# 27. POS INVENTORY DISPLAY

When rice is selected:

```text
Princess Bea

25 KG — 100 sacks
50 KG — 25 sacks
Loose — 8 KG
```

Before confirming:

```text
Available Before
Requested
Remaining After
```

Never allow a sale exceeding available inventory.

---

# 28. PER-KG SALES

Support opened sacks.

Example:

```text
25 KG sack
↓
10 KG sold
↓
15 KG loose remains
```

Inventory must correctly represent:

```text
Full sacks
Loose KG
Rejected sacks
```

---

# 29. TRANSFER TO RESELLER

Page:

```text
/transfers
```

This is:

```text
Brick Eight Trading Inc. Warehouse
                ↓
          Reseller / Dealer
```

There is only one warehouse.

Do NOT create warehouse transfer functionality.

Form:

```text
Date
Reseller Name
Rice
Sack Size
Quantity
Price per Sack
Total
Payment Status
Amount Paid
Balance
Confirmed By
Notes
```

Payment:

```text
Paid
Credit
```

Inventory decreases when confirmed.

---

# 30. TRANSFER CONFIRMATION

Show:

```text
FROM
Brick Eight Trading Inc. Warehouse

TO
ABC Rice Store

Rice
Princess Bea

Sack
25 KG

Quantity
20 sacks

Price
₱1,350

Total
₱27,000

Paid
₱10,000

Balance
₱17,000

CURRENT STOCK
100 sacks

AFTER TRANSFER
80 sacks

CONFIRMED BY
Secretary
```

Require confirmation.

---

# 31. CUSTOMER CREDITS

Page:

```text
/credits
```

Credits are transaction-based.

They can originate from:

```text
SALE
TRANSFER_TO_RESELLER
```

Do not create permanent customer/reseller profiles.

Show:

```text
Name
Transaction Type
Date
Original Amount
Paid
Balance
Status
```

---

# 32. CREDIT PAYMENTS

Allow later payment.

Fields:

```text
Original Transaction
Original Amount
Previously Paid
Outstanding
New Payment
Payment Method
Remaining Balance
Confirmed By
Date
Notes
```

Do not allow payment greater than outstanding balance.

---

# 33. REPORTS

Page:

```text
/reports
```

Create tabs:

```text
Sales
Inventory
Deliveries
Palay
Conversions
Transfers
Credits
```

Include date filtering and relevant business filters.

Do not build accounting reports.

---

# 34. USERS & ROLES

Page:

```text
/users
```

Only authorized users can access.

Support:

```text
Create User
Deactivate User
Assign Role
Change Role
View User Activity
```

Do not allow normal users to elevate their own permissions.

---

# 35. SETTINGS

Page:

```text
/settings
```

Keep it simple.

Settings:

```text
Company Name
Company Logo
Currency
Date Format
Default Low Stock Threshold
Sack Size Options
Transaction Number Settings
```

---

# 36. DATABASE TABLES

Use migrations inside:

```text
supabase/migrations/
```

Recommended tables:

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
palay_inventory
palay_conversions

inventory_balances
inventory_movements
rejected_stock

rebagging_transactions
rebagging_items

sales
sale_items
sale_payments

customer_credits
credit_payments

reseller_transfers
reseller_transfer_items
reseller_transfer_payments

audit_logs
system_settings
```

Do not create unnecessary tables.

---

# 37. DATABASE RELATIONSHIPS

Use foreign keys wherever appropriate.

Examples:

```text
rice_products
    ↓
delivery_items

rice_products
    ↓
inventory_balances

sales
    ↓
sale_items
    ↓
rice_products

reseller_transfers
    ↓
reseller_transfer_items
    ↓
rice_products
```

Use proper indexes for:

```text
created_at
transaction_number
rice_product_id
user_id
payment_status
date
```

---

# 38. TRANSACTION NUMBERS

Generate unique human-readable transaction numbers.

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

Use UUIDs internally as primary keys where appropriate.

---

# 39. DATABASE FUNCTIONS / RPC

Create secure PostgreSQL functions for inventory mutations.

Required:

```text
receive_delivery()
receive_palay()
process_sale()
process_rebagging()
process_palay_to_rice()
process_reseller_transfer()
record_reject()
record_credit_payment()
```

These operations must be atomic.

For example:

```text
process_sale()

1. Validate authentication
2. Validate permission
3. Validate inventory
4. Create sale
5. Create sale items
6. Create payment
7. Create inventory movement
8. Update inventory balance
9. Create credit if applicable
10. Create audit log
11. Commit
```

If any operation fails:

```text
ROLLBACK
```

---

# 40. INVENTORY SAFETY

Never allow negative stock.

Every stock deduction must verify:

```text
available_quantity >= requested_quantity
```

If not:

```text
INSUFFICIENT INVENTORY

Only X units are available.
```

Block the transaction.

Use database-level locking/transaction safety where necessary to prevent race conditions from simultaneous sales.

---

# 41. SUPABASE RLS

RLS is mandatory.

Create policies based on the authenticated user's role.

Users must only be able to:

* Read permitted records
* Create permitted transactions
* Update permitted records
* Execute permitted operations

Inventory mutations should preferably happen through controlled RPC functions rather than direct client-side updates.

Never expose the Supabase service-role key to the client.

---

# 42. AUDIT LOGGING

Create:

```text
audit_logs
```

Record:

```text
id
user_id
action
entity_type
entity_id
metadata
created_at
```

Track:

```text
SALE_CREATED
DELIVERY_RECEIVED
PALAY_RECEIVED
REBAGGING_PROCESSED
PALAY_CONVERSION_PROCESSED
RESELLER_TRANSFER_PROCESSED
CREDIT_PAYMENT_RECORDED
INVENTORY_ADJUSTED
USER_CREATED
USER_ROLE_CHANGED
SETTINGS_CHANGED
```

---

# 43. SERVER / CLIENT ARCHITECTURE

Use Server Components by default.

Use Client Components only for:

* Interactive forms
* POS interface
* Modals
* Filters
* Tables requiring client interaction
* Image upload
* Dynamic inventory selectors

Keep sensitive database operations server-side.

Do not expose database credentials.

---

# 44. SUPABASE CLIENT SETUP

Create reusable Supabase utilities.

For example:

```text
lib/supabase/server.ts
lib/supabase/client.ts
lib/supabase/middleware.ts
```

Use the recommended Supabase SSR authentication pattern for Next.js.

Do not create a singleton browser/server client incorrectly.

Ensure authentication works correctly with Next.js App Router and Vercel.

---

# 45. FORM VALIDATION

Use strong validation.

Prefer:

```text
Zod
```

for schemas shared between client/server where appropriate.

Validate:

* Required fields
* Numeric values
* Positive quantities
* Prices
* Payment amounts
* Sack sizes
* Dates
* Inventory availability
* Credit balances

Never trust client-side validation alone.

---

# 46. ERROR HANDLING

Provide useful business-friendly errors.

Examples:

```text
Unable to complete sale.

Only 12 sacks are available.
```

Instead of exposing:

```text
Postgres error 23505
```

Log technical details appropriately while showing simple messages to users.

---

# 47. LOADING / EMPTY / ERROR STATES

Every major page must support:

```text
Loading
Empty
Error
Success
```

Examples:

```text
No deliveries found.
No outstanding credits.
No inventory movements.
No sales for this date range.
```

Use skeleton loaders where useful.

---

# 48. SEARCH AND FILTERS

Inventory:

```text
Rice
Sack Size
Stock Status
```

Sales:

```text
Customer
Rice
Date
Payment
```

Delivery:

```text
Supplier
Rice
Date
Payment Status
```

Transfers:

```text
Reseller
Rice
Date
Payment Status
```

Credits:

```text
Name
Transaction Type
Outstanding/Paid
```

Reports:

```text
Date Range
Rice
User
Transaction Type
Payment Status
```

---

# 49. RESPONSIVENESS

Desktop is the primary environment.

However, make the UI responsive for tablets and phones.

POS should remain usable on smaller screens.

Tables should:

* Scroll horizontally when necessary
* Maintain readable columns
* Provide mobile-friendly alternatives when appropriate

---

# 50. ACCESSIBILITY

Use semantic HTML.

Support:

* Keyboard navigation
* Labels
* Focus states
* Accessible dialogs
* Accessible buttons
* Proper form error messages

Do not rely only on color to communicate status.

---

# 51. PERFORMANCE

Optimize for Vercel.

Use:

* Server Components
* Server-side data fetching
* Proper database indexes
* Pagination
* Selective queries
* Image optimization
* Next.js image handling
* Avoid unnecessary client-side fetching
* Avoid loading entire tables when only a page is needed

Do not fetch thousands of records into the browser.

---

# 52. SECURITY

Mandatory:

* Supabase RLS
* Secure authentication
* Server-side authorization
* Database authorization
* Environment variables
* No secrets in GitHub
* No service-role key in client code
* Input validation
* SQL injection protection through Supabase/Postgres parameterization
* Audit logging
* Transaction-level authorization

---

# 53. GIT / GITHUB DEVELOPMENT

Keep commits logical and maintainable.

Recommended progression:

```text
Initial Next.js setup
Supabase authentication
Database schema
RLS and roles
Dashboard
Inventory
Delivery Received
Palay
Sales / POS
Rebagging
Reseller Transfer
Credits
Reports
Audit logs
Final testing
```

Do not commit:

```text
.env
.env.local
secrets
service-role keys
credentials
```

Include:

```text
.env.example
.gitignore
README.md
```

---

# 54. VERCEL DEPLOYMENT

The application must be deployable directly through GitHub → Vercel.

Production environment variables must be documented.

README should explain:

```text
1. Clone repository
2. Install dependencies
3. Configure environment variables
4. Configure Supabase
5. Run database migrations
6. Run development server
7. Push to GitHub
8. Connect GitHub repository to Vercel
9. Add production environment variables
10. Deploy
```

---

# 55. SUPABASE MIGRATIONS

All database schema changes must be represented as migration files.

Do not rely on undocumented manual database changes.

Include:

```text
supabase/migrations/
```

The README must explain how to apply migrations.

Seed development data where useful.

Do not put real business data in seed files.

---

# 56. TESTING

Before considering the project complete, test the major workflows.

At minimum:

### Authentication

```text
Login
Logout
Protected routes
Role permissions
```

### Delivery

```text
Receive delivery
Inventory increases
Payment/balance works
```

### Sales

```text
Create sale
Inventory decreases
Credit created
Payment works
```

### Reseller Transfer

```text
Transfer rice
Inventory decreases
Paid transaction works
Credit transaction works
```

### Rice Rebagging

```text
25 → 25
25 → 50
50 → 25
50 → 50
```

### Palay

```text
Receive palay
Palay inventory increases
```

### Palay → Rice

```text
Palay decreases
Rice increases
Yield calculates
Loss calculates
```

### Credit

```text
Create credit
Record payment
Balance decreases
Fully paid status works
```

### Rejected Stock

```text
Reject stock
Available stock decreases
Rejected stock increases
```

### Security

Test that users cannot perform unauthorized actions.

---

# 57. FINAL UI NAVIGATION

The finished application should have:

```text
🏠 Dashboard

🛒 Sales / POS

📦 Inventory

🚚 Delivery Received

🌾 Palay Received

🔄 Rebagging

🚛 Transfer to Reseller

💳 Customer Credits

📊 Reports

👥 Users & Roles

⚙️ Settings
```

---

# 58. FINAL BUSINESS WORKFLOWS

## Rice Delivery

```text
Delivery Received
↓
Supplier Name
↓
Rice
↓
Sack Size
↓
Quantity
↓
Price
↓
Payment
↓
Confirm
↓
Inventory +
```

## Palay Purchase

```text
Palay Received
↓
Farmer Name
↓
Rice/Variety
↓
KG
↓
Price/KG
↓
Payment
↓
Confirm
↓
Palay Inventory +
```

## Retail Sale

```text
Sales / POS
↓
Customer Name
↓
Rice
↓
Sack Size / KG
↓
Quantity
↓
Price
↓
Payment
↓
Confirm
↓
Inventory -
```

## Reseller Transfer

```text
Transfer to Reseller
↓
Reseller Name
↓
Rice
↓
Sack Size
↓
Quantity
↓
Price
↓
Paid/Credit
↓
Confirm
↓
Inventory -
↓
Credit if applicable
```

## Rice Rebagging

```text
Rebagging
↓
RICE → RICE
↓
Source
↓
Destination
↓
KG calculation
↓
Confirm
↓
Inventory updated
```

## Palay Conversion

```text
Rebagging
↓
PALAY → RICE
↓
Palay KG
↓
Rice output
↓
Yield/Loss
↓
Confirm
↓
Palay -
↓
Rice +
```

---

# 59. MOST IMPORTANT RULES

The implementation must preserve these rules:

### RULE 1

There is **ONE warehouse**.

### RULE 2

Do not create permanent supplier/customer/farmer/reseller master records.

### RULE 3

Prices are manually entered per transaction.

### RULE 4

Palay and rice are separate inventory entities.

### RULE 5

25kg and 50kg stock must never be confused.

### RULE 6

Rice → Rice rebagging must calculate using KG.

### RULE 7

Palay → Rice is a separate conversion workflow.

### RULE 8

Inventory cannot become negative.

### RULE 9

Every inventory mutation must be atomic.

### RULE 10

Every important transaction must identify the user who processed/confirmed it.

### RULE 11

Credits must remain attached to their originating transaction.

### RULE 12

Do not add unnecessary ERP features.

### RULE 13

Supabase is the source of truth.

### RULE 14

RLS and database authorization are mandatory.

### RULE 15

Never expose Supabase service-role credentials to the client.

---

# 60. FINAL PRODUCT GOAL

Build a polished production-ready application specifically for:

# BRICK EIGHT TRADING INC.

The final product should feel like a purpose-built rice trading application.

It should be:

```text
SIMPLE
FAST
MODERN
SECURE
ACCURATE
RESPONSIVE
EASY TO USE
MAINTAINABLE
```

Technology architecture:

```text
                 GITHUB
                    │
                    ▼
                 VERCEL
                    │
                    ▼
              NEXT.JS APP
             /            \
            /              \
      TAILWIND CSS       SERVER LOGIC
                              │
                              ▼
                          SUPABASE
                 ┌────────────┼────────────┐
                 │            │            │
             PostgreSQL     Auth        Storage
                 │
                 ▼
          Inventory Ledger
                 │
        ┌────────┼─────────┐
        │        │         │
       Sales   Delivery   Palay
        │        │         │
        └───────┬┴─────────┘
                │
          Rebagging /
        Conversion /
        Reseller Transfer
                │
                ▼
             Credits
```

Build the application end-to-end using this architecture.

Do not replace Next.js, Supabase, Tailwind, GitHub, or Vercel with alternative technologies.

Do not build a mock-only frontend.

The application must have a real working Supabase backend, real authentication, real database persistence, real inventory calculations, real RLS, and real transaction processing.

Prioritize correctness of inventory and transaction processing over visual complexity.

The finished system must be ready to run locally and deploy through GitHub to Vercel.
