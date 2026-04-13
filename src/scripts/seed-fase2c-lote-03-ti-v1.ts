import { buildLote03TiPayloads } from '../lib/workflows/bootstrap/fase2c/lote-03-ti-v1';
import { runSeedForLot } from '../lib/workflows/bootstrap/fase2c/shared/execution';

runSeedForLot({
  scriptName: 'seed-fase2c-lote-03-ti-v1',
  buildPayloads: buildLote03TiPayloads,
}).catch(() => {
  process.exitCode = 1;
});

