# VendorBridge — Antigravity IDE Master Build Prompt
### Procurement & Vendor Management ERP · Hackathon Edition
---

> **How to use this document:** Copy everything from the horizontal rule below through to the end of the file and paste it directly into Antigravity IDE as your opening prompt. Attach your PDF documentation alongside it.

---

---

## SYSTEM CONTEXT

You are a Principal Full-Stack Engineer building **VendorBridge**, a production-grade Procurement & Vendor Management ERP for a hackathon submission. Every decision must reflect awareness of performance tradeoffs, clean modular architecture, and low-latency data interactions. Code quality will be judged by experienced engineers. Do not take shortcuts that produce unmaintainable output. This is a high-stakes build.

Work through each phase sequentially. Do not skip phases. Confirm completion of each phase before starting the next. If any phase produces errors, fix them before continuing.

---

## PART 1 — TECH STACK SPECIFICATION

Use exactly the following stack. Do not substitute or deviate.

### Frontend
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui component library
- **State Management:** Zustand (global state) + React Query / TanStack Query (server state & caching)
- **Forms:** React Hook Form + Zod (schema validation)
- **PDF Generation:** `@react-pdf/renderer` (client-side invoice rendering)
- **Charts/Analytics:** Recharts
- **Email:** Nodemailer (via API route, server-side only)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js via Next.js API Routes (App Router `route.ts` handlers)
- **ORM:** Prisma ORM
- **Database:** PostgreSQL (local dev via Docker; use connection pooling via `pgBouncer`-compatible `DATABASE_URL`)
- **Authentication:** NextAuth.js v5 (credentials provider + JWT sessions)
- **Authorization:** Custom RBAC middleware layer (do not use NextAuth roles alone)
- **File Storage:** Local filesystem for dev (`/uploads`); abstract behind a `StorageService` interface for easy swap to S3
- **PDF Email Attachment:** Generate PDF buffer server-side using `pdf-lib` or `puppeteer` (choose one and be consistent)
- **Validation:** Zod schemas shared between frontend and backend
- **Rate Limiting:** `upstash/ratelimit` or a simple in-memory rate limiter middleware

### Infrastructure (Dev)
- Docker Compose: PostgreSQL + pgAdmin
- `.env.local` for secrets (never commit)
- `prisma/seed.ts` for deterministic test data

### Folder Structure (enforce strictly)
```
/app
  /api          ← Next.js API routes
  /(auth)       ← Login / Signup pages
  /(dashboard)  ← All protected app routes
/components
  /ui           ← shadcn primitives
  /modules      ← Feature-specific reusable components
/lib
  /prisma.ts    ← Prisma client singleton
  /auth.ts      ← NextAuth config
  /rbac.ts      ← Role guard middleware
  /validations  ← Zod schemas (shared)
  /services     ← Business logic (VendorService, RFQService, etc.)
  /utils        ← Pure utility functions
/prisma
  schema.prisma
  seed.ts
/types          ← Global TypeScript types & enums
```

---

## PART 2 — DATABASE SCHEMA (PRISMA ERD)

Implement exactly this schema in `prisma/schema.prisma`. Every relation must be explicit. Use UUIDs for all primary keys (`@default(uuid())`). Add `createdAt` and `updatedAt` to every model.

```prisma
// ─── ENUMS ───────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  PROCUREMENT_OFFICER
  VENDOR
  MANAGER
}

enum VendorStatus {
  PENDING
  APPROVED
  BLACKLISTED
}

enum RFQStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
}

enum QuotationStatus {
  SUBMITTED
  UNDER_REVIEW
  ACCEPTED
  REJECTED
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum PurchaseOrderStatus {
  DRAFT
  CONFIRMED
  DELIVERED
  CANCELLED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
}

// ─── MODELS ──────────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          Role      @default(PROCUREMENT_OFFICER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  vendor        Vendor?
  rfqsCreated   RFQ[]             @relation("RFQCreator")
  approvals     Approval[]
  activityLogs  ActivityLog[]
}

model Vendor {
  id            String        @id @default(uuid())
  userId        String        @unique
  user          User          @relation(fields: [userId], references: [id])
  companyName   String
  category      String
  gstNumber     String?
  panNumber     String?
  address       String?
  phone         String?
  status        VendorStatus  @default(PENDING)
  rating        Float?        @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  rfqVendors    RFQVendor[]
  quotations    Quotation[]
  purchaseOrders PurchaseOrder[]
}

model RFQ {
  id            String      @id @default(uuid())
  rfqNumber     String      @unique  // e.g. RFQ-2024-0001
  title         String
  description   String?
  deadline      DateTime
  status        RFQStatus   @default(DRAFT)
  createdById   String
  createdBy     User        @relation("RFQCreator", fields: [createdById], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  items         RFQItem[]
  vendors       RFQVendor[]
  quotations    Quotation[]
  attachments   Attachment[]
}

model RFQItem {
  id          String  @id @default(uuid())
  rfqId       String
  rfq         RFQ     @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  name        String
  description String?
  quantity    Float
  unit        String  @default("units")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RFQVendor {
  id        String   @id @default(uuid())
  rfqId     String
  vendorId  String
  rfq       RFQ      @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  vendor    Vendor   @relation(fields: [vendorId], references: [id])
  invitedAt DateTime @default(now())

  @@unique([rfqId, vendorId])
}

model Quotation {
  id              String          @id @default(uuid())
  quotationNumber String          @unique  // e.g. QT-2024-0001
  rfqId           String
  vendorId        String
  rfq             RFQ             @relation(fields: [rfqId], references: [id])
  vendor          Vendor          @relation(fields: [vendorId], references: [id])
  status          QuotationStatus @default(SUBMITTED)
  subtotal        Float
  taxRate         Float           @default(0)
  taxAmount       Float           @default(0)
  totalAmount     Float
  deliveryDays    Int
  validUntil      DateTime
  notes           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  items           QuotationItem[]
  approval        Approval?
  purchaseOrder   PurchaseOrder?
}

model QuotationItem {
  id           String    @id @default(uuid())
  quotationId  String
  quotation    Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  rfqItemId    String
  name         String
  quantity     Float
  unitPrice    Float
  totalPrice   Float
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Approval {
  id            String         @id @default(uuid())
  quotationId   String         @unique
  quotation     Quotation      @relation(fields: [quotationId], references: [id])
  approverId    String
  approver      User           @relation(fields: [approverId], references: [id])
  status        ApprovalStatus @default(PENDING)
  remarks       String?
  requestedAt   DateTime       @default(now())
  resolvedAt    DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model PurchaseOrder {
  id          String              @id @default(uuid())
  poNumber    String              @unique  // e.g. PO-2024-0001
  quotationId String              @unique
  vendorId    String
  quotation   Quotation           @relation(fields: [quotationId], references: [id])
  vendor      Vendor              @relation(fields: [vendorId], references: [id])
  status      PurchaseOrderStatus @default(DRAFT)
  totalAmount Float
  deliveryDate DateTime?
  terms       String?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  invoice     Invoice?
}

model Invoice {
  id              String        @id @default(uuid())
  invoiceNumber   String        @unique  // e.g. INV-2024-0001
  purchaseOrderId String        @unique
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  status          InvoiceStatus @default(DRAFT)
  subtotal        Float
  taxRate         Float
  taxAmount       Float
  totalAmount     Float
  dueDate         DateTime
  paidAt          DateTime?
  emailSentAt     DateTime?
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model Attachment {
  id        String   @id @default(uuid())
  rfqId     String
  rfq       RFQ      @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  filename  String
  path      String
  mimeType  String
  size      Int
  createdAt DateTime @default(now())
}

model ActivityLog {
  id          String   @id @default(uuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  action      String   // e.g. "RFQ_CREATED", "QUOTATION_SUBMITTED", "PO_GENERATED"
  entityType  String   // e.g. "RFQ", "QUOTATION", "INVOICE"
  entityId    String?
  metadata    Json?    // flexible payload for additional context
  ipAddress   String?
  createdAt   DateTime @default(now())
}
```

After writing the schema, run:
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

---

## PART 3 — SEED DATA (`prisma/seed.ts`)

Create deterministic seed data with:
- 1 Admin user (`admin@vendorbridge.com` / `Admin@123`)
- 2 Procurement Officers (`officer1@vendorbridge.com`, `officer2@vendorbridge.com` / `Officer@123`)
- 1 Manager (`manager@vendorbridge.com` / `Manager@123`)
- 3 Vendors (`vendor1@vendorbridge.com`, `vendor2@vendorbridge.com`, `vendor3@vendorbridge.com` / `Vendor@123`)
- 2 RFQs in PUBLISHED status with 3 items each, all 3 vendors invited
- 1 RFQ with submitted quotations from all 3 vendors (for the comparison screen demo)
- 1 approved quotation → 1 PO → 1 Invoice (full happy-path chain)

Use `bcryptjs` to hash all passwords with salt rounds of 12.

---

## PART 4 — RBAC MIDDLEWARE (`/lib/rbac.ts`)

Implement a reusable RBAC guard. This is critical — every API route must use it.

```typescript
// /lib/rbac.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export type AuthenticatedRequest = Request & {
  user: { id: string; email: string; role: Role; name: string };
};

export function withRBAC(
  handler: (req: AuthenticatedRequest, ctx: any) => Promise<NextResponse>,
  allowedRoles: Role[]
) {
  return async (req: Request, ctx: any) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    (req as AuthenticatedRequest).user = session.user as any;
    return handler(req as AuthenticatedRequest, ctx);
  };
}
```

---

## PART 5 — SERVICE LAYER

Create a service class for each domain entity in `/lib/services/`. Each service must:
- Contain all business logic (no business logic in API routes)
- Use Prisma transactions for multi-table writes
- Throw typed errors that API routes can catch and format
- Log all mutations to `ActivityLog` automatically

Services to implement:
- `VendorService` — CRUD, status transitions, rating calculation
- `RFQService` — CRUD, sequence number generation (`RFQ-YYYY-NNNN`), status transitions, vendor assignment
- `QuotationService` — submission, edit, comparison data aggregation, status transitions
- `ApprovalService` — approve/reject state machine, timeline tracking
- `PurchaseOrderService` — generate from approved quotation, sequence number generation (`PO-YYYY-NNNN`)
- `InvoiceService` — generate from PO, tax calculation, PDF buffer generation, email dispatch, sequence number generation (`INV-YYYY-NNNN`)
- `AnalyticsService` — aggregate queries for dashboard KPIs and reports (use Prisma `groupBy` and `aggregate`)
- `ActivityLogService` — write-only service, called by all other services

**Sequence number generation pattern (use for all RFQ/QT/PO/INV numbers):**
```typescript
async function generateSequenceNumber(prefix: string, model: any): Promise<string> {
  const year = new Date().getFullYear();
  const count = await model.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } }
  });
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}
```

---

## PART 6 — PHASE-BY-PHASE BUILD EXECUTION

Execute these phases in strict order. Each phase ends with a working, testable increment.

---

### PHASE 1 · Foundation & Authentication

**Goal:** Running app with login, session, and role-based redirect.

Tasks:
1. Initialize Next.js 14 project with TypeScript, Tailwind, shadcn/ui
2. Set up Docker Compose for PostgreSQL
3. Write and migrate the full Prisma schema
4. Implement NextAuth.js with credentials provider
   - Hash password comparison with `bcryptjs`
   - JWT session containing `{ id, email, role, name }`
   - Custom session callback to expose `role` to the client
5. Build Login page (`/app/(auth)/login/page.tsx`)
   - Email + password form with Zod validation
   - Error messages for invalid credentials
   - Redirect to `/dashboard` on success
6. Build Signup page (`/app/(auth)/signup/page.tsx`)
   - Role selection (Vendor only for self-registration; other roles by Admin)
   - Validate uniqueness of email before submit
7. Implement Forgot Password page (email-based OTP flow, store OTP in DB with 15-min expiry)
8. Implement route protection middleware (`/middleware.ts`) redirecting unauthenticated users
9. Build the RBAC middleware in `/lib/rbac.ts`
10. Run seed script and confirm all test logins work

**Deliverable:** All 7 test users can log in and see a placeholder dashboard.

---

### PHASE 2 · Dashboard & Layout Shell

**Goal:** Complete app shell with sidebar navigation and live KPI dashboard.

Tasks:
1. Build the authenticated layout (`/app/(dashboard)/layout.tsx`):
   - Collapsible sidebar with role-aware navigation items
   - Top navbar with user avatar, role badge, and logout button
   - Breadcrumb component
2. Build Dashboard page (`/app/(dashboard)/page.tsx`):
   - KPI cards: Total Vendors, Active RFQs, Pending Approvals, Total Invoiced Amount
   - Pending Approvals list (Manager/Admin only)
   - Active RFQs list (Procurement Officer)
   - Recent Purchase Orders table
   - Monthly procurement trend line chart (Recharts)
   - Quick action buttons: "Create RFQ", "Add Vendor", "View Reports"
3. All dashboard data fetched via TanStack Query with 30-second auto-refresh
4. Role-specific widget visibility enforced at render level

**UI Standard:** Use a clean, enterprise aesthetic. Dark sidebar (`#0f172a`), white content area, blue-500 as the primary accent. shadcn Card components for KPIs with subtle shadow. All tables use shadcn DataTable with column sorting.

---

### PHASE 3 · Vendor Management Module

**Goal:** Full vendor lifecycle — registration, review, approval, blacklist.

API Routes (all in `/app/api/vendors/`):
- `GET /api/vendors` — paginated list with search, filter by status/category (ADMIN, PROCUREMENT_OFFICER, MANAGER)
- `POST /api/vendors` — register vendor (ADMIN or self-registration by VENDOR)
- `GET /api/vendors/:id` — vendor detail with quotation history and rating
- `PATCH /api/vendors/:id` — update vendor info (ADMIN or own VENDOR)
- `PATCH /api/vendors/:id/status` — approve/blacklist (ADMIN only)
- `DELETE /api/vendors/:id` — soft delete (ADMIN only)

Frontend Pages:
- `/vendors` — DataTable with search bar, status filter pills, category filter, "Add Vendor" button
- `/vendors/new` — Vendor registration form: company name, category (dropdown), GST number, PAN, address, phone, contact person
- `/vendors/:id` — Vendor detail: info card, status badge, quotation history table, rating display, action buttons (Edit, Change Status)

Validations:
- GST number regex: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
- PAN regex: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- All fields sanitized server-side before DB write

---

### PHASE 4 · RFQ Engine

**Goal:** Full RFQ lifecycle from draft to closed, with vendor assignment.

API Routes:
- `GET /api/rfqs` — paginated, filtered by status and date range
- `POST /api/rfqs` — create RFQ (PROCUREMENT_OFFICER, ADMIN)
- `GET /api/rfqs/:id` — full RFQ detail with items and assigned vendors
- `PATCH /api/rfqs/:id` — update (DRAFT status only)
- `PATCH /api/rfqs/:id/publish` — transition to PUBLISHED, notify vendors (activity log + email)
- `PATCH /api/rfqs/:id/close` — transition to CLOSED
- `POST /api/rfqs/:id/vendors` — add/remove vendors from RFQ
- `POST /api/rfqs/:id/attachments` — file upload (multipart/form-data, max 10MB, pdf/xlsx/jpg)

Frontend Pages:
- `/rfqs` — RFQ list with status filter tabs (All, Draft, Published, Closed)
- `/rfqs/new` — Multi-step form:
  - Step 1: RFQ title, description, deadline
  - Step 2: Add line items (name, description, quantity, unit) — dynamic add/remove rows
  - Step 3: Assign vendors (searchable multi-select from approved vendors only)
  - Step 4: Review & Submit or Save as Draft
- `/rfqs/:id` — RFQ detail: header info, items table, assigned vendors list, status timeline, quotations received count, action buttons

**State Machine Rules (enforce server-side, not just UI):**
```
DRAFT → PUBLISHED (only if at least 1 vendor assigned and 1 item exists)
PUBLISHED → CLOSED (manual by officer or automatic at deadline)
PUBLISHED → CANCELLED (any time before deadline)
DRAFT → CANCELLED (any time)
No other transitions permitted — return 422 with clear error message
```

---

### PHASE 5 · Quotation System

**Goal:** Vendors submit quotations; officers compare them side-by-side.

API Routes:
- `GET /api/rfqs/:id/quotations` — all quotations for an RFQ (PROCUREMENT_OFFICER, MANAGER, ADMIN)
- `POST /api/rfqs/:id/quotations` — submit quotation (VENDOR, must be assigned to RFQ)
- `PATCH /api/quotations/:id` — edit quotation (VENDOR, only if status is SUBMITTED)
- `GET /api/quotations/:id` — single quotation detail
- `GET /api/rfqs/:id/quotations/compare` — comparison data: all quotations for RFQ with lowest price flagged

Frontend Pages:
- `/rfqs/:id/quotations/submit` (Vendor view) — Quotation submission form:
  - Pre-populated with RFQ items; vendor fills unit price per item
  - Auto-calculates subtotal, tax (configurable rate), and total
  - Delivery timeline (days), validity date, notes
  - Edit allowed until quotation is under review
- `/rfqs/:id/compare` (Officer/Manager view) — Comparison table:
  - Columns: Item, [Vendor A price], [Vendor B price], [Vendor C price]
  - Lowest price per item highlighted in green
  - Summary row: Total per vendor, delivery days, validity, rating
  - "Select for Approval" button per vendor column
  - Sort by: Total Price, Delivery Days, Rating

---

### PHASE 6 · Approval State Machine

**Goal:** Structured multi-step approval workflow.

API Routes:
- `POST /api/approvals` — initiate approval for a quotation (PROCUREMENT_OFFICER)
- `GET /api/approvals` — list pending approvals (MANAGER, ADMIN)
- `GET /api/approvals/:id` — approval detail
- `PATCH /api/approvals/:id/approve` — approve with remarks (MANAGER, ADMIN)
- `PATCH /api/approvals/:id/reject` — reject with remarks (MANAGER, ADMIN)

**State Machine (server-enforced):**
```
Quotation.status:  SUBMITTED → UNDER_REVIEW → ACCEPTED | REJECTED
Approval.status:   PENDING → APPROVED | REJECTED

On APPROVED:
  - Quotation.status = ACCEPTED
  - All other Quotation records for same RFQ set to REJECTED
  - RFQ.status = CLOSED
  - Trigger PurchaseOrderService.createFromQuotation()
  - Log to ActivityLog

On REJECTED:
  - Quotation.status = REJECTED
  - Approval.status = REJECTED
  - Log to ActivityLog
```

Frontend Pages:
- `/approvals` — Pending approvals queue with urgency indicators (days since request)
- `/approvals/:id` — Approval detail:
  - Quotation summary card
  - Vendor info card
  - Approval timeline (requested at, resolved at)
  - Approve / Reject action with remarks textarea
  - Remarks required on rejection (min 20 chars)
- Activity timeline component: show all state transitions with timestamps and actor names

---

### PHASE 7 · Purchase Orders & Invoice Generation

**Goal:** Auto-generate PO from approved quotation, then generate PDF invoice.

API Routes:
- `GET /api/purchase-orders` — list POs (PROCUREMENT_OFFICER, MANAGER, ADMIN)
- `GET /api/purchase-orders/:id` — PO detail
- `PATCH /api/purchase-orders/:id/status` — update delivery status
- `GET /api/invoices` — list invoices
- `GET /api/invoices/:id` — invoice detail
- `GET /api/invoices/:id/pdf` — stream PDF buffer (Content-Type: application/pdf)
- `POST /api/invoices/:id/send-email` — generate PDF and send via email attachment (PROCUREMENT_OFFICER, ADMIN)
- `PATCH /api/invoices/:id/mark-paid` — mark invoice as paid

**Invoice PDF Layout (implement with `@react-pdf/renderer`):**
```
Header: VendorBridge logo | Company name | "TAX INVOICE"
Invoice meta: Invoice number | Date | Due date | Status badge
Bill To: Vendor company name, address, GST, PAN
Bill From: Organization details
Items table: Sr | Description | Qty | Unit | Unit Price | Amount
Subtotal row | Tax row (rate and amount) | Total row (bold)
Footer: Terms | "Thank you for your business" | Generated timestamp
```

**Email template:** HTML email with invoice summary and PDF attachment. Use Nodemailer. Support `SMTP_*` environment variables.

Frontend Pages:
- `/purchase-orders` — PO list with status filter
- `/purchase-orders/:id` — PO detail card with line items, vendor info, delivery status, link to invoice
- `/invoices` — Invoice list with status filter (Draft, Sent, Paid, Overdue)
- `/invoices/:id` — Invoice detail page:
  - Invoice preview (styled HTML matching PDF layout)
  - Action buttons: Download PDF | Print | Send via Email
  - Status update controls
  - Email dialog: pre-fill recipient from vendor email, editable subject & body

---

### PHASE 8 · Activity Logs & Notifications

**Goal:** Full audit trail and in-app notification system.

API Routes:
- `GET /api/activity-logs` — paginated, filtered by entityType, action, userId, date range (ADMIN only)
- `GET /api/notifications` — unread notifications for current user
- `PATCH /api/notifications/:id/read` — mark as read

Implement a `Notification` model (separate from ActivityLog):
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  message   String
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

Auto-create notifications for:
- Vendor: RFQ invitation received
- Procurement Officer: Quotation submitted on their RFQ
- Manager: Approval request received
- All relevant parties: Approval resolved
- Vendor: PO generated for their quotation
- Procurement Officer: Invoice marked as paid

Frontend:
- Notification bell icon in navbar with unread count badge
- Dropdown showing last 10 notifications with "mark all read"
- `/activity-logs` page (Admin only) — full audit log DataTable with filters

---

### PHASE 9 · Reports & Analytics

**Goal:** Data-driven procurement insights.

API Routes:
- `GET /api/analytics/dashboard` — KPI aggregates (cached 5 min)
- `GET /api/analytics/spending` — spending by vendor, by category, by month
- `GET /api/analytics/vendor-performance` — per-vendor: quote win rate, avg delivery days, avg rating
- `GET /api/analytics/rfq-trends` — RFQ count and value by month for past 12 months

Frontend Page `/reports`:
- Tab 1: Overview — KPI cards + monthly procurement trend (Recharts LineChart)
- Tab 2: Vendor Performance — sortable table with win rate, avg price competitiveness, delivery reliability
- Tab 3: Spending Analysis — Recharts BarChart (spending by category), PieChart (spending by vendor)
- Tab 4: Export — buttons to download CSV/Excel reports (use `xlsx` library for Excel export)

---

## PART 7 — STRICT CODING GUIDELINES

Enforce these rules throughout every phase without exception.

### Architecture Rules
1. **Zero business logic in API routes.** API routes only: validate input with Zod, call a service method, return the result. All logic lives in `/lib/services/`.
2. **No raw Prisma queries outside service files.** Import from services, not directly from `@/lib/prisma` in route handlers.
3. **Every mutation must write an ActivityLog entry.** No exceptions.
4. **State transitions are server-enforced.** The UI disables invalid buttons, but the server independently validates the current state before any transition. Never trust client-sent status values.
5. **Shared Zod schemas.** Define validation schemas once in `/lib/validations/`. Use them on both the API route (server-side) and the form (client-side via React Hook Form resolver).

### Security Rules
6. **Authentication check first.** Every API route wraps with `withRBAC()`. Never access `req.body` before confirming identity.
7. **Input sanitization.** Trim all strings. Reject null bytes. Validate enum values against Prisma enums, not just strings.
8. **No sensitive data in JWT.** JWT contains only `id`, `email`, `role`, `name`. Fetch full user from DB when needed.
9. **Rate limiting on auth endpoints.** Login and signup endpoints must rate-limit to 10 requests per minute per IP.
10. **File upload validation.** Check MIME type (not just extension). Max 10MB. Store outside the web root. Serve via API route, not as static file.

### Performance Rules
11. **Paginate all list endpoints.** Default page size 20, max 100. Use Prisma cursor-based pagination for large tables (ActivityLog).
12. **Index all foreign keys and commonly filtered fields.** Add `@@index` in Prisma schema for: `status`, `createdAt`, `rfqId`, `vendorId`, `userId`.
13. **React Query caching.** Set `staleTime` appropriately: 30s for dashboard KPIs, 5min for analytics, 0 for real-time lists.
14. **Avoid N+1 queries.** Always use Prisma `include` to eager-load relations needed in a single response. Never loop and query.
15. **Database connection singleton.** Use a single Prisma client instance via the standard Next.js singleton pattern in `/lib/prisma.ts`.

### Code Quality Rules
16. **TypeScript strict mode.** `"strict": true` in tsconfig. No `any` types except where absolutely unavoidable (document with a comment).
17. **Error handling.** Every async function must be wrapped in try-catch. API routes return consistent error shape: `{ error: string, code?: string, details?: unknown }`.
18. **Environment variables.** All secrets via `.env.local`. Use a `/lib/env.ts` file that validates required env vars at startup using Zod.
19. **No console.log in production code.** Use a structured logger (even a simple wrapper is fine).
20. **Component reusability.** If a UI pattern appears more than twice, extract it to `/components/modules/`. Parametrize with props, not duplication.

---

## PART 8 — UI/UX DESIGN STANDARDS

Apply these standards to every page without being told.

- **Color palette:** Sidebar `#0f172a` (slate-900), background `#f8fafc` (slate-50), primary accent `#3b82f6` (blue-500), success `#22c55e`, warning `#f59e0b`, danger `#ef4444`
- **Typography:** Inter font. Page titles 24px/600, section headings 18px/500, labels 14px/500, body 14px/400
- **Status badges:** Pill-shaped, color-coded by status enum. Always uppercase. Max width 100px.
- **Tables:** Zebra-striped rows, sticky header, column sort indicators, row hover highlight
- **Empty states:** Every list/table has a meaningful empty state with an icon and a CTA button
- **Loading states:** Skeleton loaders for tables and cards. Never a blank screen.
- **Error states:** Friendly error messages with retry options. Show `toast` for mutations (success and error).
- **Forms:** Labels above inputs. Inline validation errors below fields. Disabled submit button while loading.
- **Mobile:** All pages must be responsive to 375px width minimum. Sidebar collapses to a hamburger menu.
- **Accessibility:** All interactive elements must have `aria-label` where not self-describing. Keyboard navigation must work on all forms.

---

## PART 9 — ENVIRONMENT CONFIGURATION

Create `.env.local.example` with all required variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/vendorbridge"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-use-openssl-rand-base64-32"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@email.com"
SMTP_PASS="your-app-password"
SMTP_FROM="VendorBridge <noreply@vendorbridge.com>"

# App
NEXT_PUBLIC_APP_NAME="VendorBridge"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## PART 10 — DOCKER COMPOSE

Create `docker-compose.yml`:

```yaml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: vendorbridge
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@vendorbridge.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"

volumes:
  pgdata:
```

---

## PART 11 — README

After all phases complete, generate a comprehensive `README.md` containing:
- Project overview and feature list
- Tech stack table
- Prerequisites (Node 20+, Docker)
- Setup instructions (clone → docker compose up → env → migrate → seed → dev)
- All test user credentials and their roles
- API endpoint reference table (method, path, roles, description)
- Folder structure explanation
- Architecture decisions (why Next.js API routes vs separate backend, why Prisma, etc.)
- Known limitations and future improvements

---

## EXECUTION CHECKLIST

Before declaring any phase complete, verify:
- [ ] All API routes return correct HTTP status codes (200, 201, 400, 401, 403, 404, 422, 500)
- [ ] All forms show validation errors without full-page reload
- [ ] All state machine transitions are rejected server-side when invalid
- [ ] All list pages have pagination
- [ ] All mutations are logged to ActivityLog
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] No console errors in browser on any page
- [ ] Mobile layout works at 375px

Begin with Phase 1. Confirm when Phase 1 is complete before proceeding.

---
*VendorBridge Master Prompt · Generated for Hackathon Submission*
