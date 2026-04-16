# DEFINE: Ajustes UI/UX criticos em `/admin/request-config`

> Generated: 2026-04-16
> Status: Approved for design
> Scope: Fase 2 / patch critico de UX/UI na tela administrativa de configuracao de chamados
> Parent documents: `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`, `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`, `DEFINE_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md`
> Base document: `BRAINSTORM_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md`
> Clarity Score: 15/15

## 1. Problem Statement

A tela `/admin/request-config` ja funciona no nivel operacional, mas ainda possui atritos visuais e ergonomicos na aba `Definicoes` e no filtro da aba `Historico Geral`, impedindo que a experiencia administrativa atinja o padrao canonico esperado para uso oficial.

---

## 2. Users

### 2.1. Admin com permissao `canManageWorkflowsV2`

Pain points:

- encontra uma hierarquia visual pouco clara na aba `Definicoes`, com leitura menos fluida de tipos, versoes e acoes;
- edita versoes em modal com fechamento e rodape de acoes abaixo do padrao operacional esperado;
- precisa interpretar labels tecnicos em ingles nas acoes do editor;
- encontra o filtro de `Historico Geral` excessivamente exposto e mais ruidoso do que o padrao ja validado em `/gestao-de-chamados`.

Frequencia:

- uso recorrente na manutencao diaria de configuracoes administrativas.

### 2.2. Operacao / owners de fluxo

Pain points:

- dependem de uma interface confiavel para revisar versoes e rascunhos sem friccao visual desnecessaria;
- precisam de sinais visuais claros para entender o fluxo de acao no editor sem ambiguidade de CTA.

Frequencia:

- uso eventual, mas critico em janelas de ajuste e publicacao.

### 2.3. Governanca do produto

Pain points:

- precisa alinhar a superficie administrativa nova ao canon visual do app sem reabrir backend, contratos ou escopo estrutural;
- precisa de um patch seguro e rapido para hoje, com baixo risco de regressao funcional.

Frequencia:

- impacto continuo na percepcao de qualidade da feature.

---

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | A aba `Definicoes` deve reorganizar sua leitura visual para que `WorkflowType` seja o agrupador principal das versoes. | A listagem passa a comunicar claramente `area -> workflow type -> versions`, com o tipo como unidade visual principal e sem depender de leitura confusa do layout atual. |
| M2 | A linha textual tecnica raw `state=*` deve ser removida da listagem de versoes, preservando apenas os badges e sinais visuais ja existentes. | Nenhuma linha de versao exibe texto tecnico raw `state=*`; a comunicacao de status permanece apoiada apenas nos badges e estados visuais existentes. |
| M3 | O editor de versao em modal deve usar fechamento padrao com `X` no canto superior direito e CTAs principais fixos no rodape quando a versao estiver em edicao. | O usuario fecha o modal pelo `X` superior direito tanto em modo de escrita quanto em leitura; em modo draft, `Salvar rascunho` e `Publicar versao` permanecem visiveis no rodape, lado a lado, com menor padding inferior; em modo read-only nao ha submit editavel. |
| M4 | Os CTAs `Adicionar etapa` e `Adicionar campo` devem migrar para o canto inferior direito dos blocos correspondentes. | Cada secao exibe seu CTA de adicao no rodape do proprio card/bloco, reforcando a associacao entre acao e contexto. |
| M5 | Labels e opcoes sistemicas de `Acao` devem ser exibidos em PT-BR para a experiencia administrativa. | O admin visualiza nomenclatura em portugues nas superficies visiveis do editor, sem expor `approval`, `acknowledgement` ou `execution` como experiencia principal; campos livres e labels digitados manualmente permanecem sob controle do usuario. |
| M6 | Os botões de acao do editor devem seguir o estilo `admin-primary` em verde-agua. | CTAs acionaveis do editor usam o token visual administrativo aprovado, sem criar variante nova fora do canon atual. |
| M7 | A aba `Historico Geral` deve adotar filtro compacto inspirado no padrao de `/gestao-de-chamados`, em vez de manter o filtro sempre aberto. | O filtro passa a abrir sob demanda via controle minimalista e pequeno card/popover, mantendo a tela mais limpa por padrao. |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | O shell do modal deve aumentar a densidade visual util sem perder legibilidade. | Cabecalho, conteudo e rodape ficam visualmente mais coesos e reduzem espacos mortos sem comprometer leitura em desktop. |
| S2 | A transicao entre catalogo, versao e editor deve ficar mais autoexplicativa. | A hierarquia visual da aba `Definicoes` permite identificar tipo, versao e acao principal com menor esforco cognitivo. |
| S3 | O filtro compacto de `Historico Geral` deve preservar os mesmos criterios funcionais ja suportados hoje. | A mudanca altera apresentacao e comportamento de abertura/fechamento sem remover capacidade de filtragem existente. |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | O filtro compacto pode reutilizar composicao ou semantica visual proxima do `ManagementToolbar` sempre que isso nao aumentar acoplamento indevido. | O design aproveita o padrao visual aprovado de `/gestao-de-chamados` sem exigir extracao estrutural ampla nesta iteracao. |
| C2 | O editor pode introduzir pequenos ajustes de alinhamento e espacamento adicionais coerentes com o patch principal. | Melhorias pontuais de acabamento sao aceitas se permanecerem estritamente dentro do escopo de UX/UI desta iteracao. |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Alterar contratos de API, runtime de workflows ou comportamento funcional de publish/activate. | O objetivo e corrigir UX/UI sem reabrir arquitetura ou semantica operacional. |
| W2 | Redesenhar integralmente `/admin/request-config` ou extrair um novo sistema compartilhado de filtros. | Seria escopo excessivo para um patch critico com urgencia de hoje. |
| W3 | Modificar `/gestao-de-chamados` ou outras rotas administrativas fora da referencia visual necessaria. | A rota de referencia serve como canon visual, nao como alvo de alteracao. |
| W4 | Introduzir novo schema, novos estados persistidos ou mudancas de dados em Firestore. | Nao ha necessidade funcional ou tecnica para este ajuste. |

---

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Hierarquia de `Definicoes` mais clara | 100% das leituras principais de tipo e versao ficam compreensiveis sem texto tecnico redundante | Validacao manual comparando antes/depois na aba `Definicoes` |
| Modal operacional canonico | 100% das aberturas do editor exibem `X` superior direito; drafts exibem CTAs fixos no rodape sem alterar o comportamento atual de salvar/publicar | Teste manual do modal + possiveis testes de componente do dialog |
| CTAs contextuais de secao | `Adicionar etapa` e `Adicionar campo` aparecem apenas no rodape dos seus blocos | Validacao visual do editor em draft |
| Terminologia amigavel | 100% das labels visiveis de `Acao` no editor passam a usar PT-BR | Revisao da UI e testes de renderizacao onde aplicavel |
| Filtro enxuto no Historico | O filtro nao fica aberto por padrao e pode ser expandido sob demanda em card/popover compacto | Teste manual da aba `Historico Geral` |
| Sem regressao funcional | 0 regressao nos fluxos existentes de salvar rascunho, publicar versao e aplicar filtros | Regressao manual direcionada nos fluxos administrativos afetados |

---

## 5. Technical Scope

### Backend

| Component | Change Type | Details |
|-----------|------------|---------|
| Rotas/acoes administrativas de configuracao | None | Nenhuma mudanca de contrato, validacao ou semantica server-side e requerida. |
| Runtime de workflows | None | Fora do escopo desta iteracao. |

### Frontend

| Component | Change Type | Details |
|-----------|------------|---------|
| `/admin/request-config` shell e aba `Definicoes` | Modify | Reorganizar hierarchy visual do catalogo para destacar `WorkflowType` e remover a linha textual raw `state=*`, preservando badges e sinais visuais ja existentes. |
| `WorkflowVersionEditorDialog` e composicao do editor | Modify | Ajustar `Dialog` para `X` superior direito em todos os modos, rodape fixo com CTAs lado a lado apenas quando a versao estiver em edicao, menor padding inferior e estilo `admin-primary`, preservando o funcionamento atual de salvar/publicar. |
| Secoes de campos e etapas do editor | Modify | Reposicionar `Adicionar campo` e `Adicionar etapa` para o rodape dos cards correspondentes. |
| Renderizacao de labels de `Acao` | Modify | Traduzir labels e opcoes sistemicas visiveis para PT-BR sem alterar enums, payloads, persistencia ou textos livres digitados pelo admin. |
| Aba `Historico Geral` e barra de filtros | Modify | Substituir a barra sempre expandida por controle compacto inspirado em `/gestao-de-chamados`, com abertura sob demanda em pequeno card/popover. |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| None | None | Fora do escopo desta iteracao. |

### Database

| Model | Change Type | Details |
|-------|------------|---------|
| `workflowTypes_v2/{workflowTypeId}` | None | Nenhuma mudanca estrutural. |
| `workflowTypes_v2/{workflowTypeId}/versions/{version}` | None | Nenhuma mudanca estrutural; apenas apresentacao de dados ja existentes. |
| Requests legados e `V2` no historico | None | Leitura mantida como esta; apenas muda a UX do filtro. |

---

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A superficie continua restrita a usuario autenticado com permissao `canManageWorkflowsV2`, sem ampliacao de acesso. |
| Authorization | Nenhuma nova capacidade administrativa e introduzida; os gates atuais permanecem como estao. |
| User Isolation | O patch nao altera escopo de visibilidade nem compartilhamento de dados entre usuarios. |
| Input Validation | Como o recorte e de apresentacao, validacoes existentes de salvar rascunho, publicar e filtrar devem ser preservadas sem afrouxamento. |
| Data Integrity | Labels em PT-BR e remocoes de texto redundante nao podem alterar os valores canonicos persistidos ou trafegados internamente; salvar/publicar continuam usando o mesmo comportamento funcional atual. |

---

## 7. Out of Scope

- alterar backend, Firestore, funcoes server-side ou contratos administrativos;
- mexer na semantica de criar draft, publicar versao, ativar versao ou regras do runtime;
- redesenhar tabs, cards ou tabela de `Historico Geral` alem do necessario para o filtro compacto;
- extrair primitives globais novas de toolbar/filtros como parte obrigatoria desta entrega;
- aplicar o mesmo patch visual em outras rotas fora de `/admin/request-config`.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md` | Internal | Ready |
| `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md` | Internal | Ready |
| Componentes atuais de `/admin/request-config` identificados no brainstorm | Internal | Ready |
| Referencia visual de filtro em `/gestao-de-chamados` | Internal | Ready |

---

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | O problema esta delimitado em atritos visuais objetivos na aba `Definicoes` e no filtro de `Historico Geral`. |
| User identification | 3 | Usuarios administrativos e seus pain points estao claros, com impacto direto na operacao e governanca. |
| Success criteria measurability | 3 | Os criterios sao observaveis via comparacao visual, regressao manual e testes de componente quando aplicavel. |
| Technical scope definition | 3 | O recorte tecnico esta contido no frontend, com componentes e superficies afetadas bem identificados. |
| Edge cases considered | 3 | O define explicita preservacao de filtros existentes, ausencia de mudanca contratual e manutencao da semantica funcional atual. |
| **TOTAL** | **15/15** | Pronto para design. |

---

## 10. Next Step

Ready for `/design AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS` com foco em:

- nova hierarchy visual da aba `Definicoes`;
- shell detalhado do `WorkflowVersionEditorDialog`;
- mapeamento de labels PT-BR para tipos de `Acao`;
- reposicionamento dos CTAs internos do editor;
- especificacao do filtro compacto de `Historico Geral` inspirado em `/gestao-de-chamados`;
- estrategia de validacao visual e regressao funcional do patch.

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex | Requisitos estruturados a partir do brainstorm de ajustes criticos de UI/UX em `/admin/request-config` |
| 1.1 | 2026-04-16 | Codex | Refinado aceite para remover a linha raw `state=*`, formalizar `X` nos modos edit/read-only, restringir traducao de `Acao` a apresentacao e explicitar preservacao do funcionamento atual |
