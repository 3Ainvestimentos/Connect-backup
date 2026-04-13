# BRAINSTORM: Fase 2D - Motor operacional de `requestAction` / `respondAction`

> Generated: 2026-04-06
> Status: Exploracao concluida
> Scope: Definir a direcao da Fase 2D para suportar workflows action-driven com resposta operacional direta em `/gestao-de-chamados`

## 1. Contexto

A `2C` foi concluida com seed dos `30` workflows restantes em `5` lotes.

Com isso:

- lotes `1`, `2` e `3` ficaram publicados com `active: true`;
- lotes `4` e `5` ficaram publicados com `active: false`;
- workflows com `statuses[*].action` foram preservados em `preserve_legacy`;
- o runtime novo ja carrega a base estrutural para a `2D`, incluindo:
  - `StepActionDef` em [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
  - `statusCategory = waiting_action` em [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
  - `hasPendingActions`, `pendingActionRecipientIds` e `pendingActionTypes` em [read-model.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/read-model.ts)
  - queries de leitura e filtros oficiais para `waiting_action` na experiencia de gestao

A lacuna atual nao e mais de cadastro do workflow. A lacuna agora e operacional:

- pedir acao (`requestAction`);
- responder acao (`respondAction`);
- manter o read model consistente durante a pendencia;
- permitir que o destinatario da acao responda diretamente pela tela oficial de gestao.

## 2. Perguntas respondidas

### 2.1. Quem e o usuario principal da primeira entrega?

O ator principal da `2D` e o **destinatario da action**.

Ao mesmo tempo, o desenho ja deve considerar a experiencia e a visibilidade de:

- owner do workflow;
- responsavel atual do chamado;
- operacao/gestao que acompanha o request.

### 2.2. Onde a resposta da action precisa acontecer?

A resposta precisa acontecer diretamente na superficie oficial de gestao:

- [`/gestao-de-chamados`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/gestao-de-chamados/page.tsx)

A `2D` portanto nao e apenas backend/runtime. Ela e uma entrega **full-stack minima**, com runtime e UI operacional.

### 2.3. Quais tipos de action entram na primeira versao?

Todos os tres tipos previstos no contrato atual:

- `approval`
- `acknowledgement`
- `execution`

Nao ha faseamento por tipo dentro da `2D`.

## 3. Entendimento consolidado

A `2D` deve entregar a primeira capacidade action-driven operacional do novo motor, com estas propriedades:

- o destinatario da action consegue visualizar a pendencia na gestao;
- o destinatario da action consegue responder a pendencia na gestao;
- a resposta atualiza o request de forma transacional e auditavel;
- o request entra em `waiting_action` enquanto houver pendencia aberta na etapa atual;
- o request retorna para `in_progress` apenas quando nao houver mais pendencias abertas na etapa atual;
- o owner e o responsavel conseguem acompanhar o estado da action no detalhe do request;
- o motor suporta `approval`, `acknowledgement` e `execution` sob o mesmo contrato base.

## 4. Abordagens

### Abordagem A. Fluxos separados por tipo

Implementar `approval`, `acknowledgement` e `execution` como fluxos quase independentes, com regras, mutacoes e UI especificas para cada tipo.

#### Vantagens

- menor esforco cognitivo por fluxo isolado;
- UX pode nascer muito customizada por tipo.

#### Desvantagens

- duplica o motor de pendencia, autorizacao e auditoria;
- aumenta o risco de comportamento inconsistente entre tipos;
- dificulta a evolucao futura de versoes configuraveis.

#### Veredito

Nao recomendado.

---

### Abordagem B. Motor comum + handlers por tipo

Criar um nucleo unico para:

- abrir pendencia da action;
- persistir estado da pendencia;
- refletir `waiting_action` no read model;
- autorizar a resposta;
- registrar trilha de auditoria;
- recalcular saida da etapa apos cada resposta.

Cada tipo de action pluga apenas a sua regra especifica:

- `acknowledgement`
  - resposta `acknowledged`
- `approval`
  - resposta `approved` ou `rejected`
- `execution`
  - resposta `executed`, com comentario e anexo quando aplicavel

#### Vantagens

- evita duplicacao do motor;
- suporta os tres tipos na mesma etapa sem multiplicar complexidade;
- deixa a UI da gestao consistente;
- prepara melhor a evolucao futura da configuracao versionada.

#### Desvantagens

- exige contrato base bem desenhado desde o inicio;
- pede um pouco mais de rigor em repository, use cases e projection helpers.

#### Veredito

Recomendado.

---

### Abordagem C. Engine altamente generica ja na primeira iteracao

Desenhar a `2D` quase como uma engine completa de orchestration de actions, cobrindo desde o inicio multiplas regras de quorum, reabertura, expiracao, escalonamento e composicao livre.

#### Vantagens

- maxima flexibilidade futura;
- pouca necessidade de revisitar o desenho macro depois.

#### Desvantagens

- overengineering para o momento atual;
- alto risco de atrasar valor operacional concreto;
- mistura a necessidade da `2D` com ambicoes da `2E` e de uma futura `V2`.

#### Veredito

Nao recomendado.

## 5. Recomendacao

Seguir com a **Abordagem B**: motor comum de `requestAction` / `respondAction` com handlers por tipo.

### Decisoes propostas

1. Implementar um contrato comum de pendencia de action no write-side.
2. Construir `requestAction` e `respondAction` como casos de uso centrais do runtime.
3. Suportar de uma vez:
   - `approval`
   - `acknowledgement`
   - `execution`
4. Expor a resposta da action na tela oficial de gestao, sem criar uma nova inbox separada.
5. Considerar desde a primeira versao os tres pontos de vista:
   - destinatario da action
   - responsavel
   - owner
6. Manter a transicao de etapa separada:
   - responder action nao avanca etapa automaticamente
   - avancar etapa continua sendo operacao distinta do responsavel

## 6. Comportamento minimo esperado

### 6.1. `requestAction`

Quando a etapa atual tiver `action` configurada:

- o responsavel ou o motor operacional da etapa cria a pendencia;
- o request permanece na mesma etapa;
- `currentStepId`, `currentStepName` e `currentStatusKey` nao mudam;
- `statusCategory` passa para `waiting_action`;
- `hasPendingActions = true`;
- `pendingActionRecipientIds` reflete os destinatarios pendentes;
- `pendingActionTypes` reflete o(s) tipo(s) pendente(s).

### 6.2. `respondAction`

Quando um destinatario responder:

- a autorizacao e validada contra a pendencia aberta;
- a resposta fica registrada com tipo, ator, timestamp e payload relevante;
- se ainda houver pendencia aberta na etapa atual:
  - o request continua em `waiting_action`;
- se nao houver mais pendencias abertas na etapa atual:
  - o request volta para `in_progress`;
  - o controle volta ao responsavel da etapa.

### 6.3. Semantica por tipo

Seguir a semantica ja registrada em [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md):

- `acknowledgement`
  - resposta `acknowledged`
- `approval`
  - respostas `approved` e `rejected`
- `execution`
  - resposta `executed`
  - pode incluir comentario e anexo

## 7. Superficie de produto na gestao

Para a primeira versao da `2D`, a tela oficial de gestao deve ganhar apenas o necessario para operacionalizar a acao:

- destacar quando o request esta em `waiting_action`;
- indicar quem sao os destinatarios pendentes;
- mostrar o tipo da action pendente;
- renderizar CTA de resposta para quem for destinatario;
- permitir responder sem sair da tela oficial;
- refletir historico/auditoria minima no detalhe do request.

### Nao recomendado na `2D`

- inbox nova separada da gestao;
- centro de notificacoes proprio;
- editor de workflow/versionamento;
- regras avancadas de quorum;
- reatribuicao complexa de pendencia entre terceiros;
- expiracao/escalonamento automatico.

## 8. YAGNI

Para manter a `2D` saudavel, devemos segurar o escopo em torno do que desbloqueia os lotes `4` e `5`.

Precisamos:

- motor transacional de `requestAction`;
- motor transacional de `respondAction`;
- atualizacao consistente do read model para `waiting_action`;
- autorizacao do destinatario;
- UI minima na gestao para responder;
- testes por tipo de action.

Nao precisamos agora:

- configurador administrativo de action;
- regras altamente genericas de roteamento;
- automacoes de notificacao externas;
- novas versoes de workflow sendo editadas por UI.

## 9. Riscos principais

### 9.1. Misturar resposta de action com avancar etapa

Se a `2D` deixar a resposta da action avancar etapa automaticamente, a semantica fica opaca e quebra o contrato ja desenhado.

### 9.2. Fazer a UI antes do contrato do runtime

Se a UI for improvisada antes de fechar o modelo de pendencia e resposta, a gestao vira workaround e nao frente oficial do motor.

### 9.3. Subestimar auditoria

Sem trilha minima de quem pediu, quem respondeu e quando respondeu, workflows de aprovacao e execucao ficam operacionalmente frageis.

## 10. Confirmacao de entendimento

Entendimento confirmado para a `2D`:

- o foco principal da primeira entrega e o destinatario da action;
- a resposta da action deve acontecer diretamente em `/gestao-de-chamados`;
- a etapa deve suportar os tres tipos de action desde a primeira versao;
- a abordagem recomendada e um motor comum de `requestAction` / `respondAction` com handlers por tipo;
- owner e responsavel entram no desenho ja nesta primeira iteracao como atores observadores e operacionais relevantes.

## 11. Proximo passo recomendado

Criar um `DEFINE` da `2D` fechando:

- contrato minimo do write-side para pendencias e respostas;
- regras de autorizacao por ator;
- comportamento detalhado de `waiting_action`;
- superficie minima na gestao;
- escopo exato de desbloqueio dos workflows dos lotes `4` e `5`.
