# DEFINE: Correções pós-build da Fase 2B.1 - Catálogo e abertura de chamados v2

> Generated: 2026-04-10
> Status: Ready for /design
> Scope: Ajustes de robustez, UX e consistência após a primeira implementação da `2B.1`
> Base design: `DESIGN_FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2.md`
> Clarity Score: 13/15

## 1. Problem Statement

A implementação inicial da `2B.1` já abre chamados ponta a ponta, mas ainda tem inconsistências de UX, origem de dado do solicitante e comportamento de cache que precisam ser corrigidas antes de considerar a subetapa realmente fechada.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Solicitante final | Após enviar a solicitação com sucesso, o modal pode permanecer aberto e dar sensação de fluxo incompleto ou risco de reenvio | Sempre que abrir chamado |
| Solicitante final | O nome persistido no request pode divergir do nome operacional do colaborador se vier do `displayName` do Google | Sempre que abrir chamado |
| Time de produto / engenharia | A implementação faz refetch do catálogo após abertura, apesar de o catálogo não mudar com essa ação | Sempre que o fluxo for usado |
| Time de engenharia | A entrega inicial não traz cobertura mínima de regressão para o fluxo principal da 2B.1 | Sempre que houver manutenção ou correção futura |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Fechamento correto do fluxo de sucesso | Após `openRequest` com sucesso, o modal de submissão fecha automaticamente, o contexto local é limpo (`selectedWorkflow`, `selectedArea`) e o usuário não permanece em estado que permita reenvio acidental |
| M2 | `requesterName` canônico do colaborador | O payload enviado pela 2B.1 usa `currentUserCollab.name` como origem principal de `requesterName`; o backend só usa fallback canônico já existente quando esse valor vier vazio |
| M3 | Remover invalidação desnecessária do catálogo | A mutation de abertura não invalida mais a query do catálogo requester após sucesso, já que a abertura do request não altera as áreas nem os workflows disponíveis |
| M4 | Preservar compatibilidade do fluxo atual | As correções não alteram o contrato do catálogo, não mudam a rota `/solicitacoes` e não introduzem dependência nova em `ApplicationsContext` ou `WorkflowsContext` |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Cobertura mínima do fluxo principal | Existem testes focados cobrindo ao menos: fechamento do modal no sucesso, uso de `currentUserCollab.name` no payload e ausência de invalidação indevida do catálogo |
| S2 | Feedback de sucesso continua claro | O toast de sucesso permanece visível mesmo após o fechamento automático do modal |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Endurecer validação do formulário dinâmico | Se houver baixo custo, parte das validações hoje feitas manualmente pode migrar para um padrão mais próximo de RHF + schema, sem reabrir a arquitetura da 2B.1 |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Trocar o endpoint compartilhado `GET /api/workflows/catalog/[workflowTypeId]` por um namespace requester específico | Não é bloqueante para a 2B.1 e reabriria uma discussão arquitetural desnecessária neste momento |
| W2 | Refatorar amplamente o modal de submissão para Zod/RHF dinâmico completo | Pode ser uma melhoria posterior; não é necessária para corrigir os findings principais desta iteração |
| W3 | Incluir limpeza de arquivos de ferramenta/editor no escopo | O arquivo `.qwen/settings.json` fica explicitamente fora deste define por decisão do solicitante |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Fluxo de sucesso está íntegro | 100% das aberturas bem-sucedidas fecham o modal e limpam o contexto local | Teste de componente + smoke manual |
| Nome do solicitante está consistente | 100% dos requests abertos pela 2B.1 persistem `requesterName` coerente com o colaborador operacional | Inspeção de payload/mocks em teste + verificação manual de request criado |
| Sem refetch desnecessário do catálogo | Abertura de request não dispara nova consulta do catálogo requester | Teste do hook/mutation ou inspeção direta da query invalidada |
| Regressão controlada | Pelo menos uma suíte de teste cobre os comportamentos corrigidos | Execução de teste focado no build da 2B.1 |

## 5. Technical Scope

### Frontend

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/requester/RequestsV2Page.tsx` | Modify | Fechar o modal no sucesso, limpar seleção e manter toast de sucesso |
| `src/components/workflows/requester/WorkflowSubmissionModal.tsx` | Modify | Enviar `requesterName` a partir do nome operacional do colaborador, não do `displayName` do Google |
| `src/hooks/use-requester-workflows.ts` | Modify | Remover `invalidateQueries` do catálogo após `openRequest` bem-sucedido |

### Tests

| Component | Change Type | Details |
|-----------|------------|---------|
| Testes requester 2B.1 | Create/Modify | Cobrir fechamento do modal, uso de nome canônico e ausência de invalidação do catálogo |

### Backend / API

| Component | Change Type | Details |
|-----------|------------|---------|
| `POST /api/workflows/runtime/requests` | None | O fallback server-side existente para `requesterName` permanece válido; não é necessário alterar contrato da rota |

### Database

| Model | Change Type | Details |
|-------|------------|---------|
| `workflows_v2` | None | Nenhuma mudança de schema; apenas correção da origem do valor enviado para `requesterName` |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| AI services | None | Sem escopo de IA/Genkit |

## 6. Auth Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | O fluxo continua dependente de usuário autenticado dentro de `(app)` |
| User identity | O nome do solicitante no payload deve ser derivado do colaborador operacional reconciliado (`currentUserCollab.name`) |
| Fallback safety | Se `currentUserCollab.name` estiver ausente, o backend continua autorizado a usar o fallback canônico já existente (`actor.actorName`) |
| User isolation | As correções não alteram o modelo de acesso do catálogo nem a autorização de abertura do runtime |

## 7. Out of Scope

- Refatorar o contrato do endpoint de metadata publicada
- Reestruturar o renderer dinâmico
- Adicionar `Minhas Solicitações` ou qualquer item da `2B.2`
- Revisar profundamente a estratégia de validação dinâmica além do necessário para os findings principais
- Limpeza do arquivo `.qwen/settings.json`

## 8. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Os problemas estão concretos: fluxo de sucesso, nome do solicitante, cache e cobertura |
| User identification | 2 | Usuários e mantenedores afetados estão claros, ainda que o escopo seja mais técnico do que de produto |
| Success criteria measurability | 3 | Critérios objetivos e facilmente verificáveis via teste e smoke |
| Technical scope definition | 3 | Arquivos e responsabilidades afetadas estão bem delimitados |
| Edge cases considered | 2 | Fallback de identidade e preservação do toast foram contemplados; não reabre arquitetura maior |
| **TOTAL** | **13/15** | Suficiente para prosseguir ao `/design` |

## 9. Findings Triage

| Finding | Decision in this define | Rationale |
|---------|-------------------------|-----------|
| Modal não fecha após sucesso | Included | Impacta o fluxo principal do solicitante e precisa correção imediata |
| `requesterName` vindo de `user.displayName` | Included | Precisa alinhar a origem do nome ao colaborador operacional canônico |
| `invalidateQueries` do catálogo após abertura | Included | É custo desnecessário e simples de remover nesta iteração |
| Sem testes para a 2B.1 | Included as SHOULD | Vale elevar a segurança da subetapa, mas sem transformar testes em bloqueio de escopo |
| Validação manual em vez de RHF/Zod | Deferred / COULD | É dívida técnica real, mas não precisa ser resolvida integralmente para fechar os findings principais |
| Uso de `/api/workflows/catalog/[workflowTypeId]` pelo requester | Accepted for now / WON'T | Observação arquitetural não bloqueante para a 2B.1; evitar duplicação prematura |
| `.qwen/settings.json` staged | Explicitly excluded | Fora do escopo por decisão do solicitante |

## 10. Next Step

Ready for `/design CORRECOES_POS_BUILD_FASE2B_1_CATALOGO_ABERTURA_CHAMADOS_V2` to detalhar a solução técnica e a estratégia de testes dessas correções.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-10 | Codex (`define` skill) | Initial requirements for the relevant 2B.1 post-build findings, excluding `.qwen/settings.json` cleanup |
