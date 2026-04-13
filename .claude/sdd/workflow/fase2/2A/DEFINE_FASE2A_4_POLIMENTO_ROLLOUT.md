# DEFINE: FASE 2A.4 - Polimento e Rollout Controlado

> Generated: 2026-04-01
> Status: Approved for design
> Scope: Fase 2 / 2A.4 - Acabamento visual, hardening e readiness da transicao
> Parent define: `DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Problem Statement

Depois de rota, listas e detalhe rico estarem entregues, a 2A ainda precisa de um build proprio para acabamento, robustez e readiness de transicao, sem misturar polimento com backlog estrutural.

---

## 2. Users

### 2.1. Operacao do dia a dia

Pain points:

- uma tela funcional ainda pode falhar em qualidade percebida se loading, empty states e erros nao estiverem prontos;
- a convivencia com os atalhos antigos precisa ser clara enquanto a transicao acontece.

### 2.2. Produto / rollout

Pain points:

- a nova superficie precisa estar polida o suficiente para uso real;
- a troca definitiva nao pode acontecer sem readiness clara e smoke final.

### 2.3. Engenharia

Pain points:

- sem um build de hardening, a 2A pode fechar com arestas espalhadas;
- backlog estrutural de subetapas anteriores tende a contaminar o polimento se essa fronteira nao for fechada.

---

## 3. Goals

### MUST

- refinar acabamento visual da 2A;
- endurecer loading, erro e estados vazios;
- revisar hardening da navegacao, filtros, modal e mutacoes;
- fechar a estrategia de convivencia no dropdown do usuario;
- executar smoke final da 2A;
- deixar a macroetapa pronta para substituicao controlada posterior.

### SHOULD

- melhorar hierarquia visual, copy e badges;
- reduzir friccao perceptiva na tela oficial;
- documentar readiness e riscos remanescentes.

### COULD

- ajustar microinteracoes e feedbacks finos;
- consolidar defaults de filtros se isso ajudar no uso real.

### WON'T

- nao remover definitivamente os legados neste build;
- nao absorver backlog estrutural de 2A.1, 2A.2 ou 2A.3;
- nao iniciar a 2B ou a 2C.

---

## 4. Success Criteria

- a tela oficial opera com acabamento consistente;
- loading, erro e empty states estao legiveis e robustos;
- a convivencia com os atalhos antigos no dropdown esta deliberada e clara;
- a 2A passa em smoke final;
- a macroetapa fica pronta para transicao controlada, sem remocao imediata dos legados.

### Clarity Score

`14/15`

Motivo:

- o recorte de hardening e rollout esta claro;
- detalhes finos de visual e copy pertencem ao design.

---

## 5. Technical Scope

### Frontend

- refino visual da tela oficial;
- tratamento de estados edge;
- ajustes de navegacao e convivencia no dropdown;
- hardening da experiencia.

### Backend

- sem novos contratos obrigatorios, salvo pequenos ajustes aditivos vindos do hardening.

### Database

- fora do escopo.

### AI

- fora do escopo.

---

## 6. Auth Requirements

- nenhuma mudanca estrutural de auth e requisito desta subetapa;
- a convivencia temporaria com atalhos antigos deve respeitar as mesmas permissoes e gates da transicao definida para a 2A.

---

## 7. Out of Scope

- remocao definitiva de `Gestao de Solicitacoes`, `Minhas Tarefas/Acoes` ou `/pilot/facilities`;
- redefinicao de contratos de dados centrais;
- expansao para workflows restantes;
- tela administrativa de workflows.

---

## 8. Dependencias

Depende de:

- 2A.1 concluida;
- 2A.2 concluida;
- 2A.3 concluida;
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)

Fecha:

- readiness da macroetapa 2A para transicao controlada.

---

## 9. Fonte de Verdade

Este define deriva de:

- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)

Em caso de divergencia:

1. prevalece este define para o escopo da 2A.4;
2. depois o define pai da 2A;
3. depois o design macro da 2A.
