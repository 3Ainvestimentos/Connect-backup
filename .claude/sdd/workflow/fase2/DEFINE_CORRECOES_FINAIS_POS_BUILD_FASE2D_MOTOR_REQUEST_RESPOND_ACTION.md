# DEFINE: Correcoes Finais Pos-Build da Fase 2D - Motor operacional de `requestAction` / `respondAction`

> Generated: 2026-04-08
> Status: Approved for design
> Scope: Fase 2 / 2D - fechamento final dos achados de review apos as correcoes pos-build do motor de actions
> Base document: `DESIGN_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
> Parent design: `DESIGN_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`

## 1. Problem Statement

As correcoes pos-build da `2D` fecharam os gaps principais de integridade de anexo, namespace de upload e visibilidade do batch encerrado, mas a revisao final ainda encontrou quatro ajustes de consistencia e cobertura que precisam ser fechados para alinhar runtime, read-side e testes ao contrato aprovado.

---

## 2. Users

### 2.1. Responsavel atual do chamado

Pain points:

- a regra de que `completed` e somente leitura precisa valer no backend, nao apenas na UI;
- se o runtime permitir novo `requestAction` por chamada direta, a decisao funcional aprovada fica vulneravel a bypass;
- o responsavel precisa de um fluxo previsivel em que batch encerrado continua visivel, mas nao reabre a mesma etapa.

### 2.2. Owner / operacao de workflows

Pain points:

- o namespace neutro de upload precisa permanecer canonico para todas as areas, sem regressao silenciosa ao prefixo legado de `Facilities`;
- regras duplicadas ou redundantes de permissao aumentam custo de manutencao e risco de drift entre backend e read-side;
- a equipe precisa encerrar a `2D` com contrato simples e auditavel.

### 2.3. Engenharia / manutencao futura

Pain points:

- guard redundante em `canRequestAction` torna a regra mais dificil de ler e revisar;
- helpers de `upload-storage.ts` estao corretos, mas ainda sem testes unitarios diretos, o que fragiliza regressao localizada;
- o time quer fechar a etapa com cobertura explicita dos pontos mais sensiveis antes do commit final.

### 2.4. Auditoria / plataforma

Pain points:

- uploads novos nao podem voltar a nascer sob namespace de `Facilities` por acidente;
- a logica server-side precisa ser a fonte de verdade para impedir reabertura indevida de batch;
- a cobertura automatizada deve distinguir bem regras de contrato de regras de implementacao auxiliar.

---

## 3. Goals

### MUST

- subir para o backend a regra funcional de que `state = completed` e somente leitura, bloqueando novo `requestAction` na mesma etapa quando ja existir batch historico para `currentStepId`;
- manter como contrato canonico o namespace neutro de upload:
  - `Workflows/workflows_v2/uploads/form_field/...`
  - `Workflows/workflows_v2/uploads/action_response/...`
- eliminar redundancia na regra de `canRequestAction` do read-side/UI, usando um criterio unico e legivel que continue coerente com a regra server-side;
- adicionar testes unitarios diretos para os helpers criticos de `upload-storage.ts`, cobrindo pelo menos:
  - `assertAllowedWorkflowUploadPath`
  - `assertAttachmentUrlMatchesStoragePath`
  - `assertUploadIdMatchesFileName`
- preservar a semantica ja aprovada da `2D`:
  - batch encerrado continua visivel no detalhe
  - `completed` nao reabre batch
  - `waiting_action` continua governado apenas por pendencias abertas

### SHOULD

- manter o erro de backend para tentativa de reabrir batch na mesma etapa o mais reaproveitavel possivel, preferencialmente sem criar novo codigo se o catalogo atual ja cobrir o caso;
- deixar a regra de `requestAction` consistente entre:
  - runtime
  - detail permissions
  - UI oficial
- reforcar nos testes que nenhum path novo de upload volta a conter `Facilities e Suprimentos`.

### COULD

- documentar explicitamente no tipo ou nos testes que `hasAnyActionBatchForCurrentStep` e o predicado canonico para bloqueio de reabertura na etapa atual;
- acrescentar teste de regressao garantindo que `requestAction` falha para batch historico encerrado mesmo sem batch pendente.

### WON'T

- nao reabrir a arquitetura da `2D`;
- nao mexer em quorum, `approverIds`, trigger explicito de `requestAction` ou semantica de `approval/rejected`;
- nao criar nova colecao, novo endpoint ou nova superficie de UI;
- nao redesenhar o sistema de uploads alem do namespace neutro e da cobertura dos helpers.

---

## 4. Success Criteria

- `requestAction` falha no backend quando a etapa atual ja tiver qualquer batch historico registrado, mesmo que nao exista batch pendente;
- a UI oficial continua exibindo batch encerrado como `completed`, mas nao expõe CTA reutilizavel para a mesma etapa;
- o predicado de `canRequestAction` no read-side deixa de depender de combinacao redundante entre “sem batch pendente” e “sem batch algum”, adotando uma regra unica e clara;
- existe cobertura automatizada direta para os helpers de `upload-storage.ts` responsaveis por validar namespace/path/url/uploadId;
- existe ao menos um teste de regressao garantindo que uploads novos nao usam o prefixo legado de `Facilities`;
- nenhuma dessas correcoes regressa:
  - integridade do anexo
  - visibilidade do batch encerrado
  - inbox `Atribuicoes e acoes`
  - `waiting_action`

### Clarity Score

`14/15`

Motivo:

- os quatro pontos sao pequenos, concretos e diretamente derivados da revisao do build;
- apenas um deles toca comportamento funcional, e essa decisao ja foi tomada: `completed` e somente leitura;
- o resto e fechamento de consistencia e cobertura, sem ambiguidade relevante para seguir ao design.

---

## 5. Technical Scope

### Backend / Runtime

- ajustar [request-action.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/request-action.ts) para bloquear reabertura de batch quando a etapa atual ja tiver historico de `actionRequests`;
- manter [upload-storage.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/upload-storage.ts) como fonte canonica do namespace neutro e dos helpers de validacao estrutural;
- preservar [respond-action.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/respond-action.ts) como esta, exceto se for necessario pequeno ajuste de erro/mensagem por coerencia com a nova regra server-side.

### Read Side / Detail

- simplificar o criterio de [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts) para `canRequestAction`, removendo o guard redundante e mantendo o bloqueio por qualquer batch da etapa atual;
- garantir que a regra do read-side continue espelhando a regra server-side, sem virar uma segunda fonte de verdade divergente.

### Frontend / Gestao oficial

- sem nova UX;
- apenas manter a superficie atual coerente com a regra simplificada de permissao;
- nenhum delta visual obrigatorio alem do que ja foi construído para `completed`.

### Database / Storage

- nenhuma mudanca de schema em Firestore;
- nenhum backfill ou migracao de objetos no Storage;
- apenas reforco de contrato sobre namespace neutro e validacoes auxiliares.

### AI

- fora do escopo.

### Testing

- adicionar testes unitarios diretos em `upload-storage.test.ts` para os helpers novos;
- adicionar ou ajustar teste de runtime para garantir que `requestAction` falha com batch historico encerrado na mesma etapa;
- manter as suites atuais da `2D` passando no mesmo comando de validacao.

---

## 6. Auth Requirements

- `requestAction` continua sujeito a autorizacao server-side via ator autenticado, e o backend deve permanecer a fonte de verdade para impedir reabertura indevida;
- nenhuma correcao desta microetapa pode transferir para a UI a responsabilidade exclusiva por bloquear reabertura de batch;
- o namespace neutro de upload continua obrigatorio para novos uploads, sem criar excecao por area ou ator;
- os helpers de `upload-storage.ts` devem continuar validando path/url/uploadId sem afrouxar isolamento entre requests e atores.

---

## 7. Out of Scope

- novos tipos de action ou mudanca de payload HTTP;
- reabertura formal de batch como feature suportada;
- redesign do card de action;
- migracao de uploads legados;
- refatoracoes amplas fora dos arquivos diretamente tocados pelos quatro achados.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| Build atual da `2D` com hardening de attachment e `state = completed` | Internal | Ready |
| `DESIGN_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md` | Internal | Ready |
| Suites atuais de runtime/read-side/gestao ja estendidas para `completed` | Internal | Ready |
| Decisao funcional aprovada: `completed` e somente leitura | Internal | Closed |

---

## 9. Next Step

Ready for `/design CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION` para fechar:

- guard server-side de reabertura de batch na mesma etapa;
- simplificacao canonica de `canRequestAction`;
- estrategia exata de testes unitarios diretos para os helpers de `upload-storage.ts`;
- ajustes finais de cobertura para o namespace neutro.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-08 | codex | Initial define for final post-build fixes of Fase 2D, covering backend completed guard, neutral upload namespace consistency, canRequestAction simplification and direct helper coverage |
