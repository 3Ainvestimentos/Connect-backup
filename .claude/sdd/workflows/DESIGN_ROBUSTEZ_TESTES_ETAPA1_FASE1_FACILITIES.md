# DESIGN: ROBUSTEZ_TESTES_ETAPA1_FASE1_FACILITIES

> Generated: 2026-03-25
> Status: Ready for build
> Scope: Reforco de testes da Etapa 1 / Fase 1 de Facilities
> Base documents: `DESIGN_FASE1_FACILITIES_ETAPA1.md`, `DEFINE_FASE1_FACILITIES_ETAPA0.md`, `DESIGN_CORRECAO_IDENTIDADE_USUARIO_FASE1_FACILITIES.md`, `DESIGN_CORRECAO_CONTADOR_V2_SEM_FALLBACK_FASE1_FACILITIES.md`

## 1. Objetivo

Elevar a robustez dos testes da Etapa 1 para verificar, de forma objetiva, que a implementacao do runtime v2 de Facilities respeita as decisoes fechadas nos artefatos.

Este design nao muda o motor, o schema ou as regras de negocio. Ele amplia a cobertura de testes sobre o que ja foi decidido e implementado.

---

## 2. Problema

O bloco atual ja tem testes verdes para:

- resolucao `authUid -> id3a`
- authz basica de abertura
- normalizacao de payload
- contador v2
- parte dos use cases principais

Mas ainda faltam testes dedicados para regras importantes do design:

- autorizacao completa de `assign`, `finalize` e `archive`
- casos negativos adicionais de `assign-responsible`
- owner finalizando por excecao operacional
- falha de `actor-resolution` quando existe mais de um colaborador para o mesmo `authUid`
- contador existente sem `lastRequestNumber`

Isso nao invalida o build atual, mas reduz a confianca de que a Etapa 1 ficou fiel aos artefatos em todos os caminhos criticos.

---

## 3. Precedencia de Fonte

Em caso de divergencia:

1. [DEFINE_FASE1_FACILITIES_ETAPA0.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA0.md)
2. [DESIGN_FASE1_FACILITIES_ETAPA1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA1.md)
3. [DESIGN_CORRECAO_IDENTIDADE_USUARIO_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_CORRECAO_IDENTIDADE_USUARIO_FASE1_FACILITIES.md)
4. [DESIGN_CORRECAO_CONTADOR_V2_SEM_FALLBACK_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_CORRECAO_CONTADOR_V2_SEM_FALLBACK_FASE1_FACILITIES.md)

Os testes devem validar o contrato ja decidido, nao reinterpretar as regras.

---

## 4. Escopo

### Incluido

- reforco dos testes unitarios do runtime v2;
- ampliacao de cenarios negativos e de autorizacao;
- reforco dos testes do contador v2;
- verificacao explicita da correcao de identidade operacional;
- consolidacao de criterios objetivos para considerar a Etapa 1 validada.

### Fora de escopo

- testes end-to-end com Firebase real;
- emulator Firestore;
- testes de frontend consolidado da Etapa 2;
- redesenho do runtime.

---

## 5. Matriz de Regras que Devem Ficar Cobertas

### 5.1. Identidade e autenticacao operacional

Deve ficar coberto que:

- o runtime autentica com Firebase e opera com `id3a`;
- `resolveRuntimeActor` falha quando:
  - nao ha colaborador para o `authUid`;
  - ha mais de um colaborador para o mesmo `authUid`;
  - o colaborador nao possui `id3a`;
- `allowedUserIds` sao comparados contra `id3a`, nao `authUid`.

### 5.2. Authz do runtime

Deve ficar coberto que:

- `assertCanOpen` aceita `id3a` permitido;
- `assertCanOpen` rejeita `authUid` antigo;
- `assertCanAssign` permite apenas owner;
- `assertCanFinalize` permite:
  - responsavel atual
  - owner como excecao operacional
- `assertCanFinalize` rejeita usuario que nao e owner nem responsavel;
- `assertCanArchive` permite apenas owner.

### 5.3. Regras de `assign-responsible`

Deve ficar coberto que:

- primeira atribuicao materializa entrada em `Em andamento`;
- reatribuicao nao volta etapa nem muda fluxo indevidamente;
- `responsible_assigned` e `responsible_reassigned` sao distinguidos;
- `assign-responsible` falha em `waiting_action`;
- `assign-responsible` falha se a versao publicada nao existir;
- `assign-responsible` falha se a etapa `work` nao existir;
- `assign-responsible` falha quando o ator nao e owner.

### 5.4. Regras de `advance-step`

Deve ficar coberto que:

- `advance-step` bloqueia quando o proximo passo e final;
- `advance-step` falha se o ator nao for o responsavel correto;
- `advance-step` falha se o request estiver finalizado ou arquivado.

### 5.5. Regras de `finalize-request`

Deve ficar coberto que:

- `finalize-request` e o unico caminho para a etapa final;
- responsavel atual pode finalizar;
- owner pode finalizar por excecao operacional;
- usuario nao autorizado nao pode finalizar;
- finalize falha fora de `in_progress`;
- `closedAt = finalizedAt`;
- `statusCategory = finalized`.

### 5.6. Regras de `archive-request`

Deve ficar coberto que:

- archive so ocorre apos finalizacao;
- owner pode arquivar;
- usuario nao-owner nao pode arquivar;
- `archivedAt` e separado de `closedAt`;
- request ja arquivado nao pode ser arquivado de novo.

### 5.7. Contador v2

Deve ficar coberto que:

- `open-request` falha sem `counters/workflowCounter_v2`;
- `open-request` falha com `lastRequestNumber` ausente ou invalido;
- incremento ocorre a partir do `lastRequestNumber` valido;
- seed cria contador apenas quando ausente;
- seed preserva contador existente valido;
- seed falha se o contador existente estiver malformado.

### 5.8. Normalizacao de formulario

Deve ficar coberto que:

- `centrodecusto -> centro_custo` acontece corretamente;
- conflito entre `centrodecusto` e `centro_custo` gera erro;
- workflow que nao precisa de normalizacao nao sofre mutacao indevida.

---

## 6. Estrategia de Testes

```text
Runtime v2 tests
  |
  +--> authz.test.js
  |     |- open
  |     |- assign
  |     |- finalize
  |     |- archive
  |
  +--> actor-resolution.test.js
  |     |- 0 matches
  |     |- 1 valid match
  |     |- >1 matches
  |     |- missing id3a
  |
  +--> repository.test.js
  |     |- counter ok
  |     |- counter missing
  |     |- counter invalid
  |     |- seed create/preserve/fail
  |
  +--> runtime-use-cases.test.js
        |- assign first assignment
        |- reassign
        |- waiting_action reject
        |- finalize owner/responsible
        |- archive owner only
        |- advance negative guards
```

---

## 7. Arquivos Afetados

### 7.1. Testes existentes a expandir

- `src/lib/workflows/runtime/__tests__/actor-resolution.test.js`
- `src/lib/workflows/runtime/__tests__/authz.test.js`
- `src/lib/workflows/runtime/__tests__/input-normalization.test.js`
- `src/lib/workflows/runtime/__tests__/repository.test.js`
- `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js`

### 7.2. Regra de organizacao

Nao criar nova infraestrutura de teste.

Usar o padrao atual:

- Jest
- mocks manuais
- escopo unitario do runtime

---

## 8. Casos Minimos a Adicionar

### 8.1. `actor-resolution.test.js`

Adicionar:

- falha quando `snap.size > 1`
- fallback de `actorName` quando nome estiver ausente

### 8.2. `authz.test.js`

Adicionar:

- `assertCanAssign` aceita owner
- `assertCanAssign` rejeita nao-owner
- `assertCanFinalize` aceita responsavel
- `assertCanFinalize` aceita owner
- `assertCanFinalize` rejeita terceiro
- `assertCanArchive` aceita owner
- `assertCanArchive` rejeita nao-owner

### 8.3. `input-normalization.test.js`

Adicionar:

- payload sem `centrodecusto` permanece intacto
- workflow nao alvo da normalizacao nao e alterado indevidamente, se houver helper com `workflowTypeId`

### 8.4. `repository.test.js`

Adicionar:

- contador existente sem `lastRequestNumber`
- contador existente com `lastRequestNumber = null`
- seed falha quando o documento existe mas esta malformado

### 8.5. `runtime-use-cases.test.js`

Adicionar:

- `assign-responsible` em `waiting_action`
- `assign-responsible` por ator nao-owner
- `reassign-responsible` preservando etapa atual
- `finalize-request` por owner
- `finalize-request` por terceiro nao autorizado
- `archive-request` por nao-owner
- `archive-request` em request ja arquivado

---

## 9. Critérios de Saída

O reforco de testes da Etapa 1 fica pronto quando:

- todas as regras listadas na secao 5 tiverem cobertura dedicada ou explicitamente justificada;
- os testes do runtime passarem localmente com Jest;
- nao houver dependencias de Firebase real para validar o bloco;
- a Etapa 1 puder ser considerada implementada e verificada contra os artefatos, e nao apenas contra o comportamento acidental do codigo atual.

---

## 10. Passo a Passo de Implementacao

1. Expandir `authz.test.js` para cobrir `assign`, `finalize` e `archive`.
2. Expandir `actor-resolution.test.js` com o caso de multiplos colaboradores.
3. Expandir `repository.test.js` com os cenarios malformados do contador.
4. Expandir `runtime-use-cases.test.js` com os casos negativos e de owner exception.
5. Ajustar `input-normalization.test.js` com cenarios de nao-mutacao indevida.
6. Rodar os testes do runtime em `--runInBand`.
7. Registrar no report final quantas regras da secao 5 ficaram cobertas.

---

## 11. Rollback

Se algum reforco de teste expuser divergencia no runtime:

1. nao mascarar o problema alterando o teste para aceitar comportamento indevido;
2. corrigir o runtime apenas quando a divergencia contrariar os artefatos;
3. se o gap for apenas de cobertura, manter a implementacao e adicionar os testes faltantes;
4. separar claramente "falha de teste por bug real" de "falha por mock incompleto".

---

## 12. Resultado Esperado

Apos esta etapa de robustez:

- a Etapa 1 tera cobertura mais confiavel sobre identidade, authz, contador e use cases principais;
- os caminhos negativos importantes do piloto ficarao protegidos por teste;
- a implementacao podera ser considerada validada contra o `DEFINE` e os `DESIGNs`, e nao apenas "funcionando nos caminhos felizes".
