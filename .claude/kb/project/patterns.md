# Project — Patterns

> Real patterns extracted from the 3A RIVA Connect codebase.

## Common Feature Pattern

Most features follow a real-time reactive lifecycle:

```
User Action → Context Mutation → Firestore Update → Real-time Snapshot → UI Sync
```

| Feature | Data Source | Sync Mechanism | State Management | Primary Components |
|---------|-------------|----------------|------------------|--------------------|
| Workflows | Firestore `workflows` | `onSnapshot` listener | `WorkflowsContext` + React Query | `WorkflowRequestCard`, `ActionRequestModal` |
| Opportunity Map | Firestore `opportunity_map` | `useQuery` (TanStack) | `OpportunityMapContext` | `OpportunityMapGrid`, `MissionCard` |
| News & Polls | Firestore `news`, `polls` | `listenToCollection` | `NewsContext`, `PollsContext` | `NewsCarousel`, `PollVoteCard` |
| Gamification | Firestore `collaborators` | `onSnapshot` | `RankingsContext` + `gamification-logics.ts` | `RankingsTable`, `PointsBadge` |
| Meeting Analysis | External API + Firestore | `useQuery` (Custom Hook) | `MeetingAnalysesContext` | `AnalysisList`, `OpportunityCard` |

## Workflow Automation Pattern

**Flow**:
1. **Creation**: `addRequest` generates a sequential ID (e.g., "0001") via `getNextSequentialId` transaction.
2. **Routing**: `routingRules` in the workflow definition determine automatic notifications to specific roles based on form data.
3. **Action Requests**: When a status requires approval/acknowledgment, `ActionRequest` objects are created for specified approvers.
4. **History Log**: Every transition is recorded in the `history` array with timestamp, user ID, and notes.
5. **Real-time**: `WorkflowsContext` uses `onSnapshot` to ensure all participants see status changes instantly.

**Validation Logic**:
- `cleanDataForFirestore`: Utility to remove `undefined` fields before persistence.
- `updateRequestAndNotify`: Orchestrates the update and sends internal messages via `MessagesContext`.

**Files**:
- Context: `src/contexts/WorkflowsContext.tsx`
- Service: `src/lib/firestore-service.ts`
- UI: `src/components/applications/`

## Data Fetching & Sync Patterns

**Pattern A: Real-time Listener (Preferred)**
Used for data that changes frequently or requires immediate visibility across users.
```typescript
// Inside a Context Provider
useEffect(() => {
  if (!user) return;
  const unsubscribe = listenToCollection<T>(
    COLLECTION_NAME,
    (newData) => {
      queryClient.setQueryData([COLLECTION_NAME], newData);
    },
    (error) => console.error(error)
  );
  return () => unsubscribe();
}, [user]);
```

**Pattern B: Optimized One-time Fetch**
Used for static or semi-static data (e.g., system settings, collaborator lists).
```typescript
const { data: items = [] } = useQuery({
  queryKey: ['collection'],
  queryFn: () => getCollection<T>('collection'),
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

## UI/UX & Component Patterns

**Design System**:
- **Framework**: Tailwind CSS + shadcn/ui.
- **Layout**: `AppLayout` with a persistent sidebar and top navigation.
- **Feedback**: `useToast` for operation results, `LoadingSpinner` for async states.
- **Icons**: Extensive use of `lucide-react`.

**Form Pattern**:
- **Handling**: React Hook Form for complex inputs.
- **Validation**: Zod schemas for structured data (Auth, Workflows).
- **Dynamic Fields**: Workflows use a `formData` JSON object to support arbitrary fields defined in the application config.

## Storage & File Management

**Flow**:
1. **Sanitize**: `sanitizeStoragePath` prevents path traversal.
2. **Build**: `buildStorageFilePath` creates a structured path: `base/requestId/timestamp-filename`.
3. **Upload**: `uploadFile` uses `uploadBytesResumable` with progress tracking capability.
4. **URL**: Returns the public download URL once complete.

**Security**:
- Files are organized by `requestId` to ensure logical grouping.
- Path sanitization is mandatory to prevent directory traversal attacks.

## Gamification Logic

**Pattern**:
- Points are calculated client-side via `gamification-logics.ts` but persisted in the `collaborators` profile.
- Rankings are derived by sorting collaborators by `totalPoints` or specific mission completions.
- `MissionGroups` define sets of tasks that grant badges or points upon completion.

## Audit & Security Patterns

- **Audit Logs**: Critical actions (Login, Permission Change, Workflow Approval) trigger an `addDocumentToCollection('audit_logs', ...)` call.
- **Permission Guard**: `AuthContext` provides `isAdmin`, `isSuperAdmin`, and a detailed `permissions` object.
- **Email Normalization**: `normalizeEmail` ensures `@3ariva.com.br` and `@3ainvestimentos.com.br` are treated consistently for auth matching.

## Deployment & Environment

| Environment | Host / Platform | Database / Auth |
|-------------|-----------------|-----------------|
| Development | `npm run dev` (localhost:3000) | Firebase Project (Dev/Staging) |
| Production | App Hosting (Google Cloud) | Firebase Project (Production) |

**CI/CD**:
- Automatic deployment via GitHub integration with Firebase App Hosting.
- Environment variables managed in the Google Cloud Console / `apphosting.yaml`.
