# DESIGN: Correcoes Pos-Build da Fase 2C - Seed dos 30 Workflows

> Generated: 2026-04-06
> Status: Ready for build
> Scope: Fase 2 / 2C - fechamento das correcoes residuais de cobertura e contrato apos o build da seed
> Base document: `DEFINE_CORRECOES_POS_BUILD_FASE2C_SEED_30_WORKFLOWS.md`
> Parent design: `DESIGN_FASE2C_SEED_30_WORKFLOWS.md`
> Parent build: `BUILD_FASE2C_SEED_30_WORKFLOWS.md`

## 1. Objetivo

Fechar as tres lacunas residuais identificadas na revisao do build da 2C sem alterar a arquitetura da seed por lotes, sem reabrir decisoes macro e sem introduzir novas escritas no Firestore:

- adicionar cobertura representativa de `lote 4` na suite de `payload-builder`;
- cobrir explicitamente o caminho `counterStatus = absent` na suite de `execution`;
- documentar em `StepActionDef` que `approverIds` representa identidades operacionais `id3a`.

Esta microetapa existe para aumentar a garantia operacional antes dos `dry-run` e `--execute` reais por lote, mantendo intacto o comportamento funcional ja entregue.

Esta microetapa nao cobre:

- mudancas no pipeline compartilhado da `fase2c`;
- alteracao de manifestos, `lotStatus` ou politica de `active`;
- implementacao do runtime de `requestAction/respondAction`;
- qualquer mudanca de schema, colecao ou endpoint.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_CORRECOES_POS_BUILD_FASE2C_SEED_30_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECOES_POS_BUILD_FASE2C_SEED_30_WORKFLOWS.md)
- [DESIGN_FASE2C_SEED_30_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2C_SEED_30_WORKFLOWS.md)
- [BUILD_FASE2C_SEED_30_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BUILD_FASE2C_SEED_30_WORKFLOWS.md)
- [payload-builder.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts)
- [execution.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js)
- [execution.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/execution.ts)
- [lote-04-gente-servicos-atendimento.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/manifests/lote-04-gente-servicos-atendimento.ts)
- [workflowDefinitions.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_CORRECOES_POS_BUILD_FASE2C_SEED_30_WORKFLOWS.md` para escopo e aceite;
2. depois prevalece o design macro da 2C ja aprovado;
3. depois prevalece a implementacao real existente no repositorio;
4. depois prevalece este documento para orientar o build da microetapa.

---

## 3. Estado Atual e Delta da Microetapa

### 3.1. O que o repositorio ja faz corretamente

- o pipeline compartilhado da 2C ja constroi payloads por manifesto, inspeciona o contador v2 e faz `--dry-run` / `--execute` sem escrita em `counters/workflowCounter_v2`;
- `inspectCounterStatus()` ja diferencia `present_valid`, `present_invalid` e `absent`;
- a politica de `active` ja e derivada de `entry.lotStatus === 'enabled'`, o que mantem lotes `4` e `5` bloqueados em `active: false`;
- `StepActionDef` ja existe e o builder da 2C ja persiste `stepsById[*].action`;
- o lote `4` ja esta materializado em manifesto proprio com `lotStatus: validated`.

### 3.2. Lacunas objetivas observadas no codigo atual

- a suite [payload-builder.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts) cobre hoje os lotes `1`, `2`, `3` e `5`, mas nao possui caso representativo do `lote 4`;
- a suite [execution.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js) valida `dry-run`, destino ja existente e `counterStatus = present_invalid`, mas nao cobre explicitamente o caso `absent`;
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts) anota `ownerUserId`, `requesterUserId` e outros ids operacionais, mas `StepActionDef.approverIds` ainda esta sem nota semantica equivalente.

### 3.3. Workflow representativo escolhido para `lote 4`

O caso de teste representativo do `lote 4` deve usar o workflow legado `q55MFr8p9Tbcbsh6kpm1`:

- nome legado: `Solicitacao de Ferias / Ausencia / Compensacao de horas`;
- `workflowTypeId`: `gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas`;
- motivo da escolha: e o caso mais sensivel do lote porque ja carrega `status.action`, com `type: acknowledgement` e `approverIds: ['DFA']`.

Esse caso cobre exatamente o recorte pedido no DEFINE:

- preservacao de `action`;
- bloqueio de `active` por `lotStatus = validated`;
- verificacao barata de que nao surgiram overrides tecnicos inesperados em `status.id` ou `field.id`.

### 3.4. Limites nao negociaveis desta correcao

- nao modificar [execution.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/execution.ts) nem [payload-builder.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts);
- nao alterar manifestos da 2C;
- nao alterar `lotStatus` dos lotes `4` e `5`;
- nao mudar a semantica operacional de `counterStatus`;
- nao introduzir fallback para email ou `authUid` em `approverIds`.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
DEFINE correcao pos-build
  |
  +--> existing fase2c implementation (read-only target)
  |       |- payload-builder.ts
  |       |- execution.ts
  |       |- runtime/types.ts
  |
  +--> micro build outputs
          |- payload-builder.test.ts
          |     |- add lote 4 representative assertion
          |     |- assert active=false
          |     |- assert action preserved with approverIds=id3a
          |
          |- execution.test.js
          |     |- add counterStatus=absent scenario
          |     |- assert writes still proceed on --execute
          |
          |- runtime/types.ts
                |- annotate StepActionDef.approverIds as id3a-only

No production pipeline behavior changes
No Firestore write path changes
No schema changes
```

### 4.2. Fluxo de implementacao

```text
1. Importar o manifesto do lote 4 na suite de payload-builder.
2. Construir payloads do lote 4 com o mesmo collaborator fixture ja usado na suite.
3. Selecionar o workflow de ferias/ausencia/compensacao.
4. Validar:
   - active=false
   - stepOrder/statusKey preservados
   - somente 1 step com action
   - action.type = acknowledgement
   - action.approverIds = ['DFA']
5. Na suite de execution, mockar contador ausente com snapshot.exists = false.
6. Rodar --execute e validar que seedWorkflowType/seedWorkflowVersion continuam sendo chamados.
7. Validar logging com "Counter status observado: absent".
8. Em runtime/types.ts, adicionar nota documental em approverIds.
```

### 4.3. Contrato tecnico desta microetapa

Nao existe mudanca de API nem de persistencia. O unico ajuste de contrato e documental:

- `StepActionDef.approverIds` passa a declarar explicitamente que aceita apenas identidades operacionais `id3a`;
- nenhum outro campo do runtime muda de nome, shape ou tipo TypeScript.

---

## 5. Architecture Decisions

### ADR-2C-COR-001: O `lote 4` sera coberto por um workflow com `action`, nao por um caso neutro

| Attribute | Value |
|-----------|-------|
| Context | O DEFINE pede cobertura representativa do lote `4`, com foco em `active: false` e preservacao de `action`. |
| Choice | Usar `gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas` como fixture-alvo do teste. |
| Rationale | Este workflow cobre o risco mais sensivel do lote: `status.action` existe, mas o lote ainda precisa permanecer `validated` e `active: false`. |
| Alternatives | Cobrir um workflow sem `action` do lote `4`; rejeitado porque reduziria o valor da regressao. Cobrir o lote inteiro; rejeitado porque inflaria a suite sem ganho proporcional. |
| Consequences | A suite continua pequena, mas passa a provar o principal recorte de risco do lote `4`. |

### ADR-2C-COR-002: `counterStatus = absent` continua sendo um sinal observacional, nunca um bloqueio de execucao

| Attribute | Value |
|-----------|-------|
| Context | O codigo atual ja trata o contador como dependencia observada; faltava apenas prova automatizada do caminho `absent` durante `--execute`. |
| Choice | Adicionar teste em [execution.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js) sem alterar [execution.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/execution.ts). |
| Rationale | A decisao macro da 2C ja foi tomada e implementada; esta etapa so fecha a cobertura prometida. |
| Alternatives | Tornar contador ausente um erro; rejeitado por contradizer o design macro e o DEFINE atual. |
| Consequences | O comportamento fica mais confiavel sem qualquer mudanca de politica operacional. |

### ADR-2C-COR-003: A semantica de `approverIds` deve ser explicitada no tipo-fonte, nao apenas inferida de testes e design docs

| Attribute | Value |
|-----------|-------|
| Context | O runtime ja usa comentarios claros para outros ids operacionais, mas `StepActionDef.approverIds` ainda depende de leitura contextual. |
| Choice | Adicionar comentario inline em [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts). |
| Rationale | O tipo central do runtime e o ponto de leitura mais duravel para build futuro da 2D e para manutencao do seed/frontend. |
| Alternatives | Documentar apenas no design ou apenas em testes; rejeitado porque nao protege o contrato no codigo-fonte. |
| Consequences | Reduz o risco de futuro fallback para email ou `authUid` em fluxos action-driven. |

---

## 6. File Manifest

| File | Papel na microetapa | Agente/skill recomendado | Acao |
|------|----------------------|--------------------------|------|
| `src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts` | fechar cobertura representativa do lote `4` | `build` / `build-agent` | modify |
| `src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js` | provar `counterStatus = absent` em `--execute` | `build` / `build-agent` | modify |
| `src/lib/workflows/runtime/types.ts` | explicitar contrato de `approverIds` | `build` / `build-agent` | modify |
| `.claude/sdd/workflow/fase2/BUILD_FASE2C_SEED_30_WORKFLOWS.md` | refletir cobertura final entregue, se o build optar por sincronizar artefatos | `iterate` ou `ship` | optional modify |

Arquivos usados apenas como referencia:

- [src/lib/workflows/bootstrap/fase2c/shared/execution.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/execution.ts)
- [src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts)
- [src/lib/workflows/bootstrap/fase2c/manifests/lote-04-gente-servicos-atendimento.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/manifests/lote-04-gente-servicos-atendimento.ts)

---

## 7. Contratos e Patterns

### 7.1. Pattern do teste representativo de `lote 4`

```ts
import { LOTE_04_GENTE_SERVICOS_ATENDIMENTO_MANIFEST } from '@/lib/workflows/bootstrap/fase2c/manifests/lote-04-gente-servicos-atendimento';

it('preserva action e mantem active=false no lote 4', () => {
  const payloads = buildSeedPayloadsForLot(
    LOTE_04_GENTE_SERVICOS_ATENDIMENTO_MANIFEST,
    collaborators,
    fakeNow,
  );

  const ferias = payloads.find(
    (payload) =>
      payload.workflowTypeId ===
      'gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas',
  );

  const steps = ferias?.versionPayload.stepOrder.map(
    (stepId) => ferias.versionPayload.stepsById[stepId],
  );
  const actionSteps = steps?.filter((step) => step.action);

  expect(ferias?.typePayload.active).toBe(false);
  expect(ferias?.versionPayload.fields.map((field) => field.id)).toEqual([
    'nome_sobrenome',
    'email',
    'setor_area',
    'tipo_solicitacao',
    'data_inicio',
    'data_fim',
    'descricao_detalhada',
  ]);
  expect(steps?.map((step) => step.statusKey)).toEqual([
    'solicitacao_aberta',
    'em_analise',
    'em_execucao',
    'finalizado',
  ]);
  expect(actionSteps).toHaveLength(1);
  expect(actionSteps?.[0].action).toMatchObject({
    type: 'acknowledgement',
    approverIds: ['DFA'],
  });
});
```

### 7.2. Pattern do teste `counterStatus = absent`

```js
it('executa workflowTypes_v2 e versions/1 mesmo com counter ausente', async () => {
  const logger = jest.fn();

  counterGetMock.mockResolvedValue({
    exists: false,
    data: () => undefined,
  });

  await runSeedForLot({
    scriptName: 'seed-fase2c-test',
    argv: ['node', 'script', '--execute'],
    logger,
    errorLogger: jest.fn(),
    buildPayloads: async () => [buildPayload('workflow_execute_without_counter')],
  });

  expect(seedWorkflowType).toHaveBeenCalledWith('workflow_execute_without_counter', {
    workflowTypeId: 'workflow_execute_without_counter',
    ownerEmail: 'owner@3ainvestimentos.com.br',
  });
  expect(seedWorkflowVersion).toHaveBeenCalledWith('workflow_execute_without_counter', 1, {
    workflowTypeId: 'workflow_execute_without_counter',
    version: 1,
  });
  expect(logger).toHaveBeenCalledWith(
    '[seed-fase2c-test] Seed concluido em workflowTypes_v2 e versions/1 sem escrita em counters/workflowCounter_v2. Counter status observado: absent.',
  );
});
```

### 7.3. Pattern de documentacao de `approverIds`

```ts
export interface StepActionDef {
  type: 'approval' | 'acknowledgement' | 'execution';
  label: string;
  /** Operational recipient identities (`id3a`), never email or Firebase `authUid`. */
  approverIds?: string[];
  commentRequired?: boolean;
  commentPlaceholder?: string;
  attachmentPlaceholder?: string;
}
```

### 7.4. Contrato que deve permanecer intacto

- `active: true` continua restrito a lotes `1`, `2` e `3` quando `enabled`;
- `active: false` continua obrigatorio para lotes `4` e `5` enquanto o motor de `action` nao existir;
- `counterStatus` continua sendo apenas observacional;
- `approverIds` continua sem fallback para email ou `authUid`.

---

## 8. Testing Strategy

### 8.1. Unit tests a ajustar

- expandir [payload-builder.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts) com `1` caso novo de `lote 4`;
- expandir [execution.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js) com `1` caso novo de contador ausente;
- manter os fixtures existentes e reaproveitar `buildPayload()` e `collaborators`.

### 8.2. Verificacao de tipo/documentacao

- revisar [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts) para confirmar que a anotacao de `approverIds` esta no mesmo padrao semantico de `ownerUserId`, `requesterUserId` e `operationalParticipantIds`;
- nao alterar o tipo TypeScript de `approverIds`.

### 8.3. Comandos de validacao

- `npm test -- --runInBand src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js`
- `npm test -- --runInBand src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts src/lib/workflows/bootstrap/fase2c/__tests__/normalization-and-owner.test.ts src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js src/lib/workflows/runtime/__tests__/repository.test.js`
- `./node_modules/.bin/tsc --noEmit --pretty false 2>&1 | rg 'src/lib/workflows/bootstrap/fase2c|src/lib/workflows/runtime/types.ts'`

### 8.4. Acceptance checks

- existe `1` novo teste cobrindo `lote 4`;
- existe `1` novo teste cobrindo `counterStatus = absent`;
- `approverIds` passa a explicitar `id3a` no tipo-fonte;
- nenhuma suite da 2C perde comportamento anterior;
- nenhum arquivo de producao fora de testes/tipos e alterado.

---

## 9. Rollback Plan

Como esta microetapa nao mexe em schema nem em escrita real, o rollback e puramente de codigo:

1. remover o teste novo de `lote 4` se ele introduzir expectativa incorreta;
2. remover o teste novo de `counterStatus = absent` se ele conflitar com a semantica real ja estabelecida;
3. reverter apenas a anotacao documental de `approverIds` se houver desalinhamento de nomenclatura.

Nao existe rollback de dados porque:

- nenhuma migracao sera executada;
- nenhuma colecao nova sera criada;
- nenhuma escrita em Firestore faz parte desta microetapa.

---

## 10. Implementation Checklist

### Pre-Build

- [ ] importar manifesto de `lote 4` na suite de payload-builder
- [ ] adicionar teste representativo para `gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas`
- [ ] adicionar teste de `counterStatus = absent` na suite de execution
- [ ] anotar `StepActionDef.approverIds` como `id3a`

### Post-Build

- [ ] executar as suites focadas da 2C
- [ ] executar o comando de regressao usado no build macro da 2C
- [ ] confirmar que nao houve mudanca em `execution.ts`, `payload-builder.ts` ou manifestos
- [ ] atualizar o `BUILD_FASE2C_SEED_30_WORKFLOWS.md` se o build optar por sincronizar o artefato final

---

## 11. Specialist Instructions

### Para `build`

- nao refatore o pipeline compartilhado;
- trate esta etapa como fechamento de cobertura e documentacao de contrato;
- prefira assercoes pequenas e legiveis em vez de fixtures novas;
- use o workflow de ferias do `lote 4` como alvo principal;
- no teste de contador ausente, prove explicitamente que `--execute` nao e bloqueado.

### Para `ship`

- registrar que a microetapa nao alterou comportamento de Firestore;
- consolidar o numero final de testes executados, se houver atualizacao do artefato de build;
- manter o historico da 2C separado do futuro trabalho da `2D`.

---

## Revision History

- `2026-04-06`: design inicial da microetapa de correcoes pos-build da Fase 2C.
