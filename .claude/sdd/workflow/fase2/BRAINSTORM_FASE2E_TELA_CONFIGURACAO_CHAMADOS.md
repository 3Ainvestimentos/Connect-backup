# BRAINSTORM: Fase 2E - Tela de configuracao dos chamados

> Generated: 2026-04-08
> Status: Exploracao concluida
> Scope: Definir a direcao da Fase 2E para criar uma nova tela admin de configuracao de chamados no modelo `workflowTypes_v2`

## 1. Contexto

As fases `2A` a `2D` consolidaram a superficie oficial de gestao e o runtime versionado de chamados:

- entrada oficial e gestao em `v2`;
- seeds publicados em `workflowTypes_v2` e `versions/{n}`;
- suporte operacional a `requestAction` / `respondAction`;
- historico e leitura ricos no detalhe do chamado.

A lacuna agora nao e mais de runtime nem de seed. A lacuna da `2E` e **administrativa**:

- criar e gerenciar areas de chamados no modelo novo;
- visualizar `workflowTypes_v2` por area;
- versionar configuracoes com rascunho / publicada / inativa;
- publicar novas versoes sem recriar tudo do zero;
- expor isso em uma **nova rota admin**, sem editar a tela antiga de workflows.

O codigo atual confirma alguns pontos relevantes:

- a tela antiga de workflows continua baseada em componentes legados como [WorkflowDefinitionsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/WorkflowDefinitionsTab.tsx) e [ManageWorkflowAreas.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/ManageWorkflowAreas.tsx);
- a permissao existente e `canManageWorkflows`, em [CollaboratorsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/CollaboratorsContext.tsx) e [PermissionsPageContent.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/PermissionsPageContent.tsx);
- o menu admin atual ja expoe `Workflows` no dropdown do usuario, em [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx).

Ao mesmo tempo, como a `2E` passa a permitir criacao, versionamento e publicacao no modelo novo, a governanca da nova tela pede um gate separado da tela legada.

## 2. Perguntas respondidas

### 2.1. Quem usa a nova tela?

Na primeira versao da `2E`, a tela nova deve ter **permissao propria**, separada da tela legada.

Direcao recomendada:

- criar uma nova permissao, por exemplo:
  - `canManageWorkflowsV2`
- manter a tela antiga no gate atual:
  - `canManageWorkflows`

Motivo:

- a tela nova nao e apenas consulta;
- ela permite criar area, criar tipo, criar rascunho, editar versao e publicar;
- isso e sensivelmente mais forte do que o gate legado comunica hoje.

### 2.2. O escopo de edicao cobre legado?

Nao.

Na aba de `Definicoes`, a `2E` deve operar **somente no modelo novo**:

- `workflowTypes_v2`
- `versions/{n}`

Os tipos legados nao precisam nem ser exibidos nessa superficie.

### 2.3. Como fica a aba `Historico Geral`?

A aba `Historico Geral` deve ser **somente leitura**, com foco em:

- consulta;
- auditoria;
- compatibilidade com chamados legados e novos, se viavel.

Nao deve haver operacoes administrativas nela na primeira iteracao.

## 3. Entendimento consolidado

A `2E` deve entregar uma nova tela/rota admin, no mesmo ecossistema da secao de workflows do usuario, com estas propriedades:

- rota nova, sem editar a tela antiga;
- permissao nova e separada da tela legada, recomendada como `canManageWorkflowsV2`;
- duas subtabs:
  - `Definicoes`
  - `Historico Geral`
- `Definicoes` opera apenas sobre `workflowTypes_v2`;
- `Historico Geral` tenta unificar leitura de legado + novo, em modo consulta;
- a hierarquia visual principal e:
  - Area
  - Workflow Type
  - Versoes
- cada versao carrega status de UI:
  - `Rascunho`
  - `Publicada`
  - `Inativa`
- sempre deve existir **uma versao ativa/publicada por tipo**;
- criar nova versao deve clonar a ultima publicada;
- o usuario edita labels e configuracoes visiveis, mas **nao manipula ids internos**.

## 4. Abordagens

### Abordagem A. Tudo inline dentro da sanfona

Construir a nova pagina inteira como uma arvore editavel inline:

- area expande;
- tipo expande;
- versao expande;
- e os formularios de campos/etapas aparecem dentro da propria tabela.

#### Vantagens

- experiencia visual muito proxima do que voce imaginou inicialmente;
- menos navegacao entre telas;
- rapida para casos pequenos.

#### Desvantagens

- tende a virar uma pagina monolitica e fragil;
- editar campos + etapas + actions inline rapidamente fica confuso;
- estado local fica complexo;
- risco alto de regressao de UX e de manutencao.

#### Veredito

Nao recomendado para a primeira versao.

---

### Abordagem B. Catalogo hierarquico + visualizacao em sheet + edicao em rota dedicada

Criar uma nova rota admin com:

- subtab `Definicoes`;
- tabela hierarquica com sanfonas:
  - areas
  - workflow types
  - versoes
- botao de `olho` para visualizar detalhes gerais em um `sheet`/`dialog`;
- acao de `editar versao` abrindo uma rota dedicada de editor.

Exemplo conceitual:

- `/admin/request-config`
- `/admin/request-config/[workflowTypeId]/versions/[version]/edit`

#### Vantagens

- preserva o modelo mental de exploracao por sanfona;
- deixa a pagina principal leve e auditavel;
- da espaco real para editar form, etapas e action sem apertar tudo em uma linha;
- escala melhor para futuras regras da `2E` sem reescrever a tela.

#### Desvantagens

- exige mais navegacao que a opcao totalmente inline;
- pede desenho claro entre “visualizar” e “editar”.

#### Veredito

Recomendado.

---

### Abordagem C. Separar em dois modulos independentes: catalogo e editor

Criar duas experiencias quase independentes:

- uma rota para catalogo/areas/tipos/versoes;
- outra rota para editor/configurador;
- e tratar a primeira quase como um launcher.

#### Vantagens

- maior clareza de responsabilidade entre listagem e configuracao;
- melhor base para crescimento futuro.

#### Desvantagens

- pode parecer “fragmentado” cedo demais;
- aumenta o peso arquitetural da `2E`;
- corre o risco de virar duas features em vez de uma.

#### Veredito

Boa opcao de longo prazo, mas grande demais para a primeira iteracao.

## 5. Recomendacao

Seguir com a **Abordagem B**:

- nova rota admin exclusiva da `2E`;
- catalogo hierarquico na subtab `Definicoes`;
- visualizacao leve em `sheet`/`dialog`;
- editor de versao em rota dedicada.

Essa abordagem respeita a ideia visual da sanfona, sem transformar a pagina principal em um editor monolitico.

## 6. Estrutura de produto sugerida

### 6.1. Subtab `Definicoes`

#### Nivel 1. Areas de Chamados (Grupos)

Tabela inicial com:

- icone;
- nome da area;
- quantidade de tipos vinculados;
- acoes;
- seta de expandir/recolher.

#### Acoes recomendadas para Area

Na `2E`, eu recomendaria permitir:

- `Criar area`
- `Visualizar`
- `Editar metadados visuais`

Eu **nao recomendaria** expor `Excluir` livremente na primeira versao.

Motivo:

- area vinculada a tipos/versionamento pode quebrar navegacao e coerencia historica;
- melhor permitir exclusao apenas se a area estiver vazia, ou deixar isso fora do escopo inicial.

Tambem nao vejo necessidade de manter a coluna `storage path` na nova tela.

#### Nivel 2. Workflow Types por Area

Ao expandir a area, exibir os `workflowTypes_v2` daquela area.

Colunas sugeridas:

- nome do tipo;
- descricao curta;
- owner atual;
- versao ativa atual;
- visualizar geral (`olho`);
- expandir versoes.

#### Acoes recomendadas para Workflow Type

Na primeira versao:

- `Visualizar configuracao geral`
- `Criar nova versao`

Eu evitaria agora:

- exclusao do tipo;
- troca manual de ids;
- operacoes destrutivas em tipos que ja possuem requests.

Se um tipo precisar “sair de uso”, o caminho mais seguro continua sendo:

- manter o tipo;
- trabalhar suas versoes;
- ou futuramente adicionar uma flag de indisponibilidade, se necessario.

#### Nivel 3. Versoes

Ao expandir o tipo, exibir a lista de versoes.

Cada linha deve mostrar:

- numero sequencial da versao;
- tag:
  - `Rascunho`
  - `Publicada`
  - `Inativa`
- owner configurado;
- resumo dos campos;
- resumo das etapas;
- data de criacao/ultima atualizacao;
- acao de visualizar;
- acao principal de status/publicacao.

### 6.2. Regras de versao

#### Criacao

Ao criar nova versao:

- o `versionId` e sequencial e nao editavel;
- a base inicial vem da **ultima versao publicada**;
- a nova versao nasce como `Rascunho`.

#### Publicacao

Ao publicar/ativar uma versao:

- ela vira a versao ativa daquele tipo;
- a versao publicada anterior vira `Inativa` automaticamente;
- deve continuar existindo sempre uma versao ativa.

#### Inativacao

Aqui vale um ajuste de produto importante:

- eu **nao exponho** “inativar a versao ativa” como acao primitiva solta;
- eu exponho:
  - `Ativar` para uma versao inativa
  - `Publicar` para um rascunho

O efeito colateral da troca ja inativa a antiga automaticamente.

Isso evita uma acao que, isoladamente, viola a regra de sempre haver uma ativa.

#### Exclusao

Minha recomendacao:

- permitir excluir apenas `Rascunho`, se ainda nao publicado;
- nao permitir excluir versao `Publicada` ou `Inativa` na primeira versao.

Isso protege auditoria e compatibilidade.

## 7. Editor de versao: o que precisa existir

Voce ja listou o essencial. Eu adicionaria alguns pontos para nao faltar o que realmente impacta o runtime.

### 7.1. Configuracao geral da versao

- nome exibido do chamado;
- descricao/instrucoes;
- area vinculada;
- owner;
- flag de disponibilidade, se decidirmos expor isso na `2E` ou nao.

### 7.2. Campos do formulario

- adicionar campo;
- editar campo;
- remover campo;
- ordenar campos;
- label;
- tipo;
- obrigatoriedade;
- placeholder / ajuda;
- opcoes, quando o tipo for `select`;
- regras minimas por tipo.

### 7.3. Etapas

- adicionar etapa;
- remover etapa;
- renomear etapa;
- ordenar etapas.

Aqui sua intuicao esta boa:

- **nao** expor ids tecnicos da etapa;
- o sistema gera e preserva ids por baixo;
- o usuario mexe apenas em nome e ordem.

### 7.4. Semantica da etapa

Tem um ponto importante que vale entrar no escopo:

- a etapa precisa manter sua semantica operacional:
  - inicial
  - intermediaria
  - final

Mesmo que isso nao apareca com esses nomes tecnicos na UI, o editor precisa garantir que:

- exista etapa inicial;
- exista etapa final;
- a ordem nao produza fluxo invalido.

### 7.5. Configuracao de `action`

Dentro da etapa:

- ativar/desativar `action`;
- escolher tipo:
  - `execution`
  - `acknowledgement`
  - `approval`
- selecionar `approverIds`.

Eu tambem recomendaria prever desde a `2E`:

- label exibido da action;
- comentario opcional ou obrigatorio;
- anexo opcional ou obrigatorio quando fizer sentido.

Isso evita a `2E` nascer curta demais para o motor da `2D`.

### 7.6. Validacoes obrigatorias do editor

Para proteger runtime e Firestore, o editor deve impedir salvar versao invalida, por exemplo:

- etapa action sem `approverIds`;
- `approverIds` duplicados;
- duas etapas finais;
- nenhuma etapa final;
- nenhuma etapa inicial;
- owner invalido;
- select sem opcoes;
- versao sem campos minimos, se houver regra de submissao base.

## 8. Subtab `Historico Geral`

Essa subtab deve ser de **consulta/auditoria**, sem acao operacional.

Minha sugestao:

- manter visual proximo do historico global atual;
- incluir badge/filtro de origem:
  - `Legado`
  - `V2`
- abrir detalhe somente leitura;
- permitir filtros por:
  - area
  - tipo
  - status
  - owner
  - origem
  - periodo

Se a compatibilidade total com legado sair cara demais nesta primeira entrega, o fallback aceitavel e:

- manter a aba nova com suporte prioritario a `V2`;
- incluir leitura de legado como compatibilidade progressiva, nao como bloqueio da `2E`.

## 9. Firestore e sincronizacao

Tudo na `2E` precisa refletir o modelo novo:

- `workflowTypes_v2/{workflowTypeId}`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`

Operacoes esperadas:

- criar area;
- criar tipo;
- criar rascunho;
- atualizar rascunho;
- publicar/ativar versao;
- refletir versao ativa no documento raiz do tipo;
- manter consistencia entre status visual e ponteiros do Firestore.

## 10. Permissao e navegacao

### Navegacao

Criar nova rota admin, exposta na mesma secao do usuario onde hoje aparece `Workflows`.

Direcao sugerida:

- manter a rota atual antiga intacta;
- adicionar novo item de menu, por exemplo:
  - `Configuracao de Chamados`

### Permissao

Na primeira versao:

- criar uma permissao separada para a nova tela, recomendada como:
  - `canManageWorkflowsV2`

Separacao recomendada:

- tela admin legada:
  - `canManageWorkflows`
- nova tela da `2E`:
  - `canManageWorkflowsV2`

Isso permite rollout gradual, homologacao controlada e menor risco de abrir a nova superficie de publicacao para usuarios que hoje so operam o painel legado.

## 11. YAGNI

Para a `2E` ficar saudavel, eu seguraria o escopo em torno do que habilita versionamento e publicacao com seguranca.

### Precisamos agora

- nova rota admin;
- catalogo por area > tipo > versao;
- editor de versao no modelo `v2`;
- criacao de rascunho a partir da ultima publicada;
- publicacao/ativacao com troca automatica da antiga;
- validacoes minimas de integridade;
- historico geral read-only.

### Nao precisamos agora

- editar tipos legados;
- mostrar ids tecnicos na UI;
- exclusao irrestrita de area/tipo/versao publicada;
- automacoes de migracao de legado via UI;
- analytics profundos dentro da mesma tela;
- builder excessivamente generico para qualquer schema futuro.

## 12. Riscos principais

### 12.1. Misturar demais a tela nova com a antiga

Se tentarmos evoluir a tela atual em vez de criar uma nova, o risco de regressao em legado e alto.

### 12.2. Permitir acoes destrutivas cedo demais

Excluir area/tipo/versao publicada sem trilha forte de impacto pode quebrar compatibilidade historica e operacional.

### 12.3. Fazer o editor inline demais

Se o editor viver inteiro dentro da sanfona, a `2E` nasce pesada e dificil de manter.

### 12.4. Subestimar validacoes da configuracao

O configurador precisa proteger o runtime:

- action sem destinatario;
- duplicidade de destinatario;
- etapas invalidas;
- versao sem consistencia minima.

## 13. Confirmacao de entendimento

Entendimento consolidado para a `2E`:

- sera criada uma **nova tela/rota** de configuracao dos chamados;
- ela fica na mesma secao admin exposta ao usuario, convivendo com a entrada antiga;
- o acesso da nova tela deve usar uma permissao propria, recomendada como `canManageWorkflowsV2`;
- a aba `Definicoes` opera somente no modelo `workflowTypes_v2`;
- a aba `Historico Geral` e somente leitura, com compatibilidade com legado se viavel;
- a estrutura principal e hierarquica:
  - area
  - tipo
  - versao
- a publicacao e feita na linha da versao;
- nova versao nasce clonando a ultima publicada;
- ids internos nao ficam expostos ao usuario.

## 14. Proximo passo recomendado

Seguir para um `DEFINE` da `2E` fechando:

- rota e permissao exatas;
- operacoes permitidas por nivel:
  - area
  - tipo
  - versao
- regras de publicacao / ativacao / rascunho;
- shape minimo do editor de versao;
- estrategia de compatibilidade do `Historico Geral` com legado.
