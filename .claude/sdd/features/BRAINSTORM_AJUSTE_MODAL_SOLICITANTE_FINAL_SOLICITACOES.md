# BRAINSTORM: AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES

> Generated: 2026-04-17
> Status: Ready for /define

## 1. Problem Statement (Raw)

Ajustar o modal de detalhes do solicitante final na rota `/solicitacoes` para que a experiencia visual fique alinhada 100% ao modal legado, preservando os dados e contratos da V2 quando possivel.

Requisitos explicitados pelo usuario:
- o modal da nova tela deve se basear 100% no layout do modal legado;
- o modal deve se adequar as informacoes da V2;
- nao deve exibir `Timeline` separada para o usuario final;
- o bloco final deve funcionar como "Historico", com design de linha temporal inspirado no legado;
- a ordem visual do historico deve exibir o evento mais antigo em cima e o evento mais recente embaixo;
- a estrutura visual principal do modal legado deve ser mantida;
- deve haver correcao ortografica em PT-BR;
- a compatibilidade com chamados legados dentro de "Minhas Solicitacoes" deve ser preservada;
- o anexo deve permanecer visivel quando existir;
- pequenas adaptacoes no shape de `progress`/labels sao aceitaveis; o usuario aprovou essa direcao, desde que o design explicite quais mudancas serao feitas e quais impactos elas terao.

## 2. Discovery Summary

### Questions Asked
| # | Question | Answer |
|---|----------|--------|
| 1 | Esse ajuste e so para o modal do solicitante final na rota `/solicitacoes`, ou deve virar padrao em outras superficies? | So para o modal do solicitante final na rota `/solicitacoes`. |
| 2 | Podemos tratar isso como ajuste so de frontend, ou pequenas adaptacoes no shape de `progress`/labels sao aceitaveis? | Pequenas adaptacoes sao aceitaveis, desde que aprovadas antes da implementacao. |
| 3 | Qual e a urgencia? | Entrega para hoje, mas bem feita, sem gambiarra e com boa cobertura de testes. |

### Context Explored
| Area | Files/Patterns Found |
|------|---------------------|
| Backend | Nenhuma mudanca obrigatoria identificada. O detalhe requester v2 ja consome `GET /api/workflows/read/requests/[requestId]`. |
| Frontend | `src/app/(app)/solicitacoes/page.tsx`, `src/components/workflows/requester/RequestsV2Page.tsx`, `src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx`, `src/components/applications/RequestDetailsModal.tsx` |
| Database | Nao ha necessidade de mudanca em schema para o objetivo atual. |
| Security Rules | Nenhum impacto esperado. Modal continua read-only para o solicitante final. |

### Existing Implementation Notes
- O modal atual do solicitante final e `RequesterUnifiedRequestDetailDialog.tsx`.
- O layout de referencia desejado pelo usuario esta no legado `RequestDetailsModal.tsx`.
- A tabela "Minhas Solicitacoes" em `/solicitacoes` mistura itens `v2` e `legacy`.
- A camada unificada ja diferencia origens via `origin: 'v2' | 'legacy'`.
- `v2` chega com `progress` estruturado.
- `legacy` chega com `progress: null` e depende de `timeline` derivada.
- Hoje o modal requester reutiliza blocos de `management/`: `RequestFormData`, `RequestProgress`, `RequestTimeline`, `RequestAttachments`.

## 3. Approaches Explored

### Approach A: Re-skin direto do dialog atual

**What it does:** Reaproveita o `RequesterUnifiedRequestDetailDialog` atual e troca apenas a hierarquia visual e as classes para ficar parecido com o legado.

**Implementation:**
- Backend: N/A
- Frontend: ajustar `RequesterUnifiedRequestDetailDialog.tsx` e subcomponentes atuais
- Database: N/A
- AI: N/A

**Pros:**
- Menor volume de mudanca.
- Entrega rapida.
- Reaproveita o contrato atual sem criar novas camadas.

**Cons:**
- Risco de misturar transformacao de dados com JSX.
- Facilita uma implementacao "meio V2, meio legado".
- Piora legibilidade se o historico do solicitante for derivado no proprio componente.

**Effort:** Medium

### Approach B: Shell legado + adapter de apresentacao para requester (Selected)

**What it does:** Mantem o dialog unificado como ponto de entrada, mas cria uma camada de apresentacao do requester para converter dados `v2` e `legacy` em um mesmo shell visual inspirado no modal legado.

**Implementation:**
- Backend: N/A
- Frontend: ajustar `RequesterUnifiedRequestDetailDialog.tsx`; criar adapter/helper para montar historico visual unificado do solicitante; substituir blocos modulares atuais por estrutura visual alinhada ao legado
- Database: N/A
- AI: N/A

**Pros:**
- Melhor fidelidade ao modal legado.
- Mantem compatibilidade com itens `legacy` e `v2`.
- Separa regra de transformacao do render.
- Facilita testes focados em adapter + render final.
- Evita gambiarra de tentar reutilizar `RequestProgress` como historico apenas via CSS.

**Cons:**
- Envolve pequena adaptacao de shape/labels na camada de apresentacao.
- Exige disciplina para nao espalhar a logica entre muitos componentes.

**Effort:** Medium

### Approach C: Novo modal requester dedicado, separado do dialog unificado atual

**What it does:** Cria uma familia de componentes totalmente nova para o solicitante final, mantendo apenas os contratos de dados como fonte.

**Implementation:**
- Backend: N/A
- Frontend: novo dialog requester + novos subcomponentes de header, dados enviados e historico
- Database: N/A
- AI: N/A

**Pros:**
- Separacao arquitetural muito clara.
- Menor acoplamento com componentes de `management/`.

**Cons:**
- Maior superficie de mudanca para uma entrega que precisa acontecer hoje.
- Aumenta custo de testes e risco de regressao.
- Passa do necessario para o escopo atual.

**Effort:** High

## 4. Selected Approach

**Choice:** Approach B

**Rationale:** A abordagem B oferece o melhor equilibrio entre prazo, fidelidade ao legado, compatibilidade com itens `legacy` e `v2`, e qualidade tecnica. Ela permite um shell visual unico para o solicitante final, com logica de adaptacao isolada, sem introduzir refatoracao ampla nem depender de hacks de apresentacao.

## 5. YAGNI Applied

### Features Removed/Deferred
| Feature | Why Removed |
|---------|-------------|
| Padronizar o mesmo modal para `/applications`, `/requests` ou `/gestao-de-chamados` | Fora do escopo; o usuario limitou a rota `/solicitacoes` |
| Mudar backend/read model oficial | Nao necessario para a meta atual |
| Refatorar toda a familia de componentes de `management/` | Excesso de escopo para entrega de hoje |
| Personalizacoes especificas por workflow no modal | Nao sao necessarias para o objetivo principal |
| Timeline tecnica separada para o usuario final | O usuario explicitou que nao quer esse bloco |

### Minimum Viable Scope
Construir um modal requester read-only em `/solicitacoes` com:
- shell visual baseado no legado;
- cabecalho, grid de informacoes e rodape no padrao legado;
- bloco "Dados enviados";
- bloco "Historico" unico para o usuario final;
- compatibilidade com requests `legacy` e `v2`;
- correcao de copy/acentuacao PT-BR;
- cobertura de testes para render, compatibilidade e regras principais.

## 6. Draft Requirements (for /define)

### Must Have
- [ ] O modal do solicitante final em `/solicitacoes` deve manter compatibilidade com itens `legacy` e `v2`.
- [ ] A estrutura visual principal deve seguir o modal legado `RequestDetailsModal.tsx`.
- [ ] O bloco `Timeline` nao deve ser exibido separadamente ao usuario final.
- [ ] O modal deve exibir um unico bloco final chamado `Historico`.
- [ ] O `Historico` deve usar a origem de dados adequada por tipo de item:
- [ ] Para `v2`, o historico deve ser derivado de `progress` ou de shape equivalente aprovado.
- [ ] Para `legacy`, o historico deve ser derivado da timeline legada ja unificada.
- [ ] O `Historico` deve exibir o evento mais antigo em cima e o evento mais recente embaixo.
- [ ] O bloco `Dados enviados` deve permanecer disponivel.
- [ ] O bloco de anexos deve permanecer visivel quando houver anexos disponiveis.
- [ ] O modal deve corrigir copy/rotulos para PT-BR com acentuacao adequada.
- [ ] O modal deve permanecer estritamente read-only para o solicitante final.
- [ ] O usuario ja aprovou pequenas adaptacoes de shape/labels; o design deve explicitar quais mudancas serao feitas e quais impactos elas terao.
- [ ] A cobertura de testes deve contemplar ao menos os cenarios `v2`, `legacy` e fechamento/abertura do dialog.

### Should Have
- [ ] O adapter de historico do requester deve ficar isolado do JSX do dialog.
- [ ] O modal deve degradar graciosamente quando um item legado nao possuir informacoes equivalentes ao `progress` v2.
- [ ] Os testes devem validar explicitamente a ausencia de `Timeline` separada na UX final.

### Could Have (Deferred)
- [ ] Reaproveitar parte do shell visual para outras superficies read-only no futuro.
- [ ] Extrair subcomponentes requester-especificos adicionais se a implementacao mostrar necessidade.

## 7. Technical Notes

### Impacted Areas
| Layer | Impact |
|-------|--------|
| Backend | Nenhum impacto esperado |
| Frontend | `src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx`, possivel novo adapter/helper requester, testes do dialog requester |
| Database | Nenhum |
| Security Rules | Nenhum |

### Risks Identified
| Risk | Mitigation |
|------|------------|
| Implementacao ficar correta apenas para V2 e quebrar compatibilidade com legado | Tornar compatibilidade `legacy` + `v2` requisito explicito do define e dos testes |
| Logica de historico ficar misturada no render | Extrair adapter/helper dedicado para o requester |
| Ambiguidade entre `progress` e `timeline` no shape unificado | Fechar no define qual e o contrato visual do `Historico` para cada origem |
| Anexos desaparecerem em nome da fidelidade visual ao legado | Tornar permanencia dos anexos requisito explicito no define e no design |
| Regressao na UX por copia incompleta do shell legado | Usar `RequestDetailsModal.tsx` como referencia estrutural explicita |
| Prazo apertado gerar cobertura insuficiente | Priorizar testes de compatibilidade, render principal e ausencia de timeline separada |

### Explicit Compatibility Rule
O novo modal requester em `/solicitacoes` deve ser tratado como uma experiencia unica de visualizacao para o usuario final, mas precisa continuar suportando chamadas originadas tanto do fluxo `legacy` quanto do fluxo `v2`. O shell visual sera unico. A estrategia de apresentacao podera variar por origem apenas na camada adapter, nunca na experiencia final exposta ao usuario.

## 8. Next Step

Ready for `/define AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES` to formalize requirements.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex | Initial brainstorm |
