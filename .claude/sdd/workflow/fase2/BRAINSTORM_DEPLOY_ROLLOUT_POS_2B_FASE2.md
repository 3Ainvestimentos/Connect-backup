# BRAINSTORM: Deploy e rollout gradual da feature refatorada de workflows apos 2B

> Generated: 2026-04-10
> Status: Brainstorm
> Scope: Planejar merge + deploy + rollout controlado das superficies v2 de workflows apos conclusao de `2A` a `2E`, incluindo a nova tela de abertura `2B`

## 1. Contexto consolidado

Apos a conclusao da `2B`, a Fase 2 passa a ter todas as macroetapas previstas entregues:

- `2A` Gestao oficial em `/gestao-de-chamados`
- `2B` Abertura oficial em `/solicitacoes`
- `2C` Cadastro e habilitacao dos workflows versionados
- `2D` Motor operacional de `requestAction` / `respondAction`
- `2E` Configuracao, versionamento e publicacao em `/admin/request-config`

O objetivo agora nao e apenas “subir codigo na master”, e sim fazer um **rollout seguro**, com:

- convivencia controlada com as telas legadas;
- liberacao gradual por permissao;
- validacao em horario comercial com observacao ativa;
- capacidade de rollback operacional sem pressa nem impacto grande para o restante da empresa.

## 2. Premissas confirmadas

- o rollout inicial sera feito para **voce + 3 admins**;
- depois dos testes, a liberacao segue para o restante da empresa;
- quem nao tiver permissao **nao deve ver as novas telas no menu**;
- o mecanismo atual de ocultacao por permissao ja funciona bem;
- o deploy da `master` sera feito **em horario comercial**;
- o objetivo e migrar gradualmente, mantendo as telas legadas disponiveis durante a fase inicial.

## 3. Problemas que o plano de deploy precisa resolver

### 3.1. Nomes e semantica de permissao hoje estao confusos

No estado atual:

- `Workflows` = tela legada de admin `/admin/workflows`
- `Solicitações` = tela legada `/requests`
- `Minhas Tarefas` = tela legada `/me/tasks`
- `/applications` e publico para autenticados, sem gate dedicado

Isso dificulta explicar para o usuario e dificulta o rollout gradual da nova stack.

### 3.2. O merge vai colocar lado a lado duas geracoes da feature

Depois do merge, o codigo em `master` tera simultaneamente:

- rotas legadas ainda em uso;
- rotas v2 novas;
- menus e guards novos;
- mesmas operacoes de negocio em superficies diferentes.

Sem um plano claro, isso vira um deploy tecnicamente correto, mas operacionalmente confuso.

### 3.3. Rollout em horario comercial pede kill-switch simples

Como a liberacao sera durante horario comercial, precisamos de um mecanismo de resposta rapido se algo nao se comportar como esperado.

O ideal e evitar rollback de codigo como primeira reacao e priorizar:

- desligar acesso;
- remover visibilidade;
- reter grupos piloto;
- manter legado funcionando.

## 4. Permissoes novas propostas

### Objetivo da nomenclatura

A nomenclatura nova deve:

- ser clara para super admin na tela de permissoes;
- refletir a superficie real de produto;
- permitir rollout gradual sem mexer na semantica das permissoes legadas;
- deixar obvio o que e v2 e o que e legado.

### Permissoes novas

Sugestao consolidada:

- `canManageRequestsV2`
  - label de UI: `Gestão Chamados V2`
  - cobre a nova gestao oficial em `/gestao-de-chamados`
  - cobre tambem a substituicao progressiva dos atalhos legados “Solicitações” e “Minhas Tarefas”

- `canManageWorkflowsV2`
  - label de UI: `Config Chamados V2`
  - cobre `/admin/request-config`
  - ja existe tecnicamente e pode ser apenas renomeada visualmente na tela de permissoes

- `canOpenRequestsV2`
  - label de UI: `Solicitações V2`
  - cobre a nova rota `/solicitacoes`
  - sera o gate de rollout da tela de abertura

### Regras de rollout

- todas as novas permissoes devem nascer com **default `false`**
- nenhum usuario fora do piloto ve links v2 no menu
- as rotas v2 tambem precisam de gate server/client, nao apenas ocultacao visual
- as permissoes legadas permanecem intactas durante a migracao inicial

## 5. Abordagens de rollout

### Abordagem A — Deploy escuro + liberacao por permissao

**Como funciona**

- merge completo na `master`
- deploy completo do codigo
- menus e rotas v2 protegidos por novas permissoes
- libera apenas para voce + 3 admins
- apos smoke e observacao, amplia para mais usuarios

**Vantagens**

- mais simples de operar
- nao exige branch longa de release
- rollback operacional rapido: basta desligar permissoes
- reduz diferenca entre ambiente de teste e producao

**Riscos**

- exige gates muito bem fechados em menu, rota e API
- qualquer dependencia nao protegida pode vazar para usuario errado

**Leitura**

E a melhor abordagem para o seu caso.

---

### Abordagem B — Deploy escuro + enablement por permissao + grupo piloto por area

**Como funciona**

- igual a Abordagem A
- mas a segunda liberacao nao vai para a empresa inteira
- vai primeiro para uma ou duas areas de negocio especificas

**Vantagens**

- reduz volume de suporte inicial
- ajuda a validar workflows por dominio
- facilita comunicacao segmentada

**Riscos**

- exige um passo extra de operacao
- pode aumentar a duracao da convivencia com o legado

**Leitura**

Boa se voce quiser uma semana 2 intermediaria antes da liberacao geral.

---

### Abordagem C — Cutover rapido apos piloto muito curto

**Como funciona**

- deploy em `master`
- piloto com voce + 3 admins por pouco tempo
- logo depois libera para todo mundo

**Vantagens**

- menos tempo sustentando dois mundos
- comunicacao mais simples

**Riscos**

- pouca amostragem antes da abertura geral
- aumenta chance de ajuste fino acontecer com muita gente ja usando

**Leitura**

Eu nao recomendaria como plano inicial.

## 6. Recomendacao

### Recomendacao principal

Seguir a **Abordagem A**, com possibilidade de evoluir para a **B** se o piloto mostrar que vale uma segunda onda controlada.

### Traduzindo isso em pratica

#### Fase 0 — Preparacao antes do merge

- fechar permissao nova de abertura v2:
  - `canOpenRequestsV2`
- fechar permissao nova de gestao v2:
  - `canManageRequestsV2`
- renomear visualmente a permissao atual de config v2 para:
  - `Config Chamados V2`
- garantir guards em:
  - menu
  - pagina
  - API
- manter legado intocado

#### Fase 1 — Merge e deploy escuro

- merge da branch na `master`
- deploy em horario comercial
- nenhum usuario fora do piloto com permissao v2
- validar que:
  - rotas novas nao aparecem para usuarios comuns
  - legado continua normal

#### Fase 2 — Piloto fechado

liberar apenas:

- voce
- admin 1
- admin 2
- admin 3

permissoes piloto:

- `Gestão Chamados V2`
- `Config Chamados V2`
- `Solicitações V2`

validar:

- abertura ponta a ponta
- gestao ponta a ponta
- requestAction / respondAction
- configuracao/publicacao
- historico/admin read-only

#### Fase 3 — Abertura ampla

- liberar `Solicitações V2` para empresa
- decidir separadamente se `Gestão Chamados V2` e `Config Chamados V2` continuam restritas
- manter atalhos legados ainda visiveis para os perfis que dependem deles, se necessario

## 7. Merge na master: melhores praticas

### Antes do merge

- congelar mudancas paralelas grandes em workflows por algumas horas
- atualizar branch com a `master` mais recente
- resolver conflitos antes da janela
- validar:
  - `npm run lint`
  - `npm test`
  - smoke local dos fluxos criticos

### PR / merge

- preferir merge com escopo fechado e changelog curto
- destacar no PR:
  - novas rotas
  - novas permissoes
  - coexistencia com legado
  - estrategia de rollback

### Depois do merge, antes do deploy

- confirmar que os documentos de rollout estao acessiveis
- confirmar lista dos 4 usuarios piloto
- confirmar quem executa e quem acompanha
- confirmar que super admin consegue ligar/desligar permissoes rapidamente

## 8. Smoke checklist do deploy

### Smoke tecnico minimo

#### Usuario sem permissao v2

- nao ve `/solicitacoes` no menu
- nao ve links de gestao/config v2
- legado continua funcionando

#### Usuario piloto com permissao

- ve menu novo correto
- abre `/solicitacoes`
- abre workflow
- envia formulario com e sem anexo
- request aparece em `Minhas Solicitações`
- detalhe read-only abre no olho

#### Admin piloto

- abre `/gestao-de-chamados`
- lista carrega
- detalhe abre
- action funciona
- upload de action funciona

#### Admin de configuracao

- abre `/admin/request-config`
- cria/edita draft
- publica
- ativa

### Smoke operacional minimo

- nenhum menu legado sumiu sem querer
- nenhum usuario fora do piloto reporta tela nova aparecendo
- nenhum workflow novo ficou invisivel para piloto sem motivo

## 9. Rollback e mitigacao

### Primeira linha de defesa

Desligar permissoes v2:

- `Gestão Chamados V2`
- `Config Chamados V2`
- `Solicitações V2`

Isso deve ser suficiente para esconder a feature da maior parte dos usuarios sem rollback de codigo.

### Segunda linha de defesa

Se houver problema funcional localizado:

- retirar acesso apenas do grupo piloto
- manter deploy ativo
- corrigir e republicar

### Terceira linha de defesa

Rollback de codigo so se houver:

- regressao ampla no legado
- problema de auth/global nav
- erro estrutural que afete usuario fora do piloto

## 10. Sugestoes extras

### 10.1. Renomear labels legadas na tela de permissoes

Mesmo sem trocar a semantica tecnica agora, vale melhorar a UX de admin:

- `Workflows` → `Config Chamados (Legado)`
- `Solicitações` → `Gestão Solicitações (Legado)`
- `Minhas Tarefas` → `Minhas Tarefas/Ações (Legado)`
- `Workflows V2` → `Config Chamados V2`

Isso reduz muito a ambiguidade durante a fase de transicao.

### 10.2. Separar “deploy” de “enablement”

Melhor pratica para esse caso:

- deploy do codigo
- depois enablement via permissao

Ou seja:
- subir codigo na `master` nao significa abrir a feature para todo mundo

### 10.3. Fazer um “dia 1 / dia 2 / dia 7”

Modelo simples:

- **Dia 1:** deploy + piloto
- **Dia 2:** revisar bugs e feedback
- **Dia 7:** liberar para empresa se o piloto estiver estavel

### 10.4. Ter um owner operacional do rollout

Mesmo com piloto pequeno, vale definir:

- quem liga as permissoes
- quem acompanha erros
- quem comunica “liberado” ou “segura rollout”

### 10.5. Nao mexer nas permissoes legadas no primeiro deploy

YAGNI aqui e importante.

No primeiro rollout:

- criar e usar as novas permissoes v2
- manter as legadas como estao
- deixar limpeza/renomeacao tecnica mais profunda para fase posterior

Isso reduz risco de regressao em areas que ainda dependem do legado.

## 11. Proposta de entendimento consolidado

O caminho mais seguro parece ser:

1. concluir `2B`
2. mergear tudo na `master`
3. fazer deploy em horario comercial
4. manter a feature v2 invisivel para quem nao tem permissao
5. liberar apenas para voce + 3 admins
6. rodar smoke operacional real
7. corrigir o que aparecer
8. depois liberar para a empresa

## 12. Proximo passo recomendado

Se esse entendimento estiver certo, o proximo artefato natural e:

- `DEFINE_DEPLOY_ROLLOUT_POS_2B_FASE2.md`

Esse define pode fechar:

- permissao nova oficial de abertura v2
- labels finais das permissoes na tela de admin
- estrategia de merge/deploy
- checklist de smoke
- criterio objetivo para abrir a segunda onda
