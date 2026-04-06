import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import {
  getWorkflowType,
  getWorkflowVersion,
  seedWorkflowType,
  seedWorkflowVersion,
} from '@/lib/workflows/runtime/repository';
import { fetchCollaborators } from './owner-resolution';
import type { BuildSeedPayload, CollaboratorRecord, Fase2cDryRunItem } from './types';

type Logger = (message: string) => void;

type BuildLotPayloads = (
  collaborators: CollaboratorRecord[],
  now?: Timestamp,
) => BuildSeedPayload[] | Promise<BuildSeedPayload[]>;

type RunSeedForLotOptions = {
  scriptName: string;
  buildPayloads: BuildLotPayloads;
  argv?: string[];
  logger?: Logger;
  errorLogger?: Logger;
  now?: Timestamp;
};

const COUNTER_DOC_PATH = 'counters/workflowCounter_v2';

function isValidCounterValue(rawValue: unknown): boolean {
  return typeof rawValue === 'number' && Number.isInteger(rawValue);
}

export function hasFlag(flag: string, argv: string[] = process.argv): boolean {
  return argv.includes(flag);
}

export async function inspectCounterStatus(): Promise<Fase2cDryRunItem['counterStatus']> {
  const db = getFirestore(getFirebaseAdminApp());
  const snapshot = await db.doc(COUNTER_DOC_PATH).get();

  if (!snapshot.exists) {
    return 'absent';
  }

  return isValidCounterValue(snapshot.data()?.lastRequestNumber)
    ? 'present_valid'
    : 'present_invalid';
}

export async function assertNoPublishedTargets(payloads: BuildSeedPayload[]): Promise<void> {
  for (const payload of payloads) {
    const existingType = await getWorkflowType(payload.workflowTypeId);

    if (existingType) {
      throw new Error(
        `Destino ja publicado: workflowTypes_v2/${payload.workflowTypeId} ja existe.`,
      );
    }

    const existingVersion = await getWorkflowVersion(payload.workflowTypeId, 1);

    if (existingVersion) {
      throw new Error(
        `Destino ja publicado: workflowTypes_v2/${payload.workflowTypeId}/versions/1 ja existe.`,
      );
    }
  }
}

export function materializeDryRunReport(
  payloads: BuildSeedPayload[],
  counterStatus: Fase2cDryRunItem['counterStatus'],
): Fase2cDryRunItem[] {
  return payloads.map((payload) => ({
    ...payload.reportItem,
    counterStatus,
  }));
}

export function printDryRunReport(
  payloads: BuildSeedPayload[],
  counterStatus: Fase2cDryRunItem['counterStatus'],
  logger: Logger = console.log,
): void {
  logger(JSON.stringify(materializeDryRunReport(payloads, counterStatus), null, 2));
}

export async function executeSeedPayloads(
  payloads: BuildSeedPayload[],
  logger: Logger = console.log,
): Promise<void> {
  for (const payload of payloads) {
    await seedWorkflowType(
      payload.workflowTypeId,
      payload.typePayload as unknown as Record<string, unknown>,
    );
    await seedWorkflowVersion(
      payload.workflowTypeId,
      1,
      payload.versionPayload as unknown as Record<string, unknown>,
    );
    logger(`[fase2c] Gravado ${payload.workflowTypeId}`);
  }
}

export async function runSeedForLot({
  scriptName,
  buildPayloads,
  argv = process.argv,
  logger = console.log,
  errorLogger = console.error,
  now,
}: RunSeedForLotOptions): Promise<void> {
  try {
    const execute = hasFlag('--execute', argv);
    const dryRun = hasFlag('--dry-run', argv) || !execute;
    const collaborators = await fetchCollaborators();
    const payloads = await buildPayloads(collaborators, now);
    const counterStatus = await inspectCounterStatus();

    await assertNoPublishedTargets(payloads);

    if (dryRun) {
      logger(`[${scriptName}] Dry run. Nenhuma escrita foi executada.`);
      printDryRunReport(payloads, counterStatus, logger);
      logger(`[${scriptName}] Counter status: ${counterStatus}`);
      logger(`[${scriptName}] Use --execute para gravar os documentos.`);
      return;
    }

    await executeSeedPayloads(payloads, logger);
    logger(
      `[${scriptName}] Seed concluido em workflowTypes_v2 e versions/1 sem escrita em ${COUNTER_DOC_PATH}. Counter status observado: ${counterStatus}.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    errorLogger(`[${scriptName}] Falha: ${message}`);
    throw error;
  }
}
