# DEFINE: Ajustes pontuais do configurador 2E - modal de editor, area contextual e approvers canonicos

> Generated: 2026-04-09
> Status: Approved for design
> Scope: Fase 2 / refinamento da UX e do contrato administrativo do configurador de workflows v2 antes da 2E.4
> Parent document: `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`
> Base document: `BRAINSTORM_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md`
> Clarity Score: 14/15

## 1. Problem Statement

O configurador administrativo de chamados v2 ja funciona, mas ainda apresenta atritos de uso porque o editor de versao quebra o contexto ao abrir em pagina dedicada, expõe `areaId` como campo editavel sem necessidade e torna a configuracao de aprovadores de etapas `action` tecnica demais para o fluxo administrativo.

---

## 2. Users

### 2.1. Admin com permissao `canManageWorkflowsV2`

Pain points:

- perde contexto do catalogo ao sair da aba `Definicoes` para editar uma versao;
- reavalia ou reconfigura `areaId` mesmo quando essa informacao ja foi definida pelo contexto anterior;
- precisa entender e preencher aprovadores de forma tecnica em vez de selecionar colaboradores diretamente.

Frequencia:

- uso recorrente durante criacao, revisao e manutencao de workflows administrativos.

### 2.2. Operacao dona dos fluxos

Pain points:

- depende de um editor fluido para ajustar definicoes sem aumentar tempo de manutencao;
- precisa confiar que `approverIds` persistidos continuem canonicos para o runtime.

Frequencia:

- uso eventual, mas critico em ajustes de processo.

### 2.3. Runtime / plataforma

Pain points:

- depende de `approverIds` persistidos em formato canonico `id3a`;
- nao deve absorver mudancas de UX que alterem semantica de publish/activate ou do processamento operacional.

Frequencia:

- impacto continuo em toda execucao de requests.

---

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | O editor completo de versao deve abrir em modal dentro de `/admin/request-config`, preservando o contexto da aba `Definicoes`. | Ao abrir uma versao draft, o usuario continua na mesma tela base, com overlay/modal de edicao, sem navegacao para pagina dedicada. |
| M2 | O mesmo container modal deve cobrir tanto draft editavel quanto versao publicada em modo read-only. | Drafts abrem em modo editavel; versoes publicadas abrem no mesmo modal em modo somente leitura, com exibicao de geral, acesso, campos, etapas e metadados da versao. |
| M3 | `areaId` deve ser contextual e somente leitura tanto na `v1` quanto em versoes subsequentes. | Em qualquer fluxo de criacao ou edicao, a area aparece visivel no editor, mas nao pode ser alterada por input editavel. |
| M4 | Em etapas `action`, os aprovadores devem ser escolhidos por selecao direta de colaboradores no proprio editor. | O admin seleciona colaboradores por nome no formulario da etapa `action`, sem editar lista tecnica de ids e sem abrir fluxo separado obrigatorio. |
| M5 | A UI deve trafegar uma chave estavel de colaborador e o backend administrativo deve resolver essa chave para persistir `approverIds` no formato canonico `id3a`. | Toda gravacao valida de etapa `action` persiste ids canonicos a partir de `collaboratorDocId` recebido do editor; nomes e emails permanecem apenas como experiencia visual. |
| M6 | As mudancas nao devem alterar a semantica atual de draft, publish e activate. | As operacoes existentes de salvar rascunho, publicar e ativar continuam com o mesmo comportamento funcional observado na 2E.3. |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | O modal deve ter layout denso o suficiente para manter navegacao e leitura confortaveis em desktop. | O usuario visualiza contexto principal da versao e consegue percorrer secoes com scroll interno controlado, sem degradacao evidente de uso. |
| S2 | O editor deve deixar claro quando a area foi herdada do contexto do workflow type. | O campo read-only de area explicita que o valor vem do tipo/area selecionada, reduzindo ambiguidade sobre a origem do dado. |
| S3 | A UI deve exibir nomes e emails legiveis de aprovadores ja selecionados ao reabrir um draft. | Ao carregar um draft existente com `approverIds`, o editor reconstrui a selecao de colaboradores sem expor ids crus como experiencia principal. |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | O modal pode oferecer busca simples para listas maiores de colaboradores. | Se a lista for longa, a selecao continua utilizavel com filtro textual local basico. |
| C2 | O editor pode exibir ajuda curta explicando a normalizacao de aprovadores. | O admin entende que a persistencia final sera canonizada pelo backend sem precisar conhecer `id3a`. |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Redesenhar o runtime operacional de requests ou a semantica das etapas `action`. | Esta iteracao e de refinamento administrativo, nao de motor operacional. |
| W2 | Criar nova entidade de colaborador dentro do modelo de draft. | A normalizacao deve reutilizar a base administrativa existente. |
| W3 | Implementar sistema avancado de busca, filtros complexos ou hierarquias de aprovadores. | Nao e necessario para remover o atrito principal antes da 2E.4. |
| W4 | Manter pagina dedicada paralela ao modal como experiencia principal. | O objetivo desta rodada e consolidar a edicao no contexto do catalogo. |

---

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Edicao contextual | 100% das aberturas de editor de versao em `/admin/request-config` ocorrem via modal, sem pagina dedicada como fluxo primario | Validacao manual do fluxo + testes de componente/integração da abertura e fechamento |
| Area imutavel | 0 caminhos suportados pela UI para alterar `areaId` dentro do editor de versao | Revisao de formulario + testes cobrindo `v1` e nova versao |
| Configuracao amigavel de aprovadores | 100% das etapas `action` passam a ser configuradas por selecao de colaboradores legiveis | Testes de componente no editor de etapas |
| Persistencia canonica | 100% das gravacoes validas de `approverIds` persistem formato `id3a` no backend administrativo | Testes unitarios/integrados da camada server-side |
| Sem regressao de versionamento | 0 regressao nos fluxos de salvar draft, publicar e ativar afetados por esta iteracao | Suite direcionada de testes administrativos e validacao manual de regressao |

---

## 5. Technical Scope

### Backend

| Component | Change Type | Details |
|-----------|------------|---------|
| Rotas/acoes administrativas de draft | Modify | Ajustar contrato de entrada/saida para aceitar selecao de aprovadores derivada da UI via `collaboratorDocId` e manter `approverIds` canonicos persistidos. |
| Servico de normalizacao de colaboradores | Modify | Resolver `collaboratorDocId` recebido do editor para `id3a`, validar correspondencia univoca e rejeitar combinacoes invalidas. |
| Validacao de payload de etapas `action` | Modify | Garantir que a etapa continue exigindo aprovadores validos apos a troca da experiencia de edicao. |

### Frontend

| Component | Change Type | Details |
|-----------|------------|---------|
| `/admin/request-config` e aba `Definicoes` | Modify | Abrir draft e visualizacao de versao publicada em modal acoplado ao catalogo existente. |
| Componentes do editor de draft | Modify | Adaptar layout para modal completo com scroll interno, cabecalho contextual e acoes existentes. |
| Secao de dados gerais | Modify | Exibir area contextual como read-only em vez de campo editavel. |
| Editor de etapas `action` | Modify | Trocar entrada tecnica de `approverIds` por selecao direta de colaboradores com nomes e emails legiveis, trafegando `collaboratorDocId` como chave de lookup. |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| None | None | Fora do escopo desta iteracao. |

### Database

| Model | Change Type | Details |
|-------|------------|---------|
| `workflowTypes_v2/{workflowTypeId}/versions/{version}` | Modify | Manter persistencia de `approverIds` em formato canonico e remover dependencia de edicao manual do campo tecnico na UI. |
| Documento raiz do workflow type | None | Nenhuma mudanca estrutural obrigatoria alem do que ja existe para 2E.3. |
| Base administrativa de colaboradores | Modify | Reutilizada para lookup e normalizacao; pode expor `collaboratorDocId` no payload/lookup sem criar novo modelo de colaborador. |

---

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | Todas as leituras e mutacoes administrativas desta iteracao continuam restritas a usuario autenticado com permissao `canManageWorkflowsV2`. |
| Authorization | O backend deve reforcar permissao administrativa nas operacoes de salvar draft/publicar que receberem dados de aprovadores. |
| User Isolation | A feature nao amplia visibilidade para usuarios comuns; permanece contida no painel admin. |
| Input Validation | O backend deve validar `collaboratorDocId` selecionado, resolver identificador canonico, eliminar inconsistencias e rejeitar aprovadores inexistentes, ambiguos ou nao resolviveis. |
| Data Integrity | `areaId` nao deve ser alterado pela UI do editor; qualquer tentativa de drift entre contexto do tipo e payload editado deve ser ignorada ou rejeitada server-side. |

---

## 7. Out of Scope

- alterar runtime de requests, inbox operacional ou comportamento de execucao das etapas;
- redesenhar publishability, ativacao ou versionamento alem do necessario para compatibilidade com os novos payloads de aprovadores;
- criar nova tela administrativa separada para gestao de aprovadores;
- introduzir suporte a multiplos formatos canonicos de identidade alem de `id3a`;
- implementar historico geral da 2E.4.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md` | Internal | Ready |
| `BRAINSTORM_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md` | Internal | Ready |
| Base administrativa de colaboradores utilizada no configurador | Internal | Ready |

---

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | O problema esta bem delimitado em tres atritos objetivos de UX/comportamento. |
| User identification | 3 | Usuarios principais e seus pain points estao claros, com impacto no admin e no runtime. |
| Success criteria measurability | 3 | Criterios sao observaveis via fluxo, testes de UI e validacao server-side. |
| Technical scope definition | 3 | Camadas afetadas estao claras: catalogo/admin UI, editor modal, validacao administrativa e persistencia canonica. |
| Edge cases considered | 2 | Estao cobertos area herdada, reapertura de draft e canonicalizacao; desenho ainda precisara fechar detalhes de lookup e responsividade. |
| **TOTAL** | **14/15** | Pronto para design. |

---

## 10. Next Step

Produzir `DESIGN_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md` detalhando:

- estrategia de composicao do editor atual dentro de modal;
- fluxo de abertura, fechamento, dirty state e retorno ao catalogo;
- escopo do modal em modo read-only para versoes publicadas dentro da aba `Definicoes`;
- contrato exato de leitura/gravação da area contextual somente leitura;
- contrato de UI e backend para selecao de colaboradores via `collaboratorDocId` e persistencia canonica em `id3a`;
- estrategia de testes de regressao sobre draft/publish/activate.

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-09 | Codex | Requisitos estruturados a partir do brainstorm de ajustes pontuais do configurador 2E |
