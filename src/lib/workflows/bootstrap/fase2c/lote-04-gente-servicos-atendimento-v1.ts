import { buildSeedPayloadsForLot } from './shared/payload-builder';
import { LOTE_04_GENTE_SERVICOS_ATENDIMENTO_MANIFEST } from './manifests/lote-04-gente-servicos-atendimento';
import type { BuildSeedPayload, CollaboratorRecord } from './shared/types';

export function buildLote04GenteServicosAtendimentoPayloads(
  collaborators: CollaboratorRecord[],
  now?: Parameters<typeof buildSeedPayloadsForLot>[2],
): BuildSeedPayload[] {
  return buildSeedPayloadsForLot(
    LOTE_04_GENTE_SERVICOS_ATENDIMENTO_MANIFEST,
    collaborators,
    now,
  );
}

