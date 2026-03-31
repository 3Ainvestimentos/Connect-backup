# DEFINE: FASE1_FACILITIES_ETAPA7

> Generated: 2026-03-31
> Status: Ready for design
> Source: ROADMAP_FASE1_FACILITIES.md + ROADMAP_ETAPAS_FASE1_FACILITIES.md + implementation_progress_fase1.md + DEFINE_FASE1_FACILITIES_ETAPA6.md + DEFINE_FASE1_FACILITIES_ETAPA6_1.md + implementacao atual do piloto `/pilot/facilities`
> Clarity Score: 14/15

## 1. Problem Statement

A Fase 1 precisa incluir `facilities_solicitacao_compras` na mesma UI multiworkflow de `/pilot/facilities` e consolidar a UX final do piloto para encerrar o recorte de Facilities sem depender do frontend legado.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Solicitante interno de Facilities | Precisa abrir `Solicitacao de Compras` na mesma UI ja validada para manutencao e suprimentos | Recorrente |
| Owner da area | Precisa operar os 3 workflows piloto na mesma superficie com leitura clara de filas, atribuicoes e concluidos | Diaria |
| Responsavel operacional | Precisa acompanhar chamados atribuidos e finalizados na mesma experiencia consolidada | Diaria |
| Time tecnico da Fase 1 | Precisa encerrar o piloto com evidencia de que a base suporta os 3 workflows definidos e ja sustenta a transicao para o frontend oficial | Pontual por etapa |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Habilitar `Solicitacao de Compras` na mesma rota do piloto | O usuario opera workflow 1, workflow 2 e workflow 3 em `/pilot/facilities`, sem rota dedicada para compras |
| M2 | Reaproveitar o formulario dinamico para workflow 3 | O catalogo publicado de `facilities_solicitacao_compras` dirige o formulario e o submit envia `workflowTypeId = facilities_solicitacao_compras` quando esse fluxo estiver selecionado |
| M3 | Suportar o campo `file` opcional do workflow 3 | O formulario de compras usa a mesma camada generica de upload apenas quando `anexos` estiver preenchido, sem exigir upload no submit vazio |
| M4 | Consolidar a UX operacional do piloto | A tela passa a apresentar de forma estavel os 3 workflows em `Chamados atuais`, `Atribuicoes e acoes`, `Concluidas` e `Minhas solicitacoes` |
| M5 | Expor concluidos na UI do piloto | A rota passa a consumir `GET /api/workflows/read/completed` e mostra historico agrupado por mes na mesma superficie do piloto |
| M6 | Refinar o detalhe de atribuicao | Apos a primeira atribuicao, o responsavel atual passa a aparecer apenas em modo leitura no detalhe; reatribuicao futura nao entra nesta etapa |
| M7 | Encerrar a Fase 1 sem regressao perceptivel | Workflow 1 e workflow 2 continuam funcionais na mesma base multiworkflow, sem reintroduzir dependencia do frontend legado |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Reduzir duplicacao do registry antes de crescer para o terceiro workflow | O registry local deixa de duplicar conhecimento critico de `workflowTypeId` e passa a derivar o conjunto suportado a partir de uma unica fonte |
| S2 | Reforcar identidade de workflow em toda a tela | Cards, tabs, dialog e cabecalho deixam clara a convivencia dos 3 workflows sem ambiguidades de label |
| S3 | Deixar a base pronta para avaliacao da camada cliente compartilhada | Ao final da etapa, fica claro se o piloto ja merece promover mais superficie cliente para o dominio de workflows |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Ajustar microcopy/rotulos da rota para refletir a consolidacao do piloto | A pagina pode passar de "Pilot de Facilities" para uma copy mais proxima da experiencia consolidada, sem ainda inaugurar o frontend oficial |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Criar o frontend oficial definitivo | Isso passa a ser a proxima frente apos o encerramento da Fase 1 |
| W2 | Exibir `formData` completo ou preview de anexos no dialog | O read-side atual nao expoe `formData`; qualquer enriquecimento disso fica para a fase seguinte |
| W3 | Criar novos endpoints read-side alem de consumir `completed` ja existente | A etapa deve reaproveitar a infraestrutura atual do motor v2 |
| W4 | Reabrir o desenho da infraestrutura de upload | A etapa apenas consome a camada generica validada nas Etapas 5 e 5.1 |
| W5 | Modelar reatribuicao como acao completa | Nesta etapa o ajuste e apenas esconder o seletor apos a primeira atribuicao; reatribuicao formal fica para frente |

## 4. Decisoes Fechadas

### 4.1. Workflow alvo da etapa

| Item | Valor fechado |
|------|----------------|
| Workflow 1 preservado | `facilities_manutencao_solicitacoes_gerais` |
| Workflow 2 preservado | `facilities_solicitacao_suprimentos` |
| Workflow 3 habilitado | `facilities_solicitacao_compras` |
| Campo novo critico | `anexos` (`file`, opcional) |
| Superficie | mesma rota `/pilot/facilities` |

### 4.2. Escopo da consolidacao da UX

Fica fechado que a Etapa 7:

- reutiliza a mesma base de frontend do piloto;
- nao cria uma segunda interface paralela;
- adiciona a aba `Concluidas` na mesma superficie;
- consolida os ajustes finais de navegacao e atribuição suficientes para encerrar a Fase 1.

### 4.3. Reuso da infraestrutura existente

Fica fechado que a etapa consome:

- a camada generica de upload em `src/lib/workflows/upload/*`;
- os endpoints read-side globais ja existentes:
  - `GET /api/workflows/read/current`
  - `GET /api/workflows/read/assignments`
  - `GET /api/workflows/read/completed`
  - `GET /api/workflows/read/mine`
- o runtime atual para:
  - abrir
  - atribuir
  - finalizar
  - arquivar

### 4.4. Comportamento do campo `file` em compras

Fica fechado que o campo `anexos` de `facilities_solicitacao_compras`:

- usa a mesma infraestrutura generica de upload;
- so dispara upload quando houver `File` selecionado;
- nao bloqueia o submit quando estiver vazio, pois e opcional no catalogo atual.

### 4.5. Consolidacao da atribuicao

Fica fechado que, apos a primeira atribuicao:

- o dialog deixa de exibir o seletor de responsavel como acao permanente;
- o responsavel atual aparece em modo leitura;
- a etapa nao modela ainda um botao explicito de `Reatribuir`.

### 4.6. Fechamento da Fase 1

Fica fechado que a Etapa 7 encerra a Fase 1 quando:

- os 3 workflows piloto estiverem rodando ponta a ponta na mesma superficie;
- a UX do piloto estiver consolidada o suficiente para nao depender de uma Etapa 8;
- a base estiver pronta para iniciar o frontend oficial e a expansao para os demais `workflowTypes`.

## 5. Success Criteria

- o usuario autenticado consegue alternar a rota entre os 3 workflows piloto;
- `Solicitacao de Compras` abre request com sucesso na mesma UI;
- o campo `anexos` opcional funciona quando preenchido e nao bloqueia quando vazio;
- `Chamados atuais`, `Atribuicoes e acoes`, `Concluidas` e `Minhas solicitacoes` convivem corretamente com os 3 workflows;
- o dialog deixa de sugerir atribuicao permanente apos existir responsavel;
- o piloto permanece isolado do frontend legado;
- a Fase 1 fica pronta para transicao ao frontend oficial.

## 6. Technical Scope

### Frontend

- expandir o registry local para o terceiro workflow;
- ajustar a pagina e o hook para operar 3 workflows e incluir a aba `Concluidas`;
- consumir `read/completed` na camada cliente do piloto;
- integrar o workflow 3 ao formulario dinamico, incluindo `file` opcional;
- consolidar o dialog operacional para modo leitura apos atribuicao;
- reforcar labels e identidade de workflow em toda a superficie.

### Backend

- fora do escopo de novas capacidades centrais;
- apenas consumo do que ja existe:
  - catalog
  - read-side
  - runtime
  - upload init

### Database / Storage

- nenhuma mudanca de schema em Firestore;
- nenhuma mudanca de indices como requisito novo da etapa;
- nenhum redesign do path de anexos;
- nenhum novo modelo de persistencia para `formData`.

## 7. Auth Requirements

- a UI continua usando o Firebase ID token do usuario autenticado;
- toda chamada para catalog, read-side, runtime e upload init continua usando `Authorization: Bearer <token>`;
- a ergonomia de mostrar/esconder acoes na UI continua sendo complementar; a permissao real permanece no backend.

## 8. Out of Scope

- frontend oficial definitivo;
- preview de anexos no dialog;
- reatribuicao completa de responsavel;
- novos tipos de campo alem dos ja usados no piloto;
- consolidacao total de toda a camada `pilot/*` em modulo compartilhado.

## 9. Criterio de Aceite da Etapa

A Etapa 7 sera considerada concluida quando a rota `/pilot/facilities` conseguir operar, na mesma superficie, `facilities_manutencao_solicitacoes_gerais`, `facilities_solicitacao_suprimentos` e `facilities_solicitacao_compras`, incluindo consumo de concluidos, upload opcional de `anexos` no workflow 3, refinamento da UX de atribuicao e encerramento funcional da Fase 1 sem dependencia do frontend legado.

## 10. Revision History

| Date | Impact | Summary |
|------|--------|---------|
| `2026-03-31` | `High` | criacao do define da Etapa 7 para incluir `Solicitacao de Compras`, consumir concluidos e consolidar a UX final do piloto antes do frontend oficial |
