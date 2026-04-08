import type { QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import type { WorkflowVersionV2 } from '@/lib/workflows/runtime/types';
import type {
  WorkflowConfigAreaListItem,
  WorkflowConfigCatalogData,
  WorkflowConfigTypeListItem,
  WorkflowConfigVersionListItem,
} from './types';

type WorkflowAreaDocument = {
  name?: string;
  icon?: string;
};

type WorkflowTypeDocument = {
  workflowTypeId?: string;
  name?: string;
  description?: string;
  areaId?: string;
  ownerEmail?: string;
  ownerUserId?: string;
  active?: boolean;
  latestPublishedVersion?: number | null;
};

function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

function asTimestampIso(value: Timestamp | null | undefined): string | null {
  if (!value || typeof value.toDate !== 'function') {
    return null;
  }

  return value.toDate().toISOString();
}

function toVersionListItem(
  workflowType: WorkflowTypeDocument,
  version: WorkflowVersionV2,
): WorkflowConfigVersionListItem {
  const isActivePublished =
    version.state === 'published' &&
    workflowType.active === true &&
    workflowType.latestPublishedVersion === version.version;

  return {
    version: version.version,
    state: version.state,
    uiStatus: version.state === 'draft' ? 'Rascunho' : isActivePublished ? 'Publicada' : 'Inativa',
    isActivePublished,
    stepCount: Array.isArray(version.stepOrder) ? version.stepOrder.length : 0,
    fieldCount: Array.isArray(version.fields) ? version.fields.length : 0,
    publishedAt: version.state === 'published' ? asTimestampIso(version.publishedAt) : null,
  };
}

function toTypeListItem(
  snapshot: QueryDocumentSnapshot,
  workflowType: WorkflowTypeDocument,
  versions: WorkflowVersionV2[],
): WorkflowConfigTypeListItem {
  const hasPublishedVersion =
    typeof workflowType.latestPublishedVersion === 'number' && workflowType.latestPublishedVersion > 0;

  const sortedVersions = [...versions].sort((left, right) => left.version - right.version);

  return {
    workflowTypeId: workflowType.workflowTypeId || snapshot.id,
    name: workflowType.name?.trim() || snapshot.id,
    description: workflowType.description?.trim() || '',
    areaId: workflowType.areaId || '',
    ownerEmail: workflowType.ownerEmail?.trim() || '',
    ownerUserId: workflowType.ownerUserId?.trim() || '',
    active: workflowType.active === true,
    latestPublishedVersion: hasPublishedVersion ? workflowType.latestPublishedVersion ?? 0 : 0,
    versionCount: sortedVersions.length,
    publishedVersionLabel: hasPublishedVersion
      ? `v${workflowType.latestPublishedVersion} publicada`
      : 'Rascunho inicial / sem publicada',
    hasPublishedVersion,
    versions: sortedVersions.map((version) => toVersionListItem(workflowType, version)),
  };
}

function toAreaListItem(
  snapshot: QueryDocumentSnapshot,
  area: WorkflowAreaDocument,
  types: WorkflowConfigTypeListItem[],
): WorkflowConfigAreaListItem {
  const publishedTypeCount = types.filter((item) => item.hasPublishedVersion).length;

  return {
    areaId: snapshot.id,
    name: area.name?.trim() || snapshot.id,
    icon: area.icon?.trim() || 'folder-tree',
    typeCount: types.length,
    publishedTypeCount,
    draftOnlyTypeCount: types.length - publishedTypeCount,
    types,
  };
}

export async function buildWorkflowConfigCatalog(): Promise<WorkflowConfigCatalogData> {
  const db = getDb();
  const [areaSnapshot, typeSnapshot] = await Promise.all([
    db.collection('workflowAreas').get(),
    db.collection('workflowTypes_v2').get(),
  ]);

  const typesWithVersions = await Promise.all(
    typeSnapshot.docs.map(async (snapshot) => {
      const workflowType = snapshot.data() as WorkflowTypeDocument;
      const versionSnapshot = await snapshot.ref.collection('versions').get();
      const versions = versionSnapshot.docs.map((versionDoc) => versionDoc.data() as WorkflowVersionV2);

      return {
        areaId: workflowType.areaId || '',
        item: toTypeListItem(snapshot, workflowType, versions),
      };
    }),
  );

  const typesByAreaId = new Map<string, WorkflowConfigTypeListItem[]>();

  typesWithVersions.forEach(({ areaId, item }) => {
    const list = typesByAreaId.get(areaId) ?? [];
    list.push(item);
    typesByAreaId.set(areaId, list);
  });

  const areas = areaSnapshot.docs
    .map((snapshot) => {
      const types = (typesByAreaId.get(snapshot.id) ?? []).sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      return toAreaListItem(snapshot, snapshot.data() as WorkflowAreaDocument, types);
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const summary = {
    areaCount: areas.length,
    workflowTypeCount: typesWithVersions.length,
    versionCount: typesWithVersions.reduce((total, entry) => total + entry.item.versionCount, 0),
  };

  return { areas, summary };
}
