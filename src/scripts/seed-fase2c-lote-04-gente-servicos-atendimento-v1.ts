import { buildLote04GenteServicosAtendimentoPayloads } from '../lib/workflows/bootstrap/fase2c/lote-04-gente-servicos-atendimento-v1';
import { runSeedForLot } from '../lib/workflows/bootstrap/fase2c/shared/execution';

runSeedForLot({
  scriptName: 'seed-fase2c-lote-04-gente-servicos-atendimento-v1',
  buildPayloads: buildLote04GenteServicosAtendimentoPayloads,
}).catch(() => {
  process.exitCode = 1;
});

