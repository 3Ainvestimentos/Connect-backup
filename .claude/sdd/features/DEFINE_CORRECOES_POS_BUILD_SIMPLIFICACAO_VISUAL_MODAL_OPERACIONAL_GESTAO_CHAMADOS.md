# DEFINE: Correcoes pos-build da simplificacao visual do modal operacional de `/gestao-de-chamados`

> Generated: 2026-04-20
> Status: Ready for /design
> Source: code review da implementacao atual + achados funcionais no modal operacional
> Depends on: `DEFINE_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` e `DESIGN_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Clarity Score: 15/15

## 1. Problem Statement

A rodada de simplificacao visual do modal operacional melhorou a hierarquia geral, mas introduziu dois desalinhamentos: a copy de `Solicitar action` promete destinatarios que o payload real ainda nao consegue informar nesse estado, e os fallbacks de identidade escondem quem realmente esta pendente quando o colaborador nao e resolvido localmente.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Owner do workflow | ao abrir o estado `Solicitar action`, pode ler uma promessa de destinatario especifico que nao existe no payload real antes da abertura do batch | Recorrente em fluxos com action configurada |
| Responsavel atual | em cenarios de action pendente com terceiros, pode perder clareza sobre quem esta bloqueando a continuidade quando o modal colapsa identidades em um fallback generico | Recorrente em fluxos com aprovacao/ciencia/execucao |
| Produto / UX | corre o risco de validar uma copy “boa no fixture” mas incorreta no fluxo real, prejudicando confianca no modal | Pontual nesta rodada, com impacto recorrente |
| Engenharia frontend / read-side | precisa corrigir a discrepancia entre contrato real e copy exibida sem reabrir regras de runtime nem ampliar autorizacao | Pontual nesta rodada |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | O estado `canRequestAction` nao pode depender de `action.recipients` para prometer nomes de destinatarios antes da abertura do batch | Se o payload oficial ainda nao trouxer destinatarios configurados pre-batch, a copy deve permanecer generica e correta, sem listar nomes inventados ou depender de fixtures artificiais |
| M2 | Se a iteracao optar por manter copy nominal no estado pre-request, o contrato oficial deve permitir de forma explicita a exibicao dos destinatarios configurados da etapa antes do `requestAction` | Quando a rodada escolher enrich no read-side em vez de copy apenas generica, o frontend passa a consumir um campo proprio para destinatarios configurados pre-batch, sem inferir a partir de historico de `action.recipients` |
| M3 | Fallbacks de identidade nao podem esconder um `recipientUserId` valido quando o colaborador nao for resolvido localmente | Sempre que existir `recipientUserId` e nao houver nome amigavel disponivel, o modal deve preservar esse identificador visivel em vez de trocar por um rótulo generico |
| M4 | O resumo de pendencia com terceiros nao pode colapsar destinatarios distintos em uma unica identidade generica | A agregacao de pendencias deve deduplicar por identidade estavel (`recipientUserId` ou par `id+label`), nunca apenas pelo label final renderizado |
| M5 | `RequestActionCard` deve continuar sem expor `id3a` cru quando um nome amigavel real estiver disponivel | Quando houver `requestedByName`, `respondedByName` ou mapeamento em `collaborators`, a UI continua preferindo o nome humano |
| M6 | O comportamento corrigido deve continuar respeitando o contrato funcional atual de permissions | Nenhuma mudanca pode reabrir regras de `canRequestAction`, `canRespondAction`, `canAdvance`, `canFinalize`, atribuicao ou arquivamento |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | O frontend deve distinguir claramente “destinatarios configurados da etapa” de “recipients do batch atual” | O codigo de view model e de card deixa explicito qual fonte alimenta cada copy, reduzindo risco de drift futuro |
| S2 | A estrategia de fallback deve ficar centralizada e testavel | A resolucao de labels amigaveis/fallbacks fica em helper proprio ou funcao unica, com testes cobrindo nome amigavel, id visivel e caso sem id |
| S3 | O estado de `Solicitar action` deve continuar orientativo mesmo sem nomes disponiveis | A copy generica explica que a acao sera enviada aos destinatarios configurados da etapa sem listar usuarios inexistentes |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | O read-side pode enriquecer o detalhe com labels amigaveis pre-resolvidas para os destinatarios configurados da action | Se isso simplificar o frontend sem ampliar contrato indevidamente, o payload pode trazer labels prontas para consumo |
| C2 | O modal pode separar visualmente “destinatarios configurados” de “respondentes do batch atual” | Caso ajude a leitura, a UI pode usar copy levemente distinta entre pre-abertura e pos-abertura da action |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Alterar runtime de `requestAction`, `respondAction`, `advance` ou `finalize` | Fora do problema identificado; os achados sao de contrato/copy e fallback visual |
| W2 | Reabrir a simplificacao visual ampla do modal ou sua hierarquia de secoes | Fora do escopo; o alvo desta iteracao e corrigir fidelidade do estado da action |
| W3 | Introduzir novos papeis, novas permissoes ou nova authz no cliente | O frontend continua consumindo apenas o contrato oficial |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Copy pre-request correta | Em `canRequestAction`, a UI nao promete nomes inexistentes se o payload real nao os tiver | Teste unitario do view model + teste de componente com `recipients = []`, cobrindo tanto a queda para copy generica quanto o uso do enrich oficial quando ele existir |
| Identidade preservada | Quando nao houver nome amigavel, um `recipientUserId` valido continua visivel | Teste unitario dos helpers de label/fallback + teste do card |
| Sem colapso indevido de terceiros | Dois destinatarios distintos nao se tornam um unico “Colaborador configurado” | Teste do view model/summary de pendencias com dois ids nao resolvidos |
| Preferencia por nome humano preservada | Quando houver nome amigavel disponivel, o modal continua escondendo ids tecnicos | Teste do card com `collaborators` ou `respondedByName/requestedByName` |
| Sem regressao funcional | RequestAction/RespondAction e demais CTAs continuam com os mesmos gates atuais | Reexecucao da suite focal do modal operacional |

## 5. Technical Scope

### Backend / Runtime
| Component | Change Type | Details |
|-----------|------------|---------|
| Use cases de runtime (`request-action`, `respond-action`, `advance-step`, `finalize-request`) | None by default | Nenhuma mudanca deliberada de regra funcional |

### Read Side / Contract
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/read/detail.ts` | Optional modify | Se a rodada escolher enrich estrutural em vez de copy apenas generica, expor destinatarios configurados da action antes da abertura do batch em campo proprio e semanticamente distinto de `action.recipients` |
| tipos do detalhe (`src/lib/workflows/read/types.ts` e espelhos de management, se necessario) | Optional modify | Se houver enrich pre-batch, tipar explicitamente a nova fonte de destinatarios configurados |
| `src/lib/workflows/management/api-client.ts` / tipos de management | Optional modify | Propagar eventual enrich do payload oficial, sem inferencia local |

### Frontend
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/management/request-detail-view-model.ts` | Modify | Remover dependencia incorreta de `action.recipients` no estado `canRequestAction`; consumir campo oficial pre-batch se existir ou cair para copy generica |
| `src/components/workflows/management/RequestActionCard.tsx` | Modify | Ajustar fallback de identidade para preservar `recipientUserId` quando nao houver nome amigavel; manter preferencia por nomes humanos quando disponiveis |
| helpers de resolucao de labels do modal operacional | Modify / extract | Centralizar fallback e evitar deduplicacao por label generico |

### Tests
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | Modify / Add | Cobrir `canRequestAction` real com `action.recipients = []`, sem prometer nomes especificos |
| `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` | Modify / Add | Cobrir fallback para nome amigavel, fallback para `recipientUserId` e ausencia de colapso indevido em labels genericos |
| `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Optional modify | Se a copy de topo mudar, validar a mensagem correta nos cenarios de pendencia com terceiros e `Solicitar action` |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Fora do escopo |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| Firestore schema | None | Nenhuma migracao, indice ou mudanca estrutural requerida |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | Permanece o fluxo atual da area autenticada de management |
| Authorization | Nenhuma nova permissao pode ser inferida localmente; a iteracao corrige apenas copy, enrich de leitura e fallback visual |
| User Isolation | A exibicao de destinatarios continua limitada ao que o payload oficial ja permite ler no detalhe do chamado |
| Data Handling | Se houver enrich pre-batch, ele deve derivar apenas de configuracao da etapa ja acessivel ao ator autenticado no detalhe oficial |

## 7. Out of Scope

- criar nova rota ou endpoint apenas para listar destinatarios da action;
- alterar regras de negocio de quem pode solicitar ou responder uma action;
- redesenhar novamente o modal operacional;
- resolver problemas de typecheck global fora da superficie do modal;
- rever copy de outras telas como requester ou historico admin.

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DEFINE_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `DESIGN_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| Payload oficial de detalhe de management | Internal | Ready, but possibly insufficient for named pre-batch recipients |
| Suite focal do modal operacional | Internal | Ready |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Os dois achados estao delimitados como problema de fidelidade entre payload real, copy e fallback de identidade, com caminho minimo e caminho estrutural explicitados |
| User identification | 3 | Owner, responsavel, produto e engenharia foram mapeados com dores concretas |
| Success criteria measurability | 3 | Os criterios se traduzem em copy correta, fallback visivel e testes objetivos |
| Technical scope definition | 3 | O escopo esta concentrado em read-side opcional, view model, card e testes |
| Edge cases considered | 3 | Foram considerados pre-batch sem recipients, terceiros nao resolvidos, nomes amigaveis disponiveis e deduplicacao incorreta |
| **TOTAL** | **15/15** | >= 12 - pronto para /design |

## 10. Next Step

Ready for `/design CORRECOES_POS_BUILD_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS` para detalhar:

- se o enrich de destinatarios pre-batch sera feito no read-side ou se a copy permanecera generica nesta rodada;
- qual helper central de fallback de identidade sera adotado;
- como separar semanticamente `destinatarios configurados da etapa` de `recipients do batch atual`;
- quais testes serao atualizados/adicionados para blindar os dois achados.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-04-20 | iterate-agent | Clarified that M2 is a conditional contract requirement only when the iteration chooses named pre-request copy via read-side enrich; expanded success criteria and technical scope wording to preserve the generic-copy fallback path as valid minimum correction |
| 1.0 | 2026-04-20 | Codex (`define` skill) | Initial define for post-build corrections after the visual simplification of the operational management modal, focusing on pre-request recipient copy fidelity and identity fallback preservation |
