# Roadmap das Etapas - Fase 2

## 1. Objetivo

Este documento resume apenas a divisao macro da Fase 2, sem repetir o detalhamento completo do roadmap principal.

Ele deve ser lido em conjunto com:

- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)

---

## 2. Sequencia Macro

### 2A. Front oficial da tela integrada

**Objetivo**

Transformar a experiencia validada no piloto em uma experiencia oficial de produto para gestao de chamados.

**Saidas esperadas**

- rota oficial integrada;
- UI oficial de operacao;
- detalhe rico de request;
- visualizacao de anexos;
- filtros e agrupamentos consolidados;
- descolamento da superficie `pilot/*`.

**Sub-builds recomendados**

- `2A.1` Entrada oficial + shell da nova rota
- `2A.2` Bootstrap + listas oficiais
- `2A.3` Detalhe rico do request
- `2A.4` Polimento e rollout controlado

---

### 2B. Nova tela oficial de abertura de chamado

**Objetivo**

Construir a nova experiencia oficial de abertura de chamados sobre o backend novo, sem usar a tela legada atual como base principal de evolucao.

**Saidas esperadas**

- nova superficie oficial de abertura;
- componente novo e separado da implementacao legada;
- equivalencia funcional com a tela atual no primeiro momento;
- possibilidade de identidade visual inicialmente identica a tela legada, sem reaproveitar sua implementacao;
- convivencia temporaria com a tela antiga durante rollout e testes;
- limpeza dos artefatos antigos apenas depois de implementacao completa e validacao end-to-end.

---

### 2C. Cadastro e habilitacao dos workflows restantes

**Objetivo**

Expandir o novo motor para os workflows ainda fora do modelo novo, em lotes controlados.

**Saidas esperadas**

- inventario consolidado dos workflows restantes;
- lotes de migracao definidos;
- versoes iniciais publicadas;
- workflows habilitados no frontend oficial quando suportados pelo runtime atual;
- estrategia de rollout por grupo.

**Status atual**

- concluida

**Fechamentos consolidados**

- os `30` workflows restantes foram seedados em `5` lotes;
- workflows diretos aprovados passaram a usar `canonical_3_steps`;
- workflows com `action` ou checkpoints semanticos relevantes permaneceram em `preserve_legacy`;
- lotes `1`, `2` e `3` ficaram com `active: true`;
- lotes `4` e `5` ficaram com `active: false`, aguardando a `2D`.

**Dependencia explicita**

- workflows com `statuses[*].action` podem ser seedados e validados na `2C`, mas o enablement pleno depende da `2D`.

---

### 2D. Motor operacional de `requestAction` / `respondAction`

**Objetivo**

Implementar a capacidade de runtime necessaria para workflows com etapas action-driven.

**Saidas esperadas**

- casos de uso de `requestAction` e `respondAction`;
- suporte a `approval`, `acknowledgement` e `execution`;
- atualizacao correta do read model em `waiting_action`;
- desbloqueio operacional dos lotes action-driven da `2C`.

**Status atual**

- concluida

**Fechamentos consolidados**

- `requestAction` / `respondAction` entregues no runtime novo;
- suporte operacional aos tres tipos:
  - `approval`
  - `acknowledgement`
  - `execution`
- detalhe oficial enriquecido com bloco `action`, permissoes e timeline;
- uploads de `action_response` endurecidos com validacao via Storage API;
- uploads novos consolidados no namespace neutro:
  - `Workflows/workflows_v2/uploads/...`
- estado `completed` passou a manter o ultimo batch visivel no detalhe;
- a regra de somente leitura para batch encerrado tambem subiu ao backend:
  - `requestAction` nao reabre a mesma etapa depois que ela ja teve batch historico;
- correcoes finais validadas com `3` suites e `41` testes passando.

---

### 2E. Tela de configuracao, novas versoes e publicacao

**Objetivo**

Criar a superficie administrativa para configuracao e evolucao dos workflows.

**Saidas esperadas**

- listagem administrativa de workflows;
- historico de versoes;
- criacao de nova versao;
- edicao controlada;
- publicacao com validacoes.

---

## 3. Ordem Recomendada

1. `2A` Front oficial da tela integrada
2. `2C` Cadastro e habilitacao dos workflows restantes
3. `2D` Motor operacional de `requestAction` / `respondAction`
4. `2B` Nova tela oficial de abertura de chamado
5. `2E` Tela de configuracao, novas versoes e publicacao

**Estado recomendado agora**

- `2A`, `2C` e `2D`: concluidas
- proximo foco pode ser `2B` ou `2E`, conforme prioridade de produto

---

## 4. Regra de Uso

Este documento existe como visao rapida da Fase 2.

Quando houver conflito de detalhe:

1. prevalece o documento especifico da macroetapa;
2. depois o [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md);
3. depois o [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md).
