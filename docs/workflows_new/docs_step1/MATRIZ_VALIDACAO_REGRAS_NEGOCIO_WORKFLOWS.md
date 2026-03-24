# Matriz de Validacao das Regras de Negocio dos Workflows

## 1. Base de consolidacao

### Arquivos consultados

- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_A_MAPA_FUNCIONAL_CONFIGURADO.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_B_FLUXO_OPERACIONAL_IMPLEMENTADO.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/ETAPA2_BLOCO_C_CONSOLIDACAO_FUNCIONAL.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowAreas.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflow_samples.json`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/MessagesContext.tsx`

### Fato comprovado

- Esta matriz cobre `33/33` workflows definidos no export atual.
- Os nomes abaixo foram mantidos exatamente como constam nos arquivos de origem.

## 2. Matriz por workflow

### Facilities e Suprimentos

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| `Manutenção / Solicitações Gerais` | `allowedUserIds = all`; fields obrigatorios de identificacao, criticidade, descricao, centro de custo e e-mail; `solicitacao_aberta -> em_analise -> em_andamento -> finalizado`; sem `action`. | Abertura vai para `ownerEmail = stefania.otoni@3ainvestimentos.com.br`; atribuicao manual opcional; avancos por ordem do array; finalizacao e arquivamento separados. | A amostra `0258` percorre o fluxo previsto e termina em `finalizado`, com `assignee`. | Confirmar se atribuicao manual deve continuar como parte da operacao atual. |
| `Solicitação de Compras` | Abertura restrita aos IDs listados; etapa intermediaria `emaprovacao_fin`; sem `action` declarada no cadastro atual. | Owner recebe a abertura; o runtime atual nao criaria `actionRequests` automaticos porque a definicao vigente nao os declara. | A amostra `0053` ainda tem `actionRequests` e `history` fora da definicao atual. | Validar se `Em aprovação - FIN` e apenas etapa manual ou ainda exige aprovacao/ciencia formal. |
| `Solicitação de Suprimentos` | Abertura restrita aos IDs listados; anexo obrigatorio; `solicitacao_aberta -> em_analise -> em_andamento -> finalizado`; sem `action`. | Owner recebe primeiro; depois pode atribuir; fim funcional no status final, mas o item so sai da fila quando arquivado. | A amostra `0261` esta coerente com o fluxo configurado. | Confirmar se fechamento por status + arquivamento manual e o comportamento esperado. |

### Financeiro

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| `Solicitação de Pagamentos ` | Abertura restrita aos IDs listados; `0` `fields`; `em_analise -> etapa_2 -> finalizado`. | O runtime aceita abrir mesmo sem `formData`, porque o documento nasce antes da persistencia do formulario. | A amostra `0637` esta em `em_analise` com `formData = {}`. | Validar se o processo depende de formulario externo ou se o cadastro atual esta incompleto. |

### Gente e Comunicação

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| `Alteração Cadastral` | `allowedUserIds = all`; formulario amplo de dados cadastrais; fluxo linear ate `finalizado`; sem `action`. | Owner recebe a abertura; atribuicao manual opcional; sem branching. | A amostra `0542` esta alinhada ao fluxo atual e usa apenas campos obrigatorios + opcionais relevantes. | Confirmar se o fluxo pode continuar totalmente linear. |
| `Alteração de Cargo / Remuneração / Time ou Equipe` | Formulario com dados do lider e do colaborador; `field.id = email` duplicado; fluxo linear ate `finalizado`. | IDs de campo duplicados se sobrepoem na gravacao do `formData`; owner recebe a abertura e alguem move manualmente as etapas. | A amostra `0421` esta `finalizado`, mas nao elimina a ambiguidade entre os dois e-mails. | Validar quais dois campos de e-mail devem existir no estado vigente. |
| `Análise Pré-Desligamento (Acesso líderes)` | Fluxo multi-area com BI, Financeiro, Jurídico e Governança; `6` etapas com `status.id = em_analise`; varias `actions` de `execution` e uma de `acknowledgement`. | O runtime encontra etapa por `status.id`; com IDs repetidos, perde a distincao entre as fases internas. | A amostra `0663` so mostra o estado inicial `em_analise`, sem provar o percurso completo. | Validar a ordem canonica do fluxo ativo e os IDs corretos de cada etapa. |
| `Cadastro de Novos Entrantes - Demais Áreas ` | Fluxo atual declarado: `Solicitação Aberta -> Enviado ao TIME de Gente -> Criar acessos/equipamentos - TI -> Finalizado`; `action` de ciencia em `acessos_ti`. | Abertura vai para Gente; TI entra por `acknowledgement`; depois alguem precisa mover manualmente para o fim. | A amostra `0238` ainda registra `ciente_fin` e `cadastro_plataformas`, fora da definicao atual. | Validar se o fluxo oficial atual e apenas `Gente -> TI` ou se existem checkpoints extras que precisam voltar ao cadastro. |
| `Cadastro de Novos Entrantes - Associado` | Fluxo atual declarado: `Em aberto -> Enviado ao TIME de Gente -> Enviado ao TI (Acessos) -> Enviado ao Jurídico -> Finalizado`; `actions` em TI e Jurídico. | Abertura vai para Gente; TI e Jurídico podem dar ciencia; o fluxo continua manual entre as etapas. | A amostra `0375` usa `enviar_financeiro`, inexistente hoje. | Validar se Financeiro ainda faz parte do fluxo oficial de associados. |
| `Comprovação ANCORD` | Fluxo atual linear `Solicitação Aberta -> Em análise -> Análise - Jurídico -> Análise - Gestão -> Finalizada`; sem `action`. | Owner recebe a abertura; eventuais handoffs sao manuais, porque o runtime atual nao criaria `actionRequests` aqui. | A amostra `0216` ainda registra `actionRequests` em `em_analise`, `analise_juridico` e `analise_gestao`. | Validar se Jurídico e Gestão ainda precisam responder checkpoints formais. |
| `Fale com a GENTE` | `allowedUserIds = all`; formulario simples; fluxo linear ate `finalizado`. | Owner recebe, pode atribuir, e alguem move manualmente as etapas. | A amostra `0169` esta alinhada ao fluxo atual. | Sem conflito forte; confirmar apenas a operacao por owner + assignee manual. |
| `Serviços de Plano de Saúde ` | `allowedUserIds = all`; fluxo curto `solicitacao_aberta -> em_analise -> finalizado`; sem `action`. | Finalizacao e separada de arquivamento; sem branching. | A amostra `0061` esta alinhada ao fluxo atual. | Confirmar se o fluxo deve continuar sem checkpoint adicional. |
| `Solicitação Desligamento - Demais áreas (Não comerciais)` | Fluxo multi-area com `approval` em `em_andamento` e `acknowledgement` em Gente, TI, BI e ADM. | O runtime cria `actionRequests` nos statuses configurados, mas nao avanca nem bloqueia automaticamente; alguem precisa mover cada etapa. | A amostra `0242` esta alinhada ao desenho atual e confirma os checkpoints configurados. | Validar se os checkpoints devem continuar apenas registrando resposta, sem transicao automatica. |
| `Solicitação de Abertura de Vaga` | Fluxo linear `solicitacao_aberta -> em_analise -> em_execucao -> finalizado`; sem `action` no cadastro atual. | Owner recebe primeiro; eventuais handoffs sao manuais. | A amostra `0021` ainda registra checkpoint em `em_execucao` nao previsto hoje. | Validar se ainda existe ciencia formal em `em_execucao` ou se o fluxo atual e realmente linear. |
| `Solicitação de Férias / Ausência / Compensação de horas` | Fluxo linear com `acknowledgement` em `em_execucao` para `DFA`. | O runtime cria a ciencia em `em_execucao`, mas nao muda o status apos a resposta; alguem move manualmente para `finalizado`. | A amostra `0187` confirma esse comportamento. | Confirmar se a ciencia de Gente em `em_execucao` deve permanecer. |

### Governança

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| `Espelhamento - Caso Único ` | Workflow de `Governança`, mas com `ownerEmail = ti@3ariva.com.br`; fluxo linear; sem `action`. | Abertura vai para TI; depois pode haver atribuicao manual. | A amostra `0474` usa `ownerEmail` diferente do cadastro atual. | Validar quem e o owner funcional vigente do fluxo. |
| `Espelhamento - Em lote` | Workflow de `Governança`, com `ownerEmail = ti@3ariva.com.br`; `field.id = email_lider` duplicado; fluxo linear. | Campos duplicados se sobrepoem na persistencia; upload falho grava `_uploadErrors` no `formData`. | A amostra `0573` confirma `_uploadErrors` e nao elimina a ambiguidade entre os dois `email_lider`. | Validar quais e-mails o formulario precisa coletar hoje e se `_uploadErrors` deve ser ignorado pela area. |

### Marketing

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| `Arte / Material gráfico` | Briefing completo; `field.id = imagem_referencia` duplicado; owner atual cadastrado em `joao.pompeu@3ainvestimentos.com.br`. | IDs de campo duplicados se sobrepoem; abertura vai para o owner atual da definicao. | A amostra `0075` terminou com `ownerEmail = barbara.fiche@3ainvestimentos.com.br`. | Validar owner vigente e se ha um ou dois campos de referencia no formulario atual. |
| `Assinatura de e-mail; Cartão de visita; Cartão de visita digital` | Fluxo linear sem `action`; owner atual cadastrado em `joao.pompeu@3ainvestimentos.com.br`. | Owner recebe a abertura; depois pode atribuir; fim por status final + arquivamento manual. | A amostra `0080` usa owner anterior. | Validar owner vigente da operacao atual. |
| `Ações Marketing` | `5` fields obrigatorios; fluxo linear sem `action`. | O documento nasce antes de o `formData` ser salvo; nao ha rollback automatico da criacao. | A amostra `0310` ficou em `solicitacao_aberta` com `formData = {}`. | Validar como a area trata solicitacoes abertas sem formulario. |
| `Evento` | Fluxo linear com `12` fields obrigatorios; sem `action`. | Owner recebe a abertura; depois pode atribuir. | A amostra `0625` esta coerente com o cadastro atual. | Confirmar apenas o handoff atual `owner -> assignee manual`. |
| `Revisão de materiais e Apresentações` | Fluxo `em_aberto -> em_analise -> finalizado`; sem `action`. | O runtime aceita `em_aberto` como status inicial porque sempre usa o primeiro status da definicao. | A amostra `0498` esta coerente com o cadastro atual. | Confirmar se `Em aberto` deve permanecer como status inicial canonico. |
| `Solicitação de Patrocínios` | Fluxo linear com briefing completo; sem `action`. | Owner recebe e pode atribuir; fim manual por status final + arquivamento. | A amostra `0211` esta alinhada ao fluxo atual. | Sem conflito forte na amostra. |
| `Sugestão 3A RIVA Store` | Fluxo linear; sem `action`; owner em `barbara.fiche@3ainvestimentos.com.br`. | Owner recebe primeiro; atribuicao e opcional. | A amostra `0410` esta alinhada ao fluxo atual. | Sem conflito forte na amostra. |

### TI

| workflow | regra configurada | regra implementada | comportamento observado | validacao/duvida |
| --- | --- | --- | --- | --- |
| `Alteração no E-mail XP` | Fluxo linear `solicitacao_aberta -> em_analise -> em_execucao -> finalizado`; sem `action`. | Owner TI recebe; depois pode atribuir; sem branching. | A amostra `0268` esta alinhada ao fluxo atual. | Sem conflito forte na amostra. |
| `Padronização de E-mail  - Código XP` | Fluxo linear no cadastro atual; sem `action`. | O runtime atual nao criaria checkpoint de gestao aqui. | A amostra `0298` ainda usa `ciente_gestao` e `actionRequests` fora da definicao vigente. | Validar se Gestao ainda participa do fluxo oficial. |
| `Problemas de Hardware` | Fluxo linear sem `action`. | Owner TI recebe; atribuicao e opcional. | A amostra `0343` esta alinhada ao fluxo atual. | Sem conflito forte na amostra. |
| `Problemas de Rede` | Fluxo linear sem `action`. | Owner TI recebe; atribuicao e opcional. | A amostra `0138` esta alinhada ao fluxo atual. | Sem conflito forte na amostra. |
| `Problemas de Software` | Fluxo linear sem `action`. | Owner TI recebe; atribuicao e opcional. | A amostra `0076` esta alinhada ao fluxo atual. | Sem conflito forte na amostra. |
| `Reset de Senha` | Fluxo linear sem `action`; workflow ativo da area TI. | Owner TI recebe; a operacao depende de owner + assignee manual. | A amostra `0190` esta alinhada ao fluxo atual, mas o workflow nao aparece no `workflowOrder` da area. | Validar se ele deve continuar como workflow visivel principal de TI. |
| `Solicitação de Compra - Equipamento` | O cadastro pretende separar `Em aprovação` e `Em execução`, mas usa `status.id = em_execucao` nas duas etapas; sem `action`. | O runtime atual nao consegue distinguir essas duas fases porque busca por `status.id`. | A amostra `0192` repete `em_execucao` varias vezes e registra aprovacao nao descrita no cadastro atual. | Validar a regra canonica atual de aprovacao e execucao do workflow. |
| `Solicitação de Compra - Software/Sistema` | Fluxo `em_analise -> em_aprovacao -> finalizado`; sem `action`; nasce direto em `Em Análise`. | Owner TI recebe; depois pode atribuir; sem branching. | A amostra `0536` esta alinhada ao fluxo atual. | Confirmar se o fluxo deve continuar iniciando em `Em Análise`. |
| `Sugestões 3A RIVA Connect` | Fluxo linear com owner em `matheus@3ainvestimentos.com.br`. | Owner recebe primeiro; depois pode atribuir. | A amostra `0460` esta alinhada ao fluxo atual. | Confirmar owner vigente e operacao por atribuicao manual. |

## 3. Regras globais do motor atual

- A solicitacao nasce com `requestId` sequencial e `status = statuses[0].id`.
- O documento nasce antes da persistencia final do `formData`.
- `ownerEmail` e snapshot da definicao no momento da criacao.
- O proximo status e sempre calculado por ordem do array.
- `assignee` e manual e independe da definicao configurada.
- `actionRequests` ficam indexados por `statusId`.
- Entrar num status com `action.approverIds` gera `actionRequests` automaticos.
- Responder `action` nao muda `status` automaticamente.
- O Message Center do Connect cobre criacao, comentario, status e atribuicao, mas nao cobre `actions` no fluxo atual lido.
- Finalizacao e heuristica textual; arquivamento e manual.

## 4. Handoffs recorrentes entre areas e papeis

- `Solicitante -> ownerEmail`: padrao de abertura de todos os workflows.
- `Owner -> assignee`: handoff manual recorrente para execucao operacional.
- `Owner/assignee -> action recipients`: ocorre apenas em statuses com `action`.
- `Cadastro de Novos Entrantes - Demais Áreas  : Gente -> TI`.
- `Cadastro de Novos Entrantes - Associado : Gente -> TI -> Jurídico`.
- `Solicitação Desligamento - Demais áreas (Não comerciais) : Gente -> Gente -> TI/FIN -> BI/Gestão -> ADM`.
- `Análise Pré-Desligamento (Acesso líderes) : líder/owner -> BI -> Financeiro -> Jurídico -> Governança`.

## 5. Inconsistencias estruturais que afetam o fluxo atual

- `status.id` duplicado em:
  - `Solicitação de Compra - Equipamento` (`em_execucao`)
  - `Análise Pré-Desligamento (Acesso líderes)` (`em_analise`)
- `field.id` duplicado em:
  - `Alteração de Cargo / Remuneração / Time ou Equipe` (`email`)
  - `Arte / Material gráfico` (`imagem_referencia`)
  - `Espelhamento - Em lote` (`email_lider`)
- `Solicitação de Pagamentos ` esta definida sem `fields`.
- `Reset de Senha` nao aparece no `workflowOrder` da area TI.
- Os samples de `Padronização de E-mail  - Código XP`, `Solicitação de Compras`, `Cadastro de Novos Entrantes - Associado`, `Cadastro de Novos Entrantes - Demais Áreas `, `Comprovação ANCORD` e `Solicitação de Abertura de Vaga` nao validam integralmente o fluxo cadastrado hoje porque ainda exibem etapas ou checkpoints fora da definicao vigente.
- A criacao em duas fases produz risco real de workflow aberto sem `formData`, como visto em `Ações Marketing`.

## 6. Decisoes que dependem de validacao humana

- `Solicitação de Compra - Equipamento`: existem duas etapas distintas no fluxo atual, uma de aprovacao e outra de execucao?
- `Análise Pré-Desligamento (Acesso líderes)`: qual e a ordem canonica ativa das analises BI, Financeiro, Jurídico e Governança?
- `Solicitação de Pagamentos `: quais informacoes entram hoje e por onde entram?
- `Ações Marketing`: como tratar workflow criado sem formulario?
- `Cadastro de Novos Entrantes - Associado`: Financeiro ainda faz parte do fluxo oficial?
- `Cadastro de Novos Entrantes - Demais Áreas `: Financeiro e plataformas ainda fazem parte do fluxo oficial?
- `Comprovação ANCORD`: Jurídico e Gestão ainda precisam responder checkpoints formais?
- `Solicitação de Abertura de Vaga`: ainda existe ciencia formal em `em_execucao`?
- `Padronização de E-mail  - Código XP`: Gestao ainda participa do fluxo oficial?
- `Assinatura de e-mail; Cartão de visita; Cartão de visita digital`, `Arte / Material gráfico` e `Espelhamento - Caso Único `: qual e o owner funcional vigente de cada workflow?

## 7. Fechamento da matriz

- `fato comprovado`: a matriz cobre `33/33` workflows definidos hoje.
- `inferencia`: a maior parte dos workflows ativos ja pode ser validada com as areas a partir desta matriz, mas alguns ainda dependem de decisao explicita sobre ownership, checkpoints e etapas canonicas.
- `ponto em aberto`: a Etapa 2 so pode ser tratada como funcionalmente concluida depois que as decisoes da secao 6 forem validadas com as areas responsaveis.
