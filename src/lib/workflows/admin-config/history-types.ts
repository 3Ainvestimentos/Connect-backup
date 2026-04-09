import type { RuntimeErrorResponse, RuntimeSuccess } from '@/lib/workflows/runtime/types';
import type { WorkflowRequestDetailData } from '@/lib/workflows/read/types';

export const ADMIN_HISTORY_ORIGINS = ['legacy', 'v2'] as const;
export const ADMIN_HISTORY_STATUS_CATEGORIES = [
  'open',
  'in_progress',
  'waiting_action',
  'finalized',
  'archived',
] as const;

export type AdminHistoryOrigin = (typeof ADMIN_HISTORY_ORIGINS)[number];
export type AdminHistoryStatusCategory = (typeof ADMIN_HISTORY_STATUS_CATEGORIES)[number];
export type AdminHistoryStatusCategoryWithUnknown = AdminHistoryStatusCategory | 'unknown';

export type AdminHistorySummary = {
  origin: AdminHistoryOrigin;
  requestKey: string;
  requestIdLabel: string;
  sourceRequestId?: number | string | null;
  areaId?: string | null;
  areaLabel: string;
  workflowTypeId?: string | null;
  workflowLabel: string;
  statusKey?: string | null;
  statusLabel: string;
  statusCategory: AdminHistoryStatusCategoryWithUnknown;
  ownerUserId?: string | null;
  ownerLabel: string;
  requesterLabel: string;
  responsibleLabel: string | null;
  submittedAt: string | null;
  lastUpdatedAt: string | null;
  periodReferenceAt: string | null;
  isArchived: boolean;
  compatibilityWarnings: string[];
};

export type AdminHistoryFilters = {
  origin?: AdminHistoryOrigin;
  areaId?: string;
  workflowTypeId?: string;
  statusCategory?: AdminHistoryStatusCategory;
  ownerUserId?: string;
  periodFrom?: string;
  periodTo?: string;
  query?: string;
  limit?: number;
};

export type AdminHistoryFilterOption = {
  value: string;
  label: string;
};

export type AdminHistoryFilterOptions = {
  origins: AdminHistoryOrigin[];
  areas: AdminHistoryFilterOption[];
  workflows: AdminHistoryFilterOption[];
  owners: AdminHistoryFilterOption[];
  statusCategories: AdminHistoryStatusCategory[];
};

export type AdminHistoryListData = {
  items: AdminHistorySummary[];
  filterOptions: AdminHistoryFilterOptions;
  partialSources: AdminHistoryOrigin[];
  totalVisible: number;
};

export type AdminHistoryLegacyDetail = {
  formEntries: Array<{ key: string; label: string; value: unknown }>;
  history: Array<{ timestamp: string | null; status: string; userName: string; notes?: string }>;
  attachments: Array<{ label: string; url: string }>;
};

export type AdminHistoryDetailData =
  | {
      origin: 'v2';
      summary: AdminHistorySummary;
      detail: WorkflowRequestDetailData;
      permissions: {
        canAssign: false;
        canFinalize: false;
        canArchive: false;
        canRequestAction: false;
        canRespondAction: false;
      };
    }
  | {
      origin: 'legacy';
      summary: AdminHistorySummary;
      detail: AdminHistoryLegacyDetail;
    };

export type AdminHistoryListSuccess = RuntimeSuccess<AdminHistoryListData>;
export type AdminHistoryListError = RuntimeErrorResponse;
export type AdminHistoryDetailSuccess = RuntimeSuccess<AdminHistoryDetailData>;
export type AdminHistoryDetailError = RuntimeErrorResponse;
