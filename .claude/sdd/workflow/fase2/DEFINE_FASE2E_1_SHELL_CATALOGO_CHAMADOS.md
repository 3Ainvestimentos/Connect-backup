# DEFINE: Fase 2E.1 - Permissao, rota, shell e catalogo read-only de chamados

> Generated: 2026-04-08
> Status: Approved for design
> Scope: Fase 2 / 2E.1 - base de acesso e catalogo hierarquico read-only da nova tela admin de configuracao de chamados
> Parent document: `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`
> Base document: `BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`

## 1. Problem Statement

A Fase 2E precisa de uma superficie administrativa nova e segregada da tela legada, mas ainda nao existe a base de permissao, rota, shell e leitura hierarquica para sustentar os proximos cortes de edicao e publicacao.

---

## 2. Users

### 2.1. Admin de configuracao de chamados v2

Pain points:

- nao tem uma rota oficial para acessar a configuracao de chamados v2;
- nao consegue navegar por `workflowAreas`, `workflowTypes_v2` e versoes em uma unica arvore administrativa;
- depende da tela legada ou de operacao manual para inspecionar configuracoes publicadas.

### 2.2. Super admin / governanca

Pain points:

- precisa liberar a nova superficie com gate proprio, sem herdar implicitamente `canManageWorkflows`;
- precisa expor a nova permissao na administracao de colaboradores;
- precisa manter convivencia segura entre tela legada e tela nova.

### 2.3. Operacao / owners

Pain points:

- precisam consultar rapidamente area, tipo, owner e versao ativa sem cair num editor;
- precisam de uma visao read-only inicial para validar rollout antes das fases de escrita;
- precisam de uma hierarquia consistente para servir de base aos fluxos de criacao e edicao.

---

## 3. Goals

### MUST

- criar uma nova permissao administrativa `canManageWorkflowsV2`;
- proteger a nova rota apenas com `canManageWorkflowsV2`, sem substituir o gate legado `canManageWorkflows`;
- adicionar entrada propria de navegacao para a nova tela admin, mantendo `/admin/workflows` intacta;
- entregar o shell inicial da tela com subabas:
  - `Definicoes`
  - `Historico Geral`
- implementar a subaba `Definicoes` como catalogo hierarquico read-only com niveis:
  - area
  - workflow type
  - versao
- ler dados de `workflowAreas` como colecao propria de agrupamento;
- ocultar `storageFolderPath` da UI, ainda que ele continue persistido na colecao;
- exibir `workflowTypeId` e `versionId` apenas como informacao derivada/tecnica quando necessario, nunca como campos editaveis;
- destacar a versao ativa/publicada atual do tipo na listagem;
- tratar como estado valido de catalogo o tipo que ainda nao possui versao publicada, exibindo-o como rascunho inicial / sem publicada ainda;
- deixar a subaba `Historico Geral` apenas como placeholder navegavel ou estado nao implementado, sem assumir seu escopo funcional nesta subetapa.

### SHOULD

- mostrar contadores agregados por area e por tipo;
- mostrar owner e status derivado de versao na arvore principal;
- prever acoes de CTA desabilitadas ou placeholders para recursos que entram nas subetapas seguintes, sem implementa-los ainda.

### COULD

- oferecer painel lateral ou sheet read-only para resumo do tipo ou da versao;
- incluir badges de origem do dado quando isso ajudar a distinguir leitura de tipo vs versao.

### WON'T

- nao criar area, workflow type ou versao nesta subetapa;
- nao editar rascunho;
- nao publicar, ativar ou inativar versoes;
- nao implementar o grid unificado de historico nesta subetapa;
- nao alterar runtime de solicitacoes.

---

## 4. Success Criteria

- usuarios sem `canManageWorkflowsV2` nao acessam a nova rota admin;
- usuarios com `canManageWorkflows` e sem `canManageWorkflowsV2` continuam acessando apenas a tela legada;
- a tela nova lista `workflowAreas` e `workflowTypes_v2` em hierarquia navegavel read-only;
- a UI nao expoe `storageFolderPath` como coluna nem como campo editavel;
- o shell da tela ja deixa claro o particionamento entre `Definicoes` e `Historico Geral`;
- o catalogo consegue mostrar ao menos:
  - nome da area
  - nome do tipo
  - owner
  - versao ativa ou ultima publicada
  - estado derivado de UI (`Rascunho`, `Publicada`, `Inativa`) quando aplicavel;
- quando o tipo existir apenas com `v1 draft`, o catalogo consegue sinalizar claramente que ainda nao ha versao publicada;
- o define fica suficiente para um design sem reabrir decisao de produto.

### Clarity Score

`15/15`

Motivo:

- o objetivo e estritamente estrutural e de leitura;
- as dependencias de produto ja estao fechadas no define-mae;
- o corte e independente e prepara claramente as subetapas seguintes.

---

## 5. Technical Scope

### Frontend

- nova rota admin dedicada ao configurador v2;
- nova entrada de menu/admin para essa rota;
- guard de permissao especifico baseado em `canManageWorkflowsV2`;
- shell com tabs/subtabs e estado inicial de carregamento/erro/vazio;
- catalogo read-only com expansao por area, tipo e versao.

### Backend / Read Models

- leitura administrativa de `workflowAreas`;
- leitura administrativa de `workflowTypes_v2`;
- leitura de versoes por tipo para compor a hierarquia;
- derivacao de estado visual:
  - `Rascunho`
  - `Publicada`
  - `Inativa`

### Database / Firestore

- consumo somente leitura de:
  - `workflowAreas`
  - `workflowTypes_v2/{workflowTypeId}`
  - `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- nenhuma mudanca de schema obrigatoria.

### Auth

- extensao do modelo de colaborador para incluir `canManageWorkflowsV2`;
- extensao da tela de permissoes para administrar a nova flag;
- a nova rota depende da permissao nova; a legada continua com a permissao antiga.

### AI

- fora do escopo.

### Testing

- testes de navegacao e gate da nova rota;
- testes da exibicao condicional do item de menu;
- testes de leitura do catalogo com area sem tipos, tipo com varias versoes e ausencia de dados;
- testes de derivacao de estado visual de versao.

---

## 6. Auth Requirements

- a autenticacao continua baseada no fluxo atual da plataforma;
- a autorizacao da nova tela deve checar `canManageWorkflowsV2` no servidor e na UI correspondente;
- a visualizacao de dados deve respeitar o usuario autenticado e nao depender apenas de ocultacao visual;
- nenhuma permissao nova deve expandir acesso ao legado por efeito colateral.

---

## 7. Out of Scope

- formularios de criacao de area;
- criacao de workflow type;
- editor de versao/rascunho;
- publicacao, ativacao e invariantes transacionais;
- historico geral funcional.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md` | Internal | Ready |
| `BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md` | Internal | Ready |
| Modelo `workflowAreas` + `workflowTypes_v2` + `versions/{n}` consolidado nas fases anteriores | Internal | Ready |
| Estrutura atual de permissao em colaboradores e menu admin | Internal | Ready |

---

## 9. Next Step

Produzir `DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md` detalhando:

- slug final da rota;
- composicao do shell e da navegacao;
- contratos de leitura do catalogo;
- pontos de extensao para as subetapas `2E.2`, `2E.3` e `2E.4`.

---

## 10. Revision History

| Date | Author | Summary |
|------|--------|---------|
| 2026-04-08 | Codex | Recorte do define-mae da Fase 2E para a subetapa 2E.1 |
