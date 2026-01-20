
"use client";

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { AlertCircle } from 'lucide-react';
import { findCollaboratorByEmail } from '@/lib/email-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BIPage() {
  const { user, loading: userLoading } = useAuth();
  const { collaborators, loading: collabLoading } = useCollaborators();

  const biLinks = useMemo(() => {
    if (userLoading || collabLoading || !user) return [];
    const currentUser = findCollaboratorByEmail(collaborators, user.email);
    return currentUser?.biLinks || [];
  }, [user, collaborators, userLoading, collabLoading]);

  const [activeTab, setActiveTab] = useState('');

  // Set the first link as the active tab initially
  useMemo(() => {
    if (biLinks.length > 0 && !activeTab) {
      setActiveTab(biLinks[0].url);
    }
  }, [biLinks, activeTab]);

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

  if (biLinks.length === 0) {
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
    <div className="flex flex-col h-full w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
        {biLinks.length > 1 && (
            <div className="px-4 py-2 border-b">
                <TabsList>
                {biLinks.map((link) => (
                    <TabsTrigger key={link.url} value={link.url}>{link.name}</TabsTrigger>
                ))}
                </TabsList>
            </div>
        )}
        
        <div className="flex-grow relative">
            {biLinks.map((link) => (
                <TabsContent key={link.url} value={link.url} className="w-full h-full absolute inset-0 m-0 p-0">
                    <iframe
                        title={link.name}
                        width="100%"
                        height="100%"
                        src={link.url}
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="fullscreen; clipboard-read; clipboard-write; autoplay"
                        className="border-0 rounded-none w-full h-full"
                    ></iframe>
                </TabsContent>
            ))}
        </div>
      </Tabs>
    </div>
  );
}
