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
