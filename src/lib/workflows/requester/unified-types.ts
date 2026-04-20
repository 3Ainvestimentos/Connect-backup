import type { WorkflowReadSummary, WorkflowRequestDetailData } from '@/lib/workflows/read/types';
import type { WorkflowRequestTimelineItem } from '@/lib/workflows/read/types';
import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import type { WorkflowArea } from '@/contexts/WorkflowAreasContext';

/** Discriminante que diferencia origens do mesmo shape unificado. */
export type RequesterUnifiedOrigin = 'legacy' | 'v2';

/**
 * Chave estavel de selecao. Sempre `${origin}:${id}` para evitar colisao
 * entre requestId numerico v2 e requestId string legado.
 */
export type RequesterUnifiedDetailKey = `legacy:${string}` | `v2:${number}`;

/**
 * View-model minimo da tabela "Minhas Solicitacoes" unificada.
 * Campos `*Label` sao sempre strings prontas para exibicao (degradacao
 * elegante: `'-'` em vez de undefined).
 */
export interface RequesterUnifiedRequestListItemBase {
  origin: RequesterUnifiedOrigin;
  detailKey: RequesterUnifiedDetailKey;
  /** Id exibido em `#`. Para v2 e numero; para legado e string. */
  displayRequestId: string;
  workflowName: string;
  statusLabel: string;
  statusVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  expectedCompletionLabel: string;
  /** Date normalizada para ordenacao / formatacao na UI. Pode ser `null`. */
  expectedCompletionAt: Date | null;
  submittedAt: Date | null;
  lastUpdatedAt: Date | null;
}

export interface RequesterUnifiedV2ListItem extends RequesterUnifiedRequestListItemBase {
  origin: 'v2';
  detailKey: `v2:${number}`;
  requestId: number;
  raw: WorkflowReadSummary;
}

export interface RequesterUnifiedLegacyListItem extends RequesterUnifiedRequestListItemBase {
  origin: 'legacy';
  detailKey: `legacy:${string}`;
  requestDocId: string;
  raw: {
    request: WorkflowRequest;
    definition: WorkflowDefinition | null;
    workflowArea: WorkflowArea | null;
  };
}

export type RequesterUnifiedRequestListItem =
  | RequesterUnifiedV2ListItem
  | RequesterUnifiedLegacyListItem;

/** Detalhe unificado para o dialog. */
export interface RequesterUnifiedRequestDetailSummary {
  requesterName: string;
  workflowName: string;
  displayRequestId: string;
  submittedAt: Date | null;
  lastUpdatedAt: Date | null;
  responsibleName: string | null;
  openedInLabel: string;
  statusLabel: string;
  currentStepName: string | null;
}

export interface RequesterUnifiedRequestDetailField {
  fieldId: string;
  label: string;
  value: unknown;
  type: string; // 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file' | outros
  order?: number;
}

export interface RequesterUnifiedRequestDetailAttachment {
  fieldId: string;
  label: string;
  url: string;
  fileName?: string;
  order?: number;
}

export interface RequesterUnifiedRequestDetailTimelineItem {
  label: string;
  timestamp: Date | null;
  userName: string;
  action: WorkflowRequestTimelineItem['action'] | null;
  details: Record<string, unknown> | null;
  notes?: string;
}

export interface RequesterUnifiedRequestDetailBase {
  origin: RequesterUnifiedOrigin;
  detailKey: RequesterUnifiedDetailKey;
  summary: RequesterUnifiedRequestDetailSummary;
  fields: RequesterUnifiedRequestDetailField[];
  attachments: RequesterUnifiedRequestDetailAttachment[];
  timeline: RequesterUnifiedRequestDetailTimelineItem[];
  /** Para v2 existe; para legado e `null` (degradacao elegante). */
  progress: WorkflowRequestDetailData['progress'] | null;
}

export interface RequesterUnifiedV2Detail extends RequesterUnifiedRequestDetailBase {
  origin: 'v2';
  raw: WorkflowRequestDetailData;
}

export interface RequesterUnifiedLegacyDetail extends RequesterUnifiedRequestDetailBase {
  origin: 'legacy';
  raw: {
    request: WorkflowRequest;
    definition: WorkflowDefinition | null;
    workflowArea: WorkflowArea | null;
  };
}

export type RequesterUnifiedRequestDetail =
  | RequesterUnifiedV2Detail
  | RequesterUnifiedLegacyDetail;
