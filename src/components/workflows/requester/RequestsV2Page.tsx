'use client';

import * as React from 'react';
import { useRequesterCatalog } from '@/hooks/use-requester-workflows';
import { WorkflowAreaGrid } from './WorkflowAreaGrid';
import { WorkflowSelectionModal } from './WorkflowSelectionModal';
import { WorkflowSubmissionModal } from './WorkflowSubmissionModal';
import type { RequesterCatalogArea, RequesterCatalogWorkflow } from '@/lib/workflows/requester/catalog-types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export function RequestsV2Page() {
  const { data: catalog, isLoading, error } = useRequesterCatalog();
  const [selectedArea, setSelectedArea] = React.useState<RequesterCatalogArea | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<RequesterCatalogWorkflow | null>(null);
  const [showSelectionModal, setShowSelectionModal] = React.useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = React.useState(false);
  const [submittedRequestId, setSubmittedRequestId] = React.useState<number | null>(null);
  const { toast } = useToast();

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

  const handleSubmissionSuccess = (requestId: number) => {
    setSubmittedRequestId(requestId);
    toast({
      title: 'Solicitacao aberta com sucesso!',
      description: `Seu numero de solicitacao e ${requestId}.`,
    });
  };

  const handleSubmissionModalClose = () => {
    setShowSubmissionModal(false);
    setSelectedWorkflow(null);
    setSelectedArea(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Solicitacoes</h1>
        <p className="text-muted-foreground mt-2">
          Selecione uma area para abrir sua solicitacao.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
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

      <WorkflowSelectionModal
        open={showSelectionModal}
        onOpenChange={setShowSelectionModal}
        area={selectedArea}
        onWorkflowSelect={handleWorkflowSelect}
      />

      <WorkflowSubmissionModal
        open={showSubmissionModal}
        onOpenChange={handleSubmissionModalClose}
        workflow={selectedWorkflow}
        onSuccess={handleSubmissionSuccess}
      />
    </div>
  );
}
