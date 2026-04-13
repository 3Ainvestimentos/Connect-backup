import { buildSeedPayloadsForLot } from './shared/payload-builder';
import { LOTE_03_TI_MANIFEST } from './manifests/lote-03-ti';
import type { BuildSeedPayload, CollaboratorRecord } from './shared/types';

export function buildLote03TiPayloads(
  collaborators: CollaboratorRecord[],
  now?: Parameters<typeof buildSeedPayloadsForLot>[2],
): BuildSeedPayload[] {
  return buildSeedPayloadsForLot(LOTE_03_TI_MANIFEST, collaborators, now);
}

