# StabilityFlow — Pharmaceutical Stability Management Platform

## Overview
StabilityFlow is a comprehensive pharmaceutical stability management and quality intelligence system built for GMP-compliant environments. It combines stability scheduling, workflow execution, and quality intelligence in a single platform.

## Tech Stack
- **Frontend**: React, TypeScript, TanStack Query, Wouter, Recharts, shadcn/ui, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with custom design tokens

## Architecture
- `shared/schema.ts` — Complete data model with Drizzle + Zod schemas
- `server/db.ts` — PostgreSQL connection via Drizzle ORM
- `server/storage.ts` — Data access layer implementing IStorage interface
- `server/routes.ts` — All REST API endpoints
- `server/seed.ts` — Database seeding with realistic pharma data
- `client/src/App.tsx` — Main app with sidebar layout and routing
- `client/src/components/app-sidebar.tsx` — Navigation sidebar with live badge counts
- `client/src/components/theme-provider.tsx` — Dark/light mode support
- `client/src/pages/` — All application pages

## Key Features

### 1. Dashboard
- Real-time KPI cards (active studies, overdue pulls, open investigations, excursions)
- Urgent pull schedule (next 7 days)
- Recent investigations list
- System overview metrics

### 2. Study Management (`/studies`)
- Register new stability studies with auto-generated time points
- Study types: long-term, accelerated, intermediate, stress, photostability, freeze/thaw
- Tabbed views by status (active, on hold, completed)
- Auto time point generation based on ICH stability guidelines
- **Edit studies** (EditStudyDialog) and **delete studies** (cascade deletes samples + time points)

### 3. Pull Schedule (`/pull-schedule`)
- Overdue, in-progress, upcoming, and all time points
- Start/complete pull actions
- Priority and urgency indicators

### 4. Workflow Execution (`/workflow`)
- Select study + time point to enter results
- Real-time specification evaluation (OOS/OOT auto-detection)
- Auto-creates investigations when OOS/OOT detected
- Progress tracking per time point

### 5. OOS/OOT Investigations (`/investigations`)
- Full investigation lifecycle: open → phase1 → phase2 → closed
- Auto-triggered by result evaluation
- Assignment, timeline tracking, CAPA linking

### 6. Chamber Management (`/chambers`)
- Real-time chamber status monitoring
- Excursion logging with sample hold capability
- Excursion history and resolution workflow

### 7. Analytics (`/analytics`)
- Results by status (pie chart)
- Time point progress (bar chart)
- Studies by type
- Trend analysis per study with recharts line charts

### 8. Audit Trail (`/audit-trail`)
- Complete action log with entity type badges
- Timestamped entries with user attribution

### 9. Settings (`/settings`)
- Master data: products, test specifications, storage conditions, chambers, users
- CRUD operations for all master data entities

## Data Model (Key Tables)
- `users` — System users with roles (admin, analyst, reviewer, manager)
- `products` — Drug products with shelf life info
- `storage_conditions` — ICH stability conditions (25°C/60%RH, 40°C/75%RH, etc.)
- `chambers` — Storage chambers linked to conditions
- `test_specifications` — Per-product test specs with spec/alert limits
- `stability_studies` — Study registrations with ICH study type
- `time_points` — Auto-generated pull schedule per study
- `samples` — Chain of custody tracking
- `test_results` — Result entries with auto-evaluation
- `investigations` — OOS/OOT investigation records
- `chamber_excursions` — Chamber excursion events
- `audit_logs` — Complete audit trail
- `notifications` — User notification records

## API Endpoints
- `GET/POST /api/dashboard/stats`
- `GET/POST/PATCH /api/products`
- `GET/POST /api/storage-conditions`
- `GET/POST/PATCH /api/chambers`
- `GET/POST/PATCH/DELETE /api/test-specifications`
- `GET/POST/PATCH /api/studies`
- `GET/PATCH /api/time-points`, `/api/time-points/upcoming`, `/api/time-points/overdue`
- `GET/POST/PATCH /api/samples`
- `GET/POST/PATCH /api/results`
- `GET/POST/PATCH /api/investigations`
- `GET/POST/PATCH /api/excursions`
- `GET /api/audit-logs`
- `GET /api/notifications/:userId`
- `POST /api/auth/login`

## Intelligence Features
- **Auto OOS/OOT detection**: When a result is entered, it's immediately evaluated against spec limits and auto-triggers an investigation
- **Auto time point generation**: New studies auto-generate a full schedule based on ICH guidelines
- **Live badge counts**: Sidebar shows live counts of overdue pulls, open investigations, active excursions
- **Chamber excursion cascade**: Logging an excursion auto-flags chamber status and can hold samples
