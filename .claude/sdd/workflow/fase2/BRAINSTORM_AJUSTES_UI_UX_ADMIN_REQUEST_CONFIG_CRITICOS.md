# Brainstorm: Ajustes UI/UX Críticos em `/admin/request-config`

Date: 2026-04-16
Owner: Codex
Status: Approved for next `DEFINE`

---

## 1. Contexto

Escopo restrito à rota administrativa:

- `/admin/request-config`

Sem impacto deliberado em:

- `/admin/workflows`
- `/gestao-de-chamados`
- runtime/backend de workflows
- contratos de API

Urgência informada:

- correção crítica para hoje

Referências canônicas aprovadas:

- filtro de `/gestao-de-chamados` como referência visual/comportamental para a aba `Histórico Geral`
- linguagem visual administrativa existente do próprio app (`PageHeader`, CTA admin, cards/tabs/tabelas)

---

## 2. Problema

A tela `/admin/request-config` já está funcional, mas ainda tem divergências claras de UX:

- a aba `Definições` ainda mistura hierarchy/layout de catálogo, versão e editor de forma pouco consistente;
- o modal do editor ainda não está com o padrão operacional esperado para fechamento, rodapé de ações e densidade visual;
- os CTAs secundários do editor estão posicionados em lugares que dificultam a leitura do fluxo;
- a representação de ações ainda expõe texto técnico/inglês onde o esperado é PT-BR;
- a aba `Histórico Geral` mantém o filtro permanentemente aberto, destoando do padrão mais enxuto de `/gestao-de-chamados`.

Em resumo: o produto funciona, mas a ergonomia visual e a organização dos controles ainda não estão no padrão desejado para uma superfície administrativa oficial.

---

## 3. Perguntas Respondidas

### Q1. Quem vai usar?

- admins com permissão de configuração de workflows v2 em `/admin/request-config`

### Q2. Onde aparece?

- apenas em `/admin/request-config`

### Q3. Qual referência visual usar?

- para `Histórico Geral`, copiar a estética/comportamento do filtro de `/gestao-de-chamados`

### Q4. Qual a urgência?

- crítica para hoje

---

## 4. Código Atual Relevante

Superfícies já identificadas:

- [WorkflowConfigPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigPage.tsx)
- [WorkflowConfigDefinitionsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx)
- [WorkflowVersionEditorDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx)
- [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx)
- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)
- [WorkflowDraftFieldsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftFieldsSection.tsx)
- [WorkflowConfigHistoryTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx)
- [HistoryFiltersBar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/history/HistoryFiltersBar.tsx)
- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)

Leitura do estado atual:

- `Definições` hoje organiza `areas -> workflow types -> versions` com accordion só no nível de área;
- o modal de editor usa `DialogContent` grande e `DialogHeader` padrão, mas não tem fechamento mínimo nem rodapé fixo mais colado à borda;
- `Adicionar etapa` e `Adicionar campo` ficam no topo do bloco;
- o editor ainda usa strings técnicas em `Acao` e opções como `approval`, `acknowledgement`, `execution`;
- o `Histórico Geral` usa `HistoryFiltersBar` sempre expandido dentro do `CardHeader`;
- `/gestao-de-chamados` já usa `ManagementToolbar` como padrão de filtro mais compacto/colapsável.

---

## 5. Ajustes Solicitados

### 5.1. Tab `Definições`

- tipos dentro da sanfona do `WorkflowType`
- remover o item textual `state=published` da versão específica
- `Salvar Rascunho` e `Publicar versao` fixos no final do modal, lado a lado, com menor padding inferior
- botão de fechar apenas com `X` fixo no canto superior direito do modal
- botões `Adicionar etapa` e `Adicionar campo` no canto direito inferior do bloco correspondente
- ações exibidas traduzidas em PT-BR
- botões de ação em verde-água (`admin-primary`)

### 5.2. Tab `Histórico Geral`

- filtro no padrão de `/gestao-de-chamados`
- botão minimalista
- pequeno card/popover de filtros
- filtro não deve ficar sempre aberto

---

## 6. Abordagens

### Abordagem A — Patch cirúrgico só na UI dos pontos citados

O que faz:

- reorganiza hierarchy da aba `Definições` sem alterar contratos de dados;
- ajusta o shell do `Dialog` e o rodapé fixo do editor;
- reposiciona botões de adicionar dentro dos próprios blocos;
- traduz os labels visíveis de ação;
- substitui a barra de filtros aberta por um controle compacto no `Histórico Geral`.

Prós:

- menor risco
- mais rápida para hoje
- não reabre backend nem contratos
- resolve exatamente o que foi pedido

Contras:

- mantém algumas limitações estruturais do componente atual
- pode deixar pequenas inconsistências internas se a composição dos blocos continuar muito acoplada

Esforço:

- baixo para médio

Recomendação:

- sim

### Abordagem B — Reorganização moderada do frontend das duas tabs

O que faz:

- além dos ajustes visuais, extrai subcomponentes de catálogo, versão, rodapé de editor e toolbar de filtro;
- consolida padrões de CTA e fechamento modal;
- trata a aba `Definições` como catálogo administrativo mais estável para evoluções futuras.

Prós:

- deixa a tela mais preparada para manutenção
- reduz chance de retrabalho em próximos polimentos
- melhora clareza estrutural do frontend

Contras:

- maior risco para um patch crítico
- exige mais leitura de regressão e mais testes

Esforço:

- médio

Recomendação:

- só se surgirem mais mudanças correlatas no mesmo pacote

### Abordagem C — Refatoração ampla para canonizar toda a `/admin/request-config`

O que faz:

- revisa shell, tabs, catálogo, histórico, modal e grid/list patterns como uma família visual completa;
- extrai primitives específicas do configurador.

Prós:

- melhor consistência de longo prazo

Contras:

- escopo excessivo para hoje
- risco alto de abrir regressão sem necessidade

Esforço:

- alto

Recomendação:

- descartar por YAGNI

---

## 7. YAGNI

Itens cortados deste pacote:

- backend
- API routes
- reordenação de modelo de dados
- redesign amplo de histórico
- mudança de comportamento do runtime
- alteração na rota `/gestao-de-chamados`
- criação de novo sistema compartilhado de filtros

O objetivo aqui é:

- corrigir UX
- não reabrir arquitetura

---

## 8. Recomendação Final

Seguir com a **Abordagem A**.

Recorte recomendado para `DEFINE`:

1. Reorganizar a aba `Definições` para que `WorkflowType` vire o agrupador visual principal das versões.
2. Remover `state=published` onde ele for redundante com badges/flags já existentes.
3. Ajustar o `WorkflowVersionEditorDialog` para:
   - fechar com `X` no canto superior direito;
   - manter CTAs fixos no rodapé;
   - usar menor padding inferior;
   - colocar `Salvar Rascunho` e `Publicar versao` lado a lado.
4. Reposicionar `Adicionar etapa` e `Adicionar campo` para o rodapé dos respectivos cards.
5. Traduzir labels de `Acao` e tipos de ação para PT-BR.
6. Aplicar `admin-primary` nos botões de ação.
7. Trocar `HistoryFiltersBar` sempre aberta por um controle compacto inspirado no `ManagementToolbar` de `/gestao-de-chamados`.

---

## 9. Confirmação de Entendimento

Entendimento consolidado:

- o foco é 100% visual/ergonômico em `/admin/request-config`;
- a prioridade é corrigir rapidamente a UX da aba `Definições` e do filtro da aba `Histórico Geral`;
- a melhor estratégia é um patch de frontend contido, sem mexer em backend nem ampliar o escopo para outras rotas.

