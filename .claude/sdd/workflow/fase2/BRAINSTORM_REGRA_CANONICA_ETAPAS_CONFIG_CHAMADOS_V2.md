# BRAINSTORM: Regra canonica de etapas no Config. de Chamados V2

> Generated: 2026-04-15
> Status: Exploracao concluida
> Scope: Definir a forma mais segura de tornar `statusKey` e `kind` nao editaveis no configurador, sem quebrar o runtime operacional dos workflows v2

## 1. Contexto

No uso real da tela `Config. de Chamados V2`, surgiu a necessidade de travar a semantica das etapas para evitar configuracoes inconsistentes.

Regra desejada:

- etapa inicial = `solicitacao_aberta` / `start`
- etapa intermediaria = `em_andamento` / `work`
- etapa final = `finalizado` / `final`

O objetivo aqui nao e visual. O foco e garantir que essa regra nao afete o funcionamento da ferramenta e que o usuario do configurador nao consiga editar manualmente `statusKey` e `kind`.

---

## 2. Perguntas respondidas

### 2.1. Quem vai usar?

- admins com permissao de configuracao em `/admin/request-config`

### 2.2. Onde aparece?

- no configurador `V2`
- especialmente no editor de versao/steps

### 2.3. O que envolve?

- frontend + backend + contrato do runtime
- nao e apenas UX

### 2.4. Urgencia

- alta, mas o foco deve ser a seguranca da regra antes dos ajustes marginais da tela

### 2.5. Papel do `statusKey` no read-model

- `currentStepName` ja e suficiente para indicar em que etapa o request esta
- portanto, `currentStatusKey` pode assumir papel de categoria canonica, e nao de identificador granular por etapa

---

## 3. O que o codigo confirma hoje

### 3.1. `initialStepId`, `statusKey` e `kind` afetam o runtime real

Ao abrir um chamado, o backend usa a versao publicada para definir etapa atual e status atual:

- [open-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/open-request.ts)
  - usa `version.initialStepId`
  - usa `initialStep.statusKey`

Na primeira atribuicao de responsavel, o backend procura a etapa `work`:

- [assign-responsible.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/assign-responsible.ts)
  - se o chamado esta `open`, resolve a primeira etapa com `kind === 'work'`
  - move o chamado para essa etapa

Ao avancar, o backend pega a proxima etapa da `stepOrder` e grava seu `statusKey`:

- [advance-step.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts)

Ao finalizar, o backend procura a etapa `final`:

- [finalize-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/finalize-request.ts)

### 3.2. Hoje o save do admin-config NAO impone a regra

No admin-config, o backend ainda aceita `statusKey`, `kind` e `initialStepId` vindos do payload:

- [draft-repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts)
  - parseia `statusKey`
  - parseia `kind`
  - parseia `initialStepId`
  - persiste esses valores normalizados, mas nao os deriva por regra canonica

Logo:

- deixar a regra so no frontend nao e suficiente
- outro cliente ou payload futuro poderia persistir versoes inconsistentes

### 3.3. A logica atual nao bate 100% com a regra pedida

Dois pontos impedem implementar a regra apenas “escondendo os campos”:

1. o publishability ainda rejeita `statusKey` duplicado:
   - [publishability.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publishability.ts)
2. a primeira atribuicao de responsavel depende de existir pelo menos uma etapa `work`:
   - [assign-responsible.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/assign-responsible.ts)

Isso significa:

- se houver mais de uma etapa intermediaria e todas virarem `em_andamento`, a validacao atual bloqueia
- se um fluxo acabar sem etapa intermediaria `work`, a primeira atribuicao quebra

### 3.4. O runtime aceita semanticamente varias etapas `work`

O motor nao exige unicidade de `work`; ele:

- usa a primeira etapa `work` na primeira atribuicao
- depois segue a `stepOrder` normalmente no advance

Arquivos-chave:

- [engine.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/engine.ts)
- [assign-responsible.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/assign-responsible.ts)
- [advance-step.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts)

Entao o problema maior hoje nao e “ter mais de uma etapa work”; o problema maior e:

- `statusKey` duplicado ser rejeitado pelo publishability
- nao existir etapa intermediaria nenhuma

---

## 4. Problema real

Queremos tirar do usuario a edicao de `statusKey` e `kind`, mas esses campos hoje fazem parte do contrato operacional da versao publicada.

Se errarmos a estrategia:

- o configurador pode salvar algo que o runtime nao espera
- a atribuicao inicial pode falhar
- a publicacao pode continuar bloqueando workflows validos para a nova regra
- o frontend pode parecer correto, mas o backend continuar vulneravel a payload inconsistente

---

## 5. Abordagens

### Abordagem A. Regra so no frontend, escondendo os campos

#### Como seria

- o editor deixa de exibir `statusKey` e `kind`
- o frontend passa a preencher automaticamente:
  - primeira = `solicitacao_aberta/start`
  - intermediarias = `em_andamento/work`
  - ultima = `finalizado/final`

#### Vantagens

- implementacao mais rapida
- menor impacto inicial no backend

#### Desvantagens

- insegura
- o backend continuaria aceitando payload inconsistente
- a regra ficaria duplicada entre UI e persistencia
- continuaria batendo na validacao atual de `statusKey` duplicado

#### Veredito

Nao recomendado.

---

### Abordagem B. Regra conjunta front + backend, com backend como fonte de verdade

#### Como seria

- frontend:
  - remove a edicao de `statusKey`
  - remove a edicao de `kind`
  - exibe esses valores apenas como derivados/read-only ou nem exibe
- backend:
  - ignora `statusKey` e `kind` do payload
  - deriva os valores por posicao em `stepOrder`
  - define:
    - primeira etapa = `solicitacao_aberta/start`
    - ultima etapa = `finalizado/final`
    - qualquer etapa entre elas = `em_andamento/work`

Tambem seriam necessarios guardrails:

1. relaxar ou substituir a regra de `statusKey` unico no publishability
2. exigir pelo menos uma etapa intermediaria ou, equivalentemente, pelo menos 3 etapas
3. tornar `initialStepId` derivado da primeira etapa, nao mais editavel
4. alinhar testes de admin-config e runtime a essa nova invariavel

#### Vantagens

- regra fica sistemica
- evita drift entre editor e runtime
- reduz erro humano no configurador
- conversa com o canon ja usado em partes do projeto (`solicitacao_aberta`, `em_andamento`, `finalizado`)

#### Desvantagens

- mexe no contrato de persistencia
- precisa rever validacao de publishability
- pede ajuste de testes e de alguns comentarios/assuncoes do runtime

#### Veredito

Recomendado.

---

### Abordagem C. Regra conjunta, mas restringindo oficialmente o modelo a 3 etapas canonicas

#### Como seria

- alem de derivar `statusKey`/`kind`, o configurador e o backend passariam a aceitar apenas:
  - 1 etapa inicial
  - 1 etapa intermediaria
  - 1 etapa final

#### Vantagens

- simplifica muito o runtime
- elimina ambiguidades
- elimina duplicidade de `statusKey`

#### Desvantagens

- muda o produto de forma mais profunda
- corta flexibilidade real do editor
- pode conflitar com workflows que precisam de mais de uma etapa operacional

#### Veredito

So faz sentido se o produto quiser simplificar o modelo inteiro. Para o problema atual, parece agressiva demais.

---

## 6. Recomendacao

### Recomendada: Abordagem B

Ela preserva o modelo atual de varias etapas, mas tira do usuario a parte semantica sensivel e coloca o backend como autoridade.

### Regra recomendada

- `initialStepId` = sempre a primeira etapa da `stepOrder`
- primeira etapa = `solicitacao_aberta` + `start`
- ultima etapa = `finalizado` + `final`
- qualquer etapa entre a primeira e a ultima = `em_andamento` + `work`

### Decisao de produto fechada para `statusKey`

Como `currentStepName` ja cobre a granularidade operacional da etapa atual, `statusKey` deve passar a representar apenas a categoria canonica do fluxo:

- `solicitacao_aberta`
- `em_andamento`
- `finalizado`

Ou seja:

- nao vamos auto-derivar `statusKey` do `stepName`
- vamos padronizar o vocabulario fixo
- a leitura detalhada da etapa continua vindo de `currentStepName`

### Condicoes para ser segura

1. o backend precisa derivar isso no save/publicacao, nao apenas o frontend
2. a publicacao nao pode mais reprovar duplicidade de `statusKey` intermediario se a nova regra oficial permitir isso
3. a versao precisa ter pelo menos uma etapa intermediaria `work`

### Conclusao tecnica direta

Sim, **podemos fazer assim**, mas nao como regra apenas de front.

Do jeito mais seguro, essa deve ser uma regra conjunta entre:

- editor/admin-config
- persistencia do draft/publicacao
- publishability
- testes do runtime

---

## 7. YAGNI

Para esta rodada, nao precisamos:

- redesenhar o restante da UI do configurador
- mexer em modais, labels e CTA marginais
- criar DSL nova de workflow
- mexer em filtros, historico ou areas

O essencial desta rodada e:

- travar a semantica de etapas
- garantir coerencia entre editor e backend
- impedir configuracoes impossiveis para o runtime

---

## 8. Confirmacao de entendimento

Entendimento consolidado:

- `statusKey` e `kind` hoje interferem no funcionamento real do backend
- a regra nao deve ficar so no frontend
- a forma mais segura e derivar `initialStepId`, `statusKey` e `kind` no backend por posicao da etapa
- o frontend deve apenas refletir essa regra e retirar a possibilidade de edicao manual
- o configurador deve exigir minimo de 3 etapas
- `statusKey` passa a ser categoria canonica fixa, enquanto `currentStepName` preserva o nome granular da etapa

---

## 9. Proximo passo recomendado

Criar um `DEFINE` focado apenas nesta invariavel, fechando:

1. se o minimo sera de 3 etapas obrigatorias
2. como o backend derivara `initialStepId`, `statusKey` e `kind`
3. como o publishability deixara de conflitar com `em_andamento` repetido
4. quais testes de runtime/admin-config precisam ser atualizados
