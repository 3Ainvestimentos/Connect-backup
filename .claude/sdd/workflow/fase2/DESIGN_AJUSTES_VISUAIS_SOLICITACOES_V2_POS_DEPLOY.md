# DESIGN: AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY

> Generated: 2026-04-15
> Status: Ready for /build
> Source: `DEFINE_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md`

## 1. Requirements Summary

### Problem

A rota `/solicitacoes` v2 ja funciona, mas o shell principal ainda diverge visualmente da experiencia canonica de `/applications` em tres pontos aprovados para esta rodada: header, cards de area e largura util de `Minhas Solicitacoes`.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Header alinhado ao legado | `RequestsV2Page` reproduz a mesma hierarquia visual percebida em `/applications` para titulo, descricao e espacamentos |
| Cards simplificados | `WorkflowAreaCard` remove contagem e chips, mantendo apenas icone + nome da area em card centrado |
| Grid com leitura de portal | `WorkflowAreaGrid` passa a distribuir cards no mesmo padrao centralizado do legado |
| Tabela com largura util ampliada | `MyRequestsV2Section` deixa de parecer comprimida pelo shell atual e ocupa a largura natural do layout da pagina |
| Zero regressao funcional | clique, teclado, abertura de modais e detalhe read-only continuam operando sem alteracao de contrato |

### Constraints

- Escopo estritamente visual; nenhum hook, endpoint, payload, query key ou read model muda.
- `WorkflowSelectionModal`, `WorkflowSubmissionModal` e `RequesterUnifiedRequestDetailDialog` ficam fora desta rodada.
- O legado `/applications` serve como referencia visual, nao como fonte de componentes a serem importados.
- Responsividade desktop/mobile e foco por teclado precisam ser preservados.
- Os testes de requester precisam ser atualizados para refletir o hook unificado real (`useRequesterUnifiedRequests`) antes de validar o patch visual.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md)
- [BRAINSTORM_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md)
- [src/components/workflows/requester/RequestsV2Page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequestsV2Page.tsx)
- [src/components/workflows/requester/WorkflowAreaGrid.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/WorkflowAreaGrid.tsx)
- [src/components/workflows/requester/WorkflowAreaCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/WorkflowAreaCard.tsx)
- [src/components/workflows/requester/MyRequestsV2Section.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/MyRequestsV2Section.tsx)
- [src/hooks/use-requester-unified-requests.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-requester-unified-requests.ts)
- [src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx)
- [src/app/(app)/applications/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/applications/page.tsx)
- [src/components/applications/MyRequests.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/MyRequests.tsx)
- [src/components/layout/PageHeader.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/PageHeader.tsx)
- [src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx)
- [src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md` para escopo e aceite;
2. a rota legada `/applications` prevalece como referencia visual canonica;
3. este documento prevalece para orientar o `/build` desta rodada;
4. o codigo real do repositorio prevalece sobre premissas nao materializadas.

---

## 3. Estado Atual Relevante

### 3.1. O que existe hoje

- [RequestsV2Page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequestsV2Page.tsx) usa `container mx-auto px-4 py-8`, header manual com `h1`/`p`, grid em coluna responsiva e `MyRequestsV2Section` separado por `mt-10`;
- [WorkflowAreaGrid.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/WorkflowAreaGrid.tsx) distribui areas em `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`;
- [WorkflowAreaCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/WorkflowAreaCard.tsx) renderiza contagem de tipos e chips com nomes de workflows;
- [MyRequestsV2Section.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/MyRequestsV2Section.tsx) ja usa o hook unificado e preserva a mesma estrutura funcional de tabela, loading e erro;
- [RequesterUnifiedRequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx) continua sendo o shell de detalhe read-only para itens v2 e legado;
- a referencia legada em [applications/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/applications/page.tsx) usa `space-y-8 p-6 md:p-8`, `PageHeader`, cards `h-32 w-48` em `flex flex-wrap justify-center gap-4` e `MyRequests` na largura natural do shell.

### 3.2. O que esta desalinhado

- o topo da V2 comunica uma experiencia nova, nao a mesma hierarquia visual percebida em `/applications`;
- o grid atual enfatiza densidade de cards, enquanto o legado enfatiza portal de entrada com cards fixos centralizados;
- os chips e a linha de contagem do card introduzem ruido nao aprovado para esta rodada;
- a tabela de `Minhas Solicitacoes` herda o shell mais estreito do `container mx-auto`, o que acentua a sensacao de compressao lateral;
- os testes atuais de requester ainda mockam `useMyRequests` diretamente, apesar do componente real depender de `useRequesterUnifiedRequests`.

### 3.3. Restricao tecnica fechada

- nenhuma alteracao e necessaria em `useRequesterCatalog`, `useOpenRequesterWorkflow`, `useRequesterUnifiedRequests` ou `useRequestDetail`;
- nenhum ajuste e necessario nos adapters de dados, contexts ou rotas API;
- a rodada deve ser resolvida dentro do namespace `src/components/workflows/requester/*` e suites de teste associadas.

---

## 4. Decisoes Fechadas da Rodada

### 4.1. O shell da pagina passa a espelhar o shell do legado

- `RequestsV2Page` troca `container mx-auto px-4 py-8` por um wrapper equivalente ao legado: `space-y-8 p-6 md:p-8`;
- o header passa a usar [PageHeader.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/PageHeader.tsx) com a copy canonica `Solicitações` e `Inicie processos e acesse as ferramentas da empresa.`;
- loading, error e empty states do catalogo passam a herdar o mesmo padding e o mesmo ritmo espacial do novo shell por consequencia direta dessa troca; isso entra no patch como efeito colateral aceito do espelhamento visual, sem reescrever o markup interno desses estados;
- a pagina continua contendo catalogo, modais e detalhe no mesmo componente; esta rodada nao cria um novo page shell compartilhado.

### 4.2. O grid de areas adota distribuicao de portal

- `WorkflowAreaGrid` deixa de usar grid por colunas e passa a um container `flex flex-wrap justify-center gap-4`;
- a intencao visual e reproduzir a leitura do legado: cards com largura fixa, alinhamento central e area de respiro entre grupos;
- em mobile, os cards podem ocupar largura maior por breakpoint, desde que a leitura continue simples e o clique nao perca area util.

### 4.3. O card de area vira uma composicao minima

- `WorkflowAreaCard` mantem `Card` como primitive, mas troca a composicao interna para o padrao `icone + nome da area`, centralizado;
- removem-se explicitamente a linha `n tipos de solicitacao`, os chips de workflow e o sumario `+n mais`;
- a affordance de clique por mouse e teclado permanece; o card continua com `role="button"` e resposta para `Enter` e `Space`;
- hover e focus podem ser refinados para aproximar o legado, mas sem sacrificar estados acessiveis.

### 4.4. `Minhas Solicitacoes` preserva contrato e ganha largura util via shell

- a tabela nao muda de fonte de dados nem de comportamento;
- a maior parte do ganho de largura vem da troca do wrapper da pagina para o shell do legado;
- entre o catalogo e `MyRequestsV2Section`, a pagina passa a explicitar um `Separator`, espelhando a divisao visual existente em `/applications` como parte da composicao do shell e nao como novo bloco funcional;
- `MyRequestsV2Section` pode receber ajustes leves de espacamento interno para harmonizar com o novo shell, mas nao deve mudar colunas, labels, ordenacao ou CTA de detalhe.

### 4.5. Nada muda em modais ou detalhe

- `WorkflowSelectionModal`, `WorkflowSubmissionModal` e `RequesterUnifiedRequestDetailDialog` continuam com markup, sizing e contratos atuais;
- o patch precisa ser compativel com o fluxo atual de abertura por area unica ou multipla, toast de sucesso e dialog read-only.

### 4.6. Os testes acompanham o boundary real do modulo

- `MyRequestsV2Section.test.tsx` deve mockar `useRequesterUnifiedRequests`, nao `useMyRequests`;
- `RequestsV2Page.test.tsx` pode continuar cobrindo fluxo de modais e detalhe, mas precisa alinhar mocks e asserts ao shell visual novo;
- `RequestsV2Page.test.tsx` deve usar um harness compativel com o wiring atual da pagina: `QueryClientProvider` e um boundary realista para `WorkflowAreasContext` (provider de teste ou mock direto de `useWorkflowAreas`), alem dos mocks ja necessarios para `useToast`, catalogo e detalhe;
- os testes que exercitam o dialog read-only devem continuar mockando `useRequestDetail` na fronteira publica do modulo, para nao depender incidentalmente de providers internos dos componentes de apresentacao de management;
- `MyRequestsV2Section.test.tsx` permanece como teste de componente no boundary do hook unificado; ele nao deve reviver `useMyRequests` nem assumir providers extras que o componente hoje nao consome diretamente;
- a cobertura desta rodada prioriza: header, cards simplificados, manutencao da tabela e fluxo de clique/teclado.

---

## 5. Arquitetura da Solucao

### 5.1. Diagrama arquitetural

```text
src/app/(app)/solicitacoes/page.tsx
  |
  v
RequestsV2Page
  |
  +--> PageShell (inline no proprio componente)
  |       |
  |       +--> PageHeader
  |       +--> CatalogStateSwitch
  |       |       |
  |       |       +--> Skeleton grid
  |       |       +--> Error / empty states
  |       |       +--> WorkflowAreaGrid
  |       |               |
  |       |               +--> WorkflowAreaCard
  |       |
  |       +--> MyRequestsV2Section
  |
  +--> WorkflowSelectionModal
  +--> WorkflowSubmissionModal
  +--> RequesterUnifiedRequestDetailDialog
          |
          +--> useRequestDetail (somente para itens v2)

Data / behavior boundary (inalterado):
  useRequesterCatalog
  useOpenRequesterWorkflow
  useRequesterUnifiedRequests
  useRequestDetail
```

### 5.2. Fluxo por camadas

```text
LAYER 1 (Visual shell)
1. RequestsV2Page adota o mesmo ritmo espacial do legado.
2. O header passa a usar PageHeader com a copy canonica.

LAYER 2 (Catalog presentation)
3. WorkflowAreaGrid troca grid por flex-wrap centralizado.
4. WorkflowAreaCard simplifica o conteudo para icone + titulo.

LAYER 3 (Unified requests)
5. MyRequestsV2Section continua consumindo useRequesterUnifiedRequests.
6. O bloco de tabela herda maior largura util do shell novo.

LAYER 4 (Functional flows)
7. Area click continua disparando selecao ou submission modal.
8. Eye button continua abrindo RequesterUnifiedRequestDetailDialog.
9. Nenhuma mutacao, query ou adaptador de dados muda.
```

### 5.3. Estado gerenciado

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| `catalog` | React Query via `useRequesterCatalog` | inalterado; define loading/error/empty do grid |
| `selectedArea` | `useState` em `RequestsV2Page` | aberto ao clicar area; limpo ao fechar fluxo |
| `selectedWorkflow` | `useState` em `RequestsV2Page` | preenchido em area unica ou apos selecao no modal |
| `showSelectionModal` | `useState` em `RequestsV2Page` | abre para areas com mais de um workflow |
| `showSubmissionModal` | `useState` em `RequestsV2Page` | abre no submit flow, fecha com reset |
| `items/status` de `MyRequests` | hook `useRequesterUnifiedRequests` | inalterado; continua dono do estado loading/error/partial/success |
| `selectedItem` / `showDetailDialog` | `useState` em `RequestsV2Page` | permanece como controle do detalhe read-only |

### 5.4. Contrato visual por componente

- [RequestsV2Page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequestsV2Page.tsx)
  - reutiliza `PageHeader`;
  - troca o wrapper da pagina;
  - explicita `Separator` entre catalogo e `MyRequestsV2Section`;
  - preserva o state switch de loading/error/empty do catalogo;
  - aplica um espacamento vertical unico entre header, grid e `MyRequestsV2Section`.

- [WorkflowAreaGrid.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/WorkflowAreaGrid.tsx)
  - vira container de distribuicao centralizada;
  - deixa a responsabilidade de dimensao do card para `WorkflowAreaCard`.

- [WorkflowAreaCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/WorkflowAreaCard.tsx)
  - fixa composicao compacta e centrada;
  - preserva click, foco e teclado;
  - remove qualquer metrica secundaria de workflow.

- [MyRequestsV2Section.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/MyRequestsV2Section.tsx)
  - continua renderizando `Card` + `Table`;
  - harmoniza espacamentos e possivel largura do wrapper interno;
  - nao toca no contrato de `onSelectRequest`.

---

## 6. Architecture Decisions

### ADR-001: Aproximacao visual acontece dentro do modulo requester, sem importar UI do legado

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-15 |
| Context | O legado `/applications` e a referencia visual canonica, mas o DEFINE proibe reabrir a rota legada ou criar acoplamento transversal novo. |

**Choice:** reproduzir a hierarquia visual do legado dentro de `src/components/workflows/requester/*`, reutilizando apenas primitives compartilhadas como `PageHeader` e `Card`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Importar componentes visuais de `src/components/applications/*` | criaria dependencia nova entre modulo novo e legado |
| Alterar a propria rota `/applications` para extrair um shared shell | amplia escopo e risco sem necessidade para o patch |

**Consequences:**

- mantem o patch localizado;
- reduz risco de regressao fora de `/solicitacoes`;
- aceita pequena duplicacao visual controlada entre legado e V2.

### ADR-002: O ganho de largura vem do page shell, nao de reestruturar `MyRequestsV2Section`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-15 |
| Context | O problema aprovado fala em largura util da secao, nao em redesign da tabela. O principal gargalo atual esta no wrapper `container mx-auto px-4`. |

**Choice:** mover o ajuste principal para `RequestsV2Page`, adotando o shell `space-y-8 p-6 md:p-8`, e limitar `MyRequestsV2Section` a refinamentos leves de alinhamento.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Reescrever a tabela com novo layout responsivo | foge do recorte visual aprovado |
| Remover o `Card` da secao para ocupar 100% da largura | altera demais a superficie funcional sem necessidade |

**Consequences:**

- menor delta de build;
- preserva markup e comportamento da tabela;
- a melhoria de largura depende da coerencia do shell novo em toda a pagina.

### ADR-003: Nenhuma fronteira funcional muda; o patch e puramente de apresentacao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-15 |
| Context | `useRequesterUnifiedRequests`, modais e dialog de detalhe ja sustentam uma experiencia funcional consolidada em producao. |

**Choice:** restringir o build a layout, classes Tailwind, composicao JSX e alinhamento de testes, sem tocar em hooks, adapters ou contratos de dados.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Ajustar hooks para simplificar o JSX durante o patch | reabre escopo funcional desnecessariamente |
| Alterar o dialog de detalhe para combinar com o legado no mesmo build | explicitamente fora dos 3 pontos aprovados |

**Consequences:**

- rollback simples;
- menor risco operacional;
- eventuais inconsistencias visuais restantes em modais ficam para iteracao futura.

### ADR-004: A manutencao de testes acompanha o boundary real `useRequesterUnifiedRequests`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-15 |
| Context | `MyRequestsV2Section` ja nao consome `useMyRequests`, mas a suite atual ainda mocka esse hook antigo, o que fragiliza qualquer validacao do patch. |

**Choice:** atualizar as suites de requester para mockar o hook unificado e validar sinais visuais/funcionais na fronteira publica dos componentes.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Manter os testes antigos e validar apenas manualmente | deixa o modulo sem guarda automatizada minima numa area ja em producao |
| Converter tudo para snapshot | pouca signal para uma mudanca visual pequena e dirigida |

**Consequences:**

- os testes ficam alinhados ao estado real do codigo;
- o build cobre regressao de fluxo sem depender de implementacao interna errada;
- ha custo pequeno de ajuste de mocks nesta rodada.

---

## 7. File Manifest

### Execution Order

| Phase | Files | Owner |
|-------|-------|-------|
| 1. Shell visual | `RequestsV2Page.tsx`, `PageHeader.tsx` (reuse), `Separator.tsx` (reuse) | Codex `/build` |
| 2. Catalog presentation | `WorkflowAreaGrid.tsx`, `WorkflowAreaCard.tsx` | Codex `/build` |
| 3. Unified list presentation | `MyRequestsV2Section.tsx` | Codex `/build` |
| 4. Test alignment | `__tests__/RequestsV2Page.test.tsx`, `__tests__/MyRequestsV2Section.test.tsx` | Codex `/build` |

### Detailed Manifest

| # | File | Action | Purpose | Depends On |
|---|------|--------|---------|------------|
| 1 | `src/components/workflows/requester/RequestsV2Page.tsx` | Modify | trocar o wrapper da pagina, adotar `PageHeader`, inserir `Separator` e alinhar espacamentos gerais | - |
| 2 | `src/components/workflows/requester/WorkflowAreaGrid.tsx` | Modify | substituir grid por distribuicao centralizada em flex-wrap | #1 |
| 3 | `src/components/workflows/requester/WorkflowAreaCard.tsx` | Modify | simplificar card para icon + nome, removendo contagem e chips | #2 |
| 4 | `src/components/workflows/requester/MyRequestsV2Section.tsx` | Modify | harmonizar largura e espacamento da secao sem alterar comportamento | #1 |
| 5 | `src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx` | Modify | alinhar mocks para `useRequesterUnifiedRequests` e validar estados publicos atuais | #4 |
| 6 | `src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx` | Modify | alinhar asserts ao novo header/shell e manter cobertura de fluxo principal | #1, #3, #4 |

### Files Explicitly Unchanged

- `src/hooks/use-requester-workflows.ts`
- `src/hooks/use-requester-unified-requests.ts`
- `src/components/workflows/requester/WorkflowSelectionModal.tsx`
- `src/components/workflows/requester/WorkflowSubmissionModal.tsx`
- `src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx`
- `src/app/(app)/applications/page.tsx`

---

## 8. Code Patterns

### Pattern 1: Page shell alinhado ao legado, mantendo o state switch atual

```tsx
import { PageHeader } from '@/components/layout/PageHeader';
import { Separator } from '@/components/ui/separator';

return (
  <div className="space-y-8 p-6 md:p-8">
    <div>
      <PageHeader
        title="Solicitações"
        description="Inicie processos e acesse as ferramentas da empresa."
      />
      {catalogState}
    </div>

    <Separator />

    <MyRequestsV2Section onSelectRequest={handleSelectRequest} />
  </div>
);
```

Uso:

- aplicar em `RequestsV2Page`;
- manter `WorkflowSelectionModal`, `WorkflowSubmissionModal` e `RequesterUnifiedRequestDetailDialog` fora do shell visual principal, como ja acontece hoje.

### Pattern 2: Card de area minimalista com affordance preservada

```tsx
<Card
  className="h-32 w-48 cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  role="button"
  tabIndex={0}
  onClick={onClick}
  onKeyDown={handleKeyDown}
>
  <CardContent className="flex h-full flex-col items-center justify-center p-4 text-center">
    <Icon className="mb-2 h-7 w-7 text-muted-foreground" />
    <span className="text-sm font-semibold text-card-foreground">{area.areaName}</span>
  </CardContent>
</Card>
```

Uso:

- o card nao deve renderizar texto secundario;
- o tamanho fixo pode receber breakpoint adicional em mobile se necessario, desde que preserve a leitura centralizada.

### Pattern 3: Teste no boundary publico do hook unificado

```tsx
jest.mock('@/hooks/use-requester-unified-requests', () => ({
  useRequesterUnifiedRequests: jest.fn(),
}));

(useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
  items: [],
  status: 'loading',
  isLoading: true,
  isError: false,
  error: null,
  legacyIdentityResolved: true,
});
```

Uso:

- aplicar em `MyRequestsV2Section.test.tsx`;
- validar texto de header, empty/error/loading e callback `onSelectRequest` com item completo, nao com `requestId` isolado.

---

## 9. API Contract

Nenhum endpoint novo ou alterado.

- `useRequesterCatalog` continua consumindo o catalogo atual.
- `useOpenRequesterWorkflow` continua abrindo solicitacoes sem mudanca de payload.
- `useRequesterUnifiedRequests` continua sendo a fonte da tabela.
- `useRequestDetail` continua sendo usado apenas para detalhe v2.

---

## 10. Database Schema

Nenhuma mudanca no schema.

- sem alteracoes em Firestore;
- sem alteracoes em rules;
- sem alteracoes em Storage ou anexos.

---

## 11. Testing Strategy

### Unit / Component Tests

| Component | Test |
|-----------|------|
| `RequestsV2Page` | renderiza `PageHeader` com copy canonica, `Separator` entre catalogo e tabela, e continua exibindo grid/error/empty conforme estado do catalogo dentro do shell novo |
| `WorkflowAreaCard` via `RequestsV2Page` | nao exibe texto `tipos de solicitacao`, nem chips de workflow, e continua respondendo a click |
| `MyRequestsV2Section` | continua exibindo loading, error, partial, empty e tabela com base em `useRequesterUnifiedRequests` |
| `RequestsV2Page` + modais | clique em area unica continua abrindo submission modal e sucesso continua disparando toast/reset |
| `RequestsV2Page` + detalhe | clique no botao de olho continua abrindo e fechando o dialog read-only |

### Test Harness Notes

- `RequestsV2Page.test.tsx` deve montar a pagina com `QueryClientProvider` e um harness explicito para `WorkflowAreasContext`, preferencialmente mockando `useWorkflowAreas` quando o objetivo for testar shell/composicao e nao o provider em si;
- o mesmo arquivo deve manter `useRequesterCatalog`, `useOpenRequesterWorkflow`, `useToast` e `useRequestDetail` mockados na fronteira do modulo para evitar dependencia acidental de providers mais profundos;
- `MyRequestsV2Section.test.tsx` deve permanecer fino: mock de `useRequesterUnifiedRequests`, render do componente e asserts sobre estados visiveis/publicos;
- se algum teste de integracao futura optar por remover mocks de dialog/detail, ele deve declarar explicitamente os providers extras necessarios, em vez de inferi-los deste patch visual.

### Manual Smoke

| Flow | Verification |
|------|--------------|
| `/solicitacoes` desktop | comparar lado a lado com `/applications` para header, cards e largura util de `Minhas Solicitações` |
| `/solicitacoes` mobile | verificar empilhamento e area de toque dos cards |
| area com 1 workflow | abre direto o modal de envio |
| area com varios workflows | abre modal de selecao |
| tabela `Minhas Solicitações` | detalhe ainda abre corretamente para item legado e item v2 |

### Acceptance Tests

```gherkin
GIVEN que o solicitante acessa /solicitacoes
WHEN a pagina carrega com catalogo disponivel
THEN o topo usa a mesma hierarquia visual de /applications
AND os cards de area exibem apenas icone e nome
AND a secao Minhas Solicitacoes ocupa a largura util do shell da pagina
```

```gherkin
GIVEN que existe uma area com apenas um workflow
WHEN o usuario ativa o card por clique ou teclado
THEN o fluxo de abertura da solicitacao continua funcionando sem regressao
```

```gherkin
GIVEN que o usuario possui chamados na lista unificada
WHEN ele clica no botao de detalhe
THEN o dialog read-only continua abrindo com os dados esperados
```

---

## 12. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter o commit do patch visual em `src/components/workflows/requester/*` | `/solicitacoes` volta ao shell anterior sem tocar dados |
| 2 | Reverter ajustes das suites de teste se necessario | jest volta a refletir o estado anterior do modulo |
| 3 | Rodar smoke manual rapido em `/solicitacoes` | confirmar abertura de modais, tabela e detalhe |

**Metodo rapido:** `git revert <commit-do-build>`

---

## 13. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado e lido
- [x] referencia visual canonica em `/applications` mapeada
- [x] limites de escopo fechados para os 3 pontos aprovados
- [x] manifest de arquivos afetados definido
- [x] estrategia de testes alinhada ao hook unificado real

### Post-Build

- [ ] `RequestsV2Page` usa shell e header alinhados ao legado
- [ ] `WorkflowAreaGrid` e `WorkflowAreaCard` espelham a leitura simplificada do legado
- [ ] `MyRequestsV2Section` preserva comportamento e ganha largura util coerente
- [ ] suites de requester passam com mocks atualizados
- [ ] smoke manual de desktop/mobile concluido

---

## 14. Specialist Instructions

### For `/build`

```markdown
Files to modify:
- src/components/workflows/requester/RequestsV2Page.tsx
- src/components/workflows/requester/WorkflowAreaGrid.tsx
- src/components/workflows/requester/WorkflowAreaCard.tsx
- src/components/workflows/requester/MyRequestsV2Section.tsx
- src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx
- src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx

Key requirements:
- alinhar o shell de /solicitacoes ao ritmo espacial de /applications sem importar UI legada
- remover contagem e chips dos area cards
- preservar clique, teclado, modais e detalhe existentes
- atualizar testes para mockar useRequesterUnifiedRequests na fronteira publica correta
- evitar qualquer mudanca em hooks, endpoints, adapters ou dialogs fora do patch visual
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-15 | Codex (`design` skill) | Initial technical design based on `DEFINE_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md` |
| 1.1 | 2026-04-15 | Codex (`iterate` skill) | Clarified accepted shell side effects, explicit `Separator` parity with legacy, and real requester test harness requirements |
