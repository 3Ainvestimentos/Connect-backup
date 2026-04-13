import { buildLote01GovernancaFinanceiroPayloads } from '../lib/workflows/bootstrap/fase2c/lote-01-governanca-financeiro-v1';
import { runSeedForLot } from '../lib/workflows/bootstrap/fase2c/shared/execution';

runSeedForLot({
  scriptName: 'seed-fase2c-lote-01-governanca-financeiro-v1',
  buildPayloads: buildLote01GovernancaFinanceiroPayloads,
}).catch(() => {
  process.exitCode = 1;
});

