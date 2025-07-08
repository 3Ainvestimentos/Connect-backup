
"use client";

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import ContactsClient from '@/components/contacts/ContactsClient';
import { BookUser } from 'lucide-react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export interface Contact {
  id: string;
  name: string;
  avatarUrl: string;
  dataAiHint: string;
  branch: string; 
  position: string; 
  email: string;
  slack: string;
}

const ContactsSkeleton = () => (
    <Card className="shadow-sm p-4">
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                     <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                     <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    </Card>
);


export default function ContactsPage() {
  const { collaborators, loading } = useCollaborators();

  const contacts = useMemo((): Contact[] => {
    return collaborators.map(c => ({
      id: c.id,
      name: c.name,
      avatarUrl: `https://placehold.co/100x100.png`,
      dataAiHint: 'portrait',
      branch: c.city,
      position: c.position,
      email: c.email,
      slack: `@${c.email.split('@')[0]}`,
    }));
  }, [collaborators]);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader 
        title="Contatos" 
        icon={BookUser}
        description="Encontre informações sobre os colaboradores da empresa."
      />
      {loading ? (
        <ContactsSkeleton />
      ) : (
        <ContactsClient initialContacts={contacts} />
      )}
    </div>
  );
}
