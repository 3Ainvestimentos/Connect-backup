# DEFINE: FALLBACK_DATA_PRIMEIRA_ETAPA_CONCLUIDA_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES

> Generated: 2026-04-17
> Status: Ready for /design
> Source: DEFINE_ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md
> Clarity Score: 15/15

## 1. Problem Statement

A primeira etapa concluída do histórico `v2` pode permanecer sem data mesmo após o enriquecimento por `step_completed`, porque a abertura do fluxo nem sempre gera um evento explícito de conclusão dessa etapa.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Usuário final (solicitante) | Vê a primeira etapa como `Concluída`, mas sem data, o que gera sensação de informação incompleta | Diário |
| Usuário final (solicitante) | Precisa de uma referência temporal mínima para entender quando o fluxo começou de fato | Diário |
| Time de engenharia (owners de workflows/requester) | Precisa resolver o vazio da primeira etapa sem abrir fallback genérico para todas as etapas e sem expor timeline técnica | Contínuo |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | O `v2` deve continuar usando `progress.items` como fonte visual primária do histórico | O bloco `Histórico` continua mostrando etapas do `progress`, sem renderizar eventos técnicos como itens visíveis |
| M2 | Etapas `completed` do `v2` continuam priorizando match com `step_completed` por `stepId` | Quando existir `step_completed.details.stepId === progress.stepId`, essa data continua sendo a fonte primária da conclusão |
| M3 | A primeira etapa concluída do `v2` pode usar fallback temporal controlado quando não houver `step_completed` correspondente | Se a primeira etapa do fluxo estiver `completed` e não houver match por `step_completed`, o helper tenta usar a data do evento `request_opened`; se ele não existir, usa `submittedAt` |
| M4 | O fallback deve valer somente para a primeira etapa do fluxo | Nenhuma etapa intermediária ou final pode receber data via `request_opened` ou `submittedAt` |
| M5 | Etapas `active` continuam sem data | A etapa atual segue exibindo `Atual`, sem data e sem placeholder artificial |
| M6 | Etapas `pending` continuam sem data | Etapas pendentes seguem exibindo `Pendente`, sem data e sem placeholder artificial |
| M7 | O comportamento de `legacy` não muda nesta rodada | Chamados `legacy` continuam usando exclusivamente a timeline derivada, sem fallback adicional |
| M8 | A cobertura de testes deve incluir o novo fallback e preservar os fluxos críticos do dialog | Existem testes cobrindo `step_completed` como fonte primária, `request_opened` como fallback da primeira etapa, `submittedAt` como fallback secundário, ausência de fallback em etapas não iniciais, erro bloqueante e fechamento do dialog |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | O fallback deve seguir ordem de precedência explícita | A resolução da data no `v2` segue sempre: `step_completed` -> `request_opened` -> `submittedAt`, apenas para a primeira etapa concluída |
| S2 | O histórico `v2` deve continuar sem expor eventos técnicos ao usuário final | Mesmo quando usar `request_opened` como fallback, a UI continua mostrando apenas a etapa, não o evento técnico |
| S3 | O helper deve manter correspondência estrutural e previsível | A identificação da primeira etapa usa `progress.order`/posição canônica, não heurística por label |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Tornar a origem da data internamente rastreável para debug/testes | O view-model pode registrar se a data veio de `step_completed`, `request_opened` ou `submittedAt`, sem expor isso ao usuário |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Aplicar fallback temporal em qualquer etapa concluída sem `step_completed` | Isso ampliaria demais a heurística e pode introduzir datas enganosas |
| W2 | Mostrar data para etapas `active` usando `entered_step` | Fora da decisão desta rodada |
| W3 | Alterar backend, endpoint ou read model para carregar timestamps por etapa em `progress.items` | Fora do escopo; a solução continua sendo apenas de apresentação |
| W4 | Alterar o comportamento funcional do histórico `legacy` | Fora do escopo e não necessário para resolver o problema |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Primeira etapa concluída com referência temporal | 100% dos casos em que a primeira etapa estiver concluída exibem data quando existir `request_opened` ou `submittedAt`, mesmo sem `step_completed` | Testes de helper e render validam os dois níveis de fallback |
| Fallback restrito à primeira etapa | 0 ocorrências de `request_opened`/`submittedAt` sendo usados para etapas não iniciais | Testes garantem ausência de fallback em etapas intermediárias ou finais |
| Prioridade correta da data | `step_completed` continua prevalecendo sobre `request_opened` e `submittedAt` | Testes confirmam a precedência da fonte primária |
| Zero regressão visual no `v2` | Etapas `active`/`pending` seguem sem placeholder de data | Testes de render garantem ausência de `Sem data` e equivalentes |
| Compatibilidade `legacy` preservada | 0 regressões funcionais em chamados `legacy` | Testes `legacy` continuam passando sem mudança de regra |

## 5. Technical Scope

### Backend (functions/src/, src/app/api/)
| Component | Change Type | Details |
|-----------|------------|---------|
| `GET /api/workflows/read/requests/[requestId]` | None | Continua sendo a fonte do detalhe `v2`; sem mudança contratual |
| Runtime / read model | None | O fallback usa apenas `request_opened` e `submittedAt` já disponíveis no contrato atual |

### Frontend (src/)
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/requester/presentation/build-requester-history.ts` | Modify | Adicionar fallback controlado para a primeira etapa concluída: `step_completed` -> `request_opened` -> `submittedAt` |
| `src/components/workflows/requester/RequesterRequestHistory.tsx` | Reuse / None | Mantém a política de render já aprovada; sem mudança obrigatória se `occurredAt` continuar vindo pronto do helper |
| `src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts` | Modify | Cobrir fallback da primeira etapa e garantir que ele não vaza para etapas não iniciais |
| `src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx` | Modify | Cobrir exibição da data da primeira etapa via fallback e preservar erro/fechamento |
| `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts` | Reuse / None | Já preserva `timeline.action/details`; sem mudança obrigatória esperada |
| `src/lib/workflows/requester/unified-types.ts` | Reuse / None | Contrato atual deve ser suficiente; ajustar apenas se a implementação optar por rastrear a origem da data |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Sem escopo de IA/Genkit |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| Firestore read models V2 | None | Apenas leitura dos dados já existentes |
| Estruturas legadas de workflows | None | Sem impacto |

## 6. Auth Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A rota `/solicitacoes` permanece no grupo autenticado `(app)` |
| User Isolation | O fallback usa apenas metadados já disponíveis ao próprio solicitante |
| Authorization Surface | O modal continua estritamente read-only |
| Input Validation | O helper deve tolerar ausência de `request_opened`, `submittedAt` nulo, primeira etapa sem `order`, e ausência de `step_completed` sem lançar exceções |

## 7. Out of Scope

- Aplicar fallback temporal em etapas intermediárias ou finais
- Mostrar data para etapas `active` via `entered_step`
- Exibir timeline técnica do `v2` ao usuário final
- Alterar backend, endpoint, schema ou regras de acesso
- Modificar o comportamento funcional do histórico `legacy`

## 8. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | O delta é específico: preencher a data ausente da primeira etapa concluída do `v2` |
| User identification | 3 | Usuário final e engenharia têm dores e objetivo muito claros |
| Success criteria measurability | 3 | Há critérios verificáveis por testes de helper e render |
| Technical scope definition | 3 | Arquivos impactados e ordem de precedência estão nomeados explicitamente |
| Edge cases considered | 3 | `step_completed`, `request_opened`, `submittedAt`, ausência de match e preservação de `legacy` foram cobertos |
| **TOTAL** | **15/15** | >= 12 — pronto para /design |

## 9. Next Step

Ready for `/design FALLBACK_DATA_PRIMEIRA_ETAPA_CONCLUIDA_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES` para detalhar a ordem de precedência entre `step_completed`, `request_opened` e `submittedAt`, além da estratégia de testes do fallback controlado.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex | Initial define for controlled fallback date on the first completed V2 step using `request_opened` or `submittedAt` without changing legacy behavior |
