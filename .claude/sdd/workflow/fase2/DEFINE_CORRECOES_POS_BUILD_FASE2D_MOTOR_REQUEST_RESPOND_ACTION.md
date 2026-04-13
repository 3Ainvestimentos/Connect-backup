# DEFINE: Correcoes Pos-Build da Fase 2D - Motor operacional de `requestAction` / `respondAction`

> Generated: 2026-04-08
> Status: Approved for design
> Scope: Fase 2 / 2D - fechamento das correcoes identificadas na revisao do build do motor de actions
> Base document: `DESIGN_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
> Source build: `feat(workflows): implementa motor operacional de actions — Fase 2D`

## 1. Problem Statement

O build da `2D` entregou o motor operacional de actions, mas a revisao final encontrou tres lacunas de integridade e visibilidade que precisam ser corrigidas para que `execution`, auditoria de anexos e acompanhamento pos-resposta fiquem coerentes com o contrato prometido pelo design.

---

## 2. Users

### 2.1. Destinatario da action

Pain points:

- consegue responder `execution`, mas o backend ainda nao garante que o anexo informado pertence ao upload assinado da propria action;
- depende que a resposta registrada seja auditavel e resistente a payload forjado no cliente;
- precisa de um fluxo de resposta que continue previsivel sem abrir brecha para anexos arbitrarios.

### 2.2. Responsavel atual e owner do chamado

Pain points:

- precisam continuar vendo quem respondeu, qual foi o desfecho, o comentario opcional e o anexo de `execution` mesmo depois que o ultimo destinatario responde;
- no caso de `approval = rejected`, essa visibilidade pos-fechamento do batch e especialmente importante para decidir a finalizacao manual do chamado;
- perdem contexto operacional se o detalhe zerar o bloco de action assim que o request sai de `waiting_action`.

### 2.3. Engenharia / plataforma de workflows

Pain points:

- o namespace de upload ainda esta preso a `Facilities`, apesar de a `2D` agora suportar actions em workflows de Gente e outras areas;
- isso embaralha trilha operacional, auditoria e futuras rotinas de cleanup/export por dominio;
- a equipe precisa fechar a `2D` sem deixar uma regressao silenciosa de storage ou de visibilidade no detalhe.

### 2.4. Auditoria / manutencao futura

Pain points:

- anexos operacionais sem vinculo forte ao upload assinado dificultam confianca no historico;
- paths de storage com namespace errado tornam mais custosa a governanca por area;
- esconder a ultima resposta do batch no detalhe fragiliza leitura operacional e troubleshooting futuro.

---

## 3. Goals

### MUST

- validar em `respondAction` que qualquer anexo de resposta operacional foi gerado pelo fluxo oficial de upload assinado da mesma `request`, da mesma `step` e do mesmo `actorUserId`;
- rejeitar explicitamente payloads de anexo com `storagePath`, `uploadId` ou metadados que nao batam com o upload autorizado para aquela resposta operacional;
- remover a dependencia do prefixo fixo `Workflows/Facilities e Suprimentos/...` para uploads de workflows v2, adotando namespace neutro de runtime multi-area;
- preservar no detalhe oficial do request os dados do ultimo batch da etapa atual mesmo depois que a ultima pendencia fechar;
- garantir que owner e responsavel continuem vendo, apos o fechamento do batch:
  - quem recebeu a action
  - quem respondeu
  - qual foi o desfecho
  - comentario opcional
  - anexo de `execution`, quando existir
- manter a semantica ja fechada da `2D`:
  - `respondAction` nao avanca etapa automaticamente
  - `approval = rejected` devolve ao responsavel para finalizacao manual
  - quorum continua sendo `ALL`

### SHOULD

- manter os contratos HTTP existentes de `requestAction`, `respondAction` e upload o mais estaveis possivel, fazendo a protecao extra majoritariamente no backend;
- reforcar a timeline ou o payload do detalhe apenas no necessario para nao perder contexto do batch fechado;
- adicionar cobertura automatizada dedicada para:
  - integridade do anexo em `respondAction`
  - namespace neutro de upload
  - persistencia da visibilidade do batch fechado no detalhe

### COULD

- enriquecer o historico com identificadores adicionais de upload para facilitar auditoria futura;
- exibir no detalhe um estado textual explicito para "batch concluido" quando a etapa atual ja teve action respondida integralmente.

### WON'T

- nao reabrir a arquitetura geral da `2D`;
- nao alterar quorum, permissao de resposta ou trigger explicito de `requestAction`;
- nao introduzir nova colecao operacional fora de `workflows_v2`;
- nao reescrever a UX de `RequestActionCard` fora do necessario para manter a visibilidade prometida;
- nao abrir escopo da futura `2E` de configuracao/versionamento.

---

## 4. Success Criteria

- `respondAction` retorna erro explicito quando o cliente tenta registrar `execution` com anexo nao vinculado ao upload assinado daquela `request`/`step`/`actor`;
- existe ao menos `1` teste cobrindo tentativa de forjar ou reaproveitar anexo operacional indevido;
- uploads de workflow runtime deixam de usar prefixo fixo de `Facilities` e passam a usar namespace neutro compartilhado para workflows v2;
- existe ao menos `1` teste cobrindo o path novo de upload para `action_response`;
- ao responder a ultima pendencia do batch atual, o detalhe oficial continua mostrando os destinatarios e as respostas consolidadas do batch encerrado;
- owner e responsavel conseguem visualizar comentario e `responseAttachmentUrl` do batch encerrado quando o contrato atual permitir essa visibilidade;
- nenhuma dessas correcoes regressa:
  - `waiting_action`
  - inbox de `Atribuicoes e acoes`
  - retorno para `in_progress`
  - `409` de batch duplicado

### Clarity Score

`14/15`

Motivo:

- a microetapa e pequena, diretamente derivada de achados objetivos do review;
- os tres problemas sao concretos e verificaveis no codigo atual;
- o escopo tecnico e cirurgico e nao exige nova decisao de produto para seguir ao design.

---

## 5. Technical Scope

### Backend / Runtime

- endurecer a validacao de `responseAttachment` em [respond-action.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/respond-action.ts);
- reforcar, se necessario, o contrato de upload iniciado por [init-file-upload.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/init-file-upload.ts) para que a resposta operacional possa ser validada de forma verificavel no momento do `respondAction`;
- ajustar [upload-storage.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/upload-storage.ts) para namespace neutro de workflows v2, sem acoplamento nominal a `Facilities`;
- manter a escrita inline em `workflows_v2/{docId}`, sem colecao paralela.

### Read Side / Detail

- ajustar [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts) para que o bloco `action` nao dependa exclusivamente de batches ainda pendentes;
- definir uma forma canonica de expor o ultimo batch da etapa atual quando ele acabou de ser fechado, preservando a visibilidade prometida ao owner e ao responsavel;
- manter a diferenca de permissao:
  - destinatario responde
  - owner/responsavel observam

### Frontend / Gestao oficial

- compatibilizar [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx) e [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) com a nova leitura de batch fechado;
- preservar a UX atual de resposta e apenas estender a exibiçao pos-fechamento do batch.

### Database / Storage

- nenhuma mudanca de colecao;
- nenhuma migracao estrutural de `workflowTypes_v2`;
- apenas ajuste de path/logica de upload e do payload operacional dentro de `workflows_v2`.

### AI

- fora do escopo.

### Testing

- testes unitarios de `respondAction` cobrindo integridade de anexo;
- testes de `upload-storage` ou `init-file-upload` cobrindo namespace neutro;
- testes de `read/detail` cobrindo batch fechado ainda visivel;
- ajuste dos testes de UI oficiais, se o card passar a exibir ultimo batch encerrado.

---

## 6. Auth Requirements

- `actorUserId` autenticado continua sendo a fonte de verdade para `requestAction`, `respondAction` e upload de `action_response`;
- o cliente nao pode apontar livremente para um arquivo arbitrario e fazer o runtime aceitá-lo como `responseAttachment`;
- a validacao do anexo deve considerar, no minimo, coerencia com:
  - request atual
  - step atual
  - actor autenticado
  - upload assinado oficial
- owner e responsavel continuam com permissao de leitura do contexto operacional e do anexo de `execution` quando o contrato atual permitir essa visibilidade;
- nenhuma correcao desta microetapa deve afrouxar isolamento de usuario nem permitir resposta em nome de terceiro.

---

## 7. Out of Scope

- mudar semantica de `approval`, `acknowledgement` ou `execution`;
- alterar `approverIds`, quorum ou trigger de `requestAction`;
- criar tela nova fora de `/gestao-de-chamados`;
- reabrir os artefatos macro da `2D`;
- mexer na UI administrativa de configuracao de workflows.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| Build atual da `2D` em `requestAction` / `respondAction` | Internal | Ready |
| `DESIGN_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md` | Internal | Ready |
| Infraestrutura oficial de upload assinado do runtime | Internal | Ready with correction |
| Read-side oficial de detalhe em `/gestao-de-chamados` | Internal | Ready with correction |

---

## 9. Next Step

Ready for `/design CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION` para fechar:

- estrategia exata de validacao do anexo assinado em `respondAction`;
- path canonico e neutro de upload para workflows v2;
- shape read-side que preserva o ultimo batch fechado sem reabrir a semantica de pending batch;
- estrategia de testes para os tres achados.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-08 | codex | Initial define for post-build corrections of Fase 2D after review findings on upload integrity, storage namespace and action detail visibility |
