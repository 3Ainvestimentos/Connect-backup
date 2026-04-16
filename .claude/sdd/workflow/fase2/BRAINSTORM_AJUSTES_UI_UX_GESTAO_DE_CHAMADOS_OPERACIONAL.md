# Brainstorm: Ajustes UI/UX operacionais em `/gestao-de-chamados`

Date: 2026-04-16
Owner: Codex
Status: Approved for next `DEFINE`

---

## 1. Contexto

Escopo restrito a ajustes de experiencia operacional na rota:

- `/gestao-de-chamados`

Perfil priorizado:

- operacao do dia a dia de owners + executores

Sem impacto deliberado em:

- backend/runtime de workflows
- contratos de API
- regras de permissao
- navegacao da rota
- estado e semantica da URL

Referencias canonicas aprovadas:

- shell de tabs de `/admin/request-config?tab=history`
- organizacao em secoes de `/me/tasks`
- linguagem visual atual da propria rota `/gestao-de-chamados`

---

## 2. Problema

A rota `/gestao-de-chamados` ja cumpre a funcao de central operacional unificada, mas a composicao atual ainda cria friccao de leitura para quem usa a tela no dia a dia.

As divergencias principais identificadas foram:

- as tabs/subtabs nao seguem integralmente o padrao visual do restante da aplicacao;
- a barra superior de tabs nao ocupa a largura total com distribuicao igualitaria entre opcoes visiveis;
- o botao de filtro nao esta claramente desacoplado da navegacao da tela;
- existe um bloco textual de aviso sobre ownership que polui a superficie principal sem agregar valor operacional;
- dentro de `Atribuicoes e acoes`, a separacao entre `Atribuidos a mim` e `Acoes pendentes para mim` depende de subtabs, quando o fluxo operacional pede visao simultanea das duas filas;
- o padrao visual desejado para essas duas filas ja existe em `/me/tasks`, com duas secoes independentes e estados vazios mais claros.

Em resumo: a pagina funciona, mas ainda nao comunica a operacao com a mesma clareza visual do restante do app.

---

## 3. Perguntas Respondidas

### Q1. Quem vai usar?

- owners e executores em uso operacional diario

### Q2. A mudanca pode afetar navegacao ou URL?

- nao
- a mudanca deve acontecer somente dentro da rota existente `/gestao-de-chamados`
- `tab`, `subtab`, `queue` e demais estados de URL devem ser preservados

### Q3. Isso envolve frontend, backend ou full stack?

- somente frontend/UI

---

## 4. Codigo Atual Relevante

Superficies lidas para ancorar o brainstorm:

- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [AssignmentsPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/AssignmentsPanel.tsx)
- [CurrentQueuePanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CurrentQueuePanel.tsx)
- [CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx)
- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx)
- [constants.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/constants.ts)
- [search-params.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/search-params.ts)
- [WorkflowConfigPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigPage.tsx)
- [WorkflowConfigHistoryTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx)
- [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx)

Leitura do estado atual:

- `WorkflowManagementPage` ja tem tabs principais, toolbar de filtros, chips ativos e URL state estabilizado;
- o shell principal usa `TabsList` com largura automatica e layout mais proximo de toolbar do que de tabs paginais;
- o aviso `Chamados atuais exige ownership explicito...` aparece como caixa destacada abaixo das tabs;
- `AssignmentsPanel` ainda renderiza duas subtabs internas (`Atribuidos a mim` e `Acoes pendentes para mim`);
- `CurrentQueuePanel` concentra titulo, descricao e filtro local de fila dentro do proprio card;
- `/admin/request-config` ja usa `TabsList` em `grid w-full`, servindo de referencia valida para distribuicao igualitaria;
- `/me/tasks` ja materializa o padrao desejado para filas paralelas: duas secoes empilhadas com titulo, descricao, conteudo e empty state tracejado com `Inbox`.

---

## 5. Ajustes Solicitados

### 5.1. Shell superior da rota

- as tabs devem seguir o padrao do resto da aplicacao;
- devem ocupar toda a largura da pagina;
- devem se distribuir de forma igualitaria conforme o numero de tabs visiveis;
- o botao de `Filtros` deve ficar abaixo, na secao de conteudo, e nao disputando hierarquia com a navegacao principal.

### 5.2. Limpeza visual

- remover a secao textual:
  - `A aba Chamados atuais exige ownership explicito. Seu perfil continua com acesso operacional a Atribuicoes e acoes e Concluidas.`

### 5.3. Reestruturacao de `Atribuicoes e acoes`

- parar de tratar `Atribuidos a mim` e `Acoes pendentes para mim` como subtabs internas;
- exibir as duas filas como secoes visiveis na mesma pagina;
- copiar a logica de organizacao visual de `/me/tasks`;
- manter o emoji/icone de caixa vazia no estado sem dados;
- adaptar os textos internos de empty state ao contexto atual da feature pos-refatoracao.

---

## 6. Abordagens

### Abordagem A — Patch cirurgico de composicao visual

O que faz:

- ajusta o `TabsList` da rota para um grid full-width com distribuicao igualitaria entre tabs visiveis;
- move o `ManagementToolbar` para a camada de conteudo, abaixo da navegacao;
- remove o aviso textual de ownership;
- substitui as subtabs internas de `AssignmentsPanel` por duas secoes renderizadas na mesma pagina, reutilizando o padrao visual de `/me/tasks`;
- preserva os estados de URL atuais, mesmo que `subtab` deixe de influenciar a UI.

Pros:

- menor risco
- entrega rapida
- resolve exatamente os pontos levantados
- nao mexe em dados, hooks ou queries

Contras:

- pode deixar residuos de semantica antiga no estado da URL, como `subtab`, mesmo sem uso visual real
- mantem parte da modelagem de painel atual mais acoplada do que o ideal

Esforco:

- baixo para medio

Recomendacao:

- sim

### Abordagem B — Patch de UI com limpeza estrutural leve

O que faz:

- inclui tudo da abordagem A;
- simplifica a semantica de `Atribuicoes e acoes` no frontend, reduzindo a dependencia de `assignmentsSubtab` como conceito de tela;
- extrai um componente de secao operacional compartilhavel para alinhar `AssignmentsPanel` ao padrao de `/me/tasks`.

Pros:

- melhora manutencao futura
- reduz ambiguidades entre modelo visual e estado da tela
- deixa a implementacao mais coerente com a UX final desejada

Contras:

- exige mais toque estrutural em componentes e testes
- aumenta o risco de regressao em uma entrega que e essencialmente visual

Esforco:

- medio

Recomendacao:

- boa opcao se o pacote seguir imediatamente para implementacao com teste dirigido

### Abordagem C — Canonizacao ampla da rota operacional

O que faz:

- revisa o shell completo de `/gestao-de-chamados`, incluindo tabs, filtros, cards, secoes, textos de apoio e possivel harmonizacao visual entre `current`, `assignments` e `completed`.

Pros:

- maximiza consistencia visual de longo prazo
- cria uma base mais limpa para futuras evolucoes

Contras:

- escopo excessivo para o problema atual
- alto risco de abrir polimento demais sem necessidade
- foge do objetivo de resolver friccoes pontuais da operacao diaria

Esforco:

- alto

Recomendacao:

- descartar por YAGNI

---

## 7. YAGNI

Itens que nao valem entrar neste pacote:

- alterar backend
- alterar queries
- alterar contratos dos endpoints de management
- mudar regras de permissao ou visibilidade de tabs
- alterar semantica de filtros
- criar novas rotas ou anchors
- reescrever a experiencia de `Chamados atuais` alem do necessario para alinhamento visual
- repensar `Concluidas` sem demanda explicita
- remover parametros de URL existentes apenas por limpeza interna

O objetivo aqui e:

- corrigir hierarquia visual
- reduzir ruido
- melhorar leitura operacional

Nao e:

- reabrir arquitetura da feature

---

## 8. Recomendacao Final

Seguir com a **Abordagem A**, com uma pequena preferencia de higiene da **Abordagem B** apenas se isso vier quase de graca durante a implementacao.

Traduzindo em decisao pratica:

- manter a rota, URL e contratos exatamente como estao;
- tratar tabs principais como navegacao de pagina full-width;
- tratar filtro como controle do conteudo abaixo;
- transformar `Atribuicoes e acoes` em visao de duas secoes simultaneas;
- remover mensagens explicativas que substituem, em vez de reforcar, a clareza da interface.

---

## 9. Entendimento Consolidado

Se eu entendi corretamente, o pacote desejado e este:

- `/gestao-de-chamados` continua sendo a unica rota envolvida;
- a entrega e estritamente de frontend/UI;
- a navegacao e os parametros de URL atuais devem ser preservados;
- o topo da pagina precisa parecer uma navegacao canonica do app, e nao uma toolbar improvisada;
- `Atribuicoes e acoes` deve priorizar visao simultanea das duas filas operacionais, no padrao de `/me/tasks`;
- o foco e melhorar fluidez para owners e executores, nao adicionar novas capacidades.

---

## 10. Proximo Passo

Ready for `DEFINE`.

Sugestao de proximo artefato:

- `DEFINE_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md`

Foco esperado do define:

- aceitar criterios do shell de tabs full-width;
- reposicionamento exato do filtro;
- definicao das duas secoes em `Atribuicoes e acoes`;
- copy de empty states;
- impacto aceitavel de manter `subtab` na URL sem protagonismo visual;
- estrategia de validacao visual e regressao.
