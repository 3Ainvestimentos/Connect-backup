import { buildSeedPayloadsForLot } from './shared/payload-builder';
import { LOTE_05_GENTE_CICLO_VIDA_MOVIMENTACOES_MANIFEST } from './manifests/lote-05-gente-ciclo-vida-movimentacoes';
import type { BuildSeedPayload, CollaboratorRecord } from './shared/types';

export function buildLote05GenteCicloVidaMovimentacoesPayloads(
  collaborators: CollaboratorRecord[],
  now?: Parameters<typeof buildSeedPayloadsForLot>[2],
): BuildSeedPayload[] {
  return buildSeedPayloadsForLot(
    LOTE_05_GENTE_CICLO_VIDA_MOVIMENTACOES_MANIFEST,
    collaborators,
    now,
  );
}

