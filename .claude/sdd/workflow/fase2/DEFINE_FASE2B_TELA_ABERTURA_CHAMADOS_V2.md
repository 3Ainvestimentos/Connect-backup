# DEFINE: FASE 2B - Nova tela oficial de abertura de chamados v2

> Generated: 2026-04-10
> Status: Ready for staged /design
> Scope: Fase 2 / 2B - superficie oficial de abertura de chamados conectada ao backend v2
> Base roadmap: `docs/workflows_new/fase2/implementation_progress_fase2.md`
> Source brainstorm: `BRAINSTORM_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md`
> Clarity Score: 13/15

## 1. Problem Statement

O usuario final comum ainda nao possui uma superficie oficial para abrir chamados conectada ao backend `workflowTypes_v2` / runtime v2, sendo obrigado a usar a tela legada `/applications` que opera exclusivamente sobre colecoes e contextos antigos, impossibilitando o uso dos workflows ja publicados e ativos no motor novo.

### 1.1. Invariantes canonicos ja fechados

- a nova tela e uma implementacao nova e separada; nao evolui sobre os componentes legados existentes;
- a convivencia com `/applications` deve ser mantida durante rollout e validacao; limpeza do legado fica para etapa posterior;
- a abordagem recomendada e a **Abordagem B** do brainstorm: reimplementar a superficie espelhando o layout legado, mas conectada somente ao motor novo;
- o escopo da 2B cobre apenas o usuario final comum; comportamento especial de admin nao entra nesta iteracao;
- apenas workflows com `active: true` e versao publicada (`latestPublishedVersion != null`) devem aparecer no catalogo;
- o agrupamento visual e por `workflowAreas` (areas operacionais), espelhando a organizacao da tela legada;
- nesta iteracao, a ordenacao de areas e workflows pode permanecer alfabetica; nao vamos reproduzir `workflowOrder` como requisito de produto agora;
- a restricao de acesso por `allowedUserIds` no `WorkflowTypeV2` deve ser respeitada no catalogo;
- abertura de chamados usa `POST /api/workflows/runtime/requests` (use case `openRequest` ja existente);
- uploads pre-abertura usam `POST /api/workflows/runtime/uploads` (fluxo assinado ja existente);
- `Minhas Solicitacoes` usa `GET /api/workflows/read/mine` (read model ja existente);
- a secao `Minhas Solicitacoes` deve espelhar o bloco completo da tela legada atual, preservando a tabela e a acao visual principal;
- detalhe do request do solicitante usa `GET /api/workflows/read/requests/[requestId]` (detalhe rico ja existente);
- o modal de `Minhas Solicitacoes` e estritamente read-only; mesmo que o endpoint de detalhe retorne `permissions`, a UI da 2B nao expoe CTAs operacionais;
- a tela nao funde requests legados e v2 numa mesma listagem.

### 1.2. Decomposicao oficial em 2 builds

Para reduzir risco de execucao e facilitar validacao incremental, a 2B sera implementada em **2 builds**:

#### Build 2B.1 — Catalogo + abertura do chamado

Inclui:
- nova rota v2 separada de `/applications`;
- grid de cards por area;
- modal de selecao quando a area possuir multiplos workflows;
- modal de submissao com formulario dinamico;
- upload de arquivo via fluxo assinado v2;
- abertura efetiva do request via `POST /api/workflows/runtime/requests`;
- feedback de sucesso apos abertura.

Nao inclui:
- secao `Minhas Solicitacoes`;
- tabela de acompanhamento;
- botao do `olho`;
- dialog de detalhe read-only do solicitante.

#### Build 2B.2 — Minhas Solicitacoes + detalhe read-only

Inclui:
- secao completa `Minhas Solicitacoes` na mesma pagina;
- tabela com as mesmas colunas da tela legada;
- botao do `olho` na coluna `Acoes`;
- dialog read-only do request com formData, progresso, timeline e anexos;
- atualizacao da listagem apos abertura de novo chamado.

Depende de:
- Build 2B.1 entregue e estabilizado;
- rota v2 e shell principal da pagina ja existentes.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Usuario final comum | Precisa abrir chamados nos workflows v2 ja publicados, mas a unica superficie disponivel (`/applications`) opera sobre o motor legado, forçando workarounds ou impedindo o uso dos novos workflows | Diaria - sempre que precisa abrir um chamado |
| Usuario final comum | Apos abrir um chamado v2, nao tem uma superficie propria para acompanhar o status das suas solicitacoes no motor novo sem depender de `/gestao-de-chamados` (que e voltada para owners/responsaveis) | Diaria - acompanhamento de solicitacoes |
| Operacao / rollout | Precisa validar que os workflows v2 publicados e ativos sao acessiveis para abertura em superficie oficial antes de desativar a rota legada | Pontual durante rollout |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Nova rota dedicada v2 separada de `/applications` | A pagina e acessivel em rota propria (sugestao: `/solicitacoes`); nao modifica nada na rota legada `/applications`; autenticacao obrigatoria via layout `(app)` |
| M2 | Catalogo de abertura agrupado por areas | A pagina exibe cards agrupados por `workflowAreas`, mostrando apenas workflows v2 com `active: true` e `latestPublishedVersion != null`; a filtragem por `allowedUserIds` respeita o `id3a` do usuario autenticado; nesta iteracao, areas e workflows podem ser ordenados alfabeticamente |
| M3 | Modal de selecao por area quando houver multiplos workflows | Se a area tiver mais de um workflow acessivel, um clique no card da area abre modal de selecao; se tiver exatamente um, abre direto o modal de submissao |
| M4 | Modal de submissao dinamico baseado na versao publicada | O modal renderiza os campos definidos em `fields` da versao publicada usando `DynamicFieldRenderer` (ou equivalente novo); respeita `required`, `type`, `placeholder`, `options`; valida antes de submeter |
| M5 | Upload de arquivos via fluxo assinado v2 | Campos do tipo `file` usam o fluxo de upload assinado existente (`POST /api/workflows/runtime/uploads`) para obter signed URL, transferir o arquivo e persistir a referencia no `formData` |
| M6 | Abertura de chamado via `openRequest` do runtime v2 | Ao submeter o formulario, a tela chama `POST /api/workflows/runtime/requests` com `workflowTypeId`, `formData` e `requesterName`; exibe feedback de sucesso com o `requestId` gerado |
| M7 | Secao `Minhas Solicitacoes` na mesma pagina | A pagina inclui a secao completa `Minhas Solicitacoes` via `GET /api/workflows/read/mine`, preservando o mesmo papel visual da tela legada |
| M7.1 | Colunas da tabela de `Minhas Solicitacoes` devem permanecer as mesmas da tela legada | A tabela mantem as colunas `#`, `Tipo`, `Status`, `Previsao de Conclusao` e `Acoes`, na mesma ordem geral da tela atual |
| M7.2 | Acao principal da tabela continua sendo o botao do `olho` | A coluna `Acoes` continua usando o botao visual do `olho` para abrir o detalhe read-only da solicitacao |
| M8 | Detalhe somente leitura do request do solicitante | Ao clicar em um item de `Minhas Solicitacoes`, um dialog exibe o detalhe do request via `GET /api/workflows/read/requests/[requestId]` com dados do formulario, progresso de etapas, timeline e anexos; a UI da 2B ignora quaisquer `permissions` operacionais retornadas pelo endpoint e nao renderiza nenhum CTA de assign, requestAction, respondAction, finalize, archive ou equivalente |
| M9 | Implementacao nova sem dependencia de contexts legados | Nenhum componente da 2B importa `ApplicationsContext`, `WorkflowsContext` ou componentes de `src/components/applications/`; toda a comunicacao e via API routes do runtime/read v2 |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Visual essencialmente igual ao layout legado | O grid de areas, modais e tabela seguem o mesmo padrao visual de `/applications` para manter familiaridade; divergencias cosmeticas menores sao aceitaveis |
| S1.1 | Ordenacao simples e previsivel no primeiro corte | Areas e workflows podem seguir ordenacao alfabetica nesta iteracao; reproduzir `workflowOrder` ou uma ordem manual explicita fica para evolucao futura caso isso vire requisito |
| S1.2 | `Minhas Solicitacoes` preserva a identidade visual da tabela legada | O card, cabecalho, tabela e botao do `olho` seguem o mesmo padrao visual atual, trocando apenas a fonte de dados para o motor v2 |
| S2 | Endpoint dedicado de catalogo para abertura | Um endpoint server-side agrega `workflowAreas` + `workflowTypes_v2` (filtrados por `active + published + allowedUserIds`) + `fields` da versao publicada, evitando multiplas chamadas do cliente |
| S3 | Feedback de estado (loading, empty, error) em todos os blocos | Grid de areas, modal de submissao e `Minhas Solicitacoes` exibem skeletons, empty states e mensagens de erro consistentes |
| S4 | Toast de confirmacao apos abertura | Apos submissao bem-sucedida, exibir toast com `requestId` e redirecionar foco para `Minhas Solicitacoes` |
| S5 | Agrupamento mensal em `Minhas Solicitacoes` | A listagem agrupa por `submittedMonthKey` conforme o read model ja retorna (`groups`) |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Badge de SLA no item de `Minhas Solicitacoes` | Exibir indicador visual de `on_track`, `at_risk` ou `overdue` quando disponivel no summary |
| C2 | Busca/filtro rapido na listagem de `Minhas Solicitacoes` | Campo de texto para filtrar por `requestId` ou `workflowName` no lado do cliente |
| C3 | Icones por area no grid de cards | Exibir o icone configurado da area (campo `icon` do `workflowAreas`) no card visual |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Substituir ou desativar `/applications` | O legado permanece intacto durante rollout; a desativacao entra em etapa de hardening futura |
| W2 | Fusao de requests legados e v2 na mesma listagem | Complexidade de unificacao sem beneficio imediato; cada motor tem sua superficie |
| W3 | Comportamento especial de admin na tela de abertura | Admin opera via `/gestao-de-chamados` (2A) e `/admin/request-config` (2E); a 2B e exclusiva do usuario final |
| W4 | Fluxos externos/iframe (ex: TI) | Tratamento especial de workflows que hoje abrem superficies externas fica para evolucao futura |
| W5 | Design system compartilhado entre legado e v2 | Abordagem C do brainstorm descartada; extrair componentes visuais comuns e escopo de refatoracao posterior |
| W6 | Navegacao paralela complexa entre v2 e legado | Cada rota opera independentemente; nao havera tabs ou switcher que unifique as duas |
| W7 | Analytics ou metricas de abertura | Instrumentacao de analytics/telemetria fica para evolucao posterior |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Catalogo reflete estado real | 100% dos workflows v2 ativos e publicados aparecem para usuarios permitidos | Comparar output do endpoint de catalogo com query direta no Firestore |
| Abertura funcional ponta a ponta | Chamado aberto via 2B aparece em `/gestao-de-chamados` como request v2 valido | Abrir chamado, verificar que `requestId` existe em `workflows_v2` e aparece na gestao |
| Upload funcional | Campos `file` submetidos via signed URL persistem corretamente | Abrir chamado com anexo, verificar que `formData` contem URL valida do Storage |
| `Minhas Solicitacoes` atualiza apos abertura | Novo chamado aparece na listagem em ate 5 segundos apos abertura | Verificar que `invalidateQueries` ou refetch ocorre apos mutacao |
| Isolamento do legado | Zero regressoes em `/applications` | Build e testes existentes passam sem modificacao |
| Restricao de acesso respeitada | Usuario sem permissao nao ve workflow restrito | Autenticar com usuario fora de `allowedUserIds` e confirmar ausencia do workflow no catalogo |
| Detalhe do solicitante | Dialog exibe formData, progresso, timeline e anexos do request | Abrir detalhe de request existente e verificar cada secao renderizada |

## 5. Technical Scope

### 5.1. Scope por build

| Build | Entregas principais | Fora do corte |
|------|----------------------|---------------|
| `2B.1` | rota v2, catalogo de areas, selecao de workflow, submission modal, renderer dinamico, upload assinado, `openRequest`, toast de sucesso | `Minhas Solicitacoes`, botao do olho, detalhe read-only |
| `2B.2` | `Minhas Solicitacoes`, tabela com colunas legadas, botao do olho, dialog read-only, refetch/invalidation apos abertura | alteracoes no fluxo de submissao alem do necessario para integracao com a listagem |

### Backend / API Routes

| Component | Change Type | Details |
|-----------|------------|---------|
| `GET /api/workflows/runtime/catalog` (ou `/api/workflows/read/catalog`) | Create | Endpoint de catalogo de abertura: agrega `workflowAreas` + `workflowTypes_v2` filtrados por `active + published + allowedUserIds` do ator; retorna areas com seus workflows e `fields` da versao publicada para renderizacao do formulario |
| `POST /api/workflows/runtime/requests` | None | Ja existe; usado para `openRequest` |
| `POST /api/workflows/runtime/uploads` | None | Ja existe; usado para upload pre-abertura |
| `GET /api/workflows/read/mine` | None | Ja existe; usado para `Minhas Solicitacoes` |
| `GET /api/workflows/read/requests/[requestId]` | None | Ja existe; usado para detalhe do request, com consumo estritamente read-only na UI da 2B |

### Backend / Lib

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/catalog/` (ou similar) | Create | Logica server-side de montagem do catalogo: query de areas, query de `workflowTypes_v2` filtrados, resolucao de versao publicada e campos |
| `src/lib/workflows/runtime/use-cases/resolve-published-version.ts` | None | Ja existe; reutilizado pelo catalogo para buscar `fields` da versao |

### Frontend / Pages

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/app/(app)/solicitacoes/page.tsx` (rota sugerida) | Create | Server component shell da nova pagina; dentro do grupo `(app)` para autenticacao no layout |
| `src/components/workflows/requester/` (ou `src/components/requests-v2/`) | Create | Diretorio dos componentes da 2B |

### Frontend / Components (novos)

| Component | Change Type | Details |
|-----------|------------|---------|
| `RequestsV2Page.tsx` (client shell) | Create | Shell principal: carrega catalogo, gerencia estado de modais, renderiza grid de areas + `Minhas Solicitacoes` |
| `WorkflowAreaGrid.tsx` | Create | Grid responsivo de cards por area; clique abre modal de selecao ou submissao conforme quantidade de workflows |
| `WorkflowAreaCard.tsx` | Create | Card individual por area com nome, icone e contagem de workflows |
| `WorkflowSelectionModal.tsx` | Create | Modal de selecao quando a area tem multiplos workflows; lista nome + descricao de cada workflow |
| `WorkflowSubmissionModal.tsx` (v2) | Create | Modal de submissao com formulario dinamico baseado em `fields` da versao publicada; renderiza campos via `DynamicFieldRenderer` (adaptado do piloto ou reimplementado); upload via signed URL; validacao com react-hook-form + zod |
| `DynamicFieldRenderer.tsx` (v2) | Create | Renderer de campo dinamico para `text`, `textarea`, `select`, `date`, `date-range`, `file`; pode ser baseado no existente em `src/components/pilot/facilities/DynamicFieldRenderer.tsx` |
| `MyRequestsV2Section.tsx` | Create | Secao `Minhas Solicitacoes` completa, espelhando a tabela legada com colunas `#`, `Tipo`, `Status`, `Previsao de Conclusao` e `Acoes` |
| `MyRequestDetailDialog.tsx` | Create | Dialog somente leitura aberto pelo botao do `olho`: formData, progresso de etapas, timeline, anexos |

### Frontend / Hooks e API Client

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/requester/api-client.ts` (ou similar) | Create | Funcoes `fetchCatalog`, `openRequest`, `uploadFile`, `fetchMyRequests`, `fetchRequestDetail` chamando as API routes |
| `src/hooks/use-requester-workflows.ts` (ou similar) | Create | Hook TanStack Query que orquestra catalogo, mutacao de abertura, lista de requests e detalhe; expoe queries e mutations |

### Database / Firestore

| Model | Change Type | Details |
|-------|------------|---------|
| `workflowAreas` | None | Leitura para agrupamento visual; colecao ja existente |
| `workflowTypes_v2` | None | Leitura filtrada por `active + latestPublishedVersion != null + allowedUserIds`; colecao ja existente |
| `workflowTypes_v2/{id}/versions/{version}` | None | Leitura da versao publicada para obter `fields`; colecao ja existente |
| `workflows_v2` | None | Escrita via `openRequest` e leitura via read model; colecao ja existente |
| `counters/workflowCounter_v2` | None | Incremento atomico via `createRequestTransactionally`; ja existente |

### Storage

| Component | Change Type | Details |
|-----------|------------|---------|
| Upload de anexos | None | Usa o fluxo assinado existente via `POST /api/workflows/runtime/uploads` com namespace `Workflows/workflows_v2/uploads/...` |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Autenticacao | Firebase Auth obrigatoria; layout `(app)` garante sessao ativa antes de renderizar a pagina |
| Identidade operacional | Todas as chamadas de API usam `authenticateRuntimeActor` que resolve `authUid` para `id3a` via colecao de colaboradores |
| Restricao de catalogo | O endpoint de catalogo filtra `workflowTypes_v2` por `allowedUserIds` server-side; se o array contem `"all"`, todos os usuarios autenticados veem; caso contrario, apenas usuarios cujo `id3a` consta no array |
| Autorizacao de abertura | `assertCanOpen` no runtime valida `allowedUserIds` antes de criar o request; mesmo que o frontend filtre, o backend e o gate canonico |
| Isolamento de dados | `Minhas Solicitacoes` retorna apenas requests onde `requesterUserId === actor.actorUserId`; detalhe valida que o ator e participante operacional do request, mas a UI da 2B consome esse retorno em modo estritamente read-only |
| Upload seguro | Signed URLs geradas server-side com namespace restrito e validacao de metadata; nenhum upload direto do cliente ao Storage |
| Sanitizacao | `formData` passa por `normalizeFormData` e `cleanDataForFirestore` antes de persistir |

## 7. Out of Scope

- Substituir, modificar ou desativar a rota legada `/applications`
- Fundir requests legados e v2 em listagem unica
- Comportamento especial de admin na tela de abertura (admin usa `/gestao-de-chamados` e `/admin/request-config`)
- Fluxos externos/iframe hoje existentes no legado (ex: TI com superficie propria)
- Extrair design system compartilhado entre legado e v2
- Navegacao ou switcher que unifique as rotas legacy e v2
- Analytics, metricas ou instrumentacao de telemetria
- Reabertura, cancelamento ou edicao de chamados ja abertos
- Notificacoes push/email para confirmacao de abertura
- Suporte a rascunho de formulario (salvar sem submeter)
- Refatorar `WorkflowAreasContext` ou `ApplicationsContext`

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| Backend runtime v2 (`openRequest`, uploads, read model) | Internal | Ready - entregue na Fase 1 e Fase 2D |
| Colecao `workflowTypes_v2` com workflows publicados e ativos | Internal | Ready - entregue na 2C (30 workflows seedados) |
| Colecao `workflowAreas` com areas operacionais | Internal | Ready - ja existente no Firestore |
| Read model `mine` e `detail` | Internal | Ready - entregue na Fase 1 e refinado na 2A |
| Upload via signed URL | Internal | Ready - entregue na Fase 1 |
| Layout `(app)` com autenticacao | Internal | Ready - ja existente |
| `AuthContext` com `id3a` e permissoes | Internal | Ready - ja existente |
| Enablement dos lotes 4 e 5 da 2C | Internal | Pendente - smoke de enablement recomendado antes do rollout da 2B, mas nao bloqueia desenvolvimento |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Problema preciso com contexto: tela legada nao conecta ao motor v2, impedindo uso de workflows ja publicados |
| User identification | 3 | Usuario final comum com pain points especificos de abertura e acompanhamento; operacao como ator secundario de validacao |
| Success criteria measurability | 3 | Criterios objetivos e verificaveis: catalogo correto, abertura ponta a ponta, upload, isolamento, detalhe |
| Technical scope definition | 3 | Endpoints, componentes, hooks, colecoes e contratos identificados com precisao; APIs existentes mapeadas |
| Edge cases considered | 1 | Casos de borda parcialmente cobertos: area sem workflows ativos, workflow sem campos, erro de rede durante upload, usuario sem acesso a nenhum workflow, concorrencia de `requestId`. Falta fechar: tratamento de workflows TI/iframe, behavior com `allowedUserIds` vazio vs `["all"]`, timeout de upload longo, formulario com muitos campos (scroll/UX). O design deve detalhar esses cenarios |
| **TOTAL** | **13/15** | Suficiente para prosseguir ao /design |

## 10. Pontos para fechamento no /design

1. **Rota oficial exata**: confirmar `/solicitacoes` ou alternativa (`/chamados`, `/requests-v2`)
2. **Contrato do endpoint de catalogo**: shape exato do response, estrategia de cache, se inclui `fields` inline ou lazy
3. **Tratamento de area sem workflows acessiveis**: ocultar card ou exibir com empty state
4. **Comportamento com `allowedUserIds` vazio**: se array vazio = ninguem tem acesso ou se trata como `["all"]`
5. **Tratamento de workflows TI/iframe**: se aparecem no catalogo com badge "externo" ou se sao filtrados
6. **Estrategia de invalidacao de cache**: apos abertura, como atualizar `Minhas Solicitacoes` (refetch, invalidate, optimistic)
7. **Limite de items em `Minhas Solicitacoes`**: paginacao, scroll infinito ou limite fixo
8. **Formulario longo**: scroll interno no modal ou modal full-screen para workflows com muitos campos
9. **Reaproveitamento do `DynamicFieldRenderer`**: copiar do piloto, extrair para shared ou reimplementar

## 11. Next Step

Ready for staged design:

1. `/design FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2`
2. `/design FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2`

O design-mae continua como referencia do escopo total, mas os builds oficiais para execucao ficam divididos nesses dois cortes.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-10 | define-agent | Initial requirements from BRAINSTORM_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md |
