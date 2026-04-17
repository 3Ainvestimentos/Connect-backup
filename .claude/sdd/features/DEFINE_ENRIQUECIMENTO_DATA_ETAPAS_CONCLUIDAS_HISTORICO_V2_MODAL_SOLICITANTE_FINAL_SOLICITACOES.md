# DEFINE: ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES

> Generated: 2026-04-17
> Status: Ready for /design
> Source: DEFINE_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md
> Clarity Score: 15/15

## 1. Problem Statement

O histórico do modal do solicitante final em `/solicitacoes` já mostra corretamente as etapas do `v2`, mas ainda não consegue exibir a data de conclusão das etapas concluídas sem recorrer a placeholder artificial ou detalhamento técnico indevido.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Usuário final (solicitante) | Ao visualizar um chamado `v2`, consegue ver as etapas, mas não sabe quando uma etapa já concluída foi finalizada | Diário |
| Usuário final (solicitante) | Pode receber ruído visual se o histórico mostrar `Sem data` ou textos equivalentes para etapas ainda não concluídas | Diário |
| Time de engenharia (owners de workflows/requester) | Precisa enriquecer o histórico `v2` com data real sem quebrar a decisão de UX de exibir apenas etapas, nem alterar o comportamento de `legacy` | Contínuo |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | O histórico `v2` deve continuar usando `progress.items` como fonte visual primária | O bloco `Histórico` do `v2` continua exibindo etapas estruturadas (`stepName`, `state`, `isCurrent`) sem renderizar eventos granulares da `timeline` |
| M2 | Etapas `completed` do `v2` podem exibir data de conclusão quando houver correspondência confiável | Para cada etapa `completed`, a UI exibe a data apenas quando existir evento `step_completed` na `timeline` com `details.stepId` igual ao `stepId` da etapa em `progress.items` |
| M3 | Etapas `active` do `v2` devem exibir `Atual`, sem data | A etapa atual aparece destacada visualmente e não mostra `Sem data`, `Não concluída` ou qualquer placeholder equivalente |
| M4 | Etapas `pending` do `v2` devem exibir `Pendente`, sem data | Etapas pendentes aparecem sem data e sem mensagem redundante de não conclusão |
| M5 | O comportamento de `legacy` não deve mudar nesta rodada | Chamados `legacy` continuam usando exclusivamente a `timeline` derivada como fonte do bloco `Histórico`, sem nova lógica de match com `progress` |
| M6 | A ausência de match confiável não deve quebrar a UX | Se uma etapa `completed` do `v2` não encontrar `step_completed` com mesmo `stepId`, a etapa continua renderizada sem data, sem placeholder artificial e sem erro |
| M7 | A cobertura de testes deve incluir o delta funcional e os fluxos críticos do dialog | Existem testes cobrindo data exibida apenas para etapa `completed`, ausência de data para `active`/`pending`, preservação do comportamento `legacy`, erro bloqueante do detalhe `v2` e fechamento do dialog |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | O enriquecimento de data deve usar correspondência estrutural, não heurística textual | O helper usa `progress.stepId` e `timeline.details.stepId` como regra primária de match, sem depender de comparação frouxa por `label` |
| S2 | A timeline do `v2` deve permanecer invisível ao usuário final mesmo quando usada como metadado auxiliar | Nenhum evento técnico (`step_completed`, `entered_step`, `action_requested`) aparece explicitamente no histórico `v2` |
| S3 | A camada requester deve preservar fallback elegante | Quando `details.stepId` não existir ou vier inválido, a UI degrada sem data, mantendo a etapa visível e correta |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Expor futuramente um rótulo mais específico para a data (`Concluída em`) se a UX mostrar necessidade | A data de conclusão pode receber copy mais explícita em iteração posterior, sem alterar a regra de negócio desta rodada |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Mostrar data para etapas `active` usando `entered_step` | A decisão desta rodada é mostrar data apenas para etapas já concluídas |
| W2 | Mostrar mensagens como `Ainda não concluída` ou equivalentes para `active`/`pending` | O estado visual da etapa já comunica isso com menos ruído |
| W3 | Alterar contratos de backend ou schema do read model | O enriquecimento será feito a partir dos dados já disponíveis em `progress` e `timeline` |
| W4 | Mudar o comportamento funcional do histórico `legacy` | Fora do escopo; `legacy` permanece como está |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Data apenas quando semanticamente correta | 100% das datas exibidas no histórico `v2` pertencem a etapas `completed` | Testes validam que somente itens `completed` mostram data, e somente quando há match por `stepId` |
| Zero placeholder artificial no `v2` | 0 ocorrências de `Sem data`, `Não concluída` ou equivalente em etapas `active`/`pending` | Testes de render do histórico `v2` garantem ausência desses textos |
| Compatibilidade `legacy` preservada | 0 regressões funcionais em chamados `legacy` | Testes `legacy` existentes e novos asserts confirmam que a fonte e a renderização permanecem inalteradas |
| UX do dialog protegida | Fluxos críticos continuam cobertos após o ajuste | Testes validam erro bloqueante do `v2` e fechamento do dialog além do caminho feliz |
| Fidelidade à decisão de produto | `v2` continua mostrando etapas, não eventos | Inspeção do componente e testes confirmam que a timeline técnica não aparece na UX final |

## 5. Technical Scope

### Backend (functions/src/, src/app/api/)
| Component | Change Type | Details |
|-----------|------------|---------|
| `GET /api/workflows/read/requests/[requestId]` | None | Continua sendo a fonte do detalhe `v2`; sem mudança contratual |
| Runtime / read model | None | O enriquecimento usa `timeline.details.stepId` e `progress.stepId` já existentes |

### Frontend (src/)
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/requester/presentation/build-requester-history.ts` | Modify | Enriquecer etapas `completed` do `v2` com data derivada de `step_completed` por `stepId`; manter `active`/`pending` sem data |
| `src/components/workflows/requester/RequesterRequestHistory.tsx` | Modify | Renderizar data apenas quando existir `occurredAt`; não mostrar placeholder para itens sem data |
| `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts` | Modify (if needed) | Preservar acesso estruturado a `timeline.details.stepId` para o helper requester |
| `src/lib/workflows/requester/unified-types.ts` | Modify (if needed) | Ajustar tipos caso a camada requester precise carregar `details` estruturado do `v2` |
| `src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx` | Modify | Cobrir data em etapa concluída, ausência de data para `active`/`pending`, erro bloqueante e fechamento do dialog |
| `src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts` | Modify | Validar match por `stepId`, ausência de fallback artificial e preservação do caminho `legacy` |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Sem escopo de IA/Genkit |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| Firestore read models V2 | None | Apenas leitura dos dados já persistidos |
| Estruturas legadas de workflows | None | Sem impacto |

## 6. Auth Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A rota `/solicitacoes` permanece no grupo autenticado `(app)` |
| User Isolation | O enriquecimento de data não amplia a superfície de dados; apenas reaproveita metadados já visíveis ao próprio solicitante |
| Authorization Surface | O modal continua estritamente read-only |
| Input Validation | A camada requester deve tolerar ausência de `details`, ausência de `stepId`, timestamps nulos e ausência de `step_completed` correspondente sem lançar exceções |

## 7. Out of Scope

- Mostrar data para etapas `active` com base em `entered_step`
- Exibir timeline técnica do `v2` ao solicitante
- Reescrever o comportamento do histórico `legacy`
- Alterar backend, endpoint, schema ou regras de acesso
- Introduzir novos CTAs ou mutações de estado no modal requester

## 8. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | O delta é específico: enriquecer data apenas em etapas concluídas do `v2` |
| User identification | 3 | Usuário final e engenharia têm dores e objetivos bem definidos |
| Success criteria measurability | 3 | Há critérios verificáveis por testes de helper e render |
| Technical scope definition | 3 | Arquivos e responsabilidades impactadas estão nomeados explicitamente |
| Edge cases considered | 3 | Match ausente, `active`/`pending`, `legacy`, erro bloqueante e fechamento do dialog foram considerados |
| **TOTAL** | **15/15** | >= 12 — pronto para /design |

## 9. Next Step

Ready for `/design ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES` para detalhar o contrato de match por `stepId`, o formato de apresentação da data de conclusão e a estratégia de testes.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex | Initial define for enriching completed-step dates in the requester V2 history without changing legacy behavior |
