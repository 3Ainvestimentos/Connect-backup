# DEFINE: FASE 2A.3 - Detalhe Rico do Request

> Generated: 2026-04-01
> Status: Approved for design
> Scope: Fase 2 / 2A.3 - Contrato de detalhe rico e modal oficial do request
> Parent define: `DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Problem Statement

As listas oficiais da 2A nao podem carregar todo o contexto do request, mas a experiencia oficial so fica completa quando o usuario consegue abrir um detalhe rico com `formData`, anexos, progresso e timeline.

---

## 2. Users

### 2.1. Owner / gestor operacional

Pain points:

- nao consegue ver no modal oficial todos os dados submetidos;
- precisa de um detalhe mais rico para decidir atribuicao, acompanhamento e encerramento.

### 2.2. Executor / responsavel

Pain points:

- precisa operar com contexto completo do request;
- o anexo precisa aparecer como parte oficial da experiencia, nao como validacao externa.

### 2.3. Solicitante / usuario autorizado

Pain points:

- a leitura da solicitacao ainda nao expoe claramente o que foi enviado;
- a timeline e o progresso ainda nao aparecem de forma canônica na UI oficial.

---

## 3. Goals

### MUST

- criar um endpoint separado de detalhe rico para request;
- validar authz de leitura no servidor;
- expor no detalhe:
  - `summary`
  - `permissions`
  - `formData`
  - `attachments`
  - `progress`
  - `timeline`
- renderizar um modal oficial com esses blocos;
- tratar anexos de campos `file` como parte normal do detalhe;
- nao inflar os contratos de listagem existentes.

### SHOULD

- mapear labels de campos conforme a versao publicada;
- apresentar progresso de etapas de forma clara;
- manter as acoes operacionais coerentes com as permissoes do ator.

### COULD

- destacar melhor eventos criticos na timeline;
- enriquecer a renderizacao de anexos com affordances visuais adicionais.

### WON'T

- nao redesenhar os endpoints de lista;
- nao mover o cliente para leitura direta de `workflows_v2`;
- nao concluir o rollout visual final neste build.

---

## 4. Success Criteria

- o modal oficial exibe `formData`, anexos, timeline e progresso;
- o endpoint de detalhe respeita authz de leitura;
- anexos podem ser acessados oficialmente pela UI;
- listas permanecem leves e sem detalhe rico embutido;
- a nova tela nao depende de Firestore manual para entender o request.

### Clarity Score

`15/15`

Motivo:

- problema, fronteira de contrato e resultado esperado estao todos bem definidos;
- dependencia de listagem vs. detalhe ficou clara.

---

## 5. Technical Scope

### Frontend

- modal oficial de detalhe;
- componentes de `formData`, anexos, timeline e progresso;
- integracao do modal com a tela oficial.

### Backend

- `GET /api/workflows/read/requests/[requestId]`;
- composer de detalhe rico;
- authz de leitura.

### Database

- composicao de leitura a partir de `workflows_v2` + versao publicada em `workflowTypes_v2`;
- sem alteracao obrigatoria do schema base.

### AI

- fora do escopo.

---

## 6. Auth Requirements

O detalhe deve ser legivel, no minimo, por:

- owner vigente;
- requester;
- responsavel atual;
- destinatario de acao pendente;
- participante operacional.

A validacao deve ocorrer no servidor.

---

## 7. Out of Scope

- polimento final da 2A;
- remocao de modais legados;
- mudanca nas listas resumidas;
- rollout final da tela nova.

---

## 8. Dependencias

Depende de:

- 2A.2 concluida;
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)

Desbloqueia:

- 2A.4 polimento e rollout.

---

## 9. Fonte de Verdade

Este define deriva de:

- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)

Em caso de divergencia:

1. prevalece este define para o escopo da 2A.3;
2. depois o define pai da 2A;
3. depois o design macro da 2A.
