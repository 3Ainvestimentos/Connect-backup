# DESIGN: Correcao do Canon de 3 Etapas na Fase 2C

> Generated: 2026-04-06
> Status: Ready for build
> Scope: Fase 2 / 2C - introducao de `stepStrategy` explicito, colapso canonico de `19` workflows diretos e guardrails para reseed seguro dos lotes `1` e `2`
> Base document: `DEFINE_CORRECAO_CANON_3_ETAPAS_FASE2C.md`
> Parent design: `DESIGN_FASE2C_SEED_30_WORKFLOWS.md`

## 1. Objetivo

Corrigir a publicacao da `fase2c` sem reabrir a arquitetura macro da seed, inserindo um contrato explicito de `stepStrategy` por workflow e fazendo o builder publicar apenas `3` steps canonicos nos `19` casos aprovados pelo DEFINE.

Esta microetapa cobre:

- adicionar `stepStrategy` em todas as `30` entradas dos manifestos da `2C`;
- separar o caminho de normalizacao em:
  - `preserve_legacy`
  - `canonical_3_steps`
- bloquear configuracoes invalidas de `canonical_3_steps` com `action` ou `statusIdOverrides`;
- refletir a estrategia escolhida no payload de `dry-run`;
- fechar a cobertura automatizada para os caminhos positivo e negativo da nova estrategia;
- preparar o build para reseed operacional dos lotes `1` e `2` sem patch manual em Firestore.

Esta microetapa nao cobre:

- execucao do reseed real;
- mudanca em `workflowTypes_v2` fora do shape de `stepsById`, `stepOrder` e metadados de `dry-run`;
- alteracao de owners, areas, `fieldIdOverrides`, `lotStatus` ou politica de `active`;
- qualquer suporte novo ao runtime de `requestAction/respondAction`.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_CORRECAO_CANON_3_ETAPAS_FASE2C.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECAO_CANON_3_ETAPAS_FASE2C.md)
- [DESIGN_FASE2C_SEED_30_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2C_SEED_30_WORKFLOWS.md)
- [fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase1-facilities-v1.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/types.ts)
- [status-normalization.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/status-normalization.ts)
- [payload-builder.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts)
- [execution.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/execution.ts)
- [payload-builder.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts)
- [normalization-and-owner.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/normalization-and-owner.test.ts)
- [execution.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js)
- [lote-01-governanca-financeiro.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/manifests/lote-01-governanca-financeiro.ts)
- [lote-02-marketing.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/manifests/lote-02-marketing.ts)
- [lote-03-ti.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/manifests/lote-03-ti.ts)
- [lote-04-gente-servicos-atendimento.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/manifests/lote-04-gente-servicos-atendimento.ts)
- [lote-05-gente-ciclo-vida-movimentacoes.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/manifests/lote-05-gente-ciclo-vida-movimentacoes.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_CORRECAO_CANON_3_ETAPAS_FASE2C.md` para escopo e aceite;
2. depois prevalece o `DESIGN_FASE2C_SEED_30_WORKFLOWS.md` para arquitetura macro da seed;
3. depois prevalece a implementacao real do pipeline `fase2c`;
4. depois prevalece este documento para orientar o build da correcao.

---

## 3. Estado Atual e Delta da Correcao

### 3.1. O que o repositorio faz hoje

- `Fase2cManifestEntry` nao possui `stepStrategy`; o manifesto so carrega ids canonicos, lote, owner overrides e overrides tecnicos de `field.id` e `status.id`;
- `normalizeStatuses()` sempre preserva a malha legada integral, inferindo apenas `kind` por posicao;
- `statusIdOverrides` e consumido de forma posicional para resolver duplicidade de `status.id`;
- `buildSeedPayloadsForLot()` propaga `statusesSummary` para `dry-run`, mas nao informa qual estrategia foi aplicada;
- `execution.ts` ja separa `--dry-run` e `--execute`, e o caminho de escrita nao precisa ser alterado para esta correcao.

### 3.2. Lacunas objetivas em relacao ao DEFINE

- os `19` workflows aprovados para `canonical_3_steps` ainda saem com steps intermediarios legados;
- nao existe guardrail tecnico que bloqueie `canonical_3_steps` em workflows com `statuses[*].action`;
- nao existe guardrail tecnico que bloqueie `canonical_3_steps` em workflows com `statusIdOverrides`;
- o `dry-run` nao permite ao revisor saber se o payload saiu por colapso canonico ou preservacao deliberada;
- um workflow que agora sera canonico ainda usa override legado de status:
  - `ti_solicitacao_compra_equipamento` em [lote-03-ti.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/manifests/lote-03-ti.ts)

### 3.3. Limites nao negociaveis desta microetapa

- nenhuma heuristica pode inferir `stepStrategy` a partir da malha legada;
- `preserve_legacy` deve continuar reaproveitando o comportamento atual, inclusive `action` e `statusIdOverrides`;
- `canonical_3_steps` deve ignorar completamente os nomes intermediarios do legado e publicar sempre a trilha fixa:
  - `solicitacao_aberta`
  - `em_andamento`
  - `finalizado`
- a semantica de `lotStatus` e `active` nao muda;
- o runtime de requests, o read-model e o contador `_v2` nao entram no escopo de alteracao funcional.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
DEFINE correcao canon 3 etapas
  |
  +--> fase2c manifests
  |       |- each entry declares stepStrategy explicitly
  |       |- canonical entries cannot carry statusIdOverrides
  |
  v
buildSeedPayloadsForLot()
  |
  +--> load legacy workflow
  +--> normalize fields (unchanged)
  +--> normalize statuses(entry.stepStrategy)
           |
           +--> preserve_legacy
           |      |- current positional override logic
           |      |- preserve action
           |      |- preserve full legacy mesh
           |
           +--> canonical_3_steps
                  |- reject legacy action
                  |- reject statusIdOverrides
                  |- emit 3 fixed steps
                  |- reuse Facilities semantics
  |
  +--> build typePayload/versionPayload
  +--> attach reportItem.stepStrategy
  |
  +--> execution.ts
          |- --dry-run prints strategy + statusesSummary
          |- --execute writes same docs as hoje

Firestore targets (unchanged)
  |- workflowTypes_v2/{workflowTypeId}
  |- workflowTypes_v2/{workflowTypeId}/versions/1
```

### 4.2. Fluxo por camadas

```text
LAYER 1 - Manifest contract
1. Cada entry do manifesto declara stepStrategy.
2. O build falha se alguma entry estiver sem stepStrategy.

LAYER 2 - Shared builder
3. payload-builder continua carregando snapshot, area e owner como hoje.
4. normalizeFields continua intacto.

LAYER 3 - Status strategy dispatcher
5. normalizeStatuses faz dispatch por stepStrategy.
6. preserve_legacy reutiliza a implementacao atual.
7. canonical_3_steps valida guardrails e gera 3 steps fixos.

LAYER 4 - Dry-run visibility
8. reportItem passa a carregar stepStrategy.
9. statusesSummary continua sendo a prova do payload final publicado.

LAYER 5 - Execute path
10. assertNoPublishedTargets continua igual.
11. executeSeedPayloads continua gravando apenas type doc e versions/1.
12. reseed dos lotes 1 e 2 continua operacao manual fora do build.
```

### 4.3. Plano fechado de classificacao por lote

| Lote | `canonical_3_steps` | `preserve_legacy` | Observacao tecnica |
|------|----------------------|-------------------|--------------------|
| `lote_01_governanca_financeiro` | `2` | `1` | `financeiro_solicitacao_pagamentos` permanece legado |
| `lote_02_marketing` | `6` | `1` | `marketing_revisao_materiais_apresentacoes` permanece legado |
| `lote_03_ti` | `8` | `1` | `ti_solicitacao_compra_equipamento` vira canonico e perde `statusIdOverrides` |
| `lote_04_gente_servicos_atendimento` | `2` | `3` | `ferias/ausencia/compensacao` segue legado por `action` |
| `lote_05_gente_ciclo_vida_movimentacoes` | `1` | `5` | `alteracao_cadastral` e o unico caso canonico do lote |

Totais esperados apos o build:

- `19` workflows em `canonical_3_steps`;
- `11` workflows em `preserve_legacy`;
- `5` workflows preservados por conter `action`.

### 4.4. Delta de payload esperado

Para `canonical_3_steps`, o `versionPayload` publicado deve sempre conter exatamente:

| Ordem | `stepName` | `statusKey` | `kind` |
|-------|------------|-------------|--------|
| `1` | `Solicitação Aberta` | `solicitacao_aberta` | `start` |
| `2` | `Em andamento` | `em_andamento` | `work` |
| `3` | `Finalizado` | `finalizado` | `final` |

Regras de montagem:

- `stepId` continua sendo gerado via `generateStepId()`;
- `initialStepId` passa a ser sempre o primeiro step canonico;
- `stepsById[*].action` fica sempre ausente no caminho canonico;
- `statusesSummary` reflete os `3` steps publicados, e nao a malha legada original.

Para `preserve_legacy`, nenhum comportamento muda:

- a ordem do snapshot e preservada;
- `action` e preservado;
- `statusIdOverrides` continua valido;
- `kind` continua inferido por posicao.

---

## 5. Architecture Decisions

### ADR-2C-CANON-001: `stepStrategy` sera obrigatorio e explicito em todos os manifestos

| Attribute | Value |
|-----------|-------|
| Context | O erro atual veio justamente da ausencia de uma chave explicita de estrategia por workflow. |
| Choice | Adicionar `stepStrategy` obrigatorio em `Fase2cManifestEntry`, sem fallback nem valor default em runtime. |
| Rationale | Elimina ambiguidade, fecha auditoria por manifesto e impede repeticao do problema em lotes futuros. |
| Alternatives | Inferir por heuristica da malha legada; rejeitado porque conflita com o DEFINE e nao distingue checkpoints deliberados. |
| Consequences | O build fica mais verboso nos manifestos, mas muito mais seguro e revisavel. |

### ADR-2C-CANON-002: `normalizeStatuses()` vira um dispatcher, nao um normalizador unico com branches opacos

| Attribute | Value |
|-----------|-------|
| Context | O caminho atual mistura normalizacao e preservacao legada; a correcao precisa introduzir uma segunda estrategia sem degradar a atual. |
| Choice | Manter `normalizeStatuses()` como ponto unico de entrada, mas extrair dois caminhos internos separados: `normalizePreserveLegacyStatuses()` e `normalizeCanonical3StepStatuses()`. |
| Rationale | Mantem o `payload-builder` simples, reduz risco de regressao e centraliza validacoes da estrategia. |
| Alternatives | Branching no `payload-builder`; rejeitado porque espalharia regra de steps em camada acima. Criar arquivo novo para cada estrategia; rejeitado por ser desnecessario para um delta pequeno. |
| Consequences | O arquivo de status cresce um pouco, mas a semantica fica clara e testavel. |

### ADR-2C-CANON-003: `canonical_3_steps` falha cedo se houver `action` ou `statusIdOverrides`

| Attribute | Value |
|-----------|-------|
| Context | O DEFINE fecha que o caminho canonico nao pode depender de checkpoints legados nem perder `action` escondido. |
| Choice | Validar antes da montagem dos `3` steps que nenhuma entrada legada tenha `status.action` e que `entry.statusIdOverrides` esteja ausente. |
| Rationale | A falha vira erro de configuracao de manifesto, nao um payload silenciosamente incorreto. |
| Alternatives | Ignorar `action` ou ignorar `statusIdOverrides`; rejeitado porque mascararia erro de definicao. |
| Consequences | Algumas entradas exigem limpeza de manifesto no build, principalmente `ti_solicitacao_compra_equipamento`. |

### ADR-2C-CANON-004: O `dry-run` expora a estrategia por workflow, sem novo formato agregado

| Attribute | Value |
|-----------|-------|
| Context | O requisito de revisao humana pede que o payload deixe claro se saiu canonico ou legado. |
| Choice | Adicionar `stepStrategy` a `Fase2cDryRunItem` e reaproveitar `statusesSummary` como prova do resultado final. |
| Rationale | Fecha o SHOULD do DEFINE com impacto minimo e sem expandir o contrato CLI. |
| Alternatives | Criar relatorio agregado por lote; rejeitado porque e opcional e nao necessario para esta correcao. |
| Consequences | O `execution.ts` praticamente nao muda; a maior parte do delta fica em tipos, builder e testes. |

### ADR-2C-CANON-005: O reseed continua sendo operacao manual fora do build

| Attribute | Value |
|-----------|-------|
| Context | Os lotes `1` e `2` ja podem ter sido publicados com steps incorretos, mas a correcao pedida e de fonte de verdade e nao de automacao operacional. |
| Choice | Nao criar script de delete/reseed novo; manter a operacao como runbook manual com remocao dos docs publicados e reexecucao dos scripts normais. |
| Rationale | Evita abrir escopo de automacao destrutiva e mantem a seed como origem unica da publicacao. |
| Alternatives | Patch manual em Firestore; rejeitado porque nao corrige a fonte de verdade. Script de cleanup automatico; rejeitado porque aumenta o risco operacional desta microetapa. |
| Consequences | O build entrega a correcao de codigo e testes; a execucao real continua dependendo de checklist operacional. |

---

## 6. File Manifest

### 6.1. Ordem de execucao sugerida

| Fase | Files | Skill/agente recomendado |
|------|-------|--------------------------|
| `1. Contract` | `shared/types.ts` + `5` manifestos | `build` |
| `2. Strategy` | `shared/status-normalization.ts` + `shared/payload-builder.ts` | `build` |
| `3. Tests` | `payload-builder.test.ts` + `normalization-and-owner.test.ts` + `execution.test.js` | `build` |
| `4. Artefato operacional` | `BUILD_FASE2C_SEED_30_WORKFLOWS.md` | `iterate` ou `ship` |

### 6.2. Manifest detalhado

| File | Papel na correcao | Acao |
|------|-------------------|------|
| `src/lib/workflows/bootstrap/fase2c/shared/types.ts` | introduzir `Fase2cStepStrategy`; tornar `stepStrategy` obrigatorio; expor `stepStrategy` em `Fase2cDryRunItem` | modify |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-01-governanca-financeiro.ts` | marcar `2` entries como canonicas e `1` como legado | modify |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-02-marketing.ts` | marcar `6` entries como canonicas e `1` como legado | modify |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-03-ti.ts` | marcar `8` entries como canonicas, `1` como legado e remover `statusIdOverrides` de `ti_solicitacao_compra_equipamento` | modify |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-04-gente-servicos-atendimento.ts` | marcar `2` entries como canonicas e `3` como legado | modify |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-05-gente-ciclo-vida-movimentacoes.ts` | marcar `1` entry como canonica e `5` como legado | modify |
| `src/lib/workflows/bootstrap/fase2c/shared/status-normalization.ts` | implementar dispatcher e guardrails de `stepStrategy` | modify |
| `src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts` | incluir `stepStrategy` no `reportItem` e reaproveitar o dispatcher novo | modify |
| `src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts` | cobrir workflows canonicos e legados com asserts do novo contrato; atualizar qualquer `Fase2cManifestEntry` inline para incluir `stepStrategy` | modify |
| `src/lib/workflows/bootstrap/fase2c/__tests__/normalization-and-owner.test.ts` | cobrir falhas de configuracao em `canonical_3_steps`; atualizar `baseEntry` e qualquer fixture existente para incluir `stepStrategy` | modify |
| `src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js` | verificar que o `dry-run` expõe `stepStrategy` no JSON impresso | modify |
| `.claude/sdd/workflow/fase2/BUILD_FASE2C_SEED_30_WORKFLOWS.md` | registrar o reseed e o resultado final apos implementacao, se necessario | optional modify |

Arquivos read-only reutilizados:

- [src/lib/workflows/bootstrap/fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase1-facilities-v1.ts)
- [src/lib/workflows/bootstrap/fase2c/shared/execution.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/execution.ts)
- [src/lib/workflows/bootstrap/fase2c/shared/source.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/source.ts)
- [src/lib/workflows/runtime/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)

---

## 7. Contratos e Patterns

### 7.1. Contrato do manifesto

```ts
export type Fase2cStepStrategy = 'preserve_legacy' | 'canonical_3_steps';

export type Fase2cManifestEntry = {
  legacyWorkflowId: string;
  workflowTypeId: string;
  lotId: Fase2cLotId;
  lotStatus: Fase2cLotStatus;
  stepStrategy: Fase2cStepStrategy;
  ownerEmailOverride?: string;
  ownerUserIdOverride?: string;
  fieldIdOverrides?: Record<string, string[]>;
  statusIdOverrides?: Record<string, string[]>;
};
```

Regras fechadas:

- `stepStrategy` e obrigatorio em todas as `30` entries;
- `preserve_legacy` continua podendo usar `statusIdOverrides`;
- `canonical_3_steps` nao pode coexistir com `statusIdOverrides`;
- `fieldIdOverrides` continua permitido em ambos os caminhos, porque o define nao muda o contrato de campos;
- nao existe fallback runtime para escolher estrategia.

### 7.2. Pattern do dispatcher de status

```ts
export function normalizeStatuses(
  entry: Fase2cManifestEntry,
  legacyStatuses: LegacyWorkflowStatus[],
): NormalizedStatusesResult {
  if (!legacyStatuses.length) {
    throw new Error(`Workflow "${entry.workflowTypeId}" nao possui statuses no snapshot legado.`);
  }

  switch (entry.stepStrategy) {
    case 'preserve_legacy':
      return normalizePreserveLegacyStatuses(entry, legacyStatuses);
    case 'canonical_3_steps':
      return normalizeCanonical3StepStatuses(entry, legacyStatuses);
    default:
      throw new Error(`stepStrategy invalido para "${entry.workflowTypeId}".`);
  }
}
```

Observacoes:

- a funcao `normalizePreserveLegacyStatuses()` deve encapsular o codigo atual praticamente sem alteracao comportamental;
- a funcao `normalizeCanonical3StepStatuses()` nao pode reutilizar ids ou labels intermediarios do legado;
- qualquer validacao de estrategia deve acontecer antes de retornar `stepsById`.

### 7.3. Pattern do caminho `canonical_3_steps`

```ts
const CANONICAL_3_STEPS: Array<{
  stepName: string;
  statusKey: string;
  kind: StepDef['kind'];
}> = [
  { stepName: 'Solicitação Aberta', statusKey: 'solicitacao_aberta', kind: 'start' },
  { stepName: 'Em andamento', statusKey: 'em_andamento', kind: 'work' },
  { stepName: 'Finalizado', statusKey: 'finalizado', kind: 'final' },
];

function normalizeCanonical3StepStatuses(
  entry: Fase2cManifestEntry,
  legacyStatuses: LegacyWorkflowStatus[],
): NormalizedStatusesResult {
  if (entry.statusIdOverrides) {
    throw new Error(
      `Workflow "${entry.workflowTypeId}" em canonical_3_steps nao pode usar statusIdOverrides.`,
    );
  }

  if (legacyStatuses.some((status) => status.action)) {
    throw new Error(
      `Workflow "${entry.workflowTypeId}" em canonical_3_steps nao pode preservar statuses com action.`,
    );
  }

  const stepOrder: string[] = [];
  const stepsById: Record<string, StepDef> = {};
  const statusesSummary: NormalizedStatusesResult['statusesSummary'] = [];

  for (const canonicalStep of CANONICAL_3_STEPS) {
    const stepId = generateStepId();

    stepsById[stepId] = {
      stepId,
      stepName: canonicalStep.stepName,
      statusKey: canonicalStep.statusKey,
      kind: canonicalStep.kind,
    };

    stepOrder.push(stepId);
    statusesSummary.push({
      statusKey: canonicalStep.statusKey,
      kind: canonicalStep.kind,
      hasAction: false,
    });
  }

  return {
    initialStepId: stepOrder[0],
    stepOrder,
    stepsById,
    statusesSummary,
    sanitizations: [
      `status.strategy applied: canonical_3_steps (${legacyStatuses.length} -> 3)`,
    ],
  };
}
```

Notas de implementacao:

- o caminho canonico deve reaproveitar exatamente o rotulo funcional ja usado em Facilities para o primeiro step: `Solicitação Aberta`;
- a semantica funcional continua sendo a mesma do piloto Facilities para os tres steps canonicos;
- o `sanitizations` entry acima e recomendado porque ajuda na auditoria do `dry-run` sem criar novo shape agregado.

### 7.4. Contrato do `dry-run`

```ts
export type Fase2cDryRunItem = {
  lotId: Fase2cLotId;
  legacyWorkflowId: string;
  workflowTypeId: string;
  name: string;
  areaId: string;
  ownerEmailLegacy: string;
  ownerEmailResolved: string;
  ownerUserId: string;
  lotStatus: Fase2cLotStatus;
  stepStrategy: Fase2cStepStrategy;
  workflowTypeDocPath: string;
  versionDocPath: string;
  counterStatus: 'present_valid' | 'present_invalid' | 'absent';
  fieldsSummary: Array<{ id: string; type: VersionFieldType; required: boolean }>;
  statusesSummary: Array<{ statusKey: string; kind: StepDef['kind']; hasAction: boolean }>;
  sanitizations: string[];
};
```

Implementacao esperada em `payload-builder.ts`:

```ts
reportItem: {
  lotId: entry.lotId,
  legacyWorkflowId: entry.legacyWorkflowId,
  workflowTypeId: entry.workflowTypeId,
  name,
  areaId: legacy.areaId,
  ownerEmailLegacy: owner.ownerEmailLegacy,
  ownerEmailResolved: owner.ownerEmailResolved,
  ownerUserId: owner.ownerUserId,
  lotStatus: entry.lotStatus,
  stepStrategy: entry.stepStrategy,
  workflowTypeDocPath: `workflowTypes_v2/${entry.workflowTypeId}`,
  versionDocPath: `workflowTypes_v2/${entry.workflowTypeId}/versions/1`,
  fieldsSummary: ...,
  statusesSummary: normalizedStatuses.statusesSummary,
  sanitizations,
}
```

`execution.ts` pode permanecer praticamente intacto porque `materializeDryRunReport()` apenas faz spread de `reportItem`.

### 7.5. Delta fechado nos manifestos

```text
lote_01_governanca_financeiro
  canonical_3_steps:
    - governanca_espelhamento_caso_unico
    - governanca_espelhamento_em_lote
  preserve_legacy:
    - financeiro_solicitacao_pagamentos

lote_02_marketing
  canonical_3_steps:
    - marketing_evento
    - marketing_sugestao_3a_riva_store
    - marketing_arte_material_grafico
    - marketing_assinatura_email_cartao_visita_cartao_visita_digital
    - marketing_acoes_marketing
    - marketing_solicitacao_patrocinios
  preserve_legacy:
    - marketing_revisao_materiais_apresentacoes

lote_03_ti
  canonical_3_steps:
    - ti_problemas_hardware
    - ti_solicitacao_compra_equipamento
    - ti_problemas_rede
    - ti_sugestoes_3a_riva_connect
    - ti_problemas_software
    - ti_alteracao_email_xp
    - ti_padronizacao_email_codigo_xp
    - ti_reset_senha
  preserve_legacy:
    - ti_solicitacao_compra_software_sistema

lote_04_gente_servicos_atendimento
  canonical_3_steps:
    - gente_comunicacao_fale_com_a_gente
    - gente_comunicacao_solicitacao_abertura_vaga
  preserve_legacy:
    - gente_comunicacao_servicos_plano_saude
    - gente_comunicacao_comprovacao_ancord
    - gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas

lote_05_gente_ciclo_vida_movimentacoes
  canonical_3_steps:
    - gente_comunicacao_alteracao_cadastral
  preserve_legacy:
    - gente_comunicacao_analise_pre_desligamento_acesso_lideres
    - gente_comunicacao_alteracao_cargo_remuneracao_time_ou_equipe
    - gente_comunicacao_cadastro_novos_entrantes_demais_areas
    - gente_comunicacao_solicitacao_desligamento_demais_areas_nao_comerciais
    - gente_comunicacao_cadastro_novos_entrantes_associado
```

Regra adicional obrigatoria:

- `ti_solicitacao_compra_equipamento` deixa de usar `statusIdOverrides` porque a estrategia canonica nao admite esse contrato.

---

## 8. API e Banco

### 8.1. API Contract

Nenhum endpoint novo ou alterado.

### 8.2. Database Schema

Nenhuma mudanca de schema, colecao ou namespace.

O impacto persistido desta correcao ocorre apenas no conteudo dos documentos ja previstos em:

- `workflowTypes_v2/{workflowTypeId}`
- `workflowTypes_v2/{workflowTypeId}/versions/1`

Especificamente:

- para `19` workflows, `versions/1.stepsById`, `stepOrder` e `initialStepId` passarao a refletir a trilha canonica de `3` steps;
- para `11` workflows, o payload publicado permanece no shape legado atual.

---

## 9. Testing Strategy

### 9.1. Unit tests

| Arquivo | Cobertura obrigatoria |
|---------|------------------------|
| `payload-builder.test.ts` | workflow canonico gera exatamente `3` steps; valida `stepName`, `statusKey` e `kind` canonicos; workflow legado continua preservando `action` e sequencia; `reportItem.stepStrategy` aparece no payload |
| `normalization-and-owner.test.ts` | `canonical_3_steps` falha com `status.action`; `canonical_3_steps` falha com `statusIdOverrides`; duplicidade sem override continua falhando em `preserve_legacy` |
| `execution.test.js` | `--dry-run` serializa `stepStrategy` no JSON; `--execute` continua sem tocar no contador |

### 9.2. Casos representativos recomendados

- workflow canonico do lote `1`:
  - `governanca_espelhamento_caso_unico`
- workflow canonico do lote `3` com limpeza de override:
  - `ti_solicitacao_compra_equipamento`
- workflow legado sem `action`:
  - `marketing_revisao_materiais_apresentacoes`
- workflow legado com `action`:
  - `gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas`

### 9.3. Acceptance tests

```gherkin
GIVEN um manifesto da fase2c com stepStrategy = canonical_3_steps
WHEN buildSeedPayloadsForLot materializa o workflow
THEN o versionPayload publicado contem apenas os 3 steps canonicos
AND os `stepName`s publicados sao `Solicitação Aberta`, `Em andamento` e `Finalizado`
AND os `statusKey`s publicados sao `solicitacao_aberta`, `em_andamento` e `finalizado`

GIVEN um manifesto da fase2c com stepStrategy = canonical_3_steps e status.action no legado
WHEN normalizeStatuses executa
THEN o build falha com erro de configuracao explicito

GIVEN um manifesto da fase2c com stepStrategy = preserve_legacy
WHEN buildSeedPayloadsForLot materializa o workflow
THEN a malha legada continua preservada, incluindo action e statusIdOverrides
```

### 9.4. Verificacao operacional antes do reseed

Antes de qualquer `--execute` real apos esta correcao:

1. rodar `--dry-run` dos lotes `1` e `2`;
2. rodar `--dry-run` dos lotes `3`, `4` e `5`, mesmo que ainda nao tenham sido executados antes;
3. confirmar `stepStrategy` e `statusesSummary` dos `19` workflows canonicos em todos os lotes alterados;
4. confirmar os `stepName`s canonicos nos workflows simplificados;
5. confirmar que nenhum workflow com `action` apareceu como `canonical_3_steps`;
6. so depois remover os docs antigos dos lotes `1` e `2` e reexecutar os scripts normais;
7. so depois liberar qualquer futuro `--execute` dos lotes `3`, `4` e `5`.

---

## 10. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| `1` | reverter o commit do build desta microetapa | manifestos voltam a nao carregar `stepStrategy` e o normalizador volta ao estado anterior |
| `2` | interromper qualquer `--execute` pendente dos lotes restantes | nenhum lote adicional e publicado com contrato misto |
| `3` | se os lotes `1` e `2` ja tiverem sido reseedados com a correcao e o rollback for necessario, remover manualmente os docs republicados antes de reexecutar a versao anterior do script | `workflowTypes_v2/{workflowTypeId}` e `versions/1` deixam de conter a malha canonica |
| `4` | rerodar `--dry-run` da versao anterior antes de qualquer nova escrita | `statusesSummary` volta a refletir o contrato anterior |

Regras de rollback:

- nao editar manualmente `stepsById` em Firestore como substituto do rollback;
- nao resetar `counters/workflowCounter_v2`;
- nao executar lotes `3`, `4` ou `5` enquanto houver duvida sobre a versao ativa da correcao.

---

## 11. Checklist de Build

### Pre-build

- [ ] `stepStrategy` definido nas `30` entries dos manifestos
- [ ] nenhuma entry `canonical_3_steps` carrega `statusIdOverrides`
- [ ] nenhuma entry `canonical_3_steps` pertence a workflow com `action`
- [ ] `ti_solicitacao_compra_equipamento` esta marcado como canonico sem override legado de status
- [ ] `Fase2cDryRunItem` expõe `stepStrategy`

### Post-build

- [ ] testes da `fase2c` passam
- [ ] `dry-run` do lote `1` mostra `3` steps para os dois workflows de governanca
- [ ] `dry-run` do lote `2` mostra `3` steps para os seis workflows canonicos de marketing
- [ ] `dry-run` do lote `3` mostra `3` steps para os oito workflows canonicos de TI
- [ ] `dry-run` dos lotes `4` e `5` confirma quais workflows permaneceram em `preserve_legacy` e quais entraram no canon de `3` steps
- [ ] os workflows canonicos exibem os `stepName`s `Solicitação Aberta`, `Em andamento` e `Finalizado`
- [ ] `preserve_legacy` continua mostrando `action` nos workflows dos lotes `4` e `5`
- [ ] artefato operacional foi atualizado se o build optar por registrar o reseed
