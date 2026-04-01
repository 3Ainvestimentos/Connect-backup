# DEFINE: FASE 2A - Front Oficial da Tela Integrada

> Generated: 2026-03-31
> Status: Approved for design
> Scope: Fase 2 / 2A - Construcao do frontend oficial da tela integrada de gestao de chamados
> Base roadmap: `docs/workflows_new/fase2/ROADMAP_FASE2.md`

## 1. Problem Statement

O piloto da Fase 1 validou o motor novo ponta a ponta, mas a experiencia ainda vive em uma superficie de piloto com limitacoes conhecidas de detalhe, anexos, filtros e governanca de visibilidade; a Fase 2A precisa transformar essa base em uma **tela oficial integrada de produto**.

### 1.1. Estrategia de execucao da macroetapa

A 2A continua sendo uma macroetapa unica, mas sua execucao deve ser dividida em sub-builds para manter a janela de contexto controlada e permitir validacao incremental sem inflar um unico rollout.

Sub-builds fechados para a 2A:

- **2A.1** Entrada oficial + shell da nova rota
  - criar `/gestao-de-chamados`
  - criar namespace `workflows/management/*`
  - adicionar entrada no dropdown do usuario
  - montar shell inicial da nova tela
  - manter legado intacto
- **2A.2** Bootstrap + listas oficiais
  - `management/bootstrap`
  - filtros oficiais nas listas
  - `current`, `assignments`, `completed`
  - subtabs de `Atribuicoes e acoes`
  - URL state + toolbar
- **2A.3** Detalhe rico do request
  - `GET /read/requests/[requestId]`
  - `formData`
  - anexos
  - progresso
  - timeline
  - modal oficial
- **2A.4** Polimento e rollout controlado
  - acabamento visual
  - estados vazios/falha/loading refinados
  - hardening
  - decisao de convivencia no dropdown
  - smoke final e readiness para substituir o fluxo principal

---

## 2. Users

### 2.1. Owner / gestor de workflow

Pain points herdados do piloto:

- opera em uma UI funcional, mas ainda com cara e limites de piloto;
- precisa de uma fila oficial para chamados do seu escopo;
- precisa abrir o detalhe do chamado com dados mais completos, incluindo formulario e historico;
- precisa distinguir melhor o que exige atribuicao, acompanhamento e encerramento.

### 2.2. Executor / responsavel pelo chamado

Pain points herdados do piloto:

- a aba operacional ainda mistura visualmente itens atribuidos e itens com acao pendente;
- o detalhe do chamado nao mostra linha do tempo completa nem contexto rico da solicitacao;
- anexos ainda nao aparecem como parte oficial da experiencia.

### 2.3. Solicitante / cliente interno

Pain points herdados do piloto:

- a visao de detalhe ainda e limitada a metadados operacionais;
- campos submetidos e anexos nao estao expostos oficialmente no modal;
- a experiencia atual ainda comunica “piloto”, nao “produto”.

### 2.4. Time de produto / operacao

Pain points herdados do piloto:

- a base foi validada, mas ainda nao existe a tela oficial para rollout ampliado;
- as pendencias de detalhe de request e visibilidade por papel ainda precisam de decisao formal;
- a Fase 2 precisa evitar que o frontend oficial apenas replique a UI piloto com novo visual.

---

## 3. Goals

### MUST

- substituir a experiencia piloto por uma **tela oficial integrada de gestao de chamados**;
- executar a 2A em sub-builds incrementais sem perder coerencia da macroetapa;
- manter a operacao centralizada em uma unica superficie;
- exibir detalhe rico do request, incluindo:
  - metadados operacionais;
  - `formData` submetido;
  - timeline/historico de eventos;
  - progresso nas etapas;
  - anexos quando existirem;
- manter as visoes principais da operacao:
  - `Chamados atuais`
  - `Atribuicoes e acoes`
  - `Concluidas`
- definir regra formal de visibilidade da aba `Chamados atuais`;
- separar explicitamente `Atribuido a mim` de `Acao pendente para mim`;
- suportar busca e filtros oficiais, sem depender apenas do filtro local do piloto;
- tratar o frontend oficial como camada principal, nao como extensao de `pilot/*`.

### SHOULD

- promover componentes, contratos e helpers realmente reutilizaveis do piloto;
- manter navegacao por workflow coerente com o que foi validado na Fase 1;
- melhorar a leitura visual de SLA, prioridade, ownership e situacao operacional;
- garantir transicao segura entre a superficie piloto e a oficial.

### COULD

- introduzir memorias de filtro por usuario;
- oferecer visoes de agrupamento opcionais por workflow ou periodo;
- exibir indicadores agregados por aba e por workflow.

### WON'T

- nao cadastrar os 30 workflows restantes nesta macroetapa;
- nao construir a tela administrativa de versoes/configuracao nesta macroetapa;
- nao redesenhar o motor backend base validado na Fase 1;
- nao introduzir notificacoes ou automacoes externas como parte do escopo principal.

---

## 4. Success Criteria

- owner consegue identificar em ate 5 segundos o que exige atribuicao no seu escopo oficial;
- executor consegue distinguir em ate 5 segundos o que esta atribuido a ele vs. o que depende de acao pendente;
- o modal oficial de detalhe exibe `formData`, timeline e anexos sem depender de leitura manual no Firestore;
- a experiencia principal de gestao de chamados deixa de depender de `/pilot/*`;
- busca por `requestId`, workflow e solicitante funciona de forma confiavel no volume esperado para operacao oficial;
- filtros por area, SLA e periodo funcionam sem degradar a usabilidade;
- a tela oficial opera corretamente com os 3 workflows validados na Fase 1 como baseline.

### Clarity Score

`14/15`

Motivo:

- a direcao de produto e de arquitetura ja esta clara;
- os maiores pontos que estavam em aberto na passagem Fase 1 -> Fase 2A foram fechados neste documento;
- detalhes finos de interacao e layout ficam para o design.

---

## 5. Technical Scope

### Frontend

- nova rota oficial de gestao de chamados em `/gestao-de-chamados`;
- nova tela integrada oficial;
- entrada da nova rota no menu do usuario, na secao de ferramentas;
- tabs, filtros, busca, estados vazios, loading e erro;
- modal oficial de detalhes;
- visualizacao de anexos;
- separacao explicita da fila operacional;
- reutilizacao seletiva do que nasceu em `pilot/*`.

### Backend / dados dependentes

- manter os endpoints de listagem herdados da Fase 1 para as filas resumidas;
- adicionar um **contrato de detalhe rico** do request para suportar modal oficial;
- suportar busca e filtros estruturantes no servidor para a tela oficial;
- expor informacao explicita de escopo de ownership para governar visibilidade da aba `Chamados atuais`.

### Database

- continua baseado em:
  - `workflowTypes_v2`
  - `workflowTypes_v2/{workflowTypeId}/versions/{version}`
  - `workflows_v2`
- sem mudar a fundacao do modelo;
- com enriquecimentos de leitura quando necessarios para o front oficial.

### AI

- fora do escopo da 2A.

---

## 6. Auth Requirements

### 6.1. Aba `Chamados atuais`

Fica fechado que a aba `Chamados atuais` sera exibida **apenas para usuarios com escopo de ownership explicito**.

Esta decisao **nao** sera inferida por fila vazia.

Direcao fechada:

- a 2A precisa de um payload ou bootstrap de permissao que informe se o usuario possui ownership em pelo menos um workflow/area;
- a UI usa esse sinal explicito para mostrar ou esconder a aba;
- a query da fila continua respeitando authz no backend, mas visibilidade de tab nao depende de “deu vazio”.

### 6.2. Demais filas

- `Atribuicoes e acoes` e `Concluidas` continuam visiveis conforme o escopo operacional do usuario;
- o detalhe do chamado deve respeitar authz do request e nao apenas authz de listagem.

---

## 7. Decisoes Funcionais Fechadas

### 7.0. Posicionamento de `Minhas solicitacoes`

Fica fechado que `Minhas solicitacoes` **nao** fara parte da tela oficial `/gestao-de-chamados` como quarta aba operacional.

Decisao:

- `Minhas solicitacoes` permanece na mesma superficie de abertura de chamado;
- a 2A foca a central operacional oficial;
- a experiencia do solicitante continua separada da experiencia principal de operacao.

Motivo:

- evita misturar em uma mesma rota a central operacional e a tela de abertura/acompanhamento do solicitante;
- preserva a organizacao mental validada ate aqui para quem apenas abre e acompanha chamados;
- reduz escopo da 2A sem impedir reutilizacao futura de componentes e contratos.

### 7.1. `formData` no modal oficial

Fica fechado que a 2A **nao** vai tentar enriquecer o read-side de lista com `formData`.

Decisao:

- listagens resumidas continuam leves e focadas em dados operacionais;
- o frontend oficial passa a consumir um **endpoint/contrato separado de detalhe** para abrir o modal;
- esse detalhe rico deve incluir:
  - `formData`;
  - metadados operacionais;
  - responsavel atual;
  - ownership;
  - dados necessarios para renderizar anexos.

Motivo:

- evita inflar as queries resumidas;
- separa corretamente listagem vs. detalhe;
- fecha a divergencia detectada na Fase 1 de forma arquiteturalmente limpa.

### 7.2. Historico e timeline

Fica fechado que timeline e progresso de etapas tambem pertencem ao **contrato de detalhe rico**, nao ao read-side flat de lista.

O payload de detalhe da 2A precisa incluir o suficiente para renderizar:

- historico cronologico de eventos;
- etapa atual;
- progresso de etapas;
- mapeamento minimo das etapas da versao publicada usada pelo request.

Direcao:

- a UI oficial nao fara leitura manual direta de `workflows_v2`;
- o backend entrega um payload pronto para o modal.

### 7.3. Separacao `Atribuido a mim` vs. `Acao pendente para mim`

Fica fechado que a aba `Atribuicoes e acoes` passara a ter **segmentacao explicita dentro da propria aba**, e nao apenas diferenciacao visual solta na mesma lista.

Decisao funcional:

- a aba tera duas subvisoes claras:
  - `Atribuidos a mim`
  - `Acoes pendentes para mim`
- a implementacao especifica de UX fica para o design:
  - subtabs, segmented control ou chips persistentes
- mas a separacao semantica deixa de ser opcional.

Base de dados ja disponivel:

- `responsibleUserId`
- `pendingActionTypes`

### 7.4. Busca e filtros oficiais

Fica fechado que a 2A **nao** dependera de filtragem puramente client-side para busca e filtros estruturantes.

Decisao:

- busca por `requestId`, workflow e solicitante e responsabilidade do backend/query-side;
- filtros por area, SLA e periodo tambem entram como filtros estruturantes de servidor;
- filtros cosmeticos ou de escopo local da tela podem continuar client-side.

Regra pratica:

- **query-side** para qualquer filtro que reduza dataset primario ou que dependa de volume operacional real;
- **client-side** apenas para toggles locais sobre resultados ja carregados.

### 7.5. Anexos no frontend oficial

Fica fechado que a 2A deve tratar anexos como parte da experiencia oficial de detalhe.

Isso inclui:

- exibir links ou componentes de acesso ao anexo;
- lidar com campo `file` obrigatorio e opcional;
- tratar a leitura como uso oficial, e nao apenas validacao por Firestore ou URL externa.

### 7.6. Estrategia de transicao da rota piloto

Fica fechado que a rota piloto **nao** sera removida imediatamente no inicio da 2A.

Decisao:

- a nova superficie oficial nasce em `/gestao-de-chamados`;
- a nova rota entra no dropdown do usuario, na secao de ferramentas;
- a sidebar continua apontando apenas para a superficie de abertura de chamados;
- `/pilot/facilities` permanece temporariamente disponivel durante a transicao;
- `Gestao de Solicitacoes` e `Minhas Tarefas/Acoes` permanecem disponiveis durante a transicao;
- os arquivos, componentes e rotas legadas nao serao excluidos na 2A;
- a substituicao definitiva das superfices legadas sera tratada como passo posterior de rollout seguro, apos testes end-to-end, e nao como precondicao para concluir o primeiro build da 2A.

Motivo:

- reduz risco operacional durante a migracao para a tela oficial;
- preserva um fallback controlado enquanto a nova superficie estabiliza;
- evita corte brusco para usuarios internos que ainda estejam habituados ao piloto e as telas operacionais antigas.

---

## 8. Out of Scope

- mover `Minhas solicitacoes` para dentro da rota operacional oficial;
- migracao dos outros ~30 workflows;
- criacao da tela administrativa de workflows;
- editor de versoes;
- redesign do modelo de dados central;
- mecanismos avancados de busca full-text fora do necessario para a tela oficial;
- reatribuicao complexa ou novos fluxos de aprovacao alem do que ja existe hoje.

---

## 9. Dependencias Herdadas da Fase 1

Este define assume como prerequisito concluido:

- [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_FASE1_FACILITIES.md)
- [implementation_progress_fase1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/implementation_progress_fase1.md)
- [implementation_progress_fase1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/implementation_progress_fase1.md)

Em especial, a 2A herda como base validada:

- 3 workflows operando na mesma superficie;
- upload com signed URL;
- filas resumidas funcionando;
- atribuir, finalizar e arquivar funcionando;
- contratos de catalogo e runtime estabilizados para o recorte piloto.

## 9.1. Dependencias internas da 2A

As subetapas da 2A devem respeitar a seguinte ordem:

1. `2A.1` estabelece rota, namespace e entrada de navegacao
2. `2A.2` estabelece bootstrap, filtros e listas oficiais
3. `2A.3` adiciona detalhe rico ao modal oficial
4. `2A.4` consolida acabamento, hardening e readiness de rollout

Regra:

- `2A.3` nao deve iniciar sem `2A.2` fechado;
- `2A.4` nao deve ser usada para absorver backlog estrutural de `2A.1` a `2A.3`.

---

## 10. Frontend Scope Boundaries

### Incluido

- nova experiencia oficial de gestao;
- reestruturacao da superficie hoje concentrada em `pilot/facilities`;
- refinamento de lista, tabs, busca, filtros e modal;
- consumo de payload de detalhe rico;
- visualizacao de anexos.

### Excluido

- redesenho da experiencia administrativa;
- onboarding dos workflows restantes;
- consolidacao completa de todos os modulos `pilot/*` em uma unica camada compartilhada, salvo o que a 2A precisar promover explicitamente.
- remocao de arquivos, componentes ou rotas legadas durante o primeiro rollout da 2A.

---

## 11. Backend Scope Boundaries

### Incluido

- enriquecimentos necessarios para detalhe rico;
- suporte de permissao explicita para ownership;
- suporte de busca e filtros estruturantes para a tela oficial.

### Excluido

- mudanca de runtime base de abertura/transicao/finalizacao;
- reescrita do read-side inteiro;
- reabertura da Fase 1.

---

## 12. Aceite da Macroetapa

A 2A sera considerada pronta para design quando estiver claro que:

- a experiencia oficial e uma nova superficie principal, nao apenas o piloto com skin nova;
- `Minhas solicitacoes` segue fora da central operacional da 2A;
- listagem e detalhe usam contratos distintos quando necessario;
- a divergencia de `formData` e timeline ficou resolvida em nivel de produto/backend;
- visibilidade de ownership nao depende de fila vazia;
- separacao da fila operacional ficou decidida;
- busca e filtros estruturantes ficaram decididos como responsabilidade de backend;
- a estrategia de convivencia temporaria entre `/gestao-de-chamados` e as superfices legadas ficou explicita;
- a navegacao da nova superficie ficou posicionada no menu do usuario, sem substituir a sidebar de abertura de chamados.

Para inicio de build, cada sub-build da 2A deve ser executado com define/design ou plano tecnico compativel com o seu recorte proprio.

---

## 13. Fonte de Verdade

Este documento deriva de:

- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)
- [ROADMAP_ETAPAS_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_ETAPAS_FASE2.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)
- [implementation_progress_fase1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/implementation_progress_fase1.md)

Em caso de divergencia:

1. prevalece este `DEFINE` para escopo e aceite da 2A;
2. depois prevalecem os documentos estruturantes de `docs_step2`;
3. o `DESIGN` da 2A nao pode reabrir as decisoes fechadas aqui sem novo iterate.
