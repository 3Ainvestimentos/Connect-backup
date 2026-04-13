# BUILD: FASE1_FACILITIES_ETAPA7

> Generated: 2026-03-31
> Status: Built
> Source design: `DESIGN_FASE1_FACILITIES_ETAPA7.md`
> Source define: `DEFINE_FASE1_FACILITIES_ETAPA7.md`

## 1. Escopo entregue

- `facilities_solicitacao_compras` entrou no registry do piloto e no resolver derivado da fonte unica.
- o cliente do piloto agora consome `GET /api/workflows/read/completed` com `completedQuery` e cache key dedicada.
- a rota `/pilot/facilities` ganhou a aba `Concluidas`, contagem global e filtro local por workflow.
- o dialog passou a esconder a atribuicao depois da primeira atribuicao, mantendo o responsavel em leitura.
- a cobertura automatizada foi ampliada para workflow 3, `completed`, filtros mensais e nova aba.

## 2. Arquivos principais

- `src/lib/workflows/pilot/workflow-registry.ts`
- `src/lib/workflows/pilot/types.ts`
- `src/lib/workflows/pilot/api-client.ts`
- `src/lib/workflows/pilot/query-keys.ts`
- `src/hooks/use-facilities-pilot.ts`
- `src/components/pilot/facilities/FacilitiesPilotPage.tsx`
- `src/components/pilot/facilities/CompletedTab.tsx`
- `src/components/pilot/facilities/RequestDetailsDialog.tsx`
- `src/lib/workflows/pilot/__tests__/workflow-registry.test.ts`
- `src/lib/workflows/pilot/__tests__/workflow-filters.test.ts`
- `src/lib/workflows/pilot/__tests__/api-client.test.ts`
- `src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx`
- `src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx`
- `src/components/pilot/facilities/__tests__/CompletedTab.test.tsx`

## 3. Validacao executada

- `npm test -- --runInBand src/lib/workflows/pilot/__tests__/workflow-registry.test.ts src/lib/workflows/pilot/__tests__/workflow-filters.test.ts src/lib/workflows/pilot/__tests__/api-client.test.ts src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx src/components/pilot/facilities/__tests__/RequestSummaryList.test.tsx src/components/pilot/facilities/__tests__/CompletedTab.test.tsx`
- `npx eslint src/lib/workflows/pilot/workflow-registry.ts src/lib/workflows/pilot/types.ts src/lib/workflows/pilot/api-client.ts src/lib/workflows/pilot/query-keys.ts src/hooks/use-facilities-pilot.ts src/components/pilot/facilities/FacilitiesPilotPage.tsx src/components/pilot/facilities/CompletedTab.tsx src/components/pilot/facilities/RequestDetailsDialog.tsx src/lib/workflows/pilot/__tests__/workflow-registry.test.ts src/lib/workflows/pilot/__tests__/workflow-filters.test.ts src/lib/workflows/pilot/__tests__/api-client.test.ts src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx src/components/pilot/facilities/__tests__/CompletedTab.test.tsx`

Resultado:

- 7 suites / 24 testes verdes
- lint limpo nos arquivos alterados

## 4. Pendencias e limites

- `npm run typecheck` global continua falhando por erros preexistentes e fora do escopo desta etapa, em modulos como billing, admin, dashboard e contexts.
- nao houve validacao manual no ambiente autenticado do piloto para:
  - alternancia real entre os 3 workflows;
  - abertura de compras com e sem anexo real;
  - confirmacao da aba `Concluidas` com dados reais do backend.

## 5. Checklist da etapa

- [x] registry local suporta os 3 workflows
- [x] `completedQuery` conectada ao piloto
- [x] aba `Concluidas` renderizada e coberta por teste
- [x] workflow 3 coberto com upload opcional vazio e preenchido
- [x] dialog em modo leitura apos atribuicao
- [ ] validacao manual com dados reais do piloto
