# DESIGN: CORRECAO_CONTADOR_V2_SEM_FALLBACK_FASE1_FACILITIES

> Generated: 2026-03-25
> Status: Ready for build
> Scope: Endurecimento operacional do contador v2 da Fase 1 / Facilities
> Base documents: `DESIGN_CORRECAO_CONTADOR_V2_FASE1_FACILITIES.md`, `DESIGN_FASE1_FACILITIES_ETAPA1.md`

## 1. Objetivo

Endurecer o uso do contador global da v2 agora que o documento manual ja existe em producao:

- remover o fallback automatico para `799` do runtime;
- tratar `counters/workflowCounter_v2` como pre-requisito operacional explicito;
- impedir que o seed resete o contador depois que o piloto for inaugurado;
- reduzir o risco de reuso acidental de `requestId` na faixa `0800+`.

Esta correcao nao altera workflowTypes, versions, authz ou o modelo de identidade. Ela atua apenas no contrato operacional do contador v2.

---

## 2. Contexto Atual

Estado ja decidido e existente:

- documento manual criado:
  - `counters/workflowCounter_v2`
- campo atual:
  - `lastRequestNumber`
- valor inicial configurado:
  - `799`

Com isso, o runtime nao precisa mais "adivinhar" o inicio da faixa.

---

## 3. Problema

Mesmo depois da normalizacao para `lastRequestNumber`, ainda restam dois riscos:

1. o runtime cai silenciosamente para `799` se o contador nao existir ou estiver invalido;
2. o seed manual ainda grava `lastRequestNumber = 799` em todo `--execute`.

Consequencias:

- se o documento for apagado, corrompido ou mal preenchido, o runtime pode voltar a gerar `800`;
- se o seed for rerodado apos requests reais na v2, o contador pode ser resetado;
- isso cria risco direto de reuso de `requestId`.

---

## 4. Decisoes Canonicas

### 4.1. O contador v2 vira pre-condicao obrigatoria

O runtime da v2 passa a exigir a existencia do documento:

- `counters/workflowCounter_v2`

Se ele nao existir, `open-request` deve falhar.

### 4.2. O campo continua sendo `lastRequestNumber`

O contrato do contador nao muda:

- documento:
  - `counters/workflowCounter_v2`
- campo:
  - `lastRequestNumber`

### 4.3. O seed nao pode resetar contador existente

O seed manual da Fase 1 deixa de ser um inicializador sempre reexecutavel para o contador.

Nova regra:

- se o contador nao existir:
  - o seed pode materializar `lastRequestNumber = 799`
- se o contador ja existir:
  - o seed nao deve sobrescrever automaticamente
  - deve falhar ou pular explicitamente a escrita do contador

### 4.4. O valor `799` continua sendo apenas estado inicial

`799` deixa de ser fallback de runtime.

Ele passa a existir apenas como:

- valor inicial do documento criado manualmente;
- ou valor de bootstrap controlado em ambiente ainda nao inaugurado.

---

## 5. Arquitetura Corrigida

```text
Manual provisioning
  |
  +--> counters/workflowCounter_v2 {
         lastRequestNumber: 799
       }

Seed (workflow types / versions)
  |
  +--> workflowTypes_v2/{workflowTypeId}
  +--> workflowTypes_v2/{workflowTypeId}/versions/1
  +--> validates counter state
       |- if missing in pristine env: may create 799
       |- if already exists: must not reset

open-request
  |
  +--> runTransaction()
         1. read counters/workflowCounter_v2
         2. assert document exists
         3. assert lastRequestNumber is numeric
         4. nextId = lastRequestNumber + 1
         5. write lastRequestNumber = nextId
         6. create workflows_v2/{docId}
```

---

## 6. Escopo da Correcao

### 6.1. Runtime

Corrigir em `src/lib/workflows/runtime/repository.ts`:

- remover `COUNTER_FALLBACK_LAST_REQUEST_NUMBER`
- remover fallback silencioso para `799`
- se o documento do contador nao existir:
  - falhar com erro explicito
- se `lastRequestNumber` nao for numerico:
  - falhar com erro explicito

### 6.2. Seed

Corrigir em `src/scripts/seed-fase1-facilities-v1.ts` e helpers relacionados:

- nao resetar o contador existente para `799`
- se o contador ja existir:
  - logar que o documento foi preservado
  - ou falhar com mensagem explicita
- se o contador nao existir em ambiente virgem:
  - permitir criacao controlada com `799`

### 6.3. Documentacao

Documentar que:

- `counters/workflowCounter_v2` ja foi provisionado manualmente;
- o contador deixou de ser bootstrapado por fallback no runtime;
- seed do piloto nao deve ser usado como reset da faixa sequencial.

---

## 7. Contrato Operacional Recomendado

### 7.1. Regras de `open-request`

`open-request` deve:

1. ler `counters/workflowCounter_v2`;
2. falhar se o documento nao existir;
3. falhar se `lastRequestNumber` estiver ausente ou nao for numero;
4. incrementar normalmente a partir desse valor;
5. criar o request no mesmo `runTransaction`.

### 7.2. Erros recomendados

Adicionar ou reutilizar codigos de erro claros, por exemplo:

- `COUNTER_NOT_INITIALIZED`
- `INVALID_REQUEST_COUNTER`

Se o catalogo atual nao justificar novos codigos, ao menos retornar erro operacional explicito e nao cair em fallback.

### 7.3. Regras do seed

O seed deve seguir uma destas politicas e registrar isso no output:

- politica recomendada:
  - se o contador existe, preservar e nao regravar;
  - se nao existe, criar com `799`;

ou

- politica alternativa:
  - se o contador existe, falhar e exigir acao manual.

Para o estado atual do piloto, a politica recomendada e a primeira.

---

## 8. ADRs

### ADR-CTR-HARD-001: Sem fallback de runtime para o contador v2

**Decisao**

O runtime v2 deixa de assumir `799` como fallback automatico.

**Motivo**

Agora o contador ja foi provisionado manualmente, entao fallback silencioso vira risco de duplicidade e nao mais ajuda de bootstrap.

### ADR-CTR-HARD-002: O seed preserva contador existente

**Decisao**

O seed do piloto nao deve sobrescrever `counters/workflowCounter_v2` quando o documento ja existir.

**Motivo**

Evita reset acidental da faixa sequencial apos requests reais na v2.

---

## 9. Arquivos Afetados

### 9.1. Codigo

- `src/lib/workflows/runtime/repository.ts`
- `src/scripts/seed-fase1-facilities-v1.ts`

### 9.2. Testes

- `src/lib/workflows/runtime/__tests__/repository.test.js`

Coberturas minimas:

- falha quando o contador nao existe;
- falha quando `lastRequestNumber` e invalido;
- seed preserva contador existente;
- seed cria contador apenas quando ausente.

### 9.3. Documentacao

Revisar, se necessario:

- `.claude/sdd/workflows/DESIGN_CORRECAO_CONTADOR_V2_FASE1_FACILITIES.md`
- `.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA1.md`
- `docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md`

---

## 10. Passo a Passo de Implementacao

1. Remover o fallback `COUNTER_FALLBACK_LAST_REQUEST_NUMBER` de `repository.ts`.
2. Fazer `createRequestTransactionally()` falhar quando o contador nao existir.
3. Fazer `createRequestTransactionally()` falhar quando `lastRequestNumber` nao for numero.
4. Ajustar o seed para:
   - ler `counters/workflowCounter_v2` antes de gravar;
   - preservar o documento se ele ja existir;
   - criar com `799` apenas quando estiver ausente.
5. Atualizar testes do repositório cobrindo os novos comportamentos.
6. Atualizar a documentacao curta da Etapa 1, se ela ainda insinuar fallback automatico.

---

## 11. Rollback

Se a correcao falhar:

1. manter o contador manual como esta;
2. nao rodar novo seed real;
3. restaurar apenas o comportamento anterior do codigo se necessario;
4. nao abrir requests reais ate a validacao do contador terminar.

---

## 12. Resultado Esperado

Apos esta correcao:

- o runtime v2 depende de um contador real e integro;
- o seed nao reseta a faixa `0800+`;
- o risco de duplicidade por fallback ou re-seed cai drasticamente;
- o contador da v2 passa a ser tratado como infraestrutura controlada, nao como conveniencia do runtime.
