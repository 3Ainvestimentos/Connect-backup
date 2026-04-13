# Next.js / Firebase -- Patterns

> Real patterns extracted from the 3A RIVA Connect codebase.

## Firestore CRUD Patterns

**Reference**: `src/lib/firestore-service.ts`

Standard operations are wrapped in helper functions to provide a consistent interface:

```typescript
import { getFirestore, doc, setDoc, addDoc, getDoc, updateDoc } from 'firebase/firestore';

// 1. Create with specific ID (Set)
export const setDocument = async (coll: string, id: string, data: any) => {
  const docRef = doc(db, coll, id);
  return await setDoc(docRef, cleanDataForFirestore(data));
};

// 2. Create with random ID (Add)
export const addDocument = async (coll: string, data: any) => {
  const collRef = collection(db, coll);
  return await addDoc(collRef, cleanDataForFirestore(data));
};

// 3. Update (Partial)
export const updateDocument = async (coll: string, id: string, data: any) => {
  const docRef = doc(db, coll, id);
  return await updateDoc(docRef, cleanDataForFirestore(data));
};
```

**Key rules**:
- **Data Sanitization**: Always use `cleanDataForFirestore()` to remove `undefined` fields and ensure compatibility.
- **ID Stability**: Use collaborator emails or Internal ID (`id3a`) as document IDs where possible.

## Real-time Listener Pattern (`onSnapshot`)

Used for reactive UIs that stay in sync across different clients.

**Reference**: `src/contexts/WorkflowsContext.tsx`

```typescript
useEffect(() => {
  const q = query(collection(db, "workflows"), where("status", "==", "pending"));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(items);
  }, (error) => {
    console.error("Listener failed:", error);
  });
  return () => unsubscribe(); // Always clean up
}, []);
```

## Sequential ID Generation Pattern (Transactions)

Used for human-readable IDs like "Workflow #0001".

**Reference**: `src/lib/firestore-service.ts`

```typescript
export const getNextSequentialId = async (counterId: string): Promise<number> => {
  const counterRef = doc(db, 'counters', counterId);
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextValue = (counterDoc.data()?.currentNumber || 0) + 1;
    transaction.set(counterRef, { currentNumber: nextValue }, { merge: true });
    return nextValue;
  });
};
```

## Batched Writes Pattern (`writeBatch`)

Used for atomic operations involving multiple documents.

**Reference**: `src/contexts/WorkflowsContext.tsx`

```typescript
const batch = writeBatch(db);
const pendingUnseenRequests = requests.filter(...);

pendingUnseenRequests.forEach(req => {
    batch.update(doc(db, "workflows", req.id), { viewedBy: [...req.viewedBy, adminId3a] });
});

await batch.commit(); // Atomic commit
```

## Storage Upload Pipeline Pattern

**File**: `src/lib/firestore-service.ts`

```typescript
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const storage = getStorage();
const storageRef = ref(storage, `documents/${fileName}`);

const uploadTask = uploadBytesResumable(storageRef, file);

uploadTask.on('state_changed', 
  (snapshot) => { /* Progress tracking */ }, 
  (error) => { /* Handle error */ }, 
  async () => {
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    // Link URL to Firestore document
  }
);
```

## Security Rules Patterns

**File**: `firestore.rules`

### Role-Based Access Control (RBAC)
```rules
function isSuperAdmin() {
  return request.auth != null &&
         request.auth.token.email in ['admin1@3ariva.com.br', 'admin2@3ariva.com.br'];
}
```

### Self-Ownership Pattern
```rules
match /collaborators/{userId} {
  allow update: if isSuperAdmin() || (request.auth.uid == resource.data.authUid);
}
```

### Data Normalization in Rules
```rules
function normalizeEmail(email) {
  let parts = email.split('@');
  return parts[1] == '3ariva.com.br' ? parts[0] + '@3ainvestimentos.com.br' : email;
}
```

## Sequential Processing Pattern

Used for workflows where one action triggers notifications.

**Reference**: `WorkflowsContext.tsx`

1.  **Update Document**: Call `updateDoc` with new status and history log.
2.  **Notification Logic**: Use `addMessage` to notify the requester and the new assignee.
3.  **Audit Log**: Ensure `history` array is updated in the same transaction or write.

## Error Handling & Feedback Pattern

```typescript
try {
    await updateDocumentInCollection(...);
    toast({ title: "Sucesso!", description: "Operação realizada." });
} catch (error) {
    console.error(error);
    toast({ title: "Erro", description: "Falha na operação.", variant: "destructive" });
}
```

**Toast Hook**: Use `useToast` from `@/hooks/use-toast` for all user-facing feedback.
