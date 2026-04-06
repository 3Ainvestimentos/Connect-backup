# Roadmap Fase 2 - Front Oficial, Expansao e Configuracao

## 1. Objetivo

Este documento define o roadmap macro da **Fase 2** do novo motor de workflows, sucedendo a conclusao da Fase 1 em Facilities e Suprimentos.

A Fase 2 tem cinco objetivos complementares:

- construir o **frontend oficial** da experiencia integrada de chamados;
- construir a **nova superficie oficial de abertura de chamado** sobre o backend novo;
- expandir o motor para os **demais workflows** ainda nao cadastrados no modelo novo;
- construir o **motor operacional de `requestAction` / `respondAction`** para workflows action-driven;
- criar a **superficie administrativa** para configuracao, versionamento e publicacao dos workflows.

Ao contrario da Fase 1, que foi deliberadamente um piloto validatorio, a Fase 2 passa a tratar o novo motor como **produto em consolidacao**.

Isso significa que as entregas desta fase devem:

- abandonar a logica de piloto como superficie principal;
- preservar a arquitetura validada na Fase 1;
- suportar crescimento para dezenas de `workflowTypes`;
- preparar a operacao para evolucao sem dependencia constante de mudanca em codigo.

### 1.1. Principio de planejamento da Fase 2

Para manter o escopo executavel, a Fase 2 fica dividida em cinco macroetapas:

- **Fase 2A**: frontend oficial da tela integrada;
- **Fase 2B**: nova tela oficial de abertura de chamado;
- **Fase 2C**: cadastro e habilitacao dos workflows restantes;
- **Fase 2D**: motor operacional de `requestAction` / `respondAction`;
- **Fase 2E**: tela de configuracao dos chamados e versionamento.

Essa divisao separa quatro naturezas distintas de trabalho:

- experiencia final de uso;
- experiencia oficial de abertura e solicitacao;
- expansao de cobertura funcional;
- suporte operacional aos workflows action-driven;
- operacao administrativa da plataforma.

### 1.2. Estado herdado da Fase 1

A Fase 2 assume como base validada:

- runtime novo funcionando ponta a ponta;
- read-side operacional para filas, atribuicoes, concluidos e minhas solicitacoes;
- catalogo publicado consumido pelo frontend;
- suporte a campo `file` via signed URL;
- tres workflows de Facilities funcionando na mesma rota piloto;
- handoff owner -> responsavel -> finalizacao -> arquivamento validado.

Essa base nao deve ser redesenhada. A Fase 2 deve **promover e enriquecer** essa fundacao.

---

## 2. Escopo Macro da Fase 2

### 2.1. Fase 2A - Front oficial da tela integrada

Esta macroetapa substitui a experiencia piloto por uma experiencia oficial de gestao de chamados.

Objetivos principais:

- construir a tela oficial integrada de gestao de chamados;
- amadurecer navegacao, filtros, agrupamentos e detalhe do request;
- exibir melhor os dados operacionais e os dados submetidos pelo formulario;
- tratar anexos como parte da experiencia oficial;
- remover a dependencia da superficie `/pilot/*` como experiencia principal.

Escopo esperado:

- rota oficial de gestao de chamados;
- layout, tabs, filtros e estados vazios definitivos;
- detalhe de chamado mais rico;
- tratamento oficial de anexos;
- integracao com os workflows ja validados na Fase 1.

### 2.1.1. Estrategia de execucao da 2A

Para manter a janela de contexto controlada e o build validavel por partes, a 2A deve ser executada em sub-builds, sem perder sua identidade como macroetapa unica:

- **2A.1** Entrada oficial + shell da nova rota
  - criar `/gestao-de-chamados`
  - criar namespace `workflows/management/*`
  - adicionar entrada no dropdown do usuario
  - montar shell inicial da nova tela
  - manter legado intacto
- **2A.2** Bootstrap + listas oficiais
  - `management/bootstrap`
  - filtros oficiais nas listas
  - `current`, `assignments`, `completed`
  - subtabs de `Atribuicoes e acoes`
  - URL state + toolbar
- **2A.3** Detalhe rico do request
  - `GET /read/requests/[requestId]`
  - `formData`
  - anexos
  - progresso
  - timeline
  - modal oficial
- **2A.4** Polimento e rollout controlado
  - acabamento visual
  - estados vazios/falha/loading refinados
  - hardening
  - decisao de convivencia no dropdown
  - smoke final e readiness para substituir o fluxo principal

### 2.2. Fase 2B - Nova tela oficial de abertura de chamado

Esta macroetapa constroi a nova superficie oficial de abertura de chamados, conectada ao backend novo, sem reutilizar a pagina legada atual como base principal de evolucao.

Objetivos principais:

- criar a nova experiencia oficial de abertura de chamado sobre o modelo novo;
- preservar a equivalencia funcional com a tela atual enquanto a nova superficie amadurece;
- manter a transicao segura sem apagar artefatos legados prematuramente;
- reaproveitar a estrutura visual atual quando isso reduzir friccao desnecessaria para o usuario.

Escopo esperado:

- nova rota ou nova superficie oficial de abertura conectada ao backend novo;
- componente novo, separado da implementacao legada atual;
- suporte aos mesmos casos de uso da abertura atual, agora sobre o modelo oficial;
- convivencia temporaria com a tela existente durante rollout e rodada de testes;
- limpeza dos artefatos antigos apenas depois da implementacao completa e da validacao end-to-end.

Diretrizes fechadas:

- a nova tela pode ser visualmente identica a tela atual no primeiro momento;
- a implementacao deve ser nova e desacoplada da pagina legada;
- remocao, merge ou limpeza dos artefatos antigos ficam para uma etapa posterior de hardening e rollout.

### 2.3. Fase 2C - Cadastro e habilitacao dos workflows restantes

Esta macroetapa expande o motor para os demais workflows previstos no rollout.

Objetivos principais:

- cadastrar os workflows restantes no modelo novo;
- publicar versoes iniciais no `workflowTypes_v2`;
- validar os grupos de workflows por lotes;
- confirmar que a base criada na Fase 1 escala alem de Facilities.

Escopo esperado:

- levantamento dos workflows restantes;
- definicao de lotes de migracao;
- materializacao das versoes iniciais;
- validacao funcional por grupo/area;
- ativacao progressiva no frontend oficial para lotes suportados pelo runtime atual.

Status atual:

- **concluida**

Fechamentos consolidados:

- os `30` workflows restantes foram materializados em `workflowTypes_v2` por `5` lotes;
- workflows diretos aprovados passaram a usar o canon de `3` etapas, alinhado a Facilities:
  - `Solicitação Aberta`
  - `Em andamento`
  - `Finalizado`
- a classificacao ficou explicita por workflow com `stepStrategy`;
- workflows com `action` ou checkpoints semanticos relevantes permaneceram em `preserve_legacy`;
- lotes `1`, `2` e `3` foram publicados com `active: true`;
- lotes `4` e `5` foram publicados com `active: false`, aguardando a `2D`.

Nota de dependência:

- lotes sem `statuses[*].action` podem avancar ate habilitacao plena dentro da propria 2C;
- lotes action-driven podem ser materializados e validados na 2C, mas sua habilitacao plena depende da macroetapa `2D`.

### 2.4. Fase 2D - Motor operacional de `requestAction` / `respondAction`

Esta macroetapa entrega o suporte de runtime para workflows com etapas action-driven, preservando o contrato previsto desde a Fase 1 e desbloqueando os lotes mais complexos da 2C.

Objetivos principais:

- implementar `requestAction` e `respondAction` no runtime novo;
- suportar etapas com `approval`, `acknowledgement` e `execution`;
- refletir corretamente `waiting_action`, `pendingActionRecipientIds` e `pendingActionTypes` no write-side e no read-side;
- liberar enablement pleno dos workflows dos lotes action-driven.

Escopo esperado:

- casos de uso operacionais de acao por etapa;
- persistencia e transicao de estados de pending action;
- atualizacao consistente do read model para `waiting_action`;
- integracao com filas operacionais e detalhe do request;
- readiness para promover lotes `4` e `5` da 2C para `enabled`.

Status atual:

- **proxima macroetapa recomendada**

### 2.5. Fase 2E - Configuracao, versionamento e administracao

Esta macroetapa entrega a superficie administrativa do sistema de workflows.

Objetivos principais:

- permitir criacao de novas versoes de workflow;
- permitir consulta e gestao de versoes existentes;
- permitir publicacao controlada;
- reduzir dependencia de alteracoes em codigo para evolucao do catalogo.

Escopo esperado:

- tela de configuracao de workflows;
- historico de versoes por `workflowTypeId`;
- criacao de nova versao a partir da atual;
- edicao e publicacao;
- validacoes de integridade antes da publicacao.

---

## 3. Diretrizes da Fase 2

### 3.1. Nao misturar as cinco frentes no mesmo build

As macroetapas 2A, 2B, 2C, 2D e 2E devem poder avancar em paralelo no planejamento, mas nao devem ser tratadas como um unico build amorfo.

Cada macroetapa precisa ter:

- `DEFINE` proprio;
- `DESIGN` proprio;
- criterios de aceite proprios;
- plano de validacao proprio.

### 3.2. A Fase 2 nao e um redesenho do backend

O backend herdado da Fase 1 ja e suficiente para iniciar o front oficial.

A Fase 2 pode trazer **enriquecimentos** de backend quando a UX oficial exigir, por exemplo:

- detalhe mais rico do request;
- exposicao controlada de `formData`;
- leitura e renderizacao oficial de anexos;
- filtros ou agregacoes mais sofisticados;
- contratos administrativos para catalogo e versoes.

Mas esses incrementos devem nascer como necessidades explicitas das macroetapas, e nao como reabertura difusa da Fase 1.

### 3.3. O frontend oficial deve nascer desacoplado do namespace `pilot`

A Fase 2A deve tratar `pilot/*` como legado interno da fase anterior.

Direcao esperada:

- promover o que for de fato compartilhavel;
- manter o piloto como referencia de aprendizado;
- evitar que o frontend oficial apenas replique a superficie do piloto com novo styling.

### 3.4. A nova tela de abertura deve nascer separada da pagina legada

A macroetapa 2B deve tratar a tela atual apenas como referencia funcional e visual.

Direcao esperada:

- construir uma nova superficie conectada ao backend novo;
- evitar evolucao incremental diretamente em cima da pagina legada atual;
- manter os artefatos legados durante a transicao;
- postergar limpeza dos artefatos antigos ate depois da implementacao completa e de uma rodada dedicada de testes end-to-end.

### 3.5. O cadastro dos workflows restantes deve ser feito por lotes

Os workflows restantes nao devem entrar de uma vez em um unico pacote.

A macroetapa 2C deve definir:

- criterio de agrupamento;
- ordem de migracao;
- estrategia de smoke test por lote;
- gates de publicacao por area.

### 3.6. O motor de `requestAction` precisa nascer como capacidade de runtime, nao como workaround de frontend

A macroetapa 2D deve tratar `action` como parte do motor transacional e do read model, e nao como efeito colateral da UI.

Direcao esperada:

- casos de uso explicitos no runtime;
- controle de autorizacao por identidades operacionais (`id3a`);
- transicoes semanticas claras para `waiting_action`;
- compatibilidade com os contratos de `action` ja previstos nos artefatos tecnicos.

### 3.7. A tela de configuracao e uma superficie de produto, nao um utilitario tecnico

A macroetapa 2E nao deve nascer como editor improvisado de JSON.

Ela deve ser pensada como superficie de administracao com:

- previsibilidade;
- historico;
- seguranca operacional;
- validacoes claras;
- modelo de publicacao compreensivel.

---

## 4. Artefatos de Referencia Obrigatorios

Toda a Fase 2 deve continuar usando como base os documentos estruturantes do motor:

- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)
- [MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)

Artefatos herdados da Fase 1 que servem como referencia de validacao:

- [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_FASE1_FACILITIES.md)
- [implementation_progress_fase1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/implementation_progress_fase1.md)
- [implementation_progress_fase1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/implementation_progress_fase1.md)

---

## 5. Roadmap Inicial da Fase 2

### 5.1. Fase 2A - Front oficial da tela integrada

**Objetivo**

Construir a experiencia oficial de gestao de chamados sobre a fundacao validada no piloto, substituindo a superficie `/pilot/facilities` como UX principal.

**Saidas esperadas**

- rota oficial integrada de gestao de chamados;
- identidade visual e navegacao oficiais;
- detalhe rico de request;
- visualizacao oficial de anexos;
- filtros, tabs e agrupamentos mais maduros;
- transicao limpa entre piloto validado e frontend oficial.

**Principais perguntas que esta etapa precisa responder**

- como a tela oficial organiza workflows, filas e detalhes sem herdar as limitacoes do piloto?
- que dados adicionais o frontend oficial precisa do backend para renderizar request detail e anexos?
- quais componentes ou contratos do piloto podem ser promovidos e quais devem ser substituidos?

### 5.2. Fase 2B - Nova tela oficial de abertura de chamado

**Objetivo**

Construir a nova experiencia oficial de abertura de chamados sobre o backend novo, mantendo a tela atual intacta durante a transicao.

**Saidas esperadas**

- nova superficie oficial de abertura conectada ao modelo novo;
- componente separado da implementacao legada;
- equivalencia funcional com a experiencia atual de abertura;
- possibilidade de identidade visual inicialmente identica a tela legada, sem reutilizar sua implementacao;
- convivencia segura com a tela antiga durante rollout;
- base pronta para substituicao controlada apos testes end-to-end.

**Principais perguntas que esta etapa precisa responder**

- qual a melhor forma de reproduzir a experiencia atual de abertura sem carregar o acoplamento tecnico da tela legada?
- quais componentes podem ser reaproveitados apenas como referencia visual e quais precisam nascer novos?
- como garantir equivalencia funcional antes de remover artefatos antigos?

### 5.3. Fase 2C - Cadastro e habilitacao dos workflows restantes

**Objetivo**

Expandir o novo motor para os demais workflows ainda nao materializados, usando estrategia de migracao por lotes.

**Saidas esperadas**

- inventario dos workflows restantes;
- agrupamento por lotes de implementacao;
- contratos canonicos definidos para cada lote;
- versoes iniciais publicadas em `workflowTypes_v2`;
- workflows habilitados no frontend oficial conforme rollout.

**Principais perguntas que esta etapa precisa responder**

- qual a ordem de migracao mais segura?
- quais grupos compartilham padroes e podem ser tratados juntos?
- quais workflows exigem extensao de modelo, UX ou backend?

### 5.4. Fase 2D - Tela de configuracao, versoes e publicacao

**Objetivo**

Criar a superficie administrativa para evolucao do catalogo de workflows sem depender de intervencao manual em codigo para cada ajuste.

**Saidas esperadas**

- listagem de workflows e suas versoes;
- criacao de nova versao;
- edicao controlada;
- publicacao com validacoes;
- historico administrativo minimo.

**Principais perguntas que esta etapa precisa responder**

- qual e o contrato minimo da tela de configuracao para ser operavel e segura?
- como representar diferenca entre rascunho, publicada e historico?
- quais validacoes bloqueiam publicacao?

---

## 6. Ordem Recomendada

### 6.1. Ordem macro

1. **Fase 2A** - Front oficial da tela integrada
2. **Fase 2B** - Nova tela oficial de abertura de chamado
3. **Fase 2C** - Cadastro e habilitacao dos workflows restantes
4. **Fase 2D** - Tela de configuracao, versoes e publicacao

### 6.2. Observacao de paralelismo

A ordem acima e a mais segura para execucao principal, mas o planejamento pode ocorrer em paralelo:

- `2A` e `2B` podem ter discovery simultanea;
- `2C` pode iniciar discovery e define antes do fechamento completo de `2B`;
- `2D` pode iniciar discovery e define antes do fechamento completo de `2C`;
- a implementacao, no entanto, deve respeitar dependencias reais de backend e frontend.

Dentro da propria 2A, a recomendacao e executar `2A.1 -> 2A.2 -> 2A.3 -> 2A.4`, evitando concentrar toda a macroetapa em um unico build.

---

## 7. Criterios de Encerramento da Fase 2

A Fase 2 so deve ser considerada concluida quando:

- a experiencia oficial de gestao de chamados estiver operando fora do namespace piloto;
- a nova experiencia oficial de abertura de chamado estiver operando sobre o backend novo;
- os workflows remanescentes planejados para a onda estiverem cadastrados e habilitados;
- a administracao de versoes e configuracao estiver operavel;
- a operacao principal nao depender mais da superficie piloto para uso cotidiano;
- a abertura principal nao depender mais da superficie legada atual para uso cotidiano;
- a base estiver pronta para rollout ampliado e evolucao continua.

---

## 8. Regra de Uso

Este documento e o roadmap macro da Fase 2.

Quando houver conflito de detalhe:

1. prevalece o `DEFINE` especifico da macroetapa;
2. depois o `DESIGN` especifico da macroetapa;
3. depois este roadmap macro;
4. por fim, os documentos estruturantes de `docs_step2`.
