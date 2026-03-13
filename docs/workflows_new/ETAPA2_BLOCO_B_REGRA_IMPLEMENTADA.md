# Etapa 2 — Bloco B: Regra Implementada no Codigo

## 1. Resumo executivo

### Arquivos consultados

- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/CHECKLIST_OPERACIONAL_ETAPA_2.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_A_INVENTARIO_CONFIGURADO.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/ApplicationsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowAreasContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/README.md`

### Fato comprovado

- A criacao da solicitacao ocorre em duas fases: primeiro o documento nasce em `workflows` com `formData: {}`, depois o modal tenta persistir `formData` e anexos.
- O `requestId` e sequencial; o `status` inicial e sempre `definition.statuses[0].id`; `ownerEmail` e copiado da definicao no momento da criacao.
- A progressao de status depende de `definition.statuses[currentIndex + 1]`; nao existe branching por dados de formulario nas fontes de runtime lidas.
- `actionRequests` sao indexados por `statusId`, nao por indice de etapa.
- Responder uma `action` nao move status automaticamente.
- Nao existe bloqueio no codigo para impedir mover status com `actionRequests` pendentes.
- O Message Center usa a colecao `messages`; notificacoes de criacao, comentario, mudanca de status e atribuicao passam por `addMessage`.

### Inferencia

- Como a escrita do documento acontece antes da validacao final do `formData`, falhas posteriores podem deixar registros com `formData` vazio.
- Como `ownerEmail` e persistido no documento e nao ha ressincronizacao posterior, divergencias entre `ownerEmail` atual da definicao e `ownerEmail` antigo do documento sao esperadas em dados legados.
- O runtime atual privilegia heuristicas de frontend e ordem de array sobre regras declarativas.

### Ponto em aberto

- O codigo nao explicita qual perfil funcional esta autorizado a mover status, reatribuir ou solicitar acoes; a permissao real depende do conjunto de telas que consegue abrir o modal.
- O motor atual nao registra uma regra formal para “todas as acoes obrigatorias concluídas”; isso precisa de validacao humana antes de qualquer refatoracao.

## 2. Fluxo de criacao

### Fato comprovado

- `WorkflowSubmissionModal.tsx` monta `initialRequestPayload` com:
  - `type = workflowDefinition.name`
  - `status = workflowDefinition.statuses[0].id`
  - `submittedBy`, `submittedAt`, `lastUpdatedAt`
  - `formData = {}`
  - `history = [{ status: initialStatus, notes: "Solicitação criada." }]`
- `WorkflowsContext.tsx` gera `requestId` sequencial com `getNextSequentialId`, define `ownerEmail = definition.ownerEmail`, zera `viewedBy`, `assignee`, `isArchived` e `actionRequests`, e grava o documento.
- Depois da primeira escrita, o modal:
  - resolve `storageFolderPath` a partir da area;
  - remapeia os campos temporarios `__field_<index>` para `field.id`;
  - sobrescreve o valor anterior quando ha `field.id` duplicado;
  - faz upload de arquivos;
  - injeta `ERRO_UPLOAD: ...` no proprio campo e `_uploadErrors` no `formData` quando um upload falha;
  - normaliza `date` e `date-range`;
  - chama `updateRequestAndNotify({ id, formData })`.
- `updateRequestAndNotify` tenta verificar se o `formData` foi salvo e, se buscar o documento e receber `formData` vazio, reescreve `formData` diretamente.

### Inferencia

- O fluxo nao faz rollback do documento inicial se ocorrer erro:
  - na validacao de `storageFolderPath`;
  - no guard `Object.keys(formDataForFirestore).length === 0`;
  - ou na segunda escrita via `updateRequestAndNotify`.
- Isso torna possivel a existencia de documento com `history` inicial e `formData` vazio, sem contradizer o codigo.

### Ponto em aberto

- A aplicacao mostra toast de erro ao usuario quando a segunda fase falha, mas nao existe definicao funcional explicita sobre como tratar a solicitacao ja criada no banco.

## 3. Fluxo de transicao de status

### Fato comprovado

- `RequestApprovalModal.tsx` calcula `nextStatus` com `definition.statuses.findIndex(s => s.id === request.status)` e retorna `definition.statuses[currentIndex + 1]`.
- `handleStatusChange` apenas monta novo `history` e chama `updateRequestAndNotify` com `status = nextStatus.id`.
- Nao ha branch por `formData`, `routingRules`, `slaRules`, perfil do usuario ou contagem de acoes respondidas.
- `WorkflowsContext.tsx` tenta descobrir se um status e final procurando termos como `finalizado`, `concluído`, `aprovado`, `reprovado`, `cancelado` dentro do `label`.
- `RequestApprovalModal.tsx` usa heuristica semelhante para renderizar a linha do tempo como concluida ou pendente.

### Inferencia

- Definicoes com `status.id` duplicado colidem com esse algoritmo:
  - `findIndex` sempre encontra a primeira ocorrencia;
  - `find` tambem encontra a primeira ocorrencia;
  - o runtime perde a capacidade de distinguir duas etapas com o mesmo `id`.
- Isso afeta diretamente `Solicitação de Compra - Equipamento` (`em_execucao` duplicado) e `Análise Pré-Desligamento (Acesso líderes)` (`em_analise` duplicado).

### Ponto em aberto

- O motor atual nao define explicitamente “status final” por metadata; depende de rotulo textual. E preciso validar se essa heuristica e aceitavel como regra de negocio.

## 4. Fluxo de atribuicao e pendencias

### Fato comprovado

- A atribuicao de responsavel e manual: `handleAssigneeChange` grava `assignee`, `lastUpdatedAt` e um `history` com “Solicitação atribuída a ...”.
- `/requests` (`ManageRequests.tsx`) exibe apenas documentos cujo `ownerEmail` coincide com o email do usuario logado.
- `/me/tasks` (`page.tsx`) monta duas caixas:
  - `assignedTasks`: `req.assignee?.id === currentUserCollab.id3a`;
  - `actionTasks`: existe `actionRequests[req.status]` com entrada `pending` para o usuario.
- `AppLayout.tsx` usa a mesma heuristica para badge de pendencias.
- `hasNewAssignedTasks` em `WorkflowsContext.tsx` considera “nova tarefa atribuida” apenas quando `req.assignee.id` e o usuario atual **e** `req.status` ainda e o status inicial.
- `markRequestsAsViewedBy` so marca itens cujo `req.status === 'pending'`.

### Inferencia

- Como nenhuma definicao atual usa `status = pending`, o controle de `viewedBy` fica desalinhado do vocabulario real de status.
- O badge de “nova tarefa” mede “atribuido e ainda no status inicial”, nao “nao lido”.

### Ponto em aberto

- O codigo nao mostra regra funcional que diferencie claramente “owner operacional”, “assignee” e “executor de action”; a separacao atual e apenas estrutural.

## 5. Fluxo de acoes (`approval` / `acknowledgement` / `execution`)

### Fato comprovado

- Ao entrar num status cujo `action.approverIds` exista, `updateRequestMutation` cria `actionRequests[statusId]` automaticamente com `status: pending`.
- Essa criacao automatica depende de `definition.statuses.find(s => s.id === payload.status)`, ou seja, depende do primeiro match por `status.id`.
- O botao `Solicitar Ação` do modal so aparece quando `currentStatusDefinition?.action` existe.
- O pedido manual de acao:
  - deduplica destinatarios ja presentes em `actionRequests[request.status]`;
  - anexa novos destinatarios em `actionRequests[request.status]`;
  - grava um item de `history`.
- A resposta da acao:
  - atualiza apenas a entrada do usuario em `actionRequests[request.status]`;
  - grava `respondedAt`, `comment`, `attachmentUrl`;
  - grava `history`;
  - nao altera `request.status`.
- O botao `Mover para "<proximo status>"` continua disponivel mesmo com `actionRequests` pendentes.
- O modal e renderizado tanto em `/requests` quanto em `/me/tasks`; no codigo lido nao existe guard adicional que esconda reatribuicao, comentario, solicitacao de acao ou mudanca de status para usuarios que abriram o modal por `/me/tasks`.

### Inferencia

- O runtime atual nao implementa “a acao concluida avanca automaticamente”.
- O runtime atual tambem nao implementa “sem todas as aprovacoes, nao pode avançar”.

### Ponto em aberto

- E preciso validar se as `actions` sao apenas checkpoints documentais ou se deveriam bloquear / avançar o fluxo de forma formal.

## 6. Fluxo de notificacoes Connect

### Fato comprovado

- `MessagesContext.tsx` persiste notificacoes na colecao `messages` com `title`, `content`, `sender`, `recipientIds`, `readBy`, `deletedBy` e `date`.
- Eventos efetivamente notificados no runtime lido:
  - criacao da solicitacao para o solicitante;
  - criacao da solicitacao para o `ownerEmail` (se diferente do solicitante);
  - comentario para o solicitante;
  - mudanca de status para o solicitante;
  - atribuicao para o solicitante;
  - atribuicao para o assignee, desde que a heuristica de finalizacao nao considere o status final.
- `routingRules` sao avaliadas apenas dentro de `addRequest`, quando `requestData.formData` ja chega preenchido.
- O submit padrao do modal chama `addRequest(initialRequestPayload)` com `formData = {}`.
- Nenhum workflow do export atual possui `routingRules` ou `slaRules`.

### Fato comprovado sobre lacunas de notificacao

- `handleRequestAction` chama `updateRequestAndNotify(requestUpdate, undefined, "Você tem uma nova ação...")`, mas `requestUpdate` nao carrega `assignee`.
- `handleActionResponse` chama `updateRequestAndNotify(requestUpdate, undefined, notificationMessage)`, tambem sem `assignee`.
- `updateRequestAndNotify` so usa o terceiro parametro (`notifyAssigneeMessage`) quando `requestUpdate.assignee?.id` existe.
- Resultado: pedido manual de acao e resposta de acao nao geram `messages` no fluxo atual lido.
- A criacao automatica de `actionRequests` em `updateRequestMutation` tambem nao chama `addMessage`.

### Inferencia

- A sinalizacao operacional de `actions` depende hoje de `/me/tasks` e do badge da AppLayout, nao do Message Center.
- Mesmo se um workflow futuro receber `routingRules`, o submit padrao atual nao dispara essa logica porque o primeiro write sai com `formData` vazio.

### Ponto em aberto

- E preciso validar se o Connect deveria ser a fonte canonica de notificacao para `actions`, ou apenas um canal auxiliar.

## 7. Regras hardcoded e heuristicas

### Fato comprovado

- `initialStatus` usa `definition.statuses[0].id`; fallback para string literal `pending` em `WorkflowsContext.tsx`.
- `viewedBy` e resetado em qualquer update de status cujo novo valor nao seja literalmente `pending`.
- `markRequestsAsViewedBy` filtra apenas `req.status === 'pending'`.
- A descoberta de “status final” depende de palavras fixas no `label`/`id`.
- `renderFormData` procura `definition.fields.find(f => f.id === fieldId)`; em caso de `field.id` duplicado, a primeira definicao encontrada domina a renderizacao do campo.
- `WorkflowSubmissionModal` usa `field.id` como chave final de persistencia; em `field.id` duplicado, o ultimo valor sobrescreve o anterior.
- `updateRequestAndNotify` contem side effect de debug para `http://127.0.0.1:7245/...`, silenciosamente ignorado em caso de falha.
- `ApplicationsContext.tsx` valida formato de `field.id` e `status.id`, mas nao valida unicidade dentro do workflow.

### Inferencia

- O conjunto atual de hardcodes torna o motor sensivel a pequenas divergencias textuais e a repeticao de IDs.

### Ponto em aberto

- A severidade operacional desses hardcodes precisa ser confirmada workflow a workflow no confronto com dados reais.

## 8. Divergencias preliminares vs configuracao

### Fato comprovado

- O schema atual permite definicoes com `field.id` e `status.id` duplicados.
- O runtime atual depende de busca por `status.id` e de ordem de array para mover status e descobrir `currentStatusDefinition`.
- A definicao atual nao descreve:
  - `assignee`
  - `viewedBy`
  - `isArchived`
  - `actionRequests`
  - notificacoes Connect
  - debug fetch local
- O export atual nao usa `routingRules` nem `slaRules`, mas o runtime ainda carrega suporte parcial a `routingRules`.

### Inferencia

- Os conflitos vistos no Bloco A sao materialmente relevantes para o runtime atual e nao apenas “problemas cosmeticos de cadastro”.

### Ponto em aberto

- A ausencia de regra declarativa para atribuicao, bloqueio por acao pendente e criterio formal de finalizacao exige validacao humana antes de refatorar o motor.

## 9. Evidencias Principais

| arquivo | linhas relevantes | comportamento sustentado |
| --- | --- | --- |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx` | 101-113 | payload inicial nasce com `formData = {}` e `history` inicial. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx` | 120-145 | persistencia de `formData` remapeia campos por `field.id`; duplicados sobrescrevem. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx` | 148-258 | uploads podem escrever `ERRO_UPLOAD:` e `_uploadErrors`; segunda escrita de `formData` acontece depois da criacao. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx` | 139-205 | criacao do documento, `requestId` sequencial, snapshot de `ownerEmail`, notificacoes de criacao e logica de `routingRules`. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx` | 214-256 | criacao automatica de `actionRequests` por `status.action.approverIds`. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx` | 273-295 | `viewedBy` depende de `status === 'pending'`. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx` | 298-390 | verificação de `formData`, notificacao ao solicitante, notificacao ao assignee e heuristica de status final. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx` | 106-113 | `nextStatus` depende de `findIndex` e `statuses[index + 1]`. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx` | 145-201 | pedido manual de `action` acrescenta entradas em `actionRequests[currentStatus]`. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx` | 204-280 | resposta de `action` atualiza apenas `actionRequests` e `history`; nao avanca status. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx` | 283-325 | mudanca de status nao verifica `actionRequests` pendentes. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx` | 328-414 | atribuicao e comentario sao manuais e fora da definicao configurada. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx` | 585-595 | finalizacao na UI depende de palavras fixas em `label`/`id`. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx` | 694-805 | o modal expoe atribuicao, comentario, `Mover para` e `Solicitar Ação` sem guard adicional no proprio componente. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx` | 56-73 | inbox do owner depende de `ownerEmail`; arquivo opera por arquivamento logico. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx` | 30-60 | tarefas pendentes usam `assignee` e `actionRequests[req.status]`. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx` | 291-319 | badge global repete a heuristica de tarefas atribuidas no status inicial e `actionRequests` pendentes. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx` | 10-125 | notificacoes Connect sao documentos em `messages`, com `readBy` e `deletedBy`. |
| `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/ApplicationsContext.tsx` | 27-50, 71-84 | schema valida formato de IDs, mas nao unicidade de `fields` ou `statuses`. |

## 10. Conferencia da checklist do Bloco B

- `criacao`: coberto
- `persistencia de formData`: coberto
- `history`: coberto
- `atribuicao`: coberto
- `pendencias`: coberto
- `actions`: coberto
- `transicao de status`: coberto
- `finalizacao`: coberto
- `notificacoes Connect`: coberto
- `regras hardcoded`: coberto
- `pontos fora da definicao`: coberto
