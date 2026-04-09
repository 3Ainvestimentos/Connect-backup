import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { sanitizeStoragePath } from '@/lib/path-sanitizer';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import type {
  StepDef,
  StepKind,
  VersionFieldDef,
  WorkflowTypeV2,
  WorkflowVersionV2,
} from '@/lib/workflows/runtime/types';
import { appendNumericSuffix, buildAreaId, buildFieldId, buildStatusKey, buildWorkflowTypeId } from './id-generation';
import { buildAccessPreview, normalizeAllowedUserIds } from './draft-readiness';
import {
  listWorkflowConfigAreas,
  listWorkflowConfigCollaborators,
  listWorkflowConfigOwners,
  resolveOwnerByUserId,
} from './lookups';
import { canActivateVersion, deriveVersionStatus, evaluatePublishability, hasBlockingPublishIssues } from './publishability';
import type {
  CreateWorkflowAreaInput,
  CreateWorkflowAreaResult,
  CreateWorkflowDraftResult,
  CreateWorkflowTypeInput,
  CreateWorkflowTypeResult,
  SaveWorkflowDraftInput,
  SaveWorkflowDraftResult,
  WorkflowConfigCollaboratorLookup,
  WorkflowDraftEditorData,
  WorkflowDraftEditorApprover,
  WorkflowDraftEditorDraft,
  WorkflowDraftEditorGeneral,
  WorkflowDraftEditorStep,
} from './types';

function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

type WorkflowAreaDocument = {
  name?: string;
  icon?: string;
  storageFolderPath?: string;
  workflowOrder?: string[];
};

const ID_CONFLICT_ERROR = 'WORKFLOW_CONFIG_ID_CONFLICT';

function editorPath(workflowTypeId: string, version: number) {
  return `/admin/request-config/${workflowTypeId}/versions/${version}/edit`;
}

function asIso(value: Timestamp | null | undefined): string | null {
  if (!value || typeof value.toDate !== 'function') {
    return null;
  }

  return value.toDate().toISOString();
}

function invalidDraftPayload(message: string) {
  return new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, message, 422);
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidDraftPayload(message);
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown, message: string, fallback = '') {
  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return fallback;
  }

  throw invalidDraftPayload(message);
}

function readStringArray(value: unknown, message: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw invalidDraftPayload(message);
  }

  return value;
}

function readNumber(value: unknown, message: string, fallback = 0): number {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw invalidDraftPayload(message);
}

function readBoolean(value: unknown, fallback = false) {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  throw invalidDraftPayload('Payload de draft invalido.');
}

function parseCreateWorkflowAreaInput(input: CreateWorkflowAreaInput): CreateWorkflowAreaInput {
  const payload = asRecord(input, 'Payload de criacao de area invalido.');

  return {
    name: readString(payload.name, 'Nome da area invalido.'),
    icon: readString(payload.icon, 'Icone da area invalido.', 'FolderOpen'),
  };
}

function parseCreateWorkflowTypeInput(input: CreateWorkflowTypeInput): CreateWorkflowTypeInput {
  const payload = asRecord(input, 'Payload de criacao de workflow invalido.');

  return {
    areaId: readString(payload.areaId, 'areaId invalido.'),
    name: readString(payload.name, 'Nome do workflow invalido.'),
    description: readString(payload.description, 'Descricao do workflow invalida.', ''),
    icon: readString(payload.icon, 'Icone do workflow invalido.', 'FileText'),
    ownerUserId: readString(payload.ownerUserId, 'ownerUserId invalido.'),
    allowedUserIds: readStringArray(payload.allowedUserIds, 'allowedUserIds invalido.'),
    defaultSlaDays: readNumber(payload.defaultSlaDays, 'defaultSlaDays invalido.', 0),
  };
}

function parseDraftFields(value: unknown): Array<Partial<VersionFieldDef>> {
  if (!Array.isArray(value)) {
    throw invalidDraftPayload('fields invalido.');
  }

  return value.map((item) => {
    const field = asRecord(item, 'field invalido.');
    return {
      id: readString(field.id, 'field.id invalido.', ''),
      label: readString(field.label, 'field.label invalido.', ''),
      type: readString(field.type, 'field.type invalido.', '') as VersionFieldDef['type'],
      required: readBoolean(field.required, false),
      order: readNumber(field.order, 'field.order invalido.', 0),
      placeholder: readString(field.placeholder, 'field.placeholder invalido.', ''),
      options: field.options == null ? [] : readStringArray(field.options, 'field.options invalido.'),
    };
  });
}

function parseDraftSteps(value: unknown): Array<Partial<StepDef>> {
  if (!Array.isArray(value)) {
    throw invalidDraftPayload('steps invalido.');
  }

  return value.map((item) => {
    const step = asRecord(item, 'step invalido.');
    const action =
      step.action == null
        ? undefined
        : (() => {
            const actionRecord = asRecord(step.action, 'step.action invalido.');
            return {
              type: readString(actionRecord.type, 'step.action.type invalido.', '') as NonNullable<
                StepDef['action']
              >['type'],
              label: readString(actionRecord.label, 'step.action.label invalido.', ''),
              approverIds:
                actionRecord.approverIds == null
                  ? []
                  : readStringArray(actionRecord.approverIds, 'step.action.approverIds invalido.'),
              commentRequired: readBoolean(actionRecord.commentRequired, false),
              attachmentRequired: readBoolean(actionRecord.attachmentRequired, false),
              commentPlaceholder: readString(
                actionRecord.commentPlaceholder,
                'step.action.commentPlaceholder invalido.',
                '',
              ),
              attachmentPlaceholder: readString(
                actionRecord.attachmentPlaceholder,
                'step.action.attachmentPlaceholder invalido.',
                '',
              ),
            };
          })();

    return {
      stepId: readString(step.stepId, 'step.stepId invalido.', ''),
      stepName: readString(step.stepName, 'step.stepName invalido.', ''),
      statusKey: readString(step.statusKey, 'step.statusKey invalido.', ''),
      kind: readString(step.kind, 'step.kind invalido.', '') as StepDef['kind'],
      action,
    };
  });
}

function parseSaveDraftSteps(value: unknown): SaveWorkflowDraftInput['steps'] {
  if (!Array.isArray(value)) {
    throw invalidDraftPayload('steps invalido.');
  }

  return value.map((item) => {
    const step = asRecord(item, 'step invalido.');
    const action =
      step.action == null
        ? undefined
        : (() => {
            const actionRecord = asRecord(step.action, 'step.action invalido.');
            return {
              type: readString(actionRecord.type, 'step.action.type invalido.', '') as NonNullable<
                StepDef['action']
              >['type'],
              label: readString(actionRecord.label, 'step.action.label invalido.', ''),
              approverCollaboratorDocIds:
                actionRecord.approverCollaboratorDocIds == null
                  ? []
                  : readStringArray(
                      actionRecord.approverCollaboratorDocIds,
                      'step.action.approverCollaboratorDocIds invalido.',
                    ),
              unresolvedApproverIds:
                actionRecord.unresolvedApproverIds == null
                  ? []
                  : readStringArray(
                      actionRecord.unresolvedApproverIds,
                      'step.action.unresolvedApproverIds invalido.',
                    ),
              commentRequired: readBoolean(actionRecord.commentRequired, false),
              attachmentRequired: readBoolean(actionRecord.attachmentRequired, false),
              commentPlaceholder: readString(
                actionRecord.commentPlaceholder,
                'step.action.commentPlaceholder invalido.',
                '',
              ),
              attachmentPlaceholder: readString(
                actionRecord.attachmentPlaceholder,
                'step.action.attachmentPlaceholder invalido.',
                '',
              ),
            };
          })();

    return {
      stepId: readString(step.stepId, 'step.stepId invalido.', ''),
      stepName: readString(step.stepName, 'step.stepName invalido.', ''),
      statusKey: readString(step.statusKey, 'step.statusKey invalido.', ''),
      kind: readString(step.kind, 'step.kind invalido.', '') as StepDef['kind'],
      action,
    };
  });
}

function parseSaveWorkflowDraftInput(input: SaveWorkflowDraftInput): SaveWorkflowDraftInput {
  const payload = asRecord(input, 'Payload de salvamento de draft invalido.');
  const general = asRecord(payload.general, 'general invalido.');
  const access = asRecord(payload.access, 'access invalido.');

  return {
    general: {
      name: readString(general.name, 'general.name invalido.'),
      description: readString(general.description, 'general.description invalido.', ''),
      icon: readString(general.icon, 'general.icon invalido.', 'FileText'),
      ownerUserId: readString(general.ownerUserId, 'general.ownerUserId invalido.'),
      defaultSlaDays: readNumber(general.defaultSlaDays, 'general.defaultSlaDays invalido.', 0),
      activeOnPublish: readBoolean(general.activeOnPublish, false),
    },
    access: {
      mode:
        readString(access.mode, 'access.mode invalido.', 'all') === 'specific'
          ? 'specific'
          : 'all',
      allowedUserIds:
        access.allowedUserIds == null
          ? []
          : readStringArray(access.allowedUserIds, 'access.allowedUserIds invalido.'),
    },
    fields: parseDraftFields(payload.fields),
    steps: parseSaveDraftSteps(payload.steps),
    initialStepId: readString(payload.initialStepId, 'initialStepId invalido.', ''),
  };
}

function normalizeDraftWorkflowType(
  typeState: Pick<
    WorkflowTypeV2,
    'name' | 'description' | 'icon' | 'areaId' | 'ownerEmail' | 'ownerUserId' | 'active'
  > & { allowedUserIds?: string[] },
  version: WorkflowVersionV2,
  areaName: string,
): WorkflowDraftEditorGeneral {
  const draftType = version.draftConfig?.workflowType;

  return {
    name: draftType?.name ?? typeState.name ?? '',
    description: draftType?.description ?? typeState.description ?? '',
    icon: draftType?.icon ?? typeState.icon ?? 'FileText',
    areaId: draftType?.areaId ?? typeState.areaId ?? '',
    areaName,
    ownerEmail: draftType?.ownerEmail ?? typeState.ownerEmail ?? '',
    ownerUserId: draftType?.ownerUserId ?? typeState.ownerUserId ?? '',
    defaultSlaDays: typeof version.defaultSlaDays === 'number' ? version.defaultSlaDays : 0,
    activeOnPublish: draftType?.active ?? typeState.active ?? true,
  };
}

function normalizeRuntimeSteps(version: WorkflowVersionV2): StepDef[] {
  const order = Array.isArray(version.stepOrder) ? version.stepOrder : [];
  const map = version.stepsById || {};

  return order
    .map((stepId) => map[stepId])
    .filter((step): step is StepDef => Boolean(step))
    .map((step) => ({
      ...step,
      action: step.action ? { ...step.action, approverIds: [...(step.action.approverIds || [])] } : undefined,
    }));
}

function cloneField(field: VersionFieldDef, index: number): VersionFieldDef {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required === true,
    order: index + 1,
    placeholder: field.placeholder ?? '',
    options: Array.isArray(field.options) ? [...field.options] : [],
  };
}

function cloneStep(step: StepDef): StepDef {
  const clonedAction = step.action
    ? {
        ...step.action,
        approverIds: Array.isArray(step.action.approverIds) ? [...step.action.approverIds] : [],
      }
    : undefined;

  return {
    ...step,
    ...(clonedAction ? { action: clonedAction } : {}),
  };
}

function ensureAreaId(input: string) {
  const normalized = input.trim();
  if (!normalized) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'areaId obrigatorio.', 422);
  }

  return normalized;
}

async function ensureAreaExists(areaId: string) {
  const doc = await getDb().collection('workflowAreas').doc(areaId).get();
  if (!doc.exists) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'Area informada nao foi encontrada.', 422);
  }
}

function buildAreaNameMap(areas: Awaited<ReturnType<typeof listWorkflowConfigAreas>>) {
  return new Map(areas.map((area) => [area.areaId, area.name]));
}

function hydrateApproverSelections(
  approverIds: string[] | undefined,
  collaboratorsByUserId: Map<string, WorkflowConfigCollaboratorLookup>,
): {
  approvers: WorkflowDraftEditorApprover[];
  unresolvedApproverIds: string[];
} {
  if (!Array.isArray(approverIds)) {
    return {
      approvers: [],
      unresolvedApproverIds: [],
    };
  }

  const unresolvedApproverIds: string[] = [];
  const approvers = approverIds
    .map((approverId) => {
      const collaborator = collaboratorsByUserId.get(approverId);
      if (!collaborator) {
        unresolvedApproverIds.push(approverId);
        return null;
      }

      return {
        collaboratorDocId: collaborator.collaboratorDocId,
        userId: collaborator.userId,
        name: collaborator.name,
        email: collaborator.email,
      } satisfies WorkflowDraftEditorApprover;
    })
    .filter((item): item is WorkflowDraftEditorApprover => item !== null);

  return {
    approvers,
    unresolvedApproverIds,
  };
}

async function resolveCollaboratorDocIdsToApproverIds(
  collaboratorDocIds: string[] | undefined,
): Promise<string[]> {
  const normalizedDocIds = Array.isArray(collaboratorDocIds)
    ? Array.from(new Set(collaboratorDocIds.map((item) => item.trim()).filter(Boolean)))
    : [];

  if (normalizedDocIds.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    normalizedDocIds.map((collaboratorDocId) => getDb().collection('collaborators').doc(collaboratorDocId).get()),
  );

  return snapshots.map((snapshot, index) => {
    if (!snapshot.exists) {
      throw invalidDraftPayload(`Aprovador selecionado nao foi encontrado: ${normalizedDocIds[index]}.`);
    }

    const data = snapshot.data() as { id3a?: string };
    const approverId = data.id3a?.trim() || '';

    if (!approverId) {
      throw invalidDraftPayload(`Aprovador selecionado nao possui id3a valido: ${normalizedDocIds[index]}.`);
    }

    return approverId;
  });
}

function hasUnresolvedApproverSelections(input: SaveWorkflowDraftInput['steps']) {
  return input.some(
    (step) => Array.isArray(step.action?.unresolvedApproverIds) && step.action!.unresolvedApproverIds!.length > 0,
  );
}

function resolveWorkflowTypeStateForEditor(
  workflowType: WorkflowTypeV2,
  workflowVersion: WorkflowVersionV2,
) {
  if (workflowVersion.state === 'draft') {
    return {
      name: workflowType.name,
      description: workflowType.description,
      icon: workflowType.icon,
      areaId: workflowType.areaId,
      ownerEmail: workflowType.ownerEmail,
      ownerUserId: workflowType.ownerUserId,
      allowedUserIds: workflowType.allowedUserIds,
      active: workflowType.active,
    };
  }

  if (workflowVersion.workflowTypeSnapshot) {
    return {
      name: workflowVersion.workflowTypeSnapshot.name,
      description: workflowVersion.workflowTypeSnapshot.description,
      icon: workflowVersion.workflowTypeSnapshot.icon,
      areaId: workflowVersion.workflowTypeSnapshot.areaId,
      ownerEmail: workflowVersion.workflowTypeSnapshot.ownerEmail,
      ownerUserId: workflowVersion.workflowTypeSnapshot.ownerUserId,
      allowedUserIds: workflowVersion.workflowTypeSnapshot.allowedUserIds,
      active: workflowVersion.workflowTypeSnapshot.active,
    };
  }

  return {
    name: workflowType.name,
    description: workflowType.description,
    icon: workflowType.icon,
    areaId: workflowType.areaId,
    ownerEmail: workflowType.ownerEmail,
    ownerUserId: workflowType.ownerUserId,
    allowedUserIds: workflowType.allowedUserIds,
    active: workflowType.active,
  };
}

function buildCandidateId(baseId: string, suffix: number, separator: '-' | '_') {
  return suffix === 1 ? baseId : appendNumericSuffix(baseId, suffix, separator);
}

function isAlreadyExistsError(error: unknown) {
  const code = (error as { code?: unknown })?.code;
  const message = error instanceof Error ? error.message : '';

  return (
    code === 6 ||
    code === 'already-exists' ||
    code === 'ALREADY_EXISTS' ||
    message.includes('already exists') ||
    message.includes('ALREADY_EXISTS')
  );
}

function isIdConflictError(error: unknown) {
  return error instanceof Error && error.message === ID_CONFLICT_ERROR;
}

export async function createWorkflowArea(input: CreateWorkflowAreaInput): Promise<CreateWorkflowAreaResult> {
  const parsedInput = parseCreateWorkflowAreaInput(input);
  const name = parsedInput.name.trim();
  const icon = parsedInput.icon.trim() || 'FolderOpen';

  if (!name) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'Nome da area obrigatorio.', 422);
  }

  const baseId = buildAreaId(name);

  for (let suffix = 1; suffix < 10_000; suffix += 1) {
    const areaId = buildCandidateId(baseId, suffix, '-');
    const storageFolderPath = sanitizeStoragePath(areaId);

    try {
      await getDb().collection('workflowAreas').doc(areaId).create({
        name,
        icon,
        storageFolderPath,
        workflowOrder: [],
      } satisfies WorkflowAreaDocument);

      return {
        areaId,
        name,
        icon,
      };
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Nao foi possivel gerar id unico.');
}

export async function createWorkflowTypeWithInitialDraft(
  input: CreateWorkflowTypeInput,
): Promise<CreateWorkflowTypeResult> {
  const parsedInput = parseCreateWorkflowTypeInput(input);
  const areaId = ensureAreaId(parsedInput.areaId);
  const name = parsedInput.name.trim();
  if (!name) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'Nome do workflow obrigatorio.', 422);
  }

  const owner = await resolveOwnerByUserId(parsedInput.ownerUserId);
  const description = parsedInput.description.trim();
  const icon = parsedInput.icon.trim() || 'FileText';
  const allowedUserIds = normalizeAllowedUserIds('specific', parsedInput.allowedUserIds);
  const normalizedAllowed = parsedInput.allowedUserIds.includes('all') ? ['all'] : allowedUserIds;
  const defaultSlaDays =
    typeof parsedInput.defaultSlaDays === 'number' && Number.isFinite(parsedInput.defaultSlaDays)
      ? Math.max(0, Math.round(parsedInput.defaultSlaDays))
      : 0;
  const baseId = buildWorkflowTypeId(areaId, name);

  for (let suffix = 1; suffix < 10_000; suffix += 1) {
    const workflowTypeId = buildCandidateId(baseId, suffix, '_');
    const now = FieldValue.serverTimestamp();

    try {
      await getDb().runTransaction(async (transaction) => {
        const areaRef = getDb().collection('workflowAreas').doc(areaId);
        const typeRef = getDb().collection('workflowTypes_v2').doc(workflowTypeId);
        const versionRef = typeRef.collection('versions').doc('1');

        const [areaDoc, typeDoc] = await Promise.all([
          transaction.get(areaRef),
          transaction.get(typeRef),
        ]);

        if (!areaDoc.exists) {
          throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'Area informada nao foi encontrada.', 422);
        }

        if (typeDoc.exists) {
          throw new Error(ID_CONFLICT_ERROR);
        }

        transaction.create(typeRef, {
          workflowTypeId,
          name,
          description,
          icon,
          areaId,
          ownerEmail: owner.email,
          ownerUserId: owner.userId,
          allowedUserIds: normalizedAllowed,
          active: false,
          latestPublishedVersion: null,
          createdAt: now,
          updatedAt: now,
        });

        transaction.create(versionRef, {
          workflowTypeId,
          version: 1,
          state: 'draft',
          ownerEmailAtPublish: owner.email,
          defaultSlaDays,
          fields: [],
          initialStepId: '',
          stepOrder: [],
          stepsById: {},
          publishedAt: null,
          createdAt: now,
          updatedAt: now,
          draftConfig: {
            workflowType: {
              name,
              description,
              icon,
              areaId,
              ownerEmail: owner.email,
              ownerUserId: owner.userId,
              allowedUserIds: normalizedAllowed,
              active: true,
            },
          },
        });
      });

      return {
        workflowTypeId,
        version: 1,
        editorPath: editorPath(workflowTypeId, 1),
      };
    } catch (error) {
      if (isIdConflictError(error) || isAlreadyExistsError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Nao foi possivel gerar id unico.');
}

function findDraftVersion(docs: QueryDocumentSnapshot<DocumentData>[]): WorkflowVersionV2 | null {
  for (const doc of docs) {
    const data = doc.data() as WorkflowVersionV2;
    if (data.state === 'draft') {
      return data;
    }
  }

  return null;
}

export async function createNextDraftVersion(workflowTypeId: string): Promise<CreateWorkflowDraftResult> {
  const typeRef = getDb().collection('workflowTypes_v2').doc(workflowTypeId);
  const typeDoc = await typeRef.get();

  if (!typeDoc.exists) {
    throw new RuntimeError(RuntimeErrorCode.WORKFLOW_TYPE_NOT_FOUND, 'Workflow type nao encontrado.', 404);
  }

  const workflowType = typeDoc.data() as WorkflowTypeV2;
  const versionsSnapshot = await typeRef.collection('versions').get();
  const draft = findDraftVersion(versionsSnapshot.docs);

  if (draft) {
    return {
      workflowTypeId,
      version: draft.version,
      reusedExistingDraft: true,
      editorPath: editorPath(workflowTypeId, draft.version),
    };
  }

  if (!workflowType.latestPublishedVersion || workflowType.latestPublishedVersion < 1) {
    throw new RuntimeError(
      RuntimeErrorCode.DRAFT_CONFLICT,
      'O tipo nao possui versao publicada para clonar um novo draft.',
      409,
    );
  }

  const published = versionsSnapshot.docs
    .map((doc) => doc.data() as WorkflowVersionV2)
    .find((version) => version.version === workflowType.latestPublishedVersion && version.state === 'published');

  if (!published) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      'A ultima versao publicada nao foi encontrada para clonar o draft.',
      409,
    );
  }

  const nextVersion = Math.max(
    ...versionsSnapshot.docs.map((doc) => Number(doc.id)).filter((value) => Number.isFinite(value)),
    0,
  ) + 1;
  const now = FieldValue.serverTimestamp();

  await typeRef.collection('versions').doc(String(nextVersion)).set({
    workflowTypeId,
    version: nextVersion,
    state: 'draft',
    ownerEmailAtPublish: workflowType.ownerEmail,
    defaultSlaDays: published.defaultSlaDays,
    fields: (published.fields || []).map(cloneField),
    initialStepId: published.initialStepId || '',
    stepOrder: [...(published.stepOrder || [])],
    stepsById: Object.fromEntries(
      Object.entries(published.stepsById || {}).map(([stepId, step]) => [stepId, cloneStep(step)]),
    ),
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    draftConfig: {
      workflowType: {
        name: workflowType.name,
        description: workflowType.description,
        icon: workflowType.icon,
        areaId: workflowType.areaId,
        ownerEmail: workflowType.ownerEmail,
        ownerUserId: workflowType.ownerUserId,
        allowedUserIds: [...(workflowType.allowedUserIds || [])],
        active: workflowType.active,
      },
    },
  });

  return {
    workflowTypeId,
    version: nextVersion,
    reusedExistingDraft: false,
    editorPath: editorPath(workflowTypeId, nextVersion),
  };
}

function normalizeFieldType(value: string | undefined): VersionFieldDef['type'] {
  if (value === 'text' || value === 'textarea' || value === 'select' || value === 'date' || value === 'date-range' || value === 'file') {
    return value;
  }

  return 'text';
}

function normalizeStepKind(value: string | undefined): StepKind {
  if (value === 'start' || value === 'work' || value === 'final') {
    return value;
  }

  return 'work';
}

function normalizeFields(
  input: Array<Partial<VersionFieldDef>>,
  current: VersionFieldDef[],
): VersionFieldDef[] {
  const existingIds = new Set(current.map((field) => field.id));
  const usedIds = new Set<string>();

  return input.map((field, index) => {
    const providedId = (field.id || '').trim();
    const stableId =
      providedId && existingIds.has(providedId)
        ? providedId
        : (() => {
            let base = buildFieldId(field.label?.trim() || `campo_${index + 1}`);
            if (!base) {
              base = `campo_${index + 1}`;
            }

            let suffix = 1;
            let candidate = base;
            while (usedIds.has(candidate)) {
              suffix += 1;
              candidate = `${base}_${suffix}`;
            }
            return candidate;
          })();

    usedIds.add(stableId);

    return {
      id: stableId,
      label: (field.label || '').trim(),
      type: normalizeFieldType(field.type),
      required: field.required === true,
      order: index + 1,
      placeholder: (field.placeholder || '').trim(),
      options:
        normalizeFieldType(field.type) === 'select'
          ? Array.from(
              new Set(
                (Array.isArray(field.options) ? field.options : [])
                  .map((option) => option.trim())
                  .filter(Boolean),
              ),
            )
          : [],
    };
  });
}

async function normalizeSteps(
  input: SaveWorkflowDraftInput['steps'],
  current: StepDef[],
): Promise<{ steps: StepDef[]; stepsById: Record<string, StepDef>; stepOrder: string[] }> {
  const existingIds = new Set(current.map((step) => step.stepId));
  const usedIds = new Set<string>();
  const steps = await Promise.all(input.map(async (step, index) => {
    const providedId = (step.stepId || '').trim();
    let stepId = providedId && existingIds.has(providedId) ? providedId : '';

    if (!stepId) {
      const statusBase = buildStatusKey(step.stepName?.trim() || `etapa_${index + 1}`);
      let suffix = 1;
      stepId = `stp_${statusBase}`;
      while (usedIds.has(stepId) || existingIds.has(stepId)) {
        suffix += 1;
        stepId = `stp_${statusBase}_${suffix}`;
      }
    }

    usedIds.add(stepId);

    const actionType = step.action?.type;
    const action =
      actionType === 'approval' || actionType === 'acknowledgement' || actionType === 'execution'
        ? {
            type: actionType,
            label: (step.action?.label || '').trim() || 'Acao',
            approverIds: await resolveCollaboratorDocIdsToApproverIds(step.action?.approverCollaboratorDocIds),
            commentRequired: step.action?.commentRequired === true,
            attachmentRequired: step.action?.attachmentRequired === true,
            commentPlaceholder: (step.action?.commentPlaceholder || '').trim(),
            attachmentPlaceholder: (step.action?.attachmentPlaceholder || '').trim(),
          }
        : undefined;

    return {
      stepId,
      stepName: (step.stepName || '').trim(),
      statusKey: buildStatusKey(step.statusKey?.trim() || step.stepName?.trim() || `status_${index + 1}`),
      kind: normalizeStepKind(step.kind),
      ...(action ? { action } : {}),
    } satisfies StepDef;
  }));

  return {
    steps,
    stepsById: Object.fromEntries(steps.map((step) => [step.stepId, step])),
    stepOrder: steps.map((step) => step.stepId),
  };
}

async function loadWorkflowVersion(workflowTypeId: string, version: number) {
  const typeRef = getDb().collection('workflowTypes_v2').doc(workflowTypeId);
  const [typeDoc, versionDoc] = await Promise.all([
    typeRef.get(),
    typeRef.collection('versions').doc(String(version)).get(),
  ]);

  if (!typeDoc.exists) {
    throw new RuntimeError(RuntimeErrorCode.WORKFLOW_TYPE_NOT_FOUND, 'Workflow type nao encontrado.', 404);
  }

  if (!versionDoc.exists) {
    throw new RuntimeError(RuntimeErrorCode.WORKFLOW_VERSION_NOT_FOUND, 'Versao nao encontrada.', 404);
  }

  const workflowType = typeDoc.data() as WorkflowTypeV2;
  const workflowVersion = versionDoc.data() as WorkflowVersionV2;

  return { workflowType, workflowVersion, typeRef, versionRef: versionDoc.ref };
}

async function loadDraftVersion(workflowTypeId: string, version: number) {
  const loaded = await loadWorkflowVersion(workflowTypeId, version);

  if (loaded.workflowVersion.state !== 'draft') {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'A rota de salvamento aceita apenas drafts.', 422);
  }

  return loaded;
}

function buildDraftDto(
  workflowType: WorkflowTypeV2,
  workflowVersion: WorkflowVersionV2,
  areas: Awaited<ReturnType<typeof listWorkflowConfigAreas>>,
  collaborators: WorkflowConfigCollaboratorLookup[],
): WorkflowDraftEditorDraft {
  const typeState = resolveWorkflowTypeStateForEditor(workflowType, workflowVersion);
  const areaName = buildAreaNameMap(areas).get(typeState.areaId) || typeState.areaId;
  const general = normalizeDraftWorkflowType(typeState, workflowVersion, areaName);
  const allowedUserIds = workflowVersion.draftConfig?.workflowType.allowedUserIds ?? typeState.allowedUserIds ?? ['all'];
  const mode = allowedUserIds.includes('all') ? 'all' : 'specific';
  const fields = (workflowVersion.fields || []).map(cloneField);
  const collaboratorsByUserId = new Map(collaborators.map((collaborator) => [collaborator.userId, collaborator]));
  const steps = normalizeRuntimeSteps(workflowVersion).map((step) => {
    if (!step.action) {
      return step;
    }

    const hydrated = hydrateApproverSelections(step.action.approverIds, collaboratorsByUserId);

    return {
      ...step,
      action: {
        ...step.action,
        approvers: hydrated.approvers,
        unresolvedApproverIds: hydrated.unresolvedApproverIds,
      },
    };
  }) as WorkflowDraftEditorStep[];
  const publishReadiness = evaluatePublishability({
    workflowType,
    version: workflowVersion,
    collaborators,
  });
  const unresolvedIssues = steps.flatMap((step, index) =>
    step.action?.unresolvedApproverIds?.length
      ? [
          {
            code: 'UNRESOLVED_ACTION_APPROVERS',
            category: 'actions' as const,
            severity: 'blocking' as const,
            message: 'Existem aprovadores historicos nao resolvidos nesta etapa. Revise a selecao antes de salvar ou publicar.',
            path: `steps.${index}.action.approvers`,
          },
        ]
      : [],
  );

  return {
    workflowTypeId: workflowType.workflowTypeId,
    version: workflowVersion.version,
    state: workflowVersion.state,
    mode: workflowVersion.state === 'draft' ? 'edit' : 'read-only',
    derivedStatus: deriveVersionStatus(workflowType, workflowVersion),
    canPublish: workflowVersion.state === 'draft' && !hasBlockingPublishIssues(publishReadiness),
    canActivate: canActivateVersion(workflowType, workflowVersion),
    isNewWorkflowType: workflowType.latestPublishedVersion == null,
    general,
    access: {
      mode,
      allowedUserIds: [...allowedUserIds],
      preview: buildAccessPreview(mode, allowedUserIds),
    },
    fields,
    steps,
    initialStepId: workflowVersion.initialStepId || '',
    publishReadiness: [...publishReadiness, ...unresolvedIssues],
    meta: {
      createdAt: asIso(workflowVersion.createdAt),
      updatedAt: asIso(workflowVersion.updatedAt),
      latestPublishedVersion: workflowType.latestPublishedVersion ?? null,
    },
  };
}

export async function getWorkflowDraftEditorData(
  workflowTypeId: string,
  version: number,
): Promise<WorkflowDraftEditorData> {
  const [{ workflowType, workflowVersion }, areas, owners, collaborators] = await Promise.all([
    loadWorkflowVersion(workflowTypeId, version),
    listWorkflowConfigAreas(),
    listWorkflowConfigOwners(),
    listWorkflowConfigCollaborators(),
  ]);

  const draft = buildDraftDto(
    workflowType,
    workflowVersion,
    areas,
    collaborators,
  );
  const unresolvedIssues = draft.publishReadiness.filter((issue) => issue.code === 'UNRESOLVED_ACTION_APPROVERS');
  draft.publishReadiness = [
    ...evaluatePublishability({
    workflowType,
    version: workflowVersion,
    collaborators: owners,
    }),
    ...unresolvedIssues,
  ];
  draft.canPublish = !hasBlockingPublishIssues(draft.publishReadiness);

  return {
    draft,
    lookups: {
      areas,
      owners,
      collaborators,
    },
  };
}

export async function saveWorkflowDraft(
  workflowTypeId: string,
  version: number,
  input: SaveWorkflowDraftInput,
): Promise<SaveWorkflowDraftResult> {
  const parsedInput = parseSaveWorkflowDraftInput(input);
  if (hasUnresolvedApproverSelections(parsedInput.steps || [])) {
    throw invalidDraftPayload(
      'Existem aprovadores historicos nao resolvidos. Revise a selecao da etapa antes de salvar o draft.',
    );
  }
  const { workflowType, workflowVersion, typeRef, versionRef } = await loadDraftVersion(workflowTypeId, version);
  await ensureAreaExists(ensureAreaId(workflowType.areaId));

  const ownerLookup = await resolveOwnerByUserId(parsedInput.general.ownerUserId);
  const fields = normalizeFields(parsedInput.fields || [], workflowVersion.fields || []);
  const normalizedAccess = normalizeAllowedUserIds(parsedInput.access.mode, parsedInput.access.allowedUserIds || []);
  const allowedUserIds = parsedInput.access.mode === 'all' ? ['all'] : normalizedAccess;
  const { steps, stepsById, stepOrder } = await normalizeSteps(
    parsedInput.steps || [],
    normalizeRuntimeSteps(workflowVersion),
  );
  const initialStepId =
    stepOrder.includes(parsedInput.initialStepId) ? parsedInput.initialStepId : stepOrder[0] || '';

  const general: WorkflowDraftEditorGeneral = {
    name: parsedInput.general.name.trim(),
    description: parsedInput.general.description.trim(),
    icon: parsedInput.general.icon.trim() || 'FileText',
    areaId: workflowType.areaId,
    areaName: workflowType.areaId,
    ownerEmail: ownerLookup.email,
    ownerUserId: ownerLookup.userId,
    defaultSlaDays:
      typeof parsedInput.general.defaultSlaDays === 'number' && Number.isFinite(parsedInput.general.defaultSlaDays)
        ? Math.max(0, Math.round(parsedInput.general.defaultSlaDays))
        : 0,
    activeOnPublish: parsedInput.general.activeOnPublish === true,
  };

  const collaborators = await listWorkflowConfigOwners();
  const publishReadiness = evaluatePublishability({
    workflowType,
    version: {
      ...workflowVersion,
      defaultSlaDays: general.defaultSlaDays,
      fields,
      initialStepId,
      stepOrder,
      stepsById,
      draftConfig: {
        workflowType: {
          name: general.name,
          description: general.description,
          icon: general.icon,
          areaId: workflowType.areaId,
          ownerEmail: general.ownerEmail,
          ownerUserId: general.ownerUserId,
          allowedUserIds,
          active: general.activeOnPublish,
        },
      },
    },
    collaborators,
  });

  const now = FieldValue.serverTimestamp();

  await getDb().runTransaction(async (transaction) => {
    transaction.update(versionRef, {
      ownerEmailAtPublish: general.ownerEmail,
      defaultSlaDays: general.defaultSlaDays,
      fields,
      initialStepId,
      stepOrder,
      stepsById,
      updatedAt: now,
      draftConfig: {
        workflowType: {
          name: general.name,
          description: general.description,
          icon: general.icon,
          areaId: workflowType.areaId,
          ownerEmail: general.ownerEmail,
          ownerUserId: general.ownerUserId,
          allowedUserIds,
          active: general.activeOnPublish,
        },
      },
    });

    if (workflowType.latestPublishedVersion == null) {
      transaction.update(typeRef, {
        name: general.name,
        description: general.description,
        icon: general.icon,
        areaId: workflowType.areaId,
        ownerEmail: general.ownerEmail,
        ownerUserId: general.ownerUserId,
        allowedUserIds,
        active: false,
        updatedAt: now,
      });
    }
  });

  return {
    savedAt: new Date().toISOString(),
    publishReadiness,
  };
}

export const createWorkflowTypeWithDraft = createWorkflowTypeWithInitialDraft;
export const createOrReuseWorkflowDraft = createNextDraftVersion;
