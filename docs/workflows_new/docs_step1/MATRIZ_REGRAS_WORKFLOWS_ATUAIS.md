# Matriz de Regras dos Workflows Atuais

## 1. Base de consolidacao

### Arquivos consultados

- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_A_INVENTARIO_CONFIGURADO.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_B_REGRA_IMPLEMENTADA.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_C_CONFRONTO_DADOS.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowAreas.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflow_samples.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/ApplicationsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx`

### Fato comprovado

- A matriz abaixo cobre `33` workflows definidos no export atual.
- Os nomes foram mantidos exatamente como constam nas definicoes e nos samples.

## 2. Matriz por Workflow

### Facilities e Suprimentos

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| Manutenção / Solicitações Gerais | `4` statuses lineares; sem `action`; `ownerEmail = stefania.otoni@3ainvestimentos.com.br`. | criacao em duas fases; progresso por ordem do array; atribuicao manual; notificacao ao solicitante em criacao/status/comentario/atribuicao. | amostra `0258` chegou a `finalizado`, com `assignee`, `history` coerente com `solicitacao_aberta -> em_analise -> em_andamento -> finalizado`. | validar apenas se atribuicao manual ao longo do fluxo e a regra desejada. |
| Solicitação de Compras | `5` statuses lineares (`solicitacao_aberta -> em_analise -> emaprovacao_fin -> em_execucao -> finalizada`); sem `action`. | runtime atual nao cria `actionRequests` para este workflow porque a definicao vigente nao tem `action`. | amostra `0053` contem `actionRequests` em `emaprovacao_fin` e `em_execucao`, alem de `history.status = ciencia_solicitante`, inexistente hoje. | conflito explicito entre configuracao atual, runtime atual e dados; validar se o fluxo legado deve ser preservado. |
| Solicitação de Suprimentos | `4` statuses lineares; sem `action`; anexo obrigatorio. | criacao em duas fases; status por ordem; atribuicao manual. | amostra `0261` esta alinhada ao fluxo configurado (`solicitacao_aberta -> em_analise -> em_andamento -> finalizado`). | sem conflito forte na amostra; confirmar apenas se `isArchived = true` apos conclusao e comportamento esperado. |

### Financeiro

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| Solicitação de Pagamentos  | `3` statuses (`em_analise -> etapa_2 -> finalizado`) e `0` fields configurados. | runtime atual aceita criacao em duas fases, mas este workflow nao descreve formulario interno no cadastro. | amostra `0637` esta em `em_analise`, com `formData` vazio e `history` de uma unica entrada em `em_analise`. | validar se o processo depende de formulario externo/manual ou se a definicao atual esta incompleta. |

### Gente e Comunicação

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| Alteração Cadastral | `18` fields; `4` statuses lineares; sem `action`. | runtime generico de criacao em duas fases e progresso por ordem do array. | amostra `0542` chegou a `finalizado`; faltam `campo_10`, `campo_12`, `campo_13`, que sao opcionais na definicao atual. | sem conflito estrutural forte; confirmar se o formulario opcional continua valido como esta. |
| Alteração de Cargo / Remuneração / Time ou Equipe | `field.id = email` duplicado; `4` statuses lineares; sem `action`. | `field.id` duplicado sobrescreve valor no `formData`; renderizacao usa o primeiro `field.id` encontrado. | amostra `0421` esta `finalizado`, com `historyCount = 1`; o documento final nao registra as transicoes intermediarias no sample exportado. | validar se o sample representa documento alterado manualmente e corrigir a definicao duplicada. |
| Análise Pré-Desligamento (Acesso líderes) | `8` statuses, sendo `6` com `status.id = em_analise`; varios `execution` e `1 acknowledgement`. | runtime busca status por `id`; com `em_analise` duplicado, perde a capacidade de distinguir etapas e tende a usar sempre o primeiro match. | amostra `0663` permanece em `em_analise`, sem `actionRequests`; nao prova o fluxo completo, apenas o estado inicial observado. | conflito estrutural forte entre configuracao atual e algoritmo do runtime; validar o desenho canonico desse workflow antes de refatorar. |
| Cadastro de Novos Entrantes - Associado | `5` statuses; `actions` atuais apenas em `enviar_ti` e `enviar_juridico`. | runtime atual criaria `actionRequests` apenas nos statuses com `action` da definicao vigente. | amostra `0375` esta em `enviar_financeiro` e traz `actionRequests` em `enviado_gente`, `enviar_financeiro` e `enviar_juridico`; `enviar_financeiro` nao existe hoje. | legado ativo comprovado; validar se `Financeiro` ainda faz parte do fluxo oficial. |
| Cadastro de Novos Entrantes - Demais Áreas  | `4` statuses; `action` atual apenas em `acessos_ti`. | runtime atual criaria `actionRequests` apenas em `acessos_ti`. | amostra `0238` finalizada inclui `history` com `em_analise`, `ciente_fin`, `cadastro_plataformas` e `actionRequests` em `ciente_fin`, fora da definicao atual. | legado ativo comprovado; validar se etapas de financeiro/plataformas devem voltar para a configuracao atual ou ser tratadas como historicas. |
| Comprovação ANCORD | `5` statuses; sem `action` na definicao atual. | runtime atual nao criaria `actionRequests` automaticos para este workflow. | amostra `0216` traz `actionRequests` em `em_analise`, `analise_juridico` e `analise_gestao`, com notas de acao automatica. | legado ativo comprovado; validar se a definicao atual perdeu checkpoints funcionais ainda necessarios. |
| Fale com a GENTE | `4` statuses lineares; sem `action`. | runtime generico por ordem do array; atribuicao manual. | amostra `0169` finalizada esta coerente com o fluxo simples configurado. | sem conflito forte na amostra. |
| Serviços de Plano de Saúde  | `3` statuses lineares; sem `action`. | runtime reconhece finalizacao por `label` contendo “Finalizada”. | amostra `0061` finalizada esta coerente com a definicao vigente. | confirmar se `descricao_detalhada` opcional continua intencional. |
| Solicitação Desligamento - Demais áreas (Não comerciais) | `8` statuses; `approval` em `em_andamento` e `acknowledgement` em `desligamento_gente`, `desligamento_ti`, `desligamento_bi`, `enviar_adm`. | runtime cria `actionRequests` ao entrar nesses statuses, mas nao bloqueia avancar com pendencias nem avanca automaticamente apos resposta. | amostra `0242` mostra `actionRequests` exatamente nos mesmos statuses configurados hoje; o sample e o mais alinhado com a definicao atual entre os workflows com `action`. | validar se o avanço manual apos cada `acknowledgement` e regra desejada ou apenas limitacao do motor atual. |
| Solicitação de Abertura de Vaga | `4` statuses lineares; sem `action` na definicao atual. | runtime atual nao criaria `actionRequests` automaticos aqui. | amostra `0021` tem `actionRequests` em `em_execucao` com nota automatica “Ciente - Gente”, inexistente hoje. | legado ativo comprovado; validar se havia checkpoint de Gente que continua funcionalmente necessario. |
| Solicitação de Férias / Ausência / Compensação de horas | `4` statuses; `acknowledgement` em `em_execucao`. | runtime atual cria `actionRequest` ao entrar em `em_execucao`, mas resposta `acknowledged` nao move status automaticamente. | amostra `0187` esta coerente com a configuracao atual quanto a `actionRequests`; `data_inicio` e `data_fim` aparecem como chaves com valor vazio. | validar se datas vazias sao aceitaveis no dado legado ou se indicam problema historico de preenchimento. |

### Governança

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| Espelhamento - Caso Único  | `4` statuses lineares; sem `action`; `ownerEmail = ti@3ariva.com.br`. | runtime generico de criacao em duas fases e progresso linear. | amostra `0474` esta em `solicitacao_aberta`, com `ownerEmail = marcio.peixoto@3ariva.com.br`. | validar se houve troca legitima de owner ao longo do tempo ou override manual de dados. |
| Espelhamento - Em lote | `field.id = email_lider` duplicado; `4` statuses lineares; sem `action`. | `field.id` duplicado sobrescreve valor; upload com falha injeta `_uploadErrors` em `formData`. | amostra `0573` permanece em `solicitacao_aberta` e traz `_uploadErrors` alem dos campos configurados. | conflito explicito entre configuracao e runtime assumido: o campo tecnico `_uploadErrors` nao esta na definicao; validar se esse dado deve continuar no documento final. |

### Marketing

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| Arte / Material gráfico | `field.id = imagem_referencia` duplicado; `4` statuses lineares; `ownerEmail` atual = `joao.pompeu@3ainvestimentos.com.br`. | `field.id` duplicado sobrescreve e a UI usa o primeiro match na leitura; criacao em duas fases. | amostra `0075` finalizada usa `ownerEmail = barbara.fiche@3ainvestimentos.com.br`; field names batem com a definicao atual. | validar a troca de owner e corrigir o `field.id` duplicado. |
| Assinatura de e-mail; Cartão de visita; Cartão de visita digital | `4` statuses lineares; `ownerEmail` atual = `joao.pompeu@3ainvestimentos.com.br`. | runtime generico por ordem do array; atribuicao manual. | amostra `0080` finalizada usa `ownerEmail = barbara.fiche@3ainvestimentos.com.br`. | validar se o owner atual da definicao deve substituir historico antigo ou se o dado antigo deve ser preservado como snapshot legitimo. |
| Ações Marketing | `5` fields obrigatorios; `4` statuses lineares; sem `action`. | o documento nasce antes da persistencia do `formData`; nao ha rollback automatico da primeira escrita. | amostra `0310` ficou em `solicitacao_aberta` com `formData = {}` e apenas o `history` inicial. | forte indicio de orfao gerado pelo fluxo em duas fases; validar regra para tratamento desse tipo de registro. |
| Evento | `12` fields; `4` statuses lineares; sem `action`. | runtime generico por ordem do array. | amostra `0625` esta em `solicitacao_aberta`, com `formData` consistente com a definicao atual. | sem conflito forte; confirmar se a entrada em `solicitacao_aberta` sem atribuicao imediata e esperada. |
| Revisão de materiais e Apresentações | `3` statuses (`em_aberto -> em_analise -> finalizado`); sem `action`. | runtime usa o primeiro status do array como inicial; neste workflow o inicial e `em_aberto`, nao `solicitacao_aberta`. | amostra `0498` em `em_aberto` esta coerente com a definicao atual. | sem conflito forte na amostra. |
| Solicitação de Patrocínios | `10` fields; `4` statuses lineares; sem `action`. | runtime generico por ordem do array. | amostra `0211` finalizada esta alinhada ao fluxo vigente. | sem conflito forte na amostra. |
| Sugestão 3A RIVA Store | `5` fields; `4` statuses lineares; sem `action`. | runtime generico por ordem do array. | amostra `0410` finalizada esta alinhada ao fluxo vigente. | sem conflito forte na amostra. |

### TI

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| Alteração no E-mail XP | `4` statuses lineares; sem `action`. | runtime generico por ordem do array; atribuicao manual. | amostra `0268` esta em `em_execucao`, coerente com a definicao atual. | sem conflito forte na amostra. |
| Padronização de E-mail  - Código XP | `4` statuses lineares; sem `action` na definicao atual. | runtime atual nao criaria `actionRequests` automaticos para este workflow. | amostra `0298` esta em `ciente_gestao` com `actionRequests` em `ciente_gestao` e `em_execucao`, fora da definicao atual. | legado ativo comprovado; validar qual era a regra historica correta e se ela ainda vale. |
| Problemas de Hardware | `4` statuses lineares; sem `action`. | runtime generico por ordem do array. | amostra `0343` finalizada esta alinhada ao fluxo vigente. | sem conflito forte na amostra. |
| Problemas de Rede | `4` statuses lineares; sem `action`. | runtime generico por ordem do array. | amostra `0138` finalizada esta alinhada ao fluxo vigente. | sem conflito forte na amostra. |
| Problemas de Software | `4` statuses lineares; sem `action`. | runtime generico por ordem do array. | amostra `0076` finalizada esta alinhada ao fluxo vigente. | sem conflito forte na amostra. |
| Reset de Senha | `4` statuses lineares; sem `action`. | runtime generico por ordem do array. | amostra `0190` finalizada esta alinhada ao fluxo vigente. | validar se a ausencia no `workflowOrder` de `TI` e apenas visual ou se gera impacto funcional. |
| Solicitação de Compra - Equipamento | `5` statuses com `status.id = em_execucao` duplicado; sem `action` na definicao atual. | runtime resolve `nextStatus` e `currentStatusDefinition` por `status.id`; com duplicidade, entra em loop/colisao de etapa. | amostra `0192` tem `historyCount = 46`, repetindo `em_execucao` com nota automatica “Aprovação TI / FIN”, inexistente hoje. | conflito estrutural central da etapa: a definicao atual esta inconsistente para o motor atual e a amostra preserva comportamento legado distinto. |
| Solicitação de Compra - Software/Sistema | `3` statuses lineares (`em_analise -> em_aprovacao -> finalizado`); sem `action`. | runtime generico por ordem do array, com status inicial `em_analise`. | amostra `0536` finalizada esta coerente com a definicao atual. | sem conflito forte na amostra. |
| Sugestões 3A RIVA Connect | `4` statuses lineares; sem `action`. | runtime generico por ordem do array. | amostra `0460` finalizada esta alinhada ao fluxo vigente. | sem conflito forte na amostra. |

## 3. Regras globais do motor atual

- A solicitacao nasce com `requestId` sequencial e `status = statuses[0].id`.
- O documento nasce antes da persistencia final do `formData`.
- `ownerEmail` e snapshot da definicao no momento da criacao.
- O proximo status e sempre calculado por ordem do array, sem branching real.
- `assignee` e manual e independente da definicao configurada.
- `actionRequests` sao indexados por `statusId`.
- Entrar num status com `action.approverIds` gera `actionRequests` automaticos.
- Responder uma `action` nao muda `status` automaticamente.
- O Message Center notifica criacao, comentario, mudanca de status e atribuicao, mas nao cobre `actions` no fluxo atual lido.
- “Status final” e reconhecido por heuristica textual, nao por metadata declarativa.

## 4. Inconsistencias estruturais

- `field.id` duplicado em:
  - `Alteração de Cargo / Remuneração / Time ou Equipe` (`email`)
  - `Arte / Material gráfico` (`imagem_referencia`)
  - `Espelhamento - Em lote` (`email_lider`)
- `status.id` duplicado em:
  - `Solicitação de Compra - Equipamento` (`em_execucao`)
  - `Análise Pré-Desligamento (Acesso líderes)` (`em_analise`)
- `Solicitação de Pagamentos ` esta definida sem `fields`.
- `TI` possui `workflowOrder` incompleto em relacao ao total de workflows definidos.
- O runtime usa hardcodes em `pending`, labels finais e side effect de debug local.
- Os dados reais mostram legado ativo com statuses e `actionRequests` nao reproduziveis pela configuracao atual em pelo menos `7` workflows.

## 5. Decisoes que dependem de validacao humana

- Qual e a regra oficial para workflows com legado ativo:
  - apenas honrar o que esta hoje no JSON;
  - ou manter compatibilidade com fluxos historicos que ainda aparecem nos dados.
- `Solicitação de Compra - Equipamento` deve ter duas etapas distintas para aprovação e execução? Se sim, quais `status.id` canonicos devem existir?
- `Análise Pré-Desligamento (Acesso líderes)` deve permanecer com varias etapas de `em_analise` ou precisa de IDs distintos por etapa?
- `Ações Marketing` com `formData` vazio deve ser tratado como erro tecnico, rascunho invalido ou solicitacao valida?
- `Solicitação de Pagamentos ` e um workflow sem formulario interno por desenho de negocio, ou o cadastro atual esta incompleto?
- Os `ownerEmail` divergentes nas amostras devem ser tratados como snapshots historicos legitimos ou como dados a normalizar?

## 6. Fechamento da matriz

- `fato_comprovado`: a matriz cobre `33/33` workflows definidos no export atual.
- `inferencia`: a ambiguidade funcional relevante concentra-se em workflows com legado ativo e definicoes com IDs duplicados.
- `ponto_em_aberto`: enquanto as decisoes da secao 5 nao forem validadas, a Etapa 2 nao deve ser tratada como funcionalmente encerrada sem ressalvas.
