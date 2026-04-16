# Brainstorm: Refatoracao do modal operacional de `/gestao-de-chamados`

Date: 2026-04-16
Owner: Codex
Status: Approved for next `DEFINE`

---

## 1. Contexto

Escopo focado no detalhe operacional aberto a partir de:

- `/gestao-de-chamados`
- [`RequestDetailDialog.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)

O objetivo nao e criar uma nova rota nem um novo entrypoint. A decisao tomada neste brainstorm e:

- manter a mesma entrypoint (`RequestDetailDialog`)
- mas refatorar o shell interno, comportamento e contratos necessarios como se fosse um novo modal operacional

Perfis que precisam ser bem atendidos pelo modal:

- owner do workflow
- responsavel atual do chamado
- destinatario de action pendente

Escopo tecnico desejado:

- full stack
- mas quebrado em builds seguros e sequenciais

---

## 2. Problema

O modal operacional atual mistura leitura, acoes da etapa, acoes administrativas e footer global sem uma hierarquia clara de estado. Isso gera tres classes de problema:

### 2.1. Fluxo quebrado

- depois que uma action e respondida, o responsavel nao encontra CTA para avancar a etapa;
- o modal nao guia o operador para o "proximo passo natural" do fluxo;
- o backend suporta `advance`, mas a gestao nao integra esse caminho.

### 2.2. Semantica de acoes inconsistente

- o backend permite `owner` ou `responsavel` solicitarem action;
- a UI hoje so libera esse CTA para o responsavel;
- `finalize` aparece para qualquer request `in_progress`, mesmo quando ainda existem varias etapas intermediarias pendentes;
- na pratica, o fluxo permite encerrar o chamado cedo demais.

### 2.3. Shell visual fragil

- o footer pode ficar cortado;
- `Fechar`, `Finalizar` e `Arquivar` competem com a action da etapa atual;
- o modal nao comunica bem a diferenca entre:
  - acao da etapa atual
  - administracao do chamado
  - leitura do historico/progresso

---

## 3. Perguntas Respondidas

### Q1. Quem vai usar?

- owner do workflow
- responsavel atual do chamado
- destinatario de action pendente

### Q2. Mantemos o modal atual ou criamos um shell novo?

- manter a mesma entrypoint (`RequestDetailDialog`)
- reestruturar internamente o modal como um novo shell operacional

### Q3. Frontend ou full stack?

- full stack
- mas com divisao em etapas para os builds ficarem mais seguros

---

## 4. Codigo Atual Relevante

Arquivos principais lidos:

- [`src/components/workflows/management/RequestDetailDialog.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)
- [`src/components/workflows/management/RequestActionCard.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx)
- [`src/components/workflows/management/WorkflowManagementPage.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [`src/hooks/use-workflow-management.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts)
- [`src/lib/workflows/management/api-client.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
- [`src/lib/workflows/read/detail.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)
- [`src/lib/workflows/runtime/authz.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)
- [`src/lib/workflows/runtime/use-cases/advance-step.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts)
- [`src/lib/workflows/runtime/use-cases/finalize-request.ts`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/finalize-request.ts)
- [`src/components/ui/dialog.tsx`](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/dialog.tsx)

Leitura consolidada:

- o modal de gestao hoje ja e o shell oficial do detalhe operacional;
- o hook/client da gestao nao expoe mutation de `advance`;
- o backend ja possui rota e use case de `advance-step`;
- `canRequestAction` no detalhe e calculado de forma mais restritiva que a autorizacao do runtime;
- `canFinalize` hoje e amplo demais: qualquer `in_progress` para owner ou responsavel;
- o `DialogFooter` e combinado com um `ScrollArea` de altura fixa, o que ajuda a explicar clipping visual;
- a action da etapa atual fica concentrada em `RequestActionCard`, mas os demais comandos ficam dispersos no footer ou acima da dobra.

---

## 5. Caso Real Que Motivou a Refatoracao

Caso analisado: request `#828`, workflow `gente_comunicacao_analise_pre_desligamento_acesso_lideres`, versao `2`.

Sequencia observada no historico:

1. `request_opened`
2. `responsible_assigned`
3. `action_requested` na etapa `Em analise - BI`
4. `action_executed`
5. `request_finalized`

Sem ocorrer:

- `step_completed`
- `entered_step` para Financeiro
- `entered_step` para Juridico
- avancos pelas etapas intermediarias

`stepStates` finais:

- `stp_VnnZD9eM = completed`
- `stp_lQQZDu0d = completed`
- `stp_vNfm69Vt = completed`
- demais etapas = `pending`

Diagnostico do caso:

- o request respondeu a action da etapa BI;
- voltou a um estado operacional em que deveria avancar;
- o modal nao ofereceu `advance`;
- o modal/backend ofereceram `finalize`;
- o chamado foi encerrado cedo demais.

Esse caso comprova que a refatoracao nao e apenas estetica. Existe confusao funcional real no modal operacional.

---

## 6. Comportamento Atual vs Esperado

| Tema | Atual | Esperado |
| --- | --- | --- |
| Advance | inexistente na UI de gestao | CTA explicito quando a etapa atual puder seguir |
| Finalize | aparece para qualquer `in_progress` elegivel por ator | so aparece quando o fluxo estiver realmente apto a encerrar |
| Request action | owner ou responsavel no backend, mas UI restringe ao responsavel | UI e backend devem obedecer o mesmo contrato |
| Respond action | restrito ao destinatario pendente | manter restricao, mas comunicar melhor o papel do ator |
| Footer | clipping e hierarquia fraca | footer estavel, com poucas acoes globais |
| Shell | mistura leitura, fluxo e administracao sem contexto | acoes organizadas por estado e por papel |

---

## 7. Abordagens

### Abordagem A — Patch cirurgico no modal atual

O que faz:

- corrige o clipping do footer;
- adiciona CTA de `Avancar etapa`;
- alinha `canRequestAction` da UI com o backend;
- mexe minimamente em `canFinalize`, sem redesenhar muito a composicao visual.

Pros:

- menor risco de regressao estrutural;
- entrega mais rapida;
- resolve os bugs mais gritantes.

Contras:

- mantem um modal conceitualmente confuso;
- a acao da etapa, acoes administrativas e leitura continuam pouco separadas;
- pode virar remendo em cima de uma estrutura que ja nasceu incompleta.

Esforco:

- baixo para medio

Recomendacao:

- nao como solucao final

### Abordagem B — Refatoracao do modal operacional por zonas de contexto

O que faz:

- mantem `RequestDetailDialog` como entrypoint;
- reorganiza o modal em zonas claras:
  - cabecalho/contexto
  - estado atual e proximo passo
  - acao da etapa atual
  - acoes administrativas do chamado
  - formulario/progresso/timeline/anexos
- integra `advance`;
- endurece `finalize`;
- alinha contratos UI/backend para `requestAction`.

Pros:

- resolve a confusao funcional e visual ao mesmo tempo;
- melhora a legibilidade para owner, responsavel e destinatario de action;
- encaixa melhor com a maquina de estados do runtime;
- ainda preserva a entrypoint e a superficie oficial.

Contras:

- exige mudancas full stack coordenadas;
- precisa de mais testes de regressao;
- aumenta um pouco o tamanho do pacote.

Esforco:

- medio

Recomendacao:

- sim, esta e a abordagem recomendada

### Abordagem C — Novo modal operacional do zero, paralelo ao atual

O que faz:

- cria um novo shell/componente de detalhe e vai migrando a pagina de gestao para ele;
- trata a refatoracao quase como uma substituicao completa da experiencia atual.

Pros:

- liberdade maxima de desenho;
- facilita limpar herancas do componente atual.

Contras:

- cria duplicidade temporaria;
- aumenta custo de migracao e teste;
- desnecessario porque a entrypoint atual ja esta consolidada e o problema e mais de semantica do que de roteamento.

Esforco:

- alto

Recomendacao:

- descartar por YAGNI

---

## 8. Recomendacao Final

Seguir com a **Abordagem B**, dividida em builds seguros.

Traduzindo em decisao pratica:

- manter `RequestDetailDialog` como entrypoint publica da gestao;
- reestruturar internamente o modal por zonas de contexto;
- integrar `advance` como acao de fluxo faltante;
- corrigir o contrato de `requestAction`;
- restringir `finalize` para nao permitir encerramento prematuro;
- corrigir o shell visual do dialog em paralelo, mas sem tratar isso como objetivo unico da iteracao.

---

## 9. Divisao Sugerida em Builds

### 9.1 Build 1 — Correcoes de contrato e fluxo minimo

Objetivo:

- fechar os bugs comportamentais mais graves sem ainda redesenhar todo o modal.

Escopo:

- adicionar `advanceManagementRequest` no client;
- adicionar `advanceMutation` no hook;
- plugar CTA de `Avancar etapa` no modal;
- alinhar `canRequestAction` para owner ou responsavel;
- restringir `canFinalize` no detalhe e no runtime para nao encerrar em qualquer `in_progress`.

Resultado esperado:

- o fluxo deixa de ficar sem saida apos action;
- o chamado nao pode mais pular etapas por finalizacao precoce.

### 9.2 Build 2 — Refatoracao visual e hierarquia do modal

Objetivo:

- transformar o modal em uma superficie operacional mais legivel.

Escopo:

- reorganizar o shell em zonas:
  - resumo do chamado
  - etapa atual / proximo passo
  - action da etapa
  - acoes administrativas
  - blocos informativos
- reduzir dependencia do footer para acoes centrais;
- corrigir clipping do dialog/scroll/footer;
- revisar copy e destaque visual dos estados.

Resultado esperado:

- o usuario entende mais rapidamente o que pode fazer agora e por que.

### 9.3 Build 3 — Polimento e testes de confianca

Objetivo:

- consolidar a experiencia e travar regressao.

Escopo:

- testes unitarios/integrais do modal;
- cobertura de:
  - owner
  - responsavel
  - destinatario de action
  - estado sem action
  - action concluida aguardando advance
  - chamado elegivel a finalize
  - chamado finalizado/arquivado
- refinamentos de copy e disable states.

Resultado esperado:

- modal estabilizado para uso operacional diario.

---

## 10. YAGNI

Itens que nao valem entrar neste pacote:

- criar nova rota alem de `/gestao-de-chamados`;
- reabrir o requester ou o historico admin;
- redesenhar listas, tabs e filtros da pagina inteira;
- mexer em configuracao de workflow ou editor admin;
- alterar permissao de acesso da rota;
- reescrever o runtime inteiro de transicoes;
- criar novas categorias de status sem necessidade comprovada.

O foco aqui e:

- modal operacional
- contrato de acoes do detalhe
- clareza do proximo passo

Nao e:

- uma nova fase de redesign completo da gestao

---

## 11. Entendimento Consolidado

Se eu entendi corretamente, o pacote desejado e este:

- o modal alvo e o de `/gestao-de-chamados`, nao o requester nem o historico;
- os atores relevantes sao owner, responsavel e destinatario de action;
- o problema e full stack, nao apenas visual;
- a refatoracao deve ser segura, em etapas;
- a entrypoint publica deve continuar sendo `RequestDetailDialog`;
- o resultado esperado e um modal que reflita corretamente a maquina de estados do request e torne claro o proximo passo operacional.

---

## 12. Proximo Passo

Ready for `DEFINE`.

Sugestao de proximo artefato:

- `DEFINE_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

Foco esperado do define:

- criterios de visibilidade de `advance`, `requestAction`, `respondAction`, `finalize`, `archive`;
- regra exata para finalizacao segura;
- responsabilidades visuais de cada zona do modal;
- ordem dos builds;
- cobertura minima de teste por papel e por estado do request.
