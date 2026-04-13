# DEFINE: Fase 2E.4 - Historico Geral unificado de chamados

> Generated: 2026-04-08
> Status: Approved for design
> Scope: Fase 2 / 2E.4 - grid read-only unificado `Legado + V2` para consulta e auditoria
> Parent document: `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`
> Base document: `BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`

## 1. Problem Statement

A nova tela admin precisa de uma aba de auditoria que una consulta de chamados legados e v2 em um unico grid read-only, preservando suporte completo ao modelo v2 desde o primeiro corte.

---

## 2. Users

### 2.1. Auditoria / operacao

Pain points:

- nao possui uma visao unificada para consultar chamados legados e v2 no contexto da nova tela;
- precisa localizar rapidamente origem, status, owner e periodo sem entrar em modo de edicao;
- precisa de uma leitura segura para acompanhamento operacional.

### 2.2. Admin de configuracao de chamados v2

Pain points:

- precisa validar o impacto de configuracoes sem misturar isso com a aba de `Definicoes`;
- precisa consultar historico sem correr risco de acao destrutiva;
- precisa confiar que a cobertura de `V2` e completa mesmo que o legado use compatibilidade progressiva.

### 2.3. Governanca

Pain points:

- precisa manter a nova tela consistente com o papel de auditoria/read-only do historico;
- precisa evitar que a aba de historico vire um atalho para operacoes administrativas fora do escopo.

---

## 3. Goals

### MUST

- entregar a subaba `Historico Geral` em modo somente leitura;
- exibir grid unificado com itens `Legado + V2` no primeiro corte;
- garantir suporte completo para itens `V2` desde a primeira entrega;
- identificar a origem de cada linha no grid;
- permitir filtros basicos de consulta, incluindo ao menos:
  - origem
  - area
  - workflow type
  - status
  - owner
  - periodo
- permitir abrir detalhe somente leitura quando necessario;
- nao expor acoes de editar, publicar, ativar, excluir ou reprocessar nesta subaba.

### SHOULD

- normalizar colunas principais para que legado e v2 possam ser comparados visualmente;
- suportar estados vazios e inconsistencias parciais do legado sem quebrar a experiencia de `V2`;
- destacar quando uma linha veio de compatibilidade legada.

### COULD

- incluir exportacao futura ou pagina de detalhe ampliado, desde que fora do primeiro corte;
- incluir filtros salvos ou presets operacionais em iteracao posterior.

### WON'T

- nao permitir mutacao de qualquer request a partir do Historico Geral;
- nao depender de migracao completa do legado para liberar a subetapa;
- nao alterar runtime, inbox ou telas de solicitacao do usuario.

---

## 4. Success Criteria

- o Historico Geral pode ser acessado a partir da nova tela com a mesma permissao `canManageWorkflowsV2`;
- o grid mostra itens `Legado` e `V2` em uma unica lista;
- a origem de cada linha fica clara na UI;
- `V2` possui cobertura completa de leitura no primeiro corte;
- falhas ou limitacoes do legado nao impedem o funcionamento do grid para `V2`;
- nenhuma acao de escrita aparece na aba;
- o define fica suficiente para design sem reabrir decisoes de produto.

### Clarity Score

`14/15`

Motivo:

- o objetivo do corte e claro e quase todo read-only;
- a principal variavel tecnica e a estrategia de agregacao legado + v2, nao uma decisao funcional nova;
- o define-mae ja fechou que o primeiro corte precisa ser unificado e com suporte completo para `V2`.

---

## 5. Technical Scope

### Frontend

- subaba `Historico Geral` na nova rota admin;
- grid/tabela read-only com filtros, badges de origem e navegacao de detalhe;
- nenhum CTA de escrita.

### Backend / Read Models

- leitura unificada ou agregada de fontes legadas e v2;
- adaptadores de shape para colunas comuns do grid;
- prioridade de robustez para fonte `V2`;
- tolerancia a lacunas do legado sem quebrar a consulta.

### Database / Firestore

- leitura das colecoes/documentos necessarios para requests legados;
- leitura das colecoes/documentos necessarios para requests `V2`;
- nenhuma mudanca de schema exigida por esta subetapa.

### Auth

- gate pela mesma permissao `canManageWorkflowsV2`;
- leitura somente para usuarios autenticados com acesso administrativo correspondente.

### AI

- fora do escopo.

### Testing

- testes do grid unificado com mistura de linhas `Legado` e `V2`;
- testes de filtros;
- testes de detalhe somente leitura;
- testes que garantam funcionamento pleno quando apenas `V2` estiver disponivel;
- testes de ausencia de acoes mutativas.

---

## 6. Auth Requirements

- a subetapa herda o gate `canManageWorkflowsV2` ja definido na `2E.1`;
- nenhuma leitura do historico pode ser exposta fora do contexto autenticado;
- a aba deve continuar estritamente read-only para usuarios autorizados.

---

## 7. Out of Scope

- criacao/edicao de areas, tipos ou versoes;
- publicacao e ativacao de versoes;
- qualquer operacao de manutencao do historico pela UI;
- retrofit completo do legado alem do necessario para compor o grid unificado.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md` | Internal | Ready |
| `DEFINE_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md` | Internal | Required before design/build |
| Shell, rota e permissao da `2E.1` | Internal | Pending implementation |
| Read side legado existente | Internal | Ready |
| Read side `V2` consolidado | Internal | Ready |

---

## 9. Next Step

Produzir `DESIGN_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md` detalhando:

- estrategia de agregacao `Legado + V2`;
- contrato de colunas comuns do grid;
- filtros e detalhe read-only;
- fallback para lacunas de compatibilidade legada sem afetar `V2`.

---

## 10. Revision History

| Date | Author | Summary |
|------|--------|---------|
| 2026-04-08 | Codex | Recorte do define-mae da Fase 2E para a subetapa 2E.4 |
