import { buildLote02MarketingPayloads } from '../lib/workflows/bootstrap/fase2c/lote-02-marketing-v1';
import { runSeedForLot } from '../lib/workflows/bootstrap/fase2c/shared/execution';

runSeedForLot({
  scriptName: 'seed-fase2c-lote-02-marketing-v1',
  buildPayloads: buildLote02MarketingPayloads,
}).catch(() => {
  process.exitCode = 1;
});

