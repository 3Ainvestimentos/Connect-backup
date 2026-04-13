# DEFINE: FASE1_FACILITIES_ETAPA4

> Generated: 2026-03-27
> Status: Ready for etapa 5.5
> Source: solicitação direta + ROADMAP_FASE1_FACILITIES.md + ROADMAP_ETAPAS_FASE1_FACILITIES.md + DEFINE_FASE1_FACILITIES_ETAPA3.md + REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md + MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md
> Clarity Score: 14/15

## 1. Problem Statement

O piloto precisa validar o primeiro workflow de Facilities ponta a ponta em uma UI nova e independente do legado, consumindo apenas o motor v2 e a rota de metadados publicados, sem hardcode estrutural do formulario nem dependencia de `WorkflowsContext`.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Solicitante interno | Precisa abrir e acompanhar um chamado real de Facilities no motor novo sem depender da UI legada | Recorrente |
| Owner da area | Precisa receber o chamado, visualizar a fila e atribuir um responsavel em uma superficie nova e controlada | Diária |
| Responsavel operacional | Precisa enxergar o item atribuido e concluir o fluxo ate finalizacao | Diária |
| Time tecnico da Fase 1 | Precisa validar a primeira UI real do piloto sem editar artefatos legados e sem quebrar a arquitetura versionada | Pontual por etapa |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Criar uma rota nova e independente para o piloto | Existe uma superficie isolada, iniciando em `/pilot/facilities`, sem alteracao operacional do frontend legado |
| M2 | Abrir o workflow 1 pela UI consumindo metadados publicados | O formulario de abertura usa a rota de catalogo da Etapa 3 e envia `POST /api/workflows/runtime/requests` |
| M3 | Exibir a fila operacional minima do workflow 1 | A tela mostra a fila e filtros canonicos consumindo `GET /api/workflows/read/current` |
| M4 | Permitir atribuicao, finalizacao e arquivamento pela UI | A superficie dispara `assign`, `finalize` e `archive` via rotas runtime existentes |
| M5 | Exibir `Minhas solicitações` para o solicitante | A UI consome `GET /api/workflows/read/mine` e mostra os chamados do usuario autenticado |
| M6 | Zero dependencia do `WorkflowsContext` legado | Nenhum arquivo novo depende de `WorkflowsContext`, `RequestsContext` ou leitura direta do Firestore |
| M7 | Preservar `code` e `httpStatus` dos erros do backend na camada cliente | O frontend consegue distinguir `403`, `400`, `404` e `500` para feedback especifico e semantica de UX |
| M8 | Isolar cache do frontend por identidade de usuario | Query keys incluem identidade da sessao para evitar reaproveitamento de dados entre usuarios distintos |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Reaproveitar componentes visuais desacoplados do projeto atual | Pode reutilizar `shadcn/ui`, `icons`, layout e padroes visuais, sem reaproveitar logica operacional legada |
| S2 | Nascer pronta para reuso na Etapa 5 e 6 | A estrutura da nova rota e da camada de dados permite plugar workflow 2 e workflow 3 depois |
| S3 | Tratar erros e loading states de forma consistente | Estados de carregamento, erro e sucesso ficam claros na UX minima do piloto |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Exibir historico concluido na mesma superficie do piloto | A tela pode aproveitar `GET /api/workflows/read/completed` se isso simplificar a operacao do piloto |
| C2 | Criar pequenas abstracoes de frontend ja orientadas a multiplos workflows | Componentes podem aceitar `workflowTypeId` como prop se isso vier sem custo excessivo nesta etapa |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Reescrever a UI legada existente | A decisao da fase e isolar o piloto em uma rota nova |
| W2 | Tela consolidada final da area | Isso fica para a etapa de frontend consolidado do piloto |
| W3 | `requestAction` / `respondAction` | Fora do escopo da Fase 1 simples |
| W4 | Firestore direto no cliente | O frontend deve consumir apenas API routes do motor novo |
| W5 | Tornar o frontend completamente generico para todos os workflows ja nesta etapa | O foco e validar o workflow 1, mesmo com estrutura preparada para reuso |

## 4. Decisoes Fechadas

### 4.1. Workflow alvo da etapa

| Item | Valor fechado |
|------|----------------|
| Workflow alvo | `Manutenção / Solicitações Gerais` |
| `workflowTypeId` | `facilities_manutencao_solicitacoes_gerais` |
| Etapas do fluxo | `Solicitação Aberta` -> `Em andamento` -> `Finalizado` |

### 4.2. Superficie de frontend

Fica fechado que a Etapa 4 criara uma rota nova e independente do legado:

- base inicial em `/pilot/facilities`;
- convivendo com as telas antigas sem alteracao de comportamento nelas;
- com possibilidade de migracao futura para uma rota definitiva quando o piloto consolidado amadurecer.

### 4.3. Fonte de verdade da UI

Fica fechado que a UI do workflow 1 deve consumir:

- `GET /api/workflows/catalog/[workflowTypeId]` para metadados publicados;
- `POST /api/workflows/runtime/requests` para abertura;
- `POST /api/workflows/runtime/requests/{id}/assign` para atribuicao;
- `POST /api/workflows/runtime/requests/{id}/finalize` para finalizacao;
- `POST /api/workflows/runtime/requests/{id}/archive` para arquivamento;
- `GET /api/workflows/read/current` para fila;
- `GET /api/workflows/read/assignments` para atribuicoes do responsavel;
- `GET /api/workflows/read/mine` para historico do solicitante.

O frontend nao deve:

- ler Firestore diretamente;
- inferir metadados do workflow por hardcode estrutural;
- reimplementar regra de transicao de status.

### 4.4. Isolamento do legado

Fica fechado que:

- a etapa pode reaproveitar componentes visuais desacoplados;
- a etapa nao deve reaproveitar contextos operacionais do legado;
- o piloto nasce com sua propria camada de fetch/orquestracao;
- a camada cliente deve propagar erro tipado com `code` e `httpStatus`, e nao apenas `message`;
- o cache da feature deve ser separado por usuario autenticado;
- `actorName` deve ser resolvido uma unica vez na camada de orquestracao do frontend usando `currentUserCollab?.name ?? user?.displayName ?? ''`, preservando o fallback do backend caso o valor venha vazio;
- o catalogo publicado e metadado estavel e nao deve ser invalidado por mutations operacionais; a query de catalogo pode usar `staleTime` mais alto;
- `Minhas solicitacoes` fica incorporado como tab da pagina principal, sem criar sub-rota dedicada em `/pilot/facilities/my-requests`;
- o renderizador dinamico precisa suportar funcionalmente apenas os tipos usados pelo workflow 1 (`text`, `textarea` e `select`); suporte funcional a `file`, `date` e `date-range` fica para etapas futuras;
- qualquer integracao de navegacao com menus existentes e secundaria ao escopo funcional.

## 5. Success Criteria

- o usuario autenticado consegue abrir um chamado do workflow 1 pela nova rota do piloto;
- o owner visualiza o item na fila e consegue atribuir um responsavel;
- o responsavel consegue finalizar o chamado;
- o owner consegue arquivar o chamado;
- o solicitante consegue ver o item em `Minhas solicitações`;
- a abertura do formulario usa metadados publicados vindos da Etapa 3, nao um schema hardcoded;
- a camada cliente consegue tratar pelo menos `403`, `WORKFLOW_TYPE_INACTIVE` e erros genericos de infraestrutura de forma distinguivel;
- a troca de usuario na mesma sessao nao reaproveita cache de `current`, `assignments` ou `mine`;
- a nova UI nao depende do legado para operar o fluxo.

## 6. Technical Scope

### Frontend

- criar a rota nova do piloto;
- criar a camada de consumo HTTP para catalog, runtime e read-side;
- centralizar a resolucao de `actorName` no hook/camada de orquestracao, e nao nos componentes;
- criar a experiencia minima de:
  - abertura
  - fila
  - detalhe
  - atribuicao
  - finalizacao
  - arquivamento
  - minhas solicitacoes

### Backend

- fora do escopo de expansao funcional;
- apenas consumo das APIs ja existentes das Etapas 1, 2 e 3.

### Database

- nenhuma leitura direta do cliente;
- nenhuma mudanca de schema;
- nenhuma mudanca em indices como requisito desta etapa.

## 7. Auth Requirements

- a UI deve usar o usuario autenticado atual para obter o Firebase ID token;
- todas as chamadas devem enviar `Authorization: Bearer <token>`;
- a UI nao implementa autorizacao propria alem de esconder/mostrar CTAs por papel de forma ergonomica;
- a fonte de verdade da permissao continua sendo o backend.

## 8. Out of Scope

- migracao das telas antigas;
- consolidacao visual final da area;
- suporte completo a workflow 2 e 3 nesta mesma etapa;
- suporte funcional a campos `file`, `date` e `date-range`;
- sub-rota dedicada `/pilot/facilities/my-requests`;
- renderizador generico completo para qualquer tipo de campo futuro;
- qualquer alteracao no runtime write-side ou no read-side existente.

## 9. Criterio de Aceite da Etapa

A Etapa 4 sera considerada concluida quando o workflow `facilities_manutencao_solicitacoes_gerais` puder ser operado ponta a ponta em uma rota nova do piloto, usando apenas as APIs do motor v2 e a rota de metadados publicados da Etapa 3.

## 10. Revision History

| Date | Impact | Summary |
|------|--------|---------|
| `2026-03-27` | `High` | criacao do define da Etapa 4 como frontend minimo do workflow 1 sobre catalogo publicado e sem dependencia do legado |
