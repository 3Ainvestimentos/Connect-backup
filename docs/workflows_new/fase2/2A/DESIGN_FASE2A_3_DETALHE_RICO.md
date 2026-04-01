# DESIGN: FASE 2A.3 - Detalhe Rico do Request

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A.3 - Endpoint de detalhe rico e modal oficial
> Parent artifacts:
> - `/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`
> - `/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Objetivo

Entregar o detalhe rico oficial do request, com `formData`, anexos, progresso e timeline, sem inflar os contratos de listagem e sem leitura direta do cliente em `workflows_v2`.

## 2. Escopo

Este build cobre:

- `GET /api/workflows/read/requests/[requestId]`;
- composer backend de detalhe rico;
- `assertCanReadRequest()`;
- modal oficial de detalhe;
- renderizacao de `formData`;
- renderizacao de anexos;
- progresso de etapas;
- timeline de eventos.

Este build nao cobre:

- polimento visual final da 2A;
- remocao dos modais legados;
- rollout definitivo da tela unificada.

## 3. Decisoes Fechadas

- detalhe rico e contrato separado das listas;
- cliente nao le `workflows_v2` diretamente;
- authz de leitura do detalhe e validada no servidor;
- anexos sao derivados de campos `type: 'file'` da versao publicada + `formData`.

## 4. File Manifest

| Ordem | Caminho | Acao | Responsabilidade |
|------|---------|------|------------------|
| 1 | [src/lib/workflows/runtime/authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts) | Update | Adicionar `assertCanReadRequest()` |
| 2 | [src/lib/workflows/read/detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts) | Create | Composer de detalhe rico |
| 3 | [src/app/api/workflows/read/requests/[requestId]/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/requests/[requestId]/route.ts) | Create | Endpoint de detalhe rico |
| 4 | [src/lib/workflows/management/api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts) | Update | Cliente do detalhe do request |
| 5 | [src/hooks/use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts) | Update | Query de detalhe e invalidacao pos-mutacoes |
| 6 | [src/components/workflows/management/RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) | Create | Modal oficial |
| 7 | [src/components/workflows/management/RequestFormData.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestFormData.tsx) | Create | Render de campos submetidos e anexos |
| 8 | [src/components/workflows/management/RequestTimeline.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestTimeline.tsx) | Create | Timeline de eventos |
| 9 | [src/components/workflows/management/RequestProgress.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestProgress.tsx) | Create | Progresso de etapas |
| 10 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Update | Integrar abertura do modal |
| 11 | [src/lib/workflows/read/__tests__/read-api-contract.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/read-api-contract.test.js) | Update | Cobrir detalhe rico |
| 12 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Update | Cobrir abertura do modal e render do detalhe |

## 5. Implementacao Esperada

### 5.1. Contrato do detalhe

O endpoint deve retornar pelo menos:

- `summary`
- `permissions`
- `formData`
- `attachments`
- `progress`
- `timeline`

### 5.2. Authz

`assertCanReadRequest()` deve permitir leitura para:

- owner vigente;
- requester;
- responsavel atual;
- destinatario de acao pendente;
- participante operacional.

### 5.3. Modal oficial

O modal deve exibir:

- bloco operacional;
- bloco `Dados da solicitacao`;
- bloco de anexos;
- timeline;
- progresso de etapas.

## 6. Testing Strategy

- authz de leitura do detalhe;
- mapeamento de `formData` scalar e `file`;
- render de anexo oficial;
- timeline cronologica;
- progresso com etapa atual e anteriores.

## 7. Regra de Fechamento

Ao concluir o build da 2A.3, registrar obrigatoriamente em:

- [implementation_progress_fase2A.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/2A/implementation_progress_fase2A.md)

O registro deve incluir:

- contrato final do endpoint de detalhe;
- comportamento do modal;
- validacoes executadas;
- riscos remanescentes para a 2A.4.
