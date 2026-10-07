# UI/UX CONSTITUTION

## Rice POS & Inventory Management System

### Brick Eight Trading Inc.

Build the UI/UX as a **mobile-first, responsive, simple, practical, and professional business application**.

The application must work naturally across:

* Mobile phones
* Small phones
* Large phones
* Tablets
* Small laptops
* Desktop monitors
* Large desktop screens

The interface must adapt to the available screen size without losing important information or becoming difficult to use.

The design must feel like a **real rice trading/POS application**, not an AI-generated SaaS dashboard.

---

# 1. PRIMARY DESIGN PRINCIPLE

The most important rule:

> **Design for the smallest practical screen first, then progressively enhance the experience for larger screens.**

Do NOT design desktop first and simply make it responsive afterward.

Start with:

```text
Mobile
  ↓
Large Mobile
  ↓
Tablet
  ↓
Laptop
  ↓
Desktop
```

Every component must have a deliberate responsive behavior.

---

# 2. CORE UX PHILOSOPHY

The system must be:

* Simple
* Clear
* Fast
* Easy to learn
* Easy to operate
* Touch friendly
* Keyboard friendly on larger screens
* Responsive
* Accessible
* Consistent
* Minimalist

The user should not need technical knowledge to operate the system.

The interface should communicate:

> "I know exactly what to do next."

---

# 3. DO NOT MAKE IT LOOK LIKE AN AI PRODUCT

Avoid the typical AI-generated UI style.

Do NOT use:

* Purple AI gradients
* Neon gradients
* Glassmorphism everywhere
* Glowing borders
* Floating decorative shapes
* AI sparkle icons
* Excessive rounded cards
* Huge hero sections
* Giant typography
* Excessive dashboard cards
* Decorative charts
* Animated backgrounds
* Excessive animations
* Fake AI insights
* Chatbot interfaces
* "Smart" labels
* AI assistants

This is a **business operations application**, not an AI product.

---

# 4. MOBILE-FIRST RULE

Every page must first be designed for approximately:

```text
320px–480px
```

Then adapt upward.

Do not assume the user always has a large screen.

The application must remain usable on narrow screens.

At minimum, test layouts around:

```text
320px
375px
390px
430px
768px
1024px
1280px
1440px+
```

Do not design only for a single breakpoint.

---

# 5. RESPONSIVE DESIGN PRINCIPLE

Responsive behavior should be intentional.

Example:

### Mobile

```text
Page Title

[ Primary Action ]

Summary

Transaction List
```

### Tablet

```text
Page Title                    [Action]

Summary Cards

Transaction List
```

### Desktop

```text
Page Title                              [Primary Action]

Summary Cards

Detailed Transaction Table
```

The content remains the same, but the layout becomes more efficient as screen space increases.

---

# 6. RESPONSIVE NAVIGATION

## Mobile

Use a compact top navigation/header.

Recommended:

```text
┌──────────────────────────────┐
│ ☰   Brick Eight       👤     │
└──────────────────────────────┘
```

The main navigation should open as:

* drawer
* sheet
* slide-over menu

Do not keep a permanent large sidebar on mobile.

---

## Tablet

Use either:

* compact sidebar
* collapsible sidebar
* navigation drawer

depending on available width.

---

## Desktop

Use a persistent left sidebar.

Example:

```text
┌─────────────┬──────────────────────────────┐
│ Dashboard   │                              │
│ Sales       │                              │
│ Inventory   │       Main Content            │
│ Delivery    │                              │
│ Palay       │                              │
│ Rebagging   │                              │
│ Transfer    │                              │
│ Credits     │                              │
│ Reports     │                              │
│             │                              │
│ Users       │                              │
│ Settings    │                              │
└─────────────┴──────────────────────────────┘
```

The navigation must not consume excessive desktop width.

---

# 7. BOTTOM NAVIGATION

For mobile, consider a bottom navigation only for the most frequently used functions.

Possible:

```text
┌────────────────────────────────┐
│ Home | Sales | Inventory | More│
└────────────────────────────────┘
```

Do not put every module into bottom navigation.

Use a "More" menu for less frequently used modules.

Primary mobile navigation should prioritize:

* Dashboard
* Sales / POS
* Inventory
* More

---

# 8. TOUCH-FIRST DESIGN

All interactive elements must be comfortable for touch.

Use touch-friendly targets.

Do not create:

* tiny buttons
* tiny dropdown arrows
* tiny checkboxes
* tightly packed links

Buttons should have enough height and spacing for a finger.

Do not place destructive actions immediately beside primary actions without separation.

---

# 9. MOBILE FORM DESIGN

Forms must be optimized for touch.

Use:

```text
Label

[ Input ]

Label

[ Input ]

Label

[ Input ]
```

Avoid multi-column forms on small screens.

For example, do NOT do:

```text
Quantity     Price
[____]       [____]
```

on a narrow phone.

Instead:

```text
Quantity
[________]

Price
[________]
```

On tablets/desktops, fields may become two-column where appropriate.

---

# 10. RESPONSIVE FORM GRID

Use progressive enhancement.

### Mobile

One column:

```text
Field
Field
Field
Field
```

### Tablet

Two columns where useful:

```text
Field       Field
Field       Field
```

### Desktop

Use logical groups:

```text
Field       Field       Field
Field       Field       Field
```

Never create columns simply because there is available space.

Fields that belong together should remain together.

---

# 11. MOBILE PAGE HEADER

Mobile page headers must remain compact.

Example:

```text
Sales / POS

Create a new sale

[ + New Sale ]
```

Do not use huge page titles.

Avoid:

```text
Welcome to Your Business
Manage Your Sales and Inventory Effortlessly
```

This is not a marketing website.

---

# 12. DASHBOARD — MOBILE FIRST

The dashboard should be useful without becoming a wall of cards.

Mobile:

```text
Dashboard

Today's Sales
₱27,000

Inventory
125 sacks

Credits
₱17,000

Low Stock
3 items
```

Then:

```text
Recent Transactions
```

Use a simple vertical list on mobile.

Desktop may use a more structured grid.

Do not create 10–20 statistic cards.

---

# 13. DASHBOARD RESPONSIVENESS

Use:

### Mobile

One-column summaries.

### Tablet

Two-column summaries.

### Desktop

Two-to-four-column summary layout depending on content.

Example:

```text
Mobile

[ Sales ]
[ Inventory ]
[ Credits ]
[ Low Stock ]
```

Tablet:

```text
[ Sales ]        [ Inventory ]
[ Credits ]      [ Low Stock ]
```

Desktop:

```text
[ Sales ] [ Inventory ] [ Credits ] [ Low Stock ]
```

Do not force four cards onto narrow screens.

---

# 14. INVENTORY — MOBILE FIRST

Inventory is one of the most important parts of the application.

On mobile, use product cards or compact list items.

Example:

```text
┌───────────────────────────────┐
│ [Rice Image]                  │
│                               │
│ Princess Bea                  │
│ Regular Rice                  │
│                               │
│ 25 KG     100 sacks           │
│ 50 KG      25 sacks           │
│ Loose       8 KG              │
│                               │
│ ● In Stock                    │
└───────────────────────────────┘
```

Cards should not become excessively tall.

Use progressive disclosure for secondary information.

---

# 15. INVENTORY — TABLE RESPONSIVENESS

Do not simply force a huge desktop table onto mobile.

On mobile:

Use a compact list/card representation.

Example:

```text
Princess Bea
25 KG
100 sacks
● In Stock
```

Tap to open detailed inventory.

On tablet:

Use a compact table.

On desktop:

Use the full table:

```text
Rice | Sack Size | Full Sacks | Loose KG | Rejected | Status
```

If a table genuinely needs horizontal scrolling, allow it, but do not make every mobile screen a horizontal spreadsheet.

---

# 16. RICE PRODUCT IMAGES

Rice sack images are functional business information.

They help staff identify products quickly.

Use the actual rice product image.

Examples:

* Princess Bea
* Hasmin Blue
* Dinorado

Images should appear in:

* Inventory
* POS product selection
* Rebagging
* Rice selection
* Relevant transaction details

Do not use decorative rice field imagery.

---

# 17. POS — MOBILE FIRST

The POS must be extremely fast on mobile.

Recommended mobile flow:

```text
Sales / POS

Customer
[ Optional name ]

Select Rice

[ Princess Bea ]
25 KG
100 sacks

[ Hasmin Blue ]
25 KG
60 sacks

Selected Items

Princess Bea
25 KG × 5

Price
₱____

Total
₱____

Payment
[ Cash ▼ ]

[ Complete Sale ]
```

Avoid making the cashier scroll through unnecessary information.

---

# 18. MOBILE POS PRODUCT SELECTION

Rice selection should be easy to tap.

Use a grid:

```text
┌────────────┐ ┌────────────┐
│   IMAGE    │ │   IMAGE    │
│ Princess   │ │ Hasmin     │
│ Bea        │ │ Blue       │
│ 25 KG      │ │ 25 KG      │
│ 100 sacks  │ │ 60 sacks   │
└────────────┘ └────────────┘
```

On very narrow screens:

Use one or two columns depending on available width.

Do not make product cards too small.

---

# 19. POS CART

On mobile, the selected items should remain easy to review.

Example:

```text
Selected Items

Princess Bea
25 KG
5 sacks × ₱1,350

Total
₱6,750
```

If there are multiple items, use expandable rows or a compact cart.

The final total should always be easy to find.

---

# 20. MOBILE POS CONFIRMATION

Before completing a sale:

```text
Confirm Sale

Princess Bea
25 KG × 20 sacks

Current Stock
100 sacks

After Sale
80 sacks

Total
₱27,000

Payment
₱27,000

[ Cancel ]

[ Complete Sale ]
```

The user must understand the inventory impact before confirming.

---

# 21. DELIVERY RECEIVED

Mobile layout:

```text
Delivery Received

Date
[ Today ]

Supplier Name
[____________]

Rice
[ Select Rice ]

Rice Type
[____________]

Variety
[____________]

Batch Number
[____________]

Quantity
[____________]

Sack Size
[25 KG ▼]

Price per Sack
[____________]

Payment
...

[ Save Delivery ]
```

Do not make the mobile form unnecessarily long by placing unrelated fields side-by-side.

Use logical sections.

---

# 22. PALAY RECEIVED

Clearly distinguish Palay from rice.

Mobile:

```text
Palay Received

Farmer Name
[____________]

Rice Name
[ Select ]

Variety
[____________]

Quantity
[____] KG

Price per KG
[₱____]

Total
₱____

Payment
...

[ Save Palay Receipt ]
```

Palay must always communicate KG.

Do not display palay using sack counts.

---

# 23. REBAGGING — MOBILE FIRST

This is a high-risk inventory operation.

Make the workflow extremely clear.

First screen:

```text
Rebagging

What are you processing?

[ RICE → RICE ]

[ PALAY → RICE ]
```

Do not combine both workflows into one form.

---

# 24. RICE → RICE

Mobile:

```text
RICE → RICE

FROM

Princess Bea
50 KG

Quantity
[ 10 ] sacks

Total
500 KG

↓

TO

Hasmin
25 KG

Output
20 sacks

Total
500 KG
```

Then:

```text
Inventory Impact

Princess Bea
20 → 10 sacks

Hasmin
10 → 30 sacks
```

Then:

```text
[ Cancel ]

[ Confirm Rebagging ]
```

This before/after comparison is important.

---

# 25. PALAY → RICE

Mobile:

```text
PALAY → RICE

Palay

Dinorado
1,000 KG

Input
[ 1000 ] KG

↓

Rice

Dinorado
25 KG

Output
28 sacks
700 KG

Yield
70%

Loss
300 KG
```

The calculation should be visually understandable.

Do not require users to perform manual calculations.

---

# 26. TRANSFER TO RESELLER

The UI must clearly communicate:

```text
MY WAREHOUSE
      ↓
RESELLER
```

Mobile form:

```text
Transfer to Reseller

Reseller Name
[____________]

Rice
[ Select ]

Sack Size
[25 KG ▼]

Quantity
[____]

Price per Sack
[₱____]

Total
₱____

Payment
[ Paid ▼ ]

Amount Paid
[₱____]

Balance
₱____

[ Continue ]
```

Then show confirmation:

```text
Transfer Summary

FROM
My Warehouse

TO
ABC Reseller

Princess Bea
25 KG × 20 sacks

Current Stock
100 sacks

After Transfer
80 sacks

Total
₱27,000

Paid
₱10,000

Balance
₱17,000

[ Confirm Transfer ]
```

---

# 27. CUSTOMER CREDITS

Mobile credit list:

```text
Customer Credits

Juan Dela Cruz
Sale
₱20,000
Balance: ₱10,000
● Partially Paid

Maria Santos
Transfer
₱15,000
Balance: ₱15,000
● Open
```

Tap an item to view details.

Do not require a large table on mobile.

Desktop can use a table.

---

# 28. CREDIT PAYMENT

Mobile:

```text
Credit Payment

Juan Dela Cruz

Outstanding
₱10,000

Payment Amount
[₱____]

Payment Method
[ Cash ▼ ]

Remaining
₱5,000

[ Record Payment ]
```

The system must prevent overpayment.

---

# 29. TRANSACTION LISTS

On mobile, prefer compact list items over wide tables.

Example:

```text
SAL-20260324-0001
Juan Dela Cruz
5 × Princess Bea
₱27,000
● Paid
Today, 2:15 PM
```

Tap to open full details.

On desktop, use tables.

This is a key responsive behavior.

---

# 30. TABLE RESPONSIVENESS RULE

Never blindly squeeze desktop tables into mobile.

For every table ask:

> Can this become a useful mobile list?

If yes, use a mobile list.

If not:

* allow controlled horizontal scrolling
* keep important columns visible
* provide detail view

Do not reduce font size to the point where the table becomes unreadable.

---

# 31. REPORTS — MOBILE

Reports should prioritize:

```text
Report

Date
[ From ] [ To ]

[ Apply ]

Summary

Sales
₱...

Transactions
...

Results
```

On mobile, report rows should become cards/list items.

On desktop, use tables.

Export actions should remain accessible but secondary.

---

# 32. USERS & ROLES

Mobile should use a simple list:

```text
Users

Maria Santos
Secretary
● Active

Juan Cruz
Manager
● Active
```

Tap to view/edit.

Desktop can use a full table.

Do not expose unnecessary administrative complexity.

---

# 33. SETTINGS

Settings should be organized into simple sections:

```text
Settings

Company
Company Name
Logo

Inventory
Low Stock Threshold
Sack Sizes

System
Currency

Account
User Preferences
```

On mobile, use stacked sections.

---

# 34. RESPONSIVE MODALS

Avoid large desktop dialogs on mobile.

On mobile:

* use bottom sheets
* full-screen dialogs
* or near-full-screen modal panels

for complex interactions.

On desktop:

* use centered dialogs
* drawers
* or compact modals

Do not create a tiny modal inside a tiny mobile screen.

---

# 35. RESPONSIVE DRAWERS

Drawers should adapt:

### Mobile

Full or near-full width.

### Tablet

Approximately 70–80% maximum width.

### Desktop

Compact side drawer.

Never make users struggle to interact with a narrow drawer.

---

# 36. BUTTON RESPONSIVENESS

Mobile primary actions should generally be easy to reach.

For important transaction pages, use a sticky bottom action area when appropriate:

```text
┌───────────────────────────────┐
│ [ Cancel ] [ Complete Sale ] │
└───────────────────────────────┘
```

The action bar must not cover important content.

On desktop, use normal action placement.

---

# 37. STICKY MOBILE ACTIONS

Use sticky bottom actions for high-value workflows such as:

* Complete Sale
* Save Delivery
* Save Palay
* Confirm Rebagging
* Confirm Palay Conversion
* Confirm Transfer
* Record Credit Payment

Do not make every page have a sticky footer.

Use it only when it improves completion speed.

---

# 38. MOBILE HEADER

Keep the header compact.

Recommended:

```text
☰
Page Title
        👤
```

Avoid oversized headers.

The header should not consume half the screen.

---

# 39. MOBILE SEARCH

Search fields should be:

* easy to tap
* large enough to type into
* placed close to the content being searched

Example:

```text
Inventory

[ 🔍 Search rice... ]

[ Stock ▼ ]
```

Filters can open as a bottom sheet on mobile.

On desktop, filters can appear inline.

---

# 40. RESPONSIVE FILTERS

Mobile:

```text
[ Filters ]
```

opens:

```text
Filters

Date
Status
Rice
Sack Size

[ Reset ]

[ Apply Filters ]
```

Desktop:

```text
Date [____] [____]
Rice [____]
Status [____]
[Apply]
```

Do not force a large filter bar onto mobile.

---

# 41. EMPTY STATES

Keep them simple.

Mobile:

```text
No sales yet

Sales recorded today
will appear here.

[ Create Sale ]
```

Do not use:

* illustrations
* cartoons
* AI artwork
* huge empty graphics

---

# 42. ERROR MESSAGES

Errors must be readable on mobile.

Bad:

```text
Error 409
```

Good:

```text
Cannot complete sale.

Only 8 sacks are available.
You entered 12.

Reduce the quantity and try again.
```

Errors should appear near the relevant field whenever possible.

---

# 43. SUCCESS MESSAGES

Use concise mobile-friendly confirmation:

```text
Sale completed

SAL-20260324-0001
```

Do not create large success pages.

Do not use confetti.

Do not use animations that slow down the workflow.

---

# 44. LOADING STATES

Mobile network conditions may vary.

Loading states must be obvious.

Use:

```text
[ Saving... ]
```

or a small spinner.

Prevent duplicate submissions.

Disable the submit button while the transaction is being processed.

---

# 45. OFFLINE / NETWORK ERROR UX

If a network request fails:

```text
Unable to save.

Please check your internet connection
and try again.

Your transaction was not confirmed.
```

Never imply a transaction succeeded when the server did not confirm it.

For critical inventory operations, always show the server-confirmed result.

---

# 46. TYPOGRAPHY

Use a clean, highly readable sans-serif font.

Prioritize readability over visual personality.

Recommended approximate hierarchy:

```text
Page title
22–28px

Section title
18–20px

Body
14–16px

Table/list
13–15px

Secondary text
12–14px
```

Do not use extremely small text on mobile.

Do not use giant headings.

---

# 47. SPACING

Use consistent spacing.

Mobile needs enough spacing for touch.

But do not create excessive empty areas.

The goal is:

> Comfortable, not spacious for the sake of being spacious.

---

# 48. BORDER RADIUS

Use moderate rounding.

Recommended visual direction:

* small to medium radius
* consistent throughout the application
* status pills only where appropriate

Avoid:

```text
Everything = giant rounded pill
```

Avoid excessive "bubble" UI.

---

# 49. SHADOWS

Use shadows sparingly.

Prefer:

* borders
* spacing
* background contrast

Use subtle shadows only when necessary for:

* menus
* drawers
* dialogs
* elevated controls

Do not make every card float.

---

# 50. COLOR SYSTEM

Use a restrained palette.

Foundation:

* neutral background
* white surfaces
* dark readable text
* muted secondary text
* subtle borders

Semantic colors:

* Green → Paid / Completed / In Stock
* Amber → Pending / Partial / Low Stock
* Red → Error / Unpaid / Out of Stock / Rejected
* Neutral → Draft / Inactive

Do not use color as the only way to communicate meaning.

---

# 51. NO GRADIENT-HEAVY DESIGN

Do not use gradients as the primary UI style.

Avoid:

```text
Purple → Blue gradient
Blue → Pink gradient
Neon backgrounds
```

A subtle accent color is enough.

---

# 52. ICON SYSTEM

Use one consistent icon library.

Icons should support recognition.

Do not:

* use random icon styles
* use emojis as UI icons
* put icons beside every label
* use decorative icons everywhere

Every icon should have a purpose.

---

# 53. RESPONSIVE CARD SYSTEM

Cards should change behavior according to screen size.

### Mobile

Cards may be full-width.

### Tablet

Cards can use two columns.

### Desktop

Cards may use three or four columns where appropriate.

Example:

```text
Mobile

[ Princess Bea ]

[ Hasmin Blue ]

Tablet

[ Princess Bea ] [ Hasmin Blue ]

Desktop

[ Princess Bea ] [ Hasmin Blue ] [ Dinorado ]
```

Do not force cards into a fixed width that breaks smaller screens.

---

# 54. RESPONSIVE GRID

Use fluid layouts.

Avoid fixed widths such as:

```text
width: 500px
```

for major application content.

Prefer:

* responsive grids
* max-width containers
* flexible columns
* min/max sizing
* CSS grid
* flexbox

The UI must adapt naturally.

---

# 55. CONTENT PRIORITY

When screen space becomes limited, hide or collapse **secondary information first**.

Never hide:

* total amount
* quantity
* inventory availability
* payment balance
* transaction status
* primary action
* important warnings

Example:

Mobile may hide:

```text
Created At
Updated At
Processed By
```

inside transaction details.

But it must always show:

```text
Total
Status
Quantity
Primary action
```

---

# 56. PROGRESSIVE DISCLOSURE

Do not show every detail at once.

Example transaction list:

```text
SAL-0001
Juan Dela Cruz
₱27,000
● Paid
```

Tap:

```text
Full Transaction Details
```

Then show:

* items
* quantities
* prices
* payment
* processed by
* timestamps
* audit information

This keeps mobile interfaces clean.

---

# 57. MOBILE-FIRST INVENTORY SAFETY

Inventory-changing operations must display before/after quantities.

For sales:

```text
Before
100 sacks

Sale
20 sacks

After
80 sacks
```

For transfer:

```text
Before
100 sacks

Transfer
20 sacks

After
80 sacks
```

For rebagging:

```text
FROM
10 × 50 KG
500 KG

TO
20 × 25 KG
500 KG
```

For palay conversion:

```text
Palay Input
1,000 KG

Rice Output
700 KG

Loss
300 KG
```

Never hide these calculations behind a desktop-only interface.

---

# 58. MOBILE DATA ENTRY

Use the correct mobile input types.

Examples:

* numeric keyboard for quantities
* decimal keyboard for money
* date picker for dates
* select controls for predefined options

Do not make staff type values unnecessarily.

Use automatic calculations for:

* totals
* balances
* KG conversion
* yield
* remaining stock

---

# 59. MOBILE KEYBOARD BEHAVIOR

When the mobile keyboard opens:

* focused input must remain visible
* important buttons must not be hidden
* page should scroll naturally
* avoid broken fixed elements
* avoid fields being hidden behind the keyboard

Test all important forms on actual mobile-sized layouts.

---

# 60. DESKTOP ENHANCEMENT

Desktop should not simply be the mobile UI stretched across a large screen.

Use the extra space intelligently.

Desktop can provide:

* persistent sidebar
* multi-column forms
* richer tables
* side-by-side summaries
* larger inventory grids
* wider transaction detail layouts

But the underlying workflow must remain the same.

---

# 61. TABLET ENHANCEMENT

Tablet should be treated as a first-class layout.

Do not treat tablet as either:

> "small desktop"

or

> "large phone."

Use tablet space intelligently:

* two-column forms
* two-column product grids
* compact navigation
* readable tables
* split views where useful

---

# 62. ORIENTATION

Support both:

* portrait
* landscape

where practical.

POS and inventory should remain usable in either orientation.

Do not require landscape mode for normal operations unless absolutely necessary.

---

# 63. ACCESSIBILITY

Maintain:

* sufficient contrast
* readable font sizes
* visible focus
* keyboard navigation
* touch-friendly controls
* proper labels
* semantic HTML
* screen-reader-friendly form controls

Do not rely on color alone.

Example:

Bad:

```text
● Green
```

Better:

```text
● Paid
```

---

# 64. ROLE-BASED UI

Only show users the functions they are allowed to use.

Roles:

* SUPER_ADMIN
* OWNER
* MANAGER
* SECRETARY
* OTHER_STAFF

However:

> UI visibility is not security.

Supabase RLS and database authorization remain the real security boundary.

---

# 65. BUSINESS MODULE NAVIGATION

Use exactly these modules:

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

Do not invent additional modules.

Do not add:

* Suppliers
* Customers
* Farmers
* Resellers
* Warehouses
* Expenses
* Payroll
* Accounting
* Cash Management
* Purchase Orders
* Purchase Invoices

---

# 66. ONE-WAREHOUSE CONCEPT

The application has exactly one warehouse.

The UI must never imply multiple warehouses.

Use:

> My Warehouse

when referring to the source of reseller transfers.

Correct:

```text
My Warehouse → Reseller
```

Incorrect:

```text
Warehouse A → Warehouse B
```

---

# 67. MOBILE PAGE FLOW

Every operational page should generally follow:

```text
Page Header
      ↓
Context
      ↓
Input / Selection
      ↓
Review
      ↓
Confirmation
      ↓
Success
```

Avoid unnecessary pages.

---

# 68. TRANSACTION CONFIRMATION

Before important operations, show a concise summary.

Example:

```text
Confirm Transfer

ABC Reseller

Princess Bea
25 KG × 20 sacks

Total
₱27,000

Paid
₱10,000

Balance
₱17,000

Stock
100 → 80 sacks

[Cancel] [Confirm]
```

On mobile, this can use a full-screen confirmation view or bottom sheet.

On desktop, use a modal or confirmation panel.

---

# 69. NO UNNECESSARY DASHBOARD CHARTS

Charts are optional.

Only add a chart if it provides useful business information.

Do not add charts merely to make the dashboard look impressive.

Tables and numbers are often more useful for this business.

---

# 70. REPORT RESPONSIVENESS

Mobile:

```text
Report Filters
↓
Summary
↓
Transaction List
```

Desktop:

```text
Filters
↓
Summary
↓
Full Table
```

If the report has many columns, provide a detail view rather than making the mobile table unreadable.

---

# 71. PERFORMANCE UX

The application should feel fast.

Prioritize:

* fast navigation
* fast page rendering
* optimistic UI only where safe
* loading states
* pagination
* lazy loading for large lists
* optimized rice images

Do NOT use animations to hide slow performance.

---

# 72. IMAGE RESPONSIVENESS

Rice product images must:

* preserve aspect ratio
* load efficiently
* have sensible dimensions
* use thumbnails where appropriate
* use larger images only when needed

Do not load huge original images into every mobile card.

---

# 73. MOBILE IMAGE SIZES

Inventory/product cards should use appropriately sized images.

Do not allow one large rice sack image to consume most of a phone screen.

The image should identify the product, not dominate the interface.

---

# 74. FORMS SHOULD REMEMBER CONTEXT

Where appropriate:

* default date to today
* remember the selected rice while adding quantities
* preserve form data when validation fails
* show available stock immediately

Do not make users repeatedly re-enter information unnecessarily.

---

# 75. VALIDATION

Validate both:

### Frontend

For immediate feedback.

### Database

For actual security and data integrity.

The frontend must never assume that its validation is sufficient.

---

# 76. TRANSACTION SAFETY

For all inventory-changing operations:

```text
Input
 ↓
Review
 ↓
Server validation
 ↓
Database transaction
 ↓
Success
```

The UI must not pretend inventory was changed until the server confirms it.

---

# 77. ERROR RECOVERY

If a transaction fails:

Do not clear the user's entire form unnecessarily.

Show:

```text
The transaction could not be completed.

No inventory was changed.

Please correct the issue and try again.
```

If the database rejected the operation because of insufficient inventory, clearly explain the actual available quantity.

---

# 78. EMPTY STATES

Every list should have a useful empty state.

Example:

```text
No reseller transfers yet.

Transfers from your warehouse
will appear here.

[ Create Transfer ]
```

Keep it simple.

---

# 79. NO DECORATIVE EMPTY STATES

Do not use:

* cartoon graphics
* AI illustrations
* large decorative icons
* motivational messages

The user wants to work, not admire the empty state.

---

# 80. MOBILE-FIRST DESIGN SYSTEM

Create reusable components such as:

```text
AppShell
MobileHeader
DesktopSidebar
MobileBottomNav
PageHeader
SectionHeader
Button
Input
Select
DatePicker
MoneyInput
QuantityInput
StatusBadge
RiceProductCard
InventoryCard
TransactionListItem
DataTable
FilterSheet
ConfirmSheet
ConfirmDialog
BottomSheet
Drawer
Toast
EmptyState
ErrorState
LoadingState
TransactionSummary
InventoryImpact
```

These components should have responsive behavior built into them.

---

# 81. TAILWIND CSS

Use Tailwind CSS.

Build a consistent design system.

Use responsive utility classes and responsive layout patterns.

Prefer mobile-first Tailwind conventions:

```text
base styles
sm:
md:
lg:
xl:
2xl:
```

Do not write desktop styles first and then patch mobile afterward.

---

# 82. RESPONSIVE BREAKPOINT PHILOSOPHY

Do not blindly design around arbitrary device names.

Design around content needs.

Use breakpoints when:

> The current layout stops being comfortable.

For example:

* product grid changes from 1 → 2 columns
* navigation changes from drawer → sidebar
* form changes from 1 → 2 columns
* list changes to table
* filters change from sheet → inline

Responsive behavior should be based on usability.

---

# 83. DESIGN FOR VARIABLE SCREEN WIDTH

The UI must remain usable between defined breakpoints.

Do not assume only:

```text
Mobile
Tablet
Desktop
```

There are many widths in between.

Use fluid layouts where appropriate.

Avoid rigid fixed widths.

---

# 84. LARGE SCREEN BEHAVIOR

On very large monitors, do not stretch content indefinitely.

Use sensible max-width containers.

Example:

```text
┌─────────────────────────────────────────────┐
│                                             │
│           Main Application Content          │
│                                             │
└─────────────────────────────────────────────┘
```

Do not create extremely wide text lines or tables simply because the monitor is large.

---

# 85. MOBILE SAFE AREAS

Ensure important controls are not placed too close to:

* screen edges
* browser controls
* device safe areas

Respect mobile safe-area behavior where applicable.

---

# 86. NO HORIZONTAL PAGE SCROLL

The application itself should not require horizontal page scrolling.

Horizontal scrolling may be acceptable inside intentionally scrollable tables.

Never allow accidental horizontal overflow caused by:

* fixed-width cards
* oversized buttons
* long text
* large images
* rigid grids

---

# 87. LONG TEXT

Long names such as:

* rice varieties
* reseller names
* customer names
* transaction notes

must wrap or truncate gracefully.

Do not break the layout.

Use detail views when the full text is needed.

---

# 88. NUMBERS

Numbers must remain easy to read.

Examples:

```text
100 sacks
8 KG
₱27,000.00
70%
```

Right-align numeric values in desktop tables where appropriate.

On mobile cards, use strong visual hierarchy for totals and balances.

---

# 89. STATUS DESIGN

Use text plus restrained color.

Examples:

```text
● Paid
● Partially Paid
● Unpaid

● In Stock
● Low Stock
● Out of Stock

● Completed
● Pending
```

Do not rely on colored dots alone.

---

# 90. PRODUCT SELECTION UX

When selecting rice, always show:

```text
Rice Name
Image
Sack Size
Available Quantity
```

Example:

```text
Princess Bea

25 KG
Available: 100 sacks
```

This prevents staff from accidentally selecting the wrong product or sack size.

---

# 91. SACK SIZE UX

Supported sizes:

* 25 KG
* 50 KG
* Other

For "Other", clearly display the actual KG value.

Example:

```text
Other
30 KG
```

Never display only:

```text
Other
```

because the user needs to know the actual sack weight.

---

# 92. REJECTED STOCK

Rejected stock must be visually separated from sellable stock.

Example:

```text
Available
100 sacks

Rejected
2 sacks
```

Never make rejected stock look like available inventory.

---

# 93. PALAY AND RICE SEPARATION

The interface must visually distinguish:

```text
RICE
Sacks + KG

PALAY
KG
```

Never mix the two units in a confusing inventory display.

---

# 94. AUDIT INFORMATION

Transaction details should expose useful accountability information:

```text
Processed By
Confirmed By
Date
Time
Transaction Number
```

Do not clutter the list screen with every audit field.

Show detailed audit information inside the transaction detail view.

---

# 95. MOBILE DETAIL PAGES

When a user taps a transaction:

Show:

```text
Transaction Number
Status

Party
Date

Items

Payment

Inventory Impact

Processed By

Notes
```

Use sections with clear headings.

Avoid nested cards everywhere.

---

# 96. DESIGN LANGUAGE

Use simple language.

Prefer:

```text
Save Delivery
Complete Sale
Confirm Transfer
Record Payment
```

Avoid:

```text
Execute Transaction
Initiate Workflow
Finalize Operational Process
```

The software should speak the language of the business user.

---

# 97. BUTTON LANGUAGE

Buttons must describe the action.

Good:

```text
Save Delivery
Confirm Transfer
Complete Sale
Record Payment
```

Bad:

```text
Submit
Continue
Execute
Process
Action
```

Use generic labels only when the context is absolutely clear.

---

# 98. CONFIRMATION LANGUAGE

Do not use technical language.

Good:

```text
Confirm Transfer?

20 sacks of Princess Bea will be removed
from your warehouse inventory.
```

Bad:

```text
Execute inventory mutation?
```

---

# 99. MOBILE-FIRST UX TEST

Before considering a screen complete, test it at:

```text
320px
375px
390px
430px
```

Ask:

* Can I read everything important?
* Can I tap every button?
* Can I complete the workflow with one hand where practical?
* Does the keyboard hide important fields?
* Is the total visible?
* Is inventory availability visible?
* Can I understand what happens after confirmation?
* Is there accidental horizontal scrolling?

Then test:

```text
768px
1024px
1280px
1440px+
```

Ask:

* Is the layout using the extra space intelligently?
* Are tables readable?
* Is navigation efficient?
* Are forms unnecessarily stretched?
* Is content too wide?

---

# 100. FINAL UX TEST

Before declaring any page finished, ask:

### 1. Can a new staff member understand it within 10 seconds?

### 2. Is the primary action obvious?

### 3. Can the workflow be completed comfortably on a phone?

### 4. Does the same workflow become more efficient on tablet and desktop?

### 5. Does the layout adapt rather than simply shrink?

### 6. Can users clearly see important quantities and money?

### 7. Can users understand inventory impact before confirming?

### 8. Are errors understandable?

### 9. Is anything decorative but unnecessary?

### 10. Can anything be removed without hurting usability?

If something can be removed without reducing functionality or clarity:

> Remove it.

---

# 101. FINAL MIMO IMPLEMENTATION INSTRUCTION

Build the entire UI/UX using this constitution.

The application must be:

> **Mobile-first. Responsive. Simple. Clear. Minimalist. Fast. Practical.**

The desktop experience must be an enhancement of the mobile experience, not the other way around.

Use the existing Brick Eight Trading Inc. business requirements.

Do not invent unnecessary modules.

Do not add unnecessary features.

Do not add AI functionality.

Do not create a generic SaaS dashboard.

Do not create a marketing website.

Do not use fake data merely to make screens look impressive.

Do not sacrifice usability for visual effects.

Do not sacrifice database-driven business rules for frontend convenience.

The final application should feel like a mature operational system used every day by:

* cashiers
* warehouse staff
* secretaries
* managers
* owners

The interface should help them perform their work quickly and accurately.

### The final design principle:

> **Simple on mobile. Efficient on desktop. Clear everywhere.**

And above everything:

> **Make the correct action obvious and the wrong action difficult.**
