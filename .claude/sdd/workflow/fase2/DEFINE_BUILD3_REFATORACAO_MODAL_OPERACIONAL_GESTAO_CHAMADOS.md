# DEFINE: Build 3 - Refatoracao do modal operacional de gestao de chamados

> Generated: 2026-04-17
> Status: Approved for design
> Scope: Fase 2 / Build 3 - polimento operacional, estados transitorios e testes de confianca do modal em `/gestao-de-chamados`
> Base document: `BRAINSTORM_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Depends on: `DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DEFINE_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DESIGN_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `BUILD_REPORT_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

## 1. Problem Statement

Apos os Builds 1 e 2 corrigirem o contrato funcional e a hierarquia visual do detalhe oficial, o modal operacional de `/gestao-de-chamados` entrou em fase de estabilizacao. Parte importante da matriz de prioridade visual ja foi coberta no Build 2, entao o Build 3 deve focar apenas nos gaps remanescentes: estados transitorios (`loading`/`disabled`), cenarios terminais ainda nao blindados, wiring de integracao que ainda merece prova automatizada e o smoke responsivo manual que ficou pendente no report do Build 2.

---

## 2. Users

### 2.1. Owner do workflow

Pain points:

- precisa confiar que o modal continuara refletindo corretamente quando deve solicitar action, avancar, finalizar ou apenas acompanhar;
- depende de copy operacional coerente para entender se esta em estado de continuidade, conclusao ou apenas leitura;
- sofre regressao diretamente quando um CTA permanece habilitado durante mutation em andamento ou quando a UI comunica prioridade incorreta.

### 2.2. Responsavel atual do chamado

Pain points:

- precisa de feedback explicito durante `advance`, `finalize` e `requestAction`, para nao acionar o mesmo comando mais de uma vez;
- depende de disable states previsiveis para nao interpretar um estado transitorio como falha do modal;
- precisa que os cenarios de "action concluida aguardando advance" e "pronto para concluir" permaneçam claros apos os ajustes do Build 2.

### 2.3. Destinatario de action pendente

Pain points:

- precisa ver a action oficial como unica prioridade do modal, inclusive durante envio em andamento;
- nao deve enxergar CTA operacional indevido enquanto esta em papel temporario de resposta;
- depende de copy e estados de bloqueio que deixem claro quando a resposta esta sendo enviada, quando foi concluida e quando o fluxo volta ao owner/responsavel.

### 2.4. Engenharia / QA / manutencao

Pain points:

- precisa de uma suite de testes que cubra a matriz oficial de papeis e estados descrita no brainstorm, sem depender apenas de verificacao manual;
- precisa consolidar os refinamentos de copy e feedback sem reabrir regras de runtime ja fechadas nos Builds 1 e 2;
- ainda possui um smoke manual responsivo pendente no report do Build 2, o que deixa uma lacuna de confianca antes de considerar o pacote estabilizado.

---

## 3. Goals

### MUST

- fechar apenas os gaps remanescentes da matriz oficial apos o Build 2, preservando como baseline o que ja esta coberto em:
  - `request-detail-view-model.test.ts`;
  - `RequestActionCard.test.tsx`;
  - `RequestDetailDialog.test.tsx`;
- ampliar a cobertura automatizada do modal oficial para os cenarios que continuam em aberto:
  - request `archived` apenas em leitura;
  - disable states durante `advance`, `finalize`, `requestAction`, `respondAction`, `archive` e atribuicao/reatribuicao;
  - wiring de integracao em `WorkflowManagementPage` para refresh, persistencia/fechamento do dialog e handlers oficiais;
  - reforco de cenarios terminais e transitorios que ainda nao tenham prova automatizada explicita;
- validar e refinar a copy operacional do modal para que cada estado oficial comunique:
  - quem deve agir agora;
  - qual e o proximo passo;
  - quando nao existe acao operacional imediata;
  - quando o chamado esta pronto para conclusao ou ja concluido;
- explicitar e testar os disable states das acoes oficiais do modal:
  - `Avancar etapa` desabilitado enquanto a mutation de `advance` estiver pendente;
  - `Finalizar chamado` desabilitado enquanto a mutation de `finalize` estiver pendente;
  - `Solicitar action` e `Responder action` desabilitados durante submissao em andamento;
  - `Arquivar` e atribuicao/reatribuicao sem dupla submissao durante operacao pendente;
- garantir que o Build 3 preserve integralmente os contratos funcionais fechados no Build 1 e a hierarquia visual estabelecida no Build 2;
- cobrir o modal em nivel de componente e integracao suficiente para provar:
  - prioridade correta do CTA principal;
  - ausencia de CTA indevido por papel;
  - feedback coerente em estados de loading e disable;
  - ausencia de duplicacao de CTA principal entre corpo e footer;
- fechar a lacuna operacional deixada no Build 2 com um checklist de validacao manual responsiva registrado no artefato final deste proprio Build 3.

### SHOULD

- ampliar a suite do view model operacional apenas onde ainda houver lacuna real de tons, copy ou estados terminais/transitorios nao cobertos pelo Build 2;
- padronizar mensagens de loading, disabled e estado concluido entre hero operacional, action card e painel administrativo;
- fortalecer os testes de integracao da pagina de gestao para validar wiring de mutation, refresh e persistencia/fechamento do dialog nos fluxos principais;
- introduzir builders/fixtures de detalhe oficial mais reutilizaveis nos testes, se isso reduzir duplicacao e melhorar legibilidade da matriz de cenarios;
- registrar explicitamente os cenarios manuais minimos que precisam ser revisitados em navegador real no build report do Build 3.

### COULD

- ajustar microcopy de feedback transitorio, como labels de botoes em andamento ou textos de apoio de estado concluido, desde que sem alterar a semantica operacional;
- tornar mais evidente no estado `read-only` quando o usuario esta apenas acompanhando o chamado e nao ha acao oficial disponivel;
- adicionar pequenas melhorias de acessibilidade textual nos testes e nos componentes, como assertions de `disabled` e nomes acessiveis mais especificos.

### WON'T

- nao reabrir regras de negocio de `advance`, `finalize`, `requestAction`, `respondAction` ou `archive`;
- nao redesenhar novamente o shell visual consolidado no Build 2;
- nao criar nova rota, novo endpoint, novo contrato de detalhe ou nova categoria de status;
- nao transformar este build em uma iniciativa ampla de E2E browser automation caso a infraestrutura atual do repositorio nao a utilize;
- nao alterar listas, filtros, requester, `/me/tasks`, historico admin ou configuracao de workflows;
- nao introduzir migracao de schema, reprocessamento de dados ou mudanca estrutural no runtime.

---

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|----------------|
| Gaps remanescentes da matriz fechados | Todos os cenarios ainda nao blindados apos o Build 2 possuem cobertura automatizada direta no modal, no view model ou na pagina | Suites Jest/RTL dirigidas e comparacao com o baseline do Build 2 |
| Disable states confiaveis | Nenhum CTA oficial relevante aceita dupla submissao durante mutation pendente | Testes de componente/integracao com assertions de `disabled` e handlers |
| Copy operacional coerente | Hero, action e administracao comunicam corretamente quem age agora e o proximo passo em cada estado | Testes de renderizacao + validacao manual dirigida |
| Estado final sem regressao | Requests `finalized` ou `archived` nao exibem CTA operacional indevido e mantem apenas as acoes autorizadas | Testes de componente por estado terminal |
| Prioridade visual preservada | `respondAction`, `advance`, `finalize` e `requestAction` continuam respeitando a hierarquia do Build 2 | Testes de dialog + view model |
| Footer segue secundario | Nenhum CTA principal volta a depender do footer; o fechamento continua isolado | Teste estrutural do dialog |
| Smoke responsivo fechado | O modal e validado manualmente em `1440x900`, `1280x720` e `390x844` para os cenarios principais | Checklist manual registrado no `BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` |

---

## 5. Technical Scope

### Frontend

- revisar [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) para garantir copy final, renderizacao condicional estavel e feedback coerente de loading/disabled nos cenarios oficiais;
- revisar [RequestOperationalHero.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestOperationalHero.tsx) para consolidar mensagens e estados transitorios do CTA principal;
- revisar [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx) para polir copy, disabled states e feedback de `requestAction`/`respondAction` sem alterar o contrato funcional;
- revisar [RequestAdministrativePanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestAdministrativePanel.tsx) para garantir que atribuicao e arquivamento tenham estados de bloqueio coerentes e nao concorram com o fluxo principal;
- ajustar, se necessario, [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) apenas para reforcar wiring, refresh e comportamento do dialog durante mutations oficiais.

### View Model / Presentation

- ampliar ou refinar [request-detail-view-model.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/request-detail-view-model.ts) como fonte de copy e prioridade visual do modal, sem criar novas permissoes nem inferencias locais de elegibilidade;
- manter o view model como camada somente de apresentacao, derivada do payload oficial de detalhe.

### Read Side / Contract

- nenhuma mudanca deliberada de contrato em [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts) ou nos tipos do detalhe;
- o Build 3 consome o payload oficial existente de `summary`, `permissions`, `action`, `progress`, `timeline`, `formData` e `attachments`;
- eventuais ajustes nesta camada so entram se forem necessarios para alinhar testes a um contrato ja aprovado, e nao para introduzir regra nova.

### Backend / Runtime

- nenhuma mudanca funcional planejada em endpoints, use cases, authz ou engine;
- o foco do build e confianca do modal oficial, nao nova logica de runtime.

### Database / Firestore

- nenhuma mudanca de schema, colecao, documento, indice ou migracao.

### AI

- fora do escopo.

### Testing

- tratar como baseline ja coberto pelo Build 2:
  - prioridade visual de `respondAction`, `advance`, `finalize` e `requestAction`;
  - caso sem action operacional;
  - renderizacao estrutural das zonas do dialog;
- expandir [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx) para cobrir estados terminais ainda nao fechados, disable states relevantes e ausencia/presenca correta dos CTAs durante mutacoes;
- expandir [RequestActionCard.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestActionCard.test.tsx) para validar disable states, submissao em andamento e copy operacional da action;
- expandir [WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) para reforcar integracao de mutations, refresh e permanencia/fechamento do modal;
- expandir [request-detail-view-model.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/__tests__/request-detail-view-model.test.ts) apenas nos tons, mensagens e estados terminais/transitorios ainda nao cobertos;
- reutilizar ou ajustar [detail.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/detail.test.js) apenas se isso ajudar a manter fixtures oficiais consistentes com os cenarios consumidos pela UI;
- validar no minimo:
  - owner com `canRequestAction` em submissao pendente;
  - owner ou responsavel com `canAdvance` em submissao pendente;
  - owner ou responsavel com `canFinalize` em submissao pendente;
  - destinatario com `canRespondAction` em submissao pendente;
  - request `finalized` com `canArchive`;
  - request `archived` apenas em leitura;
  - loading state de `advance`, `finalize`, `requestAction`, `respondAction` e `archive`.

---

## 6. Auth Requirements

- a autenticacao continua baseada em Firebase Auth e no fluxo oficial de gestao ja existente;
- nenhum ajuste de copy, disabled state ou teste pode ampliar leitura ou escrita para usuarios fora do contrato oficial do detalhe;
- o modal deve continuar refletindo isolamento por papel:
  - owner e responsavel atual operam apenas os CTAs autorizados pelo payload;
  - destinatario de action enxerga apenas a prioridade de resposta quando aplicavel;
  - usuarios sem permissao operacional permanecem em modo somente leitura;
- estados de loading/disabled nao podem expor bypass visual nem permitir dupla submissao em acoes autenticadas.

---

## 7. Out of Scope

- mudancas de regra em `advance`, `finalize`, `requestAction`, `respondAction`, `archive` ou atribuicao;
- redesign adicional do modal alem de refinamentos pontuais de copy e feedback;
- alteracoes na pagina inteira de `/gestao-de-chamados`, em listas, filtros ou tabs;
- mudancas em requester, `/me/tasks`, historico admin ou configurador de workflows;
- criacao de nova infraestrutura de E2E end-to-end como requisito obrigatorio deste build;
- mudancas de backend, schema, migracoes ou contratos de API.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `DESIGN_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `BUILD_REPORT_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready with pending responsive smoke |
| Infra atual de testes com Jest + React Testing Library | Internal | Ready |
| Baseline de `typecheck` global do repositorio | Internal | Known external noise |

---

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|-------------|-------|
| Problem clarity | 3 | O Build 3 esta delimitado como estabilizacao do modal apos contratos e shell ja entregues nos Builds 1 e 2 |
| User identification | 3 | Owner, responsavel, destinatario de action e manutencao/QA possuem dores especificas e observaveis |
| Success criteria measurability | 3 | Os criterios se traduzem em matriz de testes, assertions de `disabled`, ausencia de CTA indevido e smoke responsivo verificavel |
| Technical scope definition | 3 | O escopo esta concentrado em componentes, view model e suites reais do modal oficial, com backend explicitamente fora |
| Edge cases considered | 3 | Foram cobertos estados sem acao, action pendente, action concluida, finalize, finalized, archived e loading transitorio |
| **TOTAL** | **15/15** | Ready for /design |

---

## 10. Next Step

Ready for `/design BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS` para detalhar:

- inventario final dos gaps remanescentes apos o baseline do Build 2;
- matriz final de testes por papel e por estado apenas para os cenarios ainda em aberto;
- estrategia de copy e feedback transitorio no hero, action card e painel administrativo;
- comportamento exato de `disabled` e loading para cada mutation oficial;
- checklist manual responsivo e criterios de fechamento registrados no build report do proprio Build 3.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-04-17 | Codex (`iterate` skill) | Narrowed Build 3 to post-Build-2 real gaps, clarified baseline coverage already delivered, and fixed the responsive smoke acceptance to be recorded in the Build 3 report |
| 1.0 | 2026-04-17 | Codex (`define` skill) | Initial define for Build 3 of the operational management modal refactor based on the approved brainstorm and completed Builds 1 and 2 |
