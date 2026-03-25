## 2026-03-24 - Etapa 0 / Fase 1 Facilities

### Entrega

Foi concluida a canonizacao funcional do piloto de Facilities no artefato [DEFINE_FASE1_FACILITIES_ETAPA0.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA0.md).

### O que ficou fechado

- 3 workflows piloto definidos:
  - `facilities_manutencao_solicitacoes_gerais`
  - `facilities_solicitacao_suprimentos`
  - `facilities_solicitacao_compras`
- fluxo canonico comum dos 3 workflows:
  - `Solicitacao Aberta`
  - `Em andamento`
  - `Finalizado`
- `statusKey` canonicos:
  - `solicitacao_aberta`
  - `em_andamento`
  - `finalizado`
- `kind` sugerido das etapas:
  - `start`
  - `work`
  - `final`
- owner do piloto mantido:
  - `stefania.otoni@3ainvestimentos.com.br`
- `defaultSlaDays` mantido:
  - `5`
- `allowedUserIds` herdado do `workflowDefinitions` atual
- `field.id` do piloto fechado, com normalizacao de `centrodecusto` para `centro_custo` onde aplicavel

### Decisoes importantes

- `stepId` nao sera definido manualmente no `define`; sera auto-gerado na materializacao tecnica
- os diagramas legados da area ficaram apenas como referencia historica
- `Solicitacao de Compras` entrou no mesmo modelo simplificado de 3 etapas do piloto

### Saida para a proxima etapa

O piloto ficou pronto para a `5.2`, com contrato funcional suficiente para materializar `workflowTypes`, `versions` e a base tecnica do runtime sem depender de regras implicitas do legado.

## 2026-03-25 - Decisao de convivio com producao

### Decisao

Como o piloto da Fase 1 usara o mesmo banco do legado em producao, ficou decidido isolar o motor novo em colecoes paralelas:

- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- `workflows_v2`
- `counters/workflowCounter_v2`

### Objetivo

Evitar mistura de schema e queries com:

- `workflowDefinitions`
- `workflows`
- filtros e telas legadas

### Impacto

- seed/bootstrap da Fase 1 deve escrever apenas nas colecoes `_v2`
- runtime novo da Fase 1 deve ler e gravar apenas nas colecoes `_v2`
- indices do piloto devem ser provisionados para `workflows_v2`

## 2026-03-25 - Etapa 1 / Fase 1 Facilities

### Entrega

Foi implementada a fundacao tecnica da Etapa 1 do novo motor de workflows para Facilities, isolada das colecoes legadas e alinhada aos artefatos de design da fase.

### O que foi implementado

- runtime write-side server-side em `_v2` para:
  - `open-request`
  - `assign-responsible`
  - `advance-step`
  - `finalize-request`
  - `archive-request`
- tipos centrais, repository, engine, authz, history, read-model e normalizacao de input em `src/lib/workflows/runtime`
- rotas `app/api/workflows/runtime/*` autenticadas com Firebase Admin
- bootstrap dos 3 workflows piloto em:
  - `workflowTypes_v2/{workflowTypeId}`
  - `workflowTypes_v2/{workflowTypeId}/versions/1`
- geracao de `stepId` sistemica para as versoes publicadas
- backbone do read model persistido desde a abertura em `workflows_v2`
- script manual de seed do piloto em `src/scripts/seed-fase1-facilities-v1.ts`

### Correcoes aplicadas durante a Etapa 1

- identidade operacional corrigida para:
  - autenticar com `authUid`
  - operar no runtime com `id3a`
- `ownerUserId` do piloto corrigido para:
  - `SMO2`
- rotas write-side passaram a resolver `decodedToken.uid -> collaborators.authUid -> collaborator.id3a`
- `allowedUserIds`, owner, requester, responsible e `operationalParticipantIds` ficaram padronizados em `id3a`
- contador v2 normalizado para:
  - documento `counters/workflowCounter_v2`
  - campo `lastRequestNumber`
- faixa inicial do piloto v2 reservada para:
  - primeiro request em `0800`
- fallback silencioso do contador foi removido do runtime
- seed do contador passou a:
  - criar se ausente em ambiente virgem
  - preservar se ja existir valido
  - falhar se o documento existir invalido
- limitacao atual de `history` como array no documento principal foi registrada como aceitavel no piloto, com evolucao futura prevista para hardening

### Validacao executada

- suites de testes do runtime v2 criadas e reforcadas em:
  - `actor-resolution`
  - `authz`
  - `input-normalization`
  - `repository`
  - `runtime-use-cases`
- resultado final dos testes do bloco novo:
  - `5` suites aprovadas
  - `46` testes aprovados
  - `0` falhas
- o teste legado de `WorkflowSubmissionModal` permaneceu fora do escopo da Etapa 1

### Materializacao em Firestore

- contador do piloto v2 provisionado em:
  - `counters/workflowCounter_v2`
  - `lastRequestNumber = 799`
- seed executado para materializar os 3 workflows piloto e suas `versions/1`
- validacao manual confirmou estrutura correta de:
  - `fields`
  - `initialStepId`
  - `stepOrder`
  - `stepsById`
  - `ownerUserId`
  - `defaultSlaDays`

### Resultado da etapa

A Etapa 1 ficou concluida com:

- runtime write-side v2 implementado
- identidade operacional corrigida
- contador v2 endurecido
- seed do piloto executado
- colecoes `_v2` materializadas
- testes do bloco novo aprovados

### Observacao operacional

Fica recomendado como proximo passo da fase:

- executar um smoke test real de `open-request` em `workflows_v2` para validar ponta a ponta a primeira abertura operacional do piloto
