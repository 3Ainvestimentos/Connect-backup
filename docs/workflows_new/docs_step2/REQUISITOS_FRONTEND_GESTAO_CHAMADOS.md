# Requisitos de Frontend - Gestao de Chamados

## 1. Objetivo

Definir os requisitos funcionais e de experiencia da nova tela unificada de gestao de workflows, substituindo a separacao atual entre "Gestao de Solicitacoes" e "Minhas Tarefas/Acoes".

Este documento detalha:

- a estrutura da pagina;
- as abas e suas responsabilidades;
- as regras de visibilidade por perfil;
- as informacoes obrigatorias por item;
- o comportamento esperado do modal unificado de detalhes;
- os estados de UI necessarios antes da implementacao.

Documento base relacionado:

- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-03-23` | `Medium` | mantida a tela de abertura de chamado com estrutura atual, adicionando agrupamento mensal em `Minhas solicitacoes` do mais recente para o mais antigo |
| `2026-03-23` | `High` | criacao do documento de requisitos do frontend da tela unificada de gestao de chamados |

---

## 2. Problem Statement

O frontend atual distribui a operacao do workflow em telas separadas, o que fragmenta a experiencia do owner e do executor e nao representa corretamente o novo motor versionado orientado por etapas, atribuicoes e acoes pendentes.

---

## 3. Users

### 3.1. Owner / gestor de workflow

Pain points atuais:

- recebe chamados novos em uma tela separada da operacao de tarefas;
- precisa entrar em outra pagina para acompanhar atribuicoes e andamento operacional;
- hoje a fila mistura regra antiga de status linear com atribuicao manual;
- falta clareza imediata sobre quais itens aguardam atribuicao, resposta de terceiros ou acompanhamento.

### 3.2. Executor / responsavel pelo chamado

Pain points atuais:

- ve apenas a parte operacional da tarefa, dissociada da caixa de entrada do owner;
- nem sempre fica clara a etapa atual do chamado;
- a lista atual de tarefas nao comunica com precisao se o item e "atribuido a mim" ou "acao pendente para mim";
- a acao principal fica muito acoplada ao status atual da implementacao antiga.

### 3.3. Solicitante / cliente interno

Pain points atuais:

- ve o historico por um modal diferente do usado na operacao;
- a leitura da evolucao do chamado nao e padronizada com a visao do executor;
- nao ha um modelo unico de exibicao de etapas feitas, etapa atual e conclusao.

---

## 4. Goals

### MUST

- unificar a gestao operacional em uma unica tela chamada `Gestao de chamados`;
- manter 3 abas principais:
  - `Chamados atuais`
  - `Atribuicoes e acoes`
  - `Concluidas`
- garantir que a aba `Chamados atuais` represente a fila do owner;
- garantir que a aba `Atribuicoes e acoes` represente a fila operacional do usuario logado;
- manter `Concluidas` como historico operacional;
- remover a necessidade de agir diretamente pela lista com CTA tecnico como `Avancar fluxo`;
- centralizar a operacao no modal unificado de detalhes;
- exibir etapa atual e situacao operacional de forma clara em cada item;
- refletir a arquitetura nova por `currentStepId`, `statusKey`, `responsible`, `actionRequests` e historico;
- manter a diferenca entre `finalizado` e `arquivado`.

### SHOULD

- permitir filtros globais e por aba;
- destacar prioridade, SLA e responsabilidade atual;
- diferenciar visualmente itens aguardando atribuicao, aguardando acao e em execucao;
- permitir leitura rapida com cards ou tabela hibrida;
- manter coerencia visual com o ecossistema atual da 3A Riva.

### COULD

- permitir agrupamentos opcionais por workflow, area ou periodo;
- oferecer memorias de filtro por usuario;
- exibir indicadores de volume por aba.

### WON'T

- nao redesenhar neste documento a area administrativa de criacao de workflow;
- nao detalhar aqui a implementacao do motor backend;
- nao definir aqui regras de notificacao Slack/Connect em nivel de integracao tecnica.

---

## 5. Success Criteria

- owner consegue identificar, em ate 5 segundos, quais chamados aguardam atribuicao;
- executor consegue identificar, em ate 5 segundos, quais itens estao atribuidos a ele e quais sao acoes pendentes;
- usuario nao precisa trocar entre paginas diferentes para operar workflows ativos;
- cada item da lista comunica etapa atual, situacao operacional e responsavel atual;
- toda acao operacional relevante ocorre no modal, nao na listagem;
- a aba `Concluidas` funciona como historico claro, sem se confundir com fila ativa;
- a diferenca entre `concluido` e `arquivado` fica explicita na UI.

### Clarity Score

`14/15`

Motivo:

- a direcao funcional da tela ja esta bem definida;
- ainda ha detalhes de filtro e ordenacao para fechamento fino na fase de design tecnico.

---

## 6. Escopo Tecnico

### Frontend

- nova pagina unificada de gestao;
- consolidacao das visoes hoje separadas de owner e executor;
- novo contrato visual para cards/linhas;
- novo modal unificado de detalhes;
- filtros, busca, estados vazios, loading e erro;
- regras de visibilidade por permissao e papel operacional.

### Backend / dados dependentes

- leitura de `workflowTypeId`, `workflowVersion`, `currentStepId` e `statusKey`;
- leitura de `responsible`, `stepStates`, `actionRequests`, `history`, `isArchived`;
- leitura de `ownerEmail` vigente no chamado;
- endpoint ou camada de consulta que retorne dados prontos para a listagem por aba.

### Database

- depende do modelo versionado documentado em `workflowTypes`, `workflowTypes/{workflowTypeId}/versions/{version}` e `workflows`.

### AI

- fora do escopo para a tela base.

---

## 7. Auth Requirements

### Aba `Chamados atuais`

- visivel apenas para usuarios que sao owner de pelo menos um workflow.

### Aba `Atribuicoes e acoes`

- visivel para todos os usuarios que participam do fluxo operacional.

### Aba `Concluidas`

- visivel para os usuarios que tiverem acesso a pelo menos uma das filas ativas.
- a listagem deve respeitar o escopo do usuario:
  - owner ve concluidos do seu escopo de ownership;
  - executor ve concluidos do seu escopo de atribuicao/acao;
  - a forma exata da unificacao pode ser resolvida na camada de consulta.

---

## 8. Informacao Arquitetural da Tela

### Nome da pagina

`Gestao de chamados`

### Estrutura principal

1. cabecalho com titulo da tela;
2. busca e filtros globais;
3. tabs principais;
4. conteudo da aba atual;
5. modal de detalhes acionado por `Abrir`.

### Regra de navegacao

- a tela substitui a navegacao mental de duas paginas diferentes;
- o usuario deve entender que esta em uma unica central operacional;
- a nomenclatura antiga de "Gestao de Solicitacoes" e "Gestao de Tarefas" nao deve ser preservada como identidade da pagina.

---

## 9. Requisitos da Aba `Chamados atuais`

### Papel

Fila do owner/gestor.

### Conteudo

- chamados novos recebidos pela area;
- chamados ativos ainda sob controle do owner;
- chamados aguardando atribuicao;
- chamados aguardando acompanhamento do owner;
- chamados aguardando retorno de acao solicitada a terceiro, quando isso ainda exigir acompanhamento do owner.

### Visibilidade

- apenas users owners.

### Informacoes minimas por item

- `requestId`
- nome do workflow
- solicitante
- data de abertura
- etapa atual
- `statusKey` ou situacao operacional equivalente
- responsavel atual
- SLA / prazo, se aplicavel

### Acoes permitidas na listagem

- `Abrir`
- opcionalmente `Atribuir`, `Reatribuir` ou `Assumir`, se isso fizer sentido sem abrir o modal

### Acoes que nao devem existir na listagem

- `Avancar fluxo`
- mudanca direta de etapa
- conclusao direta sem abrir detalhes

### Filtros sugeridos

- todos
- aguardando atribuicao
- em andamento
- aguardando acao
- com SLA em risco

---

## 10. Requisitos da Aba `Atribuicoes e acoes`

### Papel

Fila operacional do usuario logado.

### Conteudo

- chamados atribuidos ao usuario;
- pedidos de aprovacao/reprovacao;
- pedidos de ciente;
- pedidos de execucao;
- itens aguardando resposta do proprio usuario.

### Diferenciacao obrigatoria

A UI deve separar claramente:

- `Atribuido a mim`
- `Acao pendente para mim`

Essa separacao pode ser feita por:

- subtabs;
- agrupamento com secoes;
- chips/filtros;
- ou combinacao dos itens acima.

### Informacoes minimas por item

- `requestId`
- nome do workflow
- solicitante
- etapa atual
- situacao operacional
- tipo de pendencia:
  - atribuicao
  - aprovacao
  - ciente
  - execucao
- prazo / SLA, se aplicavel

### CTA principal

- `Abrir`

---

## 11. Requisitos da Aba `Concluidas`

### Papel

Historico operacional.

### Objetivo

Permitir consulta de itens encerrados sem competir visualmente com a operacao ativa.

### Regras

- deve ser uma aba principal, por decisao de produto;
- nao deve parecer uma fila ativa;
- deve permitir agrupamento por periodo ou filtros simples;
- deve deixar clara a diferenca entre:
  - `Concluido`
  - `Arquivado`

### Informacoes minimas por item

- `requestId`
- nome do workflow
- solicitante
- data de conclusao
- etapa final
- responsavel final, quando fizer sentido
- label de encerramento:
  - `Concluido`
  - `Arquivado`

### CTA principal

- `Abrir`

### Observacao visual

- o ritmo visual da aba pode ser mais leve e consultivo que o das abas ativas;
- ainda assim, a tela deve permanecer coerente com o restante da pagina.

---

## 12. Requisitos do Card / Linha de Item

Cada item da lista deve comunicar rapidamente:

- o que e o chamado;
- em que etapa ele esta;
- qual a situacao operacional;
- quem precisa agir;
- qual o nivel de urgencia.

### Campos obrigatorios

- `requestId`
- nome do workflow
- nome do solicitante
- data principal do item
- etapa atual
- `statusKey` ou representacao equivalente
- responsavel atual

### Campos recomendados

- SLA / prazo
- badge de urgencia
- area do workflow
- tipo de pendencia

### Regra de linguagem

Evitar cards que mostrem apenas:

- `Pendente`
- `Em analise`
- `Concluido`

sem contexto.

O ideal e mostrar:

- etapa atual
- situacao operacional

Exemplo:

- Etapa atual: `Analise do gerente`
- Situacao: `Aguardando atribuicao`

Outro exemplo:

- Etapa atual: `Pedir ao BI`
- Situacao: `Acao pendente com terceiro`

---

## 13. Requisitos do Modal Unificado de Detalhes

### Objetivo

Unificar a visualizacao do chamado para cliente e executor, mudando apenas o que cada perfil pode operar.

### O que todo perfil deve ver

- cabecalho do chamado
- dados principais do solicitante
- dados do formulario
- historico completo
- timeline / lista de etapas do chamado
- etapa atual destacada
- etapas feitas vs nao feitas

### O que apenas perfis operacionais veem

- secao de atribuicao
- secao de solicitacao de acao
- botoes de sequencia / acao

### O que o cliente nao ve

- controles operacionais
- botoes de atribuicao
- botoes de sequencia
- acoes pendentes internas de operacao

### Regra importante

O CTA principal da listagem abre este modal.

O modal e a unidade principal de operacao do workflow.

---

## 14. Especificacao Funcional do Modal

### 14.1. Estrutura base unica

O modal deve ter a mesma base estrutural para:

- cliente;
- responsavel;
- owner, quando aplicavel.

Estrutura recomendada:

1. cabecalho com identificacao do chamado;
2. bloco de metadados principais;
3. bloco `Dados da solicitacao`;
4. bloco `Etapas do chamado`;
5. bloco `Historico`;
6. bloco `Operacao`, apenas para perfis operacionais;
7. rodape com acao de fechar.

### 14.2. Cabecalho

O cabecalho deve comunicar:

- titulo `Detalhes da solicitacao`;
- `requestId`;
- identificacao do tipo do chamado ou nome do workflow;
- variacao de contexto por perfil, quando fizer sentido.

Exemplos:

- `Detalhes da solicitacao #0700`
- `Detalhes da solicitacao #0700 - Responsavel`

### 14.3. Metadados principais

Os metadados superiores devem priorizar leitura operacional.

Campos recomendados:

- solicitante;
- responsavel atual;
- tipo do chamado;
- data de abertura;
- ultima atualizacao;
- tempo de conclusao previsto.

Regra de hierarquia:

- `Ultima atualizacao` deve aparecer antes de `Tempo de conclusao previsto`, por ser mais util para leitura rapida da operacao.
- usar `Data de abertura` em vez de apenas `Data`.

### 14.4. Dados da solicitacao

Esse bloco mostra o conteudo do formulario enviado pelo solicitante.

Requisitos:

- manter leitura simples e limpa;
- preservar ordem relevante dos campos;
- suportar campos longos e multilinha;
- permitir visualizacao consistente para cliente e responsavel.

### 14.5. Etapas do chamado

Esse bloco deve ser separado do historico.

Objetivo:

- mostrar a progressao simplificada do workflow;
- destacar etapa atual;
- indicar etapas concluidas, atual e pendentes;
- refletir o modelo novo baseado em `stepOrder`, `stepsById` e `currentStepId`.

Requisitos:

- exibir o nome da etapa;
- exibir estado visual da etapa:
  - concluida
  - atual
  - pendente
- manter linguagem simples para o cliente;
- nao expor logica operacional interna de atribuicoes e acoes nesse bloco.

### 14.6. Historico

Esse bloco registra eventos operacionais e comentarios.

Pode conter:

- criacao do chamado;
- entrada em etapa;
- alteracao de responsavel;
- solicitacao de acao;
- resposta de acao;
- comentarios;
- finalizacao;
- arquivamento.

Requisitos:

- ordenar do mais antigo para o mais recente ou vice-versa, mas manter consistencia;
- identificar claramente data/hora e evento;
- separar visualmente comentario livre de evento sistemico;
- nao misturar o bloco de historico com o bloco de etapas.

### 14.7. Visao do cliente

O cliente deve ver:

- cabecalho;
- metadados;
- dados da solicitacao;
- etapas do chamado;
- historico;
- botao `Fechar`.

O cliente nao deve ver:

- atribuicao de responsavel;
- reatribuicao;
- comentario operacional interno;
- botoes de sequencia do fluxo;
- controles de acao.

### 14.8. Visao do responsavel

O responsavel deve ver a mesma base do cliente, mais uma secao adicional de operacao.

Essa secao deve ficar abaixo de `Historico` e antes do rodape.

Campos e controles recomendados:

- campo de comentario ja aberto por padrao;
- acao de atribuir ou reatribuir responsavel;
- acao principal contextual do fluxo;
- visualizacao de acoes pendentes, quando existirem.

### 14.9. Comentario operacional

Na visao do responsavel, `Adicionar comentario` nao deve depender apenas de um botao que abre um formulario oculto.

Recomendacao:

- manter um campo de texto ja visivel;
- manter o botao de envio associado ao campo;
- permitir comentario rapido sem clique extra.

### 14.10. Acoes contextuais

Evitar o uso de um CTA generico como `Avancar fluxo`.

As acoes do modal devem refletir o estado real do chamado.

Exemplos de labels preferiveis:

- `Concluir etapa`
- `Solicitar acao`
- `Responder acao`
- `Finalizar chamado`
- `Atribuir`
- `Reatribuir`

Regra:

- se o chamado estiver finalizado, o modal nao deve exibir botoes de sequencia;
- se nao houver responsavel definido, mostrar `Atribuir`;
- se ja houver responsavel, mostrar `Reatribuir`.

### 14.11. Diferenca entre chamado ativo e finalizado

O mock operacional do responsavel deve representar um chamado ativo.

Nao faz sentido exibir:

- etapa final concluida;
- junto com botoes operacionais de sequencia.

Requisito:

- chamadas finalizadas exibem leitura historica;
- chamadas ativas exibem secao operacional;
- chamadas arquivadas continuam visiveis, mas sem operacao de fluxo.

### 14.12. Rodape

Acao minima:

- `Fechar`

Outras acoes devem estar na secao `Operacao`, nao soltas no rodape.

---

## 15. Requisitos de Estado de UI

### Loading

- skeletons ou placeholders coerentes com a listagem

### Empty state

- mensagem diferente por aba
- sem texto generico demais

Exemplos:

- `Nenhum chamado aguardando atribuicao`
- `Voce nao possui acoes pendentes`
- `Nenhum item concluido neste periodo`

### Error state

- mensagem clara
- opcao de tentar novamente

### High volume state

- pagina precisa suportar listas grandes sem perder legibilidade
- filtros e busca devem continuar visiveis

---

## 16. Requisitos de Busca e Filtros

### Busca global sugerida

- por `requestId`
- por nome do workflow
- por nome do solicitante

### Filtros recomendados

- workflow
- area
- situacao operacional
- SLA
- periodo

### Regra de design

- filtros globais ficam acima das abas ou imediatamente abaixo do titulo;
- filtros especificos de cada aba podem ficar dentro do conteudo da aba.

---

## 17. Requisitos de Linguagem e Nomenclatura

### Nomes fechados para a pagina

- `Gestao de chamados`
- `Chamados atuais`
- `Atribuicoes e acoes`
- `Concluidas`

### Nomes a evitar como identidade principal

- `Gestao de Solicitacoes`
- `Gestao de Tarefas`

### CTA principal

- `Abrir`

CTA a evitar como principal na listagem:

- `Avancar fluxo`

---

## 18. Requisitos da Tela de Abertura do Chamado

### Direcao geral

A tela de abertura de chamado pode permanecer muito proxima da experiencia atual.

Isso significa manter:

- o cabecalho da pagina de solicitacoes;
- a navegacao por areas;
- o acionamento do modal de abertura do workflow;
- a secao `Minhas solicitacoes` na mesma pagina.

### Ajuste principal aprovado

A secao `Minhas solicitacoes` deve passar a agrupar os chamados por mes, do mais recente para o mais antigo.

### Regra de agrupamento

Assumir como referencia principal a data de abertura do chamado.

Campo recomendado:

- `submittedAt`

Ordenacao esperada:

1. grupos mensais mais recentes primeiro;
2. dentro de cada grupo, chamados mais recentes primeiro.

Exemplo:

- Marco 2026
- Fevereiro 2026
- Janeiro 2026

### Estrutura sugerida da secao

Cada grupo mensal deve conter:

- titulo do mes e ano;
- lista ou tabela dos chamados daquele periodo;
- opcionalmente quantidade de itens no grupo.

### Informacoes minimas por linha

- `requestId`
- tipo / nome do workflow
- etapa atual ou status operacional equivalente
- previsao de conclusao, quando aplicavel
- acao `Abrir`

### Observacoes funcionais

- a tela de abertura nao precisa ser redesenhada do zero nesta fase;
- o foco principal continua sendo a abertura de novos chamados e o acompanhamento pessoal do solicitante;
- o agrupamento mensal melhora leitura historica sem mudar a logica principal da pagina.

---

## 19. Out of Scope

- detalhamento da implementacao backend do motor;
- modelagem de notificacoes Slack/Connect;
- regras de publicacao de versao no admin;
- redesign da tela administrativa de definicao de workflow.

---

## 20. Proximos Passos

1. transformar este documento em design tecnico da tela;
2. fechar contrato de dados consumido por cada aba;
3. desenhar wireframe definitivo da pagina e do modal unificado;
4. definir estrategia de migracao das telas atuais para a nova experiencia;
5. iniciar implementacao do frontend.
