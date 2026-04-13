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

## 2026-03-25 - Etapa 1 / Fase 1 Facilities

### Entrega

Foi implementada a fundacao tecnica da Etapa 1 do novo motor de workflows para Facilities, isolada das colecoes legadas e alinhada aos artefatos de design da fase.

### O que foi implementado

- runtime write-side server-side em `_v2` para:
  - `open-request`
  - `assign-responsible`
  - `advance-step`
  - `finalize-request`
  - `archive-request`
- tipos centrais, repository, engine, authz, history, read-model e normalizacao de input em `src/lib/workflows/runtime`
- rotas `app/api/workflows/runtime/*` autenticadas com Firebase Admin
- bootstrap dos 3 workflows piloto em:
  - `workflowTypes_v2/{workflowTypeId}`
  - `workflowTypes_v2/{workflowTypeId}/versions/1`
- geracao de `stepId` sistemica para as versoes publicadas
- backbone do read model persistido desde a abertura em `workflows_v2`
- script manual de seed do piloto em `src/scripts/seed-fase1-facilities-v1.ts`

### Correcoes aplicadas durante a Etapa 1

- identidade operacional corrigida para:
  - autenticar com `authUid`
  - operar no runtime com `id3a`
- `ownerUserId` do piloto corrigido para:
  - `SMO2`
- rotas write-side passaram a resolver `decodedToken.uid -> collaborators.authUid -> collaborator.id3a`
- `allowedUserIds`, owner, requester, responsible e `operationalParticipantIds` ficaram padronizados em `id3a`
- contador v2 normalizado para:
  - documento `counters/workflowCounter_v2`
  - campo `lastRequestNumber`
- faixa inicial do piloto v2 reservada para:
  - primeiro request em `0800`
- fallback silencioso do contador foi removido do runtime
- seed do contador passou a:
  - criar se ausente em ambiente virgem
  - preservar se ja existir valido
  - falhar se o documento existir invalido
- limitacao atual de `history` como array no documento principal foi registrada como aceitavel no piloto, com evolucao futura prevista para hardening

### Validacao executada

- suites de testes do runtime v2 criadas e reforcadas em:
  - `actor-resolution`
  - `authz`
  - `input-normalization`
  - `repository`
  - `runtime-use-cases`
- resultado final dos testes do bloco novo:
  - `5` suites aprovadas
  - `46` testes aprovados
  - `0` falhas
- o teste legado de `WorkflowSubmissionModal` permaneceu fora do escopo da Etapa 1

### Materializacao em Firestore

- contador do piloto v2 provisionado em:
  - `counters/workflowCounter_v2`
  - `lastRequestNumber = 799`
- seed executado para materializar os 3 workflows piloto e suas `versions/1`
- validacao manual confirmou estrutura correta de:
  - `fields`
  - `initialStepId`
  - `stepOrder`
  - `stepsById`
  - `ownerUserId`
  - `defaultSlaDays`

### Resultado da etapa

A Etapa 1 ficou concluida com:

- runtime write-side v2 implementado
- identidade operacional corrigida
- contador v2 endurecido
- seed do piloto executado
- colecoes `_v2` materializadas
- testes do bloco novo aprovados

### Observacao operacional

Fica recomendado como proximo passo da fase:

- executar um smoke test real de `open-request` em `workflows_v2` para validar ponta a ponta a primeira abertura operacional do piloto

## 2026-03-26 - Etapa 2 / Fase 1 Facilities

### Entrega

Foi implementada a Etapa 2 do piloto de Facilities, consolidando o read-side do motor v2 sobre `workflows_v2` e deixando o backend pronto para consultas canonicas por fila, atribuicoes, historico concluido e minhas solicitacoes.

### O que foi implementado

- camada de leitura separada em `src/lib/workflows/read` com:
  - `types.ts`
  - `queries.ts`
- rotas read-side em `src/app/api/workflows/read` para:
  - `GET /api/workflows/read/current`
  - `GET /api/workflows/read/assignments`
  - `GET /api/workflows/read/completed`
  - `GET /api/workflows/read/mine`
- DTOs e envelopes canonicos de sucesso/erro para leitura
- query builders para:
  - fila atual do owner
  - aguardando atribuicao
  - em andamento
  - aguardando acao
  - atribuido a mim
  - acao pendente para mim
  - concluidas por participante operacional
  - minhas solicitacoes por requester
- agrupamento por mes para:
  - `closedMonthKey` em concluidas
  - `submittedMonthKey` em minhas solicitacoes
- validacao explicita de coerencia do read model ja persistido em `workflows_v2`
- fechamento da simetria do read model com o helper:
  - `buildAdvanceReadModelUpdate`

### Ajustes de consistencia aplicados na Etapa 2

- fixtures de testes da Etapa 1 foram alinhados ao shape real persistido em `workflows_v2`
- `operationalParticipantIds` na abertura ficou coerente com o contrato:
  - apenas ownership operacional inicial
  - sem incluir requester na abertura
- residuos de shape futuro, como `actionRequests` em mocks atuais, foram removidos do escopo de testes da Etapa 2
- o read-side passou a consumir o mesmo modelo de identidade operacional do write-side:
  - autentica com Firebase Admin
  - resolve `authUid -> id3a`

### Correcoes pos-analise incorporadas na Etapa 2

Depois da primeira implementacao do read-side, a etapa recebeu um hardening adicional para reduzir risco operacional antes do uso por usuarios reais.

- autenticacao centralizada no helper composto:
  - `authenticateRuntimeActor`
- todas as 9 rotas do escopo passaram a usar esse helper:
  - 5 write-side
  - 4 read-side
- `verifyBearerToken` foi endurecido para distinguir:
  - erros reais de autenticacao (`auth/*`) retornando `401`
  - erros de infraestrutura sendo propagados para `500`
- as queries de abas do owner deixaram de depender de flags derivadas como eixo principal
- `statusCategory` passou a ser o discriminador canonico para:
  - `waiting_assignment` -> `open`
  - `in_progress` -> `in_progress`
  - `waiting_action` -> `waiting_action`
- a estrategia de indices foi consolidada:
  - mantendo o indice principal de owner por `statusCategory`
  - removendo os indices auxiliares antigos baseados em `hasResponsible` e `hasPendingActions`

### Validacao executada

- testes do read-side criados em:
  - `queries.test.js`
  - `read-model-consistency.test.js`
  - `read-api-contract.test.js`
- testes especificos de auth helper criados em:
  - `auth-helpers.test.js`
- validacao executada para o bloco de correcoes pos-analise:
  - `3` suites aprovadas
  - `16` testes aprovados
  - `0` falhas

### Resultado da etapa

A Etapa 2 ficou concluida com:

- read-side separado e tipado
- rotas `read/*` prontas para consumo futuro da UI
- queries canonicas sobre `workflows_v2`
- contrato HTTP de leitura coberto por testes
- autenticacao unificada entre write-side e read-side
- semantica de erro HTTP endurecida para auth vs infraestrutura
- estrategia de indices simplificada para as consultas do piloto

### Dependencia operacional remanescente

Fica pendente apenas o provisionamento operacional dos indices em ambiente real, caso ainda nao tenha sido feito:

- aplicar os indices atualizados de `workflows_v2` via script, `firestore.indexes.json` ou interface do Firestore

## 2026-03-27 - Etapa 3 / Fase 1 Facilities

### Entrega

Foi implementada a Etapa 3 da Fase 1 de Facilities, criando a rota backend de catalogo de metadados publicados do workflow para sustentar o frontend dinamico do piloto sem hardcode de campos e sem Firestore direto no cliente.

### O que foi implementado

- novo namespace autenticado em `src/app/api/workflows/catalog` com a rota:
  - `GET /api/workflows/catalog/[workflowTypeId]`
- camada server-side de catalogo em `src/lib/workflows/catalog` com:
  - `types.ts`
  - `published-metadata.ts`
- DTO publico de metadados publicados com:
  - `workflowTypeId`
  - `workflowName`
  - `description`
  - `icon`
  - `areaId`
  - `version`
  - `publishedAt`
  - `defaultSlaDays`
  - `initialStepId`
  - `initialStepName`
  - `fields[]`
  - `steps[]`
- ordenacao de `fields` por `order asc`
- derivacao de `steps[]` a partir de:
  - `stepOrder`
  - `stepsById`
- adaptacao da shape publicada para frontend, sem expor bruto:
  - `allowedUserIds`
  - `ownerEmail`
  - `ownerUserId`
  - `stepsById`

### Reaproveitamento de contratos existentes

A Etapa 3 foi implementada sem redesenhar o motor ja entregue nas etapas anteriores.

- autenticacao reaproveitada via:
  - `authenticateRuntimeActor`
- resolucao da versao publicada reaproveitada via:
  - `resolvePublishedVersion`
- autorizacao reaproveitada via:
  - `assertCanOpen`
- envelope de erro consistente reaproveitado via:
  - `RuntimeError`

### Semantica fechada da etapa

- a rota recebe `workflowTypeId`
- le o documento em `workflowTypes_v2/{workflowTypeId}`
- resolve `latestPublishedVersion`
- le `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- valida se o ator pode abrir o workflow
- devolve um payload pronto para o frontend renderizar dinamicamente o formulario de abertura

### Ajustes e endurecimentos aplicados

- o payload passou a ser orientado a frontend, e nao um espelho cru do Firestore
- `initialStepName` passou a ser derivado explicitamente da versao publicada
- a semantica de erro da versao publicada foi desambiguada em dois cenarios:
  - `VERSION_NOT_PUBLISHED` (`400`) quando `latestPublishedVersion` aponta para documento fora de `state=published`
  - `INVALID_PUBLISHED_VERSION` (`500`) quando a versao publicada esta estruturalmente inconsistente para montar o DTO
- a rota dinamica foi alinhada ao padrao real do codebase:
  - `params: Promise<{ workflowTypeId: string }>`
  - `await params`

### Validacao executada

- testes unitarios criados em:
  - `published-metadata.test.js`
- testes de contrato HTTP criados em:
  - `api-contract.test.js`
- validacao executada para o bloco novo:
  - `2` suites aprovadas
  - `14` testes aprovados
  - `0` falhas

### Resultado da etapa

A Etapa 3 ficou concluida com:

- rota oficial de catalogo de workflow publicada
- contrato backend para frontend dinamico fechado
- versionamento real do motor exposto ate a UI
- zero necessidade de Firestore direto no cliente para montar o workflow 1
- base pronta para a Etapa 4 construir o frontend minimo do piloto sobre metadados publicados

### Dependencia operacional remanescente

Nao ha dependencia operacional nova de Firestore nesta etapa.

O proximo passo natural da fase passa a ser:

- construir a Etapa 4, consumindo `GET /api/workflows/catalog/[workflowTypeId]` para renderizar a UI minima do workflow `facilities_manutencao_solicitacoes_gerais`

## 2026-03-27 - Etapa 4 / Fase 1 Facilities

### Entrega

Foi implementada a Etapa 4 da Fase 1 de Facilities, materializando a primeira UI real do piloto em uma rota nova e autenticada, consumindo apenas as APIs do motor v2 e o catalogo publicado da Etapa 3.

### O que foi implementado

- nova rota do piloto em:
  - `src/app/(app)/pilot/facilities/page.tsx`
- shell principal do frontend do piloto em:
  - `src/components/pilot/facilities/FacilitiesPilotPage.tsx`
- formulario dinamico de abertura via catalogo publicado em:
  - `OpenWorkflowCard.tsx`
  - `DynamicFieldRenderer.tsx`
- tabs operacionais para:
  - `Chamados atuais`
  - `Atribuicoes e acoes`
  - `Minhas solicitacoes`
- dialog operacional de detalhe do chamado em:
  - `RequestDetailsDialog.tsx`
- camada client-safe da feature em:
  - `src/lib/workflows/pilot/api-client.ts`
  - `src/lib/workflows/pilot/query-keys.ts`
  - `src/lib/workflows/pilot/types.ts`
  - `src/lib/workflows/pilot/timestamps.ts`
  - `src/lib/workflows/pilot/presentation.ts`
- hook de orquestracao com React Query em:
  - `src/hooks/use-facilities-pilot.ts`

### Contrato funcional entregue

- abertura dinamica do workflow:
  - `facilities_manutencao_solicitacoes_gerais`
- consumo do catalogo publicado via:
  - `GET /api/workflows/catalog/[workflowTypeId]`
- abertura de chamado via:
  - `POST /api/workflows/runtime/requests`
- atribuicao, finalizacao e arquivamento via:
  - `POST /api/workflows/runtime/requests/{id}/assign`
  - `POST /api/workflows/runtime/requests/{id}/finalize`
  - `POST /api/workflows/runtime/requests/{id}/archive`
- leitura operacional via:
  - `GET /api/workflows/read/current`
  - `GET /api/workflows/read/assignments`
  - `GET /api/workflows/read/mine`

### Decisoes tecnicas materializadas na Etapa 4

- nenhum arquivo novo depende de:
  - `WorkflowsContext`
  - `RequestsContext`
  - `firestore-service`
- a camada cliente preserva erro tipado com:
  - `code`
  - `message`
  - `httpStatus`
- as query keys da feature passaram a incluir:
  - `user.uid`
- o catalogo publicado ficou fora da invalidacao operacional e passou a usar cache mais estavel
- `actorName` foi centralizado no hook do piloto
- `Minhas solicitacoes` ficou incorporado como tab da pagina principal
- o renderer dinamico da etapa ficou funcional para os tipos usados pelo workflow 1:
  - `text`
  - `textarea`
  - `select`

### Correcao pontual aplicada apos o build inicial

Depois da primeira implementacao da Etapa 4, foi aplicada uma correcao localizada na camada de apresentacao do piloto:

- `waiting_action` deixou de bloquear `Finalizar` para:
  - owner
  - responsavel
- a funcao `derivePilotRequestPresentation` passou a alinhar essa regra com a permissao real do backend
- a suite de `presentation.test.ts` recebeu cobertura dedicada para:
  - owner em `waiting_action`
  - responsavel em `waiting_action`
  - terceiro sem permissao em `waiting_action`

### Validacao executada

- suites direcionadas do piloto criadas e aprovadas em:
  - `api-client.test.ts`
  - `timestamps.test.ts`
  - `presentation.test.ts`
  - `OpenWorkflowCard.test.tsx`
  - `RequestDetailsDialog.test.tsx`
- validacao do bloco principal da etapa:
  - `5` suites aprovadas
  - `12` testes aprovados
  - `0` falhas
- validacao especifica da correcao de `waiting_action`:
  - `1` suite aprovada
  - `6` testes aprovados
  - `0` falhas
- `npm run build` executado com sucesso para o app com a nova rota `/pilot/facilities`

### Validacao manual da UI

- a rota `/pilot/facilities` foi carregada no navegador com autenticacao real
- o formulario dinamico passou a carregar a definicao publicada do workflow 1
- a lista de `Chamados atuais` passou a renderizar itens reais
- a aba `Minhas solicitacoes` passou a exibir agrupamento mensal com dados reais do piloto

### Resultado da etapa

A Etapa 4 ficou concluida com:

- primeira UI real do piloto implementada
- abertura dinamica do workflow 1 via catalogo publicado
- operacao minima de owner e responsavel em rota nova
- camada cliente isolada do legado
- base pronta para reutilizacao nos workflows 2 e 3

### Consideracoes operacionais e refinamentos futuros

Ficaram registrados como refinamentos futuros da experiencia:

- apos a primeira atribuicao, o seletor de responsavel deve deixar de aparecer
- o detalhe do chamado deve mostrar apenas o responsavel atual em modo leitura
- eventual reatribuicao futura deve ser modelada como acao explicita e deliberada

Tambem foi adicionado suporte operacional local para desenvolvimento com Firebase Admin via:

- script `npm run dev:firebase`

Esse script facilita subir o ambiente local com as credenciais necessarias para as rotas autenticadas do motor novo.

## 2026-03-30 - Etapa 5 / Fase 1 Facilities

### Entrega

Foi implementada a Etapa 5 da Fase 1 de Facilities, criando a infraestrutura de upload com signed URL no backend para campos `file` do motor v2, sem alterar o contrato do `open-request` e sem reintroduzir o mecanismo legado de upload.

### O que foi implementado

- nova rota autenticada de upload em:
  - `src/app/api/workflows/runtime/uploads/route.ts`
- use case server-side para iniciar upload em:
  - `src/lib/workflows/runtime/use-cases/init-file-upload.ts`
- modulo de assinatura e composicao do objeto de Storage em:
  - `src/lib/workflows/runtime/upload-storage.ts`
- extensao dos erros do runtime para codigos de upload em:
  - `src/lib/workflows/runtime/errors.ts`
- helper client-safe do piloto para:
  - pedir assinatura
  - fazer `PUT` do blob
  - devolver `fileUrl`
  em:
  - `src/lib/workflows/pilot/api-client.ts`
- DTOs e erro tipado de transferencia em:
  - `src/lib/workflows/pilot/types.ts`

### Contrato funcional entregue

- nova rota:
  - `POST /api/workflows/runtime/uploads`
- request de assinatura com:
  - `workflowTypeId`
  - `fieldId`
  - `fileName`
  - `contentType`
- response canonica com:
  - `uploadUrl`
  - `uploadMethod`
  - `uploadHeaders`
  - `fileUrl`
  - `storagePath`
  - `uploadId`
  - `expiresAt`
- helper cliente separado para:
  - `requestPilotUpload`
  - `putFileToSignedUrl`
  - `uploadPilotFile`

### Decisoes tecnicas materializadas na Etapa 5

- a solucao adotou a abordagem A:
  - backend gera a signed URL
  - cliente faz upload direto para o Storage
- o backend permaneceu como fonte de verdade para:
  - authz
  - `uploadId`
  - path do objeto
  - metadata do upload
  - `fileUrl` final
- o path dos uploads pre-open ficou padronizado em:
  - `Workflows/Facilities e Suprimentos/workflows_v2/preopen/{workflowTypeId}/{fieldId}/{yyyy-mm}/{uploadId}-{sanitizedFileName}`
- metadata minima do objeto fechada em:
  - `uploadId`
  - `workflowTypeId`
  - `fieldId`
  - `actorUserId`
  - `firebaseStorageDownloadTokens`
- o contrato de:
  - `POST /api/workflows/runtime/requests`
  permaneceu inalterado, continuando a receber apenas `formData` JSON com URL string para o campo `file`
- a etapa foi mantida backend-first:
  - sem alterar `OpenWorkflowCard`
  - sem alterar `DynamicFieldRenderer`
  - sem habilitar ainda o workflow 2 visualmente na UI do piloto

### Validacao executada

- suites novas/criadas para upload aprovadas em:
  - `upload-storage.test.ts`
  - `init-file-upload.test.ts`
  - `upload-route-contract.test.ts`
- suite do client helper atualizada e aprovada em:
  - `api-client.test.ts`
- validacao direcionada do bloco novo:
  - `4` suites aprovadas
  - `20` testes aprovados
  - `0` falhas

### Validacao manual executada

Foi realizado smoke manual completo da infraestrutura de upload:

- `POST /api/workflows/runtime/uploads` respondeu `200` com:
  - `uploadUrl`
  - `fileUrl`
  - `storagePath`
  - `uploadId`
- `PUT` real do arquivo no Storage respondeu `200`
- a `fileUrl` retornada respondeu `200` e serviu o conteudo do arquivo
- `POST /api/workflows/runtime/requests` aceitou a `fileUrl` em:
  - `formData.anexo_planilha`
- o request foi criado com:
  - `requestId = 806`
  - `docId = 134Sf1oSIQ9yA6xr2XB4`
- validacao em Firestore confirmou persistencia correta de:
  - `formData.anexo_planilha`
  no documento criado em `workflows_v2`

### Resultado da etapa

A Etapa 5 ficou concluida com:

- infraestrutura de upload com signed URL implementada
- helper cliente pronto para consumo futuro da UI
- persistencia de URL de anexo validada no runtime v2
- service account local validada com capacidade de assinar URLs
- base pronta para a Etapa 6 integrar `anexo_planilha` na mesma UI do piloto ao habilitar `Solicitacao de Suprimentos`

### Consideracoes operacionais

- o smoke manual confirmou que o ambiente local do piloto consegue assinar URLs de Storage com a service account atual
- o path do objeto ficou mais verboso do que o ideal para operacao manual no bucket, mas foi mantido por clareza e rastreabilidade nesta fase
- a integracao visual do campo `file` permanece deliberadamente adiada para a Etapa 6, evitando regressao desnecessaria sobre a UI consolidada da Etapa 4

## 2026-03-31 - Etapa 6 / Fase 1 Facilities

### Entrega

Foi implementada a Etapa 6 da Fase 1 de Facilities, expandindo a mesma rota `/pilot/facilities` para operar `facilities_manutencao_solicitacoes_gerais` e `facilities_solicitacao_suprimentos` na mesma UI, com upload funcional de `anexo_planilha` integrado ao formulario dinamico.

### O que foi implementado

- bootstrap server-side da rota com suporte a:
  - `?workflow=<workflowTypeId>`
  em:
  - `src/app/(app)/pilot/facilities/page.tsx`
- pagina do piloto evoluida para:
  - workflow ativo
  - espelhamento da selecao na URL
  - segmentacao local entre `all` e `active`
  em:
  - `src/components/pilot/facilities/FacilitiesPilotPage.tsx`
- registry local do piloto para os dois workflows em:
  - `src/lib/workflows/pilot/workflow-registry.ts`
- filtros puros por workflow para listas e agrupamentos em:
  - `src/lib/workflows/pilot/workflow-filters.ts`
- formulario dinamico atualizado para:
  - suportar `type: 'file'`
  - converter `File -> fileUrl` via `src/lib/workflows/upload/client`
  - enviar `formData` pronto ao runtime
  em:
  - `src/components/pilot/facilities/OpenWorkflowCard.tsx`
  - `src/components/pilot/facilities/DynamicFieldRenderer.tsx`
- abas operacionais e dialog ajustados para conviver com dois workflows na mesma superficie em:
  - `src/components/pilot/facilities/CurrentQueueTab.tsx`
  - `src/components/pilot/facilities/AssignmentsTab.tsx`
  - `src/components/pilot/facilities/MyRequestsTab.tsx`
  - `src/components/pilot/facilities/RequestSummaryList.tsx`
  - `src/components/pilot/facilities/RequestDetailsDialog.tsx`
- tipos do piloto refinados para estado local multiworkflow e valores dinamicos do formulario em:
  - `src/lib/workflows/pilot/types.ts`

### Decisoes tecnicas materializadas na Etapa 6

- a mesma UI do piloto passou a operar exatamente dois workflows:
  - `facilities_manutencao_solicitacoes_gerais`
  - `facilities_solicitacao_suprimentos`
- o read-side permaneceu global, sem novos endpoints backend por workflow
- a filtragem por `workflowTypeId` ficou concentrada no frontend, sobre:
  - `Chamados atuais`
  - `Atribuicoes e acoes`
  - `Minhas solicitacoes`
- o upload do campo `anexo_planilha` passou a acontecer no submit do formulario:
  - a UI pede signed URL
  - faz `PUT` do blob
  - recebe `fileUrl`
  - persiste essa URL no `formData` do `open-request`
- o helper de upload consumido pela UI permaneceu na camada generica:
  - `src/lib/workflows/upload/client.ts`
- nenhum arquivo novo ou alterado da etapa voltou a depender do frontend legado

### Correcao pontual aplicada apos o build inicial

Depois da primeira implementacao da Etapa 6, foi aplicada uma correcao localizada para fechar a micro-etapa 6.1:

- `getFacilitiesPilotWorkflowConfig()` deixou de usar fallback silencioso para manutencao
- `RequestSummaryList` e `RequestDetailsDialog` passaram a resolver labels com a ordem:
  - `workflowName`
  - `config?.shortLabel`
  - `workflowTypeId`
- `FacilitiesPilotPage` foi ajustada para tratar o workflow ativo como lookup conhecido
- `OpenWorkflowCard.test.tsx` ganhou cobertura do caso:
  - workflow 2 com `file` obrigatorio
  - submit sem arquivo
  - sem chamada de upload nem submit final
- `RequestDetailsDialog.test.tsx` e `RequestSummaryList.test.tsx` passaram a cobrir workflow desconhecido sem rotulo incorreto

### Validacao executada

- suites direcionadas da Etapa 6 aprovadas em:
  - `workflow-registry.test.ts`
  - `workflow-filters.test.ts`
  - `OpenWorkflowCard.test.tsx`
  - `RequestDetailsDialog.test.tsx`
  - `api-client.test.ts`
  - `src/lib/workflows/upload/__tests__/client.test.ts`
- typecheck do recorte alterado executado sem erros nas areas:
  - `src/lib/workflows/upload`
  - `src/lib/workflows/pilot`
  - `src/components/pilot/facilities`
  - `src/hooks/use-facilities-pilot`
  - `src/app/(app)/pilot/facilities`
- validacao especifica da correcao pos-build aprovada em:
  - `RequestSummaryList.test.tsx`
  - `OpenWorkflowCard.test.tsx`
  - `RequestDetailsDialog.test.tsx`

### Validacao manual da UI

- a rota `/pilot/facilities` passou a alternar corretamente entre:
  - `Manutencao geral`
  - `Suprimentos`
- foi possivel abrir chamado dos dois workflows na mesma superficie
- foi possivel atribuir responsavel pela UI nova
- foi possivel anexar arquivo real no workflow de suprimentos
- a URL final do anexo foi persistida corretamente em:
  - `formData.anexo_planilha`
- o arquivo ficou acessivel pela `fileUrl` e pela inspecao em Firestore
- as listas operacionais continuaram funcionais durante a convivencia dos dois workflows

### Resultado da etapa

A Etapa 6 ficou concluida com:

- base multiworkflow real na mesma rota do piloto
- workflow 2 habilitado na mesma UX do workflow 1
- upload funcional integrado ao formulario dinamico
- identidade de workflow reforcada nas listas e no dialog operacional
- correcoes pos-build incorporadas sem reabrir backend nem read-side

### Consideracoes operacionais e transicao para a proxima fase

- o dialog operacional continua limitado aos metadados do read-side atual e, por isso, ainda nao exibe o anexo diretamente pela UI
- a persistencia do anexo no request foi validada e o arquivo esta acessivel pela `fileUrl`, entao o gap restante e de exposicao/experiencia, nao de infraestrutura
- refinamentos esteticos e visualizacao mais rica de anexos ficam mais bem enderecados na construcao do frontend oficial
- a duplicacao pontual do registry local fica registrada como hardening futuro para a Etapa 7, quando o terceiro workflow entrar na mesma base

## 2026-03-31 - Etapa 7 / Fase 1 Facilities

### Entrega

Foi implementada a Etapa 7 da Fase 1 de Facilities, incluindo `facilities_solicitacao_compras` na mesma rota `/pilot/facilities`, conectando a aba `Concluidas` ao read-side ja existente e consolidando a UX final do piloto para os 3 workflows.

### O que foi implementado

- expansao do registry local do piloto para:
  - `facilities_manutencao_solicitacoes_gerais`
  - `facilities_solicitacao_suprimentos`
  - `facilities_solicitacao_compras`
  em:
  - `src/lib/workflows/pilot/workflow-registry.ts`
- derivacao do workflow ativo a partir da fonte unica do registry, sem nova duplicacao estrutural no resolver
- nova leitura client-safe de concluidos em:
  - `src/lib/workflows/pilot/api-client.ts`
- nova query key para concluidos em:
  - `src/lib/workflows/pilot/query-keys.ts`
- extensao do hook do piloto para consumir:
  - `completedQuery`
  em:
  - `src/hooks/use-facilities-pilot.ts`
- nova aba `Concluidas` em:
  - `src/components/pilot/facilities/CompletedTab.tsx`
- consolidacao da pagina do piloto para:
  - 3 workflows no selector
  - 4 cards de topo
  - 4 abas operacionais
  - mesma superficie multiworkflow
  em:
  - `src/components/pilot/facilities/FacilitiesPilotPage.tsx`
- ajuste do formulario dinamico para o workflow 3:
  - `anexos` como `file` opcional
  - upload somente quando houver `File`
  - omissao do campo no `formData` quando vazio
  em:
  - `src/components/pilot/facilities/OpenWorkflowCard.tsx`
- refinamento do dialog operacional para:
  - mostrar o responsavel atual em leitura
  - ocultar o seletor apos a primeira atribuicao
  em:
  - `src/components/pilot/facilities/RequestDetailsDialog.tsx`

### Decisoes tecnicas materializadas na Etapa 7

- a mesma rota `/pilot/facilities` passou a operar os 3 workflows piloto
- o backend nao precisou de endpoint novo:
  - a etapa reaproveitou `GET /api/workflows/read/completed`
- o agrupamento de `Concluidas` passou a seguir:
  - `closedMonthKey`
- o workflow 3 reutilizou apenas os tipos de campo ja provados no piloto:
  - `text`
  - `textarea`
  - `select`
  - `file`
- o campo `anexos` foi tratado como:
  - opcional
  - sem placeholder vazio no `formData`
  - com upload sob demanda
- a UX de atribuicao foi consolidada para:
  - atribuicao inicial explicita
  - responsavel em modo leitura depois disso
  - sem modelar ainda reatribuicao formal

### Validacao executada

- suites direcionadas da Etapa 7 aprovadas em:
  - `workflow-registry.test.ts`
  - `workflow-filters.test.ts`
  - `api-client.test.ts`
  - `OpenWorkflowCard.test.tsx`
  - `RequestDetailsDialog.test.tsx`
  - `CompletedTab.test.tsx`
- resultado do bloco novo:
  - `6` suites aprovadas
  - `22` testes aprovados
  - `0` falhas
- typecheck do recorte alterado executado sem erros nas areas:
  - `src/lib/workflows/pilot`
  - `src/components/pilot/facilities`
  - `src/hooks/use-facilities-pilot`
  - `src/app/(app)/pilot/facilities`

### Validacao manual da UI

Foi executado o roteiro completo de smoke da Fase 1 cobrindo os 3 workflows e toda a superficie consolidada:

- alternancia correta entre:
  - `Manutencao geral`
  - `Suprimentos`
  - `Compras`
- abertura de chamados dos 3 workflows na mesma rota
- trilha completa validada para:
  - abrir
  - atribuir
  - finalizar
  - arquivar
- `Solicitacao de Suprimentos` validada com:
  - upload obrigatorio de `anexo_planilha`
- `Solicitacao de Compras` validada com:
  - submit sem anexo opcional
  - submit com anexo opcional real
- aba `Concluidas` validada com:
  - agrupamento mensal
  - abertura de item no dialog
  - convivencia dos 3 workflows
- filtros:
  - `Todos os workflows`
  - `Somente workflow ativo`
  validados nas listas da rota
- persistencia dos anexos confirmada no Firestore

### Resultado da etapa

A Etapa 7 ficou concluida com:

- workflow 3 rodando ponta a ponta na mesma UI
- aba `Concluidas` consumindo o read-side existente
- base de frontend consolidada para os 3 workflows piloto
- refinamento final suficiente da UX do piloto para encerrar a Fase 1
- nenhuma dependencia reintroduzida do frontend legado

### Fechamento da Fase 1

Com a validacao manual completa da Etapa 7, a Fase 1 pode ser considerada concluida para o recorte de Facilities.

O que ficou comprovado ao final da fase:

- runtime write-side v2 funcional
- read-side v2 funcional
- catalogo publicado consumido pela UI
- infraestrutura de upload com signed URL validada
- mesma rota do piloto operando os 3 workflows definidos
- owner, responsavel e solicitante operando a trilha fim a fim
- base pronta para iniciar o frontend oficial e a expansao para os demais `workflowTypes`

### Consideracoes para a proxima frente

- o dialog operacional continua sem exibir anexos diretamente, porque o read-side atual nao expoe `formData`
- isso nao bloqueia o encerramento da Fase 1, mas vira requisito natural da proxima frente de frontend oficial
- a partir deste ponto, o proximo trabalho deixa de ser Fase 1 e passa a ser:
  - definicao do frontend oficial
  - enriquecimento da experiencia de detalhes
  - expansao da base validada para os demais dominios de workflows
