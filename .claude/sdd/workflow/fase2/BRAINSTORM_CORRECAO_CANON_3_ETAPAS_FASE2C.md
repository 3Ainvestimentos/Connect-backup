# BRAINSTORM: Correcao da 2C para workflows diretos com etapas demais

> Generated: 2026-04-06
> Status: Exploracao concluida
> Scope: Correcao tecnica da seed da Fase 2C para aplicar o canon de 3 etapas em workflows diretos com etapas intermediarias legadas excessivas

## 1. Contexto

Durante a execucao da `2C`, identificamos um desvio entre a seed dos 30 workflows restantes e a decisao ja aplicada no piloto de Facilities:

- em Facilities, a publicacao `v1` simplificou workflows diretos para o canon:
  - `solicitacao_aberta`
  - `em_andamento`
  - `finalizado`
- na `2C`, a pipeline atual em [status-normalization.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/status-normalization.ts) preserva todos os `statuses` legados em ordem

Isso gerou publicacao com etapas demais para workflows que, no modelo novo, deveriam ser tratados como fluxos diretos.

Os lotes `1` e `2` ja foram seedados com essa estrategia incorreta e serao removidos manualmente para reseed.

## 2. Perguntas respondidas

### 2.1. Quem vai usar essa correcao?

Apenas a equipe tecnica, para operar a seed corretamente agora.

### 2.2. Onde a classificacao deve viver?

Ela deve ficar **explicita no manifesto por workflow**, nao inferida automaticamente pelo legado.

### 2.3. Como corrigir os lotes `1` e `2` ja publicados?

Os `workflowTypes_v2` e `versions/1` correspondentes serao **removidos manualmente**, e depois os comandos normais de seed serao executados novamente.

## 3. Entendimento consolidado

Queremos corrigir a seed da `2C` para que:

- o canon de 3 etapas
  - `solicitacao_aberta`
  - `em_andamento`
  - `finalizado`
- seja aplicado em **todos e apenas** os workflows classificados como:
  - diretos
  - sem `action`
  - com etapas legadas intermediarias que nao precisam ser preservadas no modelo novo

Essa classificacao nao deve ser automatica. Ela deve ser declarada por workflow no manifesto do lote.

## 4. Abordagens

### Abordagem A. Deteccao automatica pela malha de statuses

A pipeline tentaria inferir sozinha quando um workflow deve virar canonico, por exemplo:

- sem `action`
- `statuses.length > 3`
- ultimo status final
- intermediarios pertencendo a um conjunto conhecido como `em_analise`, `em_aprovacao`, `em_execucao`

#### Vantagens

- menos anotacao manual em manifesto
- menos trabalho de curadoria inicial

#### Desvantagens

- abre margem para simplificacao indevida
- acopla regra de produto a heuristica tecnica
- dificulta excecoes e manutencao

#### Veredito

Nao recomendado.

---

### Abordagem B. Estrategia explicita por workflow no manifesto

Cada workflow passa a declarar uma estrategia de steps, por exemplo:

- `stepStrategy: 'preserve_legacy'`
- `stepStrategy: 'canonical_3_steps'`

A pipeline de normalizacao passa a ter dois caminhos:

- `preserve_legacy`
  - comportamento atual
- `canonical_3_steps`
  - ignora os intermediarios legados
  - publica apenas:
    - `solicitacao_aberta`
    - `em_andamento`
    - `finalizado`

#### Vantagens

- regra fica auditavel e legivel por workflow
- evita inferencia arriscada
- permite evolucao controlada lote a lote
- alinha a `2C` com a decisao de Facilities

#### Desvantagens

- exige curadoria explicita nos manifestos
- aumenta um pouco o trabalho de manutencao do manifesto

#### Veredito

Recomendado.

---

### Abordagem C. Patch manual nos docs ja publicados, sem mudar a pipeline

A equipe poderia editar manualmente os docs publicados de `workflowTypes_v2` e `versions/1`, ajustando `stepOrder`, `stepsById` e `initialStepId`.

#### Vantagens

- corrige rapidamente o que ja foi seedado

#### Desvantagens

- a pipeline continuaria errada
- o proximo lote repetiria o erro
- perde-se a seed como fonte de verdade
- aumenta o risco operacional

#### Veredito

Nao recomendado.

## 5. Recomendacao

Seguir com a **Abordagem B**.

### Decisoes propostas

1. Adicionar uma chave explicita por workflow no manifesto:
   - `stepStrategy: 'preserve_legacy' | 'canonical_3_steps'`

2. Implementar em [status-normalization.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/status-normalization.ts) um caminho canonico que materializa exatamente:
   - `solicitacao_aberta`
   - `em_andamento`
   - `finalizado`

3. Impor uma protecao de seguranca:
   - workflows com `statuses[*].action` nao podem usar `canonical_3_steps`

4. Marcar explicitamente nos manifestos quais workflows entram nessa classificacao

5. Remover manualmente os workflows dos lotes `1` e `2` ja publicados e rodar novamente os scripts normais

6. Nao executar o lote `3` antes da correcao entrar

## 6. Aplicacao pratica inicial

Pelo estado atual do repositorio, entram fortemente como candidatos a `canonical_3_steps` os workflows diretos hoje publicados com malha como:

- `solicitacao_aberta -> em_analise -> em_execucao -> finalizado`
- `solicitacao_aberta -> em_analise -> em_aprovacao -> finalizado`

e variacoes equivalentes sem `action`.

Exemplos ja observados:

- `governanca_espelhamento_caso_unico`
- `governanca_espelhamento_em_lote`
- varios workflows de `marketing`
- varios workflows de `ti`

Essa lista precisa ser fechada no define/design da correcao, mas a regra operacional ja esta clara.

## 7. YAGNI

Esta correcao nao precisa:

- criar UI nova
- criar DSL de workflow mais rica
- introduzir deteccao heuristica sofisticada
- reabrir a estrategia de owners, fields ou areas
- mexer no motor futuro de `requestAction/respondAction`

So precisamos:

- declarar a estrategia no manifesto
- publicar o canon de 3 etapas onde ele foi aprovado
- reseedar os lotes afetados

## 8. Confirmacao de entendimento

Entendimento confirmado para a proxima etapa:

- a correcao serve apenas para a operacao tecnica da seed agora;
- a classificacao deve ser explicita no manifesto por workflow;
- os lotes `1` e `2` serao removidos manualmente e seedados novamente;
- a abordagem recomendada e adicionar `stepStrategy` por workflow, com suporte a `canonical_3_steps` no normalizador.

## 9. Proximo passo recomendado

Criar um `DEFINE` curto para a correcao da `2C`, fechando:

- o contrato de `stepStrategy`
- as protecoes contra uso indevido em workflows com `action`
- a lista dos workflows marcados como `canonical_3_steps`
- a estrategia de reseed dos lotes `1` e `2`
