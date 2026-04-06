import type {
  StepActionDef,
  StepDef,
  VersionFieldDef,
  VersionFieldType,
  WorkflowTypeV2,
  WorkflowVersionV2,
} from '@/lib/workflows/runtime/types';

export type Fase2cLotId =
  | 'lote_01_governanca_financeiro'
  | 'lote_02_marketing'
  | 'lote_03_ti'
  | 'lote_04_gente_servicos_atendimento'
  | 'lote_05_gente_ciclo_vida_movimentacoes';

export type Fase2cLotStatus = 'planned' | 'seeded' | 'validated' | 'enabled';

export type Fase2cStepStrategy = 'preserve_legacy' | 'canonical_3_steps';

export type LegacyWorkflowField = {
  label: string;
  placeholder?: string;
  id: string;
  type: Extract<VersionFieldType, 'text' | 'textarea' | 'select' | 'date' | 'file'>;
  required: boolean;
  options?: string[];
};

export type LegacyWorkflowStatus = {
  label: string;
  id: string;
  action?: StepActionDef;
};

export type LegacyWorkflowDefinition = {
  icon: string;
  areaId: string;
  defaultSlaDays: number;
  ownerEmail: string;
  description: string;
  routingRules?: unknown[];
  statuses: LegacyWorkflowStatus[];
  fields: LegacyWorkflowField[];
  allowedUserIds: string[];
  slaRules?: unknown[];
  name: string;
  subtitle?: string;
};

export type LegacyWorkflowArea = {
  icon?: string;
  name: string;
  storageFolderPath?: string;
  workflowOrder?: string[];
};

export type Fase2cManifestEntry = {
  legacyWorkflowId: string;
  workflowTypeId: string;
  lotId: Fase2cLotId;
  lotStatus: Fase2cLotStatus;
  stepStrategy: Fase2cStepStrategy;
  ownerEmailOverride?: string;
  ownerUserIdOverride?: string;
  fieldIdOverrides?: Record<string, string[]>;
  statusIdOverrides?: Record<string, string[]>;
};

export type CollaboratorRecord = {
  email?: string;
  id3a?: string;
  authUid?: string;
  name?: string;
};

export type OwnerResolutionResult = {
  ownerEmailLegacy: string;
  ownerEmailResolved: string;
  ownerUserId: string;
  resolutionMode: 'directory_match' | 'owner_user_id_override';
};

export type NormalizedFieldsResult = {
  fields: VersionFieldDef[];
  sanitizations: string[];
};

export type NormalizedStatusesResult = {
  initialStepId: string;
  stepOrder: string[];
  stepsById: Record<string, StepDef>;
  statusesSummary: Array<{ statusKey: string; kind: StepDef['kind']; hasAction: boolean }>;
  sanitizations: string[];
};

export type Fase2cDryRunItem = {
  lotId: Fase2cLotId;
  legacyWorkflowId: string;
  workflowTypeId: string;
  name: string;
  areaId: string;
  ownerEmailLegacy: string;
  ownerEmailResolved: string;
  ownerUserId: string;
  lotStatus: Fase2cLotStatus;
  stepStrategy: Fase2cStepStrategy;
  workflowTypeDocPath: string;
  versionDocPath: string;
  counterStatus: 'present_valid' | 'present_invalid' | 'absent';
  fieldsSummary: Array<{ id: string; type: VersionFieldType; required: boolean }>;
  statusesSummary: Array<{ statusKey: string; kind: StepDef['kind']; hasAction: boolean }>;
  sanitizations: string[];
};

export type BuildSeedPayload = {
  workflowTypeId: string;
  typePayload: WorkflowTypeV2;
  versionPayload: WorkflowVersionV2;
  reportItem: Omit<Fase2cDryRunItem, 'counterStatus'>;
};
