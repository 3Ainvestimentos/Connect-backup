"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Loader2, Save, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  publishWorkflowVersion,
  fetchWorkflowDraftEditor,
  saveWorkflowDraft,
  WorkflowConfigApiError,
} from '@/lib/workflows/admin-config/api-client';
import { buildAccessPreview } from '@/lib/workflows/admin-config/draft-readiness';
import type { SaveWorkflowDraftInput } from '@/lib/workflows/admin-config/types';
import { WorkflowDraftAccessSection } from './WorkflowDraftAccessSection';
import { WorkflowDraftFieldsSection } from './WorkflowDraftFieldsSection';
import { WorkflowDraftGeneralSection } from './WorkflowDraftGeneralSection';
import { WorkflowDraftReadinessPanel } from './WorkflowDraftReadinessPanel';
import { WorkflowDraftStepsSection } from './WorkflowDraftStepsSection';
import type { WorkflowDraftDirtyState, WorkflowDraftFormValues } from './types';

function buildDefaultValues(): WorkflowDraftFormValues {
  return {
    general: {
      name: '',
      description: '',
      icon: 'FileText',
      areaId: '',
      areaName: '',
      ownerUserId: '',
      ownerEmail: '',
      defaultSlaDays: 0,
      activeOnPublish: true,
    },
    access: {
      mode: 'all',
      allowedUserIds: ['all'],
      preview: 'Acesso publico para todos os colaboradores',
    },
    fields: [],
    steps: [],
  };
}

export function WorkflowDraftEditorPage({
  workflowTypeId,
  version,
  onClose,
  onRefresh,
  embedded = false,
  onDirtyStateChange,
}: {
  workflowTypeId: string;
  version: number;
  onClose?: () => void;
  onRefresh?: () => void;
  embedded?: boolean;
  onDirtyStateChange?: (state: WorkflowDraftDirtyState) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<WorkflowDraftFormValues>({
    defaultValues: buildDefaultValues(),
  });

  const draftQuery = useQuery({
    queryKey: ['workflow-config-admin', user?.uid, 'draft-editor', workflowTypeId, version],
    queryFn: async () => {
      if (!user) {
        throw new WorkflowConfigApiError('UNAUTHORIZED', 'Usuario nao autenticado.', 401);
      }

      return fetchWorkflowDraftEditor(user, workflowTypeId, version);
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!draftQuery.data) {
      return;
    }

    form.reset({
      general: draftQuery.data.draft.general,
      access: draftQuery.data.draft.access,
      fields: draftQuery.data.draft.fields,
      steps: draftQuery.data.draft.steps,
    });
  }, [draftQuery.data, form]);

  const watchedOwnerUserId = form.watch('general.ownerUserId');
  const watchedOwnerEmail = form.watch('general.ownerEmail');
  const watchedMode = form.watch('access.mode');
  const watchedAccessIds = form.watch('access.allowedUserIds');
  const editorMode = draftQuery.data?.draft.mode ?? 'edit';
  const isReadOnly = editorMode === 'read-only';

  useEffect(() => {
    if (!draftQuery.data) {
      return;
    }

    const normalizedOwnerEmail = watchedOwnerEmail.trim().toLowerCase();
    const owner =
      draftQuery.data.lookups.owners.find((item) => item.userId === watchedOwnerUserId) ||
      (watchedOwnerUserId.trim() === '' && normalizedOwnerEmail !== ''
        ? draftQuery.data.lookups.owners.find((item) => item.email.trim().toLowerCase() === normalizedOwnerEmail)
        : undefined);

    if (!owner) {
      return;
    }

    if (watchedOwnerUserId !== owner.userId) {
      form.setValue('general.ownerUserId', owner.userId, { shouldDirty: false });
    }

    if (watchedOwnerEmail !== owner.email) {
      form.setValue('general.ownerEmail', owner.email, { shouldDirty: false });
    }
  }, [draftQuery.data, form, watchedOwnerEmail, watchedOwnerUserId]);

  useEffect(() => {
    form.setValue('access.preview', buildAccessPreview(watchedMode, watchedAccessIds), { shouldDirty: false });
  }, [form, watchedAccessIds, watchedMode]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty || isReadOnly) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty, isReadOnly]);

  useEffect(() => {
    onDirtyStateChange?.({
      isDirty: form.formState.isDirty,
      isReadOnly,
    });
  }, [form.formState.isDirty, isReadOnly, onDirtyStateChange]);

  function handleClose() {
    if (!isReadOnly && form.formState.isDirty && !window.confirm('Existem alteracoes nao salvas. Deseja fechar mesmo assim?')) {
      return;
    }

    if (onClose) {
      onClose();
      return;
    }

    router.push('/admin/request-config');
  }

  const saveMutation = useMutation({
    mutationFn: async (values: WorkflowDraftFormValues) => {
      if (!user) {
        throw new WorkflowConfigApiError('UNAUTHORIZED', 'Usuario nao autenticado.', 401);
      }

      const payload: SaveWorkflowDraftInput = {
        general: {
          name: values.general.name,
          description: values.general.description,
          icon: values.general.icon,
          ownerUserId: values.general.ownerUserId,
          defaultSlaDays: values.general.defaultSlaDays,
          activeOnPublish: values.general.activeOnPublish,
        },
        access: {
          mode: values.access.mode,
          allowedUserIds: values.access.allowedUserIds,
        },
        fields: values.fields,
        steps: values.steps.map((step) => ({
          stepId: step.stepId,
          stepName: step.stepName,
          action: step.action
            ? {
                type: step.action.type,
                label: step.action.label,
                approverCollaboratorDocIds: step.action.approvers.map((approver) => approver.collaboratorDocId),
                unresolvedApproverIds: step.action.unresolvedApproverIds || [],
                commentRequired: step.action.commentRequired,
                attachmentRequired: step.action.attachmentRequired,
                commentPlaceholder: step.action.commentPlaceholder,
                attachmentPlaceholder: step.action.attachmentPlaceholder,
              }
            : undefined,
        })),
      };

      return saveWorkflowDraft(user, workflowTypeId, version, payload);
    },
    onSuccess: async () => {
      toast({
        title: 'Rascunho salvo',
        description: 'As alteracoes foram persistidas sem publicar a versao.',
      });
      onRefresh?.();
      const refreshed = await draftQuery.refetch();
      if (refreshed.data) {
        form.reset({
          general: refreshed.data.draft.general,
          access: refreshed.data.draft.access,
          fields: refreshed.data.draft.fields,
          steps: refreshed.data.draft.steps,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Falha ao salvar rascunho',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new WorkflowConfigApiError('UNAUTHORIZED', 'Usuario nao autenticado.', 401);
      }

      return publishWorkflowVersion(user, workflowTypeId, version);
    },
    onSuccess: async () => {
      toast({
        title: 'Versao publicada',
        description: 'A versao foi publicada e ativada no runtime.',
      });
      onRefresh?.();
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Falha ao publicar versao',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  const readiness = useMemo(
    () => draftQuery.data?.draft.publishReadiness || [],
    [draftQuery.data?.draft.publishReadiness],
  );

  if (draftQuery.isLoading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[480px]' : 'min-h-[calc(100vh-var(--header-height))]'}`}>
        <LoadingSpinner message="Carregando editor de versao" />
      </div>
    );
  }

  if (draftQuery.isError || !draftQuery.data) {
    return (
      <div className={embedded ? 'p-1' : 'p-6 md:p-8'}>
        <Alert variant="destructive">
          <AlertTitle>Falha ao carregar o editor</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{draftQuery.error instanceof Error ? draftQuery.error.message : 'Erro inesperado.'}</p>
            <Button variant="outline" onClick={() => draftQuery.refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form
        className={embedded ? 'space-y-6' : 'space-y-6 p-6 md:p-8'}
        onSubmit={form.handleSubmit(async (values) => {
          if (!isReadOnly) {
            await saveMutation.mutateAsync(values);
          }
        })}
      >
        <PageHeader
          title={draftQuery.data.draft.general.name || 'Nova versao'}
          description={
            isReadOnly
              ? 'Visualizacao somente leitura da versao publicada dentro do mesmo shell administrativo.'
              : 'Edite configuracao geral, acesso, campos e etapas sem afetar a versao publicada.'
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                {embedded ? <X className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                {embedded ? 'Fechar' : 'Voltar ao catalogo'}
              </Button>
              {!isReadOnly ? (
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar rascunho
                </Button>
              ) : (
                <Button type="button" variant="secondary" disabled>
                  <Eye className="mr-2 h-4 w-4" />
                  Somente leitura
                </Button>
              )}
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{draftQuery.data.draft.derivedStatus}</Badge>
          <Badge variant="secondary">v{draftQuery.data.draft.version}</Badge>
          {draftQuery.data.draft.isNewWorkflowType ? <Badge variant="outline">Tipo novo</Badge> : null}
          {isReadOnly ? <Badge variant="secondary">Publicado</Badge> : null}
        </div>

        <WorkflowDraftGeneralSection
          areas={draftQuery.data.lookups.areas}
          owners={draftQuery.data.lookups.owners}
          workflowTypeId={workflowTypeId}
          version={version}
          readOnly={isReadOnly}
        />
        <WorkflowDraftAccessSection
          collaborators={draftQuery.data.lookups.collaborators}
          readOnly={isReadOnly}
        />
        <WorkflowDraftFieldsSection readOnly={isReadOnly} />
        <WorkflowDraftStepsSection
          collaborators={draftQuery.data.lookups.collaborators}
          readOnly={isReadOnly}
        />
        <WorkflowDraftReadinessPanel
          issues={readiness}
          canPublish={draftQuery.data.draft.canPublish}
          isPublishing={publishMutation.isPending}
          hasUnsavedChanges={form.formState.isDirty}
          onPublish={() => {
            void publishMutation.mutateAsync();
          }}
          readOnly={isReadOnly}
        />
      </form>
    </FormProvider>
  );
}
