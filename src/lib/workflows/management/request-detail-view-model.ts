import type { WorkflowManagementRequestDetailData } from './types';

export type RequestOperationalTone =
  | 'respond-action'
  | 'ready-to-advance'
  | 'ready-to-finalize'
  | 'request-action'
  | 'read-only';

export type RequestOperationalPrimaryAction =
  | { kind: 'advance'; label: 'Avancar etapa' }
  | { kind: 'finalize'; label: 'Finalizar chamado' };

export type RequestOperationalViewModel = {
  tone: RequestOperationalTone;
  title: string;
  description: string;
  highlightLabel?: string;
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
      showActionZoneAsPrimary: false,
      shouldRenderActionZone,
      primaryAction: {
        kind: 'advance',
        label: 'Avancar etapa',
      },
    };
  }

  if (permissions.canFinalize) {
    return {
      tone: 'ready-to-finalize',
      title: 'Pronto para concluir',
      description: 'O chamado ja atingiu a etapa imediatamente anterior a conclusao oficial.',
      highlightLabel: 'Conclusao disponivel',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone,
      primaryAction: {
        kind: 'finalize',
        label: 'Finalizar chamado',
      },
    };
  }

  if (permissions.canRequestAction && action.available) {
    return {
      tone: 'request-action',
      title: 'Action disponivel para esta etapa',
      description: `A etapa ${summary.currentStepName} pode abrir uma action operacional oficial.`,
      highlightLabel: 'Acao de etapa disponivel',
      showActionZoneAsPrimary: true,
      shouldRenderActionZone: true,
      primaryAction: null,
    };
  }

  return {
    tone: 'read-only',
    title: 'Sem acao operacional imediata',
    description:
      'O detalhe oficial nao expoe uma proxima acao para o ator autenticado neste momento.',
    showActionZoneAsPrimary: false,
    shouldRenderActionZone,
    primaryAction: null,
  };
}
