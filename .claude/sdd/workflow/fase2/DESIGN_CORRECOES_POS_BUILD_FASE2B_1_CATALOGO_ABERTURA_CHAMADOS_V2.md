# DESIGN: Correcoes pos-build da Fase 2B.1 - Catalogo e abertura de chamados v2

> Generated: 2026-04-10
> Status: Ready for build
> Scope: Fase 2 / microetapa corretiva da `2B.1` para fechar gaps de UX, identidade do solicitante, cache e cobertura automatizada
> Base document: `DEFINE_CORRECOES_POS_BUILD_FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2.md`
> Parent design: `DESIGN_FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2.md`

## 1. Objetivo

Corrigir o build ja entregue da `2B.1` sem reabrir a arquitetura macro do requester v2, fechando de forma implementavel:

- fechamento automatico do modal de submissao quando a abertura do chamado concluir com sucesso;
- limpeza consistente do contexto local da pagina (`selectedWorkflow`, `selectedArea`, `showSubmissionModal`);
- uso de `currentUserCollab.name` como origem canonica do `requesterName` enviado pelo requester;
- remocao da invalidacao desnecessaria do catalogo apos `openRequest`;
- cobertura automatizada minima para o fluxo principal corrigido.

Esta microetapa cobre:

- UX de sucesso da rota `/solicitacoes`;
- payload enviado pelo modal de submissao;
- comportamento de cache do hook requester;
- testes focados no delta corretivo.

Esta microetapa nao cobre:

- qualquer alteracao de contrato em `GET /api/workflows/requester/catalog`, mantendo apenas a observacao do prerequisito operacional de indice para a query atual;
- qualquer mudanca estrutural em `POST /api/workflows/runtime/requests`;
- inclusao de `Minhas Solicitacoes` ou read-side requester da `2B.2`;
- refatoracao ampla do renderer dinamico para RHF + schema completo;
- migracao da arquitetura requester para contexts legados.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_CORRECOES_POS_BUILD_FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECOES_POS_BUILD_FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2.md)
- [DESIGN_FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2.md)
- [RequestsV2Page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequestsV2Page.tsx)
- [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/WorkflowSubmissionModal.tsx)
- [use-requester-workflows.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-requester-workflows.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/requester/api-client.ts)
- [catalog-types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/requester/catalog-types.ts)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/route.ts)
- [open-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/open-request.ts)
- [AuthContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/AuthContext.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE` desta microetapa para escopo e aceite;
2. depois prevalece o design pai da `2B.1` para arquitetura macro do requester;
3. depois prevalece o contrato real do endpoint de runtime ja existente;
4. depois prevalece este design para orientar o build corretivo.

---

## 3. Estado Atual e Gaps Reais

### 3.1. O que o codigo faz hoje

- `RequestsV2Page` controla a selecao de area/workflow e a abertura dos modais com `useState` local;
- o toast de sucesso ja pertence ao container da pagina, nao ao modal;
- `WorkflowSubmissionModal` reseta o formulario apos sucesso e chama `onSuccess(result.requestId)`;
- o modal atual envia `requesterName: user.displayName || user.email || ''`;
- `useOpenRequesterWorkflow()` invalida `['workflows', 'requester', 'catalog']` em todo sucesso;
- a rota `POST /api/workflows/runtime/requests` ja faz fallback server-side para `actor.actorName` quando `requesterName` vier vazio;
- o estado `submittedRequestId` em `RequestsV2Page` esta morto: e gravado, mas nao e lido em nenhum lugar.

### 3.2. Lacunas objetivas em relacao ao DEFINE aprovado

- o modal de submissao permanece aberto depois de um submit bem-sucedido;
- a limpeza de `selectedWorkflow` e `selectedArea` so acontece quando o usuario fecha manualmente o dialog;
- o payload do requester ainda pode persistir um nome derivado do Google em vez do colaborador operacional reconciliado;
- a mutation de abertura ainda faz refetch do catalogo, embora a abertura de um request nao altere areas ou workflows publicados;
- nao ha testes do requester 2B.1 cobrindo o fluxo principal corrigido.
- a query atual do catalogo requester exige indice composto no Firestore (`active == true` + `latestPublishedVersion != null`), e esse prerequisito operacional precisa ser lembrado para qualquer novo ambiente.

### 3.3. Invariantes que esta microetapa precisa preservar

- `/solicitacoes` continua sendo a rota oficial da `2B.1`;
- `RequestsV2Page` continua isolada de `ApplicationsContext` e `WorkflowsContext`;
- `POST /api/workflows/runtime/requests` continua com o mesmo endpoint e o mesmo envelope de resposta;
- `GET /api/workflows/requester/catalog` continua com a mesma query e o mesmo shape de resposta; o requisito novo aqui e operacional, nao contratual;
- o fallback server-side de `requesterName` continua sendo a ultima linha de defesa;
- o toast de sucesso deve sobreviver ao fechamento do modal;
- nenhuma mudanca de schema em `workflows_v2` faz parte desta entrega.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Authenticated user
  |
  v
/solicitacoes
  |
  v
RequestsV2Page
  |
  +--> useRequesterCatalog()
  |
  +--> WorkflowSelectionModal
  |
  \--> WorkflowSubmissionModal
         |
         +--> useAuth()
         |      |- user
         |      \- currentUserCollab
         |
         +--> usePublishedWorkflow(workflowTypeId)
         +--> uploadWorkflowFile(...)
         \--> useOpenRequesterWorkflow()
                |
                \--> POST /api/workflows/runtime/requests
                       |
                       \--> requesterName:
                              currentUserCollab.name trimmed
                              or ''
                              -> server fallback to actor.actorName

Success path
  |
  +--> WorkflowSubmissionModal calls onSuccess(requestId)
  |
  \--> RequestsV2Page.handleSubmissionSuccess()
         |- show toast
         |- close submission modal
         |- clear selectedWorkflow
         \- clear selectedArea
```

### 4.2. Fluxo fechado por camada

```text
LAYER 1 (Client page)
1. Usuario escolhe area e workflow como hoje.
2. RequestsV2Page continua sendo dona do estado local do fluxo.
3. O sucesso da abertura passa a ser finalizado no container da pagina.

LAYER 2 (Submission modal)
4. WorkflowSubmissionModal continua montando formData e fazendo uploads.
5. requesterName passa a ser derivado de currentUserCollab.name.
6. Se currentUserCollab.name estiver vazio, o cliente envia string vazia.

LAYER 3 (Mutation / cache)
7. useOpenRequesterWorkflow continua encapsulando o POST.
8. O onSuccess deixa de invalidar o catalogo requester.
9. Nenhuma outra query da 2B.1 passa a ser invalidada nesta microetapa.

LAYER 4 (Server / operational prerequisites)
10. POST /api/workflows/runtime/requests segue sem mudanca de contrato.
11. O backend continua resolvendo actor.actorName como fallback canonico.
12. openRequest continua persistindo requesterName no read-model e no history inicial.
13. `GET /api/workflows/requester/catalog` permanece com a query atual, e continua dependendo do indice composto correspondente no Firestore como prerequisito operacional ja atendido no ambiente atual.
```

### 4.3. Ownership do estado de sucesso

O fechamento do fluxo bem-sucedido fica centralizado no container [RequestsV2Page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequestsV2Page.tsx), nao no modal.

Regras fechadas:

- `WorkflowSubmissionModal` continua responsavel apenas por:
  - validar campos;
  - subir anexos;
  - chamar a mutation;
  - resetar o formulario interno;
  - emitir `onSuccess(requestId)`.
- `RequestsV2Page` passa a ser responsavel por:
  - disparar o toast;
  - fechar o modal;
  - limpar `selectedWorkflow`;
  - limpar `selectedArea`;
  - remover o estado morto `submittedRequestId`, se nao houver novo uso real no build.

Esta distribuicao preserva o toast fora do subtree que sera desmontado e evita duplicar regra de limpeza entre parent e child.

---

## 5. Architecture Decisions

### ADR-2B1-FIX-001: o sucesso fecha o fluxo no container da pagina

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O modal ja sobe `onSuccess`, mas a limpeza do estado hoje so existe no fechamento manual. O toast ja vive no parent. |

**Choice:** usar `handleSubmissionSuccess(requestId)` em `RequestsV2Page` como ponto canonico para toast + fechamento + limpeza do contexto local.

**Rationale:**

1. o parent ja e dono de `selectedArea`, `selectedWorkflow` e `showSubmissionModal`;
2. o toast nao depende do modal continuar montado;
3. a regra fica unica e tambem cobre futuros CTAs de submit bem-sucedido sem duplicacao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| fechar o dialog exclusivamente dentro do modal | fragmenta a responsabilidade e nao limpa o estado do parent por si so |
| manter o modal aberto apos sucesso | contradiz o aceite principal do DEFINE e deixa espaco para reenvio acidental |

### ADR-2B1-FIX-002: `currentUserCollab.name` e a origem canonica do `requesterName`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O modal hoje usa `user.displayName`, mas a identidade operacional canonica do projeto esta em `currentUserCollab`. |

**Choice:** o cliente passa a enviar `currentUserCollab.name.trim()` quando disponivel; se nao houver nome canonico, envia `''` para permitir que o backend aplique `actor.actorName`.

**Rationale:**

1. alinha o requester v2 ao colaborador reconciliado do dominio;
2. evita persistir nomes inconsistentes do Google;
3. reaproveita o fallback server-side ja existente, sem alterar endpoint nem schema.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| continuar usando `user.displayName` como fallback client-side | preserva o problema central de inconsistencias do nome operacional |
| tornar `requesterName` opcional no contrato inteiro agora | adiciona delta de tipos e API sem necessidade para esta microetapa |

### ADR-2B1-FIX-003: abrir request nao invalida o catalogo requester

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | A mutation de abertura hoje invalida o catalogo, mas o POST nao muda `workflowAreas`, workflows ativos ou metadata publicada. |

**Choice:** remover o `invalidateQueries({ queryKey: ['workflows', 'requester', 'catalog'] })` de `useOpenRequesterWorkflow()`.

**Rationale:**

1. elimina refetch desnecessario no fluxo mais frequente da tela;
2. reduz custo de rede e flicker potencial;
3. respeita o fato de que a `2B.1` ainda nao carrega uma lista "Minhas Solicitacoes" que exigiria refresh.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter invalidador por precaucao | custo sem beneficio funcional real |
| trocar por `setQueryData` local | complexidade sem necessidade, pois o catalogo nao muda |

### ADR-2B1-FIX-004: a cobertura minima sera dividida entre componente e hook

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | Os gaps estao repartidos entre comportamento de tela e politica de cache, e hoje nao ha testes requester 2B.1. |

**Choice:** cobrir fechamento/toast e origem do payload com testes de componente, e cobrir ausencia de invalidacao do catalogo com teste de hook.

**Rationale:**

1. reduz mocking desnecessario de UI no teste de cache;
2. permite assertar o payload real montado no modal;
3. mantem cada teste focado em um comportamento observavel.

### ADR-2B1-FIX-005: o indice do catalogo requester permanece como prerequisito operacional documentado

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O teste manual da rota `/api/workflows/requester/catalog` mostrou que a query `active == true` + `latestPublishedVersion != null` depende de indice composto no Firestore. O indice ja foi criado manualmente no ambiente atual, mas o prerequisito precisa continuar documentado. |

**Choice:** manter a query atual do catalogo requester e registrar explicitamente, neste design, que ela depende de um indice composto no Firestore como prerequisito operacional ja atendido no ambiente atual.

**Rationale:**

1. evita mascarar o problema com fallback de filtragem em memoria;
2. preserva a estrategia server-side correta do catalogo requester;
3. evita que um prerequisito operacional real volte a ficar implicito em futuros ambientes.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| redesenhar a query agora para evitar indice | reabre a arquitetura do catalogo requester sem necessidade nesta microetapa |
| ignorar o indice no design por ser operacional | faz o prerequisito desaparecer da documentacao e aumenta o risco de repetir o problema em outro ambiente |

---

## 6. Contratos Tecnicos Fechados

### 6.1. Contrato de sucesso da tela

Quando `openRequesterWorkflow()` resolver com sucesso:

1. `WorkflowSubmissionModal` chama `onSuccess(result.requestId)`;
2. `RequestsV2Page.handleSubmissionSuccess(requestId)` deve:
   - disparar o toast de sucesso;
   - setar `showSubmissionModal = false`;
   - limpar `selectedWorkflow`;
   - limpar `selectedArea`;
3. o usuario nao deve permanecer em um estado no qual o dialog continue aberto com o formulario ja enviado;
4. `WorkflowSelectionModal` nao deve reabrir automaticamente;
5. o cancelamento manual continua usando o mesmo helper de limpeza do fluxo.

Semantica fechada:

- o toast continua sendo emitido fora do modal;
- o fechamento do modal nao depende de `onOpenChange` disparado pela biblioteca de dialog;
- o `requestId` continua sendo a unica informacao exibida no feedback de sucesso desta microetapa.

### 6.2. Contrato de `requesterName`

Contrato do client apos a correcao:

```ts
type OpenRequesterWorkflowInput = {
  workflowTypeId: string;
  requesterName: string;
  formData: Record<string, unknown>;
};
```

Sem mudanca estrutural de tipo. O ajuste e semantico:

- `requesterName` deve ser:
  - `currentUserCollab.name.trim()` quando houver nome operacional;
  - `''` quando o nome operacional nao estiver disponivel naquele render.
- o cliente nao deve usar `user.displayName` nem `user.email` para preencher esse campo na `2B.1` corretiva;
- a rota `POST /api/workflows/runtime/requests` continua tratando string vazia como sinal para usar `actor.actorName`.

Consequencia explicita:

- o fallback canonico passa a ser centralizado no backend;
- o requester deixa de tomar decisoes paralelas sobre identidade nominal.

### 6.3. Contrato de cache do requester

Depois da correcao:

- `useRequesterCatalog()` continua com:
  - query key `['workflows', 'requester', 'catalog']`;
  - `staleTime` de 5 minutos.
- `usePublishedWorkflow(workflowTypeId)` continua sem mudanca;
- `useOpenRequesterWorkflow()` continua expondo a mesma mutation, mas sem `onSuccess` que invalide o catalogo.

Regra fechada desta microetapa:

- abrir chamado nao invalida nenhuma query requester por padrao;
- qualquer futura invalidacao de lista de requests do solicitante fica para a `2B.2`, quando essa superficie existir de fato;
- o sucesso do submit passa a ser tratado como efeito local de UX, nao como evento de refresh do catalogo.

### 6.4. Precondicao operacional do catalogo requester

Sem mudanca de shape ou endpoint, mas com uma exigencia operacional explicita:

- a query atual de `GET /api/workflows/requester/catalog` depende de indice composto no Firestore para `workflowTypes_v2`;
- esse indice deve existir em qualquer ambiente onde a `2B.1` sera validada ou executada;
- a microetapa corretiva nao substitui a query por filtragem em memoria;
- no ambiente atual, esse prerequisito ja foi atendido manualmente;
- o smoke final da `/solicitacoes` continua dependendo da rota responder `200`, sem `FAILED_PRECONDITION`.

Indice esperado:

- collection: `workflowTypes_v2`
- fields:
  - `active` -> ascending
  - `latestPublishedVersion` -> ascending
- query scope: collection

---

## 7. Manifesto de Arquivos

### 7.1. UI requester

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/components/workflows/requester/RequestsV2Page.tsx` | Modify | centralizar o encerramento do fluxo bem-sucedido, reaproveitar a limpeza local existente e remover `submittedRequestId` se continuar sem uso |
| `src/components/workflows/requester/WorkflowSubmissionModal.tsx` | Modify | consumir `currentUserCollab` de `useAuth`, montar `requesterName` canonico e manter `onSuccess(requestId)` como callback puro de sucesso |

### 7.2. Hook de dados

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/hooks/use-requester-workflows.ts` | Modify | remover a invalidacao do catalogo no `onSuccess` da mutation de abertura |

### 7.3. Backend e contratos que permanecem estaveis

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/app/api/workflows/runtime/requests/route.ts` | None | preservar fallback server-side de `requesterName` |
| `src/lib/workflows/requester/catalog-types.ts` | None | manter contrato tipado atual do input/output requester |
| `src/lib/workflows/requester/api-client.ts` | None | preservar cliente HTTP autenticado do requester |
| `src/lib/workflows/runtime/use-cases/open-request.ts` | None | preservar persistencia de `requesterName` no runtime/read-model |

### 7.3.1. Dependencia operacional externa ao codigo

| Item | Change | Responsabilidade |
|------|--------|------------------|
| Firestore composite index de `workflowTypes_v2` | Already created in current environment / prerequisito para novos ambientes | garantir execucao da query do catalogo requester em ambiente real |

### 7.4. Testes

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx` | Create | validar toast + fechamento do modal + limpeza do contexto apos `onSuccess` |
| `src/components/workflows/requester/__tests__/WorkflowSubmissionModal.test.tsx` | Create | validar que o payload usa `currentUserCollab.name` e nao `user.displayName`; validar fallback para string vazia quando o nome operacional estiver ausente |
| `src/hooks/__tests__/use-requester-workflows.test.tsx` | Create | validar que `useOpenRequesterWorkflow()` nao chama `invalidateQueries` do catalogo apos sucesso |

### 7.5. Skills e ownership recomendados para o build

- skill `build`: implementacao direta a partir deste design;
- skill `iterate`: somente se o contrato semantico de `requesterName` ou a cobertura de testes mudar durante o build;
- worker `requester-ui`: ownership em `src/components/workflows/requester/**`;
- worker `requester-hooks-tests`: ownership em `src/hooks/use-requester-workflows.ts` e testes requester relacionados.

---

## 8. Code Patterns Copy-Paste

### 8.1. Encerramento canonico do sucesso em `RequestsV2Page`

```ts
const resetSubmissionFlow = React.useCallback(() => {
  setShowSubmissionModal(false);
  setSelectedWorkflow(null);
  setSelectedArea(null);
}, []);

const handleSubmissionSuccess = (requestId: number) => {
  toast({
    title: 'Solicitacao aberta com sucesso!',
    description: `Seu numero de solicitacao e ${requestId}.`,
  });

  resetSubmissionFlow();
};
```

Regras do pattern:

- o helper de reset deve ser compartilhado entre sucesso e cancelamento manual;
- se `handleSubmissionModalClose` continuar existindo, ele deve delegar para `resetSubmissionFlow()` em vez de duplicar os mesmos `setState`;
- o parent nao depende de estado auxiliar `submittedRequestId` para exibir o toast.

### 8.2. Payload canonico do solicitante no modal

```ts
const { user, currentUserCollab } = useAuth();

const canonicalRequesterName = currentUserCollab?.name?.trim() || '';

const result = await openMutation.mutateAsync({
  workflowTypeId: workflow.workflowTypeId,
  requesterName: canonicalRequesterName,
  formData,
});
```

Regras do pattern:

- nao usar `user.displayName` nem `user.email` nesse payload;
- string vazia e intencional para acionar o fallback server-side.

### 8.3. Mutation sem invalidacao do catalogo

```ts
export function useOpenRequesterWorkflow() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: OpenRequesterWorkflowInput) => {
      if (!user) {
        throw new Error('Usuario nao autenticado');
      }

      return openRequesterWorkflow(user, payload);
    },
  });
}
```

Observacao:

- se no futuro a `2B.2` adicionar uma query de requests do solicitante, a invalidacao dessa nova lista deve ser decidida explicitamente naquele design, nao reintroduzida implicitamente aqui.

---

## 9. API Contract

### 9.1. `POST /api/workflows/runtime/requests`

Sem alteracao de endpoint ou envelope.

Request esperado pelo cliente requester:

```json
{
  "workflowTypeId": "facilities_manutencao_solicitacoes_gerais",
  "requesterName": "Lucas Nogueira",
  "formData": {
    "descricao": "Ar-condicionado sem funcionar"
  }
}
```

Semantica apos esta microetapa:

- `requesterName` pode continuar sendo string vazia no request wire format;
- quando vier vazio ou whitespace, a rota continua usando `actor.actorName`;
- a resposta permanece:

```json
{
  "ok": true,
  "data": {
    "requestId": 1001,
    "docId": "abc123"
  }
}
```

### 9.2. Superficie que explicitamente nao muda

Permanecem sem delta:

- `GET /api/workflows/requester/catalog`
- `GET /api/workflows/catalog/[workflowTypeId]`
- contratos de upload em `uploadWorkflowFile(...)`
- schema persistido de `workflows_v2`

---

## 10. Testing Strategy

### 10.1. Fluxo de sucesso da pagina requester

Cobrir em `RequestsV2Page.test.tsx`:

- abrir o modal de submissao a partir de uma area/workflow mockado;
- simular `onSuccess(1001)` vindo do modal;
- verificar:
  - toast de sucesso disparado com `requestId`;
  - modal fechado;
  - selecao local limpa;
  - ausencia de reabertura automatica do fluxo.

### 10.2. Payload canonico do modal

Cobrir em `WorkflowSubmissionModal.test.tsx`:

- quando `currentUserCollab.name = 'Lucas Nogueira'`, a mutation recebe esse valor em `requesterName`;
- `user.displayName` divergente nao deve ser usado no payload;
- quando `currentUserCollab.name` estiver vazio/ausente, a mutation recebe `requesterName: ''`;
- o modal continua chamando `onSuccess(requestId)` apos submit bem-sucedido.

### 10.3. Politica de cache do hook

Cobrir em `use-requester-workflows.test.tsx`:

- `useOpenRequesterWorkflow()` continua chamando `openRequesterWorkflow(user, payload)`;
- apos sucesso, `invalidateQueries` nao e chamado com `['workflows', 'requester', 'catalog']`;
- o hook continua falhando cedo se `user` estiver ausente.

### 10.4. Risco residual aceito

Fica fora desta microetapa:

- teste end-to-end browser real de upload + submit;
- cobertura profunda do renderer dinamico para todos os tipos de campo;
- testes de contrato do endpoint de runtime, pois a API nao muda.

### 10.5. Observacao operacional para smoke manual

Para qualquer ambiente onde a `2B.1` for validada:

1. confirmar que o indice composto do catalogo requester existe e esta pronto;
2. validar que `GET /api/workflows/requester/catalog` responde `200`;
3. so entao executar o smoke manual completo da rota `/solicitacoes`.

No ambiente atual, esse indice ja foi criado manualmente.

---

## 11. Rollback Plan

### 11.1. Rollback de codigo

Se a correcao causar regressao inesperada:

1. restaurar o comportamento anterior de `RequestsV2Page` e `WorkflowSubmissionModal`;
2. reativar temporariamente a invalidacao do catalogo apenas se houver evidencia concreta de dependencia funcional;
3. manter o endpoint server-side inalterado durante o rollback.

### 11.2. Rollback de dados

Nao ha migracao nem alteracao de schema.

Impacto em dados se o build precisar ser revertido:

- requests ja abertos com `requesterName` canonico permanecem validos;
- requests abertos com fallback `actor.actorName` permanecem validos;
- nenhum cleanup em Firestore e necessario.

### 11.3. Condicao de seguranca para deploy

O build so deve seguir para merge/deploy se:

- os testes requester novos estiverem verdes;
- o fluxo manual confirmar fechamento do modal apos sucesso;
- o payload observado no mock/teste usar `currentUserCollab.name` ou string vazia, nunca `user.displayName`;
- nao houver refetch do catalogo apos submit bem-sucedido.
- a query `GET /api/workflows/requester/catalog` estiver funcionando em ambiente real, sem `FAILED_PRECONDITION` de indice ausente.
