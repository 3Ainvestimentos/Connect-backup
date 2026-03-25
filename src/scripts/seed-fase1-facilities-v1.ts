/**
 * Manual seed for the Fase 1 / Facilities pilot workflow types.
 *
 * Usage:
 *   npx tsx src/scripts/seed-fase1-facilities-v1.ts --dry-run
 *   npx tsx src/scripts/seed-fase1-facilities-v1.ts --execute
 *
 * Writes only to:
 * - workflowTypes_v2/{workflowTypeId}
 * - workflowTypes_v2/{workflowTypeId}/versions/1
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '../lib/firebase-admin';
import { normalizeEmail } from '../lib/email-utils';
import {
  FACILITIES_FASE1_OWNER_EMAIL,
  FACILITIES_FASE1_OWNER_USER_ID,
  buildSeedPayloads,
} from '../lib/workflows/bootstrap/fase1-facilities-v1';
import { seedWorkflowType, seedWorkflowVersion } from '../lib/workflows/runtime/repository';

type CollaboratorRecord = {
  email?: string;
  authUid?: string;
  name?: string;
};

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function assertPilotOwner(): Promise<void> {
  const db = getFirestore(getFirebaseAdminApp());
  const collaboratorsSnap = await db.collection('collaborators').get();
  const normalizedOwnerEmail = normalizeEmail(FACILITIES_FASE1_OWNER_EMAIL);

  const matchingCollaborators = collaboratorsSnap.docs.filter((doc) => {
    const data = doc.data() as CollaboratorRecord;
    return normalizeEmail(data.email) === normalizedOwnerEmail;
  });

  if (matchingCollaborators.length !== 1) {
    throw new Error(
      `Owner do piloto nao pode ser materializado: esperava 1 colaborador para ${FACILITIES_FASE1_OWNER_EMAIL}, encontrei ${matchingCollaborators.length}.`,
    );
  }

  const owner = matchingCollaborators[0].data() as CollaboratorRecord;
  if (owner.authUid !== FACILITIES_FASE1_OWNER_USER_ID) {
    throw new Error(
      `Owner do piloto divergente: authUid atual="${owner.authUid ?? 'ausente'}", esperado="${FACILITIES_FASE1_OWNER_USER_ID}".`,
    );
  }
}

async function run(): Promise<void> {
  const execute = hasFlag('--execute');
  const dryRun = hasFlag('--dry-run') || !execute;
  const payloads = buildSeedPayloads();

  await assertPilotOwner();

  if (dryRun) {
    console.log('[seed-fase1-facilities-v1] Dry run. Nenhuma escrita foi executada.');
    for (const payload of payloads) {
      console.log(
        JSON.stringify(
          {
            workflowTypeId: payload.workflowTypeId,
            latestPublishedVersion: payload.typePayload.latestPublishedVersion,
            versionDocPath: `workflowTypes_v2/${payload.workflowTypeId}/versions/1`,
            fields: (payload.versionPayload.fields as Array<{ id: string }>).map((field) => field.id),
          },
          null,
          2,
        ),
      );
    }
    console.log('[seed-fase1-facilities-v1] Use --execute para gravar os documentos.');
    return;
  }

  for (const { workflowTypeId, typePayload, versionPayload } of payloads) {
    await seedWorkflowType(workflowTypeId, typePayload);
    await seedWorkflowVersion(workflowTypeId, 1, versionPayload);
    console.log(`[seed-fase1-facilities-v1] Gravado ${workflowTypeId}`);
  }

  console.log('[seed-fase1-facilities-v1] Seed concluido em workflowTypes_v2.');
}

run().catch((error) => {
  console.error('[seed-fase1-facilities-v1] Falha:', error);
  process.exitCode = 1;
});
