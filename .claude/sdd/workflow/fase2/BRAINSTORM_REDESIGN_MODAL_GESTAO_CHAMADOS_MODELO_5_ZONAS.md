# Brainstorm: Redesign do modal de `/gestao-de-chamados` para o modelo de 5 zonas

Date: 2026-04-17
Owner: Codex
Status: Ready for define

---

## 1. Contexto

Escopo desta sessao:

- analisar o modal operacional atual de `/gestao-de-chamados`;
- considerar a refatoracao recente fechada nos commits:
  - `57f676516c9566b60290e5975059d4f22f69071b`
  - `a132a9c15424474a126500d1ca7d47cedd741322`
- explorar como levar o modal ao modelo desejado de 5 zonas:
  - cabecalho do chamado
  - resumo do chamado
  - acao atual
  - historico por etapa
  - dados enviados

Decisoes confirmadas com o usuario durante o brainstorm:

- a experiencia deve continuar equilibrando os tres perfis:
  - owner
  - responsavel atual
  - destinatario de action pendente
- o alvo desta refatoracao e apenas o modal de `/gestao-de-chamados`
- e aceitavel mexer tambem no payload oficial e no read-side

---

## 2. Leitura consolidada do funcionamento atual

### 2.1. Onde o modal nasce hoje

Superficie principal:

- [`src/components/workflows/management/RequestDetailDialog.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)

Payload oficial:

- [`src/app/api/workflows/read/requests/[requestId]/route.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/requests/[requestId]/route.ts)
- [`src/lib/workflows/read/detail.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)

Hook e mutacoes oficiais:

- [`src/hooks/use-workflow-management.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts)
- [`src/lib/workflows/management/api-client.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)

### 2.2. O que o payload oficial entrega hoje

O read-side oficial do detalhe entrega:

- `summary`
- `permissions`
- `formData`
- `attachments`
- `progress`
- `action`
- `timeline`

Isso significa que o modal atual ja e orientado por contrato oficial. Ele nao deveria inferir regra de negocio localmente.

### 2.3. Papeis operacionais atuais

#### Owner

Origem:

- `ownerUserId` do request / workflow type

Comportamento atual:

- pode atribuir ou reatribuir responsavel;
- pode pedir action da etapa atual;
- pode operar a etapa atual como excecao operacional, junto do responsavel;
- pode arquivar quando o chamado ja estiver finalizado.

Referencias:

- [`src/lib/workflows/runtime/authz.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)
- [`src/lib/workflows/read/detail.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)

#### Responsavel

Origem:

- `responsibleUserId` do request

Comportamento atual:

- divide a operacao da etapa atual com o owner;
- pode avancar e finalizar quando a continuidade do fluxo permitir;
- pode pedir action quando a etapa atual suporta action e nao existe batch aberto.

#### Actor

Origem:

- colaborador autenticado convertido para identidade operacional `id3a`

Referencia:

- [`src/lib/workflows/runtime/actor-resolution.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/actor-resolution.ts)

Leitura funcional:

- `actor` nao e um quarto papel de negocio;
- ele e apenas o usuario autenticado corrente;
- dependendo de quem ele e no request, ele atua como owner, responsavel, destinatario de action ou apenas leitor autorizado.

#### Destinatario de action pendente

Comportamento atual:

- nao vira operador geral do fluxo;
- so ganha permissao de `respondAction` quando existe action pendente para ele na etapa atual.

### 2.4. Regras atuais de continuidade

O endurecimento principal foi introduzido pelo commit `57f676516c9566b60290e5975059d4f22f69071b`.

Referencias:

- [`src/lib/workflows/runtime/continuation.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/continuation.ts)
- [`src/lib/workflows/runtime/use-cases/advance-step.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts)
- [`src/lib/workflows/runtime/use-cases/finalize-request.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/finalize-request.ts)

Regra atual resumida:

- `advance` so pode acontecer quando:
  - o request esta `in_progress`
  - a etapa atual esta `active`
  - nao existe action pendente
  - se a etapa tiver `action`, o batch ja precisa estar concluido
  - a proxima etapa imediata precisa ser do tipo `work`
- `finalize` so pode acontecer quando:
  - o request esta `in_progress`
  - a etapa atual esta `active`
  - nao existe action pendente
  - se a etapa tiver `action`, o batch ja precisa estar concluido
  - a proxima etapa imediata precisa ser do tipo `final`
- `respondAction` nao avanca etapa sozinho;
- responder action apenas destrava a continuidade oficial.

### 2.5. Estrutura visual atual do modal

O commit `a132a9c15424474a126500d1ca7d47cedd741322` reorganizou o modal em:

- resumo do chamado
- hero operacional
- action da etapa
- administracao do chamado
- blocos de apoio

Referencias:

- [`src/components/workflows/management/RequestOperationalHero.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestOperationalHero.tsx)
- [`src/components/workflows/management/RequestActionCard.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx)
- [`src/components/workflows/management/RequestAdministrativePanel.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestAdministrativePanel.tsx)
- [`src/lib/workflows/management/request-detail-view-model.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/request-detail-view-model.ts)

Esse shell melhorou bastante a hierarquia do fluxo atual, mas ainda nao coincide com o desenho alvo.

---

## 3. Gaps entre o modal atual e o modelo desejado

### 3.1. Cabecalho

Hoje:

- o `DialogHeader` mostra `Chamado #id`
- subtitulo com workflow e etapa atual

Gap:

- o desenho desejado pede um cabecalho mais executivo, explicitando:
  - numero do chamado
  - nome do workflow/tipo
  - status macro
  - nome da etapa atual

### 3.2. Resumo do chamado

Hoje:

- o resumo existe;
- mostra solicitante, responsavel, datas, area e owner.

Gaps:

- `Area` ainda mostra `areaId` cru;
- a zona existe, mas ainda nao esta amarrada explicitamente ao conceito de metadados institucionais e operacionais do desenho.

### 3.3. Acao atual

Hoje:

- existe um `hero` operacional e existe uma `Action da etapa`;
- `advance` e `finalize` vivem no hero;
- `requestAction/respondAction` vivem no `RequestActionCard`;
- atribuicao e arquivamento ficam separados em painel administrativo.

Gaps:

- o desenho desejado fala em uma unica zona perceptiva de "acao atual";
- hoje a experiencia operacional esta distribuida em mais de um bloco;
- isso funciona, mas nao e 1:1 com o modelo desejado.

### 3.4. Historico

Hoje:

- `RequestProgress` e separado de `RequestTimeline`;
- `progress` lista as etapas;
- `timeline` lista eventos linearmente;
- nao existe agrupamento por `stepId`.

Gap estrutural principal:

- o desenho exige historico por etapa;
- os eventos precisam ser renderizados dentro da etapa correspondente;
- comentarios e anexos da etapa precisam aparecer junto dessa etapa;
- portanto, `progress + timeline` atuais nao sao suficientes como shape final.

### 3.5. Dados enviados

Hoje:

- `RequestFormData` mostra campos;
- `RequestAttachments` mostra anexos de formulario.

Gaps:

- o desenho deseja a leitura desses anexos dentro da mesma zona de dados enviados;
- hoje os anexos ficam num card separado;
- hoje existe `Abrir anexo`, mas nao a dupla explicita:
  - ver anexo
  - baixar anexo

---

## 4. Requisitos implícitos que o desenho cria

O desenho nao e apenas visual. Ele implica novos contratos.

### 4.1. Historico agrupado por etapa

O payload final ideal precisa sustentar algo como:

- lista de etapas do progresso
- para cada etapa:
  - status da etapa
  - eventos ligados a `stepId`
  - comentarios da etapa
  - anexos da etapa

Isso pode ser entregue de duas formas:

- read-side ja entrega uma estrutura agrupada por etapa
- ou read-side entrega timeline rica o suficiente para o frontend agrupar sem heuristica fraca

Como esta liberado mexer no payload/read-side, a opcao mais robusta passa a ser enriquecer o contrato oficial.

### 4.2. Distincao entre anexos de formulario e anexos de etapa/action

O desenho separa duas familias:

- anexos enviados no formulario original
- anexos ligados a interacoes de etapa / action / historico

O contrato atual mistura melhor a segunda familia dentro de `action.recipients` do que no historico por etapa.
Para o novo modelo, isso provavelmente precisara ser consolidado numa leitura por etapa.

### 4.3. Metadados mais amigaveis

O resumo do chamado nao deveria depender de IDs crus quando houver label oficial disponivel.
Isso sugere enriquecer o detalhe com:

- `areaLabel`
- eventualmente `ownerName`, se for desejado no futuro

### 4.4. Superficie unica de leitura operacional

Mesmo equilibrando tres perfis, o modal precisa manter uma regra:

- uma unica "verdade visual" para o proximo passo
- sem perder a legibilidade de quem abriu, quem opera, quem precisa responder action e o que ja aconteceu

---

## 5. Perguntas respondidas nesta sessao

### Q1. Quem vai usar?

Resposta:

- os tres perfis seguem igualmente relevantes:
  - owner
  - responsavel atual
  - destinatario de action pendente

### Q2. Onde isso vai aparecer?

Resposta:

- apenas no modal de `/gestao-de-chamados`

### Q3. O escopo e so frontend?

Resposta:

- nao;
- e aceitavel mexer tambem no payload oficial e no read-side.

---

## 6. Abordagens

### Abordagem A — Redesign visual sobre o contrato atual

O que faz:

- reorganiza o modal para ficar mais parecido com o desenho;
- usa o payload atual;
- faz o maximo possivel de agrupamento no frontend;
- mantem `progress`, `timeline`, `formData`, `attachments` como fontes separadas.

Pros:

- menor custo inicial;
- menos impacto em API e read-side;
- entrega mais rapida de percepcao visual.

Contras:

- o historico por etapa fica fraco ou heuristico;
- comentarios e anexos por etapa ficam dificeis de fechar corretamente;
- aumenta o risco de logica de agrupamento demais no cliente;
- pode produzir uma UI parecida com o desenho, mas sem o mesmo fundamento funcional.

Quando faz sentido:

- se a prioridade for provar layout rapidamente.

### Abordagem B — Redesign orientado por novo view model no read-side

O que faz:

- preserva `RequestDetailDialog` como entrypoint;
- redesenha a composicao do modal para as 5 zonas;
- enriquece o payload oficial com um bloco novo de historico por etapa;
- melhora `summary` com metadados amigaveis;
- mantem as regras operacionais atuais de owner/responsavel/action/advance/finalize;
- move o frontend para consumir estruturas mais proximas do desenho final.

Pros:

- melhor alinhamento entre desenho, contrato e comportamento;
- historico por etapa fica oficial, nao improvisado;
- abre espaco para comentarios e anexos por etapa de forma canonica;
- reduz heuristica no frontend;
- respeita melhor a ideia de que o modal deve ser guiado pelo payload oficial.

Contras:

- exige mudanca coordenada de frontend + read-side;
- pede revisao cuidadosa dos testes do detalhe;
- pode exigir adaptacao incremental de componentes existentes.

Quando faz sentido:

- quando se quer construir a base certa, nao apenas uma casca visual.

### Abordagem C — Refatoracao em duas fases com compatibilidade temporaria

O que faz:

- fase 1:
  - adiciona no payload um novo bloco de historico agrupado por etapa
  - preserva `timeline` e `progress` atuais
- fase 2:
  - refatora o modal para usar prioritariamente o modelo novo
  - apos estabilizacao, rebaixa ou remove o uso das estruturas antigas dentro do modal

Pros:

- menor risco de regressao;
- facilita rollout controlado;
- permite validar o contrato novo antes de fechar toda a UI.

Contras:

- carrega duplicidade temporaria no payload;
- adiciona trabalho de transicao;
- se prolongado, pode deixar duas representacoes convivendo por tempo demais.

Quando faz sentido:

- quando a equipe quer seguranca maior no rollout.

---

## 7. Recomendacao

Recomendacao principal:

- seguir a **Abordagem B** como alvo arquitetural

Recomendacao de execucao:

- implementar com estrategia de rollout da **Abordagem C**

Traduzindo:

- o modal novo deve nascer com contrato melhor, nao apenas com visual novo;
- mas a migracao vale ser feita em etapas seguras, sem apagar imediatamente `progress/timeline` antigos do contrato.

---

## 8. YAGNI aplicado

Itens que nao parecem necessarios neste momento:

- convergir agora com o modal de `/solicitacoes`
- criar nova rota ou novo entrypoint de detalhe
- redesenhar o runtime operacional de `advance/finalize/requestAction/respondAction`
- criar engine de timeline generica para toda a aplicacao
- introduzir permissao nova so para suportar o modal
- reinventar os papeis; owner, responsavel e destinatario de action ja cobrem o problema

Itens que parecem necessarios:

- novo shape de historico por etapa no detalhe oficial
- melhora do resumo com dados mais amigaveis
- definicao clara de como anexos e comentarios por etapa aparecem
- unificacao visual do modal nas 5 zonas desejadas

---

## 9. Proposta objetiva de fatiamento

### Build 1 — Contrato do detalhe enriquecido

Entregas sugeridas:

- enriquecer `summary` com label amigavel de area
- adicionar no detalhe uma estrutura de historico agrupada por etapa
- mapear eventos por `stepId`
- decidir shape oficial para comentarios e anexos por etapa
- manter `progress` e `timeline` atuais durante transicao

### Build 2 — Shell visual do modal no modelo de 5 zonas

Entregas sugeridas:

- cabecalho executivo alinhado ao desenho
- resumo do chamado refinado
- acao atual reorganizada para leitura mais direta
- historico por etapa em acordeao / grupos expansivos
- dados enviados consolidando campos + anexos do formulario

### Build 3 — Polimento e limpeza

Entregas sugeridas:

- revisar copy e responsividade
- decidir o destino de `RequestProgress` e `RequestTimeline` atuais
- endurecer testes do novo historico por etapa
- remover dependencias visuais que ficaram apenas como compatibilidade

---

## 10. Confirmacao de entendimento

Entendimento consolidado desta sessao:

- o objetivo nao e apenas "deixar o modal mais bonito";
- o objetivo e alinhar a arquitetura de leitura do modal ao modelo de produto desejado;
- a maior mudanca estrutural esta no historico:
  - sair de `progress + timeline` separados
  - entrar em historico por etapa enriquecido por `stepId`
- os tres perfis seguem coexistindo no mesmo modal;
- `/gestao-de-chamados` e o unico alvo por enquanto;
- esta liberado mexer no payload oficial e no read-side para sustentar a experiencia certa.

---

## 11. Proximo passo recomendado

Gerar um `DEFINE` para esta refatoracao com:

- objetivo funcional do modal
- escopo do payload novo
- shape esperado do historico por etapa
- trade-off de compatibilidade temporaria com `progress/timeline`
- estrategia de rollout por builds
