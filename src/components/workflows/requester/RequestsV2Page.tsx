'use client';

import * as React from 'react';
import { useRequesterCatalog, useOpenRequesterWorkflow } from '@/hooks/use-requester-workflows';
import { useWorkflowAreas } from '@/contexts/WorkflowAreasContext';
import { WorkflowAreaGrid } from './WorkflowAreaGrid';
import { WorkflowSelectionModal } from './WorkflowSelectionModal';
import { WorkflowSubmissionModal } from './WorkflowSubmissionModal';
import { MyRequestsV2Section } from './MyRequestsV2Section';
import { RequesterUnifiedRequestDetailDialog } from './RequesterUnifiedRequestDetailDialog';
import type { RequesterCatalogArea, RequesterCatalogWorkflow } from '@/lib/workflows/requester/catalog-types';
import type { RequesterUnifiedRequestListItem } from '@/lib/workflows/requester/unified-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';

export function RequestsV2Page() {
  const { data: catalog, isLoading, error } = useRequesterCatalog();
  const { workflowAreas } = useWorkflowAreas();
  const [selectedArea, setSelectedArea] = React.useState<RequesterCatalogArea | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<RequesterCatalogWorkflow | null>(null);
  const [showSelectionModal, setShowSelectionModal] = React.useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<RequesterUnifiedRequestListItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = React.useState(false);
  const { toast } = useToast();

  // `areaLabelById` vem de `useWorkflowAreas()`, e nao do catalogo requester v2.
  // O catalogo pode nao conter todas as areas legadas nem areas v2 desativadas.
  const areaLabelById = React.useMemo(() => {
    return new Map((workflowAreas ?? []).map((area) => [area.id, area.name]));
  }, [workflowAreas]);

  const resetSubmissionFlow = React.useCallback(() => {
    setShowSubmissionModal(false);
    setSelectedWorkflow(null);
    setSelectedArea(null);
  }, []);

  const handleSubmissionSuccess = (requestId: number) => {
    toast({
      title: 'Solicitação aberta com sucesso!',
      description: `Seu numero de solicitação e ${requestId}.`,
    });

    resetSubmissionFlow();
  };

  const handleAreaClick = (area: RequesterCatalogArea) => {
    if (area.workflows.length === 1) {
      setSelectedArea(area);
      setSelectedWorkflow(area.workflows[0]);
      setShowSubmissionModal(true);
    } else {
      setSelectedArea(area);
      setShowSelectionModal(true);
    }
  };

  const handleWorkflowSelect = (workflow: RequesterCatalogWorkflow) => {
    if (!selectedArea) return;
    setSelectedWorkflow(workflow);
    setShowSelectionModal(false);
    setShowSubmissionModal(true);
  };

  const handleSelectRequest = (item: RequesterUnifiedRequestListItem) => {
    setSelectedItem(item);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div>
        <PageHeader
          title="Solicitações"
          description="Inicie processos e acesse as ferramentas da empresa."
        />

        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-48 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              Nao foi possivel carregar o catalogo de solicitacoes.
            </p>
          </div>
        ) : !catalog || catalog.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma area disponivel no momento.
            </p>
          </div>
        ) : (
          <WorkflowAreaGrid areas={catalog} onAreaClick={handleAreaClick} />
        )}
      </div>

      <Separator />

      <WorkflowSelectionModal
        open={showSelectionModal}
        onOpenChange={setShowSelectionModal}
        area={selectedArea}
        onWorkflowSelect={handleWorkflowSelect}
      />

      <WorkflowSubmissionModal
        open={showSubmissionModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            resetSubmissionFlow();
          }
        }}
        workflow={selectedWorkflow}
        onSuccess={handleSubmissionSuccess}
      />

      <MyRequestsV2Section onSelectRequest={handleSelectRequest} />

      <RequesterUnifiedRequestDetailDialog
        open={showDetailDialog}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowDetailDialog(false);
            setSelectedItem(null);
          }
        }}
        selected={selectedItem}
        areaLabelById={areaLabelById}
      />
    </div>
  );
}
