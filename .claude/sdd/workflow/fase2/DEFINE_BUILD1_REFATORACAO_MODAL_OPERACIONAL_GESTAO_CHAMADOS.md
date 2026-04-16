# DEFINE: Build 1 - Refatoracao do modal operacional de gestao de chamados

> Generated: 2026-04-16
> Status: Approved for design
> Scope: Fase 2 / Build 1 - correcoes de contrato e fluxo minimo do modal operacional em `/gestao-de-chamados`
> Base document: `BRAINSTORM_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

## 1. Problem Statement

O modal operacional atual de `/gestao-de-chamados` nao representa corretamente a maquina de estados do request, deixando o operador sem CTA de continuidade apos uma action respondida e permitindo finalizacao prematura em etapas intermediarias.

---

## 2. Users

### 2.1. Owner do workflow

Pain points:

- consegue solicitar action no runtime, mas a UI do detalhe nem sempre respeita o mesmo contrato;
- pode enxergar `Finalizar` cedo demais e encerrar o chamado antes de as etapas intermediarias ocorrerem;
- nao tem um caminho operacional explicito para avancar o request quando a etapa atual ja terminou de coletar a action necessaria.

### 2.2. Responsavel atual do chamado

Pain points:

- depois que uma action e respondida, volta para um estado operacional sem um proximo passo claro;
- depende de `advance` para seguir o fluxo, mas esse CTA nao existe hoje na superficie oficial;
- disputa com CTAs globais de footer que nao respeitam a prioridade do fluxo atual.

### 2.3. Destinatario de action pendente

Pain points:

- precisa continuar vendo apenas o CTA de resposta quando existe action pendente para seu usuario;
- nao deve ganhar permissao indevida de `advance` ou `finalize`;
- depende de a UI comunicar corretamente quando sua participacao termina e o chamado volta para o owner/responsavel.

### 2.4. Engenharia / manutencao do runtime

Pain points:

- o contrato do detalhe (`canRequestAction`, `canFinalize`) esta desalinhado do runtime real;
- o endpoint de `advance` ja existe, mas a gestao oficial nao o consome;
- a regra de finalizacao segura ainda nao foi fechada no backend e no read-side.

---

## 3. Goals

### MUST

- expor `advance` na superficie oficial de gestao, usando o endpoint runtime ja existente, sem criar nova rota nem novo entrypoint;
- adicionar um contrato explicito de permissao de detalhe para `advance`, separado de `canFinalize`;
- exibir CTA de `Avancar etapa` quando, e somente quando:
  - o ator autenticado for owner ou responsavel atual;
  - o request estiver em `in_progress`;
  - a etapa atual estiver ativa;
  - nao existir action pendente na etapa atual;
  - quando a etapa atual possuir `action` configurada, o batch da etapa atual ja estiver concluido;
  - existir proxima etapa no `stepOrder`;
  - a proxima etapa nao for a etapa final;
- tratar `action` configurada como obrigatoria para concluir a etapa atual:
  - uma etapa com `action` configurada nao pode avancar nem finalizar sem que exista batch concluido para a etapa atual;
  - ausencia de batch em etapa com `action` configurada deve bloquear continuidade do fluxo;
- alinhar `canRequestAction` entre read-side e runtime para owner ou responsavel atual, mantendo os demais gates ja existentes da action da etapa;
- restringir `canFinalize` no detalhe e no runtime para finalizacao segura, exigindo ao menos:
  - owner ou responsavel atual;
  - request em `in_progress`;
  - etapa atual ativa;
  - ausencia de action pendente na etapa atual;
  - quando a etapa atual possuir `action` configurada, batch concluido na etapa atual;
  - a proxima etapa do fluxo ser a etapa final;
- manter `canRespondAction` restrito ao destinatario com action pendente na etapa atual;
- manter `canArchive` restrito ao owner em requests `finalized` ainda nao arquivados;
- impedir que o modal oficial volte a oferecer `Finalizar` em estados equivalentes ao caso observado no request `#828`, em que ainda existem etapas intermediarias pendentes.

### SHOULD

- centralizar a decisao de visibilidade dos CTAs operacionais no payload oficial de detalhe, evitando inferencias espalhadas no frontend;
- adicionar cobertura automatizada minima para:
  - derivacao de `canAdvance`, `canRequestAction` e `canFinalize`;
  - bloqueio server-side de finalizacao prematura;
  - fluxo de `advance` a partir da gestao oficial;
- manter a mudanca visual do modal o mais cirurgica possivel neste build, sem antecipar a refatoracao estrutural do Build 2.

### COULD

- exibir copy curta de proximo passo no bloco operacional quando `advance` estiver disponivel;
- diferenciar visualmente o CTA principal do fluxo (`Avancar etapa`) das acoes globais secundarias sem ainda redesenhar todo o shell.

### WON'T

- nao redesenhar o modal por zonas visuais completas neste build;
- nao corrigir integralmente clipping, footer e hierarquia visual geral do dialog neste build;
- nao criar nova rota alem de `/gestao-de-chamados`;
- nao reabrir o requester, o historico administrativo ou a pagina inteira de gestao;
- nao mudar a semantica de `respondAction`;
- nao introduzir novas categorias de status ou migracoes de schema.

---

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|----------------|
| Fluxo apos action respondida | Em request intermediario sem action pendente, owner/responsavel ve `Avancar etapa` e nao fica sem CTA de continuidade | Teste do detalhe + verificacao manual no modal oficial |
| Action obrigatoria respeitada | Etapa com `action` configurada nao pode avancar nem finalizar sem batch concluido na etapa atual | Testes de permissao/read-side e use cases de runtime |
| Finalizacao segura | `Finalizar` so aparece quando a etapa atual for a ultima nao-final antes da etapa final | Testes de permissao/read-side e cenarios manuais com workflow multi-etapas |
| Bloqueio server-side | Tentativas de finalizar request em etapa intermediaria retornam erro explicito | Teste do use case `finalize-request` |
| Contrato unificado de action | Owner e responsavel recebem a mesma elegibilidade de `requestAction` quando a etapa atual permitir | Teste de `buildDetailPermissions` e validacao manual no modal |
| Restricao por papel | Destinatario de action continua podendo apenas responder, sem ganhar `advance` ou `finalize` | Teste de permissao por ator |
| Integracao oficial de `advance` | O modal usa o endpoint `/api/workflows/runtime/requests/{id}/advance` via client/hook oficial de management | Revisao de codigo e teste de mutation/refetch |

---

## 5. Technical Scope

### Frontend

- atualizar [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) para suportar CTA de `Avancar etapa` e consumir o novo contrato de permissao;
- manter [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx) como superficie da action da etapa, mas sem deixá-la competir com `Finalizar` indevido;
- integrar a nova mutation em [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx), com feedback e refresh coerentes;
- estender [use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts) e [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts) para expor `advanceManagementRequest`;
- atualizar [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts) para refletir a nova permissao operacional.

### Read Side / Detail Contract

- ajustar [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts) para derivar `canAdvance`, alinhar `canRequestAction` com o runtime e endurecer `canFinalize`;
- estender [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts) para incluir a permissao explicita de `advance`;
- manter o detalhe como fonte de verdade das permissoes operacionais consumidas pela UI.

### Backend / Runtime

- reutilizar o endpoint existente [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/[id]/advance/route.ts) como caminho oficial de `advance` para a gestao;
- endurecer a regra de finalizacao em [finalize-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/finalize-request.ts) para impedir encerramento em etapas intermediarias e para exigir batch concluido quando a etapa atual possuir `action`;
- endurecer a regra de `advance` em [advance-step.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts) para exigir batch concluido quando a etapa atual possuir `action`;
- ajustar os helpers de autorizacao e/ou engine em [authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts) e [engine.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/engine.ts) caso necessario para formalizar a regra de "ultima etapa nao-final";
- manter [advance-step.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts) como a unica transicao explicita entre etapas de trabalho nao-finais.

### Database / Firestore

- nenhuma mudanca de schema em `workflows_v2`;
- nenhuma nova colecao, subcolecao ou migracao de dados;
- apenas ajuste de contrato computado no read-side e nos use cases de runtime.

### AI

- fora do escopo.

### Testing

- testes unitarios de permissao/read-side cobrindo owner, responsavel e destinatario de action;
- testes do use case de `advance` cobrindo:
  - request intermediario sem `action` configurada na etapa atual;
  - request com `action` configurada e batch ainda nao aberto;
  - request com `action` configurada e batch concluido;
  - request com action pendente;
- testes do use case de `finalize` cobrindo:
  - request intermediario com proxima etapa de trabalho;
  - request com `action` configurada e batch ainda nao aberto;
  - request com `action` configurada e batch concluido na ultima etapa nao-final;
  - request elegivel a finalize com proxima etapa final;
  - request com action pendente;
- testes do client/hook oficial cobrindo mutation de `advance` e invalidacao/refetch das queries afetadas.

---

## 6. Auth Requirements

- a autenticacao continua baseada em Firebase Auth + `authenticateManagementV2Actor`;
- `actorUserId` autenticado continua sendo a fonte de verdade para `advance`, `requestAction`, `respondAction`, `finalize` e `archive`;
- a UI nao pode liberar `advance` ou `finalize` por inferencia local divergente do runtime;
- a excecao operacional do owner permanece apenas onde o runtime autoriza explicitamente;
- nenhum ajuste deste build pode ampliar leitura ou escrita para usuarios fora de owner, responsavel atual ou destinatario pendente conforme o contrato vigente.

---

## 7. Out of Scope

- refatoracao visual completa por zonas de contexto;
- reorganizacao ampla do footer, scroll e layout do dialog;
- polimento de copy, destaque visual e estados vazios alem do necessario para o Build 1;
- bateria completa de testes de UX do modal inteiro prevista para o Build 3;
- alteracoes em `/me/tasks`, requester, historico admin ou configuracao de workflows;
- qualquer mudanca estrutural no runtime fora dos contratos de `advance`, `requestAction` e `finalize`.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| Endpoint `POST /api/workflows/runtime/requests/{id}/advance` | Internal | Ready |
| Read-side oficial do detalhe de management | Internal | Ready with correction |
| Runtime de `finalize-request` e `requestAction` | Internal | Ready with correction |
| Entry point `RequestDetailDialog` em `/gestao-de-chamados` | Internal | Ready |

---

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|-------------|-------|
| Problem clarity | 3 | O bug funcional foi demonstrado com caso real e contradicao objetiva entre UI e runtime |
| User identification | 3 | Owner, responsavel e destinatario de action estao definidos com pain points distintos |
| Success criteria measurability | 3 | Os criterios se traduzem em visibilidade de CTA, bloqueio server-side e testes verificaveis |
| Technical scope definition | 3 | As camadas e arquivos afetados estao identificados no frontend, read-side e runtime |
| Edge cases considered | 3 | Foram cobertos request intermediario, request elegivel a finalize, actor indevido e action pendente |
| **TOTAL** | **15/15** | Ready for /design |

---

## 10. Next Step

Ready for `/design BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS` para detalhar:

- shape final do contrato de permissao com `canAdvance`;
- regra tecnica exata para identificar "ultima etapa nao-final" no runtime;
- integracao de mutation/refetch no namespace oficial de management;
- estrategia minima de testes para travar a regressao do caso `#828`.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex (`define` skill) | Initial define for Build 1 of the operational management modal refactor based on the approved brainstorm |
