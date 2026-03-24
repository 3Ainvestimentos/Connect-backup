# Roadmap Fase 1 - Facilities e Suprimentos

## 1. Objetivo

Este documento define o roadmap inicial de implementacao do primeiro piloto do novo motor de workflows, usando a area de **Facilities e Suprimentos** como recorte inicial.

O objetivo da Fase 1 e validar o novo runtime, o modelo versionado, o read model e a nova experiencia operacional com workflows relativamente simples, sem depender ainda de `requestAction` / `respondAction`.

Ao mesmo tempo, a implementacao desta fase **nao pode achatar a arquitetura**. Mesmo que os fluxos de Facilities nao usem todas as features do motor, a base implementada deve nascer preparada para expandir para:

- `waiting_action`
- `requestAction`
- `respondAction`
- multiplos handoffs operacionais
- regras futuras de ownership
- tela unificada completa

---

## 2. Escopo da Area Piloto

Os diagramas da area em:

- [01-manutencao-solicitacoes-gerais.svg](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/diagramas_workflow/facilities-e-suprimentos/01-manutencao-solicitacoes-gerais.svg)
- [02-solicitacao-de-compras.svg](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/diagramas_workflow/facilities-e-suprimentos/02-solicitacao-de-compras.svg)
- [03-solicitacao-de-suprimentos.svg](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/diagramas_workflow/facilities-e-suprimentos/03-solicitacao-de-suprimentos.svg)

mostram tres workflows candidatos do piloto. Esses diagramas foram gerados a partir do fluxo antigo/configurado e, portanto, nao devem ser tratados automaticamente como a regra canonica do motor novo.

1. `Manutencao / Solicitacoes Gerais`
2. `Solicitacao de Suprimentos`
3. `Solicitacao de Compras`

Resumo da leitura dos diagramas legados:

### 2.1. Manutencao / Solicitacoes Gerais

- `Solicitacao Aberta`
- `Em analise`
- `Em andamento`
- `Finalizado`

### 2.2. Solicitacao de Suprimentos

- `Solicitacao Aberta`
- `Em analise`
- `Em andamento`
- `Finalizado`

### 2.3. Solicitacao de Compras

- `Solicitacao Aberta`
- `Em analise`
- `Em aprovacao - FIN`
- `Em execucao`
- `Finalizado`

Todos os tres fluxos documentados apontam o mesmo owner inicial da area.

### 2.4. Canonizacao inicial proposta para o motor novo

Para a Fase 1, a direcao deste roadmap passa a assumir que os workflows simples de Facilities devem ser condensados para o seguinte fluxo canonico:

### 2.4.1. Manutencao / Solicitacoes Gerais

1. `Solicitacao Aberta`
   - o chamado chega ao owner;
   - o owner precisa designar um responsavel, mesmo que seja ele proprio;
2. `Em andamento`
   - o chamado passa a ser conduzido pelo responsavel atual;
3. `Finalizado`

### 2.4.2. Solicitacao de Suprimentos

1. `Solicitacao Aberta`
   - o chamado chega ao owner;
   - o owner precisa designar um responsavel, mesmo que seja ele proprio;
2. `Em andamento`
   - o chamado passa a ser conduzido pelo responsavel atual;
3. `Finalizado`

Essa canonizacao vale como direcao inicial para:

- `Manutencao / Solicitacoes Gerais`
- `Solicitacao de Suprimentos`

### 2.4.3. Solicitacao de Compras

1. `Solicitacao Aberta`
   - o chamado chega ao owner;
   - o owner precisa designar um responsavel, mesmo que seja ele proprio;
2. `Em andamento`
   - o chamado passa a ser conduzido pelo responsavel atual;
3. `Finalizado`

O diagrama legado da area continua exibindo etapas textuais intermediarias, mas para o piloto esse workflow passa a ser considerado **ja definido** no mesmo modelo simplificado dos demais fluxos de Facilities.

---

## 3. Estrategia da Fase 1

### 3.1. Direcao recomendada

Comecar por Facilities faz sentido porque:

- valida o novo runtime com menos variaveis;
- exercita a abertura, atribuicao, transicao, finalizacao e arquivamento;
- permite validar versionamento e read model com baixo risco;
- desacopla o piloto do caso mais complexo de `requestAction`.

### 3.2. Restricao importante

Mesmo que o piloto inicial nao use `requestAction`, a implementacao deve:

- manter `statusCategory = waiting_action` no modelo;
- manter `actionRequests` na estrutura do `workflow`;
- manter o runtime desenhado com `request-action` e `respond-action` como casos de uso de segunda onda;
- nao codificar a Fase 1 como se todos os workflows fossem lineares para sempre.

### 3.3. Ordem recomendada dentro da area

1. `Manutencao / Solicitacoes Gerais`
2. `Solicitacao de Suprimentos`
3. `Solicitacao de Compras`

Motivo:

- os dois primeiros validam o fluxo linear simples reduzido;
- eles exercitam o handoff owner -> responsavel sem carregar etapas textuais herdadas do legado;
- `Solicitacao de Compras` entra depois apenas como terceira validacao do mesmo modelo simplificado, garantindo que o motor nao esteja acoplado aos dois primeiros tipos.

---

## 4. Artefatos de Referencia Obrigatorios

Toda etapa deste roadmap deve usar os artefatos de `docs_step2` como base de trabalho:

- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)
- [MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)

Diagramas de apoio:

- [01-firestore-collections-erd.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/01-firestore-collections-erd.mmd)
- [02-workflows-document-map.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/02-workflows-document-map.mmd)
- [03-status-category-state-machine.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/03-status-category-state-machine.mmd)
- [04-request-end-to-end-sequence.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/04-request-end-to-end-sequence.mmd)
- [05-advance-vs-finalize-flow.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/05-advance-vs-finalize-flow.mmd)
- [06-runtime-layers.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/06-runtime-layers.mmd)
- [07-queries-and-indexes.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/07-queries-and-indexes.mmd)

---

## 5. Roadmap Inicial de Implementacao

## 5.1. Etapa 0 - Canonizacao do piloto de Facilities

### Objetivo

Transformar os tres fluxos da area em contratos canonicos do novo motor antes de qualquer codigo.

### Entregavel da etapa

- lista fechada dos `workflowTypeId`
- versao inicial de cada workflow
- `stepName`
- `statusKey`
- `initialStep` logico
- `stepOrder` logico
- owner da area

### Agente principal

- `define`

### Referencias obrigatorias

- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)
- [01-firestore-collections-erd.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/01-firestore-collections-erd.mmd)
- diagramas da area em [facilities-e-suprimentos](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/diagramas_workflow/facilities-e-suprimentos)

### Decisoes que precisam sair desta etapa

- nomes canonicos dos tres workflows
- se `Manutencao / Solicitacoes Gerais` e `Solicitacao de Suprimentos` compartilham o mesmo template ou sao tipos distintos
- `statusKey` canonico de cada etapa
- `kind` de cada etapa
- ordem logica das etapas e etapa inicial
- confirmar formalmente que os workflows simples de Facilities serao reduzidos para:
  - `Solicitacao Aberta`
  - `Em andamento`
  - `Finalizado`
- registrar `Solicitacao de Compras` no mesmo modelo reduzido adotado para o piloto

### Observacao importante

Nesta etapa, o `define` nao fecha valores reais de `stepId`.

- `stepId` sera auto-gerado depois pelo sistema na materializacao tecnica;
- o que fica fechado aqui e a identidade funcional das etapas (`stepName`, `statusKey`, `kind`, ordem logica e etapa inicial).

### Criterio de aceite

Os workflows de Facilities precisam estar traduzidos para o schema do motor novo sem depender de textos legacy nem de ordem implicita, e os tres fluxos do piloto precisam sair desta etapa ja condensados no modelo de 3 etapas.

---

## 5.2. Etapa 1 - Validacao e gap-fill da fundacao tecnica

### Objetivo

Validar e operacionalizar a base comum do runtime para a Fase 1, usando o pre-build oficial como fonte autoritativa e fechando apenas o que ainda precisa virar manifest de execucao para Facilities.

### Escopo tecnico

- tipos centrais do motor
- repositorio
- engine base
- resolucao de `latestPublishedVersion`
- leitura de versao imutavel
- abertura de chamado
- atribuicao / reatribuicao
- `advance-step`
- `finalize-request`
- `archive-request`

### Diretriz da etapa

Esta etapa nao deve redesenhar a arquitetura do motor do zero.

Ela deve:

- confirmar que o pre-build cobre o piloto de Facilities;
- preencher gaps de execucao da Fase 1;
- fechar manifest de arquivos, bootstrap, testes e contratos operacionais da etapa.

### Agente principal

- `design` -> para fechar manifest e contratos finais
- `build` -> para implementar

### Referencias obrigatorias

- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)
- [05-advance-vs-finalize-flow.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/05-advance-vs-finalize-flow.mmd)
- [06-runtime-layers.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/06-runtime-layers.mmd)

### Criterio de aceite

Ja deve ser possivel:

- abrir um chamado preso a uma versao
- atribuir responsavel
- avancar entre etapas lineares
- finalizar na etapa final
- arquivar apos finalizacao

Sem nenhuma dependencia do frontend legado para calcular regra de negocio.

---

## 5.3. Etapa 2 - Read model e queries do piloto

### Objetivo

Validar e operacionalizar o read-model backbone da Fase 1, confirmando que os campos desnormalizados e os indices definidos no pre-build atendem os workflows reais de Facilities.

### Escopo tecnico

- schema final de `workflows`
- campos de ownership
- campos de read model
- `closedMonthKey`
- `submittedMonthKey`
- queries por aba
- indices compostos do Firestore

### Diretriz da etapa

Esta etapa nao deve redesenhar o read model do zero.

Ela deve:

- confirmar o contrato oficial do documento `workflows`;
- materializar o backbone persistido necessario para a Fase 1;
- deixar as queries e indices prontos para o frontend minimo do piloto e para a consolidacao posterior da 5.7.

### Agente principal

- `design`
- `build`

### Referencias obrigatorias

- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)
- [RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)
- [02-workflows-document-map.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/02-workflows-document-map.mmd)
- [07-queries-and-indexes.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/07-queries-and-indexes.mmd)

### Criterio de aceite

As filas do piloto devem poder ser consultadas sem joins profundos e sem depender de `actionRequests` para os fluxos simples de Facilities.

---

## 5.4. Etapa 3 - Workflow 1: Manutencao / Solicitacoes Gerais + frontend minimo

### Objetivo

Validar o primeiro fluxo linear ponta a ponta, ja com uma interface minima suficiente para provar runtime + read model + UX basica em operacao real.

### Etapas do workflow a implementar

1. `Solicitacao Aberta`
2. `Em andamento`
3. `Finalizado`

### Agente principal

- `define` -> fechar contrato do workflow 1
- `design` -> apontar arquivos/modulos tocados
- `build` -> implementar runtime + frontend
- `iterate` -> atualizar artefatos se houver ajuste de regra

### Referencias obrigatorias

- [03-status-category-state-machine.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/03-status-category-state-machine.mmd)
- [04-request-end-to-end-sequence.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/04-request-end-to-end-sequence.mmd)
- [MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [01-manutencao-solicitacoes-gerais.svg](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/diagramas_workflow/facilities-e-suprimentos/01-manutencao-solicitacoes-gerais.svg)

### O que deve ser validado nesta etapa

- abertura do chamado
- owner recebe o caso
- owner atribui um responsavel
- responsavel conduz o fluxo em `Em andamento` ate `Finalizado`
- owner arquiva depois
- tela minima mostra fila do owner, detalhes do chamado e acoes operacionais basicas
- `Minhas solicitacoes` exibe o chamado aberto e finalizado de forma coerente
- modal e listas mostram estado coerente

### Criterio de aceite

Primeiro workflow de Facilities rodando ponta a ponta no motor novo, com frontend minimo funcional para abrir, atribuir, finalizar, arquivar e consultar o chamado.

---

## 5.5. Etapa 4 - Workflow 2: Solicitacao de Suprimentos

### Objetivo

Validar reutilizacao da mesma base tecnica em um segundo fluxo linear da mesma area.

### Etapas do workflow a implementar

1. `Solicitacao Aberta`
2. `Em andamento`
3. `Finalizado`

### Agente principal

- `define`
- `design`
- `build`
- `iterate`

### Referencias obrigatorias

- [01-firestore-collections-erd.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/01-firestore-collections-erd.mmd)
- [03-status-category-state-machine.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/03-status-category-state-machine.mmd)
- [07-queries-and-indexes.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/07-queries-and-indexes.mmd)
- [03-solicitacao-de-suprimentos.svg](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/diagramas_workflow/facilities-e-suprimentos/03-solicitacao-de-suprimentos.svg)

### O que deve ser validado nesta etapa

- reuso do mesmo motor sem hardcode por workflow
- consistencia de versionamento entre tipos diferentes
- reuso do frontend minimo sem excecao estrutural por workflow
- leitura correta no frontend minimo e em `Minhas solicitacoes`

### Criterio de aceite

Segundo workflow linear implantado sem introduzir excecao estrutural no runtime.

---

## 5.6. Etapa 5 - Workflow 3: Solicitacao de Compras

### Objetivo

Validar o terceiro workflow de Facilities no mesmo modelo simplificado adotado para o piloto.

### Etapas do workflow a implementar

1. `Solicitacao Aberta`
2. `Em andamento`
3. `Finalizado`

### Agente principal

- `define`
- `design`
- `build`
- `iterate`

### Referencias obrigatorias

- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)
- [MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md)
- [05-advance-vs-finalize-flow.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/05-advance-vs-finalize-flow.mmd)
- [02-solicitacao-de-compras.svg](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/diagramas_workflow/facilities-e-suprimentos/02-solicitacao-de-compras.svg)

### O que deve ser validado nesta etapa

- reuso do mesmo motor em um terceiro tipo da area
- ausencia de dependencia estrutural de labels herdados como `Em aprovacao - FIN` ou `Em execucao`
- consistencia do handoff owner -> responsavel -> finalizacao no workflow de Compras
- compatibilidade do workflow com o frontend minimo ja validado no workflow 1

### Criterio de aceite

Workflow de Compras implementado no mesmo modelo simplificado do piloto, sem introduzir excecoes ad hoc no core.

---

## 5.7. Etapa 6 - Frontend consolidado do piloto

### Objetivo

Expandir o frontend minimo validado no workflow 1 para a experiencia consolidada do piloto, cobrindo a gestao de chamados da area com a estrutura oficial da UI nova.

### Escopo tecnico

- tela `Gestao de chamados`
- abas:
  - `Chamados atuais`
  - `Atribuicoes e acoes`
  - `Concluidas`
- modal unificado
- `Minhas solicitacoes` agrupada por mes

### Agente principal

- `design`
- `build`
- `iterate`

### Referencias obrigatorias

- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md)
- [02-workflows-document-map.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/02-workflows-document-map.mmd)
- [07-queries-and-indexes.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/07-queries-and-indexes.mmd)

### Criterio de aceite

Usuario consegue:

- abrir um chamado
- acompanhar seus chamados por mes
- owner ver e atribuir casos
- responsavel acompanhar e operar chamados
- consultar concluidos e detalhes no modal novo

Sem precisar recorrer ao frontend legado para operar os tres workflows de Facilities.

---

## 5.8. Etapa 7 - Hardening e readiness para expansao

### Objetivo

Fechar a Fase 1 sem comprometer a Fase 2.

### Escopo tecnico

- testes unitarios e de integracao
- verificacao de indices
- verificacao de regras de transacao
- validacao de logs e historico
- checagem de pontos de extensao para `requestAction`

### Criterio de entrada

Esta etapa so deve comecar quando:

- os tres workflows piloto estiverem rodando ponta a ponta no motor novo;
- o frontend minimo e o frontend consolidado ja estiverem integrados ao runtime novo;
- o fluxo basico de regressao estiver verde para abrir, atribuir, finalizar e arquivar nos tres tipos;
- os indices necessarios ja estiverem provisionados;
- nao houver bloqueio funcional conhecido nos caminhos principais do piloto.

### Agente principal

- `build`
- `iterate`

### Referencias obrigatorias

- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)
- [06-runtime-layers.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/06-runtime-layers.mmd)
- [07-queries-and-indexes.mmd](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/diagrams/07-queries-and-indexes.mmd)

### Criterio de aceite

A base fica pronta para:

- adicionar `requestAction`
- adicionar fluxos mais complexos
- suportar troca futura de owner
- migrar a proxima area sem retrabalho estrutural

---

## 6. Como usar os agentes em cada fase

## 6.1. `define`

Usar para:

- canonizar cada workflow de Facilities no modelo novo;
- fechar `workflowTypeId`, `statusKey`, `kind`, `stepOrder` logico e etapa inicial;
- produzir ou atualizar documentos especificos do piloto.

### Entrada minima

- este roadmap
- diagrama SVG do workflow alvo
- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)

## 6.2. `design`

Usar para:

- transformar o recorte definido em manifest tecnico;
- mapear arquivos;
- fechar contratos e pontos de extensao;
- evitar desvio da arquitetura por causa do piloto simples.

### Entrada minima

- resultado do `define`
- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)

## 6.3. `build`

Usar para:

- implementar runtime;
- materializar schema e read model;
- conectar frontend do piloto;
- validar o comportamento ponta a ponta.

### Entrada minima

- resultado do `design`
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)
- diagramas de `docs_step2/diagrams`

## 6.4. `iterate`

Usar para:

- atualizar os artefatos caso Facilities revele ajustes reais;
- propagar mudancas do piloto para docs de arquitetura, runtime, read model ou frontend;
- manter a documentacao sincronizada com o que foi validado no build.

### Entrada minima

- diff da decisao nova
- artefato impactado
- este roadmap

---

## 7. Sequencia minima recomendada

1. Canonizar os workflows de Facilities no schema novo no modelo simplificado de 3 etapas.
2. Construir o core do runtime sem amarrar a um workflow especifico.
3. Implementar `Manutencao / Solicitacoes Gerais`.
4. Reusar a mesma base em `Solicitacao de Suprimentos`.
5. Estender para `Solicitacao de Compras`.
6. Conectar a tela unificada e o modal.
7. Fechar testes, hardening e readiness para a proxima onda.

---

## 8. Definicao de pronto da Fase 1

A Fase 1 pode ser considerada pronta quando:

- os tres workflows de Facilities estiverem no modelo novo simplificado;
- o runtime novo suportar abertura, atribuicao, avancar, finalizar e arquivar;
- o read model sustentar as listas do frontend;
- a tela unificada e o modal estiverem operando com o runtime novo;
- a documentacao continuar coerente com a implementacao;
- a base estiver pronta para receber, na fase seguinte, um workflow que use `requestAction`.

`Solicitacao de Compras` ja e tratado neste roadmap como parte definida do recorte do piloto.
