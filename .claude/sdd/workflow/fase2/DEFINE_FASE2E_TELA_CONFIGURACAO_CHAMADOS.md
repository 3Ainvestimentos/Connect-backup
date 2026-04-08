# DEFINE: Fase 2E - Tela de Configuracao de Chamados

> Generated: 2026-04-08
> Status: Approved for design
> Scope: Fase 2 / 2E - nova tela admin para configuracao de chamados no modelo `workflowTypes_v2`
> Base document: `BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`

## 1. Problem Statement

A plataforma ja possui runtime, leitura e seeds consolidados para chamados em `workflowTypes_v2`, mas ainda nao existe uma superficie administrativa dedicada para criar, versionar, publicar e consultar configuracoes desse modelo novo com governanca separada da tela legada de workflows.

---

## 2. Users

### 2.1. Admin de configuracao de chamados v2

Pain points:

- hoje nao existe tela oficial para criar area, tipo ou nova versao no modelo `workflowTypes_v2`;
- a tela legada em `/admin/workflows` continua orientada ao modelo antigo e nao oferece governanca adequada para versionamento publicado/rascunho/inativo;
- sem uma rota dedicada, qualquer rollout do modelo novo fica dependente de seeds ou operacao tecnica manual.

### 2.2. Operacao / owners de workflow

Pain points:

- owners precisam visualizar rapidamente a hierarquia area > tipo > versao para entender o estado configurado de cada chamado;
- publicar ajustes sem clonar da ultima versao publicada aumenta risco de divergencia e retrabalho;
- a ausencia de validacoes administrativas no momento da edicao pode propagar configuracoes invalidas para o runtime.

### 2.3. Super admin / governanca de acesso

Pain points:

- a permissao atual `canManageWorkflows` nao diferencia o painel legado da nova superficie administrativa do modelo v2;
- o rollout da 2E pede gate separado para homologacao controlada e liberacao gradual;
- a navegacao atual no menu admin ainda nao explicita uma entrada propria para a nova tela.

### 2.4. Auditoria / consulta operacional

Pain points:

- o historico global precisa continuar disponivel como consulta e auditoria, sem misturar operacoes destrutivas na mesma superficie;
- a visao de historico ainda precisa considerar convivio entre legado e v2, ao menos por compatibilidade progressiva;
- a equipe precisa de uma leitura clara da origem e do status das solicitacoes sem reabrir escopo do runtime.

---

## 3. Goals

### MUST

- criar uma nova rota admin dedicada a configuracao de chamados v2, separada da rota legada `/admin/workflows`;
- introduzir uma permissao dedicada para a nova tela, recomendada como `canManageWorkflowsV2`, sem substituir o gate atual `canManageWorkflows`;
- entregar uma subtab `Definicoes` que opere somente sobre o modelo novo:
  - `workflowTypes_v2/{workflowTypeId}`
  - `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- entregar uma subtab `Historico Geral` em modo somente leitura, voltada a consulta e auditoria;
- suportar a hierarquia administrativa principal:
  - area
  - workflow type
  - versao
- exigir que a criacao de um novo workflow type receba metadados iniciais obrigatorios do usuario, incluindo pelo menos:
  - area
  - nome exibido do workflow
  - descricao inicial
  - owner
  - `allowedUserIds`
- gerar `workflowTypeId` automaticamente na criacao a partir de identificadores estaveis de area + nome informado, sem permitir edicao manual posterior;
- ao criar um novo workflow type, criar tambem uma `version = 1` em estado `draft`, com esqueleto inicial editavel;
- tratar `Inativa` como estado derivado de UI para versao ja publicada que nao e a ativa atual, sem introduzir um novo estado persistido no schema nesta primeira iteracao;
- permitir criar nova versao somente como `Rascunho`, clonada a partir da ultima versao publicada do tipo;
- garantir a regra de produto de que sempre exista exatamente uma versao ativa/publicada por workflow type;
- permitir publicar um rascunho ou ativar uma versao inativa com inativacao automatica da versao antes ativa;
- impedir na UX e no backend administrativo a manipulacao manual de ids internos de tipo, versao ou etapa;
- exigir validacoes minimas de integridade no editor antes de salvar configuracao que possa alimentar o runtime.

### SHOULD

- permitir criar area e editar apenas seus metadados visuais, evitando exclusao livre na primeira iteracao;
- permitir criar workflow type e visualizar seu resumo/configuracao geral sem expor operacoes destrutivas em tipos ja utilizados;
- permitir excluir apenas versoes `Rascunho` que nunca foram publicadas;
- manter o `Historico Geral` com filtros de area, tipo, status, owner, origem e periodo;
- sinalizar a origem dos itens no historico com badge ou atributo equivalente:
  - `Legado`
  - `V2`
- estruturar a UX principal como catalogo hierarquico com visualizacao leve e edicao em superficie dedicada, sem transformar a listagem em editor monolitico.

### COULD

- oferecer visualizacao resumida de campos e etapas por versao diretamente na listagem;
- permitir compatibilidade progressiva do `Historico Geral` com legado, desde que `V2` seja suportado desde o primeiro corte;
- incluir flag de disponibilidade do tipo/versao no editor, se isso nao conflitar com a regra de sempre haver uma publicada.

### WON'T

- nao substituir nem reescrever a tela legada `/admin/workflows` nesta fase;
- nao permitir editar workflows legados pela nova superficie;
- nao abrir escopo para migracao automatica de legado via UI;
- nao expor exclusao irrestrita de area, tipo ou versao publicada/inativa;
- nao redesenhar o runtime de `requestAction` / `respondAction`;
- nao criar um builder generico para schemas futuros fora do dominio de chamados v2.

---

## 4. Success Criteria

- existe uma rota admin nova, separada da legada, acessivel somente para usuarios com a nova permissao de configuracao v2;
- a secao `Definicoes` consegue listar configuracoes por area, tipo e versao sem depender do modelo legado;
- ao criar nova versao, o sistema gera um rascunho clonado da ultima publicada, com `versionId` sequencial e nao editavel;
- ao publicar ou ativar uma versao, o sistema troca automaticamente a antiga versao ativa para `Inativa`, mantendo apenas uma publicada por tipo;
- o editor impede persistencia de configuracoes invalidas para o runtime, incluindo pelo menos:
  - etapa action sem `approverIds`
  - `approverIds` duplicados
  - ausencia de etapa inicial
  - ausencia de etapa final
  - owner invalido
  - campo `select` sem opcoes
- o editor permite `Salvar rascunho` com configuracao incompleta, mas so permite `Publicar` quando a versao estiver valida para o runtime;
- o editor inclui `allowedUserIds` como parte da configuracao administravel, com UX simples:
  - `Todos`
  - `Lista especifica`
- o `Historico Geral` e somente leitura e nao oferece acao administrativa na primeira versao;
- o `Historico Geral` nasce no primeiro corte com grid unificado para itens `Legado` e `V2`, com suporte completo garantido para `V2`;
- a nova tela convive com a tela legada sem regressao de permissao ou navegacao para quem ainda usa `canManageWorkflows`;
- a definicao resultante fica clara o suficiente para seguir a design sem depender de decisoes de produto em aberto.

### Clarity Score

`14/15`

Motivo:

- a direcao de produto ja foi suficientemente convergida no brainstorm;
- o recorte entre nova tela, permissao propria e convivencia com legado esta claro;
- permanecem abertas apenas decisoes de detalhamento de design, nao de objetivo ou de escopo funcional.

---

## 5. Technical Scope

### Frontend

- nova rota admin para configuracao dos chamados v2, separada de [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/admin/workflows/page.tsx);
- adicao de item proprio no menu administrativo hoje montado em [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx);
- nova superficie com duas subtabs:
  - `Definicoes`
  - `Historico Geral`
- editor de versao em superficie dedicada, com espaco para:
  - configuracao geral
  - controle de `allowedUserIds`
  - campos do formulario
  - etapas
  - configuracao de `action`
- nomenclatura de acoes de versao orientada a produto:
  - `Salvar rascunho`
  - `Publicar`
  - `Ativar`
- preservacao da tela legada e de seus componentes existentes, como [WorkflowDefinitionsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/WorkflowDefinitionsTab.tsx) e [ManageWorkflowAreas.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/ManageWorkflowAreas.tsx), sem retrofit desta fase.

### Backend / Management

- nova camada de leitura e escrita administrativa para:
  - criar area
  - criar workflow type
  - criar rascunho por clonagem
  - atualizar rascunho
  - publicar/ativar versao
  - consultar catalogo hierarquico e historico read-only
- garantias transacionais ou equivalentes para troca atomica da versao ativa/publicada por workflow type;
- garantias transacionais ou equivalentes para gerar `versionId` sequencial e nao editavel;
- protecoes para impedir:
  - edicao direta de ids internos
  - multiplicidade de versoes publicadas
  - publicacao de configuracao invalida para o runtime.

### Database / Firestore

- leitura e escrita no modelo novo:
  - `workflowTypes_v2/{workflowTypeId}`
  - `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- manutencao do schema persistido de versao com estados base `draft | published`, tratando `Inativa` como classificacao derivada da UI;
- uso de `workflowAreas` como colecao propria e fonte de agrupamento visual, sem reabrir o shape legado de definicoes;
- `storageFolderPath` continua sendo persistido em `workflowAreas`, mas oculto da UI da `2E`;
- atualizacao coerente do documento raiz do tipo para refletir a versao ativa/publicada;
- nenhum backfill obrigatorio de dados legados como precondicao para liberar a `2E`.

### Runtime

- a `2E` deve respeitar o contrato operacional que o runtime ja consome de `workflowTypes_v2` e `versions/{version}`;
- validacoes do editor precisam impedir persistencia de estados que quebrem leitura ou execucao no runtime atual;
- nao faz parte desta fase alterar semantica de execucao, atribuicao, action ou historico de requests.

### Auth / Navigation

- extensao do modelo de permissao de colaboradores hoje definido em [CollaboratorsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/CollaboratorsContext.tsx);
- extensao da tela de administracao de permissoes hoje montada em [PermissionsPageContent.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/PermissionsPageContent.tsx);
- convivencia explicita entre:
  - `canManageWorkflows`
  - `canManageWorkflowsV2`

### AI

- fora do escopo.

### Testing

- testes de permissao e navegacao da nova rota admin;
- testes de regras de versionamento:
  - criar tipo novo com documento raiz + `v1 draft`
  - criar rascunho a partir da ultima publicada
  - publicar rascunho inativando a publicada anterior
  - ativar versao inativa substituindo a ativa atual
- testes de validacao do editor e do backend administrativo para configuracoes invalidas;
- testes do `Historico Geral` em modo read-only, incluindo grid unificado `Legado` + `V2`;
- testes de convivencia com a tela legada e com o gate atual.

---

## 6. Auth Requirements

- a nova tela deve ser protegida por permissao propria, recomendada como `canManageWorkflowsV2`;
- possuir `canManageWorkflows` nao concede automaticamente acesso a configuracao v2, salvo decisao explicita de rollout fora deste define;
- a tela legada `/admin/workflows` permanece protegida pelo gate atual `canManageWorkflows`;
- a nova permissao precisa respeitar o isolamento por usuario autenticado ja adotado na plataforma;
- operacoes administrativas de criacao, edicao e publicacao nao podem depender apenas de bloqueio visual; precisam ser validadas pela camada administrativa correspondente.

---

## 7. Out of Scope

- edicao ou migracao de workflows legados na nova UI;
- analytics avancados dentro da mesma tela administrativa;
- exclusao irrestrita de entidades ja publicadas ou com historico operacional;
- automacao de rollback de versoes publicada via UI;
- remodelagem de `applications`, `requests` ou `me/tasks`;
- revisao do schema base de requests ja abertas em `workflows_v2`.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md` | Internal | Ready |
| Modelo publicado em `workflowTypes_v2` e `versions/{n}` consolidado pelas fases `2A` a `2D` | Internal | Ready |
| Tela legada existente em `/admin/workflows` | Internal | Ready |
| Estrutura atual de permissoes de colaboradores | Internal | Ready |
| Decisao de rollout com permissao nova separada da legada | Product | Closed |

---

## 9. Open Product Decisions

- definir o slug final da nova rota admin:
  - exemplo candidato: `/admin/request-config`
- decidir se a criacao de workflow type ocorre na listagem principal ou em fluxo dedicado;
- decidir se a flag de disponibilidade entra ja na `2E` ou fica para iteracao futura.

As decisoes acima nao bloqueiam o design tecnico, mas precisam ser fechadas durante a proxima etapa.

---

## 10. Next Step

Ready for `/design FASE2E_TELA_CONFIGURACAO_CHAMADOS` para fechar:

- rota final, arquitetura de paginas e composicao das subtabs;
- contratos de leitura e escrita administrativa para areas, tipos e versoes;
- shape do editor de versao e suas validacoes;
- estrategia de publicacao/ativacao atomica no Firestore;
- estrategia de compatibilidade do `Historico Geral` com legado e `V2`;
- plano de testes de UI, permissao e integridade de configuracao.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-08 | codex | Initial define for Fase 2E covering new admin route, separate permission, hierarchical catalog, versioning rules, editor scope and read-only history |
| 1.1 | 2026-04-08 | codex | Closed creation flow for new workflow types, draft save/publication semantics, unified legacy+V2 history grid, stable workflowTypeId generation, transactional sequential versioning, and hidden persistence of storageFolderPath |
