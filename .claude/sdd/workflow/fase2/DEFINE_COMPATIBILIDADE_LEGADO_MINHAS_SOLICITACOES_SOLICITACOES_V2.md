# DEFINE: COMPATIBILIDADE_LEGADO_MINHAS_SOLICITACOES_SOLICITACOES_V2

> Generated: 2026-04-13
> Status: Ready for /design
> Source: BRAINSTORM_COMPATIBILIDADE_LEGADO_MINHAS_SOLICITACOES_SOLICITACOES_V2.md
> Clarity Score: 14/15

## 1. Problem Statement

A seção "Minhas Solicitações" da nova rota `/solicitacoes` só exibe chamados v2, obrigando o solicitante a acessar `/applications` para acompanhar chamados legados, e hoje não há uma superfície única (nova) capaz de mostrar ambos os tipos em uma única tabela com experiência visual unificada.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Usuário final (solicitante) | Precisa navegar entre `/solicitacoes` (v2) e `/applications` (legado) para acompanhar todos os seus chamados, sem visão consolidada | Diário |
| Usuário final (solicitante) | Experiência visual e de detalhe diferente entre legado e v2 gera confusão sobre status, SLA e dados enviados | Diário |
| Time de engenharia (owners do módulo de workflows) | Não consegue remover com segurança o código morto de `src/components/applications/*` enquanto a nova superfície não cobrir o caso legado | Contínuo (dívida técnica) |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Exibir em uma única tabela, dentro da seção "Minhas Solicitações" de `/solicitacoes`, todos os chamados do usuário atual provenientes tanto do v2 quanto do legado | A tabela renderiza itens com `origin: 'legacy' \| 'v2'`, filtrados pelo usuário autenticado, sem duplicar nem omitir chamados do legado ou do v2 |
| M2 | Converter ambas as origens (legado e v2) em um único view-model de lista (`RequesterUnifiedRequestListItem`) dentro do módulo novo de workflows/requester | Existe um tipo unificado com campos mínimos `origin`, `requestId`, `workflowName`, `statusLabel`, `expectedCompletionLabel`/`expectedCompletionAt`, `submittedAt`, `lastUpdatedAt`, `detailKey`; itens v2 e legado são normalizados para esse tipo |
| M3 | Fornecer um detalhe unificado (dialog/modal) capaz de renderizar chamados das duas origens com a mesma experiência visual | Ao clicar em um item v2 e em um item legado, o mesmo shell visual de detalhe é aberto, mostrando solicitante, tipo/workflow, datas, dados enviados, anexos, histórico/timeline e status, com degradação elegante quando o campo estrutural não existir no legado |
| M4 | Reconstruir no módulo novo os helpers de derivação necessários para o legado (status label, SLA/previsão, área, anexos, timeline, nome do workflow), sem importar componentes visuais de `src/components/applications/*` | Helpers puros existem em `src/lib/workflows/requester/legacy/` (ou equivalente) e são usados pelos adapters; nenhum import de `MyRequests.tsx` ou `RequestDetailsModal.tsx` aparece dentro de `src/components/workflows/requester/*` |
| M5 | Filtrar os chamados legados pelo usuário autenticado antes de juntá-los aos itens v2 | Somente requests legados cujo solicitante corresponde ao usuário atual (via `useAuth()` + `useCollaborators()`) são incluídos na lista unificada; se a identidade do usuário não resolver para um colaborador legado, a origem legado contribui com lista vazia sem bloquear a exibição dos itens v2 |
| M6 | Ordenar a lista unificada de forma estável e consistente entre as duas origens | Os itens são ordenados por `lastUpdatedAt` desc (com `submittedAt` desc como critério secundário), e a ordenação é determinística mesmo quando legado e v2 trazem timestamps no mesmo instante |
| M7 | Expor estados unificados de loading e error para a seção "Minhas Solicitações" | A seção só mostra conteúdo quando legado e v2 terminaram de carregar (ou trata loading parcial de forma explícita) e surfaces um erro único quando qualquer origem falhar |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Degradação elegante de campos v2 inexistentes no legado (ex.: `currentStepName`, `progress` estruturado, `areaId` direto) | Quando o campo não existir no legado, a UI apresenta um fallback claro (placeholder, "—" ou estado neutro) em vez de quebrar o layout ou exibir `undefined` |
| S2 | Separar anexos do legado a partir dos campos `formData` tipo `file` para alimentar o mesmo slot de anexos do detalhe unificado | Helper `deriveLegacyAttachments` produz uma lista equivalente à usada pelo v2, consumida pelo mesmo componente visual de anexos |
| S3 | Garantir paridade funcional do status label e do SLA/previsão entre `/applications` e a nova tabela para chamados legados | Para um mesmo chamado legado, o label de status e o texto de previsão exibidos em `/solicitacoes` são iguais aos exibidos hoje em `/applications` |
| S4 | Testes de adapter comparando saídas contra fixtures reais do legado | Existem testes unitários cobrindo os helpers principais (status, SLA, anexos, timeline) com fixtures derivadas de dados legados reais |
| S5 | Tornar observável a reconciliação de identidade legada sem poluir a UX | Hook unificado expõe um sinal técnico como `legacyIdentityResolved` para testes/diagnóstico, mas a UI final do solicitante não mostra erro destrutivo quando a origem legado não resolve |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Indicador visual discreto de origem do chamado (legado vs v2) para facilitar triagem interna durante a transição | Um badge/tag opcional pode ser ligado via feature flag ou prop para marcar itens legados, sem poluir a UX final |
| C2 | Checklist documentado de limpeza futura (quais arquivos do legado podem ser removidos após estabilização) | Documento curto listando `MyRequests.tsx`, `RequestDetailsModal.tsx` e helpers legados mortos após a migração |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Endpoint server-side unificado legado + v2 (`GET /api/workflows/read/mine` estendido para legado) | Corte YAGNI explícito no brainstorm; reabrir backend não é necessário nesta iteração e a meta imediata é limpar o frontend/módulo |
| W2 | Paginação e filtros avançados na nova tabela unificada | Fora do escopo desta iteração conforme corte YAGNI do brainstorm |
| W3 | Espelhar 100% do contrato profundo do v2 para o legado (ex.: `progress` totalmente estruturado) | Degradação elegante é suficiente; paridade total seria esforço desproporcional |
| W4 | Reaproveitar diretamente componentes visuais de `src/components/applications/*` | Decisão de arquitetura: a nova superfície não deve depender estruturalmente do legado |
| W5 | Remover efetivamente `src/components/applications/*` nesta iteração | A limpeza só é segura após estabilização e será tratada em iteração posterior |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Visão unificada do solicitante | 100% dos chamados do usuário (legado + v2) aparecem em `/solicitacoes` | Comparar a contagem de itens na nova tabela com a soma de itens de `/applications` (legado do usuário) + itens v2 atuais, para um conjunto de usuários reais |
| Paridade de status/SLA para o legado | Zero divergências em status label e previsão entre `/solicitacoes` e `/applications` para o mesmo chamado legado | Comparação manual/automatizada sobre fixtures reais e amostra de produção |
| Detalhe visualmente unificado | Um único shell de detalhe atende legado e v2 | Inspeção de componente: o mesmo componente de detalhe é usado para ambas as origens; nenhuma ramificação visual específica por origem no nível de layout principal |
| Independência do legado | Nenhum import de `src/components/applications/*` dentro de `src/components/workflows/requester/*` | Grep estático no código após implementação |
| Filtragem por usuário | 0% de vazamento de chamados de outros usuários | Testes cobrindo o filtro por usuário atual no hook unificado |
| Estabilidade de loading/error | A seção nunca renderiza lista parcial silenciosa quando uma das origens ainda carrega ou falha | Testes de estado do hook unificado (loading, error, success, partial) |

## 5. Technical Scope

### Backend (functions/src/, src/app/api/)
| Component | Change Type | Details |
|-----------|------------|---------|
| `GET /api/workflows/read/mine` | None | Continua sendo a fonte v2; não é estendido nesta iteração |
| Cloud Functions | None | Sem alterações em `functions/src/` |
| Firestore Rules | None | Sem novas regras; leitura legada continua pelos contextos existentes |

### Frontend (src/)
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/requester/MyRequestsV2Section.tsx` | Modify | Passar a consumir o hook unificado e renderizar a lista única (legado + v2) |
| `src/components/workflows/requester/RequestsV2Page.tsx` | Modify (se necessário) | Ajustar wiring para o novo hook/seção unificada |
| `src/components/workflows/requester/` (novo dialog unificado) | Create | Evoluir/criar `RequesterUnifiedRequestDetail` capaz de renderizar view-model unificado com origens `legacy` e `v2` |
| `src/hooks/use-requester-unified-requests.ts` | Create | Novo hook que combina v2 (`use-requester-workflows`) + legado (`useWorkflows`, `useApplications`, `useCollaborators`, `useAuth`), filtra por usuário, normaliza, ordena e expõe loading/error |
| `src/hooks/use-requester-workflows.ts` | None / minor read-only | Continua provendo dados v2; usado internamente pelo hook unificado |
| `src/lib/workflows/requester/unified-types.ts` | Create | Tipos `RequesterUnifiedRequestListItem` e `RequesterUnifiedRequestDetail` com discriminante `origin: 'legacy' \| 'v2'` |
| `src/lib/workflows/requester/legacy/` | Create | Helpers puros: `deriveLegacyWorkflowName`, `deriveLegacyStatusLabel`, `deriveLegacyArea`, `deriveLegacyExpectedCompletion`, `deriveLegacyAttachments`, `deriveLegacyTimeline` |
| `src/lib/workflows/requester/adapters/` | Create | Adapters `legacyRequestToUnifiedListItem`, `legacyRequestToUnifiedDetail`, `v2ReadSummaryToUnifiedListItem`, `v2ReadDetailToUnifiedDetail` |
| `src/components/applications/MyRequests.tsx` | None (nesta iteração) | Mantido intacto; candidato a remoção futura |
| `src/components/applications/RequestDetailsModal.tsx` | None (nesta iteração) | Mantido intacto; candidato a remoção futura |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Feature puramente de UI/composição de dados; sem escopo de IA/Genkit |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| Firestore `workflows` (legado) | None | Continua sendo lido via `useWorkflows()` |
| Firestore `workflowDefinitions` (legado) | None | Continua sendo lido via `useApplications()` |
| Firestore v2 (read model de workflows) | None | Continua acessado via `GET /api/workflows/read/mine` |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | Rota `/solicitacoes` já está sob o grupo autenticado `(app)`; a feature herda a exigência de usuário autenticado via `AuthContext` |
| User Isolation | O hook unificado DEVE filtrar chamados legados para que um usuário só veja os próprios requests (usando `useAuth()` + `useCollaborators()` para resolver identidade); itens v2 já vêm pré-filtrados pelo endpoint `mine`. Se a identidade legada não puder ser resolvida, o comportamento deve degradar para `[]` na origem legado, sem expor requests de terceiros nem derrubar a experiência do v2 |
| Role-based Access | Sem nova lógica de papel; qualquer usuário autenticado vê sua própria lista (solicitante comum) |
| Input Validation | Os adapters devem tratar campos ausentes/corrompidos do legado sem lançar exceções (degradação elegante), normalizar timestamps antes de ordenar e tratar identidade legada não resolvida como ausência segura de itens legados |
| Data Sanitization | Sem persistência nova; `cleanDataForFirestore` não se aplica. Helpers devem ser puros e seguros a valores `undefined`/`null` do legado |

## 7. Out of Scope

- Criar endpoint server-side unificado legado + v2 (fica como evolução futura)
- Paginação, filtros avançados e busca textual na nova tabela unificada
- Migração de dados do legado para o modelo v2
- Remoção efetiva dos arquivos `src/components/applications/MyRequests.tsx` e `RequestDetailsModal.tsx`
- Alterações na rota `/applications` (ela continua funcionando como está)
- Reaproveitamento direto de componentes visuais do legado dentro de `src/components/workflows/requester/*`
- Visão do aprovador/responsável (esta feature cobre apenas a visão do solicitante)
- Ações sobre os chamados (esta iteração é somente leitura/acompanhamento)
- Novos índices do Firestore ou mudanças nas Firestore Rules
- Espelhar 100% do contrato profundo do v2 (ex.: `progress` totalmente estruturado) para itens legados

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `useWorkflows()` (contexto legado de workflows) | Internal | Ready |
| `useApplications()` (contexto legado de workflow definitions) | Internal | Ready |
| `useCollaborators()` (identidade do usuário atual para filtro legado) | Internal | Ready |
| `useAuth()` / `AuthContext` | Internal | Ready |
| `use-requester-workflows` + `GET /api/workflows/read/mine` (v2) | Internal | Ready |
| `RequestsV2Page.tsx` / `MyRequestsV2Section.tsx` (host da nova tabela) | Internal | Ready |
| Componentes do shell visual do detalhe do requester v2 | Internal | Ready (a evoluir para view-model unificado) |
| Fixtures reais de chamados legados para testes de adapter | Internal | Pending (a capturar durante implementação) |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Problema descrito em uma frase, com contexto explícito das duas rotas e da dívida técnica |
| User identification | 3 | Solicitante final como usuário primário, com pain points concretos; owners do módulo como stakeholder secundário |
| Success criteria measurability | 3 | Critérios mensuráveis (contagem de itens, paridade de status/SLA, grep estático, testes unitários) |
| Technical scope definition | 3 | Arquivos, hooks, helpers e tipos alvo nomeados explicitamente no módulo novo |
| Edge cases considered | 3 | Degradação elegante, campos ausentes no legado, loading/error parciais, ordenação determinística e fallback seguro quando a identidade legada não resolve estão cobertos |
| **TOTAL** | **15/15** | >= 12 — pronto para /design |

## 10. Next Step

Ready for `/design COMPATIBILIDADE_LEGADO_MINHAS_SOLICITACOES_SOLICITACOES_V2` para criar a especificação técnica (contratos detalhados de `RequesterUnifiedRequestListItem` e `RequesterUnifiedRequestDetail`, assinaturas dos helpers legados, estrutura do hook unificado e estratégia de testes com fixtures).

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-13 | define-agent | Initial requirements from BRAINSTORM_COMPATIBILIDADE_LEGADO_MINHAS_SOLICITACOES_SOLICITACOES_V2.md |
