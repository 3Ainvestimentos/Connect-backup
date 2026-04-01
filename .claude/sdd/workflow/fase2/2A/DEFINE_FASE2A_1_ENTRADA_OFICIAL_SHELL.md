# DEFINE: FASE 2A.1 - Entrada Oficial e Shell da Nova Rota

> Generated: 2026-04-01
> Status: Approved for design
> Scope: Fase 2 / 2A.1 - Criacao da rota oficial, namespace novo e entrada no dropdown do usuario
> Parent define: `DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Problem Statement

A Fase 2A precisa ganhar uma superficie oficial propria para gestao operacional de chamados, mas sem ainda misturar bootstrap, listas filtradas e detalhe rico no mesmo primeiro build.

---

## 2. Users

### 2.1. Owner / gestor operacional

Pain points:

- hoje a operacao oficial ainda nao possui uma rota propria de produto;
- a navegacao continua fragmentada entre superfices antigas e piloto;
- nao existe um entrypoint oficial unico no menu de ferramentas.

### 2.2. Executor / responsavel

Pain points:

- ainda entra por superfices antigas para acompanhar trabalho operacional;
- nao existe uma tela oficial nova que unifique o fluxo futuro.

### 2.3. Time de produto / engenharia

Pain points:

- a 2A e grande demais para nascer em um unico build;
- falta separar a criacao da superficie oficial da entrega de dados/acoes mais ricas;
- a transicao precisa preservar os legados sem criar acoplamento a `pilot/*`.

---

## 3. Goals

### MUST

- criar a nova rota oficial `/gestao-de-chamados`;
- criar o namespace oficial da feature em:
  - `src/components/workflows/management/*`
  - `src/lib/workflows/management/*`
- adicionar a entrada `Gestao de chamados` no dropdown do usuario, na secao de ferramentas;
- manter a sidebar apontando apenas para a superficie de abertura de chamados;
- montar um shell inicial da nova tela oficial;
- manter `Gestao de Solicitacoes`, `Minhas Tarefas/Acoes`, `/requests` e `/pilot/facilities` intactos;
- manter este build estritamente additive.

### SHOULD

- deixar a nova superficie com identidade oficial desde o primeiro render;
- preparar a estrutura dos modulos que serao usados em 2A.2, 2A.3 e 2A.4;
- evitar qualquer dependencia semantica do namespace `pilot/*`.

### COULD

- introduzir placeholders claros das abas futuras;
- incluir copy inicial que explique o papel da nova tela oficial.

### WON'T

- nao implementar bootstrap de ownership neste build;
- nao implementar listas oficiais completas neste build;
- nao implementar modal rico neste build;
- nao remover entradas antigas do dropdown ou qualquer rota legado;
- nao alterar a tela de abertura de chamados.

---

## 4. Success Criteria

- a rota `/gestao-de-chamados` existe e renderiza sem erro;
- o usuario ve a nova entrada no dropdown de ferramentas;
- a sidebar principal nao ganha novo item para a tela operacional;
- os atalhos legados continuam funcionando apos a entrega;
- o codigo novo nasce fora de `pilot/*`;
- a base fica pronta para a 2A.2 sem retrabalho estrutural.

### Clarity Score

`15/15`

Motivo:

- escopo pequeno e bem isolado;
- fronteira entre navegacao/shell e dados posteriores ficou clara;
- zero ambiguidade sobre o que permanece legado nesta fase.

---

## 5. Technical Scope

### Frontend

- nova page em `/gestao-de-chamados`;
- novo container oficial de management;
- novos tipos/helpers base da feature;
- atualizacao do dropdown do usuario em `AppLayout`.

### Backend

- fora do escopo desta subetapa.

### Database

- fora do escopo desta subetapa.

### AI

- fora do escopo.

---

## 6. Auth Requirements

- a nova entrada no dropdown segue a mesma regra de convivio temporario da 2A;
- nenhuma nova regra de ownership ou bootstrap precisa ser implementada ainda;
- a tela pode nascer com gate permissivo compativel com a transicao, desde que o contrato final seja fechado na 2A.2.

---

## 7. Out of Scope

- filtros oficiais;
- tabs reais conectadas a dados;
- busca;
- bootstrap de ownership;
- endpoint de detalhe rico;
- timeline, progresso, anexos e `formData`;
- remocao de legado;
- mudanca nas permissoes administrativas.

---

## 8. Dependencias

Depende de:

- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)

Desbloqueia:

- 2A.2 bootstrap, filtros e listas;
- 2A.3 detalhe rico;
- 2A.4 polimento e rollout.

---

## 9. Fonte de Verdade

Este define deriva de:

- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)

Em caso de divergencia:

1. prevalece este define para o escopo da 2A.1;
2. depois o define pai da 2A;
3. depois o design macro da 2A.
