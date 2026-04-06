# DEFINE: Correcoes Pos-Build da Fase 2C - Seed dos 30 Workflows

> Generated: 2026-04-06
> Status: Approved for design
> Scope: Fase 2 / 2C - fechamento das correcoes identificadas na revisao do build da seed
> Base document: `BUILD_FASE2C_SEED_30_WORKFLOWS.md`
> Source design: `DESIGN_FASE2C_SEED_30_WORKFLOWS.md`

## 1. Problem Statement

O build da 2C entregou o pipeline de seed por lotes com sucesso, mas ainda restam pequenas lacunas de cobertura e documentacao de contrato que precisam ser fechadas para alinhar a implementacao ao nivel de garantia prometido pelo design.

---

## 2. Users

### 2.1. Engenharia / plataforma de workflows

Pain points:

- a implementacao principal ja esta pronta, mas a revisao ainda encontrou pequenos desvios em relacao ao design;
- as lacunas atuais nao sao bloqueios de arquitetura, mas podem virar regressao silenciosa se ficarem sem fechamento;
- o time precisa encerrar a 2C com cobertura coerente antes de partir para `dry-run` e `execute` reais por lote.

### 2.2. Operacao / rollout por area

Pain points:

- os lotes `4` e `5` dependem de controles mais sensiveis (`active: false`, `action`) e merecem provas automatizadas mais claras;
- a seed precisa continuar confiavel mesmo quando o contador v2 estiver ausente;
- a documentacao de identidade operacional deve permanecer precisa para evitar interpretacoes erradas em etapas futuras.

### 2.3. Manutencao futura do runtime

Pain points:

- `StepActionDef` sera consumido pela futura macroetapa de `requestAction/respondAction`;
- qualquer ambiguidade agora sobre `approverIds` aumenta o risco de bug de autorizacao depois;
- contratos pouco anotados tendem a gerar divergencia entre seed, runtime e frontend.

---

## 3. Goals

### MUST

- adicionar cobertura representativa para o `lote 4` na suite de payload-builder da `fase2c`;
- cobrir explicitamente o caminho `counterStatus = absent` na suite de execucao da `fase2c`;
- documentar em `src/lib/workflows/runtime/types.ts` que `StepActionDef.approverIds` usa identidades operacionais `id3a`;
- manter a implementacao da 2C sem alterar o contrato funcional dos lotes nem o comportamento de escrita no Firestore;
- preservar a politica ja fechada de:
  - `active: true` para lotes `1`, `2` e `3` quando `enabled`
  - `active: false` para lotes `4` e `5` enquanto o motor de `action` nao existir

### SHOULD

- manter as suites da `fase2c` pequenas e legiveis, sem criar fixtures excessivamente grandes;
- concentrar as novas assercoes nos pontos mais sensiveis:
  - preservacao de `action`
  - bloqueio de `active`
  - contador observado e nao bloqueante
- atualizar o artefato de build da 2C, se necessario, para refletir a cobertura final entregue.

### COULD

- incluir uma assercao adicional garantindo que o `lote 4` continua sem overrides indevidos de `status.id` ou `field.id`;
- reforcar nos testes a diferenciacao entre `validated` e `enabled` como politica de exposicao.

### WON'T

- nao redesenhar o pipeline compartilhado da `fase2c`;
- nao reabrir a estrategia de lotes ou a politica de owner resolution;
- nao executar `--execute` real nesta microetapa;
- nao implementar ainda o runtime de `requestAction/respondAction`.

---

## 4. Success Criteria

- existe ao menos `1` teste representativo de integracao/payload para o `lote 4`;
- existe ao menos `1` teste cobrindo `counterStatus = absent` sem bloquear `dry-run` ou `--execute`;
- `StepActionDef.approverIds` passa a ter nota explicita de que representa `id3a`;
- as suites novas passam localmente no mesmo comando usado para validar a `fase2c`;
- nenhum comportamento do pipeline principal e regressado durante as correcoes.

### Clarity Score

`14/15`

Motivo:

- o recorte da microetapa e pequeno, objetivo e diretamente derivado dos achados da revisao;
- os pontos de correcao estao isolados e nao exigem nova decisao de produto;
- o proximo documento pode ir direto para design/implementacao sem ambiguidade relevante.

---

## 5. Technical Scope

### Backend / scripts

- sem mudanca no contrato dos scripts `--dry-run` / `--execute`;
- apenas reforco de cobertura automatizada sobre `execution.ts`.

### Frontend

- fora do escopo.

### Database

- nenhuma mudanca de schema ou de colecao;
- nenhuma nova escrita em `workflowTypes_v2`, `versions/1`, `workflows_v2` ou `counters`.

### Runtime / types

- anotacao documental em `StepActionDef` para explicitar a semantica de `approverIds`.

### AI

- fora do escopo.

---

## 6. Auth Requirements

- `approverIds` deve permanecer semanticamente alinhado a identidades operacionais `id3a`;
- nenhuma correcao desta microetapa pode introduzir fallback para email ou `authUid` no contrato de `action`;
- a microetapa nao altera JWT, claims ou isolamento entre usuarios.

---

## 7. Out of Scope

- definicao concreta de `requestAction` / `respondAction`;
- mudanca de `lotStatus` dos manifestos;
- alteracao de `ownerEmail` ou `ownerUserIdOverride` dos lotes;
- revisao do design macro da 2C;
- smokes manuais ou `execute` real contra Firestore.

