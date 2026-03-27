# DEFINE: FASE1_FACILITIES_ETAPA3

> Generated: 2026-03-27
> Status: Ready for etapa 5.4
> Source: solicitação direta + ROADMAP_FASE1_FACILITIES.md + ROADMAP_ETAPAS_FASE1_FACILITIES.md + ARQUITETURA_WORKFLOWS_VERSIONADOS.md + WORKFLOWS_PRE_BUILD_OFICIAL.md + REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md
> Clarity Score: 14/15

## 1. Problem Statement

O frontend do piloto precisa consumir a definicao publicada do workflow de forma dinamica e versionada, mas hoje nao existe uma rota backend oficial para expor esses metadados sem depender de Firestore direto no cliente ou de hardcode do formulario.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Frontend do piloto | Precisa montar o formulario e os metadados visuais do workflow 1 a partir da versao publicada real, sem duplicar a definicao no cliente | Pontual por etapa |
| Time tecnico da Fase 1 | Precisa preservar o core do versionamento ate a UI, mantendo isolamento entre frontend e backend | Pontual por etapa |
| Solicitante e owner do workflow 1 | Precisam operar uma abertura de chamado coerente com a definicao oficial publicada | Recorrente |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Expor metadados publicados do workflow 1 por rota backend oficial | Existe endpoint capaz de devolver a definicao publicada de `facilities_manutencao_solicitacoes_gerais` |
| M2 | Resolver a versao publicada a partir de `latestPublishedVersion` | O payload usa a versao oficial atual registrada em `workflowTypes_v2/{workflowTypeId}` |
| M3 | Devolver campos suficientes para montagem dinamica do formulario | O payload inclui `fields` com `id`, `label`, `type`, `required`, `placeholder` e `options` quando houver |
| M4 | Evitar Firestore direto no frontend | O cliente nao consulta `workflowTypes_v2` nem `versions/{version}` diretamente |
| M5 | Preservar o versionamento real do motor ate a UI | O frontend deixa de depender de hardcode de campos e opcoes do workflow 1 |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Devolver metadados adicionais uteis para a UI | `workflowTypeId`, `workflowName`, `version`, `areaId`, `initialStepId` e informacoes similares acompanham o payload quando fizer sentido |
| S2 | Nascer com contrato reaproveitavel | O formato da rota permite uso futuro pelos workflows 2 e 3 sem redesenho estrutural |
| S3 | Seguir o modelo de autenticacao do namespace `/api/workflows` | A rota se integra ao mesmo padrao de autenticacao das demais rotas do motor, se esse for o contrato adotado para consultas do namespace |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Expor metadados de steps publicados relevantes para a UI | O payload pode incluir `steps` ou subconjunto suficiente para futuras telas sem criar acoplamento desnecessario |
| C2 | Incluir informacoes de apresentacao uteis ao frontend | Labels de workflow ou agrupamentos auxiliares podem vir no contrato se nao distorcerem o schema publicado |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Frontend minimo do workflow 1 | Isso vira a Etapa 4 |
| W2 | Tela consolidada do piloto | Isso fica para etapa posterior |
| W3 | Firestore direto no cliente | Contraria a direcao arquitetural da Fase 1 |
| W4 | Nova logica de negocio no runtime write-side | Esta etapa apenas expoe metadados publicados |
| W5 | Renderizacao generica completa de formularios no frontend | O objetivo aqui e viabilizar o consumo dinamico, nao fechar toda a UX generica |

## 4. Decisoes Fechadas

### 4.1. Workflow alvo desta etapa

| Item | Valor fechado |
|------|----------------|
| Workflow alvo | `Manutenção / Solicitações Gerais` |
| `workflowTypeId` inicial | `facilities_manutencao_solicitacoes_gerais` |
| Fonte do tipo | `workflowTypes_v2/{workflowTypeId}` |
| Fonte da versao publicada | `workflowTypes_v2/{workflowTypeId}/versions/{latestPublishedVersion}` |

### 4.2. Papel desta etapa na Fase 1

Fica fechado que a Etapa 3 deixa de ser o frontend minimo e passa a ser a camada backend que viabiliza consumo dinamico da definicao publicada do workflow.

Consequencia:

- a Etapa 4 passa a construir o frontend minimo sobre esta rota;
- o hardcode do formulario do workflow 1 deixa de ser a direcao recomendada;
- o core do versionamento passa a chegar ate a UI por meio de uma API oficial.

### 4.3. Escopo da rota

Regras fechadas:

- a etapa cria uma rota backend para consulta da definicao publicada do workflow;
- a rota deve consultar `workflowTypes_v2/{workflowTypeId}`;
- a rota deve resolver `latestPublishedVersion`;
- a rota deve consultar a `versions/{version}` correspondente;
- a resposta deve ser suficiente para o frontend montar dinamicamente a abertura do workflow 1;
- o frontend nao deve ler Firestore diretamente para obter estes metadados.

### 4.4. Direcao de contrato

Fica fechado que a rota deve devolver os metadados publicados como contrato de leitura backend para frontend, e nao como espelhamento cru do documento Firestore.

Isso significa:

- o payload pode ser adaptado para a UI;
- mas a origem da verdade continua sendo a versao publicada;
- a etapa nao deve introduzir uma segunda fonte manual de definicao do formulario.

## 5. Success Criteria

- existe uma rota backend oficial que devolve a definicao publicada do workflow 1;
- o payload inclui as opcoes corretas dos campos selecionaveis do workflow 1, incluindo `impacto` e `centro_custo` se estiverem na versao publicada;
- o contrato reflete a versao publicada atual, nao um hardcode local do frontend;
- o frontend do piloto deixa de precisar ler `workflowTypes_v2` diretamente;
- a rota fica pronta para sustentar o frontend minimo da etapa seguinte.

## 6. Technical Scope

### Backend

- criar endpoint de leitura de metadados publicados do workflow;
- ler `workflowTypes_v2/{workflowTypeId}`;
- resolver `latestPublishedVersion`;
- ler `workflowTypes_v2/{workflowTypeId}/versions/{version}`;
- devolver contrato de metadados pronto para consumo no frontend.

### Frontend

- fora do escopo desta etapa, exceto pelo alinhamento do payload que sera consumido na Etapa 4.

### Database

- leitura apenas das colecoes `_v2`;
- nenhuma mudanca de schema;
- nenhuma mudanca no runtime write-side;
- nenhuma mudanca em indices como requisito desta etapa.

## 7. Auth Requirements

- a rota deve seguir o modelo de autenticacao do backend novo se isso ja for regra do namespace `/api/workflows`;
- o design pode fechar se a consulta exige autenticacao obrigatoria ou se segue a mesma politica das demais rotas de leitura do motor;
- em qualquer caso, o frontend nao pode contornar o backend lendo Firestore diretamente.

## 8. Out of Scope

- frontend minimo do workflow 1;
- pagina `/pilot/facilities`;
- `Minhas solicitações`;
- requestAction/respondAction;
- quaisquer alteracoes nas rotas write-side;
- consolidacao de multiplos workflows na mesma tela.

## 9. Criterio de Aceite da Etapa

A Etapa 3 sera considerada concluida quando a definicao publicada do workflow `facilities_manutencao_solicitacoes_gerais` puder ser consumida dinamicamente pelo frontend via backend oficial, sem hardcode e sem Firestore direto no cliente.

## 10. Revision History

| Date | Impact | Summary |
|------|--------|---------|
| `2026-03-27` | `High` | redefinicao da Etapa 3 como construcao da rota de metadados dinamicos do workflow publicado |
