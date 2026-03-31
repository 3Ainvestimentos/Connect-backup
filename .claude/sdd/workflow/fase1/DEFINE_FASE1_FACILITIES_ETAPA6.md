# DEFINE: FASE1_FACILITIES_ETAPA6

> Generated: 2026-03-30
> Status: Ready for design
> Source: solicitacao direta + ROADMAP_FASE1_FACILITIES.md + ROADMAP_ETAPAS_FASE1_FACILITIES.md + implementation_progress_fase1.md + DEFINE_FASE1_FACILITIES_ETAPA4.md + DEFINE_FASE1_FACILITIES_ETAPA5.md + DEFINE_FASE1_FACILITIES_ETAPA5_1.md + implementacao atual do piloto `/pilot/facilities`
> Clarity Score: 14/15

## 1. Problem Statement

A mesma UI do piloto em `/pilot/facilities` precisa deixar de operar apenas `facilities_manutencao_solicitacoes_gerais` e passar a suportar tambem `facilities_solicitacao_suprimentos`, incluindo upload funcional de `anexo_planilha`, sem criar rota paralela nem reintroduzir dependencia do frontend legado.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Solicitante interno de Facilities | Precisa abrir `Solicitacao de Suprimentos` na UI nova, incluindo anexo obrigatorio, sem voltar para a interface legada | Recorrente |
| Owner da area | Precisa operar workflow 1 e workflow 2 na mesma superficie, sem duplicacao de tela nem ambiguidade sobre qual fluxo esta ativo | Diaria |
| Responsavel operacional | Precisa ver e finalizar itens de suprimentos na mesma experiencia ja usada para manutencao | Diaria |
| Time tecnico da Fase 1 | Precisa provar que a base da Etapa 4 nao esta acoplada ao workflow 1 e que a infraestrutura de upload da Etapa 5 e consumivel pela UI do piloto | Pontual por etapa |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Habilitar `Solicitacao de Suprimentos` na mesma rota do piloto | O usuario opera workflow 1 e workflow 2 em `/pilot/facilities`, sem rota dedicada para suprimentos |
| M2 | Permitir abrir workflow 2 usando catalogo publicado | O formulario de abertura passa a refletir o workflow ativo e envia `workflowTypeId = facilities_solicitacao_suprimentos` quando esse fluxo estiver selecionado |
| M3 | Integrar o campo `file` ao fluxo de abertura | O formulario do workflow 2 usa uma camada cliente generica de upload para transformar `File -> fileUrl` antes do `POST /api/workflows/runtime/requests` |
| M4 | Preservar operacao das listas e do dialog no mesmo frontend | `Chamados atuais`, `Atribuicoes e acoes`, `Minhas solicitacoes` e o dialog operacional continuam funcionando para itens dos dois workflows |
| M5 | Remover hardcode estrutural do workflow 1 | A pagina, o hook e o card de abertura deixam de assumir um unico `workflowTypeId` fixo como unica experiencia da rota |
| M6 | Preservar a Etapa 4 sem regressao perceptivel | `facilities_manutencao_solicitacoes_gerais` continua abrindo e operando como antes dentro da nova base multiworkflow |
| M7 | Manter o frontend isolado do legado | Nenhum arquivo novo ou alterado da feature depende de `WorkflowsContext`, `RequestsContext`, `WorkflowSubmissionModal` ou leitura direta de Firestore |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Tornar o workflow ativo explicito na mesma superficie | A rota deixa claro qual workflow esta em foco por seletor, badge ou mecanismo equivalente sem confundir o operador |
| S2 | Filtrar localmente a experiencia operacional por workflow | A UI consegue alternar entre visualizar todos os workflows ou apenas o ativo sem exigir novos endpoints read-side |
| S3 | Tratar erro de upload com semantica util na UX | O usuario recebe feedback distinguivel para falha de assinatura/permicao vs falha de transferencia do blob |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Espelhar o workflow ativo na URL | A rota pode suportar `?workflow=<workflowTypeId>` para deep-link e refresh consistente |
| C2 | Reforcar identidade do workflow nas listas | Cards e dialog podem exibir badge/nome do workflow para facilitar leitura quando houver coexistencia de itens |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Incluir `Solicitacao de Compras` nesta mesma etapa | Workflow 3 permanece para a Etapa 7 |
| W2 | Criar uma segunda interface "oficial" separada da rota do piloto | A estrategia da fase e evoluir a mesma superficie ja validada |
| W3 | Consolidacao final/polish completo da UX multiworkflow | Refinamento final fica para a Etapa 7 |
| W4 | Alterar backend read-side para filtrar por `workflowTypeId` | A etapa deve reaproveitar os endpoints globais existentes e filtrar no frontend quando necessario |
| W5 | Redesenhar o modelo de anexos | A Etapa 6 apenas consome a infraestrutura da Etapa 5 |

## 4. Decisoes Fechadas

### 4.1. Workflow alvo da etapa

| Item | Valor fechado |
|------|----------------|
| Workflow 1 preservado | `facilities_manutencao_solicitacoes_gerais` |
| Workflow 2 habilitado | `facilities_solicitacao_suprimentos` |
| Campo novo critico | `anexo_planilha` |
| Superficie | mesma rota `/pilot/facilities` |

### 4.2. Estrategia de frontend

Fica fechado que a Etapa 6:

- evolui a mesma base de frontend da Etapa 4;
- nao cria rota separada para `Solicitacao de Suprimentos`;
- nao cria uma segunda UI paralela para validar workflow 2;
- usa a mesma pagina, as mesmas tabs e o mesmo dialog operacional como base da experiencia.

### 4.3. Dependencia da Etapa 5 e da Etapa 5.1

Fica fechado que a Etapa 6 consome:

- a infraestrutura de upload entregue na Etapa 5;
- e a camada cliente generica corrigida na Etapa 5.1.

Superficie consumida:

- `POST /api/workflows/runtime/uploads`;
- `src/lib/workflows/upload/client`;
- retorno de `fileUrl` persistivel para o `formData`.

Nao faz parte desta etapa:

- promover o helper de upload para fora de `pilot/*`;
- redesenhar o endpoint de upload;
- mudar o contrato de `open-request`;
- mover fisicamente arquivos no Storage apos a abertura do request.

### 4.4. Multiworkflow na mesma rota

Fica fechado que a mesma superficie do piloto passa a suportar exatamente dois workflows nesta etapa:

- `facilities_manutencao_solicitacoes_gerais`
- `facilities_solicitacao_suprimentos`

O workflow ativo deve influenciar pelo menos:

- o catalogo carregado para o card de abertura;
- o payload de `open-request`;
- a leitura contextual dos textos e labels da pagina;
- o filtro ergonomico das listas quando o usuario quiser restringir a visao ao workflow ativo.

### 4.5. Read-side permanece global

Fica fechado que:

- `GET /api/workflows/read/current`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/mine`

continuam sendo consumidos como queries globais por usuario.

A Etapa 6 nao depende de novos endpoints backend para filtrar por workflow; qualquer segmentacao por `workflowTypeId` deve acontecer na camada cliente ou nos seletores da feature.

### 4.6. Preservacao da UX da Etapa 4

Fica fechado que o comportamento ja validado do workflow 1 deve permanecer funcional:

- abrir chamado;
- owner atribuir;
- responsavel finalizar;
- owner arquivar;
- solicitante acompanhar em `Minhas solicitacoes`.

O reuso para workflow 2 deve acontecer sem excecoes ad hoc que fragilizem essa trilha.

## 5. Success Criteria

- o usuario autenticado consegue alternar a experiencia da rota entre workflow 1 e workflow 2;
- `Solicitacao de Suprimentos` pode ser aberta na mesma UI com upload funcional de `anexo_planilha`;
- o upload gera `fileUrl` valida e a abertura do request persiste essa URL no `formData`;
- itens de workflow 1 e workflow 2 convivem corretamente em `Chamados atuais`, `Atribuicoes e acoes` e `Minhas solicitacoes`;
- o frontend deixa de depender de um `WORKFLOW_TYPE_ID` unico como verdade estrutural da pagina;
- o workflow 1 continua funcional sem regressao perceptivel;
- a feature continua isolada do frontend legado.

## 6. Technical Scope

### Frontend

- evoluir a pagina `/pilot/facilities` para suportar dois workflows na mesma superficie;
- adaptar a camada de orquestracao (`useFacilitiesPilot` ou equivalente) para operar workflow ativo e reuso da infraestrutura de upload;
- consumir a camada generica de upload ja promovida na Etapa 5.1;
- integrar suporte funcional ao tipo `file` no formulario dinamico do piloto;
- manter listas, tabs e dialog operacional na mesma base de componentes;
- adicionar filtros/seletores necessarios para coexistencia ergonomica de dois workflows.

### Backend

- fora do escopo de novas capacidades centrais;
- apenas consumo das APIs ja existentes:
  - catalog
  - read-side
  - runtime
  - upload init da Etapa 5

### Database / Storage

- nenhuma mudanca de schema em Firestore;
- nenhuma mudanca de indices como requisito da etapa;
- nenhum redesign do path de anexos;
- uso do `fileUrl` persistido no request como valor do campo `file`.

## 7. Auth Requirements

- a UI continua usando o Firebase ID token do usuario autenticado;
- toda chamada para catalog, read-side, runtime e upload init deve enviar `Authorization: Bearer <token>`;
- o frontend pode esconder ou mostrar CTAs por ergonomia, mas a fonte de verdade de permissao continua sendo o backend;
- o upload continua sem credencial privilegiada no cliente, usando apenas a signed URL da Etapa 5.

## 8. Out of Scope

- incluir `facilities_solicitacao_compras`;
- consolidacao final da navegacao/branding do piloto;
- novos endpoints read-side com filtro por workflow;
- mover/renomear uploads no Storage apos criar o request;
- multiupload por campo;
- gateway privado de download;
- migracao das telas antigas;
- transformacao completa de toda a camada cliente do piloto em modulo definitivo compartilhado.

## 9. Criterio de Aceite da Etapa

A Etapa 6 sera considerada concluida quando a rota `/pilot/facilities` conseguir operar, na mesma superficie, os workflows `facilities_manutencao_solicitacoes_gerais` e `facilities_solicitacao_suprimentos`, incluindo abertura do workflow 2 com upload funcional de `anexo_planilha`, sem dependencia do frontend legado e sem regressao relevante no fluxo ja validado do workflow 1.

## 10. Revision History

| Date | Impact | Summary |
|------|--------|---------|
| `2026-03-30` | `High` | criacao do define da Etapa 6 para habilitar `Solicitacao de Suprimentos` na mesma UI do piloto, consumindo a infraestrutura de upload da Etapa 5 |
| `2026-03-30` | `Medium` | define revisado apos a Etapa 5.1 para tratar a camada generica `src/lib/workflows/upload/*` como pre-condicao ja resolvida, e nao mais como parte do escopo da Etapa 6 |
