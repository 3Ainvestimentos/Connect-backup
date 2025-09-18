
"use client";

import { CollaboratorsProvider as ActualCollaboratorsProvider } from '@/contexts/CollaboratorsContext';

// This is a workaround to satisfy the server-client boundary requirements.
// We just re-export the client-side provider from a new client component file.
export function CollaboratorsProvider({ children }: { children: React.ReactNode }) {
    return <ActualCollaboratorsProvider>{children}</ActualCollaboratorsProvider>;
}
