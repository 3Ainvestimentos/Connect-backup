import {
  formatManagementDate,
} from './presentation';
import type { WorkflowManagementRequestDetailData } from './types';

type CollaboratorLike = {
  id3a?: string | null;
  name: string;
};

export type RequestOperationalTone =
  | 'respond-action'
  | 'ready-to-advance'
  | 'ready-to-finalize'
  | 'request-action'
  | 'read-only';

export type RequestOperationalPrimaryAction =
  | { kind: 'advance'; label: 'Avançar etapa'; busyLabel: 'Avançando...' }
  | { kind: 'finalize'; label: 'Finalizar chamado'; busyLabel: 'Finalizando...' };

export type RequestOperationalViewModel = {
  tone: RequestOperationalTone;
  title: string;
  contextLine: string;
  informationalState?: {
    label: string;
    value: string;
  };
  primaryAction: RequestOperationalPrimaryAction | null;
  requestTargetRecipients: string[];
  shouldRenderOperationalSummary: boolean;
};

export type RequestDetailShellSummaryItem = {
  label: string;
  value: string;
};

export type RequestDetailShellViewModel = {
  operational: RequestOperationalViewModel;
  header: {
    title: string;
    description: string;
  };
  summary: {
    areaLabel: string;
    metaItems: RequestDetailShellSummaryItem[];
  };
  currentAction: {
    priority: 'continuity' | 'action' | 'admin' | 'read-only';
    shouldRenderActionCard: boolean;
    shouldRenderAdminPanel: boolean;
    shouldRenderSection: boolean;
  };
  history: {
    hasLegacyFallback: boolean;
  };
};

function formatNameList(values: string[]): string {
  if (values.length === 0) {
    return '';
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} e ${values[1]}`;
  }

  return `${values.slice(0, -1).join(', ')} e ${values[values.length - 1]}`;
}

function resolveFriendlyCollaboratorLabel(
  collaborators: CollaboratorLike[],
  userId: string | null | undefined,
  fallbackName?: string | null,
): string {
  if (fallbackName?.trim()) {
    return fallbackName.trim();
  }

  if (!userId) {
    return 'Colaborador configurado';
  }

  const collaborator = collaborators.find((item) => item.id3a === userId);
  if (collaborator?.name.trim()) {
    return collaborator.name.trim();
  }

  return 'Colaborador configurado';
}

function buildRequestTargetRecipients(
  detail: WorkflowManagementRequestDetailData,
  collaborators: CollaboratorLike[],
): string[] {
  const labels = detail.action.recipients.map((recipient) =>
    resolveFriendlyCollaboratorLabel(collaborators, recipient.recipientUserId),
  );

  return [...new Set(labels)];
}

export function buildRequestOperationalViewModel(
  detail: WorkflowManagementRequestDetailData,
  collaborators: CollaboratorLike[] = [],
): RequestOperationalViewModel {
  const { summary, permissions, action } = detail;
  const requestTargetRecipients = buildRequestTargetRecipients(detail, collaborators);
  const hasPendingActionWithThirdParties =
    action.state === 'pending' &&
    action.recipients.some((recipient) => recipient.status === 'pending') &&
    !(permissions.canRespondAction && action.canRespond);

  if (permissions.canRespondAction && action.canRespond) {
    return {
      tone: 'respond-action',
      title: 'Sua resposta está pendente',
      contextLine: `Responda a action da etapa ${summary.currentStepName} para liberar a continuidade oficial.`,
      primaryAction: null,
      requestTargetRecipients,
      shouldRenderOperationalSummary: true,
    };
  }

  if (permissions.canAdvance) {
    return {
      tone: 'ready-to-advance',
      title: 'Continuidade oficial liberada',
      contextLine:
        action.state === 'completed'
          ? 'A action da etapa já foi concluída e o chamado aguarda apenas o avanço oficial.'
          : `A etapa ${summary.currentStepName} já pode avançar para o próximo passo oficial.`,
      informationalState:
        action.state === 'completed'
          ? {
              label: 'Action da etapa',
              value: 'Concluída',
            }
          : undefined,
      primaryAction: {
        kind: 'advance',
        label: 'Avançar etapa',
        busyLabel: 'Avançando...',
      },
      requestTargetRecipients,
      shouldRenderOperationalSummary: true,
    };
  }

  if (permissions.canFinalize) {
    return {
      tone: 'ready-to-finalize',
      title: 'Finalização disponível',
      contextLine: 'O fluxo já atingiu a etapa final e pode ser encerrado oficialmente.',
      primaryAction: {
        kind: 'finalize',
        label: 'Finalizar chamado',
        busyLabel: 'Finalizando...',
      },
      requestTargetRecipients,
      shouldRenderOperationalSummary: true,
    };
  }

  if (permissions.canRequestAction && action.available && action.canRequest) {
    return {
      tone: 'request-action',
      title: 'Solicitação de action disponível',
      contextLine:
        requestTargetRecipients.length > 0
          ? `A solicitação desta etapa será enviada para ${formatNameList(requestTargetRecipients)}.`
          : `A etapa ${summary.currentStepName} permite abrir uma action operacional oficial.`,
      primaryAction: null,
      requestTargetRecipients,
      shouldRenderOperationalSummary: true,
    };
  }

  if (hasPendingActionWithThirdParties) {
    const pendingRecipients = [
      ...new Set(
        action.recipients
          .filter((recipient) => recipient.status === 'pending')
          .map((recipient) =>
            resolveFriendlyCollaboratorLabel(collaborators, recipient.recipientUserId),
          ),
      ),
    ];

    return {
      tone: 'read-only',
      title: 'Action pendente com terceiros',
      contextLine: 'A continuidade do chamado depende da resposta da action atual.',
      informationalState: {
        label: pendingRecipients.length > 1 ? 'Pendências com' : 'Pendente com',
        value: formatNameList(pendingRecipients),
      },
      primaryAction: null,
      requestTargetRecipients,
      shouldRenderOperationalSummary: true,
    };
  }

  if (summary.statusCategory === 'finalized') {
    return {
      tone: 'read-only',
      title: 'Chamado concluído',
      contextLine: permissions.canArchive
        ? 'O fluxo operacional foi encerrado e restam apenas ações administrativas autorizadas.'
        : 'O fluxo operacional foi encerrado e este chamado permanece disponível apenas para consulta.',
      informationalState: permissions.canArchive
        ? {
            label: 'Próximo passo',
            value: 'Arquive apenas quando precisar retirar o chamado da fila ativa.',
          }
        : {
            label: 'Status',
            value: 'Consulta apenas',
          },
      primaryAction: null,
      requestTargetRecipients,
      shouldRenderOperationalSummary: true,
    };
  }

  if (summary.isArchived) {
    return {
      tone: 'read-only',
      title: 'Chamado arquivado',
      contextLine: 'Este chamado permanece disponível apenas para consulta.',
      informationalState: {
        label: 'Status',
        value: 'Arquivado',
      },
      primaryAction: null,
      requestTargetRecipients,
      shouldRenderOperationalSummary: true,
    };
  }

  if (summary.statusCategory === 'in_progress' && summary.hasResponsible) {
    return {
      tone: 'read-only',
      title: 'Chamado em andamento',
      contextLine: 'O próximo passo operacional segue com o responsável atual.',
      informationalState: {
        label: 'Responsável atual',
        value: summary.responsibleName || 'Responsável definido',
      },
      primaryAction: null,
      requestTargetRecipients,
      shouldRenderOperationalSummary: true,
    };
  }

  return {
    tone: 'read-only',
    title: 'Sem ação operacional imediata',
    contextLine: 'O detalhe oficial não expõe uma próxima ação para o ator autenticado neste momento.',
    primaryAction: null,
    requestTargetRecipients,
    shouldRenderOperationalSummary: false,
  };
}

function getSummaryAreaLabel(detail: WorkflowManagementRequestDetailData): string {
  return detail.summary.areaLabel?.trim() || detail.summary.areaId || '-';
}

function buildSummaryMetaItems(detail: WorkflowManagementRequestDetailData): RequestDetailShellSummaryItem[] {
  return [
    { label: 'Solicitante', value: detail.summary.requesterName || '-' },
    { label: 'Finalizado em', value: formatManagementDate(detail.summary.finalizedAt) },
    { label: 'Responsavel', value: detail.summary.responsibleName || 'Nao atribuido' },
    { label: 'Arquivado em', value: formatManagementDate(detail.summary.archivedAt) },
    { label: 'Aberto em', value: formatManagementDate(detail.summary.submittedAt) },
    { label: 'Area', value: getSummaryAreaLabel(detail) },
    { label: 'Owner', value: detail.summary.ownerEmail || '-' },
    { label: 'Ultima atualizacao', value: formatManagementDate(detail.summary.lastUpdatedAt) },
  ];
}

function resolveCurrentActionPrimaryMode(
  detail: WorkflowManagementRequestDetailData,
  operational: RequestOperationalViewModel,
): RequestDetailShellViewModel['currentAction']['priority'] {
  if (operational.primaryAction) {
    return 'continuity';
  }

  if (detail.permissions.canRespondAction || detail.permissions.canRequestAction) {
    return 'action';
  }

  if (operational.shouldRenderOperationalSummary) {
    return 'read-only';
  }

  if (detail.permissions.canAssign && !detail.summary.hasResponsible) {
    return 'admin';
  }

  if (detail.permissions.canAssign || detail.permissions.canArchive) {
    return 'admin';
  }

  return 'read-only';
}

function buildHeaderDescription(
  detail: WorkflowManagementRequestDetailData,
): string {
  const workflowLabel = detail.summary.workflowName || detail.summary.workflowTypeId;
  return `${workflowLabel} • Etapa atual: ${detail.summary.currentStepName}.`;
}

export function buildRequestDetailShellViewModel(
  detail: WorkflowManagementRequestDetailData,
  collaborators: CollaboratorLike[] = [],
): RequestDetailShellViewModel {
  const operational = buildRequestOperationalViewModel(detail, collaborators);
  const shouldRenderActionCard = detail.action.available || Boolean(detail.action.configurationError);
  const shouldRenderAdminPanel = detail.permissions.canAssign || detail.permissions.canArchive;

  return {
    operational,
    header: {
      title: `Chamado #${detail.summary.requestId}`,
      description: buildHeaderDescription(detail),
    },
    summary: {
      areaLabel: getSummaryAreaLabel(detail),
      metaItems: buildSummaryMetaItems(detail),
    },
    currentAction: {
      priority: resolveCurrentActionPrimaryMode(detail, operational),
      shouldRenderActionCard,
      shouldRenderAdminPanel,
      shouldRenderSection:
        operational.shouldRenderOperationalSummary || shouldRenderActionCard || shouldRenderAdminPanel,
    },
    history: {
      hasLegacyFallback: !Array.isArray(detail.stepsHistory),
    },
  };
}
