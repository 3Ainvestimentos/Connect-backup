# Roadmap das Etapas - Fase 1 Facilities

## 1. Objetivo

Este documento resume apenas a sequencia de etapas da Fase 1 do piloto de **Facilities e Suprimentos**, sem repetir o detalhamento completo do roadmap principal.

Ele deve ser lido em conjunto com:

- [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_FASE1_FACILITIES.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)

### Nota de armazenamento da Fase 1

Na execucao do piloto, as etapas abaixo devem considerar as colecoes fisicas:

- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- `workflows_v2`
- `counters/workflowCounter_v2`

---

## 2. Sequencia das Etapas

### 5.1. Etapa 0 - Canonizacao do piloto

**Objetivo**

Fechar o contrato funcional dos 3 workflows de Facilities no modelo do motor novo.

**Saidas esperadas**

- `workflowTypeId` fechado
- etapas canonicas fechadas
- `statusKey` fechado
- `kind` fechado
- ordem logica das etapas fechada
- etapa inicial fechada
- owner, SLA e `allowedUserIds` herdados
- `field.id` do piloto fechado

**Observacao**

- `stepId` nao e definido aqui;
- `stepId` sera auto-gerado na materializacao tecnica.

---

### 5.2. Etapa 1 - Validacao e gap-fill da fundacao tecnica

**Objetivo**

Operacionalizar a fundacao tecnica do motor para a Fase 1, sem redesenhar a arquitetura ja definida no pre-build.

**Saidas esperadas**

- manifest tecnico da etapa
- modulos centrais do runtime fechados
- bootstrap/materializacao da `version = 1` dos workflows piloto
- contratos de API da etapa
- estrategia de testes da etapa
- regras tecnicas finais para:
  - `open-request`
  - `assign-responsible`
  - `advance-step`
  - `finalize-request`
  - `archive-request`

---

### 5.3. Etapa 2 - Validacao e gap-fill do read model

**Objetivo**

Confirmar e operacionalizar o read-model backbone da Fase 1 para os workflows reais de Facilities.

**Saidas esperadas**

- shape persistida do documento `workflows`
- campos desnormalizados obrigatorios
- queries basicas do piloto confirmadas
- indices compostos confirmados
- regra de atualizacao do read model por caso de uso

---

### 5.4. Etapa 3 - Workflow 1 + frontend minimo

**Workflow**

- `Manutencao / Solicitacoes Gerais`

**Objetivo**

Validar o primeiro fluxo ponta a ponta no motor novo, ja com frontend minimo funcional.

**Saidas esperadas**

- abertura do workflow 1 funcionando
- owner recebe e atribui
- responsavel finaliza
- owner arquiva
- frontend minimo funcionando para:
  - abrir chamado
  - visualizar fila basica
  - atribuir responsavel
  - finalizar
  - arquivar
  - consultar `Minhas solicitacoes`

---

### 5.5. Etapa 4 - Workflow 2 sobre a mesma base

**Workflow**

- `Solicitacao de Suprimentos`

**Objetivo**

Validar reuso do motor e do frontend minimo em um segundo workflow da mesma area.

**Saidas esperadas**

- segundo workflow rodando no mesmo modelo simplificado
- sem hardcode estrutural do workflow 1
- frontend minimo reutilizado sem excecoes ad hoc

---

### 5.6. Etapa 5 - Workflow 3 sobre a mesma base

**Workflow**

- `Solicitacao de Compras`

**Objetivo**

Validar o terceiro workflow no mesmo modelo simplificado adotado para o piloto.

**Saidas esperadas**

- terceiro workflow rodando ponta a ponta
- ausencia de dependencia de labels legados
- mesmo handoff owner -> responsavel -> finalizacao
- compatibilidade com a mesma base tecnica e com o frontend minimo

---

### 5.7. Etapa 6 - Frontend consolidado do piloto

**Objetivo**

Expandir o frontend minimo para a experiencia consolidada da area piloto.

**Saidas esperadas**

- tela `Gestao de chamados`
- abas principais operacionais
- modal unificado
- `Minhas solicitacoes` agrupada por mes
- uso do runtime novo sem dependencia do frontend legado

---

### 5.8. Etapa 7 - Hardening e readiness para expansao

**Objetivo**

Fechar a Fase 1 com seguranca tecnica suficiente para expandir para fluxos mais complexos e para a proxima area.

**Criterio de entrada**

- os 3 workflows piloto estao rodando ponta a ponta
- frontend minimo e frontend consolidado ja estao integrados
- fluxo basico de regressao esta verde
- indices ja estao provisionados
- nao ha bloqueios funcionais conhecidos no piloto

**Saidas esperadas**

- testes reforcados
- verificacao de transacoes
- verificacao de indices
- verificacao de logs e historico
- readiness para introduzir `requestAction` depois

---

## 3. Ordem Recomendada de Execucao

1. `5.1` Canonizacao do piloto
2. `5.2` Validacao e gap-fill da fundacao tecnica
3. `5.3` Validacao e gap-fill do read model
4. `5.4` Workflow 1 + frontend minimo
5. `5.5` Workflow 2
6. `5.6` Workflow 3
7. `5.7` Frontend consolidado do piloto
8. `5.8` Hardening e readiness para expansao

---

## 4. Regra de Uso

Este documento existe como visao rapida de execucao.

Quando houver conflito de detalhe:

1. prevalece o documento especifico da etapa;
2. depois o [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/ROADMAP_FASE1_FACILITIES.md);
3. depois o [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md).
