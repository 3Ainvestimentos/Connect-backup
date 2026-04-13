# React/Next.js — Concepts

> Extracted from the 3A RIVA Connect codebase. Real patterns and architectural configurations.

## App Router (Next.js 15)

The application leverages Next.js 15 with App Router, utilizing Route Groups to separate concerns and handle authentication state at the layout level.

**Root Layout** (`src/app/layout.tsx`):
- Sets up the core providers: `ThemeContext`, `AuthContext`, and `QueryClientProvider` (@tanstack/react-query).
- Global styles via `globals.css`.
- Uses `Inter` font for consistent typography.

**Route Groups**:
- `(app)`: Protected routes requiring authentication. Contains the main intranet features (dashboard, workflows, news, etc.).
- `(auth)`: Public routes for authentication (login).
- `api/`: Backend-related route handlers (e.g., RSS proxy, PDF generation).

## Authentication & Permissions

**Auth Flow** (`src/contexts/AuthContext.tsx`):
- Uses **Firebase Authentication** with Google Provider (`signInWithPopup`).
- **Session Management**: `onAuthStateChanged` maintains the user state.
- **Collaborator Enrichment**: The Firebase User is automatically linked to a `Collaborator` document in Firestore (matched by email).
- **Email Normalization**: Handles internal domain mapping (`@3ariva.com.br` to `@3ainvestimentos.com.br`).

**Permissions Model**:
- Granular permissions (e.g., `canManageWorkflows`, `canViewBI`) are loaded from the `Collaborator` document.
- `isAdmin`: Computed property if any management permission is true.
- `isSuperAdmin`: Special flag for root-level access.

## Distributed State Management

The project avoids a monolithic state (like Redux) in favor of **Distributed React Contexts**. Each domain has its own Provider that encapsulates logic and data fetching.

**Key Contexts** (`src/contexts/`):
- `WorkflowsContext`: Manages requests, approvals, and real-time task tracking.
- `AuthContext`: Core session and permissions.
- `ApplicationsContext`: Manages business logic definitions (workflow steps, dynamic forms).
- `MessagesContext`: Real-time internal communications and notifications.

## Real-time Data Pattern

The application uses a hybrid approach for data consistency:

1.  **Initial Fetch / Cache**: `@tanstack/react-query` handles standard data fetching from Firestore, providing loading states and caching.
2.  **Real-time Sync**: Firebase `onSnapshot` listeners are used for high-frequency updates (e.g., new messages, status changes in workflows).
3.  **User Action Flow**:
    - User triggers action (e.g., `approveRequest`).
    - Context calls `firestore-service` (mutation).
    - Firestore updates.
    - (Option A) `onSnapshot` triggers UI update automatically.
    - (Option B) `queryClient.invalidateQueries` forces a re-fetch of the domain data.

## Shared Infrastructure

**Firestore Service** (`src/lib/firestore-service.ts`):
- Abstracted layer for Firestore operations: `getCollection`, `addDocumentToCollection`, `updateDocumentInCollection`.
- Sequential ID generation (e.g., "Workflow Request #0042") using counter documents.

**Firebase Storage**:
- Used for document uploads, profile pictures, and workflow attachments.
- Managed via `FirebaseStorage` hooks and direct service calls.

## Layout & UI Principles

- **Authenticated Layout** (`src/app/(app)/layout.tsx`): Wraps all protected routes in a Sidebar/Header shell and checks if `user` is present in `AuthContext`, otherwise redirects to `/login`.
- **Responsive Design**: Mobile-first approach using Tailwind CSS and `use-mobile` hook.
- **Feedback**: Integrated `Toast` system for operation success/failure.
