# DEFINE: Build 2 - Refatoracao do modal operacional de gestao de chamados

> Generated: 2026-04-16
> Status: Approved for design
> Scope: Fase 2 / Build 2 - refatoracao visual e hierarquia operacional do modal em `/gestao-de-chamados`
> Base document: `BRAINSTORM_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Depends on: `DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` e `DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

## 1. Problem Statement

Mesmo com o contrato operacional corrigido no Build 1, o modal oficial de `/gestao-de-chamados` ainda mistura acao da etapa, administracao do chamado e leitura de contexto em uma hierarquia visual fragil, o que dificulta entender rapidamente o proximo passo e mantém o footer como ponto de competicao entre CTAs distintos.

---

## 2. Users

### 2.1. Owner do workflow

Pain points:

- precisa entender de forma imediata se deve solicitar action, avancar, finalizar, reatribuir ou apenas acompanhar o estado;
- hoje encontra essas decisoes espalhadas entre corpo, cards informativos e footer, sem uma leitura operacional dominante;
- corre o risco de interpretar a acao administrativa como prioridade equivalente ao proximo passo do fluxo.

### 2.2. Responsavel atual do chamado

Pain points:

- precisa abrir o modal e identificar rapidamente o que pode fazer agora, sem percorrer varios blocos com o mesmo peso visual;
- depende de uma hierarquia clara entre:
  - contexto do chamado;
  - estado atual da etapa;
  - CTA principal do fluxo;
  - acoes administrativas secundarias;
- sofre mais diretamente com clipping, scroll desconfortavel e footer instavel em janelas menores.

### 2.3. Destinatario de action pendente

Pain points:

- precisa reconhecer de forma inequívoca quando o modal esta pedindo sua resposta, e nao outra acao operacional;
- pode se perder quando o formulario de resposta da action aparece no mesmo nivel visual de comandos administrativos que nao lhe pertencem;
- depende de copy e destaque visual que expliquem o seu papel temporario no fluxo.

### 2.4. Engenharia frontend / manutencao

Pain points:

- precisa reorganizar o shell sem quebrar a entrypoint `RequestDetailDialog` nem reimplementar permissoes no cliente;
- precisa tornar o modal mais legivel preservando os contratos de `canAdvance`, `canFinalize`, `canRequestAction`, `canRespondAction` e `canArchive` estabelecidos no Build 1;
- precisa melhorar layout, scroll e composicao sem abrir uma nova rota nem um segundo detalhe operacional paralelo.

---

## 3. Goals

### MUST

- manter `RequestDetailDialog` como entrypoint publica do detalhe operacional em `/gestao-de-chamados`;
- reorganizar o modal em zonas visuais explicitas, cobrindo no minimo:
  - resumo do chamado;
  - estado atual / proximo passo;
  - action da etapa atual;
  - acoes administrativas;
  - blocos informativos de apoio;
- destacar o proximo passo operacional no corpo do modal, sem depender do `DialogFooter` como superficie principal para `advance`, `finalize`, `requestAction` ou `respondAction`;
- tornar a hierarquia de CTAs condicional ao estado oficial do detalhe:
  - quando houver action pendente para o ator autenticado, a resposta da action deve ser a prioridade visual;
  - quando `canAdvance` estiver disponivel, o CTA de continuidade deve dominar a zona operacional;
  - quando `canFinalize` estiver disponivel, o estado de conclusao deve ficar claro e separado de administracao;
- separar visualmente acoes de fluxo das acoes administrativas do chamado, evitando que `Fechar`, `Arquivar`, atribuicao e CTA principal concorram entre si;
- corrigir a composicao de `DialogContent`, `ScrollArea` e `DialogFooter` para eliminar clipping e manter acessibilidade dos comandos em desktop e mobile;
- revisar copy e destaque visual para que o modal comunique:
  - em que etapa o request esta;
  - se existe acao pendente;
  - quem deve agir agora;
  - qual e o proximo passo natural do fluxo;
- preservar integralmente o contrato funcional do Build 1:
  - nenhuma permissao operacional sera inferida localmente;
  - o frontend continua consumindo o payload oficial do detalhe como fonte de verdade;
  - `respondAction` nao move etapa sozinho;
- manter `RequestActionCard` como parte da experiencia oficial da action da etapa, mas encaixado em uma hierarquia visual superior do modal.

### SHOULD

- reduzir o footer a acoes globais realmente secundarias, como fechar o modal e, quando fizer sentido, administracao de baixo risco;
- extrair subcomponentes visuais do modal se isso ajudar a tornar a hierarquia mais legivel e testavel sem mudar contratos de dados;
- melhorar a leitura inicial do modal acima da dobra em viewport desktop padrao, com contexto, etapa atual e CTA principal visiveis sem depender da timeline;
- tornar mais evidente a diferenca entre:
  - leitura de historico/progresso;
  - operacao da etapa atual;
  - administracao do chamado;
- cobrir a nova hierarquia com testes de componente que validem ordem visual, prioridade de CTA e estabilidade do footer.

### COULD

- adicionar copy curta de orientacao contextual, como "Aguardando sua resposta", "Pronto para avancar" ou "Pronto para concluir", desde que continue dirigida pelo payload oficial;
- introduzir badges ou blocos-resumo de papel do ator atual para reforcar se o usuario esta atuando como owner, responsavel ou destinatario da action;
- agrupar anexos, formulario e timeline em um bloco de apoio com leitura mais progressiva, desde que isso nao esconda a operacao principal.

### WON'T

- nao criar nova rota, novo dialog ou nova entrypoint alem de `RequestDetailDialog`;
- nao alterar runtime, regras de autorizacao, read-side ou endpoints do Build 1 como parte primaria deste build;
- nao reabrir a discussao sobre `canAdvance`, `canFinalize`, `canRequestAction` ou `canRespondAction`;
- nao redesenhar a pagina inteira de `/gestao-de-chamados`, tabs, listas ou filtros fora do detalhe;
- nao introduzir novos status, migracoes de schema ou novas categorias de workflow;
- nao transformar este build em um redesign visual livre desconectado do canon funcional do modal operacional.

---

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|----------------|
| Hierarquia operacional clara | O modal passa a apresentar zona explicita de estado atual/proximo passo antes dos blocos de apoio | Teste de componente + validacao visual |
| CTA principal fora da dependencia do footer | `advance`, `finalize`, `requestAction` e `respondAction` aparecem no corpo do modal conforme o estado, e o footer deixa de ser a superficie primaria dessas acoes | Teste de componente por cenario |
| Separacao entre fluxo e administracao | Acoes administrativas ficam em bloco proprio, distinto do CTA principal do fluxo | Teste de renderizacao + validacao visual |
| Footer estavel | Nenhum CTA essencial fica cortado; o footer permanece acessivel em viewport desktop e mobile representativos | Teste manual responsivo + teste estrutural do componente |
| Prioridade por papel/estado | Owner, responsavel e destinatario de action enxergam uma prioridade operacional coerente com o payload oficial | Testes de componente cobrindo papeis e estados |
| Leitura do proximo passo | Em cenarios de action pendente, action concluida aguardando `advance` e request elegivel a `finalize`, o modal comunica claramente quem deve agir e por que | Testes de componente + validacao manual |
| Contrato funcional preservado | Nenhuma regressao nas permissoes do Build 1 e nenhuma inferencia local nova de elegibilidade | Revisao de codigo + testes existentes/ajustados |

---

## 5. Technical Scope

### Frontend

- refatorar [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) para reorganizar o shell interno do modal por zonas operacionais e reduzir a dependencia de CTAs no footer;
- adaptar [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx) para funcionar como bloco da zona de action, sem competir com a zona de proximo passo ou com a administracao do chamado;
- reavaliar o encaixe visual de [RequestProgress.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestProgress.tsx), [RequestTimeline.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestTimeline.tsx), [RequestFormData.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestFormData.tsx) e [RequestAttachments.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestAttachments.tsx) como blocos informativos secundarios;
- ajustar, se necessario, o uso das primitives em [dialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/dialog.tsx) e [scroll-area.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/scroll-area.tsx) apenas no grau necessario para garantir layout estavel do detalhe operacional;
- preservar o wiring de mutations e refresh em [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) e [use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts), sem expandir o contrato de dados.

### Read Side / Contract

- nenhuma mudanca deliberada de contrato em [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts) ou nos tipos de detalhe, alem de eventuais ajustes cosmeticos de consumo se estritamente necessarios;
- `permissions`, `action`, `progress`, `summary` e `timeline` continuam sendo as fontes oficiais para a composicao do modal;
- o Build 2 consome o contrato corrigido no Build 1, sem reabrir suas regras.

### Backend / Runtime

- nenhuma mudanca de endpoint, use case, autorizacao ou semantica de transicao;
- `advance`, `finalize`, `requestAction`, `respondAction` e `archive` continuam usando o backend oficial existente.

### Database / Firestore

- nenhuma mudanca de schema, colecao, documento, indice ou migracao.

### AI

- fora do escopo.

### Testing

- atualizar [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx) para cobrir a nova hierarquia do modal e a priorizacao dos CTAs por estado;
- criar ou ajustar testes focados na action da etapa atual caso a refatoracao visual torne necessario isolar [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx);
- validar cenarios minimos:
  - owner/responsavel com `canAdvance`;
  - owner/responsavel com `canFinalize`;
  - owner/responsavel com `canRequestAction`;
  - destinatario com `canRespondAction`;
  - request sem acao operacional disponivel;
  - request finalizado com `canArchive`;
- manter os testes existentes do Build 1 como rede de seguranca contra regressao funcional.

---

## 6. Auth Requirements

- a autenticacao continua baseada em Firebase Auth e no fluxo ja usado por `/gestao-de-chamados`;
- nenhuma zona visual do modal pode expor CTA fora do contrato vindo do payload oficial de detalhe;
- o modal deve continuar refletindo isolamento por papel:
  - owner e responsavel atual operam fluxo e administracao conforme permissoes oficiais;
  - destinatario de action enxerga apenas a resposta da action quando aplicavel;
  - usuarios sem permissao operacional continuam sem comandos indevidos;
- ajustes de layout, copy e hierarquia nao podem introduzir bypass visual para acoes nao autorizadas.

---

## 7. Out of Scope

- novas regras de negocio para `advance`, `finalize`, `requestAction`, `respondAction` ou `archive`;
- alteracoes em `/me/tasks`, requester, historico admin ou em outras superficies de workflow;
- redesign da pagina inteira de gestao ou de seus filtros;
- criacao de analytics, tracking ou telemetria novos apenas para o modal;
- reescrita ampla das primitives compartilhadas de dialog alem do necessario para resolver clipping deste fluxo;
- automacoes adicionais de transicao, auto-advance ou novos atalhos de runtime.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| `DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Internal | Ready |
| Contrato oficial de detalhe com `canAdvance` e `canFinalize` | Internal | Must be delivered/stable |
| Entry point `RequestDetailDialog` em `/gestao-de-chamados` | Internal | Ready |
| Componentes auxiliares do detalhe (`RequestActionCard`, `RequestProgress`, `RequestTimeline`, `RequestFormData`, `RequestAttachments`) | Internal | Ready for refactor |

---

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|-------------|-------|
| Problem clarity | 3 | O problema esta delimitado como hierarquia visual e de composicao do modal apos o fechamento funcional do Build 1 |
| User identification | 3 | Owner, responsavel e destinatario de action foram identificados com dores operacionais distintas |
| Success criteria measurability | 3 | Os criterios se traduzem em estrutura renderizada, prioridade de CTA, estabilidade do footer e cenarios testaveis |
| Technical scope definition | 3 | O escopo esta concentrado em componentes reais do modal, com backend explicitamente fora do pacote |
| Edge cases considered | 3 | Foram considerados estados sem acao, action pendente, action concluida, elegibilidade a finalize e request finalizado/arquivado |
| **TOTAL** | **15/15** | Ready for /design |

---

## 10. Next Step

Ready for `/design BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS` para detalhar:

- composicao exata das zonas do modal e sua ordem visual;
- quais CTAs saem do footer e em quais blocos passam a viver;
- estrategia de layout responsivo para `DialogContent`, `ScrollArea` e `DialogFooter`;
- possivel extracao de subcomponentes do shell operacional;
- estrategia de testes de componente para prioridade de CTA, hierarquia e regressao visual funcional.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex (`define` skill) | Initial define for Build 2 of the operational management modal refactor based on the approved brainstorm and Build 1 contract |
