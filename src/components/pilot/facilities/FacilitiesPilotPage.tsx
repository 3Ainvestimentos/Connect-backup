'use client';

import * as React from 'react';
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFacilitiesPilot } from '@/hooks/use-facilities-pilot';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { PilotApiError } from '@/lib/workflows/pilot/api-client';
import type {
  ArchivePilotRequestInput,
  AssignPilotResponsibleInput,
  FinalizePilotRequestInput,
  OpenPilotRequestInput,
  PilotCurrentQueueFilter,
  PilotRequestSummary,
} from '@/lib/workflows/pilot/types';
import { AssignmentsTab } from './AssignmentsTab';
import { CurrentQueueTab } from './CurrentQueueTab';
import { MyRequestsTab } from './MyRequestsTab';
import { OpenWorkflowCard } from './OpenWorkflowCard';
import { RequestDetailsDialog } from './RequestDetailsDialog';

const WORKFLOW_TYPE_ID = 'facilities_manutencao_solicitacoes_gerais';

type TabValue = 'current' | 'assignments' | 'mine';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof PilotApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }

  return fallback;
}

export function FacilitiesPilotPage() {
  const { user, currentUserCollab, loading, permissions, isAdmin } = useAuth();
  const { collaborators } = useCollaborators();
  const { toast } = useToast();
  const [currentFilter, setCurrentFilter] = React.useState<PilotCurrentQueueFilter>('all');
  const showCurrentTab = permissions.canManageRequests || isAdmin;
  const [activeTab, setActiveTab] = React.useState<TabValue>(showCurrentTab ? 'current' : 'assignments');
  const [selectedRequest, setSelectedRequest] = React.useState<PilotRequestSummary | null>(null);

  React.useEffect(() => {
    if (!showCurrentTab && activeTab === 'current') {
      setActiveTab('assignments');
    }
  }, [activeTab, showCurrentTab]);

  const pilot = useFacilitiesPilot(WORKFLOW_TYPE_ID, currentFilter, {
    includeCurrent: showCurrentTab,
  });

  const handleOpenWorkflow = async (payload: OpenPilotRequestInput) => {
    try {
      const result = await pilot.openMutation.mutateAsync(payload);
      toast({
        title: 'Solicitacao criada',
        description: `Chamado #${result.requestId} aberto com sucesso.`,
      });
      setActiveTab('mine');
      return result;
    } catch (error) {
      toast({
        title: 'Falha ao abrir solicitacao',
        description: getErrorMessage(error, 'Nao foi possivel abrir o chamado.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleAssign = async (payload: AssignPilotResponsibleInput) => {
    try {
      const result = await pilot.assignMutation.mutateAsync(payload);
      toast({
        title: 'Responsavel atribuido',
        description: `Chamado #${result.requestId} atualizado com sucesso.`,
      });
      setSelectedRequest(null);
      return result;
    } catch (error) {
      toast({
        title: 'Falha ao atribuir responsavel',
        description: getErrorMessage(error, 'Nao foi possivel atribuir o responsavel.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleFinalize = async (payload: FinalizePilotRequestInput) => {
    try {
      const result = await pilot.finalizeMutation.mutateAsync(payload);
      toast({
        title: 'Chamado finalizado',
        description: `Chamado #${result.requestId} finalizado com sucesso.`,
      });
      setSelectedRequest(null);
      return result;
    } catch (error) {
      toast({
        title: 'Falha ao finalizar chamado',
        description: getErrorMessage(error, 'Nao foi possivel finalizar o chamado.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleArchive = async (payload: ArchivePilotRequestInput) => {
    try {
      const result = await pilot.archiveMutation.mutateAsync(payload);
      toast({
        title: 'Chamado arquivado',
        description: `Chamado #${result.requestId} arquivado com sucesso.`,
      });
      setSelectedRequest(null);
      return result;
    } catch (error) {
      toast({
        title: 'Falha ao arquivar chamado',
        description: getErrorMessage(error, 'Nao foi possivel arquivar o chamado.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pilot de Facilities"
          icon={Building2}
          description="Carregando o ambiente autenticado do piloto."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Carregando dados do piloto...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !currentUserCollab) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pilot de Facilities"
          icon={Building2}
          description="Rota autenticada do piloto operacional."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nao foi possivel identificar um colaborador autenticado para operar o piloto.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pilot de Facilities"
        icon={Building2}
        description="Nova rota para operar o workflow de manutencao sem depender do frontend legado."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Chamados atuais</p>
            <p className="mt-2 text-2xl font-semibold">
              {showCurrentTab ? pilot.currentQuery.data?.items.length ?? 0 : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Atribuicoes e acoes</p>
            <p className="mt-2 text-2xl font-semibold">
              {(pilot.assignmentsQuery.data?.assignedItems.length ?? 0) +
                (pilot.assignmentsQuery.data?.pendingActionItems.length ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Minhas solicitacoes</p>
            <p className="mt-2 text-2xl font-semibold">{pilot.mineQuery.data?.items.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <OpenWorkflowCard
        catalog={pilot.catalogQuery.data}
        isLoading={pilot.catalogQuery.isLoading}
        isSubmitting={pilot.openMutation.isPending}
        errorMessage={
          pilot.catalogQuery.isError
            ? getErrorMessage(
                pilot.catalogQuery.error,
                'Nao foi possivel carregar o catalogo publicado do workflow.',
              )
            : undefined
        }
        requesterName={currentUserCollab.name ?? user.displayName ?? ''}
        onSubmit={handleOpenWorkflow}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          {showCurrentTab ? <TabsTrigger value="current">Chamados atuais</TabsTrigger> : null}
          <TabsTrigger value="assignments">Atribuicoes e acoes</TabsTrigger>
          <TabsTrigger value="mine">Minhas solicitacoes</TabsTrigger>
        </TabsList>

        {showCurrentTab ? (
          <TabsContent value="current">
            <CurrentQueueTab
              filter={currentFilter}
              items={pilot.currentQuery.data?.items ?? []}
              isLoading={pilot.currentQuery.isLoading}
              errorMessage={
                pilot.currentQuery.isError
                  ? getErrorMessage(
                      pilot.currentQuery.error,
                      'Nao foi possivel carregar a fila atual do owner.',
                    )
                  : undefined
              }
              actorUserId={pilot.actorUserId}
              onFilterChange={setCurrentFilter}
              onOpenRequest={setSelectedRequest}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="assignments">
          <AssignmentsTab
            assignedItems={pilot.assignmentsQuery.data?.assignedItems ?? []}
            pendingActionItems={pilot.assignmentsQuery.data?.pendingActionItems ?? []}
            isLoading={pilot.assignmentsQuery.isLoading}
            errorMessage={
              pilot.assignmentsQuery.isError
                ? getErrorMessage(
                    pilot.assignmentsQuery.error,
                    'Nao foi possivel carregar as atribuicoes do usuario.',
                  )
                : undefined
            }
            actorUserId={pilot.actorUserId}
            onOpenRequest={setSelectedRequest}
          />
        </TabsContent>

        <TabsContent value="mine">
          <MyRequestsTab
            groups={pilot.mineQuery.data?.groups ?? []}
            items={pilot.mineQuery.data?.items ?? []}
            isLoading={pilot.mineQuery.isLoading}
            errorMessage={
              pilot.mineQuery.isError
                ? getErrorMessage(
                    pilot.mineQuery.error,
                    'Nao foi possivel carregar suas solicitacoes.',
                  )
                : undefined
            }
            actorUserId={pilot.actorUserId}
            onOpenRequest={setSelectedRequest}
          />
        </TabsContent>
      </Tabs>

      <RequestDetailsDialog
        open={Boolean(selectedRequest)}
        request={selectedRequest}
        actorUserId={pilot.actorUserId}
        collaborators={collaborators}
        isAssigning={pilot.assignMutation.isPending}
        isFinalizing={pilot.finalizeMutation.isPending}
        isArchiving={pilot.archiveMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
          }
        }}
        onAssign={handleAssign}
        onFinalize={handleFinalize}
        onArchive={handleArchive}
      />
    </div>
  );
}
