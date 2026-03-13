# Etapa 2 — Bloco C: Confronto Configuracao x Runtime x Dados

## 1. Resumo executivo

### Arquivos consultados

- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/CHECKLIST_OPERACIONAL_ETAPA_2.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_A_INVENTARIO_CONFIGURADO.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_B_REGRA_IMPLEMENTADA.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflow_samples.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/README.md`

### Fato comprovado

- `workflow_samples.json` contem `33` chaves de `type`.
- `workflowDefinitions.json` contem `33` workflows.
- Interseccao entre `types` observados e workflows definidos: `33`.
- `types` definidos sem sample correspondente: `0`.
- `types` observados sem definicao correspondente: `0`.
- O sample atual e indexado por `type`, portanto a evidencia observada nesta etapa corresponde a `1` amostra por `type`.
- Contagens observadas no sample atual:
  - `17` documentos nao arquivados
  - `16` documentos arquivados
  - `21` documentos com `assignee`
  - `12` documentos sem `assignee`
  - `9` documentos com `actionRequests`
  - `2` documentos com `formData` vazio
  - `2` `types` com `status` atual fora da definicao vigente
  - `4` `types` com `history.status` fora da definicao vigente
  - `3` `types` com `ownerEmail` divergente da definicao vigente
  - `1` `type` com campo observado fora da definicao (`_uploadErrors`)
  - `2` `types` com campos configurados ausentes na amostra

### Inferencia

- Os conflitos de `status`, `actionRequests` e `ownerEmail` fora da definicao atual apontam para legado ativo ou para documentos criados sob definicoes anteriores.
- O sample de `Ações Marketing` com `formData` vazio e `history` inicial e compativel com a criacao em duas fases mapeada no Bloco B.

### Ponto em aberto

- Os nomes `Cadastro de Novos Entrantes - Demais Áreas `, `Serviços de Plano de Saúde `, `Solicitação de Pagamentos ` e `Espelhamento - Caso Único ` mantem espaco final conforme o export. Eles foram preservados aqui exatamente como aparecem na amostra e na definicao.

## 2. Types observados

| type | requestId | status atual | historyCount | actionRequestKeyCount | formDataKeyCount |
| --- | --- | --- | --- | --- | --- |
| `Alteração Cadastral` | `0542` | `finalizado` | `4` | `0` | `15` |
| `Alteração de Cargo / Remuneração / Time ou Equipe` | `0421` | `finalizado` | `1` | `0` | `10` |
| `Alteração no E-mail XP` | `0268` | `em_execucao` | `3` | `0` | `5` |
| `Análise Pré-Desligamento (Acesso líderes)` | `0663` | `em_analise` | `1` | `0` | `11` |
| `Arte / Material gráfico` | `0075` | `finalizado` | `4` | `0` | `12` |
| `Assinatura de e-mail; Cartão de visita; Cartão de visita digital` | `0080` | `finalizado` | `4` | `0` | `9` |
| `Ações Marketing` | `0310` | `solicitacao_aberta` | `1` | `0` | `0` |
| `Cadastro de Novos Entrantes - Associado` | `0375` | `enviar_financeiro` | `9` | `3` | `11` |
| `Cadastro de Novos Entrantes - Demais Áreas ` | `0238` | `finalizado` | `9` | `2` | `10` |
| `Comprovação ANCORD` | `0216` | `finalizada` | `9` | `3` | `6` |
| `Espelhamento - Caso Único ` | `0474` | `solicitacao_aberta` | `1` | `0` | `7` |
| `Espelhamento - Em lote` | `0573` | `solicitacao_aberta` | `1` | `0` | `5` |
| `Evento` | `0625` | `solicitacao_aberta` | `1` | `0` | `12` |
| `Fale com a GENTE` | `0169` | `finalizado` | `4` | `0` | `4` |
| `Manutenção / Solicitações Gerais` | `0258` | `finalizado` | `5` | `0` | `6` |
| `Padronização de E-mail  - Código XP` | `0298` | `ciente_gestao` | `13` | `2` | `5` |
| `Problemas de Hardware` | `0343` | `finalizado` | `4` | `0` | `5` |
| `Problemas de Rede` | `0138` | `finalizado` | `4` | `0` | `6` |
| `Problemas de Software` | `0076` | `finalizado` | `5` | `0` | `5` |
| `Reset de Senha` | `0190` | `finalizado` | `5` | `0` | `4` |
| `Revisão de materiais e Apresentações` | `0498` | `em_aberto` | `1` | `0` | `4` |
| `Serviços de Plano de Saúde ` | `0061` | `finalizado` | `4` | `0` | `5` |
| `Solicitação Desligamento - Demais áreas (Não comerciais)` | `0242` | `finalizado` | `14` | `5` | `12` |
| `Solicitação de Abertura de Vaga` | `0021` | `finalizado` | `5` | `1` | `5` |
| `Solicitação de Compra - Equipamento` | `0192` | `em_execucao` | `46` | `1` | `6` |
| `Solicitação de Compra - Software/Sistema` | `0536` | `finalizado` | `4` | `0` | `7` |
| `Solicitação de Compras` | `0053` | `finalizada` | `8` | `2` | `9` |
| `Solicitação de Férias / Ausência / Compensação de horas` | `0187` | `finalizado` | `5` | `1` | `7` |
| `Solicitação de Pagamentos ` | `0637` | `em_analise` | `1` | `0` | `0` |
| `Solicitação de Patrocínios` | `0211` | `finalizado` | `5` | `0` | `10` |
| `Solicitação de Suprimentos` | `0261` | `finalizado` | `5` | `0` | `7` |
| `Sugestão 3A RIVA Store` | `0410` | `finalizado` | `4` | `0` | `5` |
| `Sugestões 3A RIVA Connect` | `0460` | `finalizado` | `5` | `0` | `4` |

## 3. Statuses observados

### Fato comprovado

- `29` amostras permanecem com `status` atual contido na definicao vigente.
- `2` amostras possuem `status` atual fora da definicao vigente:
  - `Padronização de E-mail  - Código XP` (`requestId 0298`) com `status = ciente_gestao`
  - `Cadastro de Novos Entrantes - Associado` (`requestId 0375`) com `status = enviar_financeiro`
- `4` amostras possuem `history.status` fora da definicao vigente:
  - `Padronização de E-mail  - Código XP` com `ciente_gestao`
  - `Solicitação de Compras` com `ciencia_solicitante`
  - `Cadastro de Novos Entrantes - Associado` com `enviar_financeiro`
  - `Cadastro de Novos Entrantes - Demais Áreas ` com `em_analise`, `ciente_fin`, `cadastro_plataformas`

### Tabela de confronto de status

| type | requestId | status atual observado | history statuses fora da definicao | leitura conservadora |
| --- | --- | --- | --- | --- |
| `Padronização de E-mail  - Código XP` | `0298` | `ciente_gestao` | `ciente_gestao` | conflito forte com definicao atual; amostra sugere legado ativo. |
| `Solicitação de Compras` | `0053` | `finalizada` | `ciencia_solicitante` | status atual cabe na definicao, mas o historico guarda etapa fora do fluxo vigente. |
| `Cadastro de Novos Entrantes - Associado` | `0375` | `enviar_financeiro` | `enviar_financeiro` | conflito forte com definicao atual; amostra sugere legado ativo. |
| `Cadastro de Novos Entrantes - Demais Áreas ` | `0238` | `finalizado` | `em_analise`, `ciente_fin`, `cadastro_plataformas` | status atual cabe na definicao, mas o historico mistura etapas que nao existem mais. |

## 4. Campos reais observados por workflow/tipo

| type | requestId | fields observados na amostra | confronto com a definicao vigente |
| --- | --- | --- | --- |
| `Alteração Cadastral` | `0542` | `campo_1`, `campo_14`, `campo_15`, `campo_16`, `campo_19`, `campo_2`, `campo_20`, `campo_21`, `campo_3`, `campo_4`, `campo_5`, `campo_6`, `campo_7`, `campo_8`, `campo_9` | faltam `campo_10`, `campo_12`, `campo_13`; na definicao atual esses campos nao sao obrigatorios. |
| `Alteração de Cargo / Remuneração / Time ou Equipe` | `0421` | `anexo`, `cargo_area`, `descricao_detalhada`, `email`, `nome_sobrenome`, `nome_sobrenome_colaborador`, `nova_equipe`, `nova_remuneracao`, `novo_cargo`, `setor_area` | sem divergencia estrutural de field names; a definicao atual contem `field.id` duplicado (`email`). |
| `Alteração no E-mail XP` | `0268` | `descricao_detalhada`, `email`, `impacto`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |
| `Análise Pré-Desligamento (Acesso líderes)` | `0663` | `area_desligado`, `cargo_desligado`, `cod_xp`, `data`, `descricao_detalhada`, `email`, `nome_desligado`, `nome_sobrenome`, `observacoes`, `setor_area`, `tipo_desligamento` | sem divergencia de field names. |
| `Arte / Material gráfico` | `0075` | `categoria`, `conteudo_texto`, `descricao_detalhada`, `email`, `imagem_referencia`, `impacto`, `nome_sobrenome`, `objetivo`, `prazo`, `publico_alvo`, `setor_area`, `versoes` | sem field fora da definicao; a definicao atual contem `field.id` duplicado (`imagem_referencia`). |
| `Assinatura de e-mail; Cartão de visita; Cartão de visita digital` | `0080` | `cargo_area`, `descricao_detalhada`, `email`, `filial`, `impacto`, `necessario`, `nome_sobrenome`, `setor_area`, `telefone` | sem divergencia de field names. |
| `Ações Marketing` | `0310` | nenhum campo em `formData` | conflito forte: a definicao atual exige `5` fields, todos ausentes na amostra. |
| `Cadastro de Novos Entrantes - Associado` | `0375` | `anexo`, `cargo_proposto`, `contratacao_via`, `data_inicio`, `email`, `equipe`, `nome_lider`, `nome_sobrenome`, `observacoes`, `pf_abaixo_pj`, `telefone` | sem divergencia de field names. |
| `Cadastro de Novos Entrantes - Demais Áreas ` | `0238` | `anexo`, `cargo_proposto`, `contratacao_via`, `data_inicio`, `email`, `equipe`, `nome_lider`, `nome_sobrenome`, `observacoes`, `telefone` | sem divergencia de field names. |
| `Comprovação ANCORD` | `0216` | `codigo_xp`, `comprovante_ancord`, `contratacao_via`, `email`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |
| `Espelhamento - Caso Único ` | `0474` | `campo_3`, `campo_4`, `campo_5`, `campo_6`, `descricao_detalhada`, `nome_sobrenome`, `tipo_solicitacao` | sem divergencia de field names. |
| `Espelhamento - Em lote` | `0573` | `_uploadErrors`, `anexo_planilha`, `email_lider`, `nome_sobrenome`, `tipo_solicitacao` | `_uploadErrors` nao existe na definicao; ele e compativel com a regra hardcoded do runtime. |
| `Evento` | `0625` | `data`, `descricao_detalhada`, `email`, `formato`, `horario`, `impacto`, `nome_evento`, `nome_sobrenome`, `objetivo`, `publico_alvo`, `quantidade_pessoas`, `setor_area` | sem divergencia de field names. |
| `Fale com a GENTE` | `0169` | `descricao_detalhada`, `email`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |
| `Manutenção / Solicitações Gerais` | `0258` | `centrodecusto`, `descricao_detalhada`, `email`, `impacto`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |
| `Padronização de E-mail  - Código XP` | `0298` | `cod_xp`, `contratacao_via`, `email`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |
| `Problemas de Hardware` | `0343` | `descricao_detalhada`, `email`, `impacto`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |
| `Problemas de Rede` | `0138` | `descricao_detalhada`, `email`, `impacto`, `nome`, `setor_area`, `sobrenome` | sem divergencia de field names. |
| `Problemas de Software` | `0076` | `descricao_detalhada`, `email`, `impacto`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |
| `Reset de Senha` | `0190` | `email`, `nome_sobrenome`, `rese_senha`, `setor_area` | sem divergencia de field names. |
| `Revisão de materiais e Apresentações` | `0498` | `area`, `material`, `nome_sobrenome`, `observacao` | sem divergencia de field names. |
| `Serviços de Plano de Saúde ` | `0061` | `descricao_detalhada`, `email`, `nome_sobrenome`, `setor_area`, `tipo_solicitacao` | sem divergencia de field names. |
| `Solicitação Desligamento - Demais áreas (Não comerciais)` | `0242` | `area_desligado`, `cargo_desligado`, `cod_xp`, `data`, `descricao_detalhada`, `email`, `nome_desligado`, `nome_sobrenome`, `observacoes`, `setor_area`, `tipo_cargo`, `tipo_desligamento` | sem divergencia de field names. |
| `Solicitação de Abertura de Vaga` | `0021` | `descricao_vaga`, `email`, `nome_sobrenome`, `prazo_contratacao`, `setor_area` | sem divergencia de field names; `prazo_contratacao` aparece no sample com valor vazio. |
| `Solicitação de Compra - Equipamento` | `0192` | `email`, `item_compra_ti`, `link_compra_ti`, `nome_completo`, `quantiadade_compra_ti`, `setor_area` | sem divergencia de field names. |
| `Solicitação de Compra - Software/Sistema` | `0536` | `area`, `descricao`, `email`, `motivo`, `nome`, `nome_sobrenome`, `recorrencia` | sem divergencia de field names. |
| `Solicitação de Compras` | `0053` | `anexos`, `centro_custo`, `email`, `impacto`, `item_compra`, `link_produto`, `motivo`, `nome_sobrenome`, `quantidade` | sem divergencia de field names. |
| `Solicitação de Férias / Ausência / Compensação de horas` | `0187` | `data_fim`, `data_inicio`, `descricao_detalhada`, `email`, `nome_sobrenome`, `setor_area`, `tipo_solicitacao` | sem divergencia de field names; `data_inicio` e `data_fim` aparecem com valor vazio na amostra. |
| `Solicitação de Pagamentos ` | `0637` | nenhum campo em `formData` | consistente com a definicao atual, que contem `0` fields; ainda assim permanece ponto em aberto de negocio. |
| `Solicitação de Patrocínios` | `0211` | `apresentacao`, `beneficios`, `data`, `descricao_detalhada`, `email`, `hora`, `impacto`, `nome_sobrenome`, `setor_area`, `valor` | sem divergencia de field names. |
| `Solicitação de Suprimentos` | `0261` | `anexo_planilha`, `centrodecusto`, `email`, `impacto`, `nome_sobrenome`, `observacoes`, `setor_area` | sem divergencia de field names. |
| `Sugestão 3A RIVA Store` | `0410` | `descricao_detalhada`, `email`, `impacto`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |
| `Sugestões 3A RIVA Connect` | `0460` | `descricao_detalhada`, `email`, `nome_sobrenome`, `setor_area` | sem divergencia de field names. |

## 5. Divergencias consolidadas

### Contagem por classificacao usada neste documento

- `legado`: `7` divergencias principais
- `bug_provavel`: `1` divergencia principal
- `configuracao_incorreta`: `1` divergencia principal
- `comportamento_intencional`: `1` divergencia principal
- `duvida_de_negocio`: `4` divergencias principais

### Fato comprovado

- Ha `7` workflows com `actionRequests` observados em combinacoes que nao batem com as `actions` configuradas hoje:
  - `Padronização de E-mail  - Código XP`
  - `Solicitação de Compras`
  - `Cadastro de Novos Entrantes - Associado`
  - `Cadastro de Novos Entrantes - Demais Áreas `
  - `Solicitação de Compra - Equipamento`
  - `Comprovação ANCORD`
  - `Solicitação de Abertura de Vaga`

### Inferencia

- Esse conjunto aponta para legado ativo mais do que para comportamento gerado pelo runtime atual, porque o Bloco B mostrou que o runtime vigente depende da definicao atual para criar `actionRequests` automaticos.

### Ponto em aberto

- Parte dos conflitos pode refletir mudanca de definicao entre a data da amostra e a data do export atual; isso precisa de validacao humana workflow a workflow.

## 6. Legado ativo

| type | requestId | evidencia de legado ativo |
| --- | --- | --- |
| `Padronização de E-mail  - Código XP` | `0298` | `status = ciente_gestao`; `actionRequests` em `ciente_gestao` e `em_execucao`; historico cita labels que nao existem na definicao atual. |
| `Solicitação de Compras` | `0053` | historico contem `ciencia_solicitante`; `actionRequests` em `emaprovacao_fin` e `em_execucao`, embora a definicao atual nao tenha `action`. |
| `Cadastro de Novos Entrantes - Associado` | `0375` | `status = enviar_financeiro`; historico e `actionRequests` citam etapas nao presentes na definicao atual. |
| `Cadastro de Novos Entrantes - Demais Áreas ` | `0238` | historico contem `em_analise`, `ciente_fin`, `cadastro_plataformas`; a definicao atual nao contem essas etapas. |
| `Solicitação de Compra - Equipamento` | `0192` | historico repete `em_execucao` dezenas de vezes com nota de acao automatica “Aprovação TI / FIN”, inexistente na definicao atual. |
| `Comprovação ANCORD` | `0216` | `actionRequests` em `em_analise`, `analise_juridico`, `analise_gestao`; a definicao atual nao configura `action` nesses statuses. |
| `Solicitação de Abertura de Vaga` | `0021` | `actionRequests` em `em_execucao` e nota automatica “Ciente - Gente”, inexistente na definicao atual. |

## 7. Duvidas para validacao humana

- `Assinatura de e-mail; Cartão de visita; Cartão de visita digital`, `Arte / Material gráfico` e `Espelhamento - Caso Único ` exibem `ownerEmail` diferente da definicao atual. Isso representa troca legitima de owner ao longo do tempo ou ajuste manual em dados?
- `Ações Marketing` com `requestId 0310` deve ser tratado como solicitacao valida, rascunho tecnico legado ou falha de criacao em duas fases?
- `Solicitação de Compra - Equipamento` deve manter duas etapas distintas para “Em aprovação” e “Em execução”? Se sim, o `status.id` duplicado atual precisa ser validado como definicao incorreta do estado vigente.
- `Solicitação de Pagamentos ` sem `fields` e com `formData` vazio e intencional, ou o fluxo atual depende de formulario externo e deveria ser descrito formalmente?
- Os workflows com legado ativo devem ser interpretados como historico encerrado ou como comportamento ainda esperado pelo negocio?

## 8. Evidencias por Divergencia Relevante

| type | requestId ou amostra | fato observado | classificacao | observacao sobre o escopo da evidencia |
| --- | --- | --- | --- | --- |
| `Ações Marketing` | `0310` | `formData = {}` e `history` com apenas `solicitacao_aberta`, embora a definicao atual exija `5` fields. | `bug_provavel` | evidencia vem de `1` sample e e triangulada com o runtime em duas fases do Bloco B; nao prova volume, mas prova possibilidade real. |
| `Espelhamento - Em lote` | `0573` | campo `_uploadErrors` aparece no `formData`, fora da definicao vigente. | `comportamento_intencional` | evidencia vem de `1` sample e e sustentada pelo runtime, que escreve `_uploadErrors` quando upload falha. |
| `Padronização de E-mail  - Código XP` | `0298` | `status = ciente_gestao`; `history` e `actionRequests` usam `ciente_gestao` e uma acao automatica nao prevista na definicao atual. | `legado` | evidencia vem de `1` sample e conflita ao mesmo tempo com configuracao atual e com o runtime atual, que hoje dependeria da definicao vigente. |
| `Solicitação de Compras` | `0053` | `history` contem `ciencia_solicitante`; `actionRequests` existem em statuses sem `action` configurada hoje. | `legado` | evidencia vem de `1` sample; o dado observado nao pode ser reproduzido pelo cadastro atual sem alteracao previa de definicao. |
| `Cadastro de Novos Entrantes - Associado` | `0375` | `status = enviar_financeiro`; `actionRequests` em `enviado_gente` e `enviar_financeiro`; historico cita labels fora da definicao atual. | `legado` | evidencia vem de `1` sample; o dado observado nao prova regra global atual, mas prova coexistencia de fluxo legado. |
| `Cadastro de Novos Entrantes - Demais Áreas ` | `0238` | historico usa `em_analise`, `ciente_fin`, `cadastro_plataformas`; `actionRequests` incluem `ciente_fin`, ausente hoje. | `legado` | evidencia vem de `1` sample; o status atual `finalizado` cabe na definicao, mas o historico mostra fluxo anterior. |
| `Solicitação de Compra - Equipamento` | `0192` | `historyCount = 46`, com repeticao de `em_execucao` e nota automatica “Aprovação TI / FIN”; a definicao atual tem `status.id = em_execucao` duplicado e nenhuma `action`. | `configuracao_incorreta` | evidencia triangula `1` sample com o runtime atual por indice/`findIndex`; nao chama bug confirmado do motor, mas registra conflito estrutural forte entre configuracao atual, runtime e dados. |
| `Comprovação ANCORD` | `0216` | `actionRequests` em `em_analise`, `analise_juridico`, `analise_gestao`; a definicao atual nao tem `action` nesses statuses. | `legado` | evidencia vem de `1` sample e indica fluxo historico diferente do cadastro atual. |
| `Solicitação de Abertura de Vaga` | `0021` | `actionRequests` em `em_execucao` com nota automatica “Ciente - Gente”, inexistente na definicao atual. | `legado` | evidencia vem de `1` sample e aponta para comportamento herdado de definicao anterior. |
| `Assinatura de e-mail; Cartão de visita; Cartão de visita digital` | `0080` | `ownerEmail` observado e `barbara.fiche@3ainvestimentos.com.br`, enquanto a definicao atual aponta para `joao.pompeu@3ainvestimentos.com.br`. | `duvida_de_negocio` | evidencia vem de `1` sample; o runtime atual explica snapshot de owner na criacao, mas nao determina se a troca foi intencional. |
| `Arte / Material gráfico` | `0075` | `ownerEmail` observado e `barbara.fiche@3ainvestimentos.com.br`, enquanto a definicao atual aponta para `joao.pompeu@3ainvestimentos.com.br`. | `duvida_de_negocio` | evidencia vem de `1` sample; o conflito pode refletir mudanca legitima de owner ao longo do tempo. |
| `Espelhamento - Caso Único ` | `0474` | `ownerEmail` observado e `marcio.peixoto@3ariva.com.br`, enquanto a definicao atual aponta para `ti@3ariva.com.br`. | `duvida_de_negocio` | evidencia vem de `1` sample; o conflito pode refletir owner historico, override manual ou definicao intermediaria nao exportada. |
| `Solicitação de Pagamentos ` | `0637` | a definicao atual tem `0` fields e a amostra tem `formData` vazio; o bloco configurado e insuficiente para descrever um formulario interno. | `duvida_de_negocio` | evidencia vem de `1` sample e do cadastro atual; nao caracteriza bug, mas exige validacao funcional. |
