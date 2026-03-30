# BUILD REPORT: FASE1_FACILITIES_ETAPA5

> Generated: 2026-03-30
> Source: DESIGN_FASE1_FACILITIES_ETAPA5.md
> Status: COMPLETE WITH MANUAL VALIDATION PENDING

## 1. Summary

| Metric | Value |
|--------|-------|
| Backend Route Added | 1 |
| Runtime Modules Added | 2 |
| Pilot Client Modules Modified | 2 |
| Tests Added | 3 |
| Tests Modified | 1 |
| Manual Validation Pending | Yes |

## 2. Delivered Scope

### Backend
- `src/app/api/workflows/runtime/uploads/route.ts`
- `src/lib/workflows/runtime/use-cases/init-file-upload.ts`
- `src/lib/workflows/runtime/upload-storage.ts`
- `src/lib/workflows/runtime/errors.ts`

Verification: rota autenticada `POST /api/workflows/runtime/uploads` implementada com envelope canonico, parse defensivo do body e propagacao de `RuntimeError`.

### Pilot client
- `src/lib/workflows/pilot/api-client.ts`
- `src/lib/workflows/pilot/types.ts`

Verification: helper cliente separado entre assinatura (`requestPilotUpload`) e transferencia (`putFileToSignedUrl`), com erro tipado proprio para falha no `PUT`.

### Tests
- `src/lib/workflows/runtime/__tests__/init-file-upload.test.ts`
- `src/lib/workflows/runtime/__tests__/upload-route-contract.test.ts`
- `src/lib/workflows/runtime/__tests__/upload-storage.test.ts`
- `src/lib/workflows/pilot/__tests__/api-client.test.ts`

Verification: cobertura adicionada para validacao de campo `file`, contrato HTTP da rota, composicao de `storagePath`/`fileUrl` e separacao entre erro de assinatura e erro de transferencia.

## 3. Verification Results

| Check | Result |
|------|--------|
| `npx eslint src/lib/workflows/runtime/upload-storage.ts src/lib/workflows/runtime/use-cases/init-file-upload.ts src/app/api/workflows/runtime/uploads/route.ts src/lib/workflows/pilot/api-client.ts src/lib/workflows/pilot/types.ts src/lib/workflows/runtime/__tests__/upload-storage.test.ts` | Pass |
| `npm test -- --runInBand src/lib/workflows/runtime/__tests__/upload-storage.test.ts src/lib/workflows/runtime/__tests__/init-file-upload.test.ts src/lib/workflows/runtime/__tests__/upload-route-contract.test.ts src/lib/workflows/pilot/__tests__/api-client.test.ts` | Pass |
| `npm run typecheck` | Fail (legacy repo errors outside Etapa 5 scope) |

### Typecheck note

O `typecheck` global continua falhando em arquivos legados e administrativos fora do recorte da Etapa 5, incluindo `src/app/api/billing/route.ts`, componentes admin diversos, contexts antigos e tipos gerados em `.next/types/validator.ts`.

Nao ficou erro remanescente identificado nos arquivos novos/alterados da Etapa 5 durante a validacao local direcionada.

## 4. Manual Validation Pending

- [ ] Subir a app com Firebase Admin configurado para assinatura de URL.
- [ ] Obter Firebase ID token valido.
- [ ] Chamar `POST /api/workflows/runtime/uploads` para `facilities_solicitacao_suprimentos/anexo_planilha`.
- [ ] Fazer `PUT` real do arquivo na `uploadUrl`.
- [ ] Usar a `fileUrl` em `POST /api/workflows/runtime/requests`.
- [ ] Confirmar `formData.anexo_planilha` persistido em `workflows_v2`.

## 5. Operational Notes

- O bucket de assinatura e resolvido por `FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` ou `app.options.storageBucket`.
- A service account do ambiente precisa ter permissao para assinar URLs do Cloud Storage; sem isso a rota responde `UPLOAD_SIGNATURE_FAILED`.
- O path final segue o prefixo `Workflows/Facilities e Suprimentos/workflows_v2/preopen/...` com `uploadId` server-side.

## 6. Deviations from DESIGN

Nenhum desvio funcional relevante.

O build manteve o contrato previsto:
- sem mudanca em `POST /api/workflows/runtime/requests`;
- sem nova colecao Firestore;
- sem alteracao na UI da Etapa 4.

## 7. Next Steps

1. Executar smoke manual em ambiente com Firebase Admin real.
2. Validar permissao operacional da service account para assinatura de URL.
3. Consumir `uploadPilotFile()` na Etapa 6 ao integrar o campo `file` na UI do piloto.
