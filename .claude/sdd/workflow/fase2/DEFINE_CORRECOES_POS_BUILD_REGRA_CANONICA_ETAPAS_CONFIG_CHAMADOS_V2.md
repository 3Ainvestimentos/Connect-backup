# DEFINE: Correcoes Pos-Build da Regra Canonica de Etapas no Config. de Chamados V2

> Generated: 2026-04-16
> Status: Approved for design
> Scope: Fase 2 / fechamento dos achados remanescentes apos o build da regra canonica de etapas no Config. de Chamados V2
> Base document: `DESIGN_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md`
> Parent define: `DEFINE_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md`

## 1. Problem Statement

O build da regra canonica fechou a derivacao principal de `statusKey`, `kind` e `initialStepId`, mas a revisao final ainda encontrou lacunas de integridade, limpeza de contrato e cobertura que podem deixar o publish curando drafts malformados silenciosamente, expor issues redundantes no readiness e manter estado tecnico morto no editor.

---

## 2. Users

### 2.1. Admin de configuracao de workflows v2

Pain points:

- o readiness deveria mostrar apenas erros reais que o usuario ainda consegue produzir, sem taxonomia redundante;
- o editor ja nao exibe os campos tecnicos, mas ainda carrega estado interno desnecessario ligado a `initialStepId` e semantica tecnica;
- drafts malformados nao podem ser “consertados” silenciosamente no publish, porque isso mascara problema estrutural de configuracao.

### 2.2. Engenharia / manutencao do admin-config

Pain points:

- o helper canonico virou a peca central do contrato, mas ainda sem cobertura unitaria direta;
- `canonicalizeVersionSteps()` nao pode eliminar inconsistencias de `stepOrder` antes da validacao, ou a publicacao passa a ter efeito corretivo silencioso;
- manter checks mortos em `publishability.ts` aumenta ruido cognitivo e dificulta entender qual e o contrato real do readiness.

### 2.3. Runtime / governanca operacional

Pain points:

- a publicacao precisa bloquear drafts cuja `stepOrder` referencia ids ausentes, e nao encurtar a ordem automaticamente;
- o contrato do editor deve refletir o modelo novo de forma limpa, sem continuar transportando campos que o backend ja ignora;
- o time quer fechar a entrega com testes coerentes com o contrato final, nao apenas com suites indiretas.

---

## 3. Goals

### MUST

- impedir que a canonicalizacao de versoes elimine referencias ausentes de `stepOrder` antes da validacao;
- garantir que drafts com `stepOrder` inconsistente continuem falhando explicitamente em `publishability` e no caminho de publicacao;
- simplificar o contrato visivel de `publishReadiness` para manter apenas issues realmente alcancaveis no fluxo suportado;
- remover do readiness visivel os checks mortos herdados da taxonomia antiga de steps;
- remover `initialStepId` de `WorkflowDraftFormValues` e parar de tratá-lo como parte do contrato editavel do form;
- parar de reenviar `initialStepId` como decisao do editor no payload de save;
- adicionar cobertura unitaria direta para `canonical-step-semantics.ts`, cobrindo pelo menos:
  - derivacao correta com `0`, `1`, `2`, `3` e `4+` etapas;
  - preservacao de ordem e ids;
  - comportamento de `canonicalizeVersionSteps()` diante de `stepOrder` inconsistente;
- alinhar testes existentes para que nao dependam de assercoes vacuamente verdadeiras sobre checks mortos.

### SHOULD

- manter checks defensivos internos no backend apenas onde fizer sentido como assert tecnica, sem reintroduzi-los como issue normal de UX;
- deixar explicito nos testes de `publishability` quais codes permanecem visiveis para o usuario apos a simplificacao;
- preservar o comportamento atual do publish que materializa os campos canonicos sem reabrir o design principal da feature.

### COULD

- acrescentar comentario curto no helper canonico explicando por que referencias ausentes de `stepOrder` nao devem ser silenciosamente filtradas;
- incluir teste de regressao no publish cobrindo explicitamente um draft com referencia ausente em `stepOrder`.

### WON'T

- nao reabrir a regra canonica principal de `start -> work(s) -> final`;
- nao mexer no runtime operacional alem do necessario para preservar o contrato atual;
- nao redesenhar novamente a UX do editor;
- nao criar migracao retroativa de drafts antigos;
- nao alterar historico/requester, que ja ficaram fora desta rodada de correcao.

---

## 4. Success Criteria

- `canonicalizeVersionSteps()` deixa de remover silenciosamente entradas ausentes de `stepOrder`;
- um draft com `stepOrder` apontando para `stepId` inexistente falha de forma explicita em readiness/publicacao;
- `publishReadiness` deixa de expor os checks mortos de taxonomia antiga de steps;
- o readiness de steps fica reduzido aos erros efetivamente alcancaveis no fluxo suportado;
- `WorkflowDraftFormValues` nao contem mais `initialStepId`;
- o payload de save do editor nao reenvía `initialStepId` como decisao do cliente;
- existe suite unitaria dedicada para `canonical-step-semantics.ts`;
- os testes de `publishability` deixam de validar ausencia de issues que nao podem mais ocorrer.

### Clarity Score

`14/15`

Motivo:

- os achados remanescentes sao pequenos, concretos e diretamente derivados da revisao da implementacao;
- a regra principal ja esta fechada, entao esta rodada trata apenas integridade de validacao, limpeza de contrato e cobertura;
- nao ha dependencia de nova discovery funcional para seguir ao design.

---

## 5. Technical Scope

### Backend / Admin Config

- ajustar [canonical-step-semantics.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/canonical-step-semantics.ts) para preservar inconsistencias relevantes de `stepOrder` ate a fase de validacao, sem “healing” silencioso;
- revisar [publishability.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publishability.ts) para remover issues mortas do contrato visivel de readiness;
- preservar apenas os checks de steps que ainda fazem sentido para o fluxo suportado, como:
  - ordem vazia
  - ids ausentes na ordem
  - menos de `3` etapas
  - validacoes reais de `action`
- manter o caminho de publicacao coerente com esse contrato, sem afrouxar bloqueios de integridade estrutural.

### Frontend / Editor

- remover `initialStepId` do shape de [editor/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/types.ts) referente ao form;
- ajustar [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx) para que o form trabalhe apenas com:
  - geral
  - acesso
  - fields
  - steps
- manter `initialStepId` apenas no DTO read-only retornado pelo backend, quando ainda for util como dado derivado.

### Database / Firestore

- nenhuma nova colecao;
- nenhuma migracao de dados;
- nenhuma mudanca de schema persistido fora do ajuste de comportamento sobre como drafts invalidos sao validados.

### Runtime

- sem mudanca funcional de protocolo;
- apenas preservar a integridade do contrato ja implementado.

### Testing

- criar `canonical-step-semantics.test.ts` para cobrir diretamente o helper central;
- ajustar `publishability.test.ts` para refletir a taxonomia final de readiness;
- manter `draft-repository.test.ts` e `runtime-use-cases.test.js` verdes sem ampliar escopo desnecessario;
- se necessario, adicionar cobertura de publish para draft com `stepOrder` inconsistente.

### AI

- fora do escopo.

---

## 6. Auth Requirements

- a correcao herda o mesmo gate administrativo `canManageWorkflowsV2`;
- o backend continua sendo a fonte de verdade para bloquear drafts estruturalmente invalidos;
- nenhuma correcao desta rodada pode transferir para a UI a responsabilidade exclusiva por detectar inconsistencias de ordem/ids;
- nenhuma mudanca em JWT, sessao, isolamento entre usuarios ou permissoes por owner/allowed users.

---

## 7. Out of Scope

- mudar novamente a regra canonica de steps;
- reabrir a discussao sobre `statusKey` categorico versus granular;
- alterar o runtime para novos comportamentos de atribuicao/advance/finalize;
- reabrir correcoes de labels humanas em historico/requester;
- implementar compatibilidade retroativa sofisticada para drafts antigos.

---

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DESIGN_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md` | Internal | Ready |
| Build atual da regra canonica ja aplicado | Internal | Ready |
| Review findings da implementacao atual | Internal | Closed |
| `BUILD_REPORT_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md` | Internal | Ready |

---

## 9. Next Step

Ready for `/design CORRECOES_POS_BUILD_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2` para fechar:

- estrategia exata para preservar erro de `stepOrder` inconsistente sem healing silencioso;
- taxonomia final de issues de steps em `publishReadiness`;
- delta preciso de tipos e submit do editor sem `initialStepId`;
- matriz de testes diretos do helper `canonical-step-semantics.ts`.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex | Initial define for post-build corrections of the canonical step semantics feature, covering validation integrity, readiness simplification, editor contract cleanup and direct helper coverage |
