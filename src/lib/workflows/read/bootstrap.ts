import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import type { RuntimeActor } from '@/lib/workflows/runtime/actor-resolution';
import type {
  WorkflowManagementBootstrapData,
  WorkflowManagementFilterAreaOption,
  WorkflowManagementFilterWorkflowOption,
} from './types';
import {
  queryAssignmentsForActor,
  queryCompletedHistory,
  queryOwnedWorkflowScopes,
} from './queries';

const WORKFLOW_AREAS_COLLECTION = 'workflowAreas';
const WORKFLOW_TYPES_COLLECTION = 'workflowTypes_v2';

type WorkflowAreaDocument = {
  name?: string;
};

type WorkflowTypeDocument = {
  workflowTypeId?: string;
  name?: string;
  areaId?: string;
};

function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

function deriveWorkflowOptions(
  ownedWorkflowTypes: WorkflowManagementFilterWorkflowOption[],
  items: Array<{
    workflowTypeId: string;
    workflowName: string;
    areaId: string;
  }>,
): WorkflowManagementFilterWorkflowOption[] {
  const workflows = new Map<string, WorkflowManagementFilterWorkflowOption>();

  items.forEach((item) => {
    if (!item.workflowTypeId) {
      return;
    }

    const existing = workflows.get(item.workflowTypeId);
    if (existing) {
      return;
    }

    workflows.set(item.workflowTypeId, {
      workflowTypeId: item.workflowTypeId,
      workflowName: item.workflowName || item.workflowTypeId,
      areaId: item.areaId,
    });
  });

  ownedWorkflowTypes.forEach((workflow) => {
    if (!workflows.has(workflow.workflowTypeId)) {
      workflows.set(workflow.workflowTypeId, workflow);
    }
  });

  return Array.from(workflows.values());
}

async function loadOwnedWorkflowOptions(
  workflowTypeIds: string[],
): Promise<WorkflowManagementFilterWorkflowOption[]> {
  const db = getDb();
  const ownedWorkflowTypes = await Promise.all(
    workflowTypeIds.map(async (workflowTypeId) => {
      const snap = await db.collection(WORKFLOW_TYPES_COLLECTION).doc(workflowTypeId).get();

      if (!snap.exists) {
        return {
          workflowTypeId,
          workflowName: workflowTypeId,
          areaId: '',
        };
      }

      const data = snap.data() as WorkflowTypeDocument;
      return {
        workflowTypeId: data.workflowTypeId || workflowTypeId,
        workflowName: data.name?.trim() || workflowTypeId,
        areaId: data.areaId || '',
      };
    }),
  );

  return ownedWorkflowTypes;
}

async function loadAreaOptions(areaIds: string[]): Promise<WorkflowManagementFilterAreaOption[]> {
  const db = getDb();
  const uniqueAreaIds = Array.from(new Set(areaIds.filter(Boolean)));

  const areaEntries = await Promise.all(
    uniqueAreaIds.map(async (areaId) => {
      const snap = await db.collection(WORKFLOW_AREAS_COLLECTION).doc(areaId).get();

      if (!snap.exists) {
        return { areaId, label: areaId };
      }

      const data = snap.data() as WorkflowAreaDocument;
      return {
        areaId,
        label: data.name?.trim() || areaId,
      };
    }),
  );

  return areaEntries;
}

export async function buildWorkflowManagementBootstrap(
  actor: RuntimeActor,
): Promise<WorkflowManagementBootstrapData> {
  const [ownership, assignments, completed] = await Promise.all([
    queryOwnedWorkflowScopes(actor.actorUserId),
    queryAssignmentsForActor(actor.actorUserId),
    queryCompletedHistory(actor.actorUserId),
  ]);
  const ownedWorkflowTypes = await loadOwnedWorkflowOptions(ownership.workflowTypeIds);

  const visibleItems = [
    ...assignments.assignedItems,
    ...assignments.pendingActionItems,
    ...completed,
  ];

  const workflowOptions = deriveWorkflowOptions(
    ownedWorkflowTypes,
    visibleItems.map((item) => ({
      workflowTypeId: item.workflowTypeId,
      workflowName: item.workflowName,
      areaId: item.areaId,
    })),
  );

  const areaOptions = await loadAreaOptions([
    ...ownership.areaIds,
    ...workflowOptions.map((workflow) => workflow.areaId),
  ]);

  return {
    actor: {
      actorUserId: actor.actorUserId,
      actorName: actor.actorName,
    },
    capabilities: {
      canViewCurrentQueue: ownership.hasOwnedScopes,
      canViewAssignments: true,
      canViewCompleted: true,
    },
    ownership,
    filterOptions: {
      workflows: workflowOptions,
      areas: areaOptions,
    },
  };
}
