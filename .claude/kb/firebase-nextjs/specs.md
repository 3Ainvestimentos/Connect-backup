# Next.js / Firebase -- Specs

> Complete specifications extracted from the 3A RIVA Connect codebase.

## Firestore Collections (Core)

### `collaborators`
Central directory of all employees. Document ID is usually the `id3a`.

| Field | Type | Description |
|-------|------|-------------|
| id3a | string | Internal 3A RIVA ID |
| name | string | Full name |
| email | string | Primary email (normalized) |
| authUid | string | Firebase Auth UID |
| permissions | object | Boolean flags for access control |
| axis/area/position | string | Organizational metadata |
| createdAt | string (ISO) | Creation timestamp |

### `workflows`
All workflow requests (vacation, reimbursement, etc.). Document ID is a random UUID.

| Field | Type | Description |
|-------|------|-------------|
| requestId | string | Human-readable ID (e.g., "0042") from `counters` |
| type | string | Workflow definition name |
| status | string | Current status ID |
| ownerEmail | string | Email of the workflow owner |
| submittedBy | object | { userId, userName, userEmail } |
| submittedAt | string (ISO) | Submission timestamp |
| formData | object | Dynamic data from the request form |
| history | array | Array of `WorkflowHistoryLog` objects |
| assignee | object | Current person responsible |
| isArchived | boolean | Soft delete flag |

### `opportunityMap` (Gamification)
Results and targets for collaborators. Document ID matches `collaborators.id`.

| Field | Type | Description |
|-------|------|-------------|
| userName | string | Collaborator name |
| [typeId] | object | Dynamic key per Opportunity Type ID |
| [typeId].[key] | string \| number| Value for a specific objective key |

### `contacts`
Address book/directory.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Contact name |
| email/phone | string | Contact details |
| area/position | string | Metadata |

### `messages`
Internal notifications and chat-like messages.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Message subject |
| content | string | Message body |
| sender | string | System or user name |
| recipientIds | array | IDs of recipients |
| readBy | array | IDs of users who read it |
| createdAt | string (ISO) | Timestamp |

## System Definitions (Config Collections)

### `systemSettings`
Global configuration documents.
- `public_config`: Publicly available settings.
- `admin_config`: Admin-only settings.
- `config`: General application configuration.

### `workflowDefinitions`
Schemas for the different types of workflows available in the system.
- Includes `statuses`, `routingRules`, and `formFields`.

### `counters`
Used for atomic sequential ID generation.
- `workflowCounter`: { currentNumber: number }

## Storage Structure (Firebase Storage)

| Path | Description | Access |
|------|-------------|--------|
| `documents/{fileName}` | General document storage | Authenticated |
| `collaborators/photos/{id3a}`| Profile pictures | Public Read |
| `workflows/{requestId}/{file}`| Attachments for requests | Authenticated |

## Environment Variables

### Client-Side (Next.js)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Google Cloud Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Storage Bucket URL |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

### Server-Side
| Variable | Description |
|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Service Account JSON (Admin SDK) |

## Security Rules (Summary)

- **Super Admin**: Defined in rules via email list. Full access to all collections.
- **Collaborators**: Can read all other collaborators; can only update their own profile.
- **Workflows**: Users can see their own requests; admins (owners/assignees) can see requests according to definitions.
- **Contacts/News/Labs**: Read-only for all authenticated users; Write-only for Super Admins.
- **Audit Logs**: Create-only for users; Read-only for Super Admins.
