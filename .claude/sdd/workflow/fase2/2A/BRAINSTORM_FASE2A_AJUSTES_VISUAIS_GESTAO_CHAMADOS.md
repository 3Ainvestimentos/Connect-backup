# BRAINSTORM: FASE 2A - Ajustes Visuais da Tela `/gestao-de-chamados`

> Generated: 2026-04-01
> Status: Brainstorm active
> Scope: Fase 2 / 2A - rodada de ajustes visuais e refinamentos leves de UX na tela oficial de gestao de chamados
> Context base: `DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Contexto consolidado

Esta sessao de brainstorm parte do estado atual da `2A` ja implementada:

- a rota oficial `/gestao-de-chamados` ja existe e esta funcional;
- bootstrap, listas, filtros, detalhe rico e rollout controlado ja foram entregues;
- a rodada atual **nao** quer reabrir backend, read model ou contratos;
- o foco agora e **visual / UX**, com possibilidade de pequenos refinamentos estruturais de layout **desde que aprovados antes do build**;
- o objetivo e aproximar a tela da **linguagem visual existente da aplicacao**, e nao inaugurar uma nova identidade visual.

Escopo explicitamente fora desta rodada:

- qualquer mudanca de contrato backend;
- mexer na `2B`;
- substituir ou limpar artefatos legados;
- redesign amplo da arquitetura da tela;
- inventar nova linguagem visual desconectada do restante da aplicacao.

## 2. Perguntas feitas e respostas fechadas

### 2.1. Onde essa rodada se aplica?

Resposta fechada:

- apenas na rota `/gestao-de-chamados`.

### 2.2. Pode haver refinamento estrutural?

Resposta fechada:

- sim, mas apenas refinamentos pequenos;
- qualquer alteracao estrutural precisa de aprovacao previa.

### 2.3. Qual direcao visual queremos?

Resposta fechada:

- a tela deve ficar mais proxima da linguagem visual das paginas existentes da aplicacao;
- nao e a hora de empurrar uma linguagem “mais premium” que se afaste demais do padrao atual.

## 3. Achados no codigo atual

### 3.1. Tom exato de verde-agua ja existe no projeto

O tom pedido no print ja esta canonizado no codigo como:

- `hsl(var(--admin-primary))`

Valor encontrado:

- `--admin-primary: 170 60% 50%`

Fontes encontradas:

- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/globals.css`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/docs_legadas/DESIGN_GUIDELINES.md`

Uso recorrente no projeto:

- `className="bg-admin-primary hover:bg-admin-primary/90"`
- `text-admin-primary`
- `bg-admin-primary/10`

Conclusao:

- esta rodada **nao deve inventar um novo verde**;
- o highlight visual pedido deve usar o token existente `admin-primary`.

### 3.2. A tela oficial ainda carrega blocos de transicao que agora viraram ruido

Hoje a pagina ainda exibe:

- badges de contexto do ator / filtros / ownership;
- bloco textual de “Fase 2A.4 / URL state oficial ativo / convivio controlado...”;
- explicacoes de transicao que foram uteis para a estabilizacao, mas deixam a tela com cara de build tecnico.

Conclusao:

- esses blocos fazem sentido para implementacao e rollout, mas nao para a UX diaria;
- remover isso aumenta clareza sem custo funcional.

### 3.3. A toolbar atual ainda esta “acima da experiencia”

Hoje o filtro esta em um card proprio, separado das tabs.

Impacto visual:

- a pagina abre com muita massa de contexto antes da area central;
- o filtro compete com o header em vez de apoiar a navegacao principal;
- a estrutura fica mais proxima de console tecnico do que das paginas mais maduras do sistema.

### 3.4. A aba de concluidas ainda nao reforca bem a leitura por periodo

Hoje os grupos por mes existem, mas o modelo atual nao usa sanfona.

Impacto:

- a pagina pode ficar longa demais conforme o historico crescer;
- o agrupamento por mes fica correto semanticamente, mas pouco controlado visualmente;
- o mes mais recente nao recebe destaque operacional automatico.

## 4. Inputs fechados para esta rodada

### 4.1. Botoes de destaque

Fechado:

- botoes internos com destaque devem usar o mesmo verde-agua da aplicacao;
- o token certo e `admin-primary`.

Direcao pratica:

- CTA primario: `bg-admin-primary hover:bg-admin-primary/90`
- destaque sutil: `bg-admin-primary/10 text-admin-primary`

### 4.2. Remocao de blocos de rollout

Fechado:

- remover a secao com o conteudo de bootstrap/ator/filtros/ownership;
- remover a secao de transicao com “Fase 2A.4”, URL state, modal aberto e copy de convivencia.

Leitura:

- isso e limpeza de UX, nao perda funcional.

### 4.3. Filtro dentro da area das tabs

Fechado:

- o controle de filtro deve viver junto da area das tres tabs;
- o gatilho deve ser um botao minimalista;
- o painel de filtros deve abrir como um modal/painel delicado conectado ao botao;
- deve existir um CTA final de “confirmar filtro”;
- filtros ativos devem aparecer de forma delicada ao lado do botao, sem chamar mais atencao do que as tabs.

### 4.4. Concluidas em sanfona

Fechado:

- os agrupamentos por mes devem usar modelo sanfona;
- o mes mais recente deve abrir por padrao;
- os meses anteriores devem iniciar fechados.

## 5. Abordagens possiveis

### Abordagem A - Polish minimo, baixissimo risco

O que faz:

- troca os CTAs para `admin-primary`;
- remove os dois blocos de rollout;
- move o filtro para perto das tabs, mas ainda como card simples inline;
- transforma concluidas em accordion basica.

Vantagens:

- build rapido;
- risco baixo de regressao;
- mexe pouco em estrutura.

Desvantagens:

- resolve o problema de ruido, mas nao melhora tanto a elegancia da experiencia;
- o filtro ainda pode ficar com cara de “formulario acoplado”, nao de controle refinado.

Quando escolher:

- se a prioridade for velocidade maxima com alteracao pequena.

### Abordagem B - Polish guiado por UX atual da aplicacao

O que faz:

- usa `admin-primary` em todos os botoes internos de destaque;
- remove os blocos de rollout/telemetria visual;
- reposiciona tabs + botao de filtro dentro de um mesmo quadrante visual;
- transforma o filtro em gatilho minimalista com painel delicado e CTA de confirmacao;
- mostra filtros ativos como indicadores discretos ao lado do botao;
- coloca concluidas em accordion com ultimo mes aberto por padrao.

Vantagens:

- melhora bastante a percepcao de produto sem reabrir arquitetura;
- aproxima a tela da linguagem das paginas existentes;
- mantem a rodada dentro de frontend/UX;
- entrega um ganho visual claro sem virar redesign.

Desvantagens:

- exige um pouco mais de mexida em layout e componentes;
- precisa de cuidado para nao quebrar URL state nem fluxo de filtros.

Quando escolher:

- **recomendado para esta rodada**.

### Abordagem C - Refino visual mais ambicioso

O que faz:

- tudo da abordagem B;
- reestrutura header, tabs, toolbar e cards com uma hierarquia visual mais autoral;
- introduz mais motion, badges redesenhadas e composicao mais sofisticada.

Vantagens:

- salto visual maior.

Desvantagens:

- distancia da linguagem atual da aplicacao;
- aumenta chance de reabrir discussoes de produto e layout;
- foge do objetivo de aproximacao ao padrao existente;
- pior relacao ganho/risco para a rodada atual.

Quando escolher:

- nao recomendado agora.

## 6. Recomendacao

### Recomendacao principal

Seguir com a **Abordagem B - Polish guiado por UX atual da aplicacao**.

Motivo:

- atende os 4 pontos trazidos;
- usa o verde-agua canonico ja existente;
- limpa o ruido tecnico da tela;
- melhora a integracao entre tabs e filtros;
- reduz o peso visual da aba de concluidas;
- sem transformar a rodada em redesign amplo.

## 7. YAGNI aplicado

Para esta rodada, **nao** vale adicionar:

- novo sistema de tokens visuais;
- novo esquema de cores;
- novo modelo de busca;
- filtros mais complexos do que os ja existentes;
- pagina nova para concluidas;
- novas agregacoes, metricas ou badges extras;
- animacoes sofisticadas.

O suficiente para esta rodada e:

- corrigir destaque visual;
- limpar blocos tecnicos;
- encaixar filtro na area certa;
- melhorar leitura de concluidas.

## 8. Entendimento consolidado

O entendimento atual e:

- a rodada vale apenas para `/gestao-de-chamados`;
- ela e uma rodada de **ajustes visuais com pequenos refinamentos estruturais controlados**;
- o objetivo e aproximar a tela da linguagem visual existente da aplicacao;
- o verde-agua correto e `hsl(var(--admin-primary)) = hsl(170 60% 50%)`;
- devemos remover os blocos visuais de rollout/transicao;
- devemos mover o filtro para o quadrante das tabs com gatilho minimalista e painel delicado;
- devemos transformar `Concluidas` em accordion por mes, com o mes mais recente aberto.

## 9. Proposta de proximo passo

Se seguirmos com a abordagem recomendada, o proximo artefato natural e:

- um `DEFINE` curto da rodada de ajustes visuais da `2A`

com estes itens como escopo:

1. padronizacao de destaque em `admin-primary`;
2. limpeza dos blocos visuais de rollout;
3. reposicionamento e refinamento do controle de filtros;
4. accordion mensal em `Concluidas`.
