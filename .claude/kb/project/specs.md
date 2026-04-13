# Project — Specs

> Complete project specifications extracted from the 3A RIVA Connect codebase.

## Full Directory Structure

```
connect-backup/
├── src/
│   ├── app/                            # Next.js App Router root
│   │   ├── (app)/                      # Authenticated layout group
│   │   │   ├── admin/                  # Admin settings (CRM, workflows, polls)
│   │   │   ├── applications/           # External/internal app links
│   │   │   ├── audit/                  # Audit logs & workflow analytics
│   │   │   ├── bi/                     # PowerBI integrations
│   │   │   ├── bi-leaders/             # PowerBI for leadership
│   │   │   ├── dashboard/              # Main landing after login
│   │   │   ├── documents/              # File sharing hub
│   │   │   ├── guides/                 # Corporate guides
│   │   │   ├── labs/                   # Experimental features / tech tests
│   │   │   ├── me/                     # Personal profile and tasks
│   │   │   ├── meet-analyses/          # Meeting minutes and opportunities
│   │   │   ├── news/                   # Corporate news feed
│   │   │   ├── opportunity-map/        # Sales/client opportunities
│   │   │   ├── personal-panel/         # Individual performance & missions
│   │   │   ├── rankings/               # Gamification leaderboards
│   │   │   ├── requests/               # Action requests/approvals for user
│   │   │   └── store/                  # Future feature placeholder
│   │   ├── (auth)/                     # Unauthenticated layout group
│   │   │   ├── login/                  # Login page
│   │   │   └── reset-password/         # Password reset flow
│   │   ├── api/                        # Next.js API Routes (if any)
│   │   ├── globals.css                 # Global Tailwind styles
│   │   └── layout.tsx                  # Root HTML/body and initial providers
│   ├── components/                     # React Components
│   │   ├── admin/                      # Components used in /admin
│   │   ├── applications/               # App link cards
│   │   ├── auth/                       # Auth forms
│   │   ├── dashboard-v2/               # Current dashboard components
│   │   ├── documents/                  # Document table/grid
│   │   ├── fab/                        # Floating Action Button (messages)
│   │   ├── guides/                     # Guide renderers
│   │   ├── layout/                     # Sidebar, Topbar, AppLayout
│   │   ├── meet-analyses/              # Meeting analysis forms/views
│   │   ├── news/                       # News cards/carousels
│   │   ├── polls/                      # Voting components
│   │   ├── providers/                  # Global Context Providers wrapper
│   │   ├── requests/                   # Request cards
│   │   └── ui/                         # shadcn/ui base components
│   ├── contexts/                       # React Contexts (State Management)
│   │   ├── ApplicationsContext.tsx
│   │   ├── AuditContext.tsx
│   │   ├── AuthContext.tsx             # Identity and Permissions
│   │   ├── CollaboratorsContext.tsx    # User directory
│   │   ├── DocumentsContext.tsx
│   │   ├── MeetingAnalysesContext.tsx
│   │   ├── OpportunityMapContext.tsx
│   │   ├── RankingsContext.tsx         # Gamification state
│   │   ├── SystemSettingsContext.tsx   # Global settings
│   │   └── WorkflowsContext.tsx        # Workflow state
│   ├── hooks/                          # Custom React Hooks
│   │   ├── use-mobile.tsx              # Responsive breakpoints
│   │   ├── use-toast.ts                # Toast notifications
│   │   └── use-local-storage.ts        # Persisted state
│   └── lib/                            # Utilities and Services
│       ├── firebase.ts                 # Client SDK initialization
│       ├── firebase-admin.ts           # Admin SDK initialization (Server Actions)
│       ├── firestore-service.ts        # Generic CRUD operations
│       ├── email-utils.ts              # Domain normalization
│       ├── data-sanitizer.ts           # Undefined/null stripping for Firestore
│       ├── gamification-logics.ts      # Points/Badges calculation
│       └── utils.ts                    # Tailwind merge utilities
├── functions/                          # Firebase Cloud Functions
│   └── src/
│       └── index.ts                    # Backend triggers and endpoints
├── firestore.rules                     # Firebase Security Rules
├── storage.rules                       # Storage Security Rules
├── package.json                        # Frontend dependencies
└── tailwind.config.ts                  # Design system configuration
```

## Production Configuration

### Required Environment Variables (.env.local)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `FIREBASE_CLIENT_EMAIL` | Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Admin SDK private key |

## Key Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| `next` | React Framework | `15.1.7` |
| `react` | UI Library | `19.0.0` |
| `firebase` | Client Database, Auth, Storage | `11.3.1` |
| `firebase-admin` | Server-side Database bypass | `13.1.0` |
| `lucide-react` | Iconography | `0.475.0` |
| `tailwind-merge` | CSS utility | `^2.5.5` |
| `clsx` | CSS utility | `^2.1.1` |

## Firebase Collections (Primary)

| Collection | Description | Main Fields |
|------------|-------------|-------------|
| `collaborators` | User profiles | `id`, `name`, `email`, `role`, `department`, `permissions`, `totalPoints` |
| `system_settings` | Global config | `id`, `name`, `value` |
| `audit_logs` | Security history | `id`, `action`, `userId`, `userName`, `timestamp`, `details` |
| `opportunity_map` | Sales leads | `id`, `clientName`, `status`, `value`, `ownerId` |
| `workflows` | Definitions | `id`, `name`, `formSchema`, `routingRules` |
| `workflow_requests` | Instances | `id`, `workflowId`, `status`, `formData`, `history` |
| `meeting_analyses` | Minutes/Ops | `id`, `clientName`, `date`, `participants`, `summary`, `actionItems` |

## Security Rules Strategy

**Firestore**:
- Default deny all.
- Authenticated users can read most shared collections (`news`, `polls`, `collaborators`).
- Admin users (identified via custom claims or lookup in `collaborators` collection) have write access to system configurations.
- Users can write to collections they own (e.g., creating a `workflow_request` sets `createdBy`).

**Storage**:
- Users can upload files if authenticated.
- Path structures often enforce security (e.g., `requests/{userId}/{filename}`).

## CI/CD and Deployment

**Target**: Firebase App Hosting
- **Build Command**: Standard `next build`.
- **Framework Detection**: Firebase App Hosting automatically detects Next.js.
- **Node Version**: Handled via App Hosting container.
