# DEFINE: Correções pós-build de UI/UX em `/admin/request-config` (accordion, copy PT-BR, badges e hidratação do modal)

> Generated: 2026-04-16
> Status: Ready for /design
> Scope: Microcorreções de frontend para fechar lacunas do patch crítico de UI/UX em `/admin/request-config`
> Parent document: `BRAINSTORM_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md`
> Clarity Score: 14/15

## 1. Problem Statement

O patch crítico de UI/UX em `/admin/request-config` melhorou a superfície administrativa, mas ainda deixou lacunas visíveis: `WorkflowType` continua sempre expandido, a copy de `Ação` ainda está parcialmente técnica/incompleta, o modal de edição pode mostrar CTAs editáveis antes de saber se a versão é somente leitura, ainda existe um CTA redundante de `Publicar versão` acima do footer fixo e a semântica visual das badges/filtro não está alinhada ao padrão desejado.

---

## 2. Users

### 2.1. Admin com permissão `canManageWorkflowsV2`

Pain points:

- continua escaneando listas de versões sempre abertas dentro de cada `WorkflowType`, o que prejudica leitura em catálogos maiores;
- encontra copy inconsistente na configuração de ação (`Acao`, rótulo default técnico), reduzindo sensação de acabamento;
- pode ver CTAs de edição/publicação por um instante ao abrir uma versão publicada ou ainda em carregamento, o que cria affordance errada;
- encontra um botão redundante de `Publicar versão` acima do footer fixo, duplicando a ação principal do modal;
- percebe badges com hierarquia cromática diferente da esperada (`Publicada`/versão publicada em dourado e `Ativa` sem destaque verde claro);
- no `Histórico Geral`, precisa de um filtro compacto sem a premissa de aplicar tudo imediatamente a cada alteração.

Frequência:

- recorrente, sempre que usa `/admin/request-config` para revisar ou editar workflows.

### 2.2. Produto / UX

Pain points:

- a tela continua parcialmente fora do padrão aprovado mesmo após o patch crítico;
- o principal objetivo de reduzir ruído visual e inconsistência de affordance ainda não foi 100% atingido.

Frequência:

- pontual nesta rodada de correção pós-build.

### 2.3. Engenharia frontend

Pain points:

- precisa fechar o patch sem reabrir backend, contratos de dados ou lógica do runtime;
- precisa corrigir comportamento visual/ergonômico mantendo baixo risco.

Frequência:

- pontual nesta microetapa.

---

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | `WorkflowType` deve se tornar colapsável dentro da aba `Definições` | Cada `WorkflowType` passa a ter sua própria sanfona/accordion e as versões ficam ocultas por padrão até o usuário expandir o tipo correspondente |
| M2 | A configuração de `Ação` deve ficar totalmente coerente em PT-BR | O label do campo passa a ser `Ação`, o rótulo default criado ao selecionar uma action deixa de usar `Acao`, e a UI não exibe strings técnicas/sem acentuação nessa superfície |
| M3 | O footer fixo do modal não pode aparecer como editável antes da hidratação do shell | Enquanto o estado real do editor não estiver resolvido, o modal não deve exibir `Salvar rascunho`/`Publicar versão` como ações disponíveis; versões read-only não podem “piscar” com CTA editável |
| M4 | O CTA redundante de `Publicar versão` acima do footer fixo deve ser removido | No modo modal, a ação principal de publicar fica centralizada apenas no footer fixo inferior; não há duplicidade visual de publish em blocos superiores da tela |
| M5 | A semântica visual das badges deve seguir a hierarquia aprovada | Badges hoje douradas de publicação/versão publicada passam a usar cinza escuro; badges `Ativa` passam a usar verde claro; a diferenciação continua legível sem reabrir contratos de status |
| M6 | O filtro do `Histórico Geral` deve permanecer compacto sem assumir aplicação imediata por `onChange` | O `DEFINE` não exige mais que toda mudança em campo dispare o filtro imediatamente; o comportamento final pode usar aplicação explícita se isso gerar UX melhor dentro do popover compacto |
| M7 | As correções devem permanecer estritamente em frontend/UI | Nenhuma rota, API, persistência, publishability ou regra de runtime é alterada nesta microetapa |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Preservar o visual do patch crítico já aprovado | O accordion por `WorkflowType` reaproveita a composição já entregue de cards, badges e CTAs sem redesenho amplo da aba |
| S2 | Preservar acessibilidade básica do modal e das sanfonas | Accordion e botão `X` continuam acessíveis por teclado e sem regressão de foco/close |
| S3 | Evitar regressão no fluxo de edição/publicação já funcional | O modal continua permitindo salvar/publicar draft quando a versão for editável e o shell estiver hidratado |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Reaproveitar primitives existentes de accordion/dialog/shadcn sem criar abstrações novas | A implementação pode usar os mesmos primitives já presentes na aba para manter baixo risco |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Reabrir a correção do payload técnico (`statusKey`/`kind`) no save do editor | Esse tema pertence a outra trilha já tratada e não faz parte desta microcorreção visual |
| W2 | Redesenhar amplamente novamente o filtro do `Histórico Geral` | O filtro compacto do patch crítico permanece como baseline; esta rodada só ajusta comportamento/requisitos e acabamento |
| W3 | Alterar backend, API routes, types de persistência ou contratos do runtime | Fora do escopo desta rodada |
| W4 | Refatorar amplamente a hierarquia da aba `Definições` além do nível `WorkflowType` | O objetivo aqui é só fechar a colapsabilidade pedida |

---

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Hierarquia de `Definições` corrigida | 100% dos `WorkflowType` ficam colapsáveis e exibem versões apenas quando expandidos | Inspeção visual + teste de componente |
| Copy de ação 100% em PT-BR | Nenhuma ocorrência visível de `Acao` permanece nessa superfície; labels passam a usar `Ação`/`Rótulo da ação`/texto coerente | Busca no DOM renderizado + teste de componente |
| Sem flash de CTA editável | Ao abrir modal read-only ou enquanto o shell ainda carrega, o footer não mostra ações de edição/publicação de forma enganosa | Teste de componente do modal + validação manual |
| CTA de publish sem duplicidade | 0 ocorrências do botão superior redundante de `Publicar versão` no editor modal | Inspeção visual + teste de componente |
| Hierarquia cromática de badges corrigida | 100% das badges de publicação/versão publicada usam cinza escuro e 100% das badges `Ativa` usam verde claro | Comparação visual + asserção de classes/variants quando viável |
| Sem regressão do fluxo draft | Versões draft continuam expondo `Salvar rascunho`/`Publicar versão` depois da hidratação correta do shell | Teste de componente + smoke manual |

---

## 5. Technical Scope

### Backend / API

| Component | Change Type | Details |
|-----------|------------|---------|
| API routes de `/admin/request-config` | None | Nenhuma alteração |
| Serviços de admin-config | None | Nenhuma alteração |
| Runtime / publishability / persistência | None | Nenhuma alteração |

### Frontend

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx` | Modify | Introduzir accordion/sanfona por `WorkflowType`, remover o CTA redundante de publish acima do footer fixo e ajustar a semântica visual de badges de publicação/ativação |
| `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx` | Modify | Corrigir labels visíveis de `Ação` para PT-BR completo e remover rótulo default residual `Acao` |
| `src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx` | Modify | Ajustar o estado inicial/hidratação do footer fixo para não mostrar CTAs editáveis antes de saber se a versão é read-only |
| `src/components/workflows/admin-config/editor/types.ts` | Modify if needed | Caso necessário, adicionar estado explícito de hidratação do shell para suportar o gating do footer |
| `src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx` | Modify | Ajustar o requisito comportamental do filtro compacto sem obrigar aplicação imediata a cada `onChange`, preservando o padrão visual de popover |
| `src/components/workflows/admin-config/history/HistoryFiltersBar.tsx` | Modify | Adaptar a barra de filtros ao comportamento final escolhido dentro do popover compacto |

### Tests

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/admin-config/__tests__/WorkflowConfigDefinitionsTab.test.tsx` | Modify | Cobrir expansão/colapso de `WorkflowType` e visibilidade das versões |
| `src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx` | Modify | Cobrir labels traduzidos em PT-BR e ausência de `Acao` visível |
| `src/components/workflows/admin-config/__tests__/WorkflowVersionEditorDialog.test.tsx` | Modify | Cobrir gating do footer enquanto o shell não foi hidratado e abertura read-only sem CTA editável |
| `src/components/workflows/admin-config/__tests__/WorkflowConfigHistoryTab.test.tsx` | Modify | Cobrir ausência de aplicação imediata obrigatória, conforme o comportamento final escolhido para o filtro compacto |
| `src/components/workflows/admin-config/history/__tests__/HistoryFiltersBar.test.tsx` | Modify | Cobrir a interação final do filtro no popover |

### Database

| Model | Change Type | Details |
|-------|------------|---------|
| N/A | None | Sem mudança de dados |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Fora do escopo |

---

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A tela continua restrita ao fluxo autenticado existente do grupo `(app)` |
| Authorization | Nenhum gate novo; permanece o requisito administrativo de `canManageWorkflowsV2` |
| User Isolation | Sem alteração de isolamento de dados |
| Input Validation | Nenhuma mudança de payload/backend nesta microetapa |
| Access Safety | O ajuste do footer não pode expor CTA editável para versões read-only nem durante estado ainda não resolvido do shell |

---

## 7. Out of Scope

- reabrir o problema do payload técnico de `steps` no save;
- alterar `/gestao-de-chamados`, `/admin/workflows` ou outras rotas;
- substituir o filtro compacto por uma toolbar sempre aberta;
- refatorar o shell inteiro do modal além do gating do footer;
- alterar labels internas de enums/persistência no backend;
- mudar contratos de API, types de server, Firestore ou runtime.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md` | Internal | Ready |
| Patch crítico entregue no commit `0ce21078855bd0ac6fce321447086f2854d009b6` | Internal | Ready |
| Primitives `Accordion`, `Dialog`, `Button`, `Badge` de shadcn/ui | Internal | Ready |
| Testes existentes de `WorkflowConfigDefinitionsTab`, `WorkflowDraftStepsSection` e `WorkflowVersionEditorDialog` | Internal | Ready |

---

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Os gaps remanescentes estão concretos e observáveis na UI |
| User identification | 3 | Admin, UX e engenharia impactados estão claros |
| Success criteria measurability | 2 | Medição é majoritariamente por testes de componente e inspeção visual, mas continua objetiva |
| Technical scope definition | 3 | Escopo segue contido em poucos componentes de frontend e testes associados |
| Edge cases considered | 3 | Estado read-only, shell não hidratado, ruído visual de badges e ergonomia do filtro compacto foram explicitamente considerados |
| **TOTAL** | **14/15** | >= 12 - pronto para /design |

---

## 10. Next Step

Ready for `/design CORRECOES_POS_BUILD_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS` para detalhar:

- pattern de accordion por `WorkflowType` sem reabrir o layout por área;
- estratégia de gating do footer do modal até o shell state ser resolvido;
- ajuste final de copy PT-BR em `WorkflowDraftStepsSection`;
- remoção do CTA redundante de `Publicar versão` acima do footer;
- mapeamento visual final de badges (`Publicada`/versão publicada em cinza escuro e `Ativa` em verde claro);
- decisão do filtro compacto sem travar aplicação imediata por `onChange`;
- estratégia de testes de componente para os gaps remanescentes.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex (`define` skill) | Requisitos estruturados para as 3 correções remanescentes de UI/UX pós-build em `/admin/request-config` |
| 1.1 | 2026-04-16 | Codex (`iterate`) | Added redundant publish CTA removal, badge color hierarchy and filter behavior refinement to the same micro-fix scope |
