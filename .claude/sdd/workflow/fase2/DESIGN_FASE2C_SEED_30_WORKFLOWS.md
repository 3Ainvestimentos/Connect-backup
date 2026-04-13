# DESIGN: FASE 2C - Seed dos 30 Workflows Restantes

> Generated: 2026-04-06
> Status: Ready for build
> Scope: Fase 2 / 2C - materializacao auditavel dos 30 workflows restantes em `workflowTypes_v2`
> Base document: `DEFINE_FASE2C_SEED_30_WORKFLOWS.md`

## 1. Objetivo

Materializar os `30` workflows restantes do snapshot legado em `workflowTypes_v2/{workflowTypeId}` e `workflowTypes_v2/{workflowTypeId}/versions/1`, em `5` lotes aprovados, reaproveitando o padrao validado da Fase 1:

- builder puro;
- script manual com `--dry-run` e `--execute`;
- validacao explicita antes de qualquer escrita;
- escrita apenas no namespace `_v2`.

Esta macroetapa cobre:

- leitura do snapshot legado em `src/scripts/results/workflowDefinitions.json`;
- validacao de area, owner, ids canonicos e shape dos campos;
- saneamento leve e auditavel em labels, placeholders, trim e ids tecnicos duplicados;
- persistencia de `workflowTypes_v2` e `versions/1` por lote;
- emissao de artefatos de dry-run revisaveis por humanos;
- gates operacionais por lote ate `validated` e, quando aplicavel, `enabled`.

Esta macroetapa nao cobre:

- redesenho de regra de negocio;
- migracao de instancias legadas para `workflows_v2`;
- UI administrativa da 2D;
- publicacao monolitica dos 30 workflows;
- implementacao completa de `requestAction/respondAction`.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2C_SEED_30_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2C_SEED_30_WORKFLOWS.md)
- [BRAINSTORM_FASE2C_SEED_30_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_FASE2C_SEED_30_WORKFLOWS.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)
- [workflowDefinitions.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json)
- [workflowAreas.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowAreas.json)
- [fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase1-facilities-v1.ts)
- [seed-fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/seed-fase1-facilities-v1.ts)
- [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [email-utils.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/email-utils.ts)
- [DESIGN_FASE1_FACILITIES_ETAPA1e2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase1/DESIGN_FASE1_FACILITIES_ETAPA1e2.md)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2C_SEED_30_WORKFLOWS.md` para escopo e aceite;
2. depois prevalece o snapshot real em `workflowDefinitions.json` e `workflowAreas.json`;
3. depois prevalece o padrao arquitetural ja validado da Fase 1;
4. depois prevalece este documento para orientar o build.

---

## 3. Estado Atual e Recorte da 2C

### 3.1. O que o repositorio ja oferece

- existe o namespace novo em `workflowTypes_v2`, `versions`, `workflows_v2` e `counters/workflowCounter_v2`;
- o seed do piloto ja validou o padrao builder puro + script manual;
- `repository.ts` ja encapsula `getWorkflowType`, `getWorkflowVersion`, `seedWorkflowType` e `seedWorkflowVersion`;
- `normalizeEmail()` ja trata equivalencia `@3ariva.com.br` <-> `@3ainvestimentos.com.br`;
- o runtime atual ainda tipa `StepKind` como `start | work | final`, mas o design da Fase 1 ja havia reservado suporte estrutural para steps com `action`.

### 3.2. Fatos fechados do snapshot legado

- `workflowDefinitions.json` e um objeto indexado por `legacyWorkflowId`, nao um array;
- o snapshot contem `33` workflows;
- `3` ja pertencem ao piloto Facilities;
- os outros `30` se distribuem em:
  - `Governanca`: `2`
  - `Financeiro`: `1`
  - `Marketing`: `7`
  - `TI`: `9`
  - `Gente e Comunicacao`: `11`
- os tipos de campo reais no snapshot sao exatamente:
  - `text`
  - `textarea`
  - `select`
  - `date`
  - `file`
- existe ao menos `1` workflow com `fields=[]`:
  - `Solicitacao de Pagamentos`
- existem ids tecnicos duplicados de `field.id` em `3` workflows;
- existem ids tecnicos duplicados de `status.id` em `2` workflows;
- existem `5` workflows com `statuses[*].action`, concentrados nos lotes `4` e `5`.

### 3.3. Limites nao negociaveis

- nenhum `workflowTypeId` sera inferido do `legacyWorkflowId`;
- nenhum owner sera materializado por fallback opaco;
- nenhum `set()` podera sobrescrever publicacao existente silenciosamente;
- nenhum script da 2C escrevera em `workflows_v2`;
- o contador `counters/workflowCounter_v2` nao sera resetado nem reescrito pela 2C;
- `allowedUserIds`, `required`, `type` e ordem semantica dos `statuses` serao preservados, salvo ajustes tecnicos explicitados neste design.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
workflowDefinitions.json + workflowAreas.json
  |
  +--> curated lot manifest (TS)
  |       |- workflowTypeId canonico
  |       |- lotStatus
  |       |- owner override opcional
  |       |- field/status overrides explicitos
  |
  v
shared fase2c bootstrap pipeline
  |
  +--> load legacy snapshot
  +--> validate lot membership
  +--> resolve area
  +--> resolve owner (collaborators -> id3a)
  +--> normalize fields / statuses
  +--> build typePayload
  +--> build versionPayload
  +--> emit dry-run report
  |
  +--> --dry-run
  |       |- stdout JSON revisavel
  |       |- sem escrita no Firestore
  |
  +--> --execute
          |- assert target docs absent
          |- seed workflowTypes_v2/{workflowTypeId}
          |- seed workflowTypes_v2/{workflowTypeId}/versions/1
          |- inspect-only em counters/workflowCounter_v2

Firestore (_v2 only)
  |- workflowTypes_v2/{workflowTypeId}
  |- workflowTypes_v2/{workflowTypeId}/versions/1
  |- counters/workflowCounter_v2 (read-only validation)
```

### 4.2. Fluxo por camadas

```text
LAYER 1 - Source
1. Ler workflowDefinitions.json como mapa { legacyWorkflowId -> workflow }.
2. Ler workflowAreas.json para validar areaId legado.

LAYER 2 - Curated manifest
3. Selecionar o lote via manifesto tipado e versionado em codigo.
4. Aplicar apenas decisions fechadas: workflowTypeId, overrides de owner, overrides tecnicos.

LAYER 3 - Shared validation
5. Garantir que cada legacyWorkflowId existe.
6. Garantir que o areaId do snapshot existe em workflowAreas.json.
7. Garantir owner resolvido de forma univoca para id3a.
8. Garantir que o destino v2 nao ja existe publicado.

LAYER 4 - Normalization
9. Aplicar trim em names/labels/placeholders.
10. Deduplicar ids tecnicos apenas quando houver override explicito no manifesto.
11. Preservar tipos, obrigatoriedade, allowedUserIds e sequencia de statuses.

LAYER 5 - Build
12. Materializar typePayload e versionPayload.
13. Emitir relatorio de dry-run com ownerUserId resolvido e saneamentos aplicados.

LAYER 6 - Execute
14. Gravar somente workflowTypes_v2/{workflowTypeId} e versions/1.
15. Nao escrever nem recriar counters/workflowCounter_v2.
```

### 4.3. Topologia de lotes

Os lotes aprovados no DEFINE permanecem fechados:

- `lote_01_governanca_financeiro`
- `lote_02_marketing`
- `lote_03_ti`
- `lote_04_gente_servicos_atendimento`
- `lote_05_gente_ciclo_vida_movimentacoes`

Os lotes `4` e `5` carregam workflows com `statuses[*].action` e, por isso, possuem gate adicional de enablement descrito na secao `8.4`.

Politica tecnica de exposicao:

- lotes `1`, `2` e `3` podem ser materializados com `active: true` quando passarem no gate operacional do lote;
- lotes `4` e `5` devem ser materializados com `active: false`, mesmo apos `validated`;
- lotes `4` e `5` so podem mudar para `active: true` depois da entrega da macroetapa do motor de `requestAction/respondAction`.

### 4.4. `workflowTypeId` canonico por workflow

| Lote | legacyWorkflowId | Nome legado | workflowTypeId canonico |
|------|------------------|-------------|--------------------------|
| 1 | `2bnzgKX37heY7P9jK6LP` | `Espelhamento - Caso Unico` | `governanca_espelhamento_caso_unico` |
| 1 | `a5M0z8iYLJquGmr2VSqO` | `Espelhamento - Em lote` | `governanca_espelhamento_em_lote` |
| 1 | `anUoZTYU9wxa2cEQCjlJ` | `Solicitacao de Pagamentos` | `financeiro_solicitacao_pagamentos` |
| 2 | `0zUsgLc1UFRHVZQtFQ3o` | `Evento` | `marketing_evento` |
| 2 | `8SlrLRDUXs86Kz7lNwu9` | `Sugestao 3A RIVA Store` | `marketing_sugestao_3a_riva_store` |
| 2 | `MLAqXidcqSfg6dtdynVl` | `Arte / Material grafico` | `marketing_arte_material_grafico` |
| 2 | `OA1RjWNmKby613e6YgQ9` | `Revisao de materiais e Apresentacoes` | `marketing_revisao_materiais_apresentacoes` |
| 2 | `VOs3jGJHQl18xyj4XrES` | `Assinatura de e-mail; Cartao de visita; Cartao de visita digital` | `marketing_assinatura_email_cartao_visita_cartao_visita_digital` |
| 2 | `Z415O27iyMAOS9xp7Vw4` | `Acoes Marketing` | `marketing_acoes_marketing` |
| 2 | `xFcNgbswYXnaB1gxqMvf` | `Solicitacao de Patrocinios` | `marketing_solicitacao_patrocinios` |
| 3 | `1FEfsHnEALOAETwq6H3S` | `Problemas de Hardware` | `ti_problemas_hardware` |
| 3 | `2bsVIVhd22bV3bN5rp7W` | `Solicitacao de Compra - Equipamento` | `ti_solicitacao_compra_equipamento` |
| 3 | `BhCq9faCPTmGEXjYCg1t` | `Problemas de Rede` | `ti_problemas_rede` |
| 3 | `L1E0hJpRaJ3xFYufilyG` | `Sugestoes 3A RIVA Connect` | `ti_sugestoes_3a_riva_connect` |
| 3 | `LL9f3hMXcv4xVbyy3Nne` | `Problemas de Software` | `ti_problemas_software` |
| 3 | `bKomJE5rZo7T4jV6xebF` | `Solicitacao de Compra - Software/Sistema` | `ti_solicitacao_compra_software_sistema` |
| 3 | `j6DVhDS9mVQXmwDjptNs` | `Alteracao no E-mail XP` | `ti_alteracao_email_xp` |
| 3 | `ryj6rF4H2gBJUJiaKe8t` | `Padronizacao de E-mail - Codigo XP` | `ti_padronizacao_email_codigo_xp` |
| 3 | `sgL9XCECAOreWgGalI2m` | `Reset de Senha` | `ti_reset_senha` |
| 4 | `1tmzWIwCC21zxB3vaV5J` | `Fale com a GENTE` | `gente_comunicacao_fale_com_a_gente` |
| 4 | `NA1cQ6ejRgZhoB0ZMPY2` | `Servicos de Plano de Saude` | `gente_comunicacao_servicos_plano_saude` |
| 4 | `RABkxl7grAbuECLvvyWa` | `Comprovacao ANCORD` | `gente_comunicacao_comprovacao_ancord` |
| 4 | `YVfXjlFxZciT4zaD5UAP` | `Solicitacao de Abertura de Vaga` | `gente_comunicacao_solicitacao_abertura_vaga` |
| 4 | `q55MFr8p9Tbcbsh6kpm1` | `Solicitacao de Ferias / Ausencia / Compensacao de horas` | `gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas` |
| 5 | `98fUoidQBMm3MPW4NTic` | `Analise Pre-Desligamento (Acesso lideres)` | `gente_comunicacao_analise_pre_desligamento_acesso_lideres` |
| 5 | `Eqlgq3ZBINFo6TLONl9g` | `Alteracao de Cargo / Remuneracao / Time ou Equipe` | `gente_comunicacao_alteracao_cargo_remuneracao_time_ou_equipe` |
| 5 | `IPWhvTC82Dv4nn9vC2Xa` | `Cadastro de Novos Entrantes - Demais Areas` | `gente_comunicacao_cadastro_novos_entrantes_demais_areas` |
| 5 | `Vz53Sn7cdupJpFVNA7X6` | `Solicitacao Desligamento - Demais areas (Nao comerciais)` | `gente_comunicacao_solicitacao_desligamento_demais_areas_nao_comerciais` |
| 5 | `d3MLICQmG7qtsQMKMUUu` | `Cadastro de Novos Entrantes - Associado` | `gente_comunicacao_cadastro_novos_entrantes_associado` |
| 5 | `jyH7H6FCjPMJ2MjCefQN` | `Alteracao Cadastral` | `gente_comunicacao_alteracao_cadastral` |

### 4.5. Contrato de normalizacao

#### 4.5.1. Regras globais permitidas

- aplicar `trim()` em `name`, `description`, `field.label`, `field.placeholder`, `status.label` e `status.id`;
- preservar `allowedUserIds` exatamente como no snapshot;
- preservar `defaultSlaDays` exatamente como no snapshot;
- preservar `field.type` e `field.required`;
- preservar a ordem original de `fields` e `statuses`;
- gerar `field.order` a partir do indice legado `+1`;
- preencher placeholder vazio de forma deterministica por tipo:
  - `text` e `textarea`: `Insira <label normalizado>`
  - `select`: `Selecione <label normalizado>`
  - `date`: `Informe <label normalizado>`
  - `file`: `Anexe <label normalizado>`
- preservar `fields=[]` como caso valido;
- mapear `kind` do step como:
  - primeiro status = `start`
  - ultimo status = `final`
  - demais = `work`

#### 4.5.2. Overrides tecnicos obrigatorios de `field.id`

Estes overrides sao fechados no design e nao podem ser inferidos em runtime:

| legacyWorkflowId | workflowTypeId | Origem | Destino |
|------------------|----------------|--------|---------|
| `2bnzgKX37heY7P9jK6LP` | `governanca_espelhamento_caso_unico` | `campo_3` | `email_lider_visualizado` |
| `2bnzgKX37heY7P9jK6LP` | `governanca_espelhamento_caso_unico` | `campo_4` | `email_lider_visualiza` |
| `2bnzgKX37heY7P9jK6LP` | `governanca_espelhamento_caso_unico` | `campo_5` | `codigo_assessor_visualizado` |
| `2bnzgKX37heY7P9jK6LP` | `governanca_espelhamento_caso_unico` | `campo_6` | `codigo_assessor_visualiza` |
| `a5M0z8iYLJquGmr2VSqO` | `governanca_espelhamento_em_lote` | `email_lider` (1o) | `email_lider_visualizado` |
| `a5M0z8iYLJquGmr2VSqO` | `governanca_espelhamento_em_lote` | `email_lider` (2o) | `email_lider_visualiza` |
| `Eqlgq3ZBINFo6TLONl9g` | `gente_comunicacao_alteracao_cargo_remuneracao_time_ou_equipe` | `email` (1o) | `email_lider` |
| `Eqlgq3ZBINFo6TLONl9g` | `gente_comunicacao_alteracao_cargo_remuneracao_time_ou_equipe` | `email` (2o) | `email_colaborador` |
| `MLAqXidcqSfg6dtdynVl` | `marketing_arte_material_grafico` | `imagem_referencia` (select) | `possui_imagem_referencia` |
| `MLAqXidcqSfg6dtdynVl` | `marketing_arte_material_grafico` | `imagem_referencia` (file) | `imagem_referencia_arquivo` |

Fora da tabela acima:

- ids duplicados de `field.id` devem falhar explicitamente;
- ids genericos como `campo_1` so podem ser renomeados quando houver decisao fechada no manifesto.
- quando houver override de duplicidade, a resolucao e posicional: ao percorrer os fields em ordem, cada ocorrencia do id original consome o proximo item do array de override correspondente.

#### 4.5.3. Overrides tecnicos obrigatorios de `status.id`

| legacyWorkflowId | workflowTypeId | Origem | Destino |
|------------------|----------------|--------|---------|
| `2bsVIVhd22bV3bN5rp7W` | `ti_solicitacao_compra_equipamento` | `em_execucao` com label `Em aprovacao` | `em_aprovacao` |
| `2bsVIVhd22bV3bN5rp7W` | `ti_solicitacao_compra_equipamento` | `em_execucao` com label `Em execucao` | `em_execucao` |
| `98fUoidQBMm3MPW4NTic` | `gente_comunicacao_analise_pre_desligamento_acesso_lideres` | `em_analise` com label `Iniciar processo de analise` | `iniciar_processo_analise` |
| `98fUoidQBMm3MPW4NTic` | `gente_comunicacao_analise_pre_desligamento_acesso_lideres` | `em_analise` com label `Em analise - BI` | `em_analise_bi` |
| `98fUoidQBMm3MPW4NTic` | `gente_comunicacao_analise_pre_desligamento_acesso_lideres` | `em_analise` com label `Em analise - Financeiro` | `em_analise_financeiro` |
| `98fUoidQBMm3MPW4NTic` | `gente_comunicacao_analise_pre_desligamento_acesso_lideres` | `em_analise` com label `Em analise - Juridico` | `em_analise_juridico` |
| `98fUoidQBMm3MPW4NTic` | `gente_comunicacao_analise_pre_desligamento_acesso_lideres` | `em_analise` com label `Em analise - Governanca` | `em_analise_governanca` |
| `98fUoidQBMm3MPW4NTic` | `gente_comunicacao_analise_pre_desligamento_acesso_lideres` | `em_analise` com label `Re-analise do Juridico` | `reanalise_juridico` |

Fora da tabela acima:

- ids duplicados de `status.id` devem falhar explicitamente;
- labels e sequencia operacional devem ser preservados.
- quando houver override de duplicidade, a resolucao e posicional: ao percorrer os statuses em ordem, cada ocorrencia do id original consome o proximo item do array de override correspondente.

#### 4.5.4. Preservacao de `action` nos statuses

O snapshot legado contem `statuses[*].action` em `5` workflows. O `versionPayload.stepsById[*]` da 2C passa a aceitar `action?: { ... }` com o shape abaixo:

```ts
type StepActionDef = {
  type: 'approval' | 'acknowledgement' | 'execution';
  label: string;
  approverIds?: string[];
  commentRequired?: boolean;
  commentPlaceholder?: string;
  attachmentPlaceholder?: string;
};
```

Regra:

- a seed deve persistir essa metadata agora;
- `approverIds` representam identidades operacionais `id3a`, nunca email nem `authUid`;
- a 2C nao implementa, por si so, o fluxo completo de `requestAction/respondAction`;
- lotes `4` e `5` so podem ir para `enabled` depois que o runtime operacional passar a consumir esse contrato.

### 4.6. Contrato de owner resolution

O owner operacional continua sendo `id3a`, nunca `authUid`.

Resolucao por workflow:

1. partir de `ownerEmail` do snapshot;
2. aplicar `normalizeEmail()`;
3. carregar `collaborators`;
4. exigir exatamente `1` match por email normalizado;
5. materializar `ownerUserId = collaborator.id3a`;
6. falhar se `id3a` estiver ausente.

O manifesto curado pode declarar:

- `ownerEmailOverride` quando o email legado precisar trocar;
- `ownerUserIdOverride` apenas quando a resolucao por email nao for suficiente e a decisao tiver sido aprovada.

Emails que exigem atencao operacional no dry-run:

- `ti@3ariva.com.br`
- `pablo.costa@3ariva.com.br`
- `matheus@3ainvestimentos.com.br`
- `barbara@3ainvestimentos.com.br`

Regra operacional para esses casos:

- os emails acima estao confirmados como fonte correta de ownerEmail na `v1`;
- o `--dry-run` deve apenas verificar se cada email confirmado resolve para exatamente `1` colaborador com `id3a` valido;
- nenhum fallback automatico por area, nome parecido ou primeiro match e permitido;
- se a resolucao nao for univoca, o lote so pode seguir para `--execute` depois que o manifesto trouxer `ownerUserIdOverride` explicitamente aprovado;
- `ownerEmailOverride` deixa de ser a estrategia esperada para esses quatro casos, salvo descoberta excepcional posterior;
- qualquer `ownerUserIdOverride` aplicado deve continuar auditavel no manifesto do lote.

### 4.7. Politica de contador v2

A 2C adota politica mais restrita que a Fase 1:

- ler `counters/workflowCounter_v2` apenas para inspeccionar existencia e integridade;
- nunca chamar `seedWorkflowCounterV2()` nos scripts da 2C;
- nunca criar, resetar ou alterar `lastRequestNumber` durante seed de catalogo;
- reportar no dry-run:
  - `counterStatus = present_valid | present_invalid | absent`
- tratar o contador como dependencia observada, nao bloqueante;
- permitir que `--dry-run` e `--execute` sigam mesmo com `counterStatus = present_invalid | absent`, desde que o restante do lote esteja valido.

Racional:

- a 2C nao precisa do contador para publicar catalogo;
- qualquer escrita no contador aumentaria o raio de risco sem necessidade funcional.

---

## 5. Architecture Decisions

### ADR-2C-001: A 2C usa manifesto curado em codigo e relatorio de dry-run como dupla de auditabilidade

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-06 |
| Context | O DEFINE exige lotes aprovados, `workflowTypeId` explicito, owner auditavel e review humano antes da escrita. |

**Choice:** cada lote tera um manifesto tipado em codigo com decisions fechadas e o `--dry-run` gerara um relatorio JSON enriquecido com owner resolvido, saneamentos e paths de destino.

**Rationale:**

1. separa decisao humana de dado resolvido em runtime;
2. evita inferencias implicitas a partir do snapshot bruto;
3. torna review de lote objetiva e repetivel.

### ADR-2C-002: O pipeline e compartilhado; os lotes sao wrappers finos

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-06 |
| Context | O padrao da Fase 1 funcionou para 3 workflows, mas a 2C tem 30 workflows e 5 lotes. |

**Choice:** criar um conjunto compartilhado de loaders, validadores e normalizadores em `src/lib/workflows/bootstrap/fase2c/shared/*`; cada lote apenas declara seu manifesto e chama o pipeline comum.

**Rationale:**

1. reduz duplicacao entre 5 scripts;
2. garante mesma politica de owner, area, fields e statuses em toda a macroetapa;
3. deixa excecoes concentradas nos manifestos.

### ADR-2C-003: A 2C falha antes de qualquer escrita se o destino v2 ja existir

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-06 |
| Context | `seedWorkflowType()` e `seedWorkflowVersion()` usam `set()` e, sozinhos, poderiam sobrescrever documentos publicados. |

**Choice:** os scripts da 2C devem consultar `getWorkflowType()` e `getWorkflowVersion()` antes de gravar e abortar se `workflowTypes_v2/{workflowTypeId}` ou `versions/1` ja existirem.

**Rationale:**

1. atende ao MUST de nao sobrescrever publicacao silenciosamente;
2. mantem `repository.ts` como camada generica de persistencia;
3. coloca a regra operacional no script manual, onde o gate humano ocorre.

### ADR-2C-004: O contador v2 vira dependencia observada, nao alvo de seed

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-06 |
| Context | A Fase 1 criou ou preservou o contador; a 2C nao abre requests nem precisa mexer na sequencia. |

**Choice:** a 2C so le o contador para reportar seu estado e nunca o modifica.

**Rationale:**

1. minimiza superficie de risco;
2. impede reset acidental;
3. separa bootstrap de catalogo de bootstrap operacional.

### ADR-2C-005: Action metadata e persistida agora, mas enablement de lotes 4 e 5 depende do runtime

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-06 |
| Context | O snapshot real contem workflows com `statuses[*].action`, enquanto o runtime atual ainda nao entrega o fluxo operacional completo de `requestAction/respondAction`. |

**Choice:** a seed da 2C deve persistir `action` nos steps publicados, mas os lotes `4` e `5` nao podem avancar de `validated` para `enabled` enquanto o runtime nao consumir esse contrato.

**Rationale:**

1. nao perde fidelidade do legado na `v1`;
2. evita bloquear os lotes `1` a `3`;
3. deixa a dependencia explicita em vez de mascarar o gap.

---

## 6. File Manifest

## 6.1. Shared bootstrap files to create

| File | Responsibility | Status |
|------|----------------|--------|
| `src/lib/workflows/bootstrap/fase2c/shared/types.ts` | tipos do manifesto, relatorio dry-run e DTOs internos | create |
| `src/lib/workflows/bootstrap/fase2c/shared/source.ts` | carregar e validar `workflowDefinitions.json` e `workflowAreas.json` | create |
| `src/lib/workflows/bootstrap/fase2c/shared/owner-resolution.ts` | resolver `ownerEmail` -> `ownerUserId` via `collaborators` + overrides | create |
| `src/lib/workflows/bootstrap/fase2c/shared/field-normalization.ts` | normalizar fields, placeholder e overrides de `field.id` | create |
| `src/lib/workflows/bootstrap/fase2c/shared/status-normalization.ts` | normalizar statuses, `kind`, `action` e overrides de `status.id` | create |
| `src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts` | montar `typePayload`, `versionPayload` e relatorio por workflow | create |
| `src/lib/workflows/bootstrap/fase2c/shared/execution.ts` | prechecks de existencia, orquestracao `--dry-run`/`--execute` e escrita | create |

## 6.2. Lot manifests to create

| File | Responsibility | Status |
|------|----------------|--------|
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-01-governanca-financeiro.ts` | mapping e overrides do lote 1 | create |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-02-marketing.ts` | mapping e overrides do lote 2 | create |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-03-ti.ts` | mapping e overrides do lote 3 | create |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-04-gente-servicos-atendimento.ts` | mapping e overrides do lote 4 | create |
| `src/lib/workflows/bootstrap/fase2c/manifests/lote-05-gente-ciclo-vida-movimentacoes.ts` | mapping e overrides do lote 5 | create |

## 6.3. Lot builders to create

| File | Responsibility | Status |
|------|----------------|--------|
| `src/lib/workflows/bootstrap/fase2c/lote-01-governanca-financeiro-v1.ts` | wrapper do pipeline compartilhado para o lote 1 | create |
| `src/lib/workflows/bootstrap/fase2c/lote-02-marketing-v1.ts` | wrapper do pipeline compartilhado para o lote 2 | create |
| `src/lib/workflows/bootstrap/fase2c/lote-03-ti-v1.ts` | wrapper do pipeline compartilhado para o lote 3 | create |
| `src/lib/workflows/bootstrap/fase2c/lote-04-gente-servicos-atendimento-v1.ts` | wrapper do pipeline compartilhado para o lote 4 | create |
| `src/lib/workflows/bootstrap/fase2c/lote-05-gente-ciclo-vida-movimentacoes-v1.ts` | wrapper do pipeline compartilhado para o lote 5 | create |

## 6.4. Manual seed scripts to create

| File | Responsibility | Status |
|------|----------------|--------|
| `src/scripts/seed-fase2c-lote-01-governanca-financeiro-v1.ts` | `--dry-run` / `--execute` do lote 1 | create |
| `src/scripts/seed-fase2c-lote-02-marketing-v1.ts` | `--dry-run` / `--execute` do lote 2 | create |
| `src/scripts/seed-fase2c-lote-03-ti-v1.ts` | `--dry-run` / `--execute` do lote 3 | create |
| `src/scripts/seed-fase2c-lote-04-gente-servicos-atendimento-v1.ts` | `--dry-run` / `--execute` do lote 4 | create |
| `src/scripts/seed-fase2c-lote-05-gente-ciclo-vida-movimentacoes-v1.ts` | `--dry-run` / `--execute` do lote 5 | create |

## 6.5. Existing files to modify

| File | Responsibility | Status |
|------|----------------|--------|
| `src/lib/workflows/runtime/types.ts` | adicionar `StepActionDef` e `action?: StepActionDef` em `StepDef` | modify |
| `src/lib/workflows/runtime/__tests__/repository.test.js` | cobrir que a 2C nao usa o contador como alvo de escrita | optional |
| `src/lib/workflows/bootstrap/step-id.ts` | reutilizado pela 2C sem alteracao funcional | read-only |
| `src/lib/workflows/runtime/repository.ts` | reutilizado para leitura e persistencia; sem mudanca obrigatoria | read-only |
| `src/lib/email-utils.ts` | reutilizado para normalizacao de ownerEmail | read-only |

## 6.6. Existing source files used as read-only input

- `src/scripts/results/workflowDefinitions.json`
- `src/scripts/results/workflowAreas.json`

---

## 7. Contratos e Patterns

### 7.1. Manifesto curado por lote

Cada manifesto exporta um array de entries tipadas:

```ts
type Fase2cManifestEntry = {
  legacyWorkflowId: string;
  workflowTypeId: string;
  lotId:
    | 'lote_01_governanca_financeiro'
    | 'lote_02_marketing'
    | 'lote_03_ti'
    | 'lote_04_gente_servicos_atendimento'
    | 'lote_05_gente_ciclo_vida_movimentacoes';
  lotStatus: 'planned' | 'seeded' | 'validated' | 'enabled';
  ownerEmailOverride?: string;
  ownerUserIdOverride?: string;
  fieldIdOverrides?: Record<string, string[]>;
  statusIdOverrides?: Record<string, string[]>;
};
```

Observacoes:

- `fieldIdOverrides` e `statusIdOverrides` guardam listas por id original para permitir diferenciar duplicidades por ordem;
- a resolucao dos arrays de override e posicional, consumindo cada item pela ordem de aparicao no snapshot;
- o manifesto nao replica payload inteiro do workflow;
- area, fields, statuses e permissions continuam vindo do snapshot legado.

### 7.2. Relatorio de dry-run por workflow

O `--dry-run` deve imprimir JSON com, no minimo:

```ts
type Fase2cDryRunItem = {
  lotId: string;
  legacyWorkflowId: string;
  workflowTypeId: string;
  name: string;
  areaId: string;
  ownerEmailLegacy: string;
  ownerEmailResolved: string;
  ownerUserId: string;
  lotStatus: string;
  workflowTypeDocPath: string;
  versionDocPath: string;
  counterStatus: 'present_valid' | 'present_invalid' | 'absent';
  fieldsSummary: Array<{ id: string; type: string; required: boolean }>;
  statusesSummary: Array<{ statusKey: string; kind: string; hasAction: boolean }>;
  sanitizations: string[];
};
```

### 7.3. Contrato CLI dos scripts

Cada script segue o mesmo contrato:

```text
npx tsx src/scripts/seed-fase2c-lote-0X-<nome>-v1.ts --dry-run
npx tsx src/scripts/seed-fase2c-lote-0X-<nome>-v1.ts --execute
```

Regras:

- `--dry-run` e o default quando `--execute` nao vier;
- `--dry-run` nao grava nada;
- `--execute` so grava se todos os workflows do lote passarem nas validacoes;
- qualquer erro aborta o lote inteiro antes da primeira escrita;
- `--execute` falha se o destino ja existir publicado.
- `counterStatus` deve ser reportado, mas nao bloqueia `--dry-run` nem `--execute`.

### 7.4. Pattern do builder puro

```ts
export function buildSeedPayloadsForLot(
  manifest: Fase2cManifestEntry[],
): Array<{
  workflowTypeId: string;
  typePayload: Record<string, unknown>;
  versionPayload: Record<string, unknown>;
  reportItem: Fase2cDryRunItem;
}> {
  return manifest.map((entry) => {
    const legacy = loadLegacyWorkflow(entry.legacyWorkflowId);
    const owner = resolveOwner(entry, legacy.ownerEmail);
    const fields = normalizeFields(entry, legacy.fields);
    const steps = normalizeStatuses(entry, legacy.statuses);

    return buildV2Payloads({
      entry,
      legacy,
      owner,
      fields,
      steps,
    });
  });
}
```

### 7.5. Pattern do script manual

```ts
async function run() {
  const execute = hasFlag('--execute');
  const dryRun = hasFlag('--dry-run') || !execute;
  const payloads = await buildLote03TiPayloads();

  const counterStatus = await inspectCounterStatus();
  await assertNoPublishedTargets(payloads);

  if (dryRun) {
    printDryRunReport(payloads, counterStatus);
    return;
  }

  for (const payload of payloads) {
    await seedWorkflowType(payload.workflowTypeId, payload.typePayload);
    await seedWorkflowVersion(payload.workflowTypeId, 1, payload.versionPayload);
  }
}
```

### 7.6. Contrato dos documentos publicados

`workflowTypes_v2/{workflowTypeId}` continua com o shape atual do runtime:

- `workflowTypeId`
- `name`
- `description`
- `icon`
- `areaId`
- `ownerEmail`
- `ownerUserId`
- `allowedUserIds`
- `active`
- `latestPublishedVersion`
- `createdAt`
- `updatedAt`

Regra adicional de `active` por lote:

- lotes `1`, `2` e `3`: `active = true` quando o lote estiver apto a `enabled`;
- lotes `4` e `5`: `active = false` durante toda a 2C; a promocao para `true` fica bloqueada ate o runtime de `action` existir.

`workflowTypes_v2/{workflowTypeId}/versions/1` continua com o shape atual, com extensao opcional em `stepsById[*].action`:

- `workflowTypeId`
- `version = 1`
- `state = published`
- `ownerEmailAtPublish`
- `defaultSlaDays`
- `fields`
- `initialStepId`
- `stepOrder`
- `stepsById`
- `publishedAt`

---

## 8. Testing Strategy

## 8.1. Unit tests

Criar suites em `src/lib/workflows/bootstrap/fase2c/__tests__/` para:

- loader do snapshot como objeto indexado por `legacyWorkflowId`;
- validacao de area existente em `workflowAreas.json`;
- owner resolution com:
  - match unico
  - zero match
  - match ambiguo
  - `ownerUserIdOverride`
- placeholder generator por tipo;
- preservacao de `fields=[]`;
- overrides de `field.id` fechados neste design;
- overrides de `status.id` fechados neste design;
- persistencia de `action` nos steps quando o snapshot trouxer metadata;
- falha em duplicidade nao coberta por override;
- falha quando `workflowTypeId` canonico se repetir no manifesto.

## 8.2. Integration tests

Criar suites para:

- `buildSeedPayloadsForLot()` dos lotes `1`, `2`, `3`, `4` e `5` cobrindo payload valido de ponta a ponta;
- lote `2` cobrindo explicitamente o override de `imagem_referencia` -> `possui_imagem_referencia` / `imagem_referencia_arquivo`;
- `buildSeedPayloadsForLot()` do lote `5` cobrindo workflow com `action`;
- precheck de destino publicado ja existente em `workflowTypes_v2`;
- abortar o lote inteiro quando 1 workflow falhar;
- `--dry-run` nao chamar `seedWorkflowType()` nem `seedWorkflowVersion()`;
- `--execute` chamar apenas `workflowTypes_v2` e `versions/1`;
- `counterStatus` ser reportado sem qualquer chamada de escrita no contador;
- `present_invalid` e `absent` nao bloquearem o lote quando o restante estiver valido.

## 8.3. Smoke de lotes

Cada lote deve ser exercitado assim:

1. rodar `--dry-run`;
2. revisar:
   - owner resolvido
   - paths de destino
   - saneamentos aplicados
   - fields e statuses materializados
3. rodar `--execute` em ambiente controlado;
4. validar leitura dos docs publicados em:
   - `workflowTypes_v2/{workflowTypeId}`
   - `workflowTypes_v2/{workflowTypeId}/versions/1`
5. confirmar que nenhum doc foi gravado em `workflows_v2`;
6. confirmar que `counters/workflowCounter_v2.lastRequestNumber` permaneceu inalterado.

## 8.4. Gate de enablement

Checks minimos por lote:

- lote `1`: catalogo publicado, owner resolvido, area validada, smoke ok;
- lote `2`: catalogo publicado, placeholder sanitization revisada, smoke ok;
- lote `3`: catalogo publicado, override de status duplicado validado, smoke ok;
- lote `4`: pode avancar ate `validated`; deve permanecer com `active: false`; `enabled` depende de runtime para `action`;
- lote `5`: pode avancar ate `validated`; deve permanecer com `active: false`; `enabled` depende de runtime para `action`.

## 8.5. Acceptance checks

```gherkin
GIVEN um lote com workflowTypeIds canonicos fechados
WHEN o engenheiro roda o script em --dry-run
THEN o sistema imprime um relatorio com ownerUserId resolvido e nenhum write no Firestore

GIVEN um workflow com field.id duplicado coberto por override explicito
WHEN o builder da 2C materializa os payloads
THEN os campos publicados ficam com ids tecnicos unicos e tipos preservados

GIVEN um workflow do lote 5 com statuses action-driven
WHEN o builder publica versions/1
THEN a metadata de action fica persistida nos steps publicados sem reinterpretar a regra de negocio

GIVEN um workflowTypeId ja existente em workflowTypes_v2
WHEN o script roda em --execute
THEN o lote falha antes da primeira escrita e nao sobrescreve a publicacao existente
```

---

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | interromper a progressao para o proximo lote | nenhum novo `workflowTypeId` e publicado |
| 2 | desativar no frontend oficial apenas os workflows do lote afetado | catalogo oficial deixa de expor o lote problematico |
| 3 | manter os docs publicados como artefato tecnico ate decisao manual de limpeza | rastreabilidade de auditoria preservada |
| 4 | reverter apenas o commit dos scripts/manifestos da 2C, se o problema for de codigo | build volta ao baseline anterior |

Metodo rapido:

- `git revert <commit-da-2C>`

Como a 2C nao escreve em `workflows_v2`:

- nao existe rollback de requests operacionais;
- nao existe migracao reversa de instancias;
- o risco fica concentrado em catalogo publicado e exposicao do frontend.

Se um lote ja publicado precisar ser retirado:

1. marcar o lote como nao habilitado no frontend;
2. decidir manualmente se os docs `workflowTypes_v2` permanecem apenas desativados ou se serao removidos por operacao controlada;
3. nunca usar remocao automatica como parte do script de seed.

---

## 10. Implementation Checklist

### Pre-Build

- [ ] `DEFINE_FASE2C_SEED_30_WORKFLOWS.md` aprovado
- [ ] tabela de `workflowTypeId` canonico fechada
- [ ] overrides de `field.id` e `status.id` copiados para os manifestos
- [ ] estrategia de owner override alinhada com operacao
- [ ] dependencia de `action` para lotes `4` e `5` registrada no plano de rollout

### Post-Build

- [ ] os `5` scripts de lote existem e aceitam `--dry-run` / `--execute`
- [ ] o pipeline compartilhado falha antes de qualquer escrita quando encontra ambiguidade
- [ ] o relatorio de dry-run traz owner resolvido, saneamentos e paths de destino
- [ ] nenhum script da 2C escreve no contador
- [ ] lote `1`, `2` e `3` conseguem chegar a `enabled` sem regressao
- [ ] lote `4` e `5` ficam claramente bloqueados em `validated` ate readiness do runtime de actions

---

## 11. Specialist Instructions

### Para `build`

Arquivos focais:

- `src/lib/workflows/bootstrap/fase2c/shared/*`
- `src/lib/workflows/bootstrap/fase2c/manifests/*`
- `src/lib/workflows/bootstrap/fase2c/*.ts`
- `src/scripts/seed-fase2c-lote-*.ts`
- `src/lib/workflows/runtime/types.ts`

Requisitos chave:

- seguir o padrao builder puro + script manual;
- nao reabrir criterio de lotes;
- nao inferir ids canonicos fora dos manifestos;
- abortar o lote inteiro antes da primeira escrita se qualquer workflow falhar;
- manter `repository.ts` como camada de persistencia generica, usando prechecks no script.

### Para `ship`

Artefatos focais:

- relatorios de dry-run por lote
- registro de owners resolvidos e overrides usados
- checklist de smoke por lote
- registro de dependencias remanescentes para `enabled`

Requisitos chave:

- declarar explicitamente quais lotes estao prontos para `enabled`;
- separar lote publicado de lote validado mas bloqueado por `action`;
- manter a trilha de auditoria entre `legacyWorkflowId` e `workflowTypeId`.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-06 | Codex (`design` skill) | Initial design for Fase 2C based on DEFINE, legacy snapshot and Fase 1 seed pattern |
