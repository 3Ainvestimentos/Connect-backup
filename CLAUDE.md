# CLAUDE.md - 3A RIVA Connect Guidelines

## Project Overview
3A RIVA Connect is a corporate intranet platform for operational management, collaboration, and gamification.
- **Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Firebase (Firestore, Storage, Auth, Cloud Functions).
- **Core Domains**: Opportunity Mapping, Workflow Automation, Gamification, Corporate Communications, Meeting Analysis.

## Build & Development Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Type Check: `npm run typecheck`

## Test Commands
- Run all tests: `npm test`
- Run single test: `npx jest path/to/test`
- Watch mode: `npm run test:watch`

## Code Style & Conventions
- **Clean Code**: Always produce clean, readable code: small functions, clear names, single responsibility, minimal duplication. Prefer early returns and avoid deep nesting.
- **Documentation**: Document public functions, utilities, and non-obvious logic with JSDoc/docstrings (purpose, params, return, examples when helpful). Keep comments up to date with the code.
- **Modularization**: Split logic into focused modules and functions. One concern per file when practical; extract reusable logic to `src/lib/` or domain-specific modules. Avoid large monolithic files.
- **Language**: TypeScript (Strict Mode).
- **Components**: Functional components with Hooks. Use `shadcn/ui` primitives.
- **Icons**: `lucide-react` is the standard iconography library.
- **Styling**: Tailwind CSS with mobile-first approach. Use `cn()` utility for class merging.
- **State Management**: Distributed React Contexts for domain state.
- **Data Fetching**: TanStack Query (via Contexts) for caching and server state.
- **Firebase**: Use `src/lib/firestore-service.ts` for direct interactions.
- **Forms**: React Hook Form with Zod schema validation.
- **Naming**: 
  - Components: PascalCase
  - Functions/Variables: camelCase
  - Files: kebab-case (except for Next.js convention files like `page.tsx`, `layout.tsx`)
- **Exports**: Prefer named exports for logic; default exports for Next.js pages/layouts.

## Architecture Decisions
- **Context=Logic**: Business logic and Firestore orchestration live in `src/contexts/`.
- **(app) Group**: Enforce authentication at the layout level for the `(app)` group.
- **Sequential IDs**: Use Firestore transactions (`runTransaction`) for sequential IDs.
- **Data Sanitization**: Always use `cleanDataForFirestore` before persisting to Firestore.
- **Storage Paths**: Use `buildStorageFilePath` and `sanitizeStoragePath` from `src/lib/path-sanitizer.ts`. Pattern: `uploads/{domain}/{requestId}/{timestamp}-{fileName}`.

## Testing Requirements
- Unit tests for complex business logic and utilities.
- Mock Firebase services using established patterns in `src/lib/mock-firestore-service.ts`.
- Component tests for critical UI workflows (e.g., submission modals).
