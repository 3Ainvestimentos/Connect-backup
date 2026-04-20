# DEFINE: Simplificacao visual do modal operacional de `/gestao-de-chamados`

> Generated: 2026-04-20
> Status: Ready for /design
> Source: direct request + varredura tecnica do modal operacional atual
> Clarity Score: 15/15

## 1. Problem Statement

O modal operacional de `/gestao-de-chamados` ja esta funcional, mas ainda apresenta densidade visual excessiva, textos ruidosos e falta de acentuacao, o que prejudica a leitura sem adicionar valor ao fluxo operacional.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Owner do workflow | precisa operar o chamado, mas encontra excesso de blocos explicativos e pouca hierarquia visual para CTAs criticos como `Avancar etapa` e `Finalizar chamado` | Diario |
| Responsavel atual / executor | consegue executar as acoes, mas o modal parece carregado, com informacoes acessorias e tags que competem com a tarefa principal | Diario |
| Produto / UX | precisa reduzir ruido visual sem perder o comportamento operacional ja validado | Pontual nesta rodada, com impacto recorrente |
| Engenharia frontend | precisa simplificar layout e copy sem alterar contratos, runtime, permissoes, handlers ou mecanismos de action | Pontual nesta rodada |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | O `Resumo do chamado` deve ocupar largura total no topo do corpo do modal | O resumo deixa de compartilhar a primeira linha com a macrozona operacional e passa a renderizar em linha inteira, sem alterar os metadados oficiais exibidos |
| M2 | A zona `Acao atual` deve funcionar como macrozona-orquestradora da execucao | `Acao atual` permanece como container principal da execucao do chamado, mas com hierarquia mais curta, copy introdutoria breve e sem descricao longa ou `statusNote` |
| M3 | Os subblocos operacionais dentro de `Acao atual` devem ser dinamicos por contexto | Continuidade oficial, `Action da etapa` e `Administracao do chamado` so aparecem quando o estado do chamado, a etapa atual e `detail.permissions` justificarem sua exibicao |
| M4 | Os CTAs de continuidade oficial devem permanecer visiveis e com maior destaque quando aplicaveis | `Avancar etapa` e `Finalizar chamado` continuam disponiveis quando `permissions.canAdvance` ou `permissions.canFinalize` forem verdadeiros, sem regressao de handler, disabled state ou busy label |
| M5 | O bloco equivalente ao `RequestOperationalHero` deve ser reduzido ou absorvido pela macrozona `Acao atual` sem perder o CTA principal | O modal deixa de exibir um card grande e redundante de “Estado atual e proximo passo”; a indicacao operacional passa a ser mais compacta, integrada e contextual |
| M6 | `Action da etapa` deve permanecer funcional, mas aparecer apenas quando relevante para o momento atual | A secao continua permitindo `requestAction`/`respondAction`, incluindo comentario e anexo quando aplicavel, remove badges ruidosos como `Batch concluido` e `Comentario obrigatorio`, traduz `execution` para `Execucao`, preserva a obrigatoriedade apenas em `*`, placeholder e disabled do CTA e nao ocupa espaco quando nao houver action aplicavel para o ator autenticado |
| M7 | `Administracao do chamado` deve permanecer funcional e aparecer apenas quando aplicavel | A secao continua permitindo atribuicao/reatribuicao de responsavel e arquivamento quando `detail.permissions` autorizarem, sem ser removida nem ocupar espaco quando o ator autenticado nao puder administrar o chamado |
| M8 | A macrozona `Acao atual` deve exibir estados informativos read-only quando houver pendencia operacional pertencente a terceiros | Quando existir um proximo passo real no fluxo, mas o ator autenticado nao puder executa-lo, o modal nao pode esconder o contexto: deve informar o que esta pendente, com quem esta pendente e, quando o payload existente permitir, desde quando ou em qual etapa |
| M9 | Pendencias de `Action da etapa` pertencentes a terceiros devem ser sinalizadas explicitamente | Se houver `action` pendente e o ator autenticado nao for elegivel para `respondAction`, a macrozona deve exibir um estado informativo como “Acao pendente com ...”, listando o usuario ou usuarios elegiveis quando essa informacao estiver disponivel no detalhe atual, sem exibir CTA indevido |
| M10 | Chamados em andamento com responsavel atual diferente do ator autenticado devem ser sinalizados explicitamente | Quando o chamado estiver em andamento com um responsavel definido e o ator autenticado nao for esse executor atual, a macrozona deve informar com quem o chamado esta e que a atuacao segue aguardando esse responsavel, sem reintroduzir CTAs indevidos |
| M11 | `Historico do chamado` deve virar uma secao colapsavel de nivel superior | O historico continua acessivel e completo, mas inicia recolhido para reduzir poluicao visual, preservando eventos, comentarios e anexos das acoes por etapa |
| M12 | `Dados enviados` deve virar uma secao colapsavel de nivel superior | A secao continua exibindo campos e anexos da abertura, preservando ordem canonica, CTA `Ver anexo` e comportamento atual |
| M13 | `Historico do chamado` e `Dados enviados` devem dividir a mesma faixa horizontal quando houver largura suficiente | Em larguras desktop/tablet grande, as duas secoes passam a ser exibidas lado a lado para reduzir extensao vertical do modal; em larguras menores, a composicao pode empilhar sem perder usabilidade |
| M14 | A copy do modal deve ser corrigida para PT-BR com acentuacao adequada | Textos visiveis do modal, incluindo titulos, descricoes, labels auxiliares e badges remanescentes, deixam de exibir formas sem acento como `Acao`, `Comentario`, `Historico`, `proximo`, `concluido` |
| M15 | A rodada deve preservar integralmente os mecanismos funcionais ja validados | Apos a alteracao, o modal continua permitindo avancar, finalizar, solicitar action, responder action, atribuir/reatribuir responsavel, arquivar quando autorizado, ver dados enviados, abrir anexos na ordem correta e ver comentarios/anexos das actions no historico sem mudar contrato ou runtime |
| M16 | Ao solicitar uma `Action da etapa`, o modal deve explicitar quem recebera a solicitacao | Quando houver CTA de `Solicitar`, a interface deve informar claramente para quem a solicitacao sera enviada antes da submissao, resolvendo qualquer `id3a` interno para o nome amigavel do colaborador na tabela `collaborators`; o `id3a` cru nao deve ser exibido ao usuario final |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | A zona operacional deve evitar “bloco dentro de bloco” | A estrutura de `Acao atual` fica visualmente mais rasa, com menos cards empilhados e mais foco no proximo passo real |
| S2 | A macrozona `Acao atual` deve explicar o contexto sem depender de tres blocos fixos | O usuario entende o que pode fazer agora mesmo quando apenas um dos subblocos dinamicos estiver visivel |
| S3 | O resumo deve reduzir quebras de linha desnecessarias | Campos como `Owner`, `Area`, `Solicitante`, `Responsavel` e datas devem ganhar mais legibilidade no novo arranjo full-width |
| S4 | As secoes colapsaveis devem continuar previsiveis em desktop e mobile | `Historico do chamado` e `Dados enviados` devem poder ser expandidos/recolhidos sem esconder permanentemente informacao nem prejudicar navegacao |
| S5 | A divisao lateral das secoes inferiores deve reduzir a sensacao de modal excessivamente comprido | Em viewports largas, a area inferior aproveita melhor a largura do modal e reduz scroll vertical desnecessario |
| S6 | Textos auxiliares devem ser encurtados sem perder orientacao | Onde houver copy de apoio, ela deve orientar a acao do usuario e nao repetir explicacoes longas sobre o payload oficial |
| S7 | Estados pendentes de terceiros devem continuar compreensiveis mesmo sem CTA para o ator atual | O usuario entende com quem o chamado ou a action esta pendente e por que ele nao consegue agir naquele momento |
| S8 | O destinatario da solicitacao deve ficar claro antes do envio | O usuario entende para qual colaborador a `Action da etapa` sera encaminhada, sem precisar inferir a partir de ids tecnicos |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Ajustar badges remanescentes para uma taxonomia mais limpa em PT-BR | Caso ainda existam badges necessarios, eles podem ser reduzidos a um conjunto menor e mais legivel |
| C2 | Reaproveitar componentes existentes de acordeao do projeto para as secoes colapsaveis | A implementacao pode reutilizar primitives ja presentes no modal para manter consistencia visual e minimizar codigo novo |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Alterar runtime, contratos de API ou regras de permissao | Fora do objetivo; esta rodada e estritamente de UI/UX e copy |
| W2 | Alterar o shape de `WorkflowManagementRequestDetailData`, `permissions`, `action`, `progress` ou `stepsHistory` | Nao necessario para o redesenho visual |
| W3 | Reabrir regras de `advance`, `finalize`, `requestAction`, `respondAction`, atribuicao ou arquivamento | Os mecanismos atuais ja estao funcionais e devem ser preservados |
| W4 | Mudar agrupamento funcional do historico por etapa ou a ordem canonica dos dados enviados | Fora do escopo e de risco desnecessario |
| W5 | Introduzir novas capabilities, novos CTAs ou novo comportamento condicional no modal | O objetivo e simplificar apresentacao, nao ampliar fluxo |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Resumo full-width | `Resumo do chamado` ocupa largura total no topo do body | Inspecao visual + teste de estrutura/render do dialog |
| Macrozona dinamica preservada | `Acao atual` continua sendo a zona principal da execucao, mas rende apenas os subblocos aplicaveis ao momento atual | Testes de `RequestDetailDialog` com cenarios distintos de permissions/action/state |
| Hero operacional simplificado | O card grande de “Estado atual e proximo passo” deixa de existir como bloco alto e redundante | Inspecao visual + teste de componente/dialog |
| CTA principal preservado | `Avancar etapa` e `Finalizar chamado` continuam aparecendo e funcionando nos mesmos gates quando aplicaveis | Testes de `RequestDetailDialog` e/ou componente operacional |
| `Action da etapa` dinamica | A secao so aparece quando houver action configurada/relevante, sem regressao em comentario, anexo e resposta | Testes de `RequestDetailDialog` e `RequestActionCard` |
| Pendencias de terceiros visiveis | Quando a proxima acao real pertencer a outro usuario, a macrozona continua explicando o estado atual em modo read-only | Testes de `RequestDetailDialog` com cenarios `action pending / actor not eligible`, `in progress / actor not assignee` e equivalentes |
| Ruidos removidos | `Batch concluido` e `Comentario obrigatorio` nao aparecem mais; `execution` passa a `Execucao` | Busca no DOM renderizado + testes de componente |
| Administracao dinamica preservada | `Administracao do chamado` aparece somente quando aplicavel e mantem atribuicao/reatribuicao de responsavel e arquivamento sem regressao | Testes de `RequestDetailDialog` e/ou `RequestAdministrativePanel` com cenarios autorizados e nao autorizados |
| Historico colapsavel | `Historico do chamado` inicia recolhido, mas ao expandir continua exibindo eventos, comentarios e anexos corretamente | Testes de interacao + inspecao visual |
| Dados enviados colapsavel | `Dados enviados` inicia recolhido, mas ao expandir continua exibindo campos/anexos na ordem correta | Testes de interacao + testes existentes do submitted data |
| Secoes inferiores lado a lado | Em viewport larga, `Historico do chamado` e `Dados enviados` compartilham a mesma linha horizontal sem comprimir conteudo critico de forma inadequada | Inspecao visual + teste de estrutura/layout responsivo quando aplicavel |
| PT-BR corrigido | Textos do modal deixam de conter formas sem acentuacao nas superficies alteradas | Busca no DOM renderizado + revisao de copy |
| Mecanismos preservados | Fluxos de avancar, finalizar, solicitar action, responder action, atribuir/reatribuir responsavel, arquivar quando autorizado, abrir anexos e consultar historico continuam intactos | Reexecucao de suite focada do modal operacional |
| Destinatario da solicitacao visivel | Quando existir CTA de `Solicitar`, a tela informa o colaborador destinatario com nome amigavel antes do submit | Testes de `RequestActionCard` / `RequestDetailDialog` com resolucao de `id3a` via `collaborators` e ausencia de `id3a` cru no DOM |

## 5. Technical Scope

### Backend / Runtime
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/workflows/runtime/continuation.ts` | None | Nenhuma alteracao de gates de continuidade |
| use cases `advance-step`, `finalize-request`, `request-action`, `respond-action` | None | Nenhuma alteracao funcional |
| APIs / hooks de management | None | Nenhuma alteracao de contrato, payload ou query |

### Frontend
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | Reorganizar ordem visual: resumo full-width, macrozona `Acao atual` mais enxuta e dinamica, incluindo estados informativos read-only para pendencias pertencentes a terceiros, e composicao inferior com `Historico do chamado` e `Dados enviados` em secoes colapsaveis lado a lado quando houver largura |
| `src/components/workflows/management/RequestOperationalHero.tsx` | Modify | Reduzir ou absorver o hero operacional, removendo descricao longa e `statusNote` como bloco de grande altura, subordinando sua funcao a `Acao atual` e acomodando contexto read-only quando o proximo passo pertencer a terceiros |
| `src/components/workflows/management/RequestActionCard.tsx` | Modify | Limpar badges ruidosos, traduzir labels tecnicos, manter validacoes e handlers atuais e garantir exibicao apenas quando a action for relevante |
| `src/components/workflows/management/RequestActionCard.tsx` | Modify | Exibir o destinatario da solicitacao quando houver CTA de `Solicitar`, resolvendo `id3a` para nome amigavel a partir de `collaborators` sem expor id interno |
| `src/components/workflows/management/RequestAdministrativePanel.tsx` | Modify | Preservar atribuicao/reatribuicao de responsavel e arquivamento na nova hierarquia visual, com copy PT-BR consistente e exibicao apenas quando aplicavel |
| `src/components/workflows/management/RequestSummarySection.tsx` | Modify | Adaptar o resumo para ocupar largura total e reduzir quebras desnecessarias |
| `src/components/workflows/management/RequestStepHistorySection.tsx` | Modify | Encapsular o historico em secao colapsavel de nivel superior, preservando o acordeao por etapa existente |
| `src/components/workflows/management/RequestSubmittedDataSection.tsx` | Modify | Encapsular `Dados enviados` em secao colapsavel de nivel superior, preservando ordem e CTA de anexo |
| `src/components/workflows/management/RequestStepHistoryItem.tsx` | Minor modify | Ajustar copy/acentuacao de labels internas do historico, se necessario |
| `src/lib/workflows/management/request-detail-view-model.ts` | Modify | Enxugar textos do topo operacional, corrigir PT-BR e derivar estados informativos read-only sem alterar gates funcionais |
| `src/contexts/CollaboratorsContext.tsx` ou resolver equivalente ja existente | Reuse | Servir como fonte de resolucao do `id3a` do destinatario da solicitacao para nome amigavel, sem introduzir novo contrato de backend |

### Tests
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify / Add | Cobrir nova hierarquia visual, secoes colapsaveis, dinamismo da macrozona `Acao atual`, estados informativos read-only, composicao inferior compartilhada e preservacao dos CTAs operacionais |
| `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` | Modify / Add | Cobrir remocao/traducao de badges, exibicao condicional e preservacao de disabled states/handlers |
| `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` | Modify / Add | Cobrir exibicao do destinatario resolvido em modo `Solicitar`, ausencia de `id3a` cru no DOM e fallback amigavel se o colaborador nao puder ser resolvido |
| `src/components/workflows/management/__tests__/RequestAdministrativePanel.test.tsx` ou cobertura equivalente | Modify / Add | Cobrir preservacao da administracao do chamado, incluindo atribuicao/reatribuicao, arquivamento e exibicao condicional conforme permissao |
| `src/components/workflows/management/__tests__/RequestStepHistorySection.test.tsx` | Modify / Add | Cobrir secao colapsavel do historico e manutencao do conteudo por etapa |
| `src/components/workflows/management/__tests__/RequestSubmittedDataSection.test.tsx` | Modify / Add | Cobrir secao colapsavel de dados enviados preservando ordem e CTA `Ver anexo` |
| `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx` | Preserve / smoke focused | Garantir que o wiring da pagina com o dialog nao sofreu regressao |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Fora do escopo |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| N/A | None | Nenhuma alteracao de schema, documentos ou indices |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | O modal continua acessivel apenas dentro da rota autenticada `/gestao-de-chamados` |
| Authorization | Nenhuma mudanca em `detail.permissions`; a UI continua refletindo somente os gates oficiais ja calculados pelo payload e usa esses gates para decidir dinamicamente quais subblocos de `Acao atual` devem aparecer |
| User Isolation | Nenhuma ampliacao de visibilidade de dados, historico, comentarios ou anexos |
| Input Validation | Validacoes de comentario, anexo e resposta operacional permanecem exatamente como hoje; a rodada nao altera o criterio de obrigatoriedade |

## 7. Out of Scope

- alterar regras de negocio do fluxo operacional;
- mudar o contrato de detalhe oficial do chamado;
- mudar a forma como `stepsHistory` agrupa eventos e respostas por etapa;
- reintroduzir timeline linear separada do historico por etapa;
- transformar `Historico do chamado` ou `Dados enviados` em superficies independentes fora do modal;
- transformar os tres itens (`Acao atual`, `Action da etapa`, `Administracao do chamado`) em blocos sempre visiveis independentemente do contexto operacional;
- alterar handlers de atribuicao, arquivamento, requestAction, respondAction, advance ou finalize;
- mexer em `/solicitacoes`, requester ou outras superficies de workflow;
- resolver `typecheck` global do repositorio fora da superficie do modal.

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `RequestDetailDialog.tsx` e componentes `management/*` do modal operacional | Internal | Ready |
| `request-detail-view-model.ts` | Internal | Ready |
| Suite atual de testes do modal operacional | Internal | Ready |
| Payload oficial `WorkflowManagementRequestDetailData` | Internal | Ready |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | O problema foi delimitado como densidade visual/copy excessiva sem regressao funcional |
| User identification | 3 | Owners, responsaveis, UX e engenharia foram identificados com dores concretas |
| Success criteria measurability | 3 | Cada objetivo tem efeito observavel por DOM, interacao ou suite dirigida |
| Technical scope definition | 3 | O escopo esta restrito a view-model e componentes visuais do modal operacional |
| Edge cases considered | 5 | Preservacao de CTAs, dinamismo dos subblocos operacionais, actions, pendencias pertencentes a terceiros, chamado em andamento com responsavel atual diferente do ator, composicao lateral das secoes inferiores, historico, anexos, ordem dos dados e PT-BR foi explicitada |
| **TOTAL** | **15/15** | >= 12 - pronto para /design |

## 10. Next Step

Ready for `/design SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS` para detalhar:

- a composicao final do body do modal com resumo full-width;
- a nova estrutura enxuta e dinamica de `Acao atual`, incluindo as regras de exibicao de continuidade oficial, `Action da etapa`, `Administracao do chamado` e estados informativos read-only quando a pendencia pertencer a terceiros;
- a exibicao do destinatario da solicitacao na `Action da etapa`, resolvendo `id3a` para nome amigavel via `collaborators`;
- o comportamento padrao das secoes colapsaveis de `Historico do chamado` e `Dados enviados`, incluindo divisao lateral em viewports largas e empilhamento em viewports menores;
- a estrategia de copy PT-BR completa sem tocar nos mecanismos funcionais;
- a bateria de testes dirigida para garantir ausencia de regressao operacional e cobertura dos estados informativos do fluxo.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-20 | Codex (`define` skill) | Initial define for visual simplification of the operational modal in `/gestao-de-chamados` with explicit preservation of functional mechanisms |
| 1.1 | 2026-04-20 | Codex (`iterate` skill) | Added explicit read-only informational states for pending actions owned by third parties and for in-progress requests owned by a different responsible user, plus corresponding success criteria, scope and test expectations |
| 1.2 | 2026-04-20 | Codex (`iterate` skill) | Added the requirement that request-action recipients must be shown before submit with collaborator-friendly names resolved from `collaborators`, never exposing raw `id3a` values in the modal |
