# DEFINE: FASE 2A.2 - Bootstrap e Listas Oficiais

> Generated: 2026-04-01
> Status: Approved for design
> Scope: Fase 2 / 2A.2 - Bootstrap oficial, filtros server-side e listas operacionais
> Parent define: `DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Problem Statement

A tela oficial da 2A precisa deixar de ser apenas um shell e passar a operar as filas reais com ownership explicito, filtros estruturantes e listas oficiais sem depender da semantica do piloto.

---

## 2. Users

### 2.1. Owner / gestor operacional

Pain points:

- hoje a visibilidade da fila do owner depende de permissao generica;
- a tela oficial ainda nao distingue claramente ownership real de ausencia de itens;
- faltam filtros oficiais de operacao.

### 2.2. Executor / responsavel

Pain points:

- precisa distinguir claramente o que esta atribuido a ele do que exige acao pendente;
- precisa de filtros uteis mesmo sem possuir ownership;
- nao pode depender de leitura visual ambigua em uma unica lista.

### 2.3. Time de produto / engenharia

Pain points:

- o bootstrap precisa separar ownership de escopo operacional;
- os endpoints de lista precisam evoluir sem quebrar o piloto;
- a nova tela precisa sincronizar filtros e estado pela URL.

---

## 3. Goals

### MUST

- criar `GET /api/workflows/read/management/bootstrap`;
- separar no bootstrap:
  - `ownership`
  - `filterOptions`
- evoluir `current`, `assignments` e `completed` para aceitar filtros oficiais opcionais;
- implementar a toolbar oficial com busca e filtros;
- serializar filtros e tab na URL;
- implementar as listas oficiais:
  - `Chamados atuais`
  - `Atribuicoes e acoes`
  - `Concluidas`
- implementar subtabs explicitas em `Atribuicoes e acoes`:
  - `Atribuidos a mim`
  - `Acoes pendentes para mim`
- manter compatibilidade retroativa com o cliente do piloto.

### SHOULD

- preservar os envelopes HTTP ja validados na Fase 1;
- manter a UX de filtros compartilhavel por link;
- deixar claro no frontend quando uma aba esta indisponivel por capability e nao por vazio operacional.

### COULD

- introduzir indicadores resumidos por aba;
- acrescentar defaults de filtros mais uteis para a operacao oficial.

### WON'T

- nao implementar detalhe rico neste build;
- nao implementar remocao de legados;
- nao introduzir full-text search;
- nao introduzir paginacao como compromisso inicial.

---

## 4. Success Criteria

- bootstrap retorna ownership e filterOptions separados;
- executor sem ownership continua recebendo filtros uteis;
- aba `Chamados atuais` so aparece com capability explicita;
- `Atribuicoes e acoes` diferencia `Atribuidos a mim` e `Acoes pendentes para mim` com subtabs;
- filtros por `requestId`, workflow, area, solicitante, SLA e periodo funcionam;
- piloto continua consumindo os endpoints herdados sem quebra.

### Clarity Score

`14/15`

Motivo:

- as decisoes de produto/arquitetura estao fechadas;
- detalhes finos de implementacao de filtros ficam para o design.

---

## 5. Technical Scope

### Frontend

- `useWorkflowManagement`;
- toolbar oficial;
- panels de listas;
- subtabs da fila operacional;
- URL state.

### Backend

- endpoint novo de bootstrap;
- evolucao dos endpoints de lista;
- filtros server-side opcionais;
- refinamento server-side em memoria quando aplicavel.

### Database

- reaproveita o read-side existente;
- sem novo schema obrigatorio para esta subetapa.

### AI

- fora do escopo.

---

## 6. Auth Requirements

- `Chamados atuais` depende de capability/capacidade explicita de ownership;
- `Atribuicoes e acoes` e `Concluidas` continuam baseadas no escopo operacional do ator;
- filtros disponiveis nao podem ser derivados apenas de ownership;
- authz dos endpoints de lista permanece no backend.

---

## 7. Out of Scope

- endpoint de detalhe rico;
- modal oficial completo;
- renderizacao de `formData`, anexos, timeline e progresso;
- polimento visual final;
- remocao dos atalhos antigos.

---

## 8. Dependencias

Depende de:

- 2A.1 concluida;
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)

Desbloqueia:

- 2A.3 detalhe rico;
- 2A.4 polimento e rollout.

---

## 9. Fonte de Verdade

Este define deriva de:

- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)

Em caso de divergencia:

1. prevalece este define para o escopo da 2A.2;
2. depois o define pai da 2A;
3. depois o design macro da 2A.
