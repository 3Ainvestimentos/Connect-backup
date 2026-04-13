# Next.js 15 / Firebase -- Concepts

> Extracted from the 3A RIVA Connect codebase. Real patterns and configurations.

## Framework Lifecycle

The application follows the Next.js 15 App Router architecture integrated with Firebase:

1. **Client-Side Lifecycle**:
   - **`src/lib/firebase.ts`**: Initializes the Firebase Client SDK using a Singleton pattern.
   - **React Contexts**: Distributed state and logic (Auth, Workflows, Collaborators, etc.) wrap the application in `src/app/layout.tsx`.
   - **Real-time Synchronization**: Uses `onSnapshot` for live updates in the UI without manual refreshing.

2. **Server-Side Lifecycle**:
   - **Server Actions**: Used for form submissions and administrative tasks (e.g., `src/lib/firestore-service.ts`).
   - **`src/lib/firebase-admin.ts`**: Initializes the Firebase Admin SDK for privileged operations, service-account based.
   - **Middleware**: Handles session validation and routing protection.

## Firebase SDK Initialization

### Client SDK (`src/lib/firebase.ts`)
Uses environment variables prefixed with `NEXT_PUBLIC_` for client-side accessibility.
```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

### Admin SDK (`src/lib/firebase-admin.ts`)
Used in Server Components and API Routes. Requires `GOOGLE_APPLICATION_CREDENTIALS`.
```typescript
export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) return getApp();
  return initializeApp();
}
```

## Authentication & Authorization

### Firebase Auth
- **Provider**: Google Auth (`GoogleAuthProvider`).
- **Persistence**: Managed automatically by the Firebase Client SDK.
- **Context**: `AuthContext.tsx` tracks the `user` state and maps Firestore `collaborators` data to the auth session.

### Permission System
Managed via a `permissions` object in the `collaborators` collection:
- `canManageWorkflows`, `canManageContent`, `canViewBI`, etc.
- **Super Admin**: Hardcoded list of emails in `firestore.rules` for bypass logic.

## Data Modeling (Firestore NoSQL)

The project uses a "Flat Collection" pattern with cross-references:
- **Normalization**: Emails are normalized (e.g., `3ariva.com.br` -> `3ainvestimentos.com.br`) to ensure identity consistency across different login methods.
- **Subcollections**: Used sparingly (e.g., `opportunityTypes/{id}/missionGroups`) to maintain clear hierarchy.
- **Counters**: Dedicated collection (`counters`) for generating human-readable sequential IDs (e.g., Workflow Request ID "0042").

## Dependency Injection (React Contexts)

Instead of FastAPI's `Depends()`, 3A RIVA Connect uses **React Contexts** for dependency injection in the frontend:

```typescript
// Example usage in a component
const { collaborators } = useCollaborators();
const { addMessage } = useMessages();
```

| Context | Responsibility |
|---------|----------------|
| `AuthContext` | Auth state, user profile, and permissions |
| `WorkflowsContext` | Workflow requests, history, and status updates |
| `CollaboratorsContext` | Directory of employees and permission management |
| `ApplicationsContext` | Definitions of available workflows and tools |

## Async Patterns

- **Client-side Real-time**: `onSnapshot` listeners for messages, workflows, and collaborator updates.
- **Server Actions**: `async/await` patterns for `firebase-admin` operations.
- **React Query**: Used for caching and optimistic updates on standard fetches (e.g., `getCollection`).

| Feature | Pattern | Why |
|---------|---------|-----|
| Chat/Messages | **onSnapshot** | Instant delivery, multi-user sync |
| Workflow Status | **onSnapshot** | Real-time tracking of approvals |
| CSV Imports | **Server Action** | Heavy processing on the server (Admin SDK) |
| File Uploads | **Firebase Storage SDK** | Direct client-to-cloud upload with progress |
