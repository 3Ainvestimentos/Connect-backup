import { buildSeedPayloadsForLot } from './shared/payload-builder';
import { LOTE_01_GOVERNANCA_FINANCEIRO_MANIFEST } from './manifests/lote-01-governanca-financeiro';
import type { BuildSeedPayload, CollaboratorRecord } from './shared/types';

export function buildLote01GovernancaFinanceiroPayloads(
  collaborators: CollaboratorRecord[],
  now?: Parameters<typeof buildSeedPayloadsForLot>[2],
): BuildSeedPayload[] {
  return buildSeedPayloadsForLot(LOTE_01_GOVERNANCA_FINANCEIRO_MANIFEST, collaborators, now);
}

