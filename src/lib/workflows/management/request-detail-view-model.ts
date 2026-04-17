import type { WorkflowManagementRequestDetailData } from './types';

export type RequestOperationalTone =
  | 'respond-action'
  | 'ready-to-advance'
  | 'ready-to-finalize'
  | 'request-action'
  | 'read-only';

export type RequestOperationalPrimaryAction =
  | { kind: 'advance'; label: 'Avancar etapa'; busyLabel: 'Avancando...' }
  | { kind: 'finalize'; label: 'Finalizar chamado'; busyLabel: 'Finalizando...' };

export type RequestOperationalViewModel = {
  tone: RequestOperationalTone;
  title: string;
  description: string;
  highlightLabel?: string;
  statusNote?: string;
  showActionZoneAsPrimary: boolean;
  shouldRenderActionZone: boolean;
  primaryAction: RequestOperationalPrimaryAction | null;
};

export function buildRequestOperationalViewModel(
  detail: WorkflowManagementRequestDetailData,
): RequestOperationalViewModel {
  const { summary, permissions, action } = detail;
  const shouldRenderActionZone = action.available || Boolean(action.configurationError);

  if (permissions.canRespondAction && action.canRespond) {
    return {
      tone: 'respond-action',
      title: 'Aguardando sua resposta',
      description: `A etapa ${summary.currentStepName} depende da sua resposta na action atual.`,
      highlightLabel: 'Voce precisa agir agora',
      statusNote: 'A continuidade oficial do chamado volta a ficar disponivel depois da resposta.',
      showActionZoneAsPrimary: true,
      shouldRenderActionZone,
      primaryAction: null,
    };
  }

  if (permissions.canAdvance) {
    return {
      tone: 'ready-to-advance',
      title: 'Pronto para avancar',
      description: `A etapa ${summary.currentStepName} ja pode seguir para o proximo passo oficial.`,
      highlightLabel: 'Proximo passo disponivel',
      statusNote:
        action.state === 'completed'
          ? 'A action atual ja foi concluida e o chamado aguarda apenas a continuidade oficial.'
          : 'Nenhuma pendencia adicional bloqueia o proximo passo oficial neste momento.',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone,
      primaryAction: {
        kind: 'advance',
        label: 'Avancar etapa',
        busyLabel: 'Avancando...',
      },
    };
  }

  if (permissions.canFinalize) {
    return {
      tone: 'ready-to-finalize',
      title: 'Pronto para concluir',
      description: 'O chamado ja atingiu a etapa imediatamente anterior a conclusao oficial.',
      highlightLabel: 'Conclusao disponivel',
      statusNote: 'A finalizacao encerra o fluxo operacional e mantem apenas a camada administrativa quando autorizada.',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone,
      primaryAction: {
        kind: 'finalize',
        label: 'Finalizar chamado',
        busyLabel: 'Finalizando...',
      },
    };
  }

  if (permissions.canRequestAction && action.available) {
    return {
      tone: 'request-action',
      title: 'Action disponivel para esta etapa',
      description: `A etapa ${summary.currentStepName} pode abrir uma action operacional oficial.`,
      highlightLabel: 'Acao de etapa disponivel',
      statusNote: 'Solicite a action somente quando o destinatario ja puder assumir o proximo passo desta etapa.',
      showActionZoneAsPrimary: true,
      shouldRenderActionZone: true,
      primaryAction: null,
    };
  }

  if (summary.statusCategory === 'finalized') {
    return {
      tone: 'read-only',
      title: 'Chamado concluido',
      description: permissions.canArchive
        ? 'O fluxo operacional foi encerrado e restam apenas acoes administrativas autorizadas.'
        : 'O fluxo operacional foi encerrado e este chamado permanece disponivel apenas para consulta.',
      highlightLabel: 'Conclusao registrada',
      statusNote: permissions.canArchive
        ? 'Use o arquivamento apenas quando for necessario retirar o chamado da fila ativa.'
        : 'Nenhuma nova acao operacional ou administrativa adicional esta disponivel para o ator autenticado.',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone,
      primaryAction: null,
    };
  }

  return {
    tone: 'read-only',
    title: summary.isArchived ? 'Chamado arquivado' : 'Sem acao operacional imediata',
    description: summary.isArchived
      ? 'Este chamado permanece disponivel apenas para consulta.'
      : 'O detalhe oficial nao expoe uma proxima acao para o ator autenticado neste momento.',
    statusNote: summary.isArchived
      ? 'Nenhum CTA operacional ou administrativo adicional deve ser reintroduzido fora do payload oficial.'
      : undefined,
    showActionZoneAsPrimary: false,
    shouldRenderActionZone,
    primaryAction: null,
  };
}
