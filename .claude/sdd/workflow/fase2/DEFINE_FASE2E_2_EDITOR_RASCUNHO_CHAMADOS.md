# DEFINE: Fase 2E.2 - Criacao de area, workflow type e editor de rascunho

> Generated: 2026-04-08
> Status: Approved for design
> Scope: Fase 2 / 2E.2 - fluxo de escrita inicial para criar area, criar tipo e salvar/editar rascunho
> Parent document: `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`
> Base document: `BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`

## 1. Problem Statement

Depois de existir a superficie administrativa e o catalogo read-only, ainda falta o fluxo controlado para criar novas areas, abrir novos workflow types e editar rascunhos sem forcar publicacao imediata.

---

## 2. Users

### 2.1. Admin de configuracao de chamados v2

Pain points:

- nao consegue cadastrar nova area sem recorrer a operacao tecnica ou UI legada;
- nao consegue criar um novo tipo no modelo `workflowTypes_v2`;
- nao consegue iniciar configuracao incremental de um fluxo novo ou de uma nova versao como rascunho.

### 2.2. Owner / configurador funcional

Pain points:

- precisa salvar trabalho incompleto sem quebrar o runtime;
- precisa configurar `allowedUserIds` de forma simples, sem UX pesada;
- precisa manter ids tecnicos sob controle automatico para evitar erro humano.

### 2.3. Governanca de processo

Pain points:

- precisa garantir que tipo novo nasce com estrutura minima padronizada;
- precisa impedir manipulacao manual de `workflowTypeId` e `versionId`;
- precisa manter `workflowAreas` como colecao propria sem expor detalhes internos desnecessarios.

---

## 3. Goals

### MUST

- permitir criar nova area em `workflowAreas` com os metadados de UI necessarios, sem expor `storageFolderPath` na interface;
- persistir `storageFolderPath` conforme regra ja existente, mesmo oculto da UI;
- permitir criar novo workflow type selecionando area, nome, descricao inicial, owner e `allowedUserIds`;
- gerar `workflowTypeId` automaticamente e mante-lo nao editavel;
- ao criar workflow type, criar tambem:
  - documento raiz do tipo
  - `v1` em estado `draft`
- fazer desta subetapa a dona explicita da criacao de qualquer versao em estado `draft`, inclusive novas versoes derivadas da ultima publicada de um tipo existente;
- permitir abrir editor dedicado para o rascunho;
- permitir `Salvar rascunho` mesmo com configuracao incompleta;
- incluir `allowedUserIds` no editor com UX simples:
  - `Todos`
  - `Lista especifica`
- permitir editar configuracao geral, campos e etapas do rascunho sem exigir publicacao;
- impedir edicao manual de ids internos de tipo, versao, campo ou etapa sempre que forem derivados pela aplicacao.

### SHOULD

- permitir validacoes leves durante a edicao, sem bloquear o salvamento do rascunho incompleto;
- sinalizar visualmente pendencias que bloqueiam futura publicacao.

### COULD

- permitir duplicar blocos de campos/etapas dentro do rascunho para acelerar configuracao;
- mostrar preview resumido do impacto de `allowedUserIds`.

### WON'T

- nao publicar versao nesta subetapa;
- nao ativar versao inativa;
- nao impor todas as invariantes finais no momento do salvamento do rascunho;
- nao implementar o Historico Geral.

---

## 4. Success Criteria

- um admin com `canManageWorkflowsV2` consegue criar nova area sem tocar em `storageFolderPath` na UI;
- um admin consegue criar novo tipo e o sistema persiste automaticamente documento raiz + `v1 draft`;
- um admin consegue criar nova versao rascunho de um tipo existente a partir da ultima publicada, sem publicar nem ativar nessa subetapa;
- `workflowTypeId` nunca aparece como campo editavel ao usuario;
- o editor de rascunho permite salvar configuracao incompleta sem promover a versao;
- `allowedUserIds` pode ser configurado por UX simples e persiste no modelo esperado;
- a tela sinaliza claramente o que e rascunho e o que ainda nao esta apto para publicar;
- o recorte fica pronto para um build sem depender da entrega do Historico Geral.

### Clarity Score

`14/15`

Motivo:

- o objetivo funcional esta bem fechado;
- a principal fronteira com `2E.3` e clara: salvar/editar rascunho entra aqui, publicar/ativar fica fora;
- resta apenas o detalhamento tecnico do editor no design.

---

## 5. Technical Scope

### Frontend

- formularios/modais para criar area e criar workflow type;
- editor dedicado de versao rascunho;
- UX simples para `allowedUserIds`;
- indicadores de pendencias de publicacao sem bloquear `Salvar rascunho`.

### Backend / Management

- comando para criar area em `workflowAreas`;
- comando para criar workflow type com geracao automatica de `workflowTypeId`;
- comando para criar `v1 draft` junto ao documento raiz do tipo;
- comando para criar nova versao `draft` de um tipo existente por clonagem da ultima publicada;
- comando para salvar atualizacoes de rascunho;
- validacoes de escrita que preservem integridade estrutural minima sem exigir versao publicavel.

### Database / Firestore

- escrita em `workflowAreas`;
- escrita em `workflowTypes_v2/{workflowTypeId}`;
- escrita em `workflowTypes_v2/{workflowTypeId}/versions/1`;
- escrita em `workflowTypes_v2/{workflowTypeId}/versions/{n}` para novos drafts subsequentes;
- persistencia de `storageFolderPath` sem edicao pela nova UI;
- nenhum novo estado persistido alem de `draft | published`.

### Auth

- todas as operacoes de criacao e edicao exigem `canManageWorkflowsV2`;
- a permissoes legadas nao devem autorizar escrita nesta superficie por acidente.

### AI

- fora do escopo.

### Testing

- testes de criacao de area com ocultacao de `storageFolderPath` na UI;
- testes de criacao de workflow type com geracao automatica de `workflowTypeId`;
- testes de criacao atomica do documento raiz + `v1 draft`;
- testes de criacao de nova versao draft por clonagem da ultima publicada;
- testes de salvamento de rascunho incompleto;
- testes de persistencia e leitura de `allowedUserIds`.

---

## 6. Auth Requirements

- a subetapa herda o gate `canManageWorkflowsV2` definido em `2E.1`;
- operacoes de criacao/edicao precisam validar permissao na camada administrativa e nao apenas no cliente;
- o usuario autenticado deve continuar isolado ao seu proprio contexto de sessao e permissao.

---

## 7. Out of Scope

- publicar versao;
- ativar versao inativa;
- reconciliar automaticamente mais de uma versao publicada;
- grid do Historico Geral unificado.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md` | Internal | Required before design/build |
| Catalogo read-only, rota e permissao nova da `2E.1` | Internal | Pending implementation |
| Modelo `workflowAreas` + `workflowTypes_v2` + `versions/{n}` | Internal | Ready |

---

## 9. Next Step

Produzir `DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md` detalhando:

- fluxo de criacao de area;
- fluxo de criacao de workflow type com geracao de `workflowTypeId`;
- fluxo de criacao de novo draft por clonagem da ultima publicada;
- shape do editor de rascunho;
- regras de salvamento permissivo vs validacoes informativas.

---

## 10. Revision History

| Date | Author | Summary |
|------|--------|---------|
| 2026-04-08 | Codex | Recorte do define-mae da Fase 2E para a subetapa 2E.2 |
