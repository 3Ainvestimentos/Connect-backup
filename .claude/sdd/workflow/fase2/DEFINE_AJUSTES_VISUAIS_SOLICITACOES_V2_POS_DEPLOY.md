# DEFINE: AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY

> Generated: 2026-04-15
> Status: Ready for /design
> Scope: Patch critico de alinhamento visual da rota `/solicitacoes` v2 apos deploy
> Source: `BRAINSTORM_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md`
> Clarity Score: 14/15

## 1. Problem Statement

A rota `/solicitacoes` v2 ja esta funcional em producao, mas ainda diverge visualmente da experiencia canonica do legado `/applications` nos 3 pontos mais visiveis da tela principal: header, cards de area e largura util da secao `Minhas Solicitacoes`.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Solicitante final | Abre `/solicitacoes` e percebe uma experiencia visual diferente da superficie legada que ainda serve de referencia mental para abrir chamados | Sempre que acessa a tela |
| Solicitante final | Encontra cards de area com chips/lista resumida de workflows, o que gera mais ruido visual do que o padrao limpo esperado | Sempre que escolhe uma area |
| Produto / UX | Precisa reduzir rapidamente o delta visual entre v2 e legado sem reabrir o escopo funcional do fluxo ja deployado | Pontual nesta rodada |
| Engenharia | Precisa aplicar um patch seguro e restrito, sem tocar backend, contratos, modais ou outras superficies nao aprovadas | Pontual nesta rodada |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Alinhar o header da `/solicitacoes` ao frontend legado de `/applications` | O topo da pagina reutiliza a mesma hierarquia visual do legado para titulo, descricao e espacamento, tomando como referencia direta o `PageHeader` e a copy do frontend legado (`Solicitações` + `Inicie processos e acesse as ferramentas da empresa.`), sem alterar navegacao nem comportamento |
| M2 | Espelhar os cards de area do frontend legado na V2 | `WorkflowAreaCard` deve copiar a composicao visual canonica de `/applications`: card centrado, icone + nome da area, sem chips/lista resumida de workflows e sem a linha `n tipos de solicitacao`, preservando clique e navegacao por teclado |
| M3 | Aumentar a largura util de `Minhas Solicitacoes` sem abrir escopo para outras superficies | A secao/tabela da V2 passa a usar largura visual equivalente ao legado para ocupar a maior parte da tela, mas o ajuste deve ser justificado apenas pelos 3 pontos aprovados (header, cards e tabela), sem reinterpretar isso como revisao ampla de outras secoes ou componentes nao aprovados |
| M4 | Manter o patch estritamente visual e localizado | Nenhum contrato de dados, endpoint, hook de negocio, comportamento de abertura, detalhe ou read model e alterado nesta rodada |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Preservar estabilidade responsiva | Os ajustes continuam funcionais em desktop e mobile sem quebrar o grid de areas nem a legibilidade da tabela |
| S2 | Preservar acessibilidade basica existente | Cards continuam acionaveis por mouse e teclado, e a mudanca visual nao remove labels, foco nem affordances ja existentes |
| S3 | Manter consistencia local entre topo, grid e tabela | Os 3 ajustes produzem uma leitura visual mais coesa da pagina, sem exigir revisao adicional em modais para este patch |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Reaproveitar primitives ja existentes do app para aproximar o header e os blocos do legado | Se houver baixo custo, o patch pode reutilizar `PageHeader`, tokens, espacamentos ou classes ja existentes em vez de criar estilo novo |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Ajustar `WorkflowSelectionModal` para o mesmo visual do legado | Nao faz parte dos 3 pontos aprovados para hoje |
| W2 | Ajustar `WorkflowSubmissionModal` para o mesmo visual do legado | Nao faz parte dos 3 pontos aprovados para hoje |
| W3 | Alterar backend, API routes, hooks de dados ou read model | O pedido e estritamente visual e nao exige mudanca funcional |
| W4 | Modificar a rota legada `/applications` ou extrair design system compartilhado | O legado permanece intocado e a rodada nao inclui refatoracao transversal |
| W5 | Revisar detalhe read-only ou outras secoes da experiencia requester | Fora do recorte aprovado pelo usuario |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Header visualmente alinhado ao legado | O topo da `/solicitacoes` reproduz a mesma hierarquia percebida em `/applications`, incluindo a copy do frontend legado | Comparacao visual lado a lado entre as duas rotas |
| Cards de area sem ruido extra | 100% dos cards da V2 deixam de renderizar chips/lista resumida de workflows e a linha `n tipos de solicitacao` | Inspecao visual e verificacao do DOM/componente |
| Tabela com maior largura util | A secao `Minhas Solicitacoes` passa a ocupar mais largura horizontal visivel, em linha com o shell espacial do legado | Comparacao visual antes/depois em desktop |
| Sem regressao funcional | Fluxos de clique nos cards, abertura de modal e detalhe de `Minhas Solicitacoes` continuam operando | Smoke manual da tela apos patch |
| Responsividade preservada | Layout continua utilizavel em viewport mobile e desktop | Smoke manual responsivo |

## 5. Technical Scope

### Backend / API
| Component | Change Type | Details |
|-----------|------------|---------|
| API routes de workflows requester | None | Nenhuma alteracao em fetch de catalogo, abertura de request, detalhe ou listagem |
| Runtime/read model v2 | None | Nenhuma alteracao de contrato ou comportamento |

### Frontend
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/requester/RequestsV2Page.tsx` | Modify | Copiar o shell visual relevante do frontend legado para os 3 pontos aprovados: wrapper tipo `space-y-8 p-6 md:p-8`, uso de `PageHeader`/hierarquia equivalente e composicao espacial coerente entre topo, grid e tabela |
| `src/components/workflows/requester/WorkflowAreaGrid.tsx` | Modify | Ajustar distribuicao e espacamentos para acomodar o mesmo padrao visual dos cards legados (`flex-wrap`/cards fixos ou equivalente funcional) sem alterar a logica de selecao |
| `src/components/workflows/requester/WorkflowAreaCard.tsx` | Modify | Copiar a composicao visual do card legado: icone centralizado, nome da area, sem subtitulo de contagem e sem chips/lista de workflows |
| `src/components/workflows/requester/MyRequestsV2Section.tsx` | Modify | Aplicar largura util equivalente ao legado para a secao, mantendo o mesmo conteudo funcional da tabela e sem revisar colunas/comportamento |
| `src/app/(app)/applications/page.tsx` | None | Serve apenas como referencia visual canonica; nao deve ser alterado |
| `src/components/layout/PageHeader.tsx` | None / Reuse | Pode ser reutilizado como primitive se ajudar a aproximar o header ao legado sem criar nova abstracao |

### Legacy Visual Canon (reference only)
| Reference | Legacy definition to mirror in V2 |
|-----------|-----------------------------------|
| `src/app/(app)/applications/page.tsx:98` | O shell visual da tela usa `space-y-8 p-6 md:p-8`, `PageHeader` com a copy `Solicitações` / `Inicie processos e acesse as ferramentas da empresa.`, e os cards em `flex flex-wrap justify-center gap-4` |
| `src/app/(app)/applications/page.tsx:117` | Os cards legados sao `h-32 w-48`, centrados, com icone + nome da area, sem subtitulo de contagem e sem chips |
| `src/components/applications/MyRequests.tsx:90` | A secao `Minhas Solicitações` ocupa a largura util do shell da pagina, sem o `container mx-auto px-4` estreito que hoje existe na V2 |

### Tests
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx` | Modify | Alinhar a suite ao wiring atual da pagina e aos providers/hooks realmente usados, para que o patch visual nao rode sobre uma base de teste ja quebrada |
| `src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx` | Modify | Atualizar mocks/contrato da suite para refletir `useRequesterUnifiedRequests` e a estrutura real do componente, mesmo que assercoes sigam predominantemente visuais |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| `workflowAreas` | None | Sem alteracao de leitura ou schema |
| `workflows_v2` / read-side | None | Sem alteracao de schema, query ou persistencia |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Sem escopo de IA/Genkit |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A rota continua sob `(app)` e herda autenticacao existente; nenhum gate novo e introduzido |
| User Isolation | A secao `Minhas Solicitacoes` continua respeitando o isolamento atual do requester; esta rodada nao altera query, filtro nem autorizacao |
| Input Validation | Nao ha mudanca de validacao, pois o patch nao altera submit, payload nem formularios |
| Access Safety | Ajustes visuais nao podem remover affordances de foco/teclado existentes nos cards e acoes da tabela |

## 7. Out of Scope

- alterar `WorkflowSelectionModal`, `WorkflowSubmissionModal` ou `RequesterUnifiedRequestDetailDialog`;
- mudar copy fora do header aprovado, rotas, hooks, endpoints, queries ou modelos de dados;
- reimplementar a rota legada `/applications`;
- introduzir novo token visual, novo design system ou refatoracao compartilhada legado + v2;
- revisar comportamento da tabela alem de largura/utilizacao espacial;
- alterar colunas, ordenacao, status, botao do olho ou logica de detalhe;
- mexer em backend, Firestore, rules, authz ou uploads.

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md` | Internal | Ready |
| Implementacao atual de `/solicitacoes` em `src/components/workflows/requester/*` | Internal | Ready |
| Referencia visual da rota legada `/applications` | Internal | Ready |
| Define-base `DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md` para limites estruturais da feature | Internal | Ready |
| Layout/autenticacao do grupo `(app)` | Internal | Ready |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | O gap visual e objetivo e restrito a 3 pontos explicitamente aprovados |
| User identification | 3 | Solicitante final, produto/UX e engenharia afetados estao claros, com pain points concretos |
| Success criteria measurability | 2 | Os criterios sao verificaveis por comparacao visual e smoke manual, embora nao sejam fortemente automatizados |
| Technical scope definition | 3 | Componentes afetados e limites sem backend estao bem delimitados |
| Edge cases considered | 3 | Responsividade, foco/teclado, preservacao funcional e contencao de escopo foram contemplados |
| **TOTAL** | **14/15** | >= 12 - pronto para /design |

## 10. Next Step

Ready for `/design AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY` para detalhar a solucao tecnica de composicao, espacamentos, reuse de primitives visuais e estrategia de validacao do patch.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-15 | Codex (`define` skill) | Initial requirements from `BRAINSTORM_AJUSTES_VISUAIS_SOLICITACOES_V2_POS_DEPLOY.md` |
