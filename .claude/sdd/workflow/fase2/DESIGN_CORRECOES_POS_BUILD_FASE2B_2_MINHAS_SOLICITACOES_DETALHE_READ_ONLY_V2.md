# DESIGN: Correcoes pos-build da Fase 2B.2 - Minhas Solicitacoes e detalhe read-only v2

> Generated: 2026-04-10
> Status: Ready for /build
> Scope: Microetapa corretiva da `2B.2` para fechar gaps de fidelidade funcional, acessibilidade e resiliencia do requester
> Base document: `DEFINE_CORRECOES_POS_BUILD_FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2.md`
> Parent design: `DESIGN_FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2.md`

## 1. Objetivo

Corrigir o build ja entregue da `2B.2` sem reabrir a arquitetura macro do requester v2, fechando de forma implementavel:

- restauracao do nome real da etapa/status na coluna `Status` de `Minhas Solicitacoes`;
- exibicao de label amigavel para `Aberto em` no detalhe read-only;
- acessibilidade minima do CTA de abertura do detalhe e do shell do dialog;
- preservacao do ultimo detalhe valido em erros nao bloqueantes ou refetches falhos;
- cobertura automatizada minima da integracao entre `RequestsV2Page`, `MyRequestsV2Section` e `MyRequestDetailDialog`.

Esta microetapa cobre:

- o comportamento visual e semantico do requester em `/solicitacoes`;
- a camada de hook/query do detalhe read-only;
- o reaproveitamento do catalogo requester como fonte de labels de area;
- testes focados no delta corretivo.

Esta microetapa nao cobre:

- novos endpoints requester-specific;
- refatoracao profunda dos componentes compartilhados de `management/`;
- mudanca do contrato backend de `GET /api/workflows/read/mine` ou `GET /api/workflows/read/requests/[requestId]`;
- nova politica global de cache alem do fluxo do detalhe;
- reabertura da discussao sobre permissao do endpoint de detalhe, ja fechada no DEFINE.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_CORRECOES_POS_BUILD_FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECOES_POS_BUILD_FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2.md)
- [DESIGN_FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2.md)
- [MyRequestsV2Section.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/MyRequestsV2Section.tsx)
- [RequesterRequestSummaryHeader.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequesterRequestSummaryHeader.tsx)
- [MyRequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/MyRequestDetailDialog.tsx)
- [RequestsV2Page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequestsV2Page.tsx)
- [use-requester-workflows.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-requester-workflows.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [catalog-types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/requester/catalog-types.ts)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE` desta microetapa para escopo e aceite;
2. depois prevalece o design pai da `2B.2` para arquitetura macro;
3. depois prevalece o contrato real dos endpoints de leitura ja existentes;
4. depois prevalece este design para orientar o build corretivo.

---

## 3. Estado Atual e Gaps Reais

### 3.1. O que o codigo faz hoje

- `MyRequestsV2Section` deriva o label da coluna `Status` exclusivamente de `statusCategory`, descartando `currentStepName`;
- o botao do olho e renderizado sem `aria-label`, e os testes localizam o CTA por `name: ''`;
- `RequesterRequestSummaryHeader` renderiza `areaId` cru em `Aberto em`;
- `RequestsV2Page` ja possui o catalogo requester carregado com `areaId` e `areaName`, mas nao o reaproveita no fluxo do detalhe;
- `MyRequestDetailDialog` renderiza um alerta destrutivo quando a query falha, porem depende diretamente de `data` da query para manter o conteudo;
- `RequestDetailDialog` de `management/` usa `DialogDescription`, enquanto o requester ainda nao fornece descricao estrutural ao dialog;
- ha testes de componente separados para `MyRequestsV2Section` e `MyRequestDetailDialog`, mas a integracao de `RequestsV2Page` com a secao e o dialog ainda e superficial.

### 3.2. Lacunas objetivas em relacao ao DEFINE aprovado

- a tabela do requester nao mostra o andamento real do request e reduz a coluna `Status` a um resumo generico;
- o header do detalhe perde legibilidade ao mostrar `areaId` tecnico mesmo quando o requester ja conhece `areaName`;
- o CTA do detalhe nao atende o minimo de acessibilidade para leitores de tela;
- o requester depende do comportamento implicito do cache do React Query para preservar detalhe valido em erro nao bloqueante, sem contrato explicito no hook;
- a suite nao cobre de ponta a ponta o clique no olho, a abertura do dialog e a limpeza de `selectedRequestId` ao fechar;
- o shell atual do dialog pode emitir warning estrutural de acessibilidade por falta de descricao.

### 3.3. Invariantes que esta microetapa precisa preservar

- `/solicitacoes` continua sendo a rota oficial do requester v2;
- `GET /api/workflows/read/mine` e `GET /api/workflows/read/requests/[requestId]` continuam sendo as unicas fontes de leitura;
- o dialog requester continua estritamente read-only, ignorando `permissions` operacionais;
- o catalogo requester continua sendo carregado apenas uma vez na pagina, sem nova query para resolver nome de area;
- o shape de `WorkflowReadSummary` e `WorkflowRequestDetailData` nao muda;
- os blocos read-only reutilizados de `management/` continuam sendo usados para `formData`, `progress`, `timeline` e `attachments`.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Authenticated requester
  |
  v
/solicitacoes
  |
  v
RequestsV2Page
  |
  +--> useRequesterCatalog()
  |      |
  |      \--> catalog[] { areaId, areaName, workflows[] }
  |
  +--> areaLabelById: Map<string, string>          ← NOVO REUSO
  |
  +--> MyRequestsV2Section
  |      |
  |      +--> useMyRequests()
  |      +--> status badge variant from statusCategory
  |      \--> status label from currentStepName     ← CORRECAO
  |
  \--> MyRequestDetailDialog
         |
         +--> useRequestDetail(requestId, open)
         |      |
         |      \--> lastSuccessfulDetail snapshot  ← NOVO CONTRATO
         |
         +--> RequesterRequestSummaryHeader
         |      \--> areaId -> areaName via areaLabelById
         |
         +--> RequestFormData
         +--> RequestProgress
         +--> RequestTimeline
         \--> RequestAttachments

fetch with bearer token
  |
  +--> GET /api/workflows/read/mine
  \--> GET /api/workflows/read/requests/[requestId]
```

### 4.2. Fluxo fechado por camada

```text
LAYER 1 (Page / orchestration)
1. RequestsV2Page continua carregando o catalogo requester.
2. A pagina deriva um mapa local areaLabelById a partir de catalog.
3. Esse mapa e passado ao dialog requester sem criar contexto novo.

LAYER 2 (Requester list)
4. MyRequestsV2Section continua consumindo useMyRequests().
5. A coluna Status passa a usar currentStepName como label primario.
6. statusCategory continua sendo usado apenas para variante visual do badge.
7. O botao do olho passa a ter aria-label deterministico por requestId.

LAYER 3 (Requester detail)
8. MyRequestDetailDialog continua abrindo por requestId.
9. useRequestDetail() passa a expor o ultimo detalhe valido do request aberto.
10. Em erro apos sucesso, o dialog mantem o snapshot renderizado e exibe alerta nao bloqueante.
11. O header resolve Aberto em via areaLabelById e cai para areaId quando nao houver correspondencia.
12. O DialogHeader recebe DialogDescription explicita para eliminar warning estrutural.

LAYER 4 (Backend / API)
13. GET /api/workflows/read/mine continua retornando WorkflowGroupedReadData.
14. GET /api/workflows/read/requests/[requestId] continua retornando WorkflowRequestDetailData.
15. Nenhum endpoint novo, nenhum ajuste de schema, nenhuma mudanca de autorizacao.
```

### 4.3. Ownership de estado e fallback

Regras fechadas:

- `RequestsV2Page` e dona do catalogo e, portanto, da resolucao `areaId -> areaName`;
- `useRequestDetail()` passa a ser dono do contrato "ultimo detalhe valido" para nao espalhar fallback de cache entre `Dialog` e testes;
- `MyRequestDetailDialog` continua dono apenas da apresentacao do estado:
  - loading bloqueante quando nunca houve dado para aquele request;
  - alerta nao bloqueante quando houver snapshot valido e o refresh falhar;
  - estado destrutivo/bloqueante apenas quando nao existir snapshot valido.

Essa distribuicao evita:

- duplicar a estrategia de fallback em cada consumidor;
- criar um novo fetch so para obter label de area;
- acoplar a semantica de resiliencia a detalhes internos do React Query.

---

## 5. Architecture Decisions

### ADR-2B2-FIX-001: `currentStepName` volta a ser o label canonico da coluna `Status`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O read model ja expoe `currentStepName`, mas a implementacao atual descarta esse dado e sintetiza um label a partir de `statusCategory`, reduzindo a informacao util da tabela. |

**Choice:** usar `currentStepName || fallbackPorStatusCategory` como label canonico na coluna `Status`, mantendo `statusCategory` apenas para definir a variante visual do badge.

**Rationale:**

1. `currentStepName` e o dado funcional mais especifico e alinhado ao andamento real do request.
2. `statusCategory` ainda e util para cor/semantica visual, mas nao substitui o nome da etapa.
3. O fallback para casos anormais preserva resiliencia caso algum registro legado nao traga `currentStepName`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| continuar usando apenas `statusCategory` | mantem a perda de fidelidade funcional apontada no DEFINE |
| trocar tudo para uma nova helper compartilhada fora do requester | adiciona refactor horizontal desnecessario para uma microcorrecao localizada |

**Consequences:**

- Positivo: a tabela volta a refletir o andamento oficial exposto pelo backend.
- Negativo: alguns registros antigos podem continuar caindo em fallback se estiverem incompletos.

---

### ADR-2B2-FIX-002: o nome amigavel da area vem do catalogo ja carregado na pagina

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | `RequestsV2Page` ja possui `RequesterCatalogArea[]` com `areaId` e `areaName`. O dialog hoje ignora essa fonte e mostra `areaId` cru no header. |

**Choice:** derivar `areaLabelById` em `RequestsV2Page` a partir do catalogo requester e passar esse mapa para `MyRequestDetailDialog` ou diretamente para `RequesterRequestSummaryHeader`.

**Rationale:**

1. reaproveita um dado ja disponivel no cliente sem novo round-trip;
2. preserva o isolamento do requester em relacao a contexts legados como `WorkflowAreasContext`;
3. centraliza a resolucao de label em um ponto previsivel e facil de testar.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| buscar `workflowAreas` num contexto global legado | amplia acoplamento e foge do isolamento da arquitetura requester |
| adicionar novo endpoint de detalhe com `areaName` expandido | muda contrato backend sem necessidade |

**Consequences:**

- Positivo: `Aberto em` fica legivel sem custo extra de rede.
- Negativo: se o catalogo nao incluir a area do request, o requester continua dependendo do fallback para `areaId`.

---

### ADR-2B2-FIX-003: o contrato "ultimo detalhe valido" fica no hook, nao no dialog

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O requisito de preservar o ultimo detalhe valido em erro/refetch e parte do comportamento de dados, nao apenas de apresentacao. O requester nao deve depender implicitamente do cache do React Query para isso. |

**Choice:** ajustar `useRequestDetail()` para devolver um `stableData` derivado do ultimo sucesso para o `requestId` atual, junto do estado bruto da query para distinguir erro bloqueante de erro nao bloqueante.

**Rationale:**

1. fecha um contrato explicito no proprio hook, deixando o dialog mais simples;
2. evita regressao se a estrategia de cache do React Query mudar no futuro;
3. torna o comportamento facilmente testavel em hook e em componente.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| confiar apenas em `query.data` durante erro de refetch | o comportamento fica implicito e mais fragil para manutencao |
| armazenar o ultimo detalhe em estado local do dialog | mistura regra de dados com camada de apresentacao e complica o reset por requestId |

**Consequences:**

- Positivo: o requester passa a ter semantica deterministica para erro nao bloqueante.
- Negativo: o hook fica um pouco mais opinado e precisa diferenciar snapshots por `requestId`.

---

### ADR-2B2-FIX-004: acessibilidade minima deve ser deterministica e testada por nome

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O CTA do olho nao possui nome acessivel e o dialog requester nao declara descricao, o que gera testes fracos e warning estrutural de acessibilidade. |

**Choice:** adicionar `aria-label` especifico ao botao do olho e incluir `DialogDescription` no requester dialog com texto curto do contexto exibido.

**Rationale:**

1. melhora navegacao assistiva com custo minimo;
2. troca asserts frageis por seletores baseados em acessibilidade;
3. alinha o requester ao padrao ja usado em `management/RequestDetailDialog`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter teste localizando o botao por `name: ''` | perpetua um anti-pattern e mascara a ausencia de nome acessivel |
| ignorar o warning do dialog nos testes | deixa uma falha estrutural conhecida sem correção |

**Consequences:**

- Positivo: testes e UX ficam mais robustos.
- Negativo: qualquer mudanca futura no texto do `aria-label` exigira ajuste de testes, o que e aceitavel.

---

### ADR-2B2-FIX-005: a integracao requester deve ser coberta na pagina, nao apenas nos componentes isolados

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | Os testes atuais validam partes da `2B.2`, mas nao asseguram a costura entre lista, abertura do dialog e limpeza do estado local da pagina. |

**Choice:** expandir `RequestsV2Page.test.tsx` para cobrir render da secao `Minhas Solicitacoes`, clique no olho, abertura do dialog e limpeza de `selectedRequestId`/fechamento ao encerrar o modal.

**Rationale:**

1. e o ponto mais barato para validar a integracao real sem subir E2E completo;
2. protege contra regressao de wiring entre props e estado local;
3. reduz risco de um componente isolado passar enquanto a experiencia integrada quebra.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| cobrir tudo so em testes unitarios de cada componente | deixa descoberto o fluxo de integracao que o DEFINE explicitamente pede |
| empurrar essa cobertura para E2E futuro | posterga uma verificacao barata e importante desta microetapa |

**Consequences:**

- Positivo: a page passa a ser protegida contra regressao funcional basica.
- Negativo: o teste da pagina exigira mocks um pouco mais completos do requester.

---

## 6. Contratos Tecnicos Fechados

### 6.1. Contrato da coluna `Status`

A tabela `Minhas Solicitacoes` continua mostrando um `Badge`, mas com semantica fechada:

- `label` do badge:
  - `item.currentStepName` quando houver valor nao vazio;
  - fallback para o label sintetizado atual quando `currentStepName` vier vazio ou ausente.
- `variant` do badge:
  - continua vindo de `statusCategory` e de `hasResponsible` para manter a pista visual ja implementada.

Consequencia explicita:

- a microetapa corrige a fidelidade textual sem reabrir a estrategia visual do badge.

### 6.2. Contrato de `Aberto em`

O header requester passa a trabalhar com dois conceitos distintos:

- `areaId`: dado cru vindo de `detail.summary.areaId`;
- `openedInLabel`: label amigavel resolvida no cliente.

Semantica apos a correcao:

- `RequestsV2Page` monta `areaLabelById` a partir de `catalog`;
- `MyRequestDetailDialog` resolve `openedInLabel = areaLabelById.get(summary.areaId) ?? summary.areaId ?? '-'`;
- `RequesterRequestSummaryHeader` passa a receber/renderizar `openedInLabel`, nao apenas `areaId`.

### 6.3. Contrato de resiliencia do detalhe

`useRequestDetail(requestId, enabled)` passa a ter semantica fechada:

- quando `requestId` muda para um novo valor:
  - o snapshot valido anterior nao deve vazar para outro request;
  - o hook reinicia o fallback local para aquele novo `requestId`.
- quando houver primeiro carregamento sem snapshot:
  - o dialog mostra loading bloqueante.
- quando houver sucesso:
  - o hook atualiza o snapshot valido daquele `requestId`.
- quando houver erro apos sucesso:
  - o hook continua expondo o snapshot valido;
  - o dialog mostra alerta nao bloqueante e preserva o conteudo.
- quando houver erro sem sucesso previo:
  - o dialog mostra erro bloqueante, sem secoes de detalhe.

Shape sugerido para o consumo:

```ts
type RequestDetailViewState = {
  data: WorkflowRequestDetailData | undefined;
  stableData: WorkflowRequestDetailData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasStableData: boolean;
};
```

`MyRequestDetailDialog` deve usar `stableData ?? data` como fonte principal de render.

### 6.4. Contrato minimo de acessibilidade

Regras fechadas desta microetapa:

- o botao do olho deve ter nome acessivel estavel, por exemplo:
  - `Ver detalhes da solicitacao 1001`
- o dialog requester deve ter `DialogTitle` e `DialogDescription`;
- os testes devem localizar o CTA por nome acessivel, nao por string vazia;
- o warning estrutural de `DialogContent` sem descricao deve deixar de aparecer na suite da `2B.2`.

### 6.5. Contrato de integracao da pagina requester

`RequestsV2Page` continua controlando:

- `selectedRequestId`;
- `showDetailDialog`.

Comportamento fechado:

1. clique no olho chama `handleSelectRequest(requestId)`;
2. a pagina define `selectedRequestId` e abre o dialog;
3. ao fechar o dialog, a pagina deve:
   - setar `showDetailDialog = false`;
   - setar `selectedRequestId = null`;
4. a cobertura de teste deve validar esse ciclo.

---

## 7. Manifesto de Arquivos

### 7.1. UI requester

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/components/workflows/requester/MyRequestsV2Section.tsx` | Modify | restaurar `currentStepName` como label de status e adicionar `aria-label` ao CTA do olho |
| `src/components/workflows/requester/RequesterRequestSummaryHeader.tsx` | Modify | trocar `areaId` cru por prop de label amigavel (`openedInLabel`) |
| `src/components/workflows/requester/MyRequestDetailDialog.tsx` | Modify | consumir `stableData`, distinguir erro bloqueante x nao bloqueante e adicionar `DialogDescription` |
| `src/components/workflows/requester/RequestsV2Page.tsx` | Modify | derivar `areaLabelById`, passar o mapa/label ao dialog e preservar o reset de `selectedRequestId` ao fechar |

### 7.2. Hook de dados

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/hooks/use-requester-workflows.ts` | Modify | explicitar a preservacao do ultimo detalhe valido por `requestId` e manter o contrato atual de query keys |

### 7.3. Contratos e API que permanecem estaveis

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/lib/workflows/read/types.ts` | None | manter shape de `WorkflowReadSummary` e `WorkflowRequestDetailData` |
| `src/lib/workflows/requester/api-client.ts` | None | manter cliente HTTP autenticado do requester |
| `src/app/api/workflows/read/mine/route.ts` | None | manter endpoint de listagem read-only |
| `src/app/api/workflows/read/requests/[requestId]/route.ts` | None | manter endpoint de detalhe read-only com autorizacao existente |

### 7.4. Testes

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx` | Modify | validar `currentStepName`, `aria-label` do olho e fallback de status |
| `src/components/workflows/requester/__tests__/MyRequestDetailDialog.test.tsx` | Modify | validar `openedInLabel`, `DialogDescription`, preservacao de snapshot valido e erro nao bloqueante |
| `src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx` | Modify | validar render da secao, abertura do dialog via olho e limpeza de estado ao fechar |
| `src/hooks/__tests__/use-requester-workflows.test.tsx` | Modify | validar semantica do `stableData` e ausencia de vazamento entre `requestId`s |

### 7.5. Skills e ownership recomendados para o build

- skill `build`: implementacao direta a partir deste design;
- skill `iterate`: apenas se o shape de retorno de `useRequestDetail()` precisar ser reajustado durante o build;
- agent `@react-frontend-developer`: ownership em `src/components/workflows/requester/**` e `src/hooks/use-requester-workflows.ts`;
- nenhum agente backend e necessario, porque esta microetapa nao altera endpoint nem schema.

---

## 8. Code Patterns Copy-Paste

### 8.1. Badge de status com label oficial e fallback seguro

```ts
function getStatusPresentation(
  item: WorkflowReadSummary,
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const fallbackLabel =
    item.statusCategory === 'archived'
      ? 'Arquivado'
      : item.statusCategory === 'finalized'
        ? 'Concluido'
        : item.statusCategory === 'waiting_action'
          ? 'Aguardando acao'
          : item.statusCategory === 'open' && !item.hasResponsible
            ? 'Aguardando atribuicao'
            : 'Em andamento';

  return {
    label: item.currentStepName?.trim() || fallbackLabel,
    variant:
      item.statusCategory === 'archived'
        ? 'outline'
        : item.statusCategory === 'finalized'
          ? 'secondary'
          : item.statusCategory === 'open' && !item.hasResponsible
            ? 'destructive'
            : 'default',
  };
}
```

Regras do pattern:

- `currentStepName` manda no texto;
- `statusCategory` manda apenas na apresentacao visual;
- o fallback continua local ao requester para manter o delta pequeno.

### 8.2. Mapa local de areas amigaveis sem nova query

```ts
const areaLabelById = React.useMemo(() => {
  return new Map((catalog ?? []).map((area) => [area.areaId, area.areaName]));
}, [catalog]);

<MyRequestDetailDialog
  open={showDetailDialog}
  requestId={selectedRequestId}
  areaLabelById={areaLabelById}
  onOpenChange={handleDetailOpenChange}
/>
```

Regras do pattern:

- a pagina continua sendo a dona do catalogo;
- o dialog nao cria fetch novo para descobrir nome de area;
- o fallback para `areaId` continua existindo dentro do dialog/header.

### 8.3. Hook com `stableData` por requestId

```ts
export function useRequestDetail(requestId: number | null, enabled: boolean) {
  const { user } = useAuth();
  const lastSuccessfulRef = React.useRef<Map<number, WorkflowRequestDetailData>>(new Map());

  const query = useQuery<WorkflowRequestDetailData>({
    queryKey: ['workflows', 'requester', 'detail', requestId],
    queryFn: async () => {
      if (!user || requestId == null) throw new Error('Parametros invalidos');
      return fetchRequestDetail(user, requestId);
    },
    enabled: !!user && enabled && requestId != null,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (requestId != null && query.data) {
      lastSuccessfulRef.current.set(requestId, query.data);
    }
  }, [requestId, query.data]);

  const stableData =
    requestId != null ? (query.data ?? lastSuccessfulRef.current.get(requestId)) : undefined;

  return {
    ...query,
    stableData,
    hasStableData: Boolean(stableData),
  };
}
```

Regras do pattern:

- o fallback e indexado por `requestId`;
- `stableData` nao deve vazar entre requests diferentes;
- o hook continua compativel com a query key atual.

### 8.4. Dialog requester com descricao e erro nao bloqueante

```tsx
<DialogHeader className="px-6 pt-6 pb-4">
  <DialogTitle>
    {detail
      ? `Solicitacao #${detail.summary.requestId} - ${detail.summary.workflowName}`
      : 'Detalhe da solicitacao'}
  </DialogTitle>
  <DialogDescription>
    {detail
      ? `${detail.summary.workflowName || detail.summary.workflowTypeId} - etapa atual ${detail.summary.currentStepName || '-'}.`
      : 'Visualizacao read-only do chamado do solicitante.'}
  </DialogDescription>
</DialogHeader>

{isError && hasStableData ? (
  <Alert variant="destructive">
    <AlertDescription>
      Nao foi possivel atualizar os detalhes desta solicitacao. O ultimo conteudo valido foi mantido.
    </AlertDescription>
  </Alert>
) : null}
```

Regras do pattern:

- `stableData` abastece o conteudo principal;
- erro nao bloqueante nao apaga secoes ja renderizadas;
- erro sem snapshot continua sendo bloqueante.

### 8.5. CTA do olho com nome acessivel deterministico

```tsx
<Button
  variant="ghost"
  size="icon"
  aria-label={`Ver detalhes da solicitacao ${item.requestId}`}
  onClick={() => onSelectRequest(item.requestId)}
>
  <Eye className="h-5 w-5" />
</Button>
```

Regras do pattern:

- os testes devem usar `getByRole('button', { name: /ver detalhes da solicitacao 1001/i })`;
- o texto inclui o `requestId` para diferenciar multiplas linhas da tabela.

---

## 9. API Contract

Nenhum endpoint novo ou alterado.

### `GET /api/workflows/read/mine`

Sem mudanca de envelope.

Uso apos esta microetapa:

- `items[].currentStepName` volta a ser a origem primaria do texto da coluna `Status`;
- `statusCategory` continua sendo metadado de apresentacao visual.

### `GET /api/workflows/read/requests/{requestId}`

Sem mudanca de envelope.

Uso apos esta microetapa:

- `summary.areaId` continua vindo do backend sem expansao adicional;
- o requester resolve a label amigavel localmente a partir do catalogo ja carregado;
- `permissions` e `action` continuam sendo ignorados pela UI requester;
- o hook do cliente passa a encapsular a preservacao do ultimo detalhe valido, sem alterar o payload recebido da API.

---

## 10. Database Schema

Nenhuma mudanca no schema.

---

## 11. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `MyRequestsV2Section` | renderiza `currentStepName` na coluna `Status` e usa fallback somente quando esse valor vier vazio |
| `MyRequestsV2Section` | localiza o CTA do olho por `aria-label` e chama `onSelectRequest(requestId)` |
| `RequesterRequestSummaryHeader` via dialog | exibe `openedInLabel` quando houver mapa e cai para `areaId` quando nao houver label |
| `MyRequestDetailDialog` | mostra `DialogDescription` e nao emite warning estrutural de descricao ausente |
| `MyRequestDetailDialog` | em erro apos sucesso, preserva as secoes do detalhe e mostra alerta nao bloqueante |
| `use-requester-workflows` | `stableData` e atualizado apos sucesso e nao vaza para outro `requestId` |

### Integration Tests

| Flow | Test |
|------|------|
| Render inicial de `/solicitacoes` | catalogo continua funcional e a secao `Minhas Solicitacoes` aparece na mesma pagina |
| Abrir detalhe pela tabela | usuario clica no olho com nome acessivel e o dialog abre com o request correto |
| Fechar dialog | `RequestsV2Page` limpa `selectedRequestId` e fecha o modal |
| Erro nao bloqueante de detalhe | pagina preserva o ultimo conteudo valido do dialog e mostra alerta sem desmontar as secoes |

### Acceptance Tests

```gherkin
GIVEN um solicitante com requests v2 ja existentes
WHEN ele acessa /solicitacoes
THEN a coluna Status mostra o nome real da etapa atual de cada request
```

```gherkin
GIVEN um request com area conhecida pelo catalogo requester
WHEN o usuario abre o detalhe read-only
THEN o campo Aberto em mostra o nome amigavel da area e nao o areaId cru
```

```gherkin
GIVEN um detalhe que ja carregou com sucesso
WHEN um refetch posterior falha
THEN o dialog mantem o ultimo conteudo valido e mostra um alerta nao bloqueante
```

```gherkin
GIVEN a tabela de Minhas Solicitacoes
WHEN o usuario navega por leitor de tela ou por queries acessiveis de teste
THEN o CTA do olho e encontravel por um nome acessivel explicito
```

---

## 12. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter ajustes de `MyRequestsV2Section` para o comportamento anterior de status e CTA | a tabela volta ao estado atual sem quebrar o restante da pagina |
| 2 | Remover `areaLabelById` e o novo contrato de `openedInLabel` do dialog/header | o detalhe volta a mostrar `areaId` cru como hoje |
| 3 | Reverter o fallback `stableData` em `useRequestDetail` | o hook volta a depender apenas do estado bruto da query |
| 4 | Reverter os testes novos/alterados da `2B.2` | a suite retorna ao baseline anterior |

**Metodo rapido:** `git revert {commit-hash}`

---

## 13. Implementation Checklist

### Pre-Build

- [x] DEFINE document aprovado para a microetapa corretiva
- [x] Gaps reais confirmados no codigo do requester
- [x] Contrato de `currentStepName` validado no read model
- [x] Fonte local de `areaName` validada no catalog requester
- [x] Estrategia de resiliencia do detalhe fechada sem mudar endpoints

### Post-Build

- [ ] `MyRequestsV2Section` renderiza o label real de etapa/status
- [ ] o botao do olho possui `aria-label` deterministico
- [ ] `Aberto em` mostra label amigavel quando a area existir no catalogo
- [ ] `useRequestDetail()` preserva o ultimo detalhe valido por `requestId`
- [ ] `MyRequestDetailDialog` diferencia erro bloqueante de erro nao bloqueante
- [ ] `RequestsV2Page.test.tsx` cobre abertura e fechamento do dialog requester
- [ ] a suite focada da `2B.2` passa sem warning estrutural de descricao no dialog

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-10 | Codex (`design` skill) | Initial technical design for the relevant 2B.2 post-build corrections covering status fidelity, area label resolution, detail resilience and requester integration tests |
