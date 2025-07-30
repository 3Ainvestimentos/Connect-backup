
"use client";

import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { AlertCircle } from 'lucide-react';

export default function BIPage() {
  const { user, loading: userLoading } = useAuth();
  const { collaborators, loading: collabLoading } = useCollaborators();

  const biLink = useMemo(() => {
    if (userLoading || collabLoading || !user) return null;
    const currentUser = collaborators.find(c => c.email === user.email);
    return currentUser?.biLink;
  }, [user, collaborators, userLoading, collabLoading]);

  if (userLoading || collabLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-background">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  if (!biLink) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-background p-4 text-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-10 w-10" />
                <h2 className="text-xl font-semibold text-foreground">Painel não configurado</h2>
                <p>Nenhum link de Business Intelligence foi configurado para o seu usuário.</p>
            </div>
        </div>
    );
  }
  
  return (
    <div className="flex-grow p-0 m-0 h-full w-full">
        <iframe
            title="Business Intelligence"
            width="100%"
            height="100%"
            src={biLink}
            frameBorder="0"
            allowFullScreen={true}
            className="border-0 rounded-none w-full h-full"
        ></iframe>
    </div>
  );
}
