# DEFINE: FASE1_FACILITIES_ETAPA0

> Generated: 2026-03-24
> Status: Ready for etapa 5.2
> Source: solicitação direta + ROADMAP_FASE1_FACILITIES.md + ETAPA0_O_QUE_FORNECER.md + ARQUITETURA_WORKFLOWS_VERSIONADOS.md + WORKFLOWS_PRE_BUILD_OFICIAL.md + workflowDefinitions.json atual + diagramas legados da área
> Clarity Score: 15/15

## 1. Problem Statement

Canonizar os 3 workflows piloto de Facilities no modelo do motor novo, preservando os dados herdados obrigatórios e condensando o fluxo funcional para 3 etapas antes de qualquer implementação.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Solicitante interno | Precisa abrir chamados simples de Facilities sem depender da semântica textual do legado para acompanhar o status | Recorrente |
| Owner da área de Facilities | Precisa receber o chamado inicial e operar um fluxo simples e consistente no piloto | Diária |
| Responsável operacional do chamado | Precisa assumir a condução do chamado em um fluxo linear previsível | Diária |
| Time técnico da etapa 5.2 | Precisa de contrato canônico fechado para materializar `workflowTypes` e `versions` sem inferência implícita | Pontual por etapa |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Fechar os 3 workflows piloto como tipos distintos | O documento registra exatamente 3 workflows: `facilities_manutencao_solicitacoes_gerais`, `facilities_solicitacao_suprimentos` e `facilities_solicitacao_compras` |
| M2 | Preservar os dados herdados obrigatórios | `owner`, `allowedUserIds` e `defaultSlaDays` permanecem alinhados ao estado atual do `workflowDefinitions` |
| M3 | Fechar o fluxo canônico comum do piloto | Todos os 3 workflows usam somente `Solicitação Aberta` -> `Em andamento` -> `Finalizado`, com `statusKey` canônicos e ordem lógica explícita |
| M4 | Fechar os campos canônicos de formulário do piloto | Cada workflow possui a lista final de `field.id`, com preservação do modelo atual salvo a normalização explícita de `centro_custo` no piloto |
| M5 | Tornar explícita a prevalência da canonização sobre o legado | O documento registra que os diagramas da área são apenas referência do fluxo antigo e não prevalecem sobre `ETAPA0_O_QUE_FORNECER.md` |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Sugerir `kind` compatível com o motor novo | As 3 etapas do piloto ficam mapeadas para `start`, `work` e `final`, sem introduzir `action` |
| S2 | Deixar pronto para a etapa 5.2 | O documento separa claramente o que já está fechado do que ainda será materializado tecnicamente depois |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Registrar divergências relevantes do legado | O documento resume as diferenças entre diagramas antigos e o contrato canônico do piloto |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Definir `stepId` manualmente | O sistema irá auto-gerar `stepId` na materialização técnica |
| W2 | Produzir `stepsById` final com IDs reais | Isso depende da geração automática de `stepId` na etapa seguinte |
| W3 | Implementar código, runtime ou migração | Esta etapa é apenas de canonização funcional |
| W4 | Introduzir novas regras de negócio | A solicitação determina que não haja expansão além das decisões já fechadas |

## 4. Decisões Canônicas Fechadas

### 4.0. Convivencia com o banco legado

Para a Fase 1 no mesmo banco de producao, a materializacao do piloto deve usar:

- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- `workflows_v2`
- `counters/workflowCounter_v2`

Essa decisao isola o piloto do legado sem alterar o contrato funcional definido nesta etapa.

### 4.1. Contrato comum do piloto

| Item | Valor canônico |
|------|----------------|
| Área piloto | Facilities e Suprimentos |
| Workflows do piloto | `Manutenção / Solicitações Gerais`, `Solicitação de Suprimentos`, `Solicitação de Compras` |
| Versão inicial a publicar | `1` |
| Owner atual do piloto | `stefania.otoni@3ainvestimentos.com.br` |
| SLA padrão | `5` dias |
| Fluxo canônico | `Solicitação Aberta` -> `Em andamento` -> `Finalizado` |
| `statusKey` canônicos | `solicitacao_aberta`, `em_andamento`, `finalizado` |
| `stepId` | Não será definido manualmente nesta etapa |
| `field.id` | Herdado do modelo atual como base, com normalização canônica explícita de `centrodecusto` para `centro_custo` nos workflows do piloto que usam centro de custo |

### 4.2. Matriz canônica de etapas

Esta matriz vale para os 3 workflows do piloto.

| Step Order Lógico | Step Name | `statusKey` | `kind` sugerido | Initial Step |
|-------------------|-----------|-------------|-----------------|--------------|
| 1 | `Solicitação Aberta` | `solicitacao_aberta` | `start` | Sim |
| 2 | `Em andamento` | `em_andamento` | `work` | Não |
| 3 | `Finalizado` | `finalizado` | `final` | Não |

### 4.3. Regra de prevalência sobre o legado

Os diagramas da área refletem o fluxo antigo/configurado e foram usados apenas como referência histórica.

Para o piloto canonizado do motor novo, prevalece a definição fechada em `ETAPA0_O_QUE_FORNECER.md`:

- `Solicitação Aberta`
- `Em andamento`
- `Finalizado`

Resumo das divergências legadas relevantes:

| Workflow | Fluxo legado observado | Contrato canônico do piloto |
|----------|------------------------|-----------------------------|
| Manutenção / Solicitações Gerais | `Solicitação Aberta` -> `Em análise` -> `Em andamento` -> `Finalizado` | `Solicitação Aberta` -> `Em andamento` -> `Finalizado` |
| Solicitação de Suprimentos | `Solicitação Aberta` -> `Em análise` -> `Em andamento` -> `Finalizado` | `Solicitação Aberta` -> `Em andamento` -> `Finalizado` |
| Solicitação de Compras | `Solicitação Aberta` -> `Em análise` -> `Em aprovação - FIN` -> `Em execução` -> `Finalizado` | `Solicitação Aberta` -> `Em andamento` -> `Finalizado` |

## 5. Canonização dos Workflows do Piloto

### 5.1. Workflow 1 - Manutenção / Solicitações Gerais

| Campo | Valor fechado |
|------|----------------|
| Nome | `Manutenção / Solicitações Gerais` |
| `workflowTypeId` | `facilities_manutencao_solicitacoes_gerais` |
| `version` inicial | `1` |
| Owner | `stefania.otoni@3ainvestimentos.com.br` |
| `allowedUserIds` | Manter exatamente o conjunto atual do `workflowDefinitions`: `["all"]` |
| `defaultSlaDays` | `5` |
| Etapas canônicas | `Solicitação Aberta` -> `Em andamento` -> `Finalizado` |
| `statusKey` | `solicitacao_aberta`, `em_andamento`, `finalizado` |
| `kind` sugerido | `start`, `work`, `final` |
| Initial step | `Solicitação Aberta` |
| `stepOrder` lógico | `1 -> 2 -> 3` |

#### Fields do formulário

| Ordem | `field.id` canônico | Label atual de referência | Tipo atual | Required |
|------|----------------------|---------------------------|------------|----------|
| 1 | `nome_sobrenome` | `Nome e Sobrenome` | `text` | Sim |
| 2 | `setor_area` | `Setor/Área` | `text` | Sim |
| 3 | `impacto` | `Nível de criticidade` | `select` | Sim |
| 4 | `descricao_detalhada` | `Descrição detalhada` | `textarea` | Sim |
| 5 | `centro_custo` | `Qual o centro de custo?` | `select` | Sim |
| 6 | `email` | `E-mail - Corporativo` | `text` | Sim |

Observação de canonização:

- no `workflowDefinitions` atual, o campo de centro de custo aparece como `centrodecusto`;
- para o piloto canonizado, isso deixa de ser tratado como herança literal e passa a ser uma normalização funcional explícita para `centro_custo`, conforme `ETAPA0_O_QUE_FORNECER.md`.

### 5.2. Workflow 2 - Solicitação de Suprimentos

| Campo | Valor fechado |
|------|----------------|
| Nome | `Solicitação de Suprimentos` |
| `workflowTypeId` | `facilities_solicitacao_suprimentos` |
| `version` inicial | `1` |
| Owner | `stefania.otoni@3ainvestimentos.com.br` |
| `allowedUserIds` | Manter exatamente o conjunto atual do `workflowDefinitions` |
| `defaultSlaDays` | `5` |
| Etapas canônicas | `Solicitação Aberta` -> `Em andamento` -> `Finalizado` |
| `statusKey` | `solicitacao_aberta`, `em_andamento`, `finalizado` |
| `kind` sugerido | `start`, `work`, `final` |
| Initial step | `Solicitação Aberta` |
| `stepOrder` lógico | `1 -> 2 -> 3` |

#### `allowedUserIds` fechados

```json
[
  "BCS2",
  "DLE",
  "DG",
  "FPA2",
  "FP2",
  "GSB",
  "LGN",
  "LPM",
  "LFD3",
  "MVS2",
  "PCM",
  "RNF2",
  "SDC2",
  "TFBS2",
  "FFS",
  "FLM",
  "GJO",
  "IBP",
  "MRG",
  "MPO",
  "RDM",
  "SCL",
  "SZH",
  "TAA",
  "VAL",
  "LBC2",
  "DFZ2",
  "SMO2",
  "HSM",
  "RLF",
  "JRC",
  "GOC",
  "LHG",
  "MRR2",
  "MEJ2"
]
```

#### Fields do formulário

| Ordem | `field.id` canônico | Label atual de referência | Tipo atual | Required |
|------|----------------------|---------------------------|------------|----------|
| 1 | `nome_sobrenome` | `Nome e Sobrenome` | `text` | Sim |
| 2 | `email` | `E-mail - Corporativo` | `text` | Sim |
| 3 | `setor_area` | `Setor/Área` | `text` | Sim |
| 4 | `impacto` | `Nível de criticidade` | `select` | Sim |
| 5 | `anexo_planilha` | `Anexo da planilha de suprimentos` | `file` | Sim |
| 6 | `observacoes` | `Observações Adicionais` | `textarea` | Não |
| 7 | `centro_custo` | `Qual seu centro de custo?` | `select` | Não |

Observação de canonização:

- no `workflowDefinitions` atual, o campo de centro de custo aparece como `centrodecusto`;
- para o piloto canonizado, isso deixa de ser tratado como herança literal e passa a ser uma normalização funcional explícita para `centro_custo`, conforme `ETAPA0_O_QUE_FORNECER.md`.

### 5.3. Workflow 3 - Solicitação de Compras

| Campo | Valor fechado |
|------|----------------|
| Nome | `Solicitação de Compras` |
| `workflowTypeId` | `facilities_solicitacao_compras` |
| `version` inicial | `1` |
| Owner | `stefania.otoni@3ainvestimentos.com.br` |
| `allowedUserIds` | Manter exatamente o conjunto atual do `workflowDefinitions` |
| `defaultSlaDays` | `5` |
| Etapas canônicas | `Solicitação Aberta` -> `Em andamento` -> `Finalizado` |
| `statusKey` | `solicitacao_aberta`, `em_andamento`, `finalizado` |
| `kind` sugerido | `start`, `work`, `final` |
| Initial step | `Solicitação Aberta` |
| `stepOrder` lógico | `1 -> 2 -> 3` |

#### `allowedUserIds` fechados

```json
[
  "BCS2",
  "DLE",
  "DG",
  "FPA2",
  "FP2",
  "GSB",
  "LGN",
  "LBC2",
  "LPM",
  "LFD3",
  "MVS2",
  "PCM",
  "RNF2",
  "SDC2",
  "TFBS2",
  "FFS",
  "FLM",
  "GJO",
  "IBP",
  "MRG",
  "MPO",
  "RDM",
  "SCL",
  "SZH",
  "TAA",
  "VAL",
  "SMO2",
  "HSM",
  "DFZ2",
  "BFG2",
  "JPU",
  "DFA",
  "MEM2",
  "MVT",
  "LHG",
  "RLF",
  "JRC",
  "GOC",
  "PIS",
  "MEJ2"
]
```

#### Fields do formulário

| Ordem | `field.id` canônico | Label atual de referência | Tipo atual | Required |
|------|----------------------|---------------------------|------------|----------|
| 1 | `centro_custo` | `Centro de custos` | `select` | Sim |
| 2 | `nome_sobrenome` | `Nome e Sobrenome` | `text` | Sim |
| 3 | `email` | `E-mail - Corporativo` | `text` | Sim |
| 4 | `item_compra` | `O que precisa ser comprado?` | `textarea` | Sim |
| 5 | `quantidade` | `Quantidade` | `text` | Sim |
| 6 | `motivo` | `Motivo da compra` | `textarea` | Sim |
| 7 | `link_produto` | `Link do produto` | `text` | Sim |
| 8 | `anexos` | `Anexos complementares` | `file` | Não |
| 9 | `impacto` | `Nível de criticidade` | `select` | Sim |

Observação de canonização:

- neste workflow, o `field.id` de centro de custo já aparece no estado atual como `centro_custo`;
- o diagrama legado contém etapas intermediárias e usa `finalizada` como status final textual/técnico do fluxo antigo;
- para o piloto, prevalece o contrato simplificado de 3 etapas com `statusKey finalizado`.

## 6. O Que Já Está Fechado vs. O Que Ainda Será Materializado

### 6.1. Fechado nesta etapa

| Tema | Status |
|------|--------|
| Lista dos 3 workflows do piloto | Fechado |
| Nome canônico de cada workflow | Fechado |
| `workflowTypeId` de cada workflow | Fechado |
| `version` inicial | Fechado como `1` |
| Owner atual | Fechado |
| `allowedUserIds` | Fechado pela cópia exata do estado atual |
| `defaultSlaDays` | Fechado como `5` |
| `field.id` do piloto | Fechado, com normalização explícita de `centrodecusto` para `centro_custo` onde aplicável |
| Etapas canônicas | Fechado |
| `statusKey` canônicos | Fechado |
| `kind` sugerido por etapa | Fechado |
| Initial step lógico | Fechado |
| `stepOrder` lógico | Fechado |
| Regra de prevalência sobre diagramas legados | Fechado |

### 6.2. Materialização técnica posterior

| Tema | Como tratar na etapa seguinte |
|------|-------------------------------|
| `stepId` | Auto-gerar no sistema; não definir manualmente |
| `initialStepId` técnico | Apontar para o `stepId` auto-gerado da etapa `Solicitação Aberta` |
| `stepOrder` técnico | Persistir array de `stepId` na ordem lógica `1 -> 2 -> 3` |
| `stepsById` | Montar a estrutura final com os `stepId` gerados e a matriz canônica definida aqui |
| Publicação em `workflowTypes/{workflowTypeId}/versions/{version}` | Materializar usando `version = 1` |
| Ajustes de schema, runtime e read model | Fora desta etapa; entram nas etapas posteriores do roadmap |

## 7. Technical Scope

### Backend (functions/src/)

| Component | Change Type | Details |
|-----------|------------|---------|
| Runtime / publicação de workflows | None | Nenhum código nesta etapa; apenas fechamento do contrato canônico de entrada |

### Frontend (src/app/)

| Component | Change Type | Details |
|-----------|------------|---------|
| UI de abertura/gestão de workflows | None | Nenhum ajuste nesta etapa |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| N/A | None | Não aplicável |

### Database

| Model | Change Type | Details |
|-------|------------|---------|
| `workflowTypes` / `versions` | Define only | O documento fecha o contrato que será materializado depois |

## 8. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | Mantém o padrão atual da aplicação; não há mudança nesta etapa |
| User Isolation | `allowedUserIds` deve permanecer exatamente igual ao conjunto atual de cada workflow |
| Input Validation | Os campos canônicos definidos aqui serão a base de validação na etapa de materialização técnica |

## 9. Out of Scope

- Gerar ou escolher `stepId` manualmente
- Implementar `stepsById` com IDs reais
- Criar código de runtime, API, migração ou frontend
- Introduzir `requestAction`, `respondAction` ou handoffs extras além do fluxo simples do piloto
- Alterar owner, SLA, allowed users ou adicionar campos fora do que já foi fechado

## 10. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `docs/workflows_new/docs_step2/ROADMAP_FASE1_FACILITIES.md` | Internal | Ready |
| `docs/workflows_new/fase1_facilities/ETAPA0_O_QUE_FORNECER.md` | Internal | Ready |
| `docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md` | Internal | Ready |
| `docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md` | Internal | Ready |
| Diagramas legados de Facilities | Internal | Ready |
| `src/scripts/results/workflowDefinitions.json` | Internal | Ready |

## 11. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Workflows canonizados | 3 de 3 workflows fechados | Conferir presença de nome, `workflowTypeId`, owner, `allowedUserIds`, SLA, fields e etapas em cada workflow |
| Fluxo canônico consolidado | 100% alinhado ao piloto simplificado | Confirmar que todos usam apenas 3 etapas e os mesmos `statusKey` canônicos |
| Conflito legado resolvido | 0 ambiguidades abertas | Confirmar registro explícito de que os diagramas antigos não prevalecem sobre `ETAPA0_O_QUE_FORNECER.md` |
| Pronto para 5.2 | Documento utilizável sem inferência adicional | Time técnico consegue materializar `version = 1`, `initialStepId`, `stepOrder` e `stepsById` a partir deste contrato |

## 12. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Objetivo da etapa 5.1 está explícito e delimitado |
| User identification | 3 | Solicitante, owner, responsável e time técnico estão identificados |
| Success criteria measurability | 3 | Critérios verificáveis por checklist documental |
| Technical scope definition | 3 | Separação clara entre canonização atual e materialização posterior |
| Edge cases considered | 3 | Conflito com legado, `stepId` auto-gerado e normalização de `centro_custo` foram tratados |
| **TOTAL** | **15/15** | Pronto para prosseguir |

## 13. Next Step

Ready for etapa 5.2 para materializar este contrato canônico em `workflowTypes` + `versions`, com `stepId` auto-gerado, `initialStepId`, `stepOrder` técnico e `stepsById`.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-24 | define-agent | Canonização inicial dos 3 workflows piloto de Facilities para entrada da etapa 5.2 |
