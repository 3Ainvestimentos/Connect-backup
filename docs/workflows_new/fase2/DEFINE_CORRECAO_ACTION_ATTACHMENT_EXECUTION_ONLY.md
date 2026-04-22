# Define - Correcao de `attachmentRequired` para actions que nao sao tipo `execution`

## 1. Objetivo

Definir os requisitos funcionais e tecnicos para corrigir a configuracao de actions na superficie administrativa de workflows v2, garantindo que a regra de "anexo obrigatorio" exista apenas para actions do tipo `execution` e nao gere contratos impossiveis entre admin, runtime e UI operacional.

Contexto relacionado:

- [README.md](/Users/lucasnogueira/Documents/3A/Connect-backup/README.md)
- [CLAUDE.md](/Users/lucasnogueira/Documents/3A/Connect-backup/CLAUDE.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-04-22` | `Medium` | criacao do define para restringir `attachmentRequired` a actions `execution` no admin config, persistencia e runtime |

---

## 2. Problem Statement

A configuracao administrativa de workflows v2 permite marcar `attachmentRequired` para actions de `approval`, `acknowledgement` e `execution`, embora o contrato operacional do produto e do runtime suporte anexo apenas em actions de `execution`.

---

## 3. Problema Originario

O problema nasceu de um desalinhamento entre as camadas do produto:

1. o editor v2 de configuracao passou a renderizar o checkbox `Anexo obrigatorio` para qualquer `step.action`, sem filtrar por tipo de action;
2. ao trocar o tipo da action, o valor de `attachmentRequired` passou a ser preservado no form state, inclusive quando a action deixava de ser `execution`;
3. a camada de persistencia do draft passou a gravar `attachmentRequired` para qualquer action valida (`approval`, `acknowledgement`, `execution`);
4. a validacao de publish nao criou uma guarda para impedir essa combinacao invalida;
5. o runtime ja bloqueia upload de anexo quando a action nao e `execution`;
6. a UI operacional de resposta so renderiza input de anexo para `execution`.

Resultado pratico:

- o admin consegue salvar uma configuracao que parece valida no editor;
- o runtime aceita a configuracao publicada, mas nao permite enviar anexo em `approval` ou `acknowledgement`;
- a UI de resposta nao oferece campo de anexo fora de `execution`;
- o sistema passa a carregar um contrato impossivel: uma action que exige anexo, mas nao tem como receber anexo.

Em termos de negocio, isso cria uma divergencia entre o que o contrato administrativo promete e o que a operacao realmente consegue executar.

---

## 4. Users

### 4.1. Admin de configuracao de chamados

Pain points atuais:

- consegue marcar uma regra que nao deveria existir para `approval` e `acknowledgement`;
- nao recebe feedback de que a configuracao salva ficou inconsistente com o runtime;
- pode publicar uma versao de workflow com comportamento operacional invalido.

### 4.2. Owner / gestor operacional do workflow

Pain points atuais:

- pode solicitar uma action configurada com regra de anexo que nao sera cumprivel na operacao;
- perde previsibilidade sobre o comportamento da etapa configurada;
- fica exposto a chamados travados por regra impossivel de satisfazer.

### 4.3. Destinatario da action

Pain points atuais:

- recebe action de `approval` ou `acknowledgement` sem campo de anexo na UI, apesar de o contrato configurado poder marcar anexo como obrigatorio;
- encontra erros de validacao ou bloqueios sem uma forma coerente de concluir a resposta;
- perde confianca na consistencia da tela operacional.

### 4.4. Produto / QA / manutencao tecnica

Pain points atuais:

- existe uma divergencia entre editor, persistencia, runtime e UI;
- a ausencia de normalizacao aumenta risco de regressao;
- drafts legados podem carregar dados inconsistentes e contaminar testes ou novas publicacoes.

---

## 5. Goals

### MUST

- tornar `Anexo obrigatorio` visivel apenas para actions do tipo `execution` no editor v2;
- limpar automaticamente `attachmentRequired` para `false` quando a action mudar de `execution` para `approval` ou `acknowledgement`;
- persistir `attachmentRequired` apenas quando `action.type === 'execution'`;
- garantir que o runtime trate `attachmentRequired` como `false` para qualquer action que nao seja `execution`;
- preservar `commentRequired` como configuracao valida para `approval`, `acknowledgement` e `execution`;
- impedir que dados legados ou estados intermediarios do form mantenham a regra invalida ativa fora de `execution`;
- manter o contrato do produto coerente entre admin config, payload salvo, runtime e UI operacional.

### SHOULD

- adicionar cobertura de testes no editor para validar visibilidade condicional e reset ao trocar o tipo da action;
- adicionar cobertura de testes de persistencia para provar que actions nao `execution` nao gravam `attachmentRequired`;
- adicionar cobertura de testes de runtime para validar a normalizacao defensiva em leitura ou resposta operacional;
- documentar no proprio define a causa raiz para orientar design e implementacao.

### COULD

- endurecer a validacao de publish para sinalizar configuracoes invalidas preexistentes em drafts antigos;
- normalizar placeholders de anexo para `''` quando a action deixar de ser `execution`, se isso reduzir lixo semantico no draft.

### WON'T

- nao redesenhar a UX geral da tela `/admin/request-config`;
- nao alterar a semantica de `commentRequired`;
- nao executar migracao retroativa em massa de todos os documentos publicados;
- nao mudar o fluxo de upload operacional alem do necessario para a defesa de contrato;
- nao revisar neste escopo regras de approvers, SLA, historico ou notificacoes.

---

## 6. Success Criteria

- no editor, ao selecionar `approval` ou `acknowledgement`, o checkbox `Anexo obrigatorio` nao aparece;
- no editor, ao trocar uma action de `execution` com `attachmentRequired = true` para `approval` ou `acknowledgement`, o valor salvo no form state passa a `false` antes do save;
- no payload persistido pelo admin config, actions nao `execution` nunca sao gravadas com `attachmentRequired = true`;
- no runtime, actions nao `execution` sao tratadas como se `attachmentRequired = false`, mesmo que exista dado legado inconsistente;
- a UI operacional continua exibindo input de anexo apenas para `execution`;
- cenarios de resposta operacional para `approval` e `acknowledgement` nao exigem anexo em nenhuma validacao;
- existe cobertura automatizada para:
  - renderizacao condicional do checkbox no editor;
  - limpeza do valor ao trocar o tipo da action;
  - normalizacao de persistencia;
  - defesa de runtime.

### Clarity Score

`14/15`

Motivo:

- o problema, a causa raiz e a direcao da solucao estao claros;
- os arquivos afetados e as invariantes de negocio ja foram identificados;
- resta apenas decidir o ponto exato da normalizacao defensiva no runtime (`action-helpers.ts` ou fluxo de resposta), sem comprometer o escopo.

---

## 7. Technical Scope

### Frontend

Arquivos e superficies principais:

- `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx`
- testes do editor em `src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx`

Requisitos:

- condicionar a exibicao do checkbox `Anexo obrigatorio` ao tipo `execution`;
- garantir reset de `attachmentRequired` ao trocar o tipo da action para `approval` ou `acknowledgement`;
- manter `Comentario obrigatorio` disponivel para todos os tipos suportados;
- preservar o restante da UX do editor sem alterar layout, fluxo de save ou contratos nao relacionados.

### Backend

Arquivos e superficies principais:

- `src/lib/workflows/admin-config/draft-repository.ts`
- opcionalmente testes de write/admin config ja existentes

Requisitos:

- normalizar `attachmentRequired` no momento da persistencia;
- gravar `attachmentRequired` apenas para actions `execution`;
- impedir que o re-save de drafts mantenha a regra invalida fora de `execution`.

### Runtime

Arquivos e superficies principais:

- `src/lib/workflows/runtime/action-helpers.ts`
- e/ou `src/lib/workflows/runtime/use-cases/respond-action.ts`

Requisitos:

- tratar `attachmentRequired` como `false` para qualquer action nao `execution`;
- preservar a regra atual de que upload operacional so e permitido em `execution`;
- garantir que validacoes de resposta nao criem deadlock em `approval` ou `acknowledgement` por causa de dado legado inconsistente.

### Database

Requisitos:

- nenhuma mudanca de schema;
- nenhuma nova colecao;
- sem migracao em massa obrigatoria;
- drafts e versoes legadas podem continuar existindo, mas devem ser neutralizados por normalizacao em save e runtime.

### AI

- fora do escopo.

---

## 8. Auth Requirements

- a rota administrativa `/admin/request-config` continua restrita aos usuarios com permissao de gerenciar workflows v2;
- nao ha mudanca de regra de autenticacao para leitura, save, publish ou activate;
- o runtime continua exigindo autenticacao do ator operacional para responder actions;
- a correcao nao altera isolamento por usuario, owner, responsavel ou destinatario de action;
- a normalizacao de runtime deve respeitar o contrato atual de autorizacao e nao abrir caminho para uploads fora de `execution`.

---

## 9. Requisitos Funcionais Detalhados

### RF-01. Visibilidade condicional do campo

Quando `step.action.type` for `execution`, o editor deve exibir o controle `Anexo obrigatorio`.

Quando `step.action.type` for `approval` ou `acknowledgement`, o controle nao deve ser exibido.

### RF-02. Reset ao trocar tipo da action

Quando uma action que estava em `execution` for alterada para `approval` ou `acknowledgement`, o editor deve redefinir `attachmentRequired` para `false` no estado do formulario antes da persistencia.

### RF-03. Persistencia normalizada

No save do draft, `attachmentRequired` deve ser serializado apenas para actions `execution`.

Para actions `approval` e `acknowledgement`, o valor persistido deve ser sempre equivalente a `false`, independentemente do valor recebido do form.

### RF-04. Defesa de runtime contra legado

Ao descrever ou validar a action atual, o runtime deve considerar `attachmentRequired` somente quando a action for `execution`.

Se um documento legado trouxer `attachmentRequired = true` em `approval` ou `acknowledgement`, esse valor deve ser ignorado para efeitos de resposta operacional.

### RF-05. Preservacao do contrato operacional atual

O sistema deve continuar permitindo upload de resposta operacional apenas para actions `execution`.

O sistema nao deve exigir anexo em `approval` ou `acknowledgement`.

---

## 10. Requisitos Nao Funcionais

- a correcao deve ser retrocompativel com drafts e versoes ja existentes;
- a implementacao deve ser pequena, localizada e sem refatoracao ampla de tipos;
- a cobertura de testes deve focar os pontos de risco do contrato, nao apenas snapshots de UI;
- a solucao deve manter a legibilidade do editor e evitar duplicacao de regra entre camadas quando possivel;
- a escrita de dados deve continuar compativel com a sanitizacao usada pelo projeto antes de persistir em Firestore.

---

## 11. Out of Scope

- revisao do modelo completo de `StepActionDef`;
- remocao ou rename de campos do schema publicado;
- migracao historica de todos os workflows ja publicados;
- alteracao da tela operacional alem da manutencao do comportamento atual;
- tratamento de placeholders de comentario/anexo fora do caso necessario para manter consistencia semantica;
- refactor geral da validacao de publish.

---

## 12. Resultado Esperado

Ao final dessa correcao, o produto deve voltar a refletir a regra de negocio decidida para contratos:

- `approval`: pode exigir comentario, nao pode exigir anexo;
- `acknowledgement`: pode exigir comentario, nao pode exigir anexo;
- `execution`: pode exigir comentario e pode exigir anexo.

Com isso, admin config, payload salvo, runtime e UI operacional passam a compartilhar o mesmo contrato funcional, eliminando o estado impossivel hoje permitido pelo editor.
