# DEFINE: Ajustes UI/UX operacionais em `/gestao-de-chamados`

> Generated: 2026-04-16
> Status: Ready for /design
> Scope: Ajustes de frontend/UI para melhorar hierarquia visual, leitura operacional e densidade de informacao em `/gestao-de-chamados`
> Parent document: `BRAINSTORM_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md`
> Clarity Score: 14/15

## 1. Problem Statement

A rota `/gestao-de-chamados` funciona como central operacional unificada, mas ainda apresenta uma hierarquia visual ruidosa no topo da tela e uma composicao de `Atribuicoes e acoes` que dificulta a leitura simultanea das filas mais importantes para owners e executores.

---

## 2. Users

### 2.1. Owners e executores em operacao diaria

Pain points:

- encontram tabs principais com aparencia mais proxima de toolbar do que de navegacao canônica de pagina;
- veem o botao de filtro competindo visualmente com a navegacao principal;
- recebem um bloco explicativo sobre ownership que ocupa espaco sem ajudar na operacao;
- precisam alternar entre subtabs em `Atribuicoes e acoes` para enxergar duas filas que, operacionalmente, deveriam ser consultadas em paralelo;
- perdem fluidez ao comparar `Atribuidos a mim` com `Acoes pendentes para mim`.

Frequencia:

- recorrente, no uso diario da fila operacional.

### 2.2. Produto / UX

Pain points:

- a rota ainda nao conversa plenamente com o padrao visual do restante do app;
- a principal tela operacional de workflows V2 ainda nao comunica prioridade e leitura de filas com a clareza desejada.

Frequencia:

- pontual nesta rodada, mas com impacto recorrente na experiencia final.

### 2.3. Engenharia frontend

Pain points:

- precisa corrigir a superficie preservando URL state, queries e contratos atuais;
- precisa melhorar a UX sem abrir refatoracao ampla de runtime ou de search params.

Frequencia:

- pontual nesta etapa.

---

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | As tabs principais da rota devem seguir o padrao canônico do app | `TabsList` ocupa a largura util disponivel, distribui as tabs visiveis de forma igualitaria e deixa de parecer uma toolbar compacta |
| M2 | O filtro deve sair da linha de navegacao principal | `ManagementToolbar` deixa de dividir hierarquia com as tabs e passa a ocupar a camada de conteudo abaixo da navegacao |
| M3 | O aviso textual sobre ownership deve ser removido | A caixa com a mensagem `A aba Chamados atuais exige ownership explicito...` deixa de ser renderizada |
| M4 | `Atribuicoes e acoes` deve deixar de depender de subtabs visiveis | `Atribuidos a mim` e `Acoes pendentes para mim` passam a ser exibidos simultaneamente como duas secoes visiveis na mesma tela |
| M5 | A nova composicao de `Atribuicoes e acoes` deve seguir o padrao de seções de `/me/tasks` | Cada fila passa a ter titulo, descricao, conteudo e empty state proprio em composicao independente, sem tabs internas |
| M6 | A URL deve ser preservada sem regressao de navegacao | `tab`, `subtab`, `queue` e filtros existentes continuam parseados/serializados; `subtab` pode permanecer por compatibilidade mesmo sem controlar a UI visivel |
| M7 | O pacote deve permanecer estritamente em frontend/UI | Nenhuma mudanca de backend, hooks de dados, contratos de API, permissoes ou runtime entra nesta rodada |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | O filtro continua sendo o mesmo filtro global da rota | A mudanca e de hierarquia/posicionamento visual; filtros continuam afetando a tela da mesma forma que hoje |
| S2 | Cada secao de `Atribuicoes e acoes` deve comunicar seu proprio estado vazio com mais clareza | Empty states de `Atribuidos a mim` e `Acoes pendentes para mim` ficam distintos e adequados ao contexto operacional |
| S3 | Os estados de loading/erro das duas filas devem continuar inteligiveis apos a separacao visual | O usuario entende claramente quando a tela esta carregando ou falhou, sem perder a leitura das duas filas |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Extrair um bloco/seção operacional reutilizavel se isso vier quase de graca | Caso a implementacao precise de um wrapper comum para as duas filas, ele pode ser extraido sem ampliar escopo |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Alterar backend, queries ou contratos dos endpoints de management | Fora do objetivo deste pacote, que e estritamente visual |
| W2 | Alterar regras de permissao, ownership ou visibilidade de tabs | Fora de escopo e de alto risco funcional |
| W3 | Remover parametros de URL existentes por limpeza interna | `subtab` e demais parametros permanecem por compatibilidade |
| W4 | Reestruturar amplamente `Chamados atuais` ou `Concluidas` alem do alinhamento visual necessario | O pedido atual esta concentrado no topo da rota e em `Atribuicoes e acoes` |
| W5 | Criar rotas novas, anchors ou navegar para outra superficie | A rota continua sendo apenas `/gestao-de-chamados` |

---

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Tabs principais com hierarquia canonica | 100% das tabs visiveis ocupam largura total e se distribuem igualmente | Inspecao visual + teste de componente |
| Filtro desacoplado da navegacao | Botao/toolbar de filtros nao compartilha a mesma linha hierarquica das tabs principais | Inspecao visual + teste de estrutura/render |
| Aviso de ownership removido | 0 ocorrencias da caixa textual antiga | Busca no DOM renderizado + teste de componente |
| Duas filas simultaneas em `Atribuicoes e acoes` | `Atribuidos a mim` e `Acoes pendentes para mim` aparecem juntas na mesma renderizacao | Inspecao visual + teste de componente |
| URL state preservado | Navegacao continua aceitando `tab`, `subtab`, `queue` e filtros sem quebrar parsing/serializacao | Teste de integracao/componente da pagina |
| Empty states separados e claros | Cada fila possui copy de vazio propria e coerente com o contexto | Teste de componente + validacao visual |

---

## 5. Technical Scope

### Backend / API

| Component | Change Type | Details |
|-----------|------------|---------|
| APIs de management | None | Nenhuma alteracao |
| Runtime / hooks / queries | None | Nenhuma alteracao deliberada de dados |
| Search params contract | Preserve | Contrato atual e preservado; apenas o uso visual de `subtab` deixa de ser central |

### Frontend

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/management/WorkflowManagementPage.tsx` | Modify | Ajustar o shell superior, tornar `TabsList` full-width com distribuicao igualitaria, mover `ManagementToolbar` para a camada de conteudo e remover o aviso textual de ownership |
| `src/components/workflows/management/AssignmentsPanel.tsx` | Modify | Remover subtabs visiveis e renderizar as duas filas como seções simultaneas, inspiradas no padrao visual de `/me/tasks` |
| `src/components/workflows/management/ManagementToolbar.tsx` | Reuse / minor modify if needed | Manter o mesmo comportamento de filtro global, com eventual ajuste de encaixe visual no novo lugar |
| `src/components/workflows/management/ManagementAsyncState.tsx` | Reuse / minor modify if needed | Reaproveitar estados vazios/carregamento/erro nas duas secoes de assignments, sem mudar logica de dados |
| `src/components/workflows/management/ManagementRequestList.tsx` | Reuse | Continuar exibindo listas operacionais dentro das novas secoes |
| `src/lib/workflows/management/search-params.ts` | Preserve | Sem mudar contrato; `subtab` continua parseado/serializado por compatibilidade |

### Tests

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx` | Modify / Add | Cobrir tabs full-width, filtro fora da linha de navegacao e remocao do aviso textual |
| `src/components/workflows/management/__tests__/AssignmentsPanel.test.tsx` | Modify / Add | Cobrir renderizacao simultanea das duas filas e seus empty states separados |
| `src/lib/workflows/management/__tests__/search-params.test.ts` | Preserve / extend if needed | Garantir que `subtab` continua aceito/serializado mesmo sem controlar a UI visivel |

### Database

| Model | Change Type | Details |
|-------|------------|---------|
| N/A | None | Sem alteracao de dados |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Fora do escopo |

---

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A rota continua protegida pelo fluxo autenticado existente do grupo `(app)` |
| Authorization | Nenhum gate novo; a tela continua respeitando as permissoes ja aplicadas em `/gestao-de-chamados` |
| User Isolation | Nenhuma mudanca de isolamento de dados ou de visibilidade de requests |
| URL Safety | Preservar os parametros atuais evita quebrar links, bookmarks e navegacao interna existente |

---

## 7. Out of Scope

- alterar backend, runtime ou queries de management;
- alterar contratos dos endpoints ou shape dos dados carregados;
- mudar semantica dos filtros aplicados pela tela;
- repensar o painel `Concluidas` sem demanda explicita;
- reestruturar `Chamados atuais` alem do necessario para o shell superior;
- remover `subtab` ou outros search params existentes apenas por higiene interna;
- alterar comportamento de ownership/permissoes.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md` | Internal | Ready |
| `WorkflowManagementPage.tsx`, `AssignmentsPanel.tsx` e `ManagementToolbar.tsx` | Internal | Ready |
| Referencia visual de `/admin/request-config?tab=history` | Internal | Ready |
| Referencia visual de `/me/tasks` | Internal | Ready |

---

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | As friccoes visuais e operacionais estao concretas e observaveis na tela |
| User identification | 3 | Owners e executores diarios foram claramente identificados |
| Success criteria measurability | 2 | Medicao depende de testes de componente e validacao visual, mas segue objetiva |
| Technical scope definition | 3 | Escopo esta contido em poucos componentes de frontend e preserva backend/URL contract |
| Edge cases considered | 3 | Preservacao de URL, filtro global e empty/loading/error das filas foram considerados |
| **TOTAL** | **14/15** | >= 12 - pronto para /design |

---

## 10. Next Step

Ready for `/design AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL` para detalhar:

- layout exato das tabs principais em grid full-width;
- reposicionamento do `ManagementToolbar` sem alterar seu contrato de filtro global;
- pattern visual das duas secoes simultaneas em `Atribuicoes e acoes`;
- estrategia para manter `subtab` na URL sem que ele siga dirigindo a UI visivel;
- tratamento de loading, erro e empty state de cada fila na nova composicao;
- estrategia de testes para shell da pagina e painel de assignments.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex (`define` skill) | Requisitos estruturados para ajustes UI/UX operacionais em `/gestao-de-chamados` com preservacao de URL, filtro global e foco em visao simultanea de assignments |
