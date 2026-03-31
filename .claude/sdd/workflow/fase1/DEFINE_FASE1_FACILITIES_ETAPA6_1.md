# DEFINE: FASE1_FACILITIES_ETAPA6_1

> Generated: 2026-03-31
> Status: Ready for design
> Source: review da implementacao da Etapa 6 + DESIGN_FASE1_FACILITIES_ETAPA6.md + implementacao atual da rota `/pilot/facilities`
> Clarity Score: 15/15

## 1. Problem Statement

A Etapa 6 entregou a base multiworkflow na mesma UI, mas ficou com um bug de fallback que pode rotular workflows desconhecidos como manutencao, uma lacuna de teste no campo `file` obrigatorio e um desalinhamento entre os artefatos da etapa e o contrato real do read-side sobre o que o dialog de detalhes consegue exibir.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Operadores da area | Podem ver um workflow desconhecido rotulado incorretamente como manutencao nas listas e no dialog | Eventual, mas confuso quando acontecer |
| Time tecnico da Fase 1 | Precisa fechar a Etapa 6 com comportamento e artefatos coerentes antes de seguir para a Etapa 7 | Pontual por etapa |
| Maintainers do piloto | Precisam confiar que a validacao de `file` obrigatorio continua protegida por teste automatizado | Recorrente |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Corrigir o fallback de label para workflow desconhecido | `RequestSummaryList` e `RequestDetailsDialog` nao podem exibir o label default de manutencao para um `workflowTypeId` nao registrado |
| M2 | Preservar o comportamento atual para workflows conhecidos | Workflow 1 e workflow 2 continuam exibindo seus labels amigaveis normalmente |
| M3 | Adicionar cobertura do caminho de erro do campo `file` obrigatorio | Existe teste automatizado que tenta submeter workflow 2 sem arquivo e valida a mensagem de erro no formulario |
| M4 | Alinhar os artefatos da Etapa 6 ao contrato real do read-side | DEFINE/DESIGN deixam explicito que o dialog exibe metadados operacionais do request, e nao `formData` submetido |
| M5 | Manter a correcao pequena e sem expandir o backend | Nenhuma mudanca em read-side, runtime ou schema e introduzida nesta etapa |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Tornar o fallback visualmente honesto | Quando o workflow nao for conhecido, a UI usa `workflowTypeId` cru ou label neutro, nunca um nome amigavel errado |
| S2 | Preservar a leitura dos artefatos para a Etapa 7 | A documentacao deixa claro o que ficou para consolidacao futura, sem promessas implausiveis na etapa atual |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Registrar explicitamente a duplicacao do registry como divida da Etapa 7 | A documentacao pode anotar que `resolveFacilitiesPilotWorkflowTypeId` ainda tem duplicacao aceitavel por enquanto |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Adicionar `formData` ao read-side | Isso exige expansao de contrato backend e fica fora desta correcao |
| W2 | Redesenhar `workflow-registry.ts` para derivacao total a partir do array base | Esse hardening fica para a Etapa 7 |
| W3 | Alterar a UX final do dialog para preview completo de anexos | Fora do escopo desta micro-etapa |
| W4 | Reabrir a arquitetura da Etapa 6 | O objetivo e apenas corrigir os pontos encontrados no review |

## 4. Decisoes Fechadas

### 4.1. Natureza da etapa

Fica fechado que a Etapa 6.1 e uma micro-etapa de correcao pos-build da Etapa 6.

Ela existe para:

- corrigir um bug real de fallback na UI;
- fechar uma lacuna objetiva de teste;
- sincronizar os artefatos com o que o backend realmente entrega.

### 4.2. Fix do fallback de workflow desconhecido

Fica fechado que `getFacilitiesPilotWorkflowConfig(workflowTypeId)` deixa de retornar automaticamente o primeiro workflow como fallback silencioso.

Direcao fechada:

- a funcao retorna `undefined` quando o workflow nao for conhecido;
- `RequestSummaryList` e `RequestDetailsDialog` passam a usar a ordem:
  - `workflowName`
  - `config?.shortLabel`
  - `workflowTypeId`

Objetivo:

- nunca rotular um workflow desconhecido como manutencao por engano.

### 4.3. Escopo do teste adicional

Fica fechado que a etapa adiciona explicitamente um teste para:

- workflow 2 com campo `file` obrigatorio;
- submit sem arquivo selecionado;
- exibicao de `Campo obrigatorio.`;
- ausencia de chamada ao upload e ao submit final.

### 4.4. Alinhamento dos artefatos

Fica fechado que os artefatos da Etapa 6 devem ser corrigidos para refletir o contrato real do read-side atual.

Isso significa:

- o dialog de detalhes exibe metadados operacionais do request;
- o dialog nao promete exibir `formData` submetido nesta etapa;
- qualquer exposicao de `formData` no dialog exigiria expansao de escopo/backend futura, nao parte desta correcao.

### 4.5. O que fica explicitamente para a Etapa 7

Fica fechado que a duplicacao atual em `resolveFacilitiesPilotWorkflowTypeId` nao bloqueia esta correcao e permanece como divida aceitavel para a Etapa 7, quando o terceiro workflow entrar no registry.

## 5. Success Criteria

- workflows desconhecidos deixam de aparecer como manutencao por fallback silencioso;
- workflow 1 e workflow 2 continuam com labels amigaveis corretos;
- existe teste cobrindo falha de validacao de `file` obrigatorio;
- os artefatos da Etapa 6 deixam de prometer exibicao de `formData` no dialog;
- nao ha mudanca de backend, schema ou read-side.

## 6. Technical Scope

### Frontend

- ajustar `workflow-registry.ts` para fallback seguro;
- ajustar `RequestSummaryList.tsx` e `RequestDetailsDialog.tsx` para fallback honesto;
- adicionar teste no `OpenWorkflowCard.test.tsx`;
- revisar artefatos DEFINE/DESIGN da Etapa 6.

### Backend

- fora do escopo;
- nenhum ajuste em read-side, runtime ou upload.

### Database / Storage

- fora do escopo;
- nenhuma mudanca em Firestore ou Storage.

## 7. Auth Requirements

- nenhuma mudanca;
- a etapa nao toca autenticacao nem autorizacao.

## 8. Out of Scope

- incluir `formData` em `PilotRequestSummary`;
- criar endpoint de detalhes enriquecido;
- redesign do registry;
- incluir workflow 3;
- consolidacao final da UX do piloto.

## 9. Criterio de Aceite da Etapa

A Etapa 6.1 sera considerada concluida quando o fallback de workflow desconhecido estiver corrigido nas views do piloto, a validacao de `file` obrigatorio estiver coberta por teste automatizado e os artefatos da Etapa 6 estiverem alinhados ao fato de que o dialog atual exibe apenas metadados operacionais do request.

## 10. Revision History

| Date | Impact | Summary |
|------|--------|---------|
| `2026-03-31` | `Medium` | criacao do define da Etapa 6.1 para corrigir fallback de workflow desconhecido, adicionar teste do campo `file` obrigatorio e alinhar os artefatos da Etapa 6 ao contrato real do read-side |
