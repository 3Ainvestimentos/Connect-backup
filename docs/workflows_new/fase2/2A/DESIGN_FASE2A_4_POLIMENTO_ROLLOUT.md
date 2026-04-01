# DESIGN: FASE 2A.4 - Polimento e Rollout Controlado

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A.4 - Acabamento visual, hardening e readiness de transicao
> Parent artifacts:
> - `/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`
> - `/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Objetivo

Consolidar a 2A como superficie pronta para uso controlado, refinando acabamento visual, estados de UX, hardening e estrategia de convivencia com os legados antes de qualquer substituicao definitiva.

## 2. Escopo

Este build cobre:

- polimento visual da experiencia oficial;
- refinamento de loading, erro e empty states;
- ajustes finos de copy, badges, densidade e hierarquia visual;
- hardening de invalidacoes, estados edge e navegacao;
- definicao da convivencia temporaria no dropdown do usuario;
- smoke final da 2A e readiness para transicao controlada.

Este build nao cobre:

- remocao definitiva dos arquivos/rotas legadas;
- rollout da Fase 2B;
- tela administrativa da Fase 2C.

## 3. Decisoes Fechadas

- a 2A deve nascer mais polida, nao apenas funcional;
- os atalhos legados permanecem no primeiro rollout;
- a remocao definitiva dos legados depende de testes end-to-end posteriores;
- este build nao deve absorver backlog estrutural de 2A.1, 2A.2 ou 2A.3.

## 4. File Manifest

| Ordem | Caminho | Acao | Responsabilidade |
|------|---------|------|------------------|
| 1 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Update | Refinar layout, estados vazios e hierarquia visual |
| 2 | [src/components/workflows/management/ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx) | Update | Polir busca, filtros e feedback |
| 3 | [src/components/workflows/management/RequestList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestList.tsx) | Update | Refinar cards e densidade de leitura |
| 4 | [src/components/workflows/management/RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) | Update | Refinar responsividade e estados de erro |
| 5 | [src/lib/workflows/management/presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/presentation.ts) | Update | Ajustes finos de copy, badges e formatacao |
| 6 | [src/components/layout/AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx) | Update | Definir convivio temporario do dropdown com a nova rota e os atalhos antigos |
| 7 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Update | Cobrir estados refinados, convivio e regressao basica |

## 5. Implementacao Esperada

### 5.1. Polimento visual

- hierarquia mais clara entre tabs, subtabs e cards;
- toolbar mais legivel;
- estados vazios e mensagens de erro mais robustos;
- acabamento coerente com a superficie oficial do produto.

### 5.2. Hardening

- revisar invalidacoes e reloads apos mutacoes;
- garantir abertura/fechamento seguro do modal;
- validar comportamento com filtros e deep-links;
- revisar fallbacks quando endpoints falharem.

### 5.3. Rollout controlado

- `/gestao-de-chamados` permanece convivendo com atalhos antigos;
- a tela nova deve estar pronta para uso controlado;
- a exclusao de legados nao faz parte deste build.

## 6. Testing Strategy

- smoke de navegacao pelo dropdown do usuario;
- smoke de tabs, subtabs, filtros e modal;
- validacao visual/manual dos estados vazios/erro/loading;
- regressao basica dos atalhos legados ainda presentes.

## 7. Regra de Fechamento

Ao concluir o build da 2A.4, registrar obrigatoriamente em:

- [implementation_progress_fase2A.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/2A/implementation_progress_fase2A.md)

O registro deve incluir:

- acabamento entregue;
- estrategia final de convivio no dropdown;
- smoke final executado;
- readiness da 2A para inicio de substituicao controlada do fluxo principal.
