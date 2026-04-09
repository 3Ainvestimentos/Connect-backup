"use client";

import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWorkflowConfigCatalog, WorkflowConfigApiError } from '@/lib/workflows/admin-config/api-client';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { WorkflowConfigDefinitionsTab } from './WorkflowConfigDefinitionsTab';
import { WorkflowConfigHistoryPlaceholder } from './WorkflowConfigHistoryPlaceholder';

export function WorkflowConfigPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('definitions');

  const catalogQuery = useQuery({
    queryKey: ['workflow-config-admin', user?.uid, 'catalog'],
    queryFn: async () => {
      if (!user) {
        throw new WorkflowConfigApiError('UNAUTHORIZED', 'Usuario nao autenticado.', 401);
      }

      return fetchWorkflowConfigCatalog(user);
    },
    enabled: !!user && activeTab === 'definitions',
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Configuracao de chamados v2"
        description="Catalogo administrativo com criacao de areas, abertura de drafts e editor dedicado por versao."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="definitions">Definicoes</TabsTrigger>
          <TabsTrigger value="history">Historico Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="definitions" className="mt-6">
          {catalogQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-lg border bg-card">
              <LoadingSpinner message="Carregando catalogo administrativo" />
            </div>
          ) : null}

          {!catalogQuery.isLoading && catalogQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha ao carregar o catalogo</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{catalogQuery.error.message}</p>
                <Button variant="outline" size="sm" onClick={() => catalogQuery.refetch()}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {!catalogQuery.isLoading && !catalogQuery.isError && catalogQuery.data ? (
            <WorkflowConfigDefinitionsTab
              catalog={catalogQuery.data}
              onRefresh={() => {
                void catalogQuery.refetch();
              }}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <WorkflowConfigHistoryPlaceholder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
