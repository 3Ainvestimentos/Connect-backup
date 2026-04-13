# Project — Concepts

> Extracted from the 3A RIVA Connect codebase. Real architecture and patterns.

## Architecture Principles

### Separation of Responsibilities

**RULE**: Each layer has ONE clear responsibility.

| Layer | Role | Contains |
|-------|------|----------|
| `src/app/` | **ROUTING & UI** | Next.js App Router pages, layouts, and route handlers. |
| `src/contexts/` | **DOMAIN ORCHESTRATOR** | React Context + TanStack Query for business logic, data fetching, and real-time sync. |
| `src/components/` | **COMPONENTS** | Reusable UI components (Shadcn UI) and domain-specific views. |
| `src/lib/` | **CORE SERVICES** | Direct Firestore/Storage operations, sanitization, and shared logic. |

**Anti-pattern**: Large inline logic blocks in page components. Logic should be abstracted into Services or Contexts.

```tsx
// WRONG: Page component fetching directly from Firestore
export default function WorkflowsPage() {
  const [data, setData] = useState([]);
  useEffect(() => { getDocs(collection(db, 'workflows')).then(...) }, []);
}

// CORRECT: Page uses domain context with TanStack Query
export default function WorkflowsPage() {
  const { requests, loading } = useWorkflows();
  // ... render
}
```

### Plan-First Workflow

Every non-trivial implementation MUST have a `.plan.md` file in `.cursor/plans/` or `.claude/sdd/` before code is written. Plans include:
- Current code state with real line numbers.
- Proposed implementation (complete code snippets).
- Affected files with type of change (Update/Create).
- "What NOT to change" section to protect stable logic.
- Risks and mitigations (e.g., Firestore cost, race conditions).

## Auth Flow

**Files**: `src/contexts/AuthContext.tsx`, `src/lib/firebase.ts`, `src/lib/firestore-service.ts`

### Chain
```
Request → Firebase onAuthStateChanged → get_current_user() → normalizeEmail() → [Firestore fetch] → getCollaboratorByUidOrEmail() → Collaborator State
```

**Normalization**: Emails are normalized (replacing `@3ariva.com.br` with `@3ainvestimentos.com.br`) to ensure consistency between Google Auth and historical Firestore collaborator records.

**Real-time sync**: The `AuthContext` uses Firestore `onSnapshot` to keep the user's permissions (`CollaboratorPermissions`) and profile data updated in real-time without requiring a page refresh.

### Permissions Model
Defined in `CollaboratorPermissions` (e.g., `canManageWorkflows`, `canViewRankings`). Super Admins are determined by hardcoded emails in `SystemSettings`.

## Storage Strategy

### Firestore (Primary DB)

**Pattern: Provider-Service-Query**
1. **Service** (`firestore-service.ts`): Generic CRUD wrappers using Firebase SDK v9/10 (modular).
2. **Context** (`WorkflowsContext`): Domain-specific logic, sequential ID generation, and multi-document updates.
3. **TanStack Query**: Used via Contexts to provide caching, loading states, and optimistic updates.

**Sequential IDs**: Uses Firestore transactions (`runTransaction`) on a `counters` collection to generate human-readable, sequential IDs (e.g., `0001`, `0002`) for workflow requests, ensuring no duplicates.

### Firebase Storage (Files)

**Path Strategy**:
`uploads/{domain}/{requestId}/{timestamp}-{safeFileName}`

**Security**: Paths are constructed via `buildStorageFilePath` and `sanitizeStoragePath` to prevent path traversal and ensure filename compatibility across operating systems.

## Feature Domains (5)

### 1. Opportunity Mapping
A multi-tier reward system structured as: `OpportunityTypes` → `MissionGroups` → `Objectives`.
- **Logic**: Collaborator progress is tracked in the `opportunityMap` collection.
- **Status**: Dynamic rendering based on mission definitions and admin-uploaded progress data.

### 2. Workflow Automation
Dynamic workflow definitions allowing for custom forms and approval chains.
- **Definitions**: Fields, statuses, and routing rules defined via `ApplicationsContext`.
- **Execution**: `WorkflowsContext` manages state transitions, history logs, and automatic internal notifications.

### 3. Gamification (Missions, Rankings)
Engagement tracking using `gamification-logics.ts`.
- **Rankings**: Real-time leaderboards based on points accrued from missions and activities.
- **Persistence**: Points and badges stored in the `collaborators` collection and dedicated logs.

### 4. Corporate Communications (News, Guides, Polls)
Company-wide information dissemination system.
- **News**: RSS-compatible feed and internal articles.
- **Polls**: Real-time feedback from employees with results visualization.
- **Guides**: Centralized documentation and "How-to" guides for internal processes.

### 5. Meeting Analysis
Manual (non-AI) structured analysis of corporate meetings.
- **Structure**: Capture summaries, action items, and specific opportunities identified during calls.
- **Integration**: Links meeting outcomes to opportunity tracking and task assignments.

## Environment Tiers

| Setting | Development | Production |
|---------|------------|------------|
| Auth | Firebase Auth Emulator | Firebase Auth (Google Provider) |
| Database | Firestore Emulator | Firebase Cloud Firestore |
| Storage | Firebase Storage Emulator | Firebase Storage (Public/Private) |
| Deploy | `next dev` (Local) | Firebase Hosting + Cloud Functions |
| Monitoring | Console Logs | Sentry + Firebase Analytics |

## Architecture Reports

- **Security Report**: `RELATORIO_SEGURANCA.md` (Role-based access, data sanitization).
- **Workflow Specification**: `WORKFLOW_SPECIFICATION.md` (Status machines, routing).
- **Opportunity Map Spec**: `OPPORTUNITY_MAP_SPECIFICATION.md` (Database schemas).

## Architecture Decision (Next.js 15 / Firebase)

### Phase 1: Client-Side Orchestration (Current)
- High interactivity requirements favored a Context-heavy architecture.
- TanStack Query used as the primary state manager for server data.
- **AI Removal**: Explicitly removed AI-driven features (Genkit, Chat-with-Bob) to focus on core corporate tools and security.

### Phase 2: Hybrid Server-Side Optimization (Planned)
- Migration of heavy read operations to Next.js Server Actions.
- Use of Firebase Admin SDK in `src/lib/firebase-admin.ts` for privileged operations.
- Implementation of `middleware.ts` for route-level authorization before hydration.
