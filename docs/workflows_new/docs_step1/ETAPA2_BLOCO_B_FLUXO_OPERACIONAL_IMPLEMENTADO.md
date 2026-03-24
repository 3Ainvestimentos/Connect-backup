# Etapa 2 — Bloco B: Fluxo Operacional Implementado

## 1. Escopo e fontes

### Arquivos consultados

- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/CHECKLIST_OPERACIONAL_ETAPA_2.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_A_MAPA_FUNCIONAL_CONFIGURADO.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/ApplicationsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/README.md`

### Fato comprovado

- A abertura ocorre em `2` fases:
  - a solicitacao nasce primeiro com `formData = {}`
  - o `formData` e anexos sao persistidos depois
- O dono operacional inicial e sempre o `ownerEmail` da definicao, copiado no momento da criacao.
- O `status` inicial e sempre `definition.statuses[0].id`.
- O fluxo de status atual e linear por ordem do array; o codigo nao implementa branching por campo, `routingRules`, `slaRules` ou resposta de `action`.
- `assignee` e manual e separado de `ownerEmail`.
- Responder `approval`, `acknowledgement` ou `execution` nao move o workflow automaticamente.
- O Message Center do Connect usa a colecao `messages`.

### Inferencia

- O motor atual funciona mais como uma fila manual orientada por frontend do que como um motor declarativo completo.
- Para validacao funcional com as areas, a pergunta principal nao e “qual regra o JSON declara”, e sim “quem esta olhando a fila, quem recebe uma atribuicao, e quem precisa clicar em `Mover para ...`”.

### Ponto em aberto

- O codigo lido nao explicita uma regra de autorizacao funcional por papel para mover etapa, atribuir ou solicitar acao; a permissao real depende das telas que conseguem abrir o modal e do controle externo de acesso.

## 2. Fluxo operacional atual, ponta a ponta

| etapa operacional | fato comprovado | impacto funcional atual |
| --- | --- | --- |
| Criacao | `WorkflowSubmissionModal.tsx` cria `initialRequestPayload` com `type`, `status`, `submittedBy`, `submittedAt`, `lastUpdatedAt`, `formData = {}` e `history` inicial; depois chama `addRequest` | O pedido entra no banco antes de o formulario final estar salvo |
| Recebimento na abertura | `WorkflowsContext.tsx` grava `ownerEmail = definition.ownerEmail`, `assignee = undefined`, `actionRequests = {}` e envia notificacao ao solicitante e ao owner, se forem pessoas diferentes | A fila inicial vai para o owner do workflow, nao para um assignee |
| Persistencia de formData | O modal remapeia `__field_<index>` para `field.id`, processa upload e chama `updateRequestAndNotify({ id, formData })` | Se `field.id` estiver duplicado, o ultimo valor sobrescreve o anterior |
| Entrada de anexos | Upload falho grava `ERRO_UPLOAD: ...` no campo e `_uploadErrors` no `formData` | O pedido pode seguir com formulario salvo e anexo falho marcado tecnicamente |
| Atribuicao | `handleAssigneeChange` grava `assignee`, adiciona `history` e notifica solicitante e assignee | A responsabilidade operacional passa manualmente para uma pessoa, mas o owner continua sendo o owner da fila |
| Troca de responsabilidade | Nova atribuicao simplesmente sobrescreve o `assignee` anterior | Nao existe objeto separado de delegacao ou fila secundaria |
| Solicitacao de acao | `handleRequestAction` so aparece quando o status atual tem `action`; ele cria ou amplia `actionRequests[request.status]` | O apoio formal so existe em statuses com `action` na definicao atual |
| Resposta de acao | `handleActionResponse` atualiza `actionRequests` e `history`, mas nao altera `status` | Depois de uma aprovacao, ciencia ou execucao, alguem ainda precisa mover manualmente a etapa |
| Mudanca de status | `nextStatus` e calculado por `findIndex` + `statuses[currentIndex + 1]`; `handleStatusChange` apenas grava novo `status` e `history` | O fluxo depende da ordem do array e de IDs de status unicos |
| Finalizacao | O runtime considera final pelo texto do `label`/`id`; nao existe metadata formal de fim | O termino e heuristico e separado de arquivamento |
| Arquivamento | `archiveRequestMutation` apenas seta `isArchived = true`; `ManageRequests.tsx` expoe a acao separadamente | Um workflow pode estar `finalizado` e continuar ativo na fila ate alguem arquivar |

## 3. Criacao e persistencia de `formData`

### Fato comprovado

- O documento nasce em [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L100) a [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L113) com `formData = {}`.
- `addRequestMutation` em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L139) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L207) gera `requestId` sequencial, aplica `status` inicial, copia `ownerEmail` e grava o documento.
- O `formData` final so e montado depois em [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L120) a [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L258).
- `updateRequestAndNotify` ainda faz uma verificacao posterior e, se ler o documento com `formData` vazio, reescreve apenas `formData` em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L322) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L355).

### Inferencia

- Existe janela real para documentos com criacao concluida e `formData` ausente ou parcial.
- Isso afeta diretamente a leitura funcional atual porque o owner pode receber uma solicitacao antes de o formulario estar completo.

### Ponto em aberto

- O sistema nao define regra funcional para tratamento de um documento criado com sucesso, mas com falha na segunda escrita.

## 4. `history` e trilha operacional

### Fato comprovado

- A abertura cria `history` inicial com `notes = "Solicitação criada."` em [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L103) a [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L111).
- Mudanca de status, atribuicao, comentario, pedido de acao e resposta de acao acrescentam entradas novas ao `history` dentro de [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L145) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L405).
- A criacao automatica de `actionRequests` tambem pode acrescentar nota de historico em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L222) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L255).

### Inferencia

- O `history` atual funciona como registro operacional central do fluxo, inclusive para fatos que nao estao declarados no schema configurado.

### Ponto em aberto

- O codigo nao impõe consistencia entre `history`, `status` atual e `actionRequests`; a conciliacao funcional depende de leitura humana.

## 5. Quem recebe na abertura, quem recebe depois e quem continua responsavel

### Fato comprovado

- Na abertura:
  - o solicitante recebe notificacao de confirmacao em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L167) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L185)
  - o owner recebe notificacao, se for diferente do solicitante
  - o pedido entra na fila do owner porque `/requests` filtra por `ownerEmail === user.email` em [ManageRequests.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx#L66) a [ManageRequests.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx#L73)
- Depois da abertura:
  - se houver atribuicao manual, o assignee passa a ver a tarefa em `/me/tasks` em [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx#L39) a [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx#L58)
  - o owner continua vendo o item em `/requests` porque `ownerEmail` nao muda
- Quando ha `actionRequests` pendentes para o status atual:
  - o destinatario da acao aparece em `/me/tasks`
  - o assignee anterior nao e removido automaticamente

### Inferencia

- O fluxo atual distribui responsabilidade em camadas:
  - `ownerEmail` = fila principal do workflow
  - `assignee` = pessoa executora atual
  - `actionRequests[status]` = apoio ou checkpoint pontual

### Ponto em aberto

- O sistema nao define qual dessas tres camadas e a “fonte canonica” de responsabilidade para fins de negocio.

## 6. Atribuicao, troca de responsabilidade e delegacao

### Fato comprovado

- `handleAssigneeChange` em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L328) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L373) apenas grava um novo `assignee`.
- O botao `Atribuir` fica exposto no modal em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L694) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L729).
- Nao existe entidade separada de “delegacao”; o sistema so conhece:
  - troca de `assignee`
  - solicitacao de `action`

### Inferencia

- Funcionalmente, “assumir” e “delegar” hoje significam reatribuir a pessoa em `assignee`.

### Ponto em aberto

- Se a area entende delegacao como algo diferente de trocar o executor principal, o motor atual nao expressa isso de forma separada.

## 7. Solicitacao de aprovacao, ciencia ou execucao

### Fato comprovado

- O botao `Solicitar Ação` so aparece quando `currentStatusDefinition?.action` existe em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L796) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L805).
- O pedido manual de acao:
  - deduplica destinatarios ja existentes
  - grava `pending`
  - persiste em `actionRequests[request.status]`
  - adiciona `history`
  em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L145) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L202).
- A criacao automatica de `actionRequests` ao entrar em um status com `action.approverIds` ocorre em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L222) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L255).
- A resposta da acao so altera `actionRequests` e `history` em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L204) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L280).

### Inferencia

- A `action` no runtime atual e um checkpoint paralelo, nao um gatilho de transicao.

### Ponto em aberto

- Se o negocio espera bloqueio de status ate todas as `actions` ficarem concluidas, essa regra nao esta implementada.

## 8. Transicao de status e sequencia das etapas

### Fato comprovado

- `currentStatusDefinition` usa `definition.statuses.find(s => s.id === request.status)` em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L101) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L104).
- `nextStatus` usa `findIndex` e `statuses[currentIndex + 1]` em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L106) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L113).
- `handleStatusChange` nao consulta `formData`, `routingRules`, `slaRules`, `actionRequests` pendentes nem perfil do destinatario em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L283) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L325).

### Inferencia

- O fluxo efetivo atual e “array-driven”: o significado de “vai para quem depois” vem do owner, do assignee e das `actions`, nao de uma regra declarativa de roteamento.

### Ponto em aberto

- Workflows com `status.id` duplicado ficam funcionalmente ambiguos para o motor atual, principalmente `Solicitação de Compra - Equipamento` e `Análise Pré-Desligamento (Acesso líderes)`.

## 9. Finalizacao, encerramento e arquivamento

### Fato comprovado

- O runtime reconhece status final por heuristica textual em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L369) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L390) e em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L585) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L595).
- Finalizacao de status nao arquiva automaticamente.
- O arquivamento e manual e separado em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L265) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L269) e [ManageRequests.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx#L126) a [ManageRequests.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx#L133).

### Inferencia

- Hoje o fluxo “termina” em dois tempos:
  - funcionalmente, quando o status chega a um label final
  - operacionalmente, quando alguem arquiva o documento

### Ponto em aberto

- As areas precisam validar se “finalizado mas ainda visivel na fila” e comportamento desejado.

## 10. Notificacoes Connect

### Fato comprovado

- A colecao de notificacoes e `messages` em [MessagesContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx#L10) a [MessagesContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx#L126).
- Eventos com notificacao confirmada no fluxo atual:
  - criacao para o solicitante
  - criacao para o owner
  - comentario para o solicitante
  - mudanca de status para o solicitante
  - atribuicao para o solicitante
  - atribuicao para o assignee, se o status nao for heuristico-final
- `handleRequestAction` e `handleActionResponse` passam o texto de notificar assignee sem `assignee` no payload; por isso `updateRequestAndNotify` nao chama `addMessage` nesses casos em [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L183) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L195), [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L257) a [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L270) e [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L382) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L390).

### Inferencia

- Para `actions`, a pendencia operacional hoje depende de `/me/tasks` e do badge da interface, nao do Message Center.

### Ponto em aberto

- A area precisa validar se aprovacoes, ciencias e execucoes deveriam gerar notificacao Connect formal.

## 11. Pendencias, fila e regras hardcoded

### Fato comprovado

- `/me/tasks` monta pendencias por:
  - `assignee.id === currentUserCollab.id3a`
  - `actionRequests[req.status]` com `status = pending`
  em [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx#L30) a [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx#L60).
- O badge global repete a mesma heuristica em [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx#L291) a [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx#L319).
- `hasNewAssignedTasks` considera “nova tarefa” quando o usuario e o assignee e o pedido ainda esta no status inicial em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L120) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L136).
- `markRequestsAsViewedBy` e o reset de `viewedBy` dependem da string literal `pending` em [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L218) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L220) e [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L273) a [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L295).
- O schema de definicao valida formato de IDs, mas nao unicidade de `fields` nem de `statuses` em [ApplicationsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/ApplicationsContext.tsx#L27) a [ApplicationsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/ApplicationsContext.tsx#L84).

### Inferencia

- O motor esta acoplado a hardcodes de frontend que nao acompanham bem o vocabulario real de status atual.

### Ponto em aberto

- O uso de `pending` como estado fixo para `viewedBy` parece legado do motor e precisa de validacao antes de qualquer migracao funcional.

## 12. Evidencias principais por comportamento

| comportamento | evidencia principal |
| --- | --- |
| Criacao do documento | [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L100), [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L139) |
| Persistencia posterior de `formData` | [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L120), [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L322) |
| Criacao de `history` | [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx#L103), [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L174), [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L264) |
| Atribuicao e troca de responsabilidade | [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L328), [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx#L39) |
| Delegacao ou pedido de apoio | [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L145), [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L222) |
| Transicao de status | [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L106), [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L283) |
| Finalizacao heuristica | [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L369), [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx#L585) |
| Notificacoes Connect | [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L167), [MessagesContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx#L35) |
| Pendencias e badges | [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx#L30), [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx#L291), [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L273) |
| Regras hardcoded | [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L149), [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx#L307), [ApplicationsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/ApplicationsContext.tsx#L27) |

## 13. Fechamento do Bloco B

### Fato comprovado

- O documento cobre explicitamente:
  - criacao
  - persistencia de `formData`
  - `history`
  - atribuicao
  - troca de responsabilidade
  - delegacao ou solicitacao de acao
  - transicao de status
  - finalizacao
  - notificacoes Connect
  - regras hardcoded

### Inferencia

- O fluxo operacional atual dos workflows ativos pode ser resumido como:
  - solicitante abre
  - owner recebe a fila
  - owner ou operador atribui manualmente
  - assignee conduz
  - quando existe `action`, terceiros prestam apoio, aprovam, dao ciencia ou executam
  - depois disso alguem ainda precisa mover manualmente
  - o item so sai da fila quando for arquivado

### Ponto em aberto

- A validacao funcional com as areas precisa decidir se esse comportamento manual e a regra desejada do negocio ou apenas o limite atual do frontend.
