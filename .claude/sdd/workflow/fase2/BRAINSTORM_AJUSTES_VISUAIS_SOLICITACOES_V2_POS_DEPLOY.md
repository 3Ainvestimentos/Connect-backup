# BRAINSTORM: AJUSTES VISUAIS SOLICITACOES V2 POS DEPLOY

> Generated: 2026-04-15
> Status: Ready for /define

## 1. Problem Statement (Raw)

A feature de abertura de chamados em `/solicitacoes` foi deployada com sucesso e esta funcionando majoritariamente, mas ainda nao espelha a experiencia visual da tela legada `/applications`.

Os ajustes desejados para hoje sao:

1. alinhar o header da abertura de chamado ao padrao visual do legado;
2. fazer os cards de area seguirem o visual da tela legada, sem chips/lista de tipos de solicitacao;
3. fazer a tabela de `Minhas Solicitacoes` ocupar mais largura util da tela, com menor padding lateral, como no legado.

Restricoes explicitamente fechadas com o usuario:

- mexer apenas na superficie v2 pos-refatoracao;
- nao mexer em backend;
- nao reconstruir nem alterar a tela legada;
- nao alterar componentes nao citados explicitamente sem nova aprovacao.

## 2. Discovery Summary

### Questions Asked
| # | Question | Answer |
|---|----------|--------|
| 1 | Qual deve ser a referencia visual principal? | A tela legada `/applications` inteira, copiando header, largura util e cards quase `1:1`, mas aplicando apenas na V2 |
| 2 | Onde aplicar esse espelhamento visual? | Inicialmente a `\/solicitacoes` inteira, mas para este patch critico o usuario aprovou restringir a execucao aos `3` pontos explicitamente citados |
| 3 | Qual a urgencia? | Critica, para corrigir ainda hoje |

### Context Explored
| Area | Files/Patterns Found |
|------|---------------------|
| Backend | N/A - pedido estritamente visual, sem mudancas em rotas, runtime ou read model |
| Frontend | `src/components/workflows/requester/RequestsV2Page.tsx`, `WorkflowAreaGrid.tsx`, `WorkflowAreaCard.tsx`, `MyRequestsV2Section.tsx`, `WorkflowSelectionModal.tsx`, `WorkflowSubmissionModal.tsx`, `src/app/(app)/applications/page.tsx`, `src/components/applications/MyRequests.tsx`, `src/components/layout/PageHeader.tsx` |
| Database | N/A - nenhum impacto em Firestore ou contratos de dados |
| Security Rules | N/A - nenhuma alteracao em authz, Firestore Rules ou Storage Rules |

## 3. Approaches Explored

### Approach A: Ajuste Cirurgico da Tela Principal (Selected)

**What it does:** Corrige apenas os `3` pontos visuais explicitamente aprovados na tela principal da `/solicitacoes`, espelhando o legado no header, nos cards de area e na largura util da tabela `Minhas Solicitacoes`.

**Implementation:**
- Backend: N/A
- Frontend: ajustar apenas a composicao visual da tela principal em `RequestsV2Page`, `WorkflowAreaGrid`, `WorkflowAreaCard` e `MyRequestsV2Section`
- Database: N/A
- AI: N/A

**Pros:**
- menor risco para um patch critico no mesmo dia;
- atende exatamente os pontos apontados pelo usuario;
- preserva o comportamento funcional ja validado em deploy;
- evita abrir escopo em modais e detalhe sem aprovacao explicita.

**Cons:**
- se houver desalinhamento visual adicional em modais, isso fica para um segundo patch;
- a experiencia final pode ficar parcialmente alinhada ao legado, e nao totalmente espelhada, neste primeiro corte.

**Effort:** Low

### Approach B: Espelhamento Visual Completo da Superficie V2

**What it does:** Alem dos `3` pontos da tela principal, revisa tambem modal de selecao e modal de submissao para aproximar tipografia, espacamento e largura da experiencia legada.

**Implementation:**
- Backend: N/A
- Frontend: tela principal + `WorkflowSelectionModal` + `WorkflowSubmissionModal`
- Database: N/A
- AI: N/A

**Pros:**
- gera maior consistencia visual na experiencia inteira de abertura;
- reduz a chance de o usuario perceber discrepancias logo apos os ajustes principais.

**Cons:**
- amplia o raio de mudanca alem do aprovado;
- aumenta risco de regressao visual e de testes no patch critico;
- conflita com a decisao do usuario de nao alterar componentes nao citados sem nova aprovacao.

**Effort:** Medium

### Approach C: Abstracao Visual Compartilhada Legado + V2

**What it does:** Extrai um padrao visual compartilhado entre `/applications` e `/solicitacoes` para manter consistencia por composicao reutilizavel.

**Implementation:**
- Backend: N/A
- Frontend: refatoracao transversal em componentes legados e v2
- Database: N/A
- AI: N/A

**Pros:**
- melhor consistencia de medio/longo prazo;
- reduz divergencia visual futura entre as duas superficies.

**Cons:**
- overkill para uma correcao critica de hoje;
- exigiria tocar tambem no legado, o que foi explicitamente descartado;
- mistura polimento visual com refatoracao estrutural.

**Effort:** High

## 4. Selected Approach

**Choice:** Approach A

**Rationale:** Esta abordagem resolve com seguranca os pontos visuais mais visiveis da `/solicitacoes` v2, preservando o comportamento funcional ja deployado e respeitando todas as restricoes fechadas com o usuario: V2-only, sem backend, sem tocar no legado e sem expandir escopo para outros componentes sem aprovacao.

## 5. YAGNI Applied

### Features Removed/Deferred
| Feature | Why Removed |
|---------|-------------|
| Alinhar modal de selecao ao legado neste patch | Nao foi citado explicitamente no escopo aprovado para hoje |
| Alinhar modal de submissao ao legado neste patch | Nao foi citado explicitamente no escopo aprovado para hoje |
| Ajustar dialog de detalhe da solicitacao | Fora dos `3` pontos aprovados |
| Criar camada visual compartilhada entre legado e v2 | Over-engineering para patch critico |
| Qualquer mudanca em hooks, API client ou backend | Pedido estritamente visual |

### Minimum Viable Scope
Aplicar somente:

- header da `/solicitacoes` com o mesmo padrao visual da `/applications`;
- cards de area da V2 com o mesmo padrao visual limpo da tela legada, sem chips/lista resumida de workflows;
- secao `Minhas Solicitacoes` da V2 com maior largura util e menor compressao lateral, como no legado.

## 6. Draft Requirements (for /define)

### Must Have
- [ ] O bloco superior da `/solicitacoes` deve reutilizar o padrao visual do header legado de `/applications`, incluindo tipografia e espacamento equivalentes
- [ ] Os cards de area da V2 devem espelhar o visual limpo dos cards da tela legada, removendo os chips/lista de workflows
- [ ] A secao `Minhas Solicitacoes` da V2 deve ocupar maior largura util da tela, reduzindo o padding lateral em relacao ao estado atual
- [ ] O patch deve alterar apenas a camada visual da V2, sem qualquer mudanca funcional em catalogo, submissao, leitura ou detalhe

### Should Have
- [ ] O comportamento responsivo dos cards deve continuar estavel em desktop e nao degradar mobile
- [ ] O novo layout deve preservar acessibilidade basica existente, incluindo foco e acionamento por teclado nos cards

### Could Have (Deferred)
- [ ] Revisar tipografia e espacamento de `WorkflowSelectionModal`
- [ ] Revisar tipografia e espacamento de `WorkflowSubmissionModal`

## 7. Technical Notes

### Impacted Areas
| Layer | Impact |
|-------|--------|
| Backend | Nenhum |
| Frontend | `RequestsV2Page`, `WorkflowAreaGrid`, `WorkflowAreaCard`, `MyRequestsV2Section` |
| Database | Nenhum |
| Security Rules | Nenhum |

### Risks Identified
| Risk | Mitigation |
|------|------------|
| Ajuste visual mexer demais na composicao e abrir escopo escondido | Restringir mudancas aos `3` pontos aprovados |
| Cards perderem responsividade ao copiar o legado quase `1:1` | Validar desktop + mobile e preservar grid responsivo minimo |
| Tabela ficar larga demais e desalinhada do restante da pagina | Ajustar largura util com criterio local na secao de `Minhas Solicitacoes`, sem alterar contratos ou comportamento |

## 8. Next Step

Ready for `/define AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY` to formalize requisitos executaveis do patch critico.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-15 | brainstorm-agent | Initial brainstorm |
