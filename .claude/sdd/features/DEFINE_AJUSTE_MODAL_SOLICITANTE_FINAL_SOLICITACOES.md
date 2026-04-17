# DEFINE: AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES

> Generated: 2026-04-17
> Status: Ready for /design
> Source: BRAINSTORM_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md
> Clarity Score: 15/15

## 1. Problem Statement

O modal de detalhes do solicitante final na rota `/solicitacoes` ainda expõe uma composição visual híbrida entre V2 e componentes de management, em vez de reproduzir o shell legado esperado pelo usuário com um único bloco final de histórico compatível com itens `legacy` e `v2`.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Usuário final (solicitante) | Ao abrir um chamado em `/solicitacoes`, encontra um modal que não segue o layout legado esperado e separa `Timeline` e `Progress`, o que dificulta leitura e confiança no acompanhamento | Diário |
| Usuário final (solicitante) | Chamados `legacy` e `v2` precisam aparecer com a mesma experiência visual final, sem exigir interpretação diferente por origem | Diário |
| Time de engenharia (owners de workflows/requester) | O dialog atual mistura adaptação de dados com renderização de blocos reutilizados de management, o que aumenta risco de regressão visual e dificulta testes objetivos da UX final | Contínuo |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | O modal do solicitante final em `/solicitacoes` deve manter compatibilidade funcional com itens `legacy` e `v2` usando um único shell visual | Ao abrir um item `legacy` e um item `v2` a partir de `MyRequestsV2Section`, o mesmo componente de detalhe é renderizado com mesma hierarquia visual principal, variando apenas o conteúdo adaptado |
| M2 | A estrutura visual principal do modal deve seguir o padrão do legado `src/components/applications/RequestDetailsModal.tsx` | O modal final apresenta cabeçalho, grade de informações, bloco `Dados enviados`, bloco final `Histórico` e rodapé alinhados ao shell legado, sem manter a organização atual baseada em blocos independentes de management |
| M3 | O solicitante final não deve ver um bloco `Timeline` separado | Nenhum título, seção ou componente equivalente a `Timeline` é exibido isoladamente na UX final; a evolução do chamado aparece somente no bloco `Histórico` |
| M4 | O bloco final deve se chamar `Histórico` e usar apresentação inspirada na linha do tempo do legado | O bloco final mostra eventos com o item mais antigo em cima e o item mais recente embaixo, com marcadores/etapas e metadados legíveis, reaproveitando a lógica necessária de forma compatível com `legacy` e `v2` |
| M5 | O bloco `Dados enviados` deve permanecer disponível e legível no modal ajustado | Para itens `legacy` e `v2`, os dados submetidos continuam visíveis em uma seção dedicada, sem perda de campos relevantes já exibidos hoje |
| M5a | O bloco de anexos deve permanecer visível quando houver anexos disponíveis | Para itens `legacy` e `v2` com anexos, o modal continua exibindo os anexos em uma seção visível e consistente com o shell final, sem removê-los para aproximar o layout do legado |
| M6 | O modal deve corrigir cópia e rótulos em PT-BR | Títulos, descrições, labels e mensagens do modal não exibem textos sem acentuação indevida como `Solicitacao`, `Nao`, `Acoes` quando houver equivalente correto em PT-BR |
| M7 | O modal deve continuar estritamente read-only para o solicitante final | O detalhe não introduz botões de edição, aprovação, resposta operacional ou qualquer mutação de estado; apenas visualização e fechamento do dialog |
| M8 | Pequenas adaptações no shape de `progress` ou de labels podem ocorrer se ficarem isoladas na camada de apresentação, desde que o design explicite as mudanças e seus impactos | O usuário já aprovou a direção de pequenas adaptações; o `/design` deve listar claramente quais campos/labels derivados serão introduzidos, onde eles vivem, quais arquivos são impactados e qual é o fallback caso a implementação opte por não aplicar alguma dessas mudanças |
| M9 | A cobertura de testes deve contemplar os cenários críticos do dialog ajustado | Existem testes cobrindo abertura/fechamento do dialog, renderização de item `v2`, renderização de item `legacy` e ausência de `Timeline` separada na experiência final |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | A lógica que transforma `progress`/timeline em `Histórico` deve ficar isolada do JSX principal | O componente de dialog consome um adapter/helper de apresentação para montar os itens do histórico, evitando derivação complexa inline no render |
| S2 | O modal deve degradar de forma elegante quando um item legado não tiver informação equivalente à V2 | Na ausência de responsável, previsão, notas ou metadados equivalentes, a UI mostra fallback neutro (`-`, `—`, ausência controlada de linha) sem quebrar layout |
| S3 | O shell visual final deve preservar acessibilidade e semântica básicas do dialog atual | `DialogTitle`, `DialogDescription`, foco de abertura/fechamento e área rolável continuam funcionando após a mudança visual |
| S4 | Os testes devem validar explicitamente a cópia final em PT-BR nas superfícies principais do modal | A suíte cobre pelo menos os títulos principais e a nomenclatura `Histórico`/`Dados enviados` para evitar regressão textual |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Extrair subcomponentes requester-específicos para header, metadata e histórico se isso simplificar manutenção | A implementação pode separar blocos visuais próprios do requester sem alterar o contrato público do dialog |
| C2 | Reaproveitar partes do shell visual ajustado em outras superfícies read-only no futuro | O resultado pode servir de base futura, mas sem criar obrigação de generalização nesta iteração |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Padronizar o mesmo modal para `/applications`, `/requests` ou outras superfícies além de `/solicitacoes` | O usuário restringiu explicitamente o ajuste ao modal do solicitante final em `/solicitacoes` |
| W2 | Alterar backend, endpoint de leitura ou schema oficial do read model para suportar o novo visual | O objetivo atual é de frontend/apresentação; o brainstorm não identificou necessidade obrigatória de mudança de backend |
| W3 | Exibir `Timeline` técnica separada além do bloco `Histórico` | Contraria explicitamente a direção do usuário no brainstorm |
| W4 | Refatorar toda a família de componentes de `src/components/workflows/management/*` | Escopo maior que o necessário para a entrega atual |
| W5 | Introduzir ações operacionais dentro do modal do solicitante | A experiência continua somente leitura |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Fidelidade visual ao legado | O modal final reproduz a estrutura principal do legado em 100% dos cenários do solicitante | Comparação visual entre `RequesterUnifiedRequestDetailDialog` ajustado e `RequestDetailsModal.tsx`, verificando cabeçalho, metadata, `Dados enviados`, `Histórico` e rodapé |
| Experiência única para `legacy` e `v2` | 1 shell visual atende ambas as origens sem bifurcação de layout principal | Testes e inspeção do componente confirmam um único dialog com adapters por origem, sem renderizar layouts distintos |
| Ausência de timeline separada | 0 ocorrências de bloco `Timeline` isolado no modal final | Testes de render e inspeção do componente garantem que apenas `Histórico` é exibido como bloco final |
| Compatibilidade de conteúdo | 100% dos detalhes essenciais já disponíveis hoje continuam acessíveis (`requester`, workflow/tipo, datas, dados enviados, anexos quando existirem, histórico) | Testes com fixtures `legacy` e `v2` e checklist funcional do dialog, validando explicitamente a permanência dos anexos quando existirem |
| Correção textual em PT-BR | 0 labels principais com grafia sem acentuação indevida no modal | Verificação por testes de UI e revisão textual do componente |
| Segurança de leitura | Nenhuma ação mutável é adicionada ao modal do solicitante | Revisão estática do componente e testes de interação limitados a abrir/fechar/rolar |

## 5. Technical Scope

### Backend (functions/src/, src/app/api/)
| Component | Change Type | Details |
|-----------|------------|---------|
| `GET /api/workflows/read/requests/[requestId]` | None | Continua sendo a fonte de detalhe V2; não muda contrato nesta iteração |
| Cloud Functions | None | Sem alterações em `functions/src/` |
| Firestore Rules | None | Nenhuma nova regra de acesso é necessária |

### Frontend (src/)
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx` | Modify | Reestruturar o dialog do solicitante para adotar shell visual legado e substituir a composição atual baseada em `RequestProgress` + `RequestTimeline` separados |
| `src/components/workflows/requester/RequestsV2Page.tsx` | Minor / None | Manter o wiring do dialog unificado; ajuste somente se necessário para props ou composição visual |
| `src/components/workflows/requester/MyRequestsV2Section.tsx` | None | Continua sendo o ponto de abertura do detalhe; sem mudança funcional obrigatória para o define atual |
| `src/components/applications/RequestDetailsModal.tsx` | Reference Only | Permanece intacto e serve como referência explícita de estrutura visual e comportamento esperado |
| `src/components/workflows/management/RequestFormData.tsx` | Reuse / Reevaluate | Pode continuar sendo usado se encaixar no novo shell sem comprometer a fidelidade visual |
| `src/components/workflows/management/RequestAttachments.tsx` | Reuse / Reevaluate | Deve continuar sendo exibido quando houver anexos; o design precisa definir sua posição no shell final sem removê-lo da experiência do solicitante |
| `src/components/workflows/management/RequestProgress.tsx` | De-emphasize / Remove from requester shell | Não deve mais aparecer como bloco independente na UX final do solicitante |
| `src/components/workflows/management/RequestTimeline.tsx` | De-emphasize / Remove from requester shell | Não deve mais aparecer como bloco independente na UX final do solicitante |
| `src/lib/workflows/requester/adapters/legacy-to-unified-detail.ts` | Modify (if needed) | Pode precisar expor dados adicionais de apresentação para o bloco `Histórico` requester |
| `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts` | Modify (if needed) | Pode precisar normalizar `progress`/timeline para o modelo visual do `Histórico` requester |
| `src/lib/workflows/requester/unified-types.ts` | Modify (if needed) | Pode receber ajustes mínimos de tipos de apresentação, se aprovados, para suportar o novo bloco `Histórico` |
| `src/components/workflows/requester/__tests__/` | Modify | Atualizar/adicionar testes do dialog requester cobrindo `legacy`, `v2`, PT-BR e ausência de timeline separada |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Sem escopo de IA/Genkit; feature puramente de UX/apresentação |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| Firestore read models V2 | None | Apenas leitura dos dados já existentes |
| Estruturas legadas de workflows | None | Apenas leitura/adaptação de dados já existentes |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A rota `/solicitacoes` já está no grupo autenticado `(app)`; o modal herda a exigência de usuário autenticado existente |
| User Isolation | O detalhe continua restrito aos itens já filtrados para o próprio solicitante pela lista unificada; nenhuma origem pode expor dados de outro usuário por causa da mudança visual |
| Authorization Surface | O modal permanece read-only e não adiciona permissões operacionais, de aprovação ou de edição |
| Input Validation | Adapters e camada de apresentação devem tolerar campos ausentes, labels não padronizados e dados legados incompletos sem lançar exceções |
| Data Exposure | O ajuste não deve ampliar o conjunto de dados exibidos além do que já é disponibilizado ao solicitante no detalhe atual/unificado |

## 7. Out of Scope

- Padronizar o modal legado em outras rotas fora de `/solicitacoes`
- Alterar o endpoint de detalhe V2 ou criar novo endpoint agregado
- Refatorar toda a biblioteca visual de `src/components/workflows/management/*`
- Introduzir um bloco `Timeline` separado para fins técnicos ou administrativos
- Adicionar ações de edição, cancelamento, aprovação, resposta ou atribuição no modal do solicitante
- Mudar schema de banco, regras do Firestore ou contratos públicos sem necessidade comprovada

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md` | Internal | Ready |
| `src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx` | Internal | Ready |
| `src/components/applications/RequestDetailsModal.tsx` (referência visual) | Internal | Ready |
| `legacyRequestToUnifiedDetail` | Internal | Ready |
| `v2ReadDetailToUnifiedDetail` | Internal | Ready |
| `useRequestDetail` | Internal | Ready |
| Fixtures/casos reais `legacy` e `v2` para validar histórico final | Internal | Pending (a consolidar no /design ou /build) |
| Aprovação do usuário para permitir pequenas adaptações de shape/labels de `progress` | External (product decision) | Done |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | O problema descreve com precisão a divergência entre o modal requester atual e o shell legado esperado, incluindo o ponto central sobre `Timeline` versus `Histórico` |
| User identification | 3 | Usuário final e time de engenharia estão identificados com dores concretas de UX, compatibilidade e manutenção |
| Success criteria measurability | 3 | Há critérios verificáveis por testes de UI, inspeção estática, revisão visual e checklist funcional |
| Technical scope definition | 3 | Arquivos e camadas impactadas foram nomeados explicitamente, com separação entre referência visual, adapters e testes |
| Edge cases considered | 3 | Compatibilidade `legacy`/`v2`, fallback de dados ausentes, PT-BR, read-only e dependência de aprovação para ajustes de shape estão cobertos |
| **TOTAL** | **15/15** | >= 12 — pronto para /design |

## 10. Next Step

Ready for `/design AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES` para detalhar o shell do modal requester, o contrato de apresentação do `Histórico` e a estratégia de testes para `legacy` e `v2`.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | define-agent | Initial requirements from BRAINSTORM_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md |
