# BUILD REPORT: FASE1_FACILITIES_ETAPA5_1

> Generated: 2026-03-30
> Source: DESIGN_FASE1_FACILITIES_ETAPA5_1.md
> Status: COMPLETE WITH MANUAL VALIDATION PENDING

## 1. Summary

| Metric | Value |
|--------|-------|
| Generic Upload Modules Added | 3 |
| Pilot Modules Modified | 3 |
| Backend Modules Modified | 0 |
| Tests Added | 1 |
| Tests Modified | 1 |
| Manual Validation Pending | Yes |

## 2. Delivered Scope

### Generic upload client
- `src/lib/workflows/upload/types.ts`
- `src/lib/workflows/upload/client.ts`
- `src/lib/workflows/upload/__tests__/client.test.ts`

Verification: upload passou a viver em `src/lib/workflows/upload/*`, com naming neutro (`requestWorkflowFileUpload`, `uploadWorkflowFile`) e erros tipados locais (`WorkflowUploadRequestError`, `WorkflowFileTransferError`), sem dependencia estrutural de `pilot/*`.

### Pilot cleanup
- `src/lib/workflows/pilot/types.ts`
- `src/lib/workflows/pilot/api-client.ts`
- `src/lib/workflows/pilot/__tests__/api-client.test.ts`

Verification: `pilot/*` voltou a conter apenas catalogo, read-side e runtime mutations do piloto; DTOs, normalizador e helpers de upload foram removidos sem manter facade ou alias legado.

### Backend
- nenhum arquivo backend alterado

Verification: o contrato de `POST /api/workflows/runtime/uploads` permaneceu intacto.

## 3. Verification Results

| Check | Result |
|------|--------|
| `npx jest --runTestsByPath src/lib/workflows/upload/__tests__/client.test.ts src/lib/workflows/pilot/__tests__/api-client.test.ts src/lib/workflows/runtime/__tests__/init-file-upload.test.ts src/lib/workflows/runtime/__tests__/upload-route-contract.test.ts` | Pass |
| busca residual de `requestPilotUpload`, `uploadPilotFile`, `PilotUpload*` e `PilotFileTransferError` em `src/` | Pass |
| `npx tsc --noEmit --pretty false` | Fail (legacy repo errors outside Etapa 5.1 scope) |

### Typecheck note

O `typecheck` global continua falhando em arquivos legados fora do recorte desta etapa, incluindo `.next/types/validator.ts`, `src/app/api/billing/route.ts`, componentes administrativos, dashboards e contexts antigos.

Nao ficou erro remanescente identificado nos arquivos alterados da Etapa 5.1 durante a filtragem local da saida do `tsc`.

## 4. Manual Validation Pending

- [ ] Executar smoke real com usuario autenticado chamando `uploadWorkflowFile()`.
- [ ] Confirmar `POST /api/workflows/runtime/uploads` seguido de `PUT` real na signed URL.
- [ ] Verificar que a `fileUrl` final preserva a mesma semantica e persistencia da Etapa 5.
- [ ] Validar a integracao da Etapa 6 consumindo `@/lib/workflows/upload/client`.

## 5. Deviations from DESIGN

Nenhum desvio funcional relevante.

O build preservou o corte fechado:
- sem alteracao em backend;
- sem facade em `pilot/*`;
- sem compatibilidade dupla para nomes antigos.

## 6. Next Steps

1. Executar o smoke manual em ambiente com Firebase real.
2. Consumir `uploadWorkflowFile()` na Etapa 6 a partir de `@/lib/workflows/upload/client`.
3. Tratar separadamente os erros legados do `typecheck` global, se a branch exigir baseline verde de TypeScript.
