# DEFINE: FASE 2D - Motor operacional de `requestAction` / `respondAction`

> Generated: 2026-04-06
> Status: Approved for design
> Scope: Fase 2 / 2D - suporte operacional action-driven no runtime v2 e na tela oficial de gestao
> Base roadmap: `docs/workflows_new/fase2/ROADMAP_FASE2.md`
> Source brainstorm: `BRAINSTORM_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
> Clarity Score: 14/15

## 1. Problem Statement

O runtime v2 e a tela oficial `/gestao-de-chamados` ja conhecem o estado `waiting_action`, mas ainda nao existe um contrato operacional e auditavel para abrir pendencias de action, autorizar a resposta do destinatario e registrar a resolucao sem quebrar a semantica canonica da etapa atual.

### 1.1. Invariantes canonicos ja fechados

- responder uma action nao avanca etapa automaticamente;
- a primeira resposta operacional deve acontecer na superficie oficial `/gestao-de-chamados`;
- a `2D` entra com os tres tipos do contrato atual:
  - `approval`
  - `acknowledgement`
  - `execution`
- `requestAction` nasce de forma **explicita** na stack oficial;
- se a etapa atual tiver `action`, o responsavel atual pode disparar a solicitacao por CTA oficial na gestao;
- os destinatarios da pendencia nao sao escolhidos manualmente no momento da solicitacao;
- todos os usuarios predefinidos em `approverIds` na etapa atual devem receber a solicitacao;
- para a `2D`, etapa com `action` sem `approverIds` e uma configuracao invalida para operacao e `requestAction` deve falhar explicitamente com erro de configuracao;
- o request so retorna de `waiting_action` para `in_progress` quando **todos** os destinatarios configurados da etapa atual tiverem respondido;
- o ator principal da primeira entrega e o destinatario da action;
- owner e responsavel entram como atores observadores e operacionais relevantes, mas nao como substitutos silenciosos do destinatario;
- `approval = rejected` nao avanca etapa nem muda responsavel; apenas registra a rejeicao, fecha a pendencia do destinatario e devolve o request ao responsavel para decisao operacional e finalizacao do chamado;
- a rejeicao de `approval` deve aparecer explicitamente na timeline do chamado;
- os tres tipos de action devem aceitar um campo opcional de observacao na resposta;
- `execution` deve aceitar tambem um campo opcional de upload/anexo na resposta do destinatario;
- o objetivo de rollout e desbloquear a habilitacao plena dos lotes `4` e `5` da `2C`, sem antecipar escopo de configuracao da `2E`.
- `approverIds` permanece como nome tecnico comum aos tres tipos, com semantica dependente de `type`:
  - em `approval`, `approverIds` = aprovadores
  - em `acknowledgement`, `approverIds` = destinatarios da ciencia
  - em `execution`, `approverIds` = executores/destinatarios da execucao
- na futura tela de configuracao dos workflows/versoes, etapa com `action` sem `approverIds` deve ser bloqueada com erro explicito de validacao na UI administrativa

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Destinatario da action | Ve a pendencia no read-side, mas ainda nao consegue responder pela tela oficial nem ter garantia de autorizacao e auditoria server-side | Recorrente em todo workflow action-driven |
| Responsavel atual do chamado | Precisa solicitar a action e retomar o controle depois da resposta sem perder coerencia de etapa, responsavel e historico | Recorrente em fluxos com aprovacao, ciencia ou execucao |
| Owner / operacao de workflows | Precisa acompanhar o estado da pendencia e habilitar os workflows dos lotes `4` e `5` sem workaround legado ou leitura opaca | Recorrente durante rollout e operacao |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Definir um contrato comum de pendencia de action no `workflows_v2` | Cada pendencia aberta identifica pelo menos etapa atual, tipo de action, destinatario(s), status da pendencia, timestamps e payload minimo de resposta, sem criar colecao operacional paralela fora do request; etapa com `action` sem `approverIds` nao pode abrir pendencia e deve falhar como configuracao invalida |
| M2 | Implementar `requestAction` como caso de uso transacional do runtime | Ao abrir a pendencia por CTA explicito do responsavel na etapa atual, o request permanece na mesma etapa, preserva `currentStepId/currentStepName/currentStatusKey`, entra em `waiting_action`, abre pendencia para todos os `approverIds` configurados na action da etapa e registra historico auditavel |
| M3 | Implementar `respondAction` com autorizacao estrita do destinatario | Apenas usuario com pendencia aberta para a etapa atual consegue responder; tentativa de nao destinatario, pendencia fechada ou request finalizado/arquivado falha explicitamente |
| M4 | Suportar `approval`, `acknowledgement` e `execution` na mesma iteracao | `approval` aceita `approved/rejected`, `acknowledgement` aceita `acknowledged` e `execution` aceita `executed`; os tres tipos aceitam observacao opcional; `execution` aceita upload/anexo opcional na resposta do destinatario e valida comentario/anexo quando a definicao exigir |
| M5 | Manter o read model coerente enquanto houver pendencia aberta | `hasPendingActions`, `pendingActionRecipientIds`, `pendingActionTypes` e `statusCategory` refletem exatamente as pendencias abertas da etapa atual |
| M6 | Retornar de `waiting_action` para `in_progress` somente quando nao houver mais pendencias abertas na etapa atual | Ao fechar a ultima pendencia aberta entre todos os `approverIds` configurados para a etapa atual, o request volta para `in_progress`, preserva responsavel e continua na mesma etapa ate uma mutacao distinta de avancar/finalizar |
| M7 | Expor a resposta da action na tela oficial de gestao | O detalhe do request em `/gestao-de-chamados` mostra pendencia, destinatarios, tipo, historico minimo, CTA explicito de solicitar action para o responsavel quando a etapa atual tiver `action`, e CTA de resposta apenas para quem puder responder |
| M8 | Dar visibilidade operacional para owner e responsavel | Owner e responsavel conseguem acompanhar no detalhe quem recebeu a action, quem ja respondeu, quem ainda falta responder, quando respondeu, qual foi o desfecho e, no caso de `execution`, o upload/anexo enviado pelo destinatario quando existir |
| M9 | Impedir duplicacao silenciosa de pendencias | Reabrir ou duplicar a mesma pendencia para a mesma etapa/destinatario sem decisao explicita deve ser rejeitado ou tratado de forma idempotente; o design deve fechar a estrategia, mas comportamento silencioso e proibido |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Reaproveitar o padrao atual de runtime routes e mutations oficiais | As novas mutations seguem o modelo `/api/workflows/runtime/requests/[id]/*`, com autenticacao via `authenticateRuntimeActor` e envelope `ok/data` consistente |
| S2 | Reaproveitar a infraestrutura oficial de upload quando `execution` exigir anexo | Se houver anexo de resposta operacional, a implementacao usa o fluxo assinado ja existente em vez de introduzir canal paralelo de upload |
| S3 | Estender detalhe, timeline e permissoes sem quebrar a gestao atual | O read-side oficial passa a expor dados de action e permissao de resposta sem regredir `assign`, `finalize` e `archive` |
| S4 | Cobrir os tres tipos com testes automatizados | Existem testes de use case, authz/API contract, read detail e comportamento da UI oficial para `approval`, `acknowledgement` e `execution` |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Melhorar a sinalizacao visual de pendencias na lista oficial | A lista oficial pode destacar tipo da action e quantidade de destinatarios sem mudar a arquitetura da pagina |
| C2 | Estruturar o contrato com espaco para evolucao futura | O shape escolhido permite adicionar expiracao, quorum ou reabertura depois, sem implementar essas regras agora |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Avanco automatico de etapa ao responder action | Contradiz a regra canonica do motor e mistura `respondAction` com `advanceStep` |
| W2 | Inbox nova, centro de notificacoes ou nova rota de resposta | A primeira entrega precisa acontecer dentro de `/gestao-de-chamados` |
| W3 | Regras avancadas de quorum, expiracao, escalonamento, reabertura ou delegacao complexa | Escopo pertence a evolucoes futuras da `2D+`/`2E`, nao ao desbloqueio inicial |
| W4 | Reescrever a UX legada de `RequestApprovalModal` e `WorkflowsContext` | A frente oficial desta macroetapa e o stack v2 de `workflows/management/*` |
| W5 | Alterar editor administrativo de workflow, versionamento ou publicacao | Fora da `2D`; pertence a `2E` |

## 4. Success Criteria

- os tres tipos de action conseguem ser abertos e respondidos pelo runtime novo com cobertura automatizada dedicada;
- enquanto houver ao menos uma pendencia aberta na etapa atual, o request aparece em `waiting_action` para owner e em `Atribuicoes e acoes` para o destinatario;
- ao responder a ultima pendencia da etapa atual, o request volta para `in_progress` sem trocar etapa nem responsavel;
- quando uma resposta de `approval` for `rejected`, a timeline registra explicitamente a rejeicao e o request volta ao responsavel para encerramento/finalizacao manual;
- `respondAction` retorna `403` para ator que nao seja destinatario valido da pendencia aberta;
- o detalhe oficial do request mostra trilha minima de auditoria para pedido e resposta de action;
- os workflows dos lotes `4` e `5` da `2C` deixam de depender de workaround legado para serem habilitados apos smoke funcional.

## 5. Technical Scope

### Backend / Runtime

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/runtime/types.ts` | Modify | adicionar tipos oficiais de pendencia e resposta de action no request, alem de estender `HistoryAction` para trilha minima de pedido/resposta |
| `src/lib/workflows/runtime/read-model.ts` | Modify | criar helpers canonicos para entrar e sair de `waiting_action`, recalculando `hasPendingActions`, `pendingActionRecipientIds` e `pendingActionTypes` |
| `src/lib/workflows/runtime/authz.ts` | Modify | adicionar regras de autorizacao para solicitar action e responder action, preservando leitura para pending recipients sem permitir resposta indevida |
| `src/lib/workflows/runtime/errors.ts` | Modify | incluir codigos especificos para pendencia inexistente, resposta invalida, duplicacao, ator nao autorizado e estado incompativel |
| `src/lib/workflows/runtime/repository.ts` | Modify | suportar mutacoes atomicas de action com historico no mesmo request, evitando divergencia entre payload operacional e auditoria |
| `src/lib/workflows/runtime/use-cases/request-action.ts` | Create | caso de uso principal para abrir pendencia da etapa atual, registrar historico e projetar `waiting_action` |
| `src/lib/workflows/runtime/use-cases/respond-action.ts` | Create | caso de uso principal para validar destinatario, registrar resposta tipada, fechar pendencia e recalcular retorno para `in_progress` quando aplicavel |
| `src/app/api/workflows/runtime/requests/[id]/request-action/route.ts` | Create | endpoint oficial para abrir action via runtime autenticado, seguindo o envelope atual |
| `src/app/api/workflows/runtime/requests/[id]/respond-action/route.ts` | Create | endpoint oficial para responder action via runtime autenticado, incluindo payload tipado por action |

### Read Side / Management Contracts

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/read/types.ts` | Modify | expor permissoes e payload oficial de pendencia/resposta no detalhe do request |
| `src/lib/workflows/read/detail.ts` | Modify | incluir bloco de action pendente, capacidade de resposta do ator atual e labels de timeline para pedido/resposta |
| `src/app/api/workflows/read/requests/[requestId]/route.ts` | Modify | manter contrato oficial de detalhe incluindo os novos dados de action sem quebrar consumidores atuais |
| `src/lib/workflows/read/queries.ts` | Modify | preservar coerencia das consultas oficiais com `waiting_action`, sem duplicar filtros ou criar fila paralela |

### Frontend / Gestao oficial

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/management/types.ts` | Modify | adicionar tipos para action pendente, permissao de solicitar/responder action e mutations de `requestAction` / `respondAction` |
| `src/lib/workflows/management/api-client.ts` | Modify | criar clientes oficiais para `requestAction` e `respondAction`, alem de normalizar os novos campos do detalhe |
| `src/hooks/use-workflow-management.ts` | Modify | adicionar mutations oficiais de `requestAction` e `respondAction` com invalidacao das queries operacionais |
| `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | renderizar card operacional da action pendente, CTA explicito de solicitar action para o responsavel quando a etapa atual tiver `action`, formulario de resposta para o destinatario e historico minimo visivel para owner, responsavel e destinatario |
| `src/components/workflows/management/WorkflowManagementPage.tsx` | Modify | integrar a nova mutation com toasts oficiais e refresh da tela |
| `src/components/workflows/management/ManagementRequestList.tsx` | Modify | opcionalmente enriquecer a sinalizacao de pendencia nas listas oficiais sem criar fluxo alternativo |

### Database / Storage

| Model | Change Type | Details |
|-------|------------|---------|
| `workflows_v2/{docId}` | Modify | armazenar pendencias e respostas de action no proprio request operacional, mantendo o read model denormalizado no mesmo documento |
| `workflowTypes_v2/{workflowTypeId}/versions/{version}` | None | a `2D` consome o contrato `stepsById[*].action` ja publicado; nao abre escopo de edicao/versionamento |
| Storage de anexos operacionais | Modify | reutilizar infraestrutura atual de upload assinado caso `execution` exija anexo de resposta |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| AI | None | fora do escopo da `2D` |

### Testing

- testes unitarios para `requestAction` e `respondAction`, cobrindo os tres tipos;
- testes de authz e API contract para os endpoints novos;
- testes de read detail para permissoes, timeline e bloco de action;
- testes da UI oficial para CTA de solicitar action, CTA de resposta, validacao de comentario/anexo/upload e refresh das listas.

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | As novas mutations usam o mesmo padrao de Bearer token + `authenticateRuntimeActor` ja adotado pelas rotas de runtime |
| Actor identity | `actorUserId` e fonte de verdade server-side; o cliente nao pode escolher livremente o ator que responde ou o destinatario efetivo da pendencia |
| Request action authorization | `requestAction` fica restrito ao owner, ao responsavel atual ou a um entrypoint interno controlado do runtime; na UX oficial da `2D`, a abertura e explicita por CTA e usa todos os `approverIds` predefinidos na etapa atual; solicitante comum e destinatario nao podem abrir pendencia arbitrariamente |
| Respond action authorization | `respondAction` exige que o ator esteja listado na pendencia aberta da etapa atual; owner e responsavel apenas observam, salvo quando tambem forem destinatarios explicitamente |
| User isolation | Pending recipients podem ler o detalhe do request por necessidade operacional, mas nao podem ver ou responder pendencias fora do proprio request nem agir em nome de terceiros |
| Input validation | O payload de resposta precisa ser validado por tipo; `execution` aceita upload/anexo opcional e respeita obrigatoriedade de comentario/anexo quando configurada; duplicidade, resposta tardia ou status incompativel devem falhar explicitamente |
| Auditability | O historico precisa registrar quem pediu, quem recebeu, quem respondeu, quando respondeu e o payload operacional relevante, sem lacunas silenciosas |

## 7. Out of Scope

- qualquer mudanca em configuracao/versionamento/publicacao de workflow;
- qualquer nova superficie fora de `/gestao-de-chamados`;
- regras avancadas de quorum, SLA proprio da action, expiracao, escalonamento ou reabertura;
- automacoes externas de notificacao;
- migracao da UX legada de `RequestApprovalModal` para o stack novo;
- alteracao do contrato base de `stepsById[*].action` alem do necessario para consumi-lo corretamente em runtime.
- a UI administrativa da futura `2E` nao entra nesta etapa, mas deve herdar a regra de validacao de que etapa com `action` sem `approverIds` e configuracao invalida.

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| Fase 2A - tela oficial `/gestao-de-chamados` e stack `workflows/management/*` | Internal | Ready |
| Fase 2C - lotes `4` e `5` publicados com `active: false` aguardando `2D` | Internal | Ready |
| Runtime v2 com `waiting_action`, `pendingActionRecipientIds`, `pendingActionTypes` e filtros oficiais ja existentes | Internal | Ready |
| Autenticacao e resolucao de ator via `authenticateRuntimeActor` | Internal | Ready |
| Infraestrutura oficial de upload assinado para anexos operacionais | Internal | Ready with adaptation |
| Fechamento do shape interno exato da pendencia e da estrategia de idempotencia | Internal | Pending in `/design` |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | A lacuna operacional entre runtime, read model e UI oficial esta claramente delimitada |
| User identification | 3 | Destinatario, responsavel e owner estao definidos com papeis distintos |
| Success criteria measurability | 3 | Os criterios de estado, permissao, UI e desbloqueio de rollout sao verificaveis |
| Technical scope definition | 3 | Os modulos principais de runtime, read-side, API e frontend oficial estao mapeados |
| Edge cases considered | 2 | Duplicacao, multi-destinatario e validacao de payload estao considerados, mas o shape exato e a idempotencia ficam para o design |
| **TOTAL** | **14/15** | Pronto para `/design` |

## 10. Next Step

Ready for `/design FASE2D_MOTOR_REQUEST_RESPOND_ACTION` para fechar:

- shape persistido da pendencia e da resposta no `workflows_v2`;
- contratos HTTP de `requestAction` e `respondAction`;
- extensoes exatas do read detail e das permissoes da tela oficial;
- estrategia de testes por tipo e por papel operacional.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-06 | define-agent | Initial requirements for Fase 2D from `BRAINSTORM_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md` and current runtime/management codebase |
