# Diagrams Index

## Precedencia aplicada

Para esta pasta, a precedencia usada foi a definida na task:

1. o artefato individual mais especifico do assunto prevalece;
2. `WORKFLOWS_PRE_BUILD_OFICIAL.md` foi usado apenas como sintese e amarracao;
3. as regras criticas explicitadas na task prevalecem sobre ambiguidades dos artefatos.

## Arquivos gerados

| arquivo | objetivo | fontes principais |
| --- | --- | --- |
| `01-firestore-collections-erd.mmd` | mapear colecoes, subcolecao `versions` e relacoes entre tipo, versao, runtime e contador | `ARQUITETURA_WORKFLOWS_VERSIONADOS.md`, `DESIGN_READ_MODEL_WORKFLOWS.md`, `RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md` |
| `02-workflows-document-map.mmd` | mostrar como os artefatos individuais alimentam a sintese e cada diagrama desta pasta | os 7 artefatos de `docs_step2` |
| `03-status-category-state-machine.mmd` | representar as transicoes persistidas de `statusCategory` e as semanticas de fechamento | `DESIGN_TECNICO_RUNTIME_WORKFLOWS.md`, `DESIGN_READ_MODEL_WORKFLOWS.md`, `MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md`, `RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md` |
| `04-request-end-to-end-sequence.mmd` | resumir o fluxo ponta a ponta de abertura, atribuicao, acao, resposta, avancar/finalizar e arquivar | `DESIGN_TECNICO_RUNTIME_WORKFLOWS.md`, `REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md` |
| `05-advance-vs-finalize-flow.mmd` | separar a decisao entre `advance` e `finalize` com base em pendencias e tipo da proxima etapa | `DESIGN_TECNICO_RUNTIME_WORKFLOWS.md`, `WORKFLOWS_PRE_BUILD_OFICIAL.md` |
| `06-runtime-layers.mmd` | mostrar camadas do runtime, responsabilidades e colecoes tocadas | `DESIGN_TECNICO_RUNTIME_WORKFLOWS.md` |
| `07-queries-and-indexes.mmd` | consolidar queries, agrupamentos mensais e indices compostos do MVP | `DESIGN_READ_MODEL_WORKFLOWS.md`, `RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md` |

## Divergencias registradas

| assunto | divergencia encontrada | documento que prevaleceu | justificativa | impacto nos diagramas |
| --- | --- | --- | --- | --- |
| Regra de precedencia entre documentos | `WORKFLOWS_PRE_BUILD_OFICIAL.md` declara que ele prevalece sobre artefatos anteriores, mas a task pede usar o oficial apenas como sintese e dar prioridade ao artefato individual mais especifico | task atual | a instrucao explicita do usuario para esta entrega e mais especifica do que a regra interna do documento oficial | todos os diagramas foram ancorados primeiro nos artefatos individuais |
| `pendingActionCount` no read model | `DESIGN_READ_MODEL_WORKFLOWS.md` e `MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md` ainda citam `pendingActionCount`, enquanto a revision history do oficial registra sua remocao e a task diz que ele nao faz parte do read model do MVP | task atual, validada por `WORKFLOWS_PRE_BUILD_OFICIAL.md` | a task trouxe uma regra critica explicita para o MVP | `pendingActionCount` foi omitido do ERD, do state machine e do diagrama de queries/indexes |
| `statusCategory == open && hasResponsible == true` | `MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md` e o oficial ainda mapeiam esse caso para label de UI, mas `DESIGN_TECNICO_RUNTIME_WORKFLOWS.md` e `DESIGN_READ_MODEL_WORKFLOWS.md` definem que a atribuicao move o chamado para `in_progress` | `DESIGN_TECNICO_RUNTIME_WORKFLOWS.md` e `DESIGN_READ_MODEL_WORKFLOWS.md` | transicao de estado e atualizacao de read model sao assuntos mais especificos que o mapeamento visual | o diagrama `03-status-category-state-machine.mmd` nao cria um estado persistido `open+responsible`; a atribuicao leva a `in_progress` |
| `ownerUserId` em `workflowTypes` | `ARQUITETURA_WORKFLOWS_VERSIONADOS.md` lista `ownerEmail` no schema de `workflowTypes`, mas `RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md` usa `workflowTypes.ownerUserId` como fonte de verdade para ownership e o read model depende dele | `RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md` | o artefato de pendencias fechadas e mais especifico sobre semantica de ownership operacional | o ERD inclui `ownerUserId` em `workflowTypes` e em `workflows` |

## Notas

- `versions` foi modelada como subcolecao de `workflowTypes/{workflowTypeId}` em todos os diagramas aplicaveis.
- `closedAt` foi tratado como data de finalizacao, nunca como data de arquivamento.
- `closedMonthKey` e `submittedMonthKey` foram fixados em formato `YYYY-MM`.
- `04-request-end-to-end-sequence.mmd` ficou abaixo do limite de 30 linhas, entao nao foi necessario dividir em `04a` e `04b`.
