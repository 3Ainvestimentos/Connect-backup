# Checklist Operacional da Etapa 2

## Extracao e Validacao da Regra de Negocio Atual

## 1. Objetivo da etapa

Esta etapa existe para reconstruir, com evidencias, a regra de negocio real dos workflows atuais antes de qualquer refatoracao estrutural do motor.

O resultado esperado nao e codigo novo. O resultado esperado e um conjunto de artefatos confiaveis que permitam responder, por workflow:

- o que esta configurado;
- o que o codigo realmente faz;
- o que os dados reais mostram;
- o que esta correto, legado, ambiguo ou inconsistente.

---

## 2. Artefatos de entrada obrigatorios

- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowAreas.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflow_samples.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx`

---

## 3. Forma de execucao recomendada

Esta etapa deve ser executada por 3 agentes trabalhando de forma complementar:

- **Agente 1**: inventario configurado dos workflows
- **Agente 2**: regra implementada no codigo
- **Agente 3**: confronto com dados reais e consolidacao de inconsistencias

Os 3 agentes devem produzir insumos compativeis entre si e convergir para uma matriz unica de validacao funcional.

---

## 4. Checklist operacional

## Bloco A: Inventario Configurado

Responsavel principal: Agente 1

- [ ] Ler `workflowDefinitions.json` e `workflowAreas.json`
- [ ] Listar todos os workflows ativos atuais
- [ ] Relacionar cada workflow a sua area
- [ ] Identificar `ownerEmail` de cada workflow
- [ ] Extrair `allowedUserIds`
- [ ] Extrair todos os `fields` com:
  - `id`
  - `label`
  - `type`
  - `required`
  - `options`
- [ ] Extrair a sequencia de `statuses`
- [ ] Identificar statuses com `action`
- [ ] Extrair `slaRules`
- [ ] Extrair `routingRules`
- [ ] Identificar possiveis workflows com problemas de definicao:
  - ids de campos duplicados
  - campos obrigatorios duvidosos
  - statuses mal definidos
  - configuracoes suspeitas
- [ ] Produzir uma tabela por workflow com a regra configurada

### Saida esperada do Bloco A

- inventario completo dos workflows ativos
- tabela configurada por workflow
- lista de alertas de configuracao

---

## Bloco B: Regra Implementada no Codigo

Responsavel principal: Agente 2

- [ ] Ler `WorkflowsContext.tsx`
- [ ] Ler `WorkflowSubmissionModal.tsx`
- [ ] Ler `RequestApprovalModal.tsx`
- [ ] Ler `ManageRequests.tsx`
- [ ] Ler `/me/tasks/page.tsx`
- [ ] Ler `MessagesContext.tsx`
- [ ] Mapear a criacao de solicitacao:
  - origem dos dados
  - momento de criacao do documento
  - momento de persistencia de `formData`
  - atribuicoes iniciais
  - historico inicial
- [ ] Mapear a progressao de status:
  - como o proximo status e calculado
  - quem pode mover
  - se ha branching real ou apenas ordem de array
- [ ] Mapear a atribuicao de responsavel
- [ ] Mapear as acoes por status:
  - `approval`
  - `acknowledgement`
  - `execution`
- [ ] Mapear o que acontece quando uma acao e respondida
- [ ] Mapear criterio de finalizacao implementado
- [ ] Mapear as notificacoes do Connect:
  - quando sao geradas
  - onde sao persistidas
  - quem recebe
- [ ] Identificar regras hardcoded e heuristicas do frontend
- [ ] Identificar todos os pontos onde a regra de negocio esta fora da definicao

### Saida esperada do Bloco B

- documento da regra implementada no codigo
- fluxo ponta a ponta da solicitacao
- lista de regras hardcoded e fragilidades estruturais

---

## Bloco C: Dados Reais e Confronto

Responsavel principal: Agente 3

- [ ] Ler `workflow_samples.json`
- [ ] Listar todos os `types` observados nas amostras
- [ ] Cruzar os `types` observados com os `types` definidos
- [ ] Identificar workflows ativos, legados e migrados
- [ ] Mapear `statuses` observados nas amostras
- [ ] Mapear `formData` real por tipo
- [ ] Identificar campos presentes em dados reais que nao existem mais nas definicoes
- [ ] Identificar campos obrigatorios das definicoes que nao aparecem nos dados reais
- [ ] Identificar historicos com statuses fora da definicao atual
- [ ] Identificar `actionRequests`, `assignee`, `history` e metadados relevantes
- [ ] Consolidar divergencias entre:
  - definicao configurada
  - regra implementada
  - comportamento observado
- [ ] Classificar cada divergencia como:
  - legado
  - bug provavel
  - configuracao incorreta
  - comportamento intencional
  - duvida de negocio

### Saida esperada do Bloco C

- tabela de confronto configuracao x runtime x dados
- lista de workflows ou statuses legados
- lista de inconsistencias com classificacao

---

## 5. Consolidacao final da Etapa 2

Responsabilidade compartilhada entre os 3 agentes, com consolidacao final humana.

- [ ] Unificar os achados dos Blocos A, B e C
- [ ] Produzir uma matriz canonica por workflow com 4 colunas:
  - regra configurada
  - regra implementada
  - comportamento observado
  - validacao/duvida
- [ ] Produzir lista de regras globais do motor atual
- [ ] Produzir lista de inconsistencias estruturais
- [ ] Produzir lista de decisoes que dependem de validacao humana
- [ ] Separar com clareza:
  - fato comprovado
  - inferencia
  - ponto em aberto

---

## 6. Criterios de conclusao da Etapa 2

A Etapa 2 so deve ser considerada concluida quando existirem:

- uma matriz por workflow ativo;
- uma leitura global da regra implementada no sistema;
- uma lista priorizada de inconsistencias;
- uma lista objetiva de pontos para validacao humana;
- consenso de que a refatoracao tecnica pode comecar sem ambiguidade funcional relevante.

---

## 7. O que nao fazer nesta etapa

- [ ] Nao refatorar o motor ainda
- [ ] Nao implementar o Slack ainda
- [ ] Nao reescrever componentes ainda
- [ ] Nao tratar achados como bug confirmado sem evidencias
- [ ] Nao misturar sugestao tecnica com extracao da regra atual

---

## 8. Entregavel final sugerido

Documento principal sugerido:

- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/MATRIZ_REGRAS_WORKFLOWS_ATUAIS.md`

Documentos de apoio sugeridos:

- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/REGRA_IMPLEMENTADA_MOTOR_ATUAL.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/CONFRONTO_CONFIG_RUNTIME_DADOS.md`
