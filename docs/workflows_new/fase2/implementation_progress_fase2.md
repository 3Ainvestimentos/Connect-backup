# Progress Fase 2

> Updated: 2026-04-06
> Status: 2A concluida; 2C concluida; proximo foco recomendado: 2D

## 1. Resumo executivo

O programa da Fase 2 chegou a um estado estavel em duas frentes:

- **2A** concluida, com a tela oficial `/gestao-de-chamados` em producao interna;
- **2C** concluida, com os `30` workflows restantes materializados em `workflowTypes_v2` por lotes.

O proximo foco recomendado do roadmap passa a ser:

1. **2D** Motor operacional de `requestAction` / `respondAction`
2. **2B** Nova tela oficial de abertura de chamado
3. **2E** Configuracao, versionamento e publicacao

## 2. Estado por macroetapa

### 2A. Front oficial da tela integrada

Status:
- **concluida**

Resultado:
- rota `/gestao-de-chamados` entregue;
- dropdown do usuario consolidado como ponto de entrada da operacao;
- bootstrap, listas, filtros, URL state, detalhe rico, modal e polimento visual entregues;
- legado mantido em convivencia controlada durante a transicao.

### 2B. Nova tela oficial de abertura de chamado

Status:
- **nao iniciada**

Diretriz ja fechada:
- a nova tela pode ser visualmente identica a legada no primeiro momento;
- a implementacao deve ser nova e conectada ao backend novo.

### 2C. Cadastro e habilitacao dos workflows restantes

Status:
- **concluida**

Resultado:
- `30` workflows restantes materializados em `workflowTypes_v2` e `versions/1`;
- execucao concluida em `5` lotes:
  - lote `1` Governanca + Financeiro
  - lote `2` Marketing
  - lote `3` TI
  - lote `4` Gente / servicos e atendimento
  - lote `5` Gente / ciclo de vida e movimentacoes

Decisoes consolidadas da 2C:
- workflows diretos aprovados passaram a usar `canonical_3_steps`;
- o canon de `3` etapas foi alinhado a Facilities:
  - `Solicitação Aberta`
  - `Em andamento`
  - `Finalizado`
- a semantica funcional desses workflows tambem foi alinhada a Facilities:
  - `Solicitação Aberta` = owner designa responsavel
  - `Em andamento` = chamado atribuido e em execucao
  - `Finalizado` = encerramento operacional
- a classificacao ficou explicita por workflow via `stepStrategy`:
  - `canonical_3_steps`
  - `preserve_legacy`
- workflows com `action` ou checkpoints semanticos relevantes permaneceram em `preserve_legacy`;
- `canonical_3_steps` ficou proibido com:
  - `statuses[*].action`
  - `statusIdOverrides`
- lotes `1` e `2` foram removidos manualmente e reseedados apos a correcao do canon;
- lotes `4` e `5` foram publicados com `active: false`, aguardando a `2D`.

Estado operacional final da 2C:
- lotes `1`, `2` e `3`: `active: true`
- lotes `4` e `5`: `active: false`

### 2D. Motor operacional de `requestAction` / `respondAction`

Status:
- **nao iniciada**

Contexto herdado da 2C:
- os workflows action-driven ja foram seedados;
- o runtime ja preserva `action` no contrato publicado;
- o enablement pleno dos lotes `4` e `5` depende desta macroetapa.

### 2E. Configuracao, versionamento e publicacao

Status:
- **nao iniciada**

## 3. Decisoes de continuidade

- nao reabrir a `2C` para redesenho funcional da `v1`;
- checkpoints hoje preservados em `preserve_legacy` podem virar `action` em futuras `v2`, depois da entrega da `2D` e da superficie administrativa;
- qualquer evolucao estrutural dos workflows seedados deve acontecer por versionamento futuro, nao por nova seed da `v1`.

## 4. Proximo passo recomendado

Abrir a **2D** com foco em:

- `requestAction`
- `respondAction`
- estados `waiting_action`
- atualizacao consistente do read model
- readiness para promover lotes `4` e `5` a `enabled`
