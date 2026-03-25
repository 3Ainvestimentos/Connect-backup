# DESIGN: CORRECAO_CONTADOR_V2_FASE1_FACILITIES

> Generated: 2026-03-25
> Status: Ready for build
> Scope: Correcao do contador sequencial do runtime v2 na Fase 1 / Facilities
> Base documents: `DESIGN_FASE1_FACILITIES_ETAPA1.md`, `WORKFLOWS_PRE_BUILD_OFICIAL.md`

## 1. Objetivo

Corrigir o contrato operacional do contador sequencial do runtime v2 para que:

- o nome do campo persistido fique alinhado com a documentacao;
- a v2 nao reinicie em `1`;
- os chamados novos nao colidam visualmente com o legado;
- o seed inicial do piloto deixe o contador pronto para o primeiro request v2;
- o runtime continue isolado em `_v2`.

Esta correcao nao redesenha o motor. Ela trata apenas o contador global de `requestId` da v2.

---

## 2. Problema

Hoje existem tres convencoes diferentes para contador:

- legado:
  - `counters/workflowCounter.currentNumber`
- v2 atual no codigo:
  - `counters/workflowCounter_v2.count`
- documentacao da v2:
  - `counters/workflowCounter_v2.lastRequestNumber`

Ao mesmo tempo, o fallback atual da v2 parte de `0` quando o documento nao existe, o que faria o primeiro request v2 nascer como `1`.

Isso e inadequado porque:

- o ultimo request legado conhecido ja e `0705`;
- `requestId` e um identificador user-facing;
- abrir a v2 a partir de `1` gera ambiguidade operacional com os chamados existentes.

---

## 3. Decisoes Canonicas

### 3.1. Documento do contador v2

O contador da v2 continua em:

- `counters/workflowCounter_v2`

### 3.2. Campo canonico

O unico campo persistido para o contador v2 passa a ser:

- `lastRequestNumber`

`count` deixa de ser usado.

### 3.3. Offset inicial do piloto

Decisao fechada:

- ultimo ID legado conhecido: `0705`
- faixa inicial da v2: `0800`

Logo:

- o seed do contador v2 deve persistir `lastRequestNumber = 799`
- o primeiro request aberto na v2 deve receber `requestId = 800`

### 3.4. Tipo de `requestId`

Na v2, `requestId` continua persistido como numero:

- `800`
- `801`
- `802`

Se a UI precisar exibir `0800`, isso deve ser feito na camada de apresentacao, nao no dado persistido.

---

## 4. Arquitetura Corrigida

```text
Manual seed
  |
  +--> workflowTypes_v2/{workflowTypeId}
  +--> workflowTypes_v2/{workflowTypeId}/versions/1
  +--> counters/workflowCounter_v2 {
         lastRequestNumber: 799
       }

open-request
  |
  +--> runTransaction()
         1. read counters/workflowCounter_v2.lastRequestNumber
         2. nextId = lastRequestNumber + 1
         3. write lastRequestNumber = nextId
         4. create workflows_v2/{docId} with requestId = nextId
```

---

## 5. Escopo da Correcao

### 5.1. Runtime

Corrigir em `src/lib/workflows/runtime/repository.ts`:

- leitura do contador:
  - de `count`
  - para `lastRequestNumber`
- escrita do contador:
  - de `{ count: nextId }`
  - para `{ lastRequestNumber: nextId }`
- fallback local quando o documento nao existe:
  - deixar de assumir `0` como contrato final do piloto
  - assumir `799` apenas se a estrategia de seed ainda nao tiver sido executada e o codigo optar por ser defensivo

### 5.2. Seed manual

Corrigir em `src/scripts/seed-fase1-facilities-v1.ts`:

- o seed deixa de publicar apenas `workflowTypes_v2` e `versions/1`
- passa tambem a garantir o documento:
  - `counters/workflowCounter_v2`
- payload do contador:

```json
{
  "lastRequestNumber": 799
}
```

### 5.3. Documentacao

Alinhar os artefatos operacionais da Fase 1 para uma unica convencao:

- `counters/workflowCounter_v2.lastRequestNumber`

Se algum documento ainda mencionar `count`, deve ser atualizado.

---

## 6. Regras de Implementacao

### 6.1. Regra principal

O runtime v2 nao deve gerar IDs na mesma faixa do legado.

### 6.2. Regra de seed

Antes da primeira abertura real do piloto, o seed manual deve garantir:

- `workflowTypes_v2`
- `versions/1`
- `counters/workflowCounter_v2.lastRequestNumber = 799`

### 6.3. Regra de fallback

Como medida defensiva, o runtime pode manter fallback para o caso de o contador nao existir.

Mas esse fallback deve estar alinhado com a decisao do piloto:

- fallback recomendado:
  - `799`
- nao `0`

Observacao:

- o caminho preferido continua sendo seed explicito do contador antes de qualquer abertura real;
- o fallback existe apenas para evitar regressao acidental em ambiente incompleto.

### 6.4. Regra de compatibilidade

Nao deve existir leitura de `currentNumber` nem `count` no runtime v2.

O legado continua com sua propria convencao:

- `counters/workflowCounter.currentNumber`

O v2 deve ficar isolado em:

- `counters/workflowCounter_v2.lastRequestNumber`

---

## 7. ADRs

### ADR-CTR-001: Campo canonico do contador v2 e `lastRequestNumber`

**Decisao**

O campo persistido do contador global da v2 passa a ser `lastRequestNumber`.

**Motivo**

Alinha runtime, documentacao, seed e operacao a uma unica convencao.

### ADR-CTR-002: A v2 comeca na faixa `0800`

**Decisao**

O contador v2 nasce com `lastRequestNumber = 799`.

**Motivo**

Evita conflito visual e operacional com o legado, cujo ultimo ID conhecido e `0705`.

### ADR-CTR-003: O seed do piloto tambem materializa o contador v2

**Decisao**

O script manual de seed da Fase 1 passa a gravar o documento do contador.

**Motivo**

Tira do runtime a responsabilidade de inaugurar a faixa da v2 por acaso.

---

## 8. Arquivos Afetados

### 8.1. Codigo

- `src/lib/workflows/runtime/repository.ts`
- `src/scripts/seed-fase1-facilities-v1.ts`

### 8.2. Testes

- `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js`

Adicionar ou ajustar cobertura para:

- leitura de `lastRequestNumber`
- incremento para `800` quando seeded em `799`
- comportamento defensivo quando o contador ainda nao existe

### 8.3. Documentacao

Revisar, no minimo:

- `docs/workflows_new/docs_step2/diagrams/01-firestore-collections-erd.mmd`
- `docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md`
- `docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md`
- `docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md`
- `.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA1.md`

Se ja estiverem em `lastRequestNumber`, apenas confirmar consistencia.

---

## 9. Passo a Passo de Implementacao

1. Atualizar `repository.ts` para trocar `count` por `lastRequestNumber`.
2. Ajustar o calculo do proximo ID para partir de `lastRequestNumber`.
3. Substituir o fallback `0` por `799`, com comentario explicando que isso e apenas defesa para ambiente nao seedado.
4. Atualizar o script `seed-fase1-facilities-v1.ts` para tambem gravar `counters/workflowCounter_v2`.
5. Garantir que o seed escreva `lastRequestNumber = 799`.
6. Ajustar ou adicionar testes do runtime cobrindo:
   - incremento em cima de `lastRequestNumber`
   - primeiro request da v2 como `800`
7. Fazer varredura documental para garantir que a Fase 1 inteira fala em `lastRequestNumber`.
8. Executar dry-run do seed.
9. Executar o seed real somente depois da revisao final.

---

## 10. Rollback

Se a correcao falhar:

1. nao executar o seed real do contador;
2. manter o runtime v2 fora de uso operacional;
3. reverter apenas o bloco do contador sem tocar `workflowTypes_v2` e `versions`;
4. nao abrir requests reais em `workflows_v2` ate o contador estar consistente.

---

## 11. Resultado Esperado

Apos esta correcao:

- o contador v2 usa um nome unico e documentado;
- a primeira abertura real da v2 gera `requestId = 800`;
- o runtime novo nao conflita visualmente com os chamados legados;
- seed, runtime e docs passam a falar a mesma lingua para o contador.
