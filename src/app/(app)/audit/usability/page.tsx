
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle } from 'lucide-react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useAuth } from '@/contexts/AuthContext';


function UserDataInspector() {
  const { user } = useAuth();
  const { collaborators, loading } = useCollaborators();

  const currentUserData = useMemo(() => {
    if (!user || loading) return null;
    return {
      auth: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
      firestore: collaborators.find(c => c.email === user.email),
    };
  }, [user, collaborators, loading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspeção de Dados do Usuário Logado</CardTitle>
        <CardDescription>
          Dados do Firebase Auth vs. Dados do Firestore (Cache do React Query) para o usuário atual.
          Esta ferramenta ajuda a diagnosticar problemas de sincronização de dados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUserData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="space-y-2">
              <h3 className="font-sans font-semibold text-sm">Firebase Auth (`useAuth`)</h3>
              <div className="p-3 bg-muted rounded-md overflow-x-auto">
                <pre>{JSON.stringify(currentUserData.auth, null, 2)}</pre>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-sans font-semibold text-sm">Firestore (`useCollaborators`)</h3>
              <div className="p-3 bg-muted rounded-md overflow-x-auto">
                 <pre>{JSON.stringify(currentUserData.firestore, null, 2)}</pre>
              </div>
            </div>
          </div>
        ) : <Skeleton className="h-48 w-full" />}

        <div className="pt-4">
            <h3 className="font-semibold text-lg mb-2">Análise de Divergência</h3>
            {currentUserData ? (
                 <div className="flex items-center gap-4 p-3 border rounded-lg">
                    {currentUserData.firestore ? (
                        <>
                            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Colaborador encontrado no Firestore.</p>
                                <p className="text-sm text-muted-foreground">O e-mail do usuário autenticado corresponde a um registro na coleção 'collaborators'.</p>
                            </div>
                        </>
                    ) : (
                         <>
                            <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Colaborador NÃO encontrado no Firestore.</p>
                                <p className="text-sm text-muted-foreground">O e-mail '{currentUserData.auth.email}' não foi encontrado no cache de colaboradores. Isso pode causar falhas de permissão.</p>
                            </div>
                        </>
                    )}
                 </div>
            ) : <p className="text-sm text-muted-foreground">Aguardando dados para análise...</p>}
        </div>
      </CardContent>
    </Card>
  );
}


export default function UsabilityPage() {
  return (
    <SuperAdminGuard>
        <div className="space-y-6">
            <UserDataInspector />
        </div>
    </SuperAdminGuard>
  );
}
