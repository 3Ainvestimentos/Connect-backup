# DEFINE: Correcao do Canon de 3 Etapas na Fase 2C

> Generated: 2026-04-06
> Status: Approved for design
> Scope: Fase 2 / 2C - fechamento do contrato de `stepStrategy` por workflow e reseed dos lotes publicados com malha legada excessiva
> Parent define: `DEFINE_FASE2C_SEED_30_WORKFLOWS.md`
> Source brainstorm: `BRAINSTORM_CORRECAO_CANON_3_ETAPAS_FASE2C.md`

## 1. Problem Statement

A seed da `2C` hoje preserva todos os `statuses` legados por padrao, mas parte dos workflows diretos da fase deveria ter sido publicada no mesmo canon simplificado de `3` etapas ja aprovado em Facilities; sem uma estrategia explicita por workflow, os lotes ficam inconsistentes e precisam de correcao antes do rollout continuar.

---

## 2. Users

### 2.1. Engenharia / plataforma de workflows

Pain points:

- a pipeline da `2C` foi construida para preservar o legado, mas isso conflita com a decisao funcional ja tomada para fluxos diretos simplificados;
- o normalizador atual nao distingue fluxo direto canonico de fluxo legado que realmente precisa ser preservado;
- sem uma chave explicita no manifesto, cada novo lote fica sujeito ao mesmo erro de publicacao.

### 2.2. Operacao tecnica de seed

Pain points:

- os lotes `1` e `2` ja podem ter sido publicados com steps em excesso e exigem reseed seguro;
- a equipe precisa de uma regra objetiva para saber quais workflows remover, republicar e manter bloqueados;
- patch manual em Firestore corrige o sintoma, mas nao corrige a fonte de verdade da seed.

### 2.3. Manutencao futura da 2C

Pain points:

- a ausencia de classificacao explicita dificulta auditoria de por que um workflow foi simplificado ou preservado;
- workflows com `action` e fluxos com checkpoints semanticos podem ser simplificados indevidamente se a regra virar heuristica;
- a correicao precisa deixar o catalogo da `2C` estavel antes de qualquer nova onda de rollout.

---

## 3. Goals

### MUST

- adicionar `stepStrategy` explicito em **todas** as `30` entradas dos manifestos da `2C`, sem fallback implicito;
- fechar apenas `2` estrategias validas nesta correcao:
  - `preserve_legacy`
  - `canonical_3_steps`
- exigir que `canonical_3_steps` publique exatamente:
  - `solicitacao_aberta`
  - `em_andamento`
  - `finalizado`
- manter em `canonical_3_steps` o mapeamento logico fixo:
  - `start`
  - `work`
  - `final`
- impedir o uso de `canonical_3_steps` em qualquer workflow cujo legado contenha `statuses[*].action`;
- impedir que a estrategia canonica dependa de `statusIdOverrides` para steps intermediarios descartados;
- tratar como configuracao invalida qualquer workflow com `stepStrategy = canonical_3_steps` que ainda carregue `statusIdOverrides` no manifesto;
- exigir que workflows em `canonical_3_steps` reproduzam o mesmo comportamento operacional ja adotado em Facilities para fluxos diretos:
  - `solicitacao_aberta` representa a fila inicial em que o owner designa um responsavel;
  - `em_andamento` representa o chamado apos atribuicao de responsavel e inicio de execucao;
  - `finalizado` representa a conclusao operacional;
- fechar neste define a lista exata dos workflows que usam `canonical_3_steps` e, por exclusao controlada, quais permanecem em `preserve_legacy`;
- preservar o comportamento atual de `preserve_legacy`, inclusive ordem, `action`, `statusIdOverrides`, `lotStatus` e gate de `active`;
- tratar a correcao como fonte de verdade para reseed:
  - remover manualmente as publicacoes ja existentes dos lotes `1` e `2`
  - reexecutar os scripts normais apos a correcao
  - nao executar os lotes restantes antes de a correcao entrar

### SHOULD

- expor no `dry-run` a estrategia aplicada por workflow para facilitar revisao humana do payload;
- cobrir com testes automatizados os dois caminhos:
  - `canonical_3_steps`
  - `preserve_legacy`
- cobrir com teste negativo a falha quando `canonical_3_steps` for combinado com `action`;
- deixar o contrato suficientemente fechado para um design curto, sem reabrir discovery funcional dos `30` workflows.

### COULD

- registrar no `dry-run` ou no report uma contagem consolidada de workflows por estrategia;
- emitir aviso explicito quando um workflow preservado continuar com malha legada longa por decisao funcional deliberada.

### WON'T

- nao inferir automaticamente a estrategia a partir da malha de statuses;
- nao redesenhar owners, fields, areas, SLA ou politica de ativacao da `2C`;
- nao implementar o runtime futuro de `requestAction/respondAction`;
- nao aceitar patch manual de documentos publicados como solucao principal;
- nao reabrir o define macro da `2C`.

---

## 4. Matriz Fechada de `stepStrategy`

### 4.1. Contrato funcional

| `stepStrategy` | Quando usar | Resultado esperado |
| --- | --- | --- |
| `preserve_legacy` | workflow com `action`, checkpoints semanticos relevantes ou fluxo enxuto que ja nao sofre com "etapas demais" | publica a ordem legada normalizada, preservando `action` e overrides |
| `canonical_3_steps` | workflow direto, sem `action`, aprovado para simplificacao | publica somente `solicitacao_aberta -> em_andamento -> finalizado`, com o mesmo comportamento operacional adotado em Facilities |

Guardrails fechados:

- `canonical_3_steps` nao pode ser usado em workflow com `statuses[*].action`;
- `canonical_3_steps` nao pode depender de nomes intermediarios, labels ou IDs legados para montar o payload final;
- `canonical_3_steps` nao pode coexistir com `statusIdOverrides`; se essa combinacao aparecer no manifesto, o build deve falhar como erro de configuracao;
- `canonical_3_steps` deve reaproveitar a mesma semantica funcional de Facilities para fluxos diretos:
  - `Solicitacao Aberta` = owner triando e designando responsavel;
  - `Em Andamento` = chamado atribuido e em execucao;
  - `Finalizado` = encerramento operacional;
- `preserve_legacy` continua sendo obrigatorio quando o fluxo representa checkpoints departamentais ou aprovacoes que ainda precisam permanecer visiveis no contrato da `v1`.

### 4.2. Workflows aprovados para `canonical_3_steps`

Total fechado nesta correcao: `19`.

| Lote | `workflowTypeId` |
| --- | --- |
| `lote_01_governanca_financeiro` | `governanca_espelhamento_caso_unico` |
| `lote_01_governanca_financeiro` | `governanca_espelhamento_em_lote` |
| `lote_02_marketing` | `marketing_evento` |
| `lote_02_marketing` | `marketing_sugestao_3a_riva_store` |
| `lote_02_marketing` | `marketing_arte_material_grafico` |
| `lote_02_marketing` | `marketing_assinatura_email_cartao_visita_cartao_visita_digital` |
| `lote_02_marketing` | `marketing_acoes_marketing` |
| `lote_02_marketing` | `marketing_solicitacao_patrocinios` |
| `lote_03_ti` | `ti_problemas_hardware` |
| `lote_03_ti` | `ti_solicitacao_compra_equipamento` |
| `lote_03_ti` | `ti_problemas_rede` |
| `lote_03_ti` | `ti_sugestoes_3a_riva_connect` |
| `lote_03_ti` | `ti_problemas_software` |
| `lote_03_ti` | `ti_alteracao_email_xp` |
| `lote_03_ti` | `ti_padronizacao_email_codigo_xp` |
| `lote_03_ti` | `ti_reset_senha` |
| `lote_04_gente_servicos_atendimento` | `gente_comunicacao_fale_com_a_gente` |
| `lote_04_gente_servicos_atendimento` | `gente_comunicacao_solicitacao_abertura_vaga` |
| `lote_05_gente_ciclo_vida_movimentacoes` | `gente_comunicacao_alteracao_cadastral` |

Racional comum desta lista:

- sao workflows sem `action` no snapshot legado da `2C`;
- o desenho legado atual e linear e nao precisa expor checkpoints intermediarios no modelo novo;
- a malha hoje publicada ou pronta para publicacao repete variantes de `em_analise`, `em_execucao`, `em_aprovacao` ou equivalentes genericos que ja foram colapsados no piloto de Facilities.

### 4.3. Workflows que permanecem em `preserve_legacy` sem `action`

Total fechado nesta correcao: `6`.

| `workflowTypeId` | Motivo de preservacao |
| --- | --- |
| `financeiro_solicitacao_pagamentos` | fluxo legado nao segue o canon simples de abertura e contem etapa operacional especifica (`etapa_2`) que ainda nao foi aprovada para colapso |
| `marketing_revisao_materiais_apresentacoes` | fluxo ja e enxuto (`3` statuses) e nasce em `em_aberto`; esta correcao nao reabre essa semantica |
| `gente_comunicacao_servicos_plano_saude` | fluxo ja esta compacto em `3` statuses e nao e o problema que motivou a correcao |
| `gente_comunicacao_comprovacao_ancord` | ha checkpoints semanticos explicitos de `juridico` e `gestao` que nao devem ser colapsados sem decisao de negocio separada |
| `gente_comunicacao_alteracao_cargo_remuneracao_time_ou_equipe` | as etapas representam analises departamentais especificas de `G&C` e `BI/Governanca`, e nao apenas progresso generico |
| `ti_solicitacao_compra_software_sistema` | fluxo ja esta em `3` statuses e preserva um checkpoint de aprovacao explicito que esta fora do recorte desta correcao |

### 4.4. Workflows que permanecem em `preserve_legacy` por conter `action`

Total fechado nesta correcao: `5`.

| `workflowTypeId` | Motivo de preservacao |
| --- | --- |
| `gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas` | possui `action` em `em_execucao` |
| `gente_comunicacao_analise_pre_desligamento_acesso_lideres` | possui multiplos checkpoints com `action` e fluxo multi-etapas |
| `gente_comunicacao_cadastro_novos_entrantes_demais_areas` | possui `action` em etapa intermediaria de TI |
| `gente_comunicacao_solicitacao_desligamento_demais_areas_nao_comerciais` | possui cadeia multi-area com `approval` e `acknowledgement` |
| `gente_comunicacao_cadastro_novos_entrantes_associado` | possui checkpoints de `action` para TI e Juridico |

---

## 5. Success Criteria

- as `30` entradas dos manifestos da `2C` passam a declarar `stepStrategy` explicitamente;
- os `19` workflows classificados como `canonical_3_steps` geram em `dry-run` exatamente `3` steps com `statusKey = solicitacao_aberta`, `em_andamento` e `finalizado`;
- os `11` workflows preservados continuam publicando a malha legada esperada, sem perda de `action` nem de checkpoints mantidos;
- qualquer tentativa de combinar `canonical_3_steps` com `statuses[*].action` falha antes da publicacao;
- os lotes `1` e `2` podem ser removidos manualmente e reseedados com os mesmos scripts, agora produzindo payload coerente com o define;
- nenhum lote adicional e executado com a estrategia antiga apos a aprovacao desta correcao.

### Clarity Score

`14/15`

Motivo:

- o problema tecnico esta isolado em um ponto especifico do contrato da seed;
- a decisao principal de produto ja foi herdada de Facilities e nao precisa ser rediscutida;
- a unica ambiguidade residual e de implementacao curta no design, nao de escopo funcional.

---

## 6. Technical Scope

### Backend / scripts

- ampliar o contrato de manifesto da `2C` para carregar `stepStrategy`;
- ajustar o normalizador de statuses para suportar os dois caminhos fechados neste define;
- manter o builder e os scripts por lote como fonte unica de publicacao;
- refletir a estrategia escolhida nos artefatos de `dry-run` e nos testes da `fase2c`.

### Database

- nenhuma nova colecao;
- nenhuma mudanca de schema fora do payload publicado em:
  - `workflowTypes_v2/{workflowTypeId}`
  - `workflowTypes_v2/{workflowTypeId}/versions/1`
- os documentos ja publicados incorretamente nos lotes `1` e `2` serao removidos manualmente antes do reseed;
- esta correcao nao autoriza edicao manual persistente dos docs como substituto da seed.

### Frontend

- fora do escopo.

### Runtime / AI

- nenhum ajuste de frontend ou de servicos de AI;
- nenhum suporte novo ao fluxo operacional de `action`.

---

## 7. Auth Requirements

- a correcao nao altera `JWT`, claims, auth client-side ou isolamento entre usuarios;
- `ownerUserId` continua sendo resolvido em identidade operacional `id3a`, sem fallback novo;
- workflows com `action` continuam bloqueados de simplificacao justamente para evitar perda de checkpoints de autorizacao ou ciencia;
- nenhum workflow pode ganhar permissao adicional por causa da mudanca de steps.

---

## 8. Out of Scope

- redefinir quais workflows da `2C` sao `enabled` ou `validated` alem do que ja foi fechado na macroetapa;
- discutir novo desenho funcional para `financeiro_solicitacao_pagamentos`, `marketing_revisao_materiais_apresentacoes` ou outros fluxos preservados;
- alterar `fieldIdOverrides`, owners ou areas por conveniencia desta correcao;
- introduzir heuristica para deduzir simplificacao automaticamente;
- executar o reseed real ou a remocao manual no banco dentro desta etapa de define.
