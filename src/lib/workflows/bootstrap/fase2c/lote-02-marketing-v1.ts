import { buildSeedPayloadsForLot } from './shared/payload-builder';
import { LOTE_02_MARKETING_MANIFEST } from './manifests/lote-02-marketing';
import type { BuildSeedPayload, CollaboratorRecord } from './shared/types';

export function buildLote02MarketingPayloads(
  collaborators: CollaboratorRecord[],
  now?: Parameters<typeof buildSeedPayloadsForLot>[2],
): BuildSeedPayload[] {
  return buildSeedPayloadsForLot(LOTE_02_MARKETING_MANIFEST, collaborators, now);
}

