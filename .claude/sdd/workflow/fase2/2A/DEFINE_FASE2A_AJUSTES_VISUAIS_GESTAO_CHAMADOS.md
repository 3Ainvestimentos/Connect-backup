# DEFINE: FASE 2A - Ajustes Visuais da Tela de Gestao de Chamados

> Generated: 2026-04-01
> Status: Approved for design
> Scope: Fase 2 / 2A - rodada de ajustes visuais e refinamentos leves de UX na tela oficial `/gestao-de-chamados`
> Source: `BRAINSTORM_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md`

## 1. Problem Statement

A tela oficial `/gestao-de-chamados` ja esta funcional, mas ainda carrega ruido visual e blocos de transicao que prejudicam a leitura operacional e a aproximacao com a linguagem visual existente da aplicacao.

---

## 2. Users

### 2.1. Operacao do dia a dia

Pain points:

- abre a tela oficial e encontra badges, cards e copys de rollout que comunicam estado de build em vez de uso real;
- percebe a toolbar de filtros como um bloco separado demais da navegacao principal;
- precisa ler uma aba de concluidas longa demais quando o historico cresce.

### 2.2. Produto / UX

Pain points:

- a tela oficial ainda nao conversa bem com a linguagem das demais paginas maduras da aplicacao;
- ha excesso de contexto tecnico visivel para uma superficie que ja deveria se apresentar como produto oficial;
- a relacao visual entre tabs, filtros e historico concluido ainda nao esta suficientemente refinada.

### 2.3. Engenharia

Pain points:

- existe risco de transformar uma rodada de polish em redesign amplo se o escopo nao for fechado com clareza;
- os ganhos de UX precisam acontecer sem reabrir backend, contratos read-side ou regras operacionais;
- a transicao entre cleanup visual e alteracao estrutural pequena precisa ficar delimitada antes do design.

---

## 3. Goals

### MUST

- aproximar a tela `/gestao-de-chamados` da linguagem visual ja existente no produto;
- usar `admin-primary` como token canonico de destaque visual para botoes internos e highlights desta rodada;
- remover blocos de rollout, transicao e telemetria visual que nao agregam na UX diaria;
- reposicionar o filtro para dentro do mesmo quadrante visual das tabs principais;
- trocar o filtro inline por um gatilho minimalista com painel delicado e CTA explicito de confirmacao;
- exibir filtros ativos de forma discreta, sem competir visualmente com as tabs;
- transformar a aba `Concluidas` em leitura por sanfona mensal;
- manter o mes mais recente aberto por padrao e os anteriores fechados;
- preservar comportamento funcional atual, incluindo URL state, filtros existentes, tabs e gates de visibilidade.

### SHOULD

- reduzir a sensacao de “console tecnico” na tela oficial;
- melhorar a hierarquia visual entre cabecalho, tabs, filtros e conteudo da aba ativa;
- tornar o historico concluido mais controlado visualmente em cenarios de lista longa;
- manter os refinamentos pequenos o suficiente para caberem em frontend leve e validacao rapida.

### COULD

- ajustar copy curta de labels e estados para ficar menos tecnica, desde que sem alterar contratos;
- introduzir microajustes de espacamento e composicao que reforcem a leitura visual da pagina;
- reaproveitar primitives visuais ja existentes no app para o painel de filtros e a sanfona.

### WON'T

- nao reabrir backend, read model, runtime ou contratos de API;
- nao mexer na fase 2B;
- nao fazer redesign amplo da arquitetura da tela;
- nao inventar nova linguagem visual, novo esquema de cores ou novos tokens;
- nao criar novos filtros, novas metricas, novas agregacoes ou nova logica de busca.

---

## 4. Success Criteria

- a tela inicial de `/gestao-de-chamados` deixa de exibir blocos de rollout e transicao hoje considerados ruido;
- os CTAs internos de destaque passam a usar `hsl(var(--admin-primary))` e derivados aprovados no design;
- tabs e filtro passam a ser percebidos como parte de uma mesma zona de navegacao e controle;
- a aplicacao de filtros continua funcionando com confirmacao explicita, preservando URL state e comportamento atual;
- filtros ativos ficam visiveis, mas discretos, sem dominar o header da experiencia;
- a aba `Concluidas` passa a abrir o mes mais recente por padrao e reduzir a altura total do historico;
- nenhuma permissao, gate operacional ou contrato de dados precisa ser alterado para entregar a rodada.

### Clarity Score

`15/15`

Motivo:

- problema, direcao visual e restricoes estao fechados no brainstorm;
- o recorte tecnico esta claramente limitado a frontend e polish de UX;
- os pontos de aceite sao objetivos o suficiente para prosseguir para design.

---

## 5. Technical Scope

### Frontend

- ajustar a composicao visual da pagina oficial em `src/components/workflows/management/*`;
- remover badges, cards e copys de transicao hoje renderizados no shell da `WorkflowManagementPage`;
- refinar a area de tabs e filtros para operar como uma unica zona visual;
- evoluir `ManagementToolbar` de card inline para controle acionado por botao minimalista com confirmacao;
- exibir filtros ativos como indicadores discretos ao lado do gatilho de filtro;
- evoluir `CompletedPanel` para agrupamento mensal em sanfona, reaproveitando primitive de accordion existente;
- preservar estados de loading, empty, erro, detalhe e mutacoes sem alteracao de contrato.

### Backend

- nenhuma mudanca obrigatoria;
- apenas consumo dos contratos ja existentes de bootstrap, listas e detalhe.

### Database

- fora do escopo;
- nenhuma alteracao em `workflows_v2`, `workflowTypes_v2` ou estruturas relacionadas.

### AI

- fora do escopo.

---

## 6. Auth Requirements

- nenhuma mudanca de auth, JWT, escopo de actor ou regras de isolamento faz parte desta rodada;
- a visibilidade da aba `Chamados atuais` continua dependente do bootstrap/capabilities atuais;
- o painel de filtros e a nova apresentacao visual nao podem contornar gates ja existentes;
- a limpeza de blocos tecnicos nao remove telemetria operacional do sistema, apenas sua exposicao na UX principal.

---

## 7. Out of Scope

- alterar endpoints `current`, `assignments`, `completed`, `bootstrap` ou `requests/[requestId]`;
- redefinir a estrutura funcional das tabs principais ou subtabs operacionais;
- substituir `URL state` por outro modelo de estado;
- mudar regras de ownership, SLA, filtros disponiveis ou comportamento de mutacoes;
- remover artefatos legados fora da pagina `/gestao-de-chamados`;
- redesenhar modal de detalhe rico, runtime de atribuicao/finalizacao ou superficies antigas.

---

## 8. Dependencies

Depende de:

- [BRAINSTORM_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/2A/BRAINSTORM_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md)
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- implementacao atual da rota oficial em `src/components/workflows/management/*`

Entrega pronta para destravar:

- um `DESIGN` especifico desta rodada de ajustes visuais, sem reabrir a macroarquitetura da 2A.

---

## 9. Fonte de Verdade

Este define deriva de:

- [BRAINSTORM_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/2A/BRAINSTORM_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md)
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx)
- [CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx)
- [use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts)
- [globals.css](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/globals.css)

Em caso de divergencia:

1. prevalece este define para o escopo da rodada de ajustes visuais;
2. depois prevalece o brainstorm desta rodada para decisoes fechadas;
3. depois prevalecem o define e o design macro da 2A para contratos e limites estruturais.
