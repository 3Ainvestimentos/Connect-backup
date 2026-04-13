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
 * - counters/workflowCounter_v2
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '../lib/firebase-admin';
import { normalizeEmail } from '../lib/email-utils';
import {
  FACILITIES_FASE1_OWNER_EMAIL,
  FACILITIES_FASE1_OWNER_USER_ID,
  buildSeedPayloads,
} from '../lib/workflows/bootstrap/fase1-facilities-v1';
import {
  seedWorkflowCounterV2,
  seedWorkflowType,
  seedWorkflowVersion,
} from '../lib/workflows/runtime/repository';

const FACILITIES_V2_INITIAL_LAST_REQUEST_NUMBER = 799;

type CollaboratorRecord = {
  email?: string;
  id3a?: string;
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
  if (owner.id3a !== FACILITIES_FASE1_OWNER_USER_ID) {
    throw new Error(
      `Owner do piloto divergente: id3a atual="${owner.id3a ?? 'ausente'}", esperado="${FACILITIES_FASE1_OWNER_USER_ID}".`,
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
            counterDocPath: 'counters/workflowCounter_v2',
            counterPayload: {
              lastRequestNumber: FACILITIES_V2_INITIAL_LAST_REQUEST_NUMBER,
            },
            counterPolicy: 'create_if_missing_preserve_if_exists',
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

  const counterSeedResult = await seedWorkflowCounterV2(FACILITIES_V2_INITIAL_LAST_REQUEST_NUMBER);

  if (counterSeedResult === 'created') {
    console.log(
      `[seed-fase1-facilities-v1] Criado counters/workflowCounter_v2 com lastRequestNumber=${FACILITIES_V2_INITIAL_LAST_REQUEST_NUMBER}`,
    );
  } else {
    console.log(
      '[seed-fase1-facilities-v1] Preservado counters/workflowCounter_v2 existente; nenhum reset de lastRequestNumber foi aplicado.',
    );
  }

  console.log(
    '[seed-fase1-facilities-v1] Seed concluido em workflowTypes_v2 e validacao do contador v2.',
  );
}

run().catch((error) => {
  console.error('[seed-fase1-facilities-v1] Falha:', error);
  process.exitCode = 1;
});
