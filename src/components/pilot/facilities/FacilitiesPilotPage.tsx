'use client';

import * as React from 'react';
import { Building2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFacilitiesPilot } from '@/hooks/use-facilities-pilot';
import { PilotApiError } from '@/lib/workflows/pilot/api-client';
import { filterMonthGroupsByWorkflow, filterRequestsByWorkflow } from '@/lib/workflows/pilot/workflow-filters';
import {
  DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID,
  FACILITIES_PILOT_WORKFLOWS,
  getFacilitiesPilotWorkflowConfig,
  type FacilitiesPilotWorkflowTypeId,
} from '@/lib/workflows/pilot/workflow-registry';
import type {
  ArchivePilotRequestInput,
  AssignPilotResponsibleInput,
  FinalizePilotRequestInput,
  OpenPilotRequestInput,
  PilotCurrentQueueFilter,
  PilotRequestSummary,
  PilotWorkflowScope,
} from '@/lib/workflows/pilot/types';
import { uploadWorkflowFile } from '@/lib/workflows/upload/client';
import { AssignmentsTab } from './AssignmentsTab';
import { CurrentQueueTab } from './CurrentQueueTab';
import { MyRequestsTab } from './MyRequestsTab';
import { OpenWorkflowCard } from './OpenWorkflowCard';
import { RequestDetailsDialog } from './RequestDetailsDialog';

type TabValue = 'current' | 'assignments' | 'mine';

type FacilitiesPilotPageProps = {
  initialWorkflowTypeId?: FacilitiesPilotWorkflowTypeId;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof PilotApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }

  return fallback;
}

export function FacilitiesPilotPage({
  initialWorkflowTypeId = DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID,
}: FacilitiesPilotPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, currentUserCollab, loading, permissions, isAdmin } = useAuth();
  const { collaborators } = useCollaborators();
  const { toast } = useToast();
  const [activeWorkflowTypeId, setActiveWorkflowTypeId] =
    React.useState<FacilitiesPilotWorkflowTypeId>(initialWorkflowTypeId);
  const [listScope, setListScope] = React.useState<PilotWorkflowScope>('all');
  const [currentFilter, setCurrentFilter] = React.useState<PilotCurrentQueueFilter>('all');
  const showCurrentTab = permissions.canManageRequests || isAdmin;
  const [activeTab, setActiveTab] = React.useState<TabValue>(showCurrentTab ? 'current' : 'assignments');
  const [selectedRequest, setSelectedRequest] = React.useState<PilotRequestSummary | null>(null);
  const activeWorkflowConfig = getFacilitiesPilotWorkflowConfig(activeWorkflowTypeId)!;

  React.useEffect(() => {
    setActiveWorkflowTypeId(initialWorkflowTypeId);
  }, [initialWorkflowTypeId]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (params.get('workflow') === activeWorkflowTypeId) {
      return;
    }

    params.set('workflow', activeWorkflowTypeId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeWorkflowTypeId, pathname, router]);

  React.useEffect(() => {
    if (!showCurrentTab && activeTab === 'current') {
      setActiveTab('assignments');
    }
  }, [activeTab, showCurrentTab]);

  const pilot = useFacilitiesPilot(activeWorkflowTypeId, currentFilter, {
    includeCurrent: showCurrentTab,
  });

  const filteredCurrentItems = React.useMemo(
    () =>
      filterRequestsByWorkflow(
        pilot.currentQuery.data?.items ?? [],
        listScope,
        activeWorkflowTypeId,
      ),
    [activeWorkflowTypeId, listScope, pilot.currentQuery.data?.items],
  );

  const filteredAssignedItems = React.useMemo(
    () =>
      filterRequestsByWorkflow(
        pilot.assignmentsQuery.data?.assignedItems ?? [],
        listScope,
        activeWorkflowTypeId,
      ),
    [activeWorkflowTypeId, listScope, pilot.assignmentsQuery.data?.assignedItems],
  );

  const filteredPendingActionItems = React.useMemo(
    () =>
      filterRequestsByWorkflow(
        pilot.assignmentsQuery.data?.pendingActionItems ?? [],
        listScope,
        activeWorkflowTypeId,
      ),
    [activeWorkflowTypeId, listScope, pilot.assignmentsQuery.data?.pendingActionItems],
  );

  const filteredMineItems = React.useMemo(
    () => filterRequestsByWorkflow(pilot.mineQuery.data?.items ?? [], listScope, activeWorkflowTypeId),
    [activeWorkflowTypeId, listScope, pilot.mineQuery.data?.items],
  );

  const filteredMineGroups = React.useMemo(
    () =>
      filterMonthGroupsByWorkflow(
        pilot.mineQuery.data?.groups ?? [],
        listScope,
        activeWorkflowTypeId,
      ),
    [activeWorkflowTypeId, listScope, pilot.mineQuery.data?.groups],
  );

  const activeWorkflowName = pilot.catalogQuery.data?.workflowName ?? activeWorkflowConfig.label;
  const scopeLabel =
    listScope === 'all' ? 'todos os workflows' : `somente ${activeWorkflowName.toLowerCase()}`;

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
        description="Rota unica para operar manutencao e suprimentos sem depender do frontend legado."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">Workflow ativo</p>
              <Badge variant="outline">{activeWorkflowConfig.shortLabel}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              A mesma rota opera dois workflows publicados. A URL espelha a selecao atual para
              deep-link e refresh consistente.
            </p>
            <p className="text-sm text-muted-foreground">Catalogo ativo: {activeWorkflowName}.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FACILITIES_PILOT_WORKFLOWS.map((workflow) => (
              <Button
                key={workflow.workflowTypeId}
                type="button"
                variant={workflow.workflowTypeId === activeWorkflowTypeId ? 'default' : 'outline'}
                onClick={() => setActiveWorkflowTypeId(workflow.workflowTypeId)}
              >
                {workflow.shortLabel}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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
        uploadFile={(input) => uploadWorkflowFile(user, input)}
        onSubmit={handleOpenWorkflow}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            {showCurrentTab ? <TabsTrigger value="current">Chamados atuais</TabsTrigger> : null}
            <TabsTrigger value="assignments">Atribuicoes e acoes</TabsTrigger>
            <TabsTrigger value="mine">Minhas solicitacoes</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={listScope === 'all' ? 'secondary' : 'outline'}
              onClick={() => setListScope('all')}
            >
              Todos os workflows
            </Button>
            <Button
              type="button"
              size="sm"
              variant={listScope === 'active' ? 'secondary' : 'outline'}
              onClick={() => setListScope('active')}
            >
              Somente workflow ativo
            </Button>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          As metricas do topo permanecem globais. As listas abaixo exibem {scopeLabel}.
        </p>

        {showCurrentTab ? (
          <TabsContent value="current">
            <CurrentQueueTab
              filter={currentFilter}
              items={filteredCurrentItems}
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
              scopeLabel={scopeLabel}
              onFilterChange={setCurrentFilter}
              onOpenRequest={setSelectedRequest}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="assignments">
          <AssignmentsTab
            assignedItems={filteredAssignedItems}
            pendingActionItems={filteredPendingActionItems}
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
            scopeLabel={scopeLabel}
            onOpenRequest={setSelectedRequest}
          />
        </TabsContent>

        <TabsContent value="mine">
          <MyRequestsTab
            groups={filteredMineGroups}
            items={filteredMineItems}
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
            scopeLabel={scopeLabel}
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
