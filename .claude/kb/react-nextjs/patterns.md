# React/Next.js — Patterns

> Real architectural patterns extracted from the 3A RIVA Connect codebase.

## Component Patterns

### shadcn/ui Usage
The project strictly uses **shadcn/ui** components located in `src/components/ui/`. These are built on Radix UI primitives and styled with Tailwind CSS.

**Core Iconography**: `lucide-react` is the standard for all UI icons.

```tsx
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Plus className="mr-2 h-4 w-4" />
      Adicionar
    </Button>
  )
}
```

### Layout Protection (`(app)` group)
Authentication is enforced at the layout level for the `(app)` group.

**File**: `src/app/(app)/layout.tsx`
- Checks `loading` and `user` state from `AuthContext`.
- Redirects to `/login` if no session is found.
- Wraps children in the application shell (Sidebar, Header, Breadcrumbs).

## Real-time Sync Patterns

### The Mutation Flow
State changes follow a "Write to Firestore, Listen for Change" pattern.

```tsx
// Inside a Context Provider (e.g., WorkflowsContext.tsx)
const updateRequest = async (id: string, data: Partial<WorkflowRequest>) => {
  try {
    // 1. Direct write to Firestore via service
    await updateDocumentInCollection(COLLECTION_NAME, id, data);
    
    // 2. React Query invalidation (or onSnapshot handles the UI update)
    queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    
    toast({ title: "Sucesso", description: "Solicitação atualizada." });
  } catch (error) {
    toast({ title: "Erro", variant: "destructive", description: "Falha ao atualizar." });
  }
};
```

### Real-time Listeners (`onSnapshot`)
For domains requiring instant feedback (like Chat or Notifications), `listenToCollection` is used.

**Reference**: `src/lib/firestore-service.ts`
```tsx
useEffect(() => {
  if (!user) return;
  
  // Real-time listener setup
  const unsubscribe = listenToCollection<Message>(
    'messages',
    (data) => setMessages(data),
    (error) => console.error(error)
  );

  return () => unsubscribe(); // Cleanup on unmount
}, [user]);
```

## Form Handling & Validation

The project uses **React Hook Form** combined with **Zod** for schema validation.

```tsx
const schema = zod.object({
  title: zod.string().min(3, "Título muito curto"),
  type: zod.enum(["vacation", "reimbursement"]),
});

const form = useForm<zod.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

## Firestore Access Pattern

All direct Firestore interactions are abstracted through `src/lib/firestore-service.ts`.

| Pattern | Service Function |
|---------|------------------|
| Fetch all | `getCollection<T>(name)` |
| Fetch with filters | `getCollectionWithQuery<T>(name, filters, order)` |
| Add new | `addDocumentToCollection(name, data)` |
| Update | `updateDocumentInCollection(name, id, data)` |
| Real-time | `listenToCollection(name, callback, errorCallback)` |

**Data Sanitization**: All data sent to Firestore passes through `cleanDataForFirestore` to remove `undefined` values and prevent Firebase errors.

## Responsive UI Pattern

Using the `use-mobile` hook to toggle between desktop sidebar and mobile sheet.

```tsx
const isMobile = useIsMobile();

return (
  <div className={cn("flex", isMobile ? "flex-col" : "flex-row")}>
    {isMobile ? <MobileNav /> : <Sidebar />}
    <main className="flex-1">{children}</main>
  </div>
);
```
