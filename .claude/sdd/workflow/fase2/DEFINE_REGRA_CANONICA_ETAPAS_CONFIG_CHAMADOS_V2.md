# DEFINE: Regra canonica de etapas no Config. de Chamados V2

> Generated: 2026-04-16
> Status: Approved for design
> Scope: Fase 2 / correcao de invariantes canonicas do editor e da persistencia de etapas no Config. de Chamados V2
> Parent document: `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`
> Source brainstorm: `BRAINSTORM_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md`

## 1. Problem Statement

O editor de `Config. de Chamados V2` ainda permite que `statusKey`, `kind` e `initialStepId` sejam tratados como campos configuraveis, mas esses valores fazem parte do contrato operacional real do runtime; sem uma invariavel canonica no backend, o sistema continua exposto a versoes validas na UI e inconsistentes na execucao.

---

## 2. Users

### 2.1. Admin de configuracao de chamados v2

Pain points:

- hoje pode montar etapas visualmente coerentes, mas ainda salvar semantica tecnica inconsistente para o runtime;
- nao tem guardrail forte para impedir erro humano em `statusKey`, `kind` e etapa inicial;
- pode achar que esconder campos na UI resolve o problema, quando o backend ainda aceitaria payload invalido.

### 2.2. Engenharia / plataforma de workflows

Pain points:

- o runtime ja depende de `initialStepId`, `statusKey` e `kind`, entao a semantica das etapas nao pode ficar descentralizada em clientes;
- a validacao atual de publishability conflita com a regra desejada de varias etapas intermediarias com o mesmo `statusKey`;
- sem uma fonte unica de verdade, novos clientes ou automacoes podem reintroduzir drift na persistencia.

### 2.3. Operacao / governanca do produto

Pain points:

- a equipe precisa garantir que todo workflow publicado respeite o mesmo canon operacional;
- regressao nessa area quebra atribuicao inicial, avanco de etapa ou finalizacao;
- a governanca quer manter flexibilidade de varias etapas operacionais sem voltar a expor semantica sensivel ao usuario final do configurador.

---

## 3. Goals

### MUST

- tornar `statusKey`, `kind` e `initialStepId` invariantes derivadas pelo backend administrativo, e nao campos confiados ao payload do cliente;
- fechar a regra canonica de etapas como:
  - primeira etapa = `solicitacao_aberta` + `start`
  - etapas intermediarias = `em_andamento` + `work`
  - ultima etapa = `finalizado` + `final`
- exigir que toda versao tenha no minimo `3` etapas, garantindo pelo menos uma etapa intermediaria `work`;
- derivar `initialStepId` sempre da primeira etapa em `stepOrder`;
- impedir na UI a edicao manual de `statusKey`, `kind` e `initialStepId`;
- fazer o save do draft e a publicacao ignorarem qualquer `statusKey`, `kind` ou `initialStepId` arbitrario vindo do frontend, recalculando esses valores pela posicao da etapa;
- substituir a regra atual de unicidade de `statusKey` por uma validacao compativel com o canon novo, permitindo repeticao legitima de `em_andamento`;
- manter `currentStepName` como identificador granular da etapa operacional atual, sem usar `statusKey` para carregar essa granularidade;
- preservar o comportamento do runtime atual:
  - abertura usa a primeira etapa;
  - primeira atribuicao procura a primeira etapa `work`;
  - advance continua seguindo `stepOrder`;
  - finalizacao continua usando a etapa `final`;
- cobrir a mudanca com testes de admin-config, publishability e runtime.

### SHOULD

- exibir na UX do editor a semantica derivada de cada etapa como informacao read-only, ou ocultar totalmente os campos tecnicos quando isso gerar menos ruido;
- mostrar mensagem clara quando o rascunho tiver menos de `3` etapas ou perder a estrutura `start -> work -> final`;
- centralizar a derivacao em um ponto reutilizavel entre salvamento de rascunho e verificacao de publicabilidade;
- ajustar as superficies que exibem “em que etapa esta” para usar `currentStepName` em vez de `currentStatusKey` como label principal;
- manter `statusKey` apenas onde ele for realmente tecnico/interno.

### COULD

- exibir badge visual de tipo de etapa (`Inicial`, `Intermediaria`, `Final`) no editor para reduzir ambiguidade operacional;
- registrar no estado de validacao do editor quais valores foram auto-derivados pelo backend para facilitar debug.

### WON'T

- nao reduzir o modelo a exatamente `3` etapas;
- nao redesenhar toda a tela de configuracao nesta correcao;
- nao alterar o contrato funcional de `requestAction` / `respondAction`;
- nao mudar historico, analytics ou outras areas fora do editor/publicacao de workflows v2;
- nao aceitar regra somente de frontend como solucao suficiente.

---

## 4. Regra Canonica Fechada

### 4.1. Invariavel funcional

Toda versao de workflow criada ou atualizada pelo Config. de Chamados V2 passa a obedecer:

| Posicao na `stepOrder` | `statusKey` derivado | `kind` derivado | Papel operacional |
| --- | --- | --- | --- |
| primeira | `solicitacao_aberta` | `start` | entrada inicial do chamado |
| qualquer etapa entre a primeira e a ultima | `em_andamento` | `work` | execucao operacional |
| ultima | `finalizado` | `final` | encerramento |

Guardrails fechados:

- a versao precisa ter pelo menos `3` etapas;
- `initialStepId` passa a ser sempre o `stepId` da primeira etapa da ordem;
- multiplas etapas intermediarias sao permitidas e todas compartilham `statusKey = em_andamento` e `kind = work`;
- o nome granular de cada etapa continua vindo de `stepName` e aparece no runtime por `currentStepName`;
- `statusKey` passa a representar somente a categoria canonica do fluxo.

### 4.2. Fonte de verdade

- o backend administrativo e a fonte de verdade da derivacao;
- o frontend apenas reflete a regra e nao pode persistir semantica tecnica propria;
- qualquer payload recebido com valores divergentes para `statusKey`, `kind` ou `initialStepId` deve ser normalizado antes da persistencia;
- a publicabilidade deve validar o resultado canonico derivado, e nao a intencao crua enviada pelo cliente.

### 4.3. Impacto esperado no runtime

- nenhum caso suportado pelo modelo novo deve depender de `statusKey` unico por etapa;
- a primeira atribuicao de responsavel continua usando a primeira etapa `work`, que passa a ser garantida pelo minimo de `3` etapas;
- fluxos com varias etapas intermediarias continuam avancando normalmente pela ordem das etapas;
- a finalizacao continua resolvendo a etapa `final`, agora obrigatoriamente a ultima.

---

## 5. Success Criteria

- o editor nao oferece campos editaveis para `statusKey`, `kind` ou `initialStepId`;
- qualquer operacao de salvar rascunho ou publicar produz steps persistidos com a derivacao canonica por posicao;
- workflows com `4`, `5` ou mais etapas publicam com repeticao valida de `statusKey = em_andamento` nas etapas intermediarias;
- a publicacao falha quando a versao tiver menos de `3` etapas;
- a publicacao falha quando a ordem nao puder produzir exatamente uma etapa inicial, ao menos uma intermediaria e uma final;
- a atribuicao inicial continua funcionando para versoes validas sem depender de configuracao manual de `kind`;
- testes automatizados cobrem:
  - derivacao canonica no save;
  - publishability com `statusKey` intermediario repetido;
  - bloqueio para menos de `3` etapas;
  - compatibilidade do runtime com varias etapas `work`.

### Clarity Score

`14/15`

Motivo:

- o brainstorm ja validou que a regra precisa ser sistemica e nao apenas visual;
- a decisao principal de produto esta fechada: backend como autoridade e minimo de `3` etapas;
- resta para o design apenas detalhar pontos de implementacao e UX, nao reabrir discovery funcional.

---

## 6. Technical Scope

### Frontend

- remover os controles editaveis de `statusKey`, `kind` e `initialStepId` do editor de etapas;
- ajustar a experiencia de edicao para trabalhar com ordenacao e nomes de etapas, nao com semantica tecnica manual;
- sinalizar no editor a regra de minimo de `3` etapas;
- refletir erros de validacao canonica vindos do backend com mensagens claras.

### Backend / Admin Config

- introduzir uma rotina central de derivacao canonica das etapas com base na `stepOrder`;
- aplicar essa derivacao em todas as entradas administrativas que salvam ou reconstroem versoes do configurador;
- tornar `initialStepId` derivado no repositorio/camada de persistencia;
- revisar a validacao de publishability para remover a exigencia de unicidade de `statusKey` entre etapas intermediarias;
- garantir que a publicabilidade passe a validar:
  - minimo de `3` etapas
  - primeira etapa `start`
  - ao menos uma etapa `work`
  - ultima etapa `final`
- alinhar serializacao, normalizacao e testes para que nenhum cliente consiga contornar a regra por payload bruto.

### Database / Firestore

- nenhuma nova colecao;
- nenhum novo campo persistido obrigatorio;
- os documentos de versao continuam armazenando `statusKey`, `kind` e `initialStepId`, mas esses valores passam a ser sempre derivados pela aplicacao;
- drafts legados fora do novo canon podem ser descartados e recriados manualmente;
- a normalizacao forte passa a valer do save/publicacao em diante, sem engenharia adicional de compatibilidade retroativa na leitura.

### Superficies afetadas pela nova semantica de `statusKey`

- revisar telas, adapters e historicos que hoje usam `currentStatusKey` como texto principal de status/etapa;
- trocar a exibicao textual por `currentStepName` quando o objetivo for mostrar “em que etapa esta”;
- manter `statusKey` apenas em superficies tecnicas ou internas onde o valor canonico ainda faca sentido;
- incluir no mesmo build a revisao inicial de:
  - [history-v2.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/history-v2.ts)
  - [V2HistoryDetailView.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/history/V2HistoryDetailView.tsx)
  - outros adapters/views que ainda tratem `currentStatusKey` como label principal de etapa

### Runtime

- o runtime continua consumindo o mesmo shape persistido;
- a mudanca e de invariavel dos dados, nao de protocolo de execucao;
- testes precisam confirmar que a nova regra nao quebra abertura, atribuicao, advance e finalizacao.

### Testing

- testes unitarios para a derivacao canonica de etapas;
- testes de integracao para salvamento de draft com normalizacao forcada;
- testes de publishability cobrindo repeticao valida de `em_andamento`;
- testes de runtime cobrindo fluxo com mais de uma etapa `work`;
- testes das superficies afetadas para garantir que labels de etapa passem a usar `currentStepName` onde apropriado.

---

## 7. Auth Requirements

- a correcao herda o gate administrativo `canManageWorkflowsV2` da superficie `2E`;
- o backend deve aplicar a normalizacao e validacao mesmo para clientes autenticados com permissao legitima, sem confiar no payload;
- a mudanca nao altera JWT, sessao, isolamento entre usuarios ou matriz de permissao por owner/allowed users.

---

## 8. Out of Scope

- redefinir o modelo inteiro para apenas `3` etapas fixas;
- reabrir o escopo visual completo do configurador;
- migrar em massa drafts ou workflows historicos fora do fluxo normal de edicao/publicacao;
- redesenhar historico/timeline alem dos ajustes necessarios para refletir a nova semantica entre `currentStatusKey` e `currentStepName`;
- criar novo DSL de workflow ou nova taxonomia de status.

---

## 9. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md` | Internal | Ready |
| `BRAINSTORM_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md` | Internal | Ready |
| Camada administrativa de save/publicacao do Config. de Chamados V2 | Internal | Requires design |
| Validacao de publishability do modelo `workflowTypes_v2` | Internal | Requires design |
| Superficies de historico/adapters que usam `currentStatusKey` como label | Internal | Requires design |
| Suite de testes do runtime/admin-config | Internal | Requires update |

---

## 10. Next Step

Produzir `DESIGN_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md` detalhando:

- ponto exato de derivacao no save e na publicacao;
- contrato normalizado de `steps` e `initialStepId`;
- ajuste da validacao de publishability;
- adaptacoes da UI do editor;
- matriz de testes para admin-config e runtime.

---

## 11. Revision History

| Date | Author | Summary |
|------|--------|---------|
| 2026-04-16 | Codex | Define derivado do brainstorm para fechar a invariavel canonica de etapas no Config. de Chamados V2 |
| 2026-04-16 | Codex | Refinado para assumir descarte manual de drafts legados fora do canon e incluir ajustes de historico/adapters impactados pela nova semantica de `statusKey` |
