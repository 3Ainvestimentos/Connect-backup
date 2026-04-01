# Roadmap Fase 2 - Front Oficial, Expansao e Configuracao

## 1. Objetivo

Este documento define o roadmap macro da **Fase 2** do novo motor de workflows, sucedendo a conclusao da Fase 1 em Facilities e Suprimentos.

A Fase 2 tem tres objetivos complementares:

- construir o **frontend oficial** da experiencia integrada de chamados;
- expandir o motor para os **demais workflows** ainda nao cadastrados no modelo novo;
- criar a **superficie administrativa** para configuracao, versionamento e publicacao dos workflows.

Ao contrario da Fase 1, que foi deliberadamente um piloto validatorio, a Fase 2 passa a tratar o novo motor como **produto em consolidacao**.

Isso significa que as entregas desta fase devem:

- abandonar a logica de piloto como superficie principal;
- preservar a arquitetura validada na Fase 1;
- suportar crescimento para dezenas de `workflowTypes`;
- preparar a operacao para evolucao sem dependencia constante de mudanca em codigo.

### 1.1. Principio de planejamento da Fase 2

Para manter o escopo executavel, a Fase 2 fica dividida em tres macroetapas:

- **Fase 2A**: frontend oficial da tela integrada;
- **Fase 2B**: cadastro e habilitacao dos workflows restantes;
- **Fase 2C**: tela de configuracao dos chamados e versionamento.

Essa divisao separa tres naturezas distintas de trabalho:

- experiencia final de uso;
- expansao de cobertura funcional;
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

### 2.2. Fase 2B - Cadastro e habilitacao dos workflows restantes

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
- ativacao progressiva no frontend oficial.

### 2.3. Fase 2C - Configuracao, versionamento e administracao

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

### 3.1. Nao misturar as tres frentes no mesmo build

As macroetapas 2A, 2B e 2C devem poder avancar em paralelo no planejamento, mas nao devem ser tratadas como um unico build amorfo.

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

### 3.4. O cadastro dos workflows restantes deve ser feito por lotes

Os workflows restantes nao devem entrar de uma vez em um unico pacote.

A macroetapa 2B deve definir:

- criterio de agrupamento;
- ordem de migracao;
- estrategia de smoke test por lote;
- gates de publicacao por area.

### 3.5. A tela de configuracao e uma superficie de produto, nao um utilitario tecnico

A macroetapa 2C nao deve nascer como editor improvisado de JSON.

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

### 5.2. Fase 2B - Cadastro e habilitacao dos workflows restantes

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

### 5.3. Fase 2C - Tela de configuracao, versoes e publicacao

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
2. **Fase 2B** - Cadastro e habilitacao dos workflows restantes
3. **Fase 2C** - Tela de configuracao, versoes e publicacao

### 6.2. Observacao de paralelismo

A ordem acima e a mais segura para execucao principal, mas o planejamento pode ocorrer em paralelo:

- `2A` e `2B` podem ter descoberta simultanea;
- `2C` pode iniciar discovery e define antes do fechamento completo de `2B`;
- a implementacao, no entanto, deve respeitar dependencias reais de backend e frontend.

Dentro da propria 2A, a recomendacao e executar `2A.1 -> 2A.2 -> 2A.3 -> 2A.4`, evitando concentrar toda a macroetapa em um unico build.

---

## 7. Criterios de Encerramento da Fase 2

A Fase 2 so deve ser considerada concluida quando:

- a experiencia oficial de gestao de chamados estiver operando fora do namespace piloto;
- os workflows remanescentes planejados para a onda estiverem cadastrados e habilitados;
- a administracao de versoes e configuracao estiver operavel;
- a operacao principal nao depender mais da superficie piloto para uso cotidiano;
- a base estiver pronta para rollout ampliado e evolucao continua.

---

## 8. Regra de Uso

Este documento e o roadmap macro da Fase 2.

Quando houver conflito de detalhe:

1. prevalece o `DEFINE` especifico da macroetapa;
2. depois o `DESIGN` especifico da macroetapa;
3. depois este roadmap macro;
4. por fim, os documentos estruturantes de `docs_step2`.
