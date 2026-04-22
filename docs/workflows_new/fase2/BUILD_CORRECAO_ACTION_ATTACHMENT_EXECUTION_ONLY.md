# Build - Correcao de `attachmentRequired` para actions nao `execution`

## 1. Resultado

Implementacao concluida conforme [DESIGN_CORRECAO_ACTION_ATTACHMENT_EXECUTION_ONLY.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/DESIGN_CORRECAO_ACTION_ATTACHMENT_EXECUTION_ONLY.md).

## 2. O que foi entregue

- helper compartilhado em [src/lib/workflows/runtime/action-capabilities.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-capabilities.ts) para centralizar a regra de capability de anexo;
- editor em [src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx) agora:
  - mostra `Anexo obrigatorio` apenas para `execution`;
  - reseta `attachmentRequired` ao sair de `execution`;
- hydrate/save de draft em [src/lib/workflows/admin-config/draft-repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts) agora normalizam `attachmentRequired` fora de `execution`;
- publish em [src/lib/workflows/admin-config/publication-service.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publication-service.ts) saneia drafts legados antes de persistir a versao publicada;
- runtime/read side em [src/lib/workflows/runtime/action-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-helpers.ts) passam a tratar `attachmentRequired` como `false` fora de `execution`.

## 3. Testes executados

Sucesso:

```bash
npx jest src/lib/workflows/runtime/__tests__/action-capabilities.test.ts \
  src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx \
  src/lib/workflows/admin-config/__tests__/draft-repository.test.ts \
  src/lib/workflows/admin-config/__tests__/publication-service.test.ts \
  src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js \
  src/lib/workflows/read/__tests__/detail.test.js
```

Resultado: `6 suites, 65 testes passando`.

## 4. Validacao adicional

`npm run typecheck` falhou por erros preexistentes fora do escopo desta entrega, incluindo arquivos em `src/app/api/billing/route.ts`, `src/components/admin/*`, `src/contexts/*` e testes/requester legados. Nenhum dos erros reportados aponta para os arquivos alterados nesta correcao.
