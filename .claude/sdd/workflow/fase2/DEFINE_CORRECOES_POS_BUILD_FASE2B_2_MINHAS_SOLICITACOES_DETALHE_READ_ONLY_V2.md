# DEFINE: Correções pós-build da Fase 2B.2 - Minhas Solicitações e detalhe read-only v2

> Generated: 2026-04-10
> Status: Ready for /design
> Scope: Ajustes de fidelidade funcional, acessibilidade e cobertura da `2B.2`
> Base design: `DESIGN_FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2.md`
> Clarity Score: 14/15

## 1. Problem Statement

A implementação inicial da `2B.2` já entrega a superfície de `Minhas Solicitações` e o detalhe read-only, mas ainda diverge do design em pontos importantes de fidelidade da tabela, comportamento do dialog e legibilidade da informação exibida ao solicitante.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Solicitante final | A coluna `Status` não mostra mais o nome real da etapa/status do request e vira um rótulo genérico, reduzindo a utilidade da tabela para acompanhamento | Sempre que consultar `Minhas Solicitações` |
| Solicitante final | O campo `Aberto em` mostra `areaId` técnico em vez de nome amigável da área | Sempre que abrir o detalhe |
| Solicitante final | O botão do olho não tem `aria-label`, o que prejudica uso com leitor de tela e navegação assistiva | Sempre que usar a tabela |
| Solicitante final | Em erro/refetch do detalhe, o dialog pode perder o último conteúdo válido e mostrar apenas alerta, apesar do design prever erro não bloqueante | Ocasional, mas crítico para confiança da UI |
| Time de engenharia | A cobertura atual valida os componentes isolados, mas não cobre a integração da `RequestsV2Page` com a nova seção e o dialog da `2B.2` | Sempre que houver manutenção ou regressão futura |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Restaurar o rótulo real da coluna `Status` | A tabela `Minhas Solicitações` volta a renderizar o nome real do andamento (`currentStepName` ou equivalente oficial do read model), em vez de rótulos genéricos derivados só de `statusCategory` |
| M2 | Exibir label amigável em `Aberto em` | O header do dialog mostra nome legível da área quando houver mapa de áreas no cliente; `areaId` cru só é usado como fallback |
| M3 | Tornar o botão do olho acessível | O botão de detalhe possui `aria-label` claro e o teste deixa de depender de `name: ''` |
| M4 | Preservar último detalhe válido em erro não bloqueante | Em caso de erro/refetch após uma leitura bem-sucedida, o dialog mantém o último conteúdo renderizado e exibe o alerta sem apagar o detalhe anterior |
| M5 | Preservar contrato read-only | As correções não introduzem CTAs operacionais nem alteram o uso dos endpoints existentes (`read/mine` e `read/requests/[requestId]`) |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Cobertura de integração da página requester | Existe teste em `RequestsV2Page` cobrindo ao menos: render da seção `Minhas Solicitações`, clique no botão do olho, abertura do dialog e limpeza de `selectedRequestId` ao fechar |
| S2 | Dialog sem warning estrutural de acessibilidade | O shell do detalhe não emite warning de `DialogContent` sem descrição durante os testes focados da `2B.2` |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Reduzir fragilidade dos adapters de tipagem | Se houver baixo custo, os adapters `as unknown as` podem ser substituídos por tipagem mais explícita ou helper mais seguro, sem reabrir a arquitetura do dialog |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Criar endpoint requester-specific para o detalhe | O endpoint atual já atende a superfície read-only e a autorização existente é suficiente para leitura do próprio request |
| W2 | Refatorar profundamente os componentes de `management/` reutilizados | O objetivo desta iteração é corrigir a superfície requester, não reabrir os blocos compartilhados |
| W3 | Reestruturar a política completa de cache do requester além do detalhe | O foco corretivo é o comportamento do dialog e a fidelidade da tabela |
| W4 | Tratar como bug a autorização do endpoint de detalhe | A análise do backend mostrou que `assertCanReadRequest(...)` já restringe leitura a owner/requester/responsável/participantes operacionais; isso não entra como finding desta microetapa |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Tabela reflete o andamento real | 100% dos itens renderizam o nome oficial de etapa/status exposto pelo read model | Teste de componente + smoke manual |
| Header do detalhe fica legível | `Aberto em` mostra label amigável da área quando possível | Teste de componente + inspeção manual |
| Acessibilidade mínima do CTA de detalhe | Botão do olho é encontrável por label acessível | Teste de componente |
| Erro não bloqueante preserva contexto | Em falha após sucesso anterior, o dialog mantém o último detalhe válido e mostra alerta | Teste do hook/dialog |
| Cobertura de integração existe | Pelo menos uma suíte cobre a integração da `RequestsV2Page` com `MyRequestsV2Section` e `MyRequestDetailDialog` | Execução de testes focados |

## 5. Technical Scope

### Frontend

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/requester/MyRequestsV2Section.tsx` | Modify | Restaurar `currentStepName` (ou equivalente oficial) na coluna `Status` e adicionar `aria-label` ao botão do olho |
| `src/components/workflows/requester/RequesterRequestSummaryHeader.tsx` | Modify | Receber/renderizar label amigável para `Aberto em`, com fallback para `areaId` |
| `src/components/workflows/requester/MyRequestDetailDialog.tsx` | Modify | Ajustar shell read-only para manter último detalhe válido em erro/refetch e incluir descrição acessível do dialog se necessário |
| `src/components/workflows/requester/RequestsV2Page.tsx` | Modify | Passar mapa/label de áreas para o dialog/header e controlar o fluxo do detalhe para testes de integração |

### State / Hooks

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/hooks/use-requester-workflows.ts` | Modify | Ajustar `useRequestDetail()` para preservar o último dado válido em cenários de erro/refetch |

### Tests

| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx` | Modify | Cobrir status real, `aria-label` do olho e eventual label amigável da área se testado no header |
| `src/components/workflows/requester/__tests__/MyRequestDetailDialog.test.tsx` | Modify | Cobrir preservação do último dado válido e ausência de warning estrutural do dialog |
| `src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx` | Modify | Cobrir render da seção, abertura do dialog via olho e limpeza do estado ao fechar |

### Backend / API

| Component | Change Type | Details |
|-----------|------------|---------|
| `GET /api/workflows/read/mine` | None | Mantém contrato atual; a correção é de apresentação/integração no requester |
| `GET /api/workflows/read/requests/[requestId]` | None | Mantém contrato atual; a autorização já é tratada por `assertCanReadRequest(...)` |

### Database

| Model | Change Type | Details |
|-------|------------|---------|
| `workflows_v2` | None | Nenhuma mudança de schema |
| `workflowAreas` | None | Apenas eventual reaproveitamento do catálogo já carregado para exibir label amigável da área |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| AI services | None | Sem escopo de IA/Genkit |

## 6. Auth Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A `2B.2` continua dependente de usuário autenticado dentro de `(app)` |
| Request isolation | O detalhe continua usando o endpoint oficial, que já valida leitura com `assertCanReadRequest(request, actorUserId)` |
| Read-only guarantee | O frontend requester continua ignorando `permissions` operacionais e não renderiza CTAs |
| Identity mapping | Labels amigáveis exibidas no dialog podem reutilizar o catálogo/áreas já carregados no requester; não exigem novas permissões |

## 7. Findings Triage

| Finding | Decision in this define | Rationale |
|---------|-------------------------|-----------|
| Coluna `Status` com rótulos genéricos | Included | Divergência funcional direta em relação ao design e à tela legada |
| `Aberto em` mostrando `areaId` cru | Included | Bug de apresentação já confirmado no código e no teste |
| Botão do olho sem `aria-label` | Included | Ajuste pequeno e importante de acessibilidade |
| Último detalhe válido não preservado em erro/refetch | Included | Divergência explícita do design da `2B.2` |
| Testes de integração ausentes em `RequestsV2Page` | Included as SHOULD | Aumenta confiança na subetapa sem reabrir arquitetura |
| Warning de `DialogContent` sem descrição | Included as SHOULD | Melhora acessibilidade e reduz ruído na suíte |
| Adapters `as unknown as` | Deferred / COULD | É fragilidade real, mas não bloqueia o uso da `2B.2` nesta rodada corretiva |
| Risco de autorização ampla no endpoint de detalhe | Rejected | A análise do backend mostrou que a leitura já é escopo-limitada por `assertCanReadRequest(...)` |

## 8. Out of Scope

- Criar endpoints novos para requester
- Refatorar o read model backend
- Alterar o contrato de `WorkflowRequestDetailData`
- Reescrever os componentes de `management/` reutilizados
- Resolver issues de mock global/Jest não diretamente ligadas à lógica da `2B.2`

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Os gaps estão concretos: tabela, dialog, acessibilidade e cobertura |
| User identification | 3 | O solicitante final e o time de engenharia afetados estão claros |
| Success criteria measurability | 3 | Critérios testáveis por componente, hook e smoke manual |
| Technical scope definition | 3 | Arquivos e responsabilidades afetadas estão delimitados |
| Edge cases considered | 2 | Erro não bloqueante, fallback de área e garantia read-only foram cobertos |
| **TOTAL** | **14/15** | Suficiente para prosseguir ao `/design` |

## 10. Next Step

Ready for `/design CORRECOES_POS_BUILD_FASE2B_2_MINHAS_SOLICITACOES_DETALHE_READ_ONLY_V2` to detalhar a solução técnica e a estratégia de testes dessas correções.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-10 | Codex (`define` skill) | Initial requirements for the relevant 2B.2 post-build findings and triage of additional review notes |
