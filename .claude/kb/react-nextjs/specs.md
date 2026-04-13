# React/Next.js — Specs

> Complete technical specifications for the 3A RIVA Connect codebase.

## Directory Structure

All source code lives in `src/`.

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router (Pages, Layouts, API Routes) |
| `src/components/` | React UI components (split into `ui/`, `admin/`, `auth/`, `dashboard/`, etc.) |
| `src/contexts/` | Distributed React Providers for global state and business logic |
| `src/hooks/` | Custom hooks (auth, mobile detection, toast, etc.) |
| `src/lib/` | Core services (Firebase, Firestore, email utils, sanitizers) |
| `src/shared/` | Shared constants and types |

## Route Inventory

All feature pages are located within the `(app)` route group to inherit the authenticated layout.

| Feature Page | Path | Role-Based Access |
|--------------|------|-------------------|
| Dashboard | `/dashboard` | All authenticated users |
| Workflows | `/applications` | User requests + Admin management |
| News & RSS | `/news` | All authenticated users |
| Ranking | `/rankings` | High performance tracking |
| Meet Analyses | `/meet-analyses` | Meeting record insights |
| Audit Log | `/audit` | Admin only |
| BI Panels | `/bi` | BI-enabled collaborators |
| Admin Panel | `/admin` | System administrators |
| Documents | `/documents` | Policy and procedure hub |
| Store | `/store` | Internal request store |

## Distributed Contexts Inventory

The system relies on domain-specific contexts to manage state and real-time synchronization.

| Context | Purpose |
|---------|---------|
| `AuthContext` | Firebase session, email normalization, and permissions |
| `WorkflowsContext` | Vacation, reimbursement, and custom workflow logic |
| `ApplicationsContext` | Global workflow definitions and step logic |
| `CollaboratorsContext` | CRM-like management of internal team members |
| `MessagesContext` | Internal real-time communication channel |
| `NewsContext` | Management of internal news and banners |
| `PollsContext` | Internal voting systems |
| `TripsBirthdaysContext` | Corporate travel and birthday tracking |
| `SystemSettingsContext` | Feature toggles and global app configurations |

## Firestore Service Spec

**File**: `src/lib/firestore-service.ts`

- **Database Instance**: `getFirestore(getFirebaseApp())`
- **Counter Strategy**: Uses a `counters` collection to maintain sequential human-readable IDs for requests.
- **Sanitization**: `cleanDataForFirestore` is applied before every write to avoid illegal `undefined` fields.
- **Real-time Listener**: `listenToCollection` (wraps `onSnapshot`) is the standard for high-frequency updates.

## Core Dependencies

| Category | Package | Purpose |
|----------|---------|---------|
| Framework | `next@15.x` | Core application framework |
| Backend | `firebase@11.x` | Auth, Firestore, and Storage services |
| Data | `@tanstack/react-query` | Caching and mutation management |
| Forms | `react-hook-form` + `zod` | Validation and state management |
| Styling | `tailwindcss`, `shadcn/ui` | Design system and layout |
| Icons | `lucide-react` | Standard iconography |
| Utils | `date-fns`, `papaparse` | Date manipulation and CSV parsing |

## Firebase Configuration

- **Initialization**: `src/lib/firebase.ts` exports `getFirebaseApp`, `googleProvider`.
- **Services**: Firestore (DB), Firebase Auth (SSO), and Firebase Storage (Files).
- **Security**: Access is governed by Firebase Security Rules matching user IDs and permissions flags.
