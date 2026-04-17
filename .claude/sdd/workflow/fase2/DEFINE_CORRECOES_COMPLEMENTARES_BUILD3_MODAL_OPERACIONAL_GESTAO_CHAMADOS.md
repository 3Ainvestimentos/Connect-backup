# DEFINE: Correcoes complementares do Build 3 - modal operacional de gestao de chamados

> Generated: 2026-04-17
> Status: Approved for design
> Scope: Fase 2 / microcorrecoes complementares ao Build 3 do modal operacional em `/gestao-de-chamados`
> Base documents: `DEFINE_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DESIGN_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

## 1. Problem Statement

O Build 3 estabilizou boa parte do modal operacional de `/gestao-de-chamados`, mas tres lacunas pontuais ainda impedem considerar a rodada totalmente fechada: copy terminal incorreta para `finalized` sem `canArchive`, ausencia de prova automatizada dos busy states administrativos e falta de cobertura de erro/toast na integracao da pagina.

---

## 2. Users

### 2.1. Owner do workflow

Pain points:

- pode abrir um chamado ja `finalized` sem permissao de arquivar e receber uma copy generica de "Sem acao operacional imediata", em vez de uma comunicacao clara de que o fluxo terminou;
- depende de feedback confiavel em erro de mutation para entender se precisa tentar novamente ou se o modal fechou indevidamente.

### 2.2. Responsavel atual do chamado

Pain points:

- depende de states transitorios coerentes para nao disparar atribuicao, arquivamento ou outras acoes administrativas mais de uma vez;
- perde confianca no modal quando os estados de erro na pagina nao estao blindados por teste.

### 2.3. Engenharia / QA / manutencao

Pain points:

- ainda nao possui prova automatizada suficiente para os estados `isAssigning` e `isArchiving`;
- precisa fechar a integracao de erro/toast em `WorkflowManagementPage` sem abrir um novo build grande;
- precisa encerrar o Build 3 com um escopo de correcoes pequeno e claramente verificavel.

---

## 3. Goals

### MUST

- corrigir o `request-detail-view-model.ts` para que qualquer request com `summary.statusCategory === 'finalized'` entre em copy de conclusao, independentemente de `permissions.canArchive`;
- manter `permissions.canArchive` controlando apenas a presenca da acao administrativa de arquivamento, e nao o reconhecimento do estado terminal do fluxo;
- ampliar a cobertura automatizada do modal para provar busy states administrativos:
  - `isAssigning` exibe `Salvando...` e bloqueia reatribuicao/atribuicao;
  - `isArchiving` exibe `Arquivando...` e bloqueia o CTA de arquivamento;
- ampliar a cobertura de `WorkflowManagementPage.test.tsx` para provar:
  - toast destrutivo em erro de mutation;
  - dialog permanece aberto quando a mutation falha;
  - policy de fechamento continua correta mesmo com erro;
- tratar estas correcoes como fechamento complementar do Build 3, sem abrir novo redesign, novo contrato ou nova regra de runtime.

### SHOULD

- reaproveitar o helper `buildManagementRequestDetailFixture(...)` nas novas coberturas, evitando reintroduzir builders inline;
- manter a copy de estado terminal consistente entre hero, resumo do dialog e painel administrativo;
- validar tambem que o branch de `finalized` sem `canArchive` nao reintroduz CTA operacional primario.

### COULD

- refinar uma ou duas assertions de texto para deixar mais claro, nos testes, a diferenca entre "concluido" e "somente leitura";
- atualizar o build report do Build 3 para registrar que a rodada complementar fechou os gaps de cobertura automatizada.

### WON'T

- nao reabrir o fluxo funcional de `advance`, `finalize`, `requestAction`, `respondAction`, `assign` ou `archive`;
- nao criar novo build estrutural, nova fase de refatoracao ou novo shell visual;
- nao alterar endpoints, payloads, read-side, schema ou permissoes;
- nao usar esta rodada para atacar o smoke responsivo manual pendente.

---

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|----------------|
| Estado `finalized` corretamente comunicado | Requests `finalized` mostram copy de conclusao mesmo quando `canArchive = false` | Testes de view model e/ou dialog cobrindo `statusCategory = finalized` com e sem `canArchive` |
| Busy states administrativos blindados | `Salvando...` e `Arquivando...` aparecem com `disabled/aria-disabled` corretos | Testes de componente no dialog/painel administrativo |
| Erro de mutation sem regressao de UX | Falhas de mutation exibem toast destrutivo e nao fecham o dialog indevidamente | Testes de integracao em `WorkflowManagementPage.test.tsx` |
| Fechamento complementar do Build 3 | As 3 lacunas remanescentes ficam cobertas sem expandir escopo para novo redesign | Diff restrito + suites Jest dirigidas passando |

---

## 5. Technical Scope

### Frontend

- ajustar [request-detail-view-model.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/request-detail-view-model.ts) para separar:
  - reconhecimento do estado `finalized`;
  - disponibilidade opcional de `canArchive`;
- revisar [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx) ou adicionar cobertura equivalente para busy states administrativos;
- revisar [WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) para cobrir erro, toast destrutivo e permanencia do dialog.

### Backend / Runtime

- fora do escopo; nenhuma mudanca funcional em endpoints, use cases ou authz.

### Database / Firestore

- fora do escopo; nenhuma mudanca de schema, indice, documento ou migracao.

### AI

- fora do escopo.

### Testing

- adicionar cobertura explicita de `finalized` sem `canArchive`;
- adicionar cobertura explicita de `isAssigning` e `isArchiving`;
- adicionar cobertura explicita de erro de mutation em `WorkflowManagementPage`;
- manter as suites dirigidas do Build 3 como baseline minimo:
  - `request-detail-view-model.test.ts`
  - `RequestDetailDialog.test.tsx`
  - `RequestActionCard.test.tsx`
  - `WorkflowManagementPage.test.tsx`

---

## 6. Auth Requirements

- nenhuma alteracao no contrato de autenticacao/autorizacao existente;
- a UI continua refletindo apenas o payload oficial de `detail.permissions`;
- a correcao de `finalized` nao pode conceder `canArchive` a quem nao o possui;
- os testes de erro nao podem assumir bypass de permissao ou comportamento administrativo fora do contrato autenticado atual.

---

## 7. Out of Scope

- smoke responsivo manual do Build 3;
- qualquer redesign do modal;
- mudancas no requester, em `/solicitacoes` ou em outras superficies de workflow;
- refatoracao ampla das suites de teste alem do necessario para fechar os 3 gaps;
- correcoes de `typecheck` global fora do escopo desse patch complementar.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DEFINE_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `DESIGN_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready with pending manual smoke |
| `buildManagementRequestDetailFixture(...)` | Internal | Ready |
| Jest + React Testing Library | Internal | Ready |

---

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|-------------|-------|
| Problem clarity | 3 | As 3 lacunas remanescentes estao objetivamente identificadas |
| User identification | 3 | Owner, responsavel e engenharia/QA sofrem impacto direto e observavel |
| Success criteria measurability | 3 | Cada correcao tem validacao objetiva por teste ou assert de UI |
| Technical scope definition | 3 | Escopo restrito a view model e suites de teste do modal/pagina |
| Edge cases considered | 3 | `finalized` sem `canArchive`, busy states administrativos e erro de mutation foram explicitados |
| **TOTAL** | **15/15** | Ready for /design |

---

## 10. Next Step

Ready for `/design CORRECOES_COMPLEMENTARES_BUILD3_MODAL_OPERACIONAL_GESTAO_CHAMADOS` para detalhar:

- o branch exato de copy para `finalized` com e sem `canArchive`;
- a estrategia minima de teste para `isAssigning` e `isArchiving`;
- o wiring de teste de erro/toast em `WorkflowManagementPage`;
- como atualizar o build report sem transformar a rodada em um novo build estrutural.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex (`define` skill) | Initial define for the 3 complementary post-Build-3 corrections: finalized copy without canArchive, administrative busy-state coverage, and mutation-error/toast integration coverage |
