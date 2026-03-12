# Plano das Proximas Etapas da Refatoracao de Workflows

## 1. Objetivo

Depois do saneamento inicial dos `types` divergentes e da migracao dos workflows legados de RH, a proxima fase do projeto deve atacar o problema estrutural do sistema de workflows: hoje a regra de negocio esta espalhada entre frontend, contexts e modais, o que aumenta o risco de erro operacional, regressao e notificacao inconsistente.

Este plano organiza as proximas etapas para:

- consolidar a regra de negocio real dos workflows ativos;
- redesenhar o motor de workflow de forma modular;
- garantir notificacoes confiaveis no Connect e no Slack;
- criar cobertura de testes suficiente para sustentar a migracao tecnica;
- realizar rollout com baixo risco para os usuarios.

---

## 2. Status Atual

### Concluido

- remocao planejada dos `types` legados descontinuados;
- migracao dos workflows legados de RH para os `types` atuais;
- normalizacao de `formData` com base nas `workflowDefinitions`;
- criacao de scripts de dry run, execucao, backup e verificacao;
- validacao pos-migracao dos documentos migrados.

### Efeito da etapa concluida

- a base esta menos inconsistente;
- os chamados legados mais criticos deixaram de ficar orfaos em relacao as definicoes atuais;
- o projeto agora pode atacar a refatoracao estrutural com menos risco de legado distorcendo a leitura do sistema.

---

## 3. Planejamento das Proximas Etapas

## Etapa 2: Extracao e Validacao da Regra de Negocio Atual

### Objetivo

Consolidar, por workflow ativo, a regra que o sistema usa hoje e validar com o negocio o que deve ser preservado na refatoracao.

### Atividades

- inventariar todos os workflows ativos atuais;
- mapear para cada workflow:
  - area;
  - owner;
  - allowedUserIds;
  - fields;
  - statuses;
  - actions;
  - SLA;
  - routing rules;
  - criterio de encerramento;
  - comportamento esperado de notificacao;
- cruzar configuracao com implementacao real no codigo;
- identificar regras que estao na UI e nao na definicao;
- identificar comportamentos ambiguos, legados ou contraditorios;
- produzir uma matriz canonica para validacao funcional.

### Entregaveis

- matriz de regras por workflow;
- mapa de inconsistencias entre definicao e runtime;
- lista de decisoes de negocio pendentes.

### Criterio de conclusao

Nao iniciar a refatoracao tecnica principal sem essa validacao fechada.

---

## Etapa 3: Diagnostico Tecnico do Motor Atual

### Objetivo

Documentar de forma objetiva por que o sistema atual falha e quais acoplamentos precisam ser eliminados.

### Atividades

- mapear toda a logica espalhada em contexts e modais;
- identificar pontos onde criacao, transicao, acao e notificacao ocorrem no frontend;
- listar falhas estruturais, por exemplo:
  - criacao em multiplas etapas;
  - regras de transicao dependentes da UI;
  - notificacao acoplada ao fluxo de tela;
  - status finais inferidos por heuristica;
  - roteamento disparando com dados incompletos;
- classificar riscos por severidade:
  - risco de dado;
  - risco de fluxo;
  - risco de notificacao;
  - risco de regressao.

### Entregaveis

- documento de diagnostico tecnico;
- lista priorizada de problemas estruturais;
- definicao do escopo minimo da refatoracao.

---

## Etapa 4: Desenho da Nova Arquitetura de Workflows

### Objetivo

Definir um motor de workflow server-side, modular, auditavel e testavel.

### Direcao recomendada

Manter o core em TypeScript e mover a orquestracao para backend/Cloud Functions, evitando criar um segundo runtime em Python para a regra principal do produto.

### Modulos sugeridos

- `WorkflowEngine`
  - responsavel por validacao de transicoes e progressao de status;
- `WorkflowRequestService`
  - responsavel por criacao, atualizacao e persistencia de solicitacoes;
- `WorkflowActionService`
  - responsavel por approvals, acknowledgements e executions;
- `WorkflowNotificationService`
  - responsavel por Connect + Slack;
- `WorkflowDefinitionValidator`
  - responsavel por impedir definicoes invalidas antes de publicacao;
- `WorkflowAuditService`
  - responsavel por historico tecnico e eventos auditaveis.

### Atividades

- definir modelo de eventos;
- definir contratos de entrada e saida;
- definir como o frontend passara a consumir o backend;
- definir estrategia de compatibilidade com os documentos atuais;
- definir onde armazenar metadados tecnicos sem poluir `formData`.

### Entregaveis

- blueprint tecnico da arquitetura;
- diagrama de componentes;
- contratos de dominio e responsabilidades por modulo.

---

## Etapa 5: Refatoracao do Fluxo de Criacao e Transicao

### Objetivo

Tirar a regra de negocio dos componentes React e centralizar a execucao do workflow no backend.

### Atividades

- substituir criacao em dois passos por fluxo atomico;
- mover validacao de transicao para o motor;
- impedir que a UI avance status por regra propria;
- tratar atribuicao, responsavel e pedidos de acao como casos de uso backend;
- preservar historico e consistencia de status;
- remover heuristicas perigosas do frontend.

### Entregaveis

- novo fluxo de criacao de solicitacao;
- novo fluxo de mudanca de status;
- novo fluxo de acao pendente;
- simplificacao dos modais para papel de coleta/exibicao.

---

## Etapa 6: Notificacoes Connect + Slack

### Objetivo

Garantir que toda notificacao prevista pelo workflow chegue de forma confiavel tanto no Connect quanto no Slack.

### Atividades

- mapear todos os eventos que hoje deveriam notificar;
- formalizar gatilhos de notificacao:
  - novo chamado recebido;
  - alteracao de responsabilidade;
  - pedido de aprovacao/ciencia;
  - conclusao ou mudanca de etapa relevante;
- definir destino no Slack:
  - DM por usuario;
  - canal por area;
  - ou modelo hibrido;
- resolver mapeamento entre usuario do Connect e identificador do Slack;
- implementar duplicacao de notificacao no `WorkflowNotificationService`;
- garantir retry, log e tratamento de falha.

### Entregaveis

- matriz de eventos de notificacao;
- integracao Slack via bot;
- logs e observabilidade de falhas de entrega.

---

## Etapa 7: Suite Intensiva de Testes

### Objetivo

Criar uma rede de seguranca real antes da migracao completa do motor.

### Camadas de teste

- testes unitarios do motor de workflow;
- testes unitarios das regras de transicao;
- testes de integracao dos casos de uso principais;
- testes de notificacao Connect + Slack;
- testes de regressao com cenarios reais por workflow critico;
- testes end-to-end para os fluxos mais sensiveis.

### Cenários minimos

- abertura de chamado;
- atribuicao e troca de responsavel;
- pedido de aprovacao;
- resposta de aprovacao;
- mudanca de status valida;
- tentativa de transicao invalida;
- finalizacao;
- envio de notificacao;
- falha de notificacao com tratamento previsivel.

### Entregaveis

- suite de testes automatizados;
- matriz de cobertura por workflow critico;
- checklist de regressao manual para homologacao.

---

## Etapa 8: Migracao Tecnica Gradual e Rollout

### Objetivo

Substituir o motor legado de forma controlada, sem big bang.

### Atividades

- introduzir feature flags ou chave de ativacao por workflow;
- ativar o motor novo por grupos de workflows;
- comparar comportamento antigo e novo durante a transicao;
- validar notificacoes e historico antes de ampliar o rollout;
- monitorar erros, tempos e falhas de entrega;
- manter plano de reversao operacional.

### Entregaveis

- estrategia de rollout;
- plano de contingencia;
- criterios de ampliacao e rollback.

---

## 4. Ordem Recomendada

1. Fechar a matriz funcional dos workflows ativos.
2. Fechar o diagnostico tecnico do motor atual.
3. Aprovar o blueprint da nova arquitetura.
4. Implementar notificacao e orquestracao backend por fatias.
5. Construir a suite de testes junto com a refatoracao, e nao depois.
6. Migrar workflow por workflow, com rollout progressivo.

---

## 5. Riscos Principais

- manter regra de negocio escondida no frontend durante a transicao;
- replicar no motor novo comportamentos errados do legado;
- tratar notificacao como detalhe e nao como parte do fluxo;
- subestimar diferencas entre definicao configurada e comportamento real;
- fazer migracao total sem cobertura de testes suficiente.

---

## 6. Criterios de Aceite do Projeto

- todo workflow ativo deve ter regra de negocio validada;
- nenhuma transicao critica deve depender da UI;
- toda notificacao prevista deve chegar no Connect e no Slack;
- o sistema deve bloquear definicoes invalidas antes de producao;
- a cobertura de testes deve proteger os cenarios principais;
- o rollout deve ocorrer de forma gradual e auditavel.

---

## 7. Proximo Passo Imediato

O proximo passo recomendado e iniciar a consolidacao da matriz funcional dos workflows ativos e fechar, com validacao de negocio, o comportamento esperado de cada fluxo antes de reescrever o motor tecnico.
