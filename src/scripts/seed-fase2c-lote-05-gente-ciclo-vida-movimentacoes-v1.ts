import { buildLote05GenteCicloVidaMovimentacoesPayloads } from '../lib/workflows/bootstrap/fase2c/lote-05-gente-ciclo-vida-movimentacoes-v1';
import { runSeedForLot } from '../lib/workflows/bootstrap/fase2c/shared/execution';

runSeedForLot({
  scriptName: 'seed-fase2c-lote-05-gente-ciclo-vida-movimentacoes-v1',
  buildPayloads: buildLote05GenteCicloVidaMovimentacoesPayloads,
}).catch(() => {
  process.exitCode = 1;
});
