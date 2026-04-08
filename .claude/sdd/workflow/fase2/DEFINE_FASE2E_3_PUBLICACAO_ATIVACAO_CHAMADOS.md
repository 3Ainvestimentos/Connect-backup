# DEFINE: Fase 2E.3 - Publicacao, ativacao e invariantes de versionamento

> Generated: 2026-04-08
> Status: Approved for design
> Scope: Fase 2 / 2E.3 - regras de publicacao, ativacao e consistencia de versoes de workflow type
> Parent document: `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`
> Base document: `BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`

## 1. Problem Statement

Com o editor de rascunho disponivel, ainda falta a camada que valida publicacao, faz a troca atomica da versao ativa e garante as invariantes de versionamento sem introduzir estados ambiguos.

---

## 2. Users

### 2.1. Admin de configuracao de chamados v2

Pain points:

- precisa publicar uma versao apenas quando ela estiver valida para o runtime;
- precisa criar novas versoes sem sobrescrever a publicada atual;
- precisa reativar uma versao anterior com previsibilidade.

### 2.2. Operacao / owners

Pain points:

- dependem de exatamente uma versao ativa por tipo para evitar comportamentos indeterminados;
- precisam saber quando uma versao publicada antiga aparece como `Inativa` apenas na UI;
- precisam confiar que ids de versao sao sequenciais e consistentes.

### 2.3. Runtime / plataforma

Pain points:

- nao pode receber configuracao publicada invalida;
- nao pode conviver com duas versoes ativas do mesmo tipo;
- depende de atualizacao coerente do documento raiz do workflow type.

---

## 3. Goals

### MUST

- permitir criar nova versao apenas como `draft`;
- gerar `versionId` sequencial por transacao, contador ou mecanismo equivalente;
- clonar a ultima versao publicada ao criar um novo rascunho a partir de um tipo existente;
- permitir `Publicar` apenas quando a versao estiver valida para o runtime;
- permitir `Ativar` uma versao anteriormente publicada e hoje inativa;
- garantir que exista exatamente uma versao ativa/publicada por workflow type;
- tratar `Inativa` apenas como estado derivado de UI, sem novo estado persistido;
- atualizar o documento raiz do workflow type para refletir a versao ativa/publicada;
- bloquear publicacao de versao invalida, incluindo ao menos:
  - etapa `action` sem `approverIds`
  - `approverIds` duplicados
  - ausencia de etapa inicial
  - ausencia de etapa final
  - owner invalido
  - campo `select` sem opcoes

### SHOULD

- mostrar diff ou indicacao de mudancas entre rascunho e versao atualmente ativa;
- permitir excluir apenas rascunhos que nunca foram publicados;
- registrar metadata de transicao suficiente para auditoria operacional.

### COULD

- expor validacao previa detalhada antes do clique de publicacao;
- permitir reabrir um rascunho invalido com lista organizada de pendencias.

### WON'T

- nao criar novo estado persistido `inactive`;
- nao redesenhar o runtime de requests;
- nao resolver rollback automatico complexo nesta subetapa;
- nao implementar o grid do Historico Geral.

---

## 4. Success Criteria

- ao criar nova versao de um tipo existente, o sistema gera um `draft` sequencial baseado na ultima publicada;
- uma versao invalida pode ser salva como rascunho, mas nao pode ser publicada;
- ao publicar um rascunho valido, a versao ativa anterior passa a ser exibida como `Inativa` na UI;
- ao ativar versao anterior, a ativa atual deixa de ser a referencia publicada;
- em nenhum momento o sistema persiste duas versoes ativas/publicadas para o mesmo tipo;
- o documento raiz do tipo permanece coerente com a versao ativa;
- as invariantes ficam fechadas o suficiente para design e build separados do editor.

### Clarity Score

`15/15`

Motivo:

- as regras de produto desta subetapa ja foram fechadas pelo define-mae;
- o corte separa com clareza salvar rascunho vs publicar/ativar;
- o restante e detalhamento tecnico de transacao e UX.

---

## 5. Technical Scope

### Frontend

- acoes de `Criar nova versao`, `Publicar` e `Ativar`;
- estados de carregamento, bloqueio e erro para transicoes de versao;
- exibicao de pendencias de validacao antes da publicacao;
- status derivados de UI para versoes.

### Backend / Management

- geracao transacional de `versionId` sequencial;
- clonagem da ultima publicada para novo rascunho;
- validacao forte de publicabilidade;
- troca atomica da versao ativa/publicada;
- atualizacao consistente do documento raiz.

### Database / Firestore

- escrita em `workflowTypes_v2/{workflowTypeId}`;
- escrita em `workflowTypes_v2/{workflowTypeId}/versions/{version}`;
- manutencao do estado persistido em `draft | published`;
- nenhuma introducao de novo estado persistido para `Inativa`.

### Auth

- todas as transicoes administrativas exigem `canManageWorkflowsV2`;
- o backend deve recusar operacoes mesmo que a UI seja manipulada.

### AI

- fora do escopo.

### Testing

- testes de geracao sequencial de `versionId`;
- testes de clonagem da ultima publicada;
- testes de bloqueio de publicacao invalida;
- testes de publicacao com inativacao automatica da anterior;
- testes de ativacao de versao antiga;
- testes de coerencia do documento raiz apos transicoes.

---

## 6. Auth Requirements

- a subetapa depende do mesmo gate `canManageWorkflowsV2`;
- a autorizacao deve ser reforcada nas operacoes de mutacao de versao;
- a leitura de versoes para comparar/publicar nao deve afrouxar isolamento de usuario autenticado.

---

## 7. Out of Scope

- criacao da permissao e da rota base;
- criacao inicial de area ou tipo;
- implementacao do editor completo de rascunho;
- historico geral read-only.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md` | Internal | Required before design/build |
| `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md` | Internal | Required before design/build |
| Fluxo de criacao/edicao de rascunho da `2E.2` | Internal | Pending implementation |
| Runtime v2 consolidado nas fases `2A` a `2D` | Internal | Ready |

---

## 9. Next Step

Produzir `DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md` detalhando:

- mecanismo de sequenciamento de `versionId`;
- contratos de clonagem e publicacao;
- validacoes bloqueantes de publicacao;
- atualizacao atomica do documento raiz e das versoes envolvidas.

---

## 10. Revision History

| Date | Author | Summary |
|------|--------|---------|
| 2026-04-08 | Codex | Recorte do define-mae da Fase 2E para a subetapa 2E.3 |
