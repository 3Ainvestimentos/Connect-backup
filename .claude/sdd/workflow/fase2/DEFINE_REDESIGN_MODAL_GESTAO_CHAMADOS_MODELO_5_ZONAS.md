# DEFINE: Redesign do modal de `/gestao-de-chamados` para o modelo de 5 zonas

> Generated: 2026-04-17
> Status: Ready for /design
> Scope: Refatoracao do detalhe oficial de `/gestao-de-chamados` para alinhar frontend, payload e read-side ao modelo de 5 zonas
> Source document: `BRAINSTORM_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md`
> Clarity Score: 15/15

## 1. Problem Statement

O modal oficial de detalhe em `/gestao-de-chamados` ja opera com contrato e regras consolidadas, mas ainda distribui cabecalho, acao atual, historico e dados enviados em uma composicao que nao corresponde ao modelo de produto de 5 zonas nem sustenta historico por etapa de forma oficial.

---

## 2. Users

### 2.1. Owner do workflow

Pain points:

- precisa enxergar rapidamente numero do chamado, status macro, etapa atual e quem esta com a proxima responsabilidade;
- hoje precisa navegar entre hero operacional, action card e painel administrativo para compor mentalmente a "acao atual";
- depende de historico confiavel por etapa para auditar o que ja aconteceu sem inferencia frouxa no frontend.

Frequencia:

- recorrente, na operacao diaria de gestao de chamados.

### 2.2. Responsavel atual do chamado

Pain points:

- precisa entender sem ambiguidade se deve avancar, finalizar, solicitar action ou apenas acompanhar;
- sofre quando a interface separa a prioridade operacional em mais de um bloco e enfraquece a leitura do proximo passo;
- precisa consultar historico e dados enviados sem alternar entre cards pouco conectados.

Frequencia:

- recorrente, durante processamento operacional das etapas.

### 2.3. Destinatario de action pendente

Pain points:

- precisa identificar imediatamente que a prioridade do modal e responder a action da etapa atual;
- depende de uma zona de acao atual que deixe claro o contexto da etapa e o que acontece apos a resposta;
- precisa consultar comentarios e anexos ligados a etapa sem depender de uma timeline linear pouco contextual.

Frequencia:

- pontual por chamado, mas critica quando ocorre.

### 2.4. Produto / UX / Engenharia

Pain points:

- precisam que o modal reflita o modelo de produto de 5 zonas sem reinventar regras de runtime ja fechadas;
- precisam reduzir heuristica de agrupamento no cliente, principalmente no historico por etapa;
- precisam preservar o principio de que o modal deve ser guiado pelo payload oficial, e nao por regra inferida localmente.

Frequencia:

- pontual nesta refatoracao, com impacto permanente na manutencao.

---

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | O modal deve ser reorganizado explicitamente nas 5 zonas desejadas | O detalhe passa a apresentar, em um unico fluxo visual, `cabecalho do chamado`, `resumo do chamado`, `acao atual`, `historico por etapa` e `dados enviados` |
| M2 | O cabecalho deve comunicar o contexto executivo do chamado | O topo do modal exibe pelo menos `requestId`, nome do workflow/tipo, status macro e nome da etapa atual sem depender apenas do `DialogDescription` atual |
| M3 | A zona de resumo deve expor metadados amigaveis e operacionais | O resumo expoe `areaLabel: string` resolvido no read-side por lookup server-side em `workflowAreas`, usando `areaId` como chave canonica. Fallback: quando a area nao existir ou nao puder ser resolvida, o campo expoe `areaId` como valor. O campo nunca e `undefined`. O bootstrap de management nao e fonte de verdade para esse dado. Outros metadados do resumo (solicitante, responsavel, datas e owner) sao preservados |
| M4 | A zona `acao atual` deve consolidar a leitura do proximo passo sem alterar regras de permissao | A experiencia passa a comunicar em uma unica superficie perceptiva o que hoje esta repartido entre hero, action e parte administrativa, preservando `canAdvance`, `canFinalize`, `canRequestAction`, `canRespondAction`, `canAssign` e `canArchive` conforme payload oficial |

**Comportamento da zona `acao atual` por perfil:**

| Perfil | Prioridade visual na zona | CTAs presentes |
|--------|--------------------------|----------------|
| Destinatario de action pendente | Responder action (`canRespondAction`) | `respondAction` em destaque |
| Responsavel atual (sem action pendente) | Avancar ou finalizar (`canAdvance`/`canFinalize`) | `advance` ou `finalize` + `requestAction` se disponivel |
| Owner sem responsavel atribuido | Atribuir responsavel (`canAssign`) | `assign` em destaque |
| Owner com responsavel (sem action pendente) | Operacao da etapa | `advance`/`finalize` + `requestAction` se disponivel |
| Leitura autorizada (sem permissao operacional) | Estado do chamado | Nenhum CTA mutavel |

> **Nota:** `canArchive` permanece visivel mas rebaixado — nao compete com a operacao da etapa. Regras de permissao de `permissions.*` permanecem inalteradas.
| M5 | O detalhe oficial deve sustentar historico agrupado por etapa | O detalhe oficial passa a expor `stepsHistory[]`, onde cada item contem: estado e metadados da etapa vindos de `progress.items`; eventos da timeline cujo `details.stepId` corresponde a etapa; e respostas de action (`actionRequests`) scoped ao `stepId` da etapa, incluindo `responseComment` e `responseAttachmentUrl` com as mesmas regras de visibilidade existentes. Etapas sem eventos ou sem action responses expoem listas vazias — sem fallback heuristico. Eventos sem `details.stepId` ficam fora de `stepsHistory` nesta rodada e permanecem visiveis apenas na `timeline` legada durante a transicao. "Comentarios livres de etapa" nao existem no dominio atual e estao fora do escopo desta rodada |

**Shape canonico aprovado para `stepsHistory` — entrada para o /design:**

```ts
// Shape canonico aprovado para stepsHistory — entrada para o /design
stepsHistory: Array<{
  stepId: string;
  stepName: string;
  kind: 'start' | 'work' | 'final';
  order: number;
  state: 'pending' | 'active' | 'completed' | 'skipped';
  isCurrent: boolean;
  events: Array<{
    action: HistoryAction;
    label: string;
    timestamp: TimestampLike;
    userId: string;
    userName: string;
  }>;
  actionResponses: Array<{
    actionRequestId: string;
    recipientUserId: string;
    status: WorkflowActionRequestStatus;
    respondedAt: TimestampLike;
    respondedByUserId: string | null;
    respondedByName: string | null;
    responseComment?: string;
    responseAttachmentUrl?: string;
  }>;
}>
```
| M6 | A zona `dados enviados` deve consolidar formulario e anexos de abertura | Campos enviados e anexos do formulario original passam a ser apresentados como uma unica zona de leitura, com affordances explicitas para visualizar e baixar anexos quando aplicavel |
| M7 | A refatoracao deve seguir rollout compativel | Durante a transicao, o payload pode manter `progress` e `timeline` atuais em paralelo ao novo bloco agrupado por etapa, evitando regressao brusca no modal e nos testes do read-side. Todos os novos campos adicionados a `WorkflowRequestDetailData` e `WorkflowManagementRequestDetailData` devem ser opcionais (`?`) ate que todos os consumidores sejam atualizados. O Build 1 nao remove nem modifica nenhum campo existente do contrato. O espelho `WorkflowManagementRequestDetailData` em `src/lib/workflows/management/types.ts` deve ser atualizado simultaneamente ao `WorkflowRequestDetailData`, com variantes `Date` no lugar de `TimestampLike` |
| M8 | O escopo desta rodada permanece restrito ao modal de `/gestao-de-chamados` | Nenhuma rota nova e nenhum novo entrypoint de detalhe sao introduzidos nesta iteracao |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | O historico por etapa deve distinguir anexos do formulario de anexos/comentarios de etapa | O contrato deixa claro quais anexos pertencem a submissao original e quais pertencem a interacoes operacionais da etapa |
| S2 | O frontend deve consumir um view model mais proximo do desenho final | A composicao do modal reduz a necessidade de juntar manualmente `RequestProgress`, `RequestTimeline`, `RequestAttachments` e `RequestFormData` como cards independentes |
| S3 | O novo contrato deve preservar compatibilidade observavel com testes e consumidores atuais durante a migracao | Suites de contrato e detalhe continuam passando com extensoes controladas, sem remover imediatamente campos ja publicados |
| S4 | O modal deve manter leitura clara para os tres perfis operacionais simultaneamente | Owner, responsavel e destinatario de action continuam entendendo o seu papel sem ambiguidade nem CTA indevido |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Enriquecer `summary` com metadados adicionais amigaveis alem de `areaLabel` | Campos como nome amigavel do owner podem ser incluidos se vierem quase de graca, sem ampliar escopo de permissao |
| C2 | Introduzir componentes dedicados para as novas zonas, se isso simplificar manutencao | O modal pode extrair novos blocos focados em `step history` ou `submitted data`, desde que sem refatoracao lateral desnecessaria |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Redesenhar o runtime de `advance`, `finalize`, `requestAction`, `respondAction` ou `archive` | As regras operacionais ja foram endurecidas e nao sao o alvo desta rodada |
| W2 | Convergir agora o modal de `/solicitacoes` com o modal de `/gestao-de-chamados` | O brainstorm delimitou `/gestao-de-chamados` como unico alvo |
| W3 | Criar engine generica de timeline para toda a aplicacao | Escopo excessivo para uma necessidade localizada do detalhe oficial |
| W4 | Introduzir nova permissao, novo papel de negocio ou bypass de ownership | Owner, responsavel e destinatario de action ja cobrem o dominio necessario |
| W5 | Fazer limpeza definitiva imediata de `progress` e `timeline` legados | A estrategia recomendada e de transicao controlada, nao de corte abrupto |

---

## 4. Fases de Entrega

Esta refatoracao e entregue em dois builds independentes, com criterio de separacao claro: Fase 1 nao toca componentes React; Fase 2 nao toca `detail.ts` nem o contrato de leitura.

### Fase 1 — Build: Payload Enriquecido
**Dependencia:** nenhuma — pode iniciar imediatamente
**Escopo:**
- Adicionar `stepsHistory[]` ao detalhe oficial com shape canonico aprovado em M5
- Adicionar `areaLabel` ao summary conforme M3
- Todos os novos campos sao opcionais ate Fase 2 ser concluida
- `progress` e `timeline` preservados em paralelo durante a transicao

**Arquivos exclusivos desta fase:**
- `src/lib/workflows/read/detail.ts`
- `src/lib/workflows/read/types.ts`
- `src/lib/workflows/management/types.ts`
- `src/lib/workflows/read/queries.ts` (se necessario)
- Testes de contrato em `src/lib/workflows/read/__tests__/`

### Fase 2 — Build: Shell de 5 Zonas
**Dependencia:** Fase 1 concluida e validada
**Escopo:**
- Reorganizar `RequestDetailDialog` para as 5 zonas explicitas
- Atualizar view model, `RequestOperationalHero`, `RequestActionCard`, `RequestAdministrativePanel`
- Consumir `stepsHistory` e `areaLabel` do payload enriquecido

**Arquivos exclusivos desta fase:**
- `src/components/workflows/management/RequestDetailDialog.tsx`
- `src/components/workflows/management/RequestOperationalHero.tsx`
- `src/components/workflows/management/RequestActionCard.tsx`
- `src/components/workflows/management/RequestAdministrativePanel.tsx`
- `src/lib/workflows/management/request-detail-view-model.ts`
- Testes de componente em `src/components/workflows/management/__tests__/`

---

## 5. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Modal alinhado ao modelo de 5 zonas | As 5 zonas passam a existir de forma explicita e reconhecivel no detalhe oficial | Testes de componente + validacao visual do dialog |
| Cabecalho executivo completo | O topo sempre informa `requestId`, workflow/tipo, status macro e etapa atual | Testes de renderizacao do modal |
| Resumo sem IDs crus quando houver label oficial | `areaId` deixa de ser a apresentacao primaria do campo de area no detalhe | Testes de contrato/read-side + teste de componente |
| Historico por etapa oficial | O payload exposto pelo read-side inclui agrupamento por etapa com eventos, comentarios e anexos ligados a `stepId` | Testes de contrato/read-side e fixtures de detalhe |
| Acao atual unificada sem regressao funcional | A UI comunica a prioridade operacional em uma zona unica, mantendo a matriz de permissoes oficial | Testes de `request-detail-view-model`, `RequestDetailDialog` e `RequestActionCard` |
| Dados enviados consolidados | Campos e anexos de abertura passam a ser consumidos e renderizados dentro da mesma zona | Testes de componente do detalhe |
| Rollout compativel | `progress` e `timeline` podem coexistir com o novo bloco durante a migracao sem quebrar consumidores atuais | Testes de contrato da API/read-side e cobertura do modal |

---

## 6. Technical Scope

### Backend / API

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/app/api/workflows/read/requests/[requestId]/route.ts` | Preserve / extend | Continuar expondo o detalhe oficial do request, incorporando o novo shape agrupado por etapa sem criar endpoint paralelo |
| `src/lib/workflows/read/detail.ts` | Modify | Enriquecer o builder do detalhe para produzir resumo amigavel e um bloco oficial de historico por etapa, mantendo compatibilidade temporaria com `progress` e `timeline` |
| `src/lib/workflows/read/types.ts` | Modify | Evoluir os tipos do detalhe oficial para refletir o novo bloco de historico por etapa e os metadados amigaveis adicionais do resumo |
| `src/lib/workflows/read/queries.ts` e `src/lib/workflows/read/filters.ts` | Preserve / extend if needed | Ajustar apenas o necessario para manter consistencia do summary oficial e propagar `areaLabel` quando resolvido no read-side |
| `src/lib/workflows/read/detail.ts` e helper server-side de lookup de areas | Modify | Resolver `areaLabel` no servidor a partir da colecao `workflowAreas`, desacoplado do bootstrap de management e reutilizavel por qualquer consumidor da rota de detalhe |

### Frontend

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | Reorganizar o shell do modal para as 5 zonas oficiais e trocar a composicao atual baseada em cards separados |
| `src/components/workflows/management/RequestOperationalHero.tsx` | Modify / absorb | Reposicionar ou incorporar a semantica do hero dentro da nova zona `acao atual` |
| `src/components/workflows/management/RequestActionCard.tsx` | Modify | Continuar sendo a superficie oficial de `requestAction/respondAction`, mas dentro da nova leitura unificada de acao atual |
| `src/components/workflows/management/RequestAdministrativePanel.tsx` | Modify | Reencaixar atribuicao/arquivamento na experiencia de `acao atual` sem virar uma zona concorrente ao proximo passo principal |
| `src/components/workflows/management/RequestProgress.tsx` e `src/components/workflows/management/RequestTimeline.tsx` | Refactor / deprecate in modal | Servem como fontes temporarias ou pontos de transicao enquanto o novo historico por etapa assume o protagonismo |
| `src/components/workflows/management/RequestFormData.tsx` e `src/components/workflows/management/RequestAttachments.tsx` | Modify / merge in modal | Consolidar leitura de campos enviados e anexos do formulario original em uma mesma zona de `dados enviados` |
| `src/lib/workflows/management/request-detail-view-model.ts` | Modify | Atualizar o view model de apresentacao para orientar a nova hierarquia visual e a comunicacao da zona `acao atual` com base no payload oficial |
| `src/lib/workflows/management/types.ts` | Modify | Manter o espelhamento tipado do contrato consumido pelo frontend para suportar summary enriquecido e historico por etapa. Atualizar o espelho `WorkflowManagementRequestDetailData` com os novos campos `stepsHistory` e `areaLabel` usando variantes `Date`, mantendo paridade com `WorkflowRequestDetailData` |

### Database

| Model | Change Type | Details |
|-------|------------|---------|
| Firestore / workflow request documents | None | Nenhuma mudanca de schema ou migracao e requerida; a refatoracao e de leitura, composicao e apresentacao |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Fora do escopo |

### Testing

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/read/__tests__/detail.test.js` | Modify / add | Validar o novo bloco agrupado por etapa, labels amigaveis do resumo e compatibilidade temporaria com o contrato antigo |
| `src/lib/workflows/read/__tests__/read-api-contract.test.js` | Modify / add | Garantir que a rota continua retornando o contrato oficial esperado com os campos novos e a coexistencia transitória necessaria |
| `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | Modify | Cobrir a nova hierarquia de acao atual e a preservacao da matriz de papeis/permissoes |
| `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | Cobrir renderizacao das 5 zonas, cabecalho executivo, dados enviados consolidados e historico por etapa |
| `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` | Preserve / extend | Garantir que `requestAction/respondAction` seguem corretos dentro da nova composicao |

---

## 7. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | O detalhe continua disponivel apenas para usuarios autenticados no grupo `(app)` e dependente do fluxo oficial ja existente |
| Authorization | O read-side continua derivando o que pode ser lido e operado a partir das regras atuais de `assertCanReadRequest`, ownership, responsabilidade atual e action pendente |
| User Isolation | O novo historico por etapa nao pode introduzir vazamento de eventos, comentarios ou anexos para usuarios que hoje nao podem ler o request |
| Attachment Visibility | A refatoracao deve preservar a restricao atual de anexos de resposta de action, que hoje so sao expostos para owner ou responsavel quando aplicavel |
| Input Validation | Novos campos do contrato de detalhe devem ser montados apenas a partir de dados oficiais do request/version, sem heuristica fraca no frontend para inferir permissoes ou ownership |

---

## 8. Out of Scope

- alterar as regras canonicas de continuidade (`advance`, `finalize`, `requestAction`, `respondAction`, `archive`);
- criar rota nova de detalhe ou modal paralelo;
- redesenhar outras telas de workflow, incluindo `/solicitacoes`, `/me/tasks` ou historico admin;
- introduzir schema novo em Firestore, migracoes ou reprocessamento massivo de historico;
- criar sistema generico transversal de timeline/historico para todo o produto;
- adicionar nova permissao ou novo papel de negocio para suportar a UI.

---

## 9. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md` | Internal | Ready |
| Endurecimento de continuidade entregue no commit `57f676516c9566b60290e5975059d4f22f69071b` | Internal | Ready |
| Shell visual atual do modal entregue no commit `a132a9c15424474a126500d1ca7d47cedd741322` | Internal | Ready |
| Contrato oficial atual de detalhe (`summary`, `permissions`, `formData`, `attachments`, `progress`, `action`, `timeline`) | Internal | Ready |
| Suites de read-side e modal em `src/lib/workflows/read/__tests__` e `src/components/workflows/management/__tests__` | Internal | Ready |

---

## 10. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | O gap entre shell atual e modelo de 5 zonas esta delimitado funcionalmente e visualmente, com foco especial no historico por etapa |
| User identification | 3 | Owner, responsavel, destinatario de action e manutencao/produto foram identificados com dores concretas |
| Success criteria measurability | 3 | Os criterios podem ser medidos por suites de contrato, testes de componente e verificacao objetiva das 5 zonas e do novo payload |
| Technical scope definition | 3 | O escopo identifica rota, read-side, tipos, view model, componentes do modal e testes impactados |
| Edge cases considered | 3 | Compatibilidade transitoria, anexos de action, tres perfis operacionais e distincao entre anexos de formulario e de etapa foram considerados |
| **TOTAL** | **15/15** | Ready for /design |

---

## 11. Next Step

Ready for `/design REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS` para detalhar:

- shape canonico do novo bloco de historico por etapa no detalhe oficial;
- contrato de summary enriquecido com labels amigaveis;
- composicao exata das 5 zonas no `RequestDetailDialog`;
- estrategia de transicao entre `progress/timeline` legados e o novo modelo agrupado;
- matriz de testes por papel operacional e por estado do detalhe.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex (`define` skill) | Initial requirements for redesigning the official management modal to the 5-zone model based on the approved brainstorm |
| 1.1 | 2026-04-17 | iterate-agent | M7: expanded AC with optional fields, no-removal guarantee and simultaneous mirror update rule. M5: replaced AC with canonical `stepsHistory` shape including `actionResponses` and explicit no-fallback rule; added approved TypeScript shape block. M3: replaced AC with `areaLabelById` map resolution, `areaId` fallback and never-undefined guarantee; added `queries.ts` backend scope row for `mapWorkflowRequestToReadSummary`. M4: added per-profile behavior table for the `acao atual` zone with CTA matrix and `canArchive` demotion note. Added section 4 "Fases de Entrega" with Fase 1 (Payload Enriquecido) and Fase 2 (Shell de 5 Zonas) scope and file boundaries; renumbered sections 5-11. Frontend scope row for `management/types.ts` expanded with `stepsHistory`/`areaLabel` mirror detail. |
