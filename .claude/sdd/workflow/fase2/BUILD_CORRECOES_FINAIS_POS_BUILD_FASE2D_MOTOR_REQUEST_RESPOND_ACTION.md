# BUILD REPORT: Correcoes Finais Pos-Build da Fase 2D - Motor operacional de `requestAction` / `respondAction`

> Date: 2026-04-08
> Source design: `DESIGN_CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
> Source define: `DEFINE_CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
> Status: Done

## Implemented

- `requestAction` agora bloqueia reabertura da etapa atual quando ja existe qualquer batch historico em `actionRequests`, inclusive batch encerrado.
- `detail.ts` passou a usar apenas o predicado canonico `hasAnyActionBatchForCurrentStep(request)` para `canRequestAction`, removendo o guard redundante por batch pendente.
- `hasAnyActionBatchForCurrentStep` foi documentado como gate canonico da etapa atual.
- `upload-storage.test.ts` ganhou cobertura direta para:
  - `assertAllowedWorkflowUploadPath`
  - `assertAttachmentUrlMatchesStoragePath`
  - `assertUploadIdMatchesFileName`
- a cobertura continua provando que uploads novos nascem em `Workflows/workflows_v2/uploads/...` e nao regressam ao prefixo legado `Facilities e Suprimentos`.
- `runtime-use-cases.test.js` ganhou regressao para tentativa de `requestAction` com batch historico encerrado na mesma etapa.

## Files Changed

- `src/lib/workflows/runtime/action-helpers.ts`
- `src/lib/workflows/runtime/use-cases/request-action.ts`
- `src/lib/workflows/read/detail.ts`
- `src/lib/workflows/runtime/__tests__/upload-storage.test.ts`
- `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js`

## Validation

Command executed:

```bash
npx jest src/lib/workflows/runtime/__tests__/upload-storage.test.ts src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js src/lib/workflows/read/__tests__/detail.test.js --runInBand
```

Result:

- 3 test suites passed
- 41 tests passed

## Notes

- `src/lib/workflows/read/__tests__/detail.test.js` ja cobria o comportamento esperado para batch encerrado visivel e `canRequestAction = false`, por isso nao precisou de delta adicional.
- `src/lib/workflows/read/types.ts`, `src/lib/workflows/management/types.ts` e `src/lib/workflows/management/api-client.ts` foram verificados e permaneceram sem mudanca por ja estarem coerentes com o contrato `idle | pending | completed`.
