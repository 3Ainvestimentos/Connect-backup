# DESIGN: FASE1_FACILITIES_ETAPA6_1

> Generated: 2026-03-31
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 6.1 - correcao pos-build do fallback de workflow e alinhamento do contrato do dialog
> Base document: `DEFINE_FASE1_FACILITIES_ETAPA6_1.md`

## 1. Objetivo

Corrigir a pequena regressao introduzida pela Etapa 6 no piloto `/pilot/facilities`, onde o registry de workflows hoje faz fallback silencioso para o primeiro item e pode rotular um request de workflow desconhecido como `Manutencao geral`. A mesma micro-etapa tambem fecha a lacuna de teste do campo `file` obrigatorio no workflow 2 e documenta explicitamente que o dialog de detalhes continua limitado aos metadados operacionais disponiveis no read-side.

Esta etapa cobre:

- tornar `getFacilitiesPilotWorkflowConfig(workflowTypeId)` um lookup seguro, sem fallback silencioso para manutencao;
- ajustar `RequestSummaryList` e `RequestDetailsDialog` para usar fallback de label honesto;
- adicionar teste automatizado para submit do workflow 2 sem arquivo obrigatorio;
- alinhar o design da Etapa 6.1 ao contrato real de `PilotRequestSummary`, sem prometer `formData` no dialog;
- manter a correcao restrita a frontend e artefatos tecnicos.

Esta etapa nao cobre:

- qualquer mudanca em endpoints `read`, `runtime` ou `uploads`;
- adicao de `formData` ao payload do read-side;
- refactor estrutural do registry para derivacao total;
- introducao do workflow 3;
- redesign da UX do dialog para preview de anexos.

### Convivencia com producao

O comportamento da rota `/pilot/facilities` continua igual para o bootstrap da pagina e para workflows conhecidos. A mudanca acontece apenas no lookup de apresentacao para requests ja retornados pelo read-side e no reforco de teste do fluxo de abertura com `file`.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE1_FACILITIES_ETAPA6_1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA6_1.md)
- [DESIGN_FASE1_FACILITIES_ETAPA6.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA6.md)
- [workflow-registry.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/workflow-registry.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/types.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts)
- [RequestSummaryList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestSummaryList.tsx)
- [RequestDetailsDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestDetailsDialog.tsx)
- [OpenWorkflowCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/OpenWorkflowCard.tsx)
- [OpenWorkflowCard.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx)
- [RequestDetailsDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA6_1.md` para escopo e aceite;
2. depois prevalece o contrato real de `PilotRequestSummary` e os componentes atualmente implementados;
3. depois este documento guia o build da micro-etapa 6.1;
4. o `DESIGN_FASE1_FACILITIES_ETAPA6.md` passa a ser lido em conjunto com esta correcao, e qualquer promessa de leitura de `formData` no dialog fica superada por este documento.

---

## 3. Decisoes Fechadas da Etapa 6.1

### 3.1. Bootstrap da rota e fallback de apresentacao continuam separados

Fica fechado que existem dois tipos de fallback diferentes:

- `resolveFacilitiesPilotWorkflowTypeId()` continua responsavel pelo bootstrap da rota e preserva o default `facilities_manutencao_solicitacoes_gerais`;
- `getFacilitiesPilotWorkflowConfig()` deixa de assumir fallback para manutencao quando recebe um `workflowTypeId` vindo do read-side.

Objetivo:

- manter a pagina navegavel quando a URL vier vazia ou invalida;
- impedir que um request historico ou desconhecido seja exibido com label amigavel errado.

### 3.2. Lookup seguro no registry

Fica fechado que `getFacilitiesPilotWorkflowConfig(workflowTypeId)` passa a retornar `undefined` quando o workflow nao existir em `FACILITIES_PILOT_WORKFLOWS`.

Consequencia aceita:

- todo callsite que usa essa funcao precisa tratar `config?.shortLabel`;
- nenhum componente de apresentacao pode depender mais de objeto garantido para workflow desconhecido.

### 3.3. Ordem oficial de resolucao do label de workflow

Fica fechado que `RequestSummaryList` e `RequestDetailsDialog` passam a usar exatamente esta ordem:

1. `workflowName`
2. `config?.shortLabel`
3. `workflowTypeId`

Direcao adicional:

- `workflowTypeId` cru e considerado fallback aceitavel porque e honesto;
- a etapa nao introduz label artificial como `Workflow desconhecido` para evitar mascarar identificadores uteis ao suporte.

### 3.4. Dialog continua limitado ao read-side operacional

Fica fechado que `RequestDetailsDialog` continua renderizando apenas os campos presentes em `PilotRequestSummary`:

- identidade do workflow;
- solicitante;
- responsavel;
- etapa atual;
- timestamps operacionais;
- acoes operacionais disponiveis.

Nao faz parte desta etapa:

- renderizar `formData`;
- exibir URL do anexo submetido;
- inferir preview de anexos a partir de dados nao retornados pelo read-side.

### 3.5. Cobertura obrigatoria para `file` requerido

Fica fechado que `OpenWorkflowCard.test.tsx` ganha um teste explicito para o workflow 2:

- catalogo com campo `file` obrigatorio;
- submit sem arquivo;
- mensagem `Campo obrigatorio.`;
- `uploadFile` nao chamado;
- `onSubmit` nao chamado.

Esse teste cobre a UX visivel e a ausencia de efeitos colaterais. O guard defensivo dentro de `buildFormDataForCatalog()` permanece valido, mas nao substitui o teste do formulario.

### 3.6. Micro-etapa sem expansao de backend

Fica fechado que a Etapa 6.1 nao altera:

- `src/lib/workflows/pilot/api-client.ts` no shape do `normalizeRequestSummary()`;
- `src/app/api/workflows/read/*`;
- `src/app/api/workflows/runtime/*`;
- schema de `PilotRequestSummary`;
- Storage, upload signed URL ou persistencia de `formData`.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
FACILITIES_PILOT_WORKFLOWS
  |
  +--> resolveFacilitiesPilotWorkflowTypeId(input)
  |       |
  |       +--> usado no bootstrap da rota/page
  |       +--> fallback default continua permitido
  |
  +--> getFacilitiesPilotWorkflowConfig(workflowTypeId)
          |
          +--> usado apenas para apresentacao
          +--> retorna undefined quando o workflow nao e registrado

PilotRequestSummary (read-side)
  |
  +--> workflowTypeId
  +--> workflowName
  +--> currentStepName
  +--> requester/responsible/timestamps
  +--> nao contem formData
  |
  +--> RequestSummaryList
  |       |
  |       +--> workflowName || config?.shortLabel || workflowTypeId
  |
  +--> RequestDetailsDialog
          |
          +--> workflowName || config?.shortLabel || workflowTypeId
          +--> exibe apenas metadados operacionais

PilotWorkflowCatalog (workflow 2)
  |
  +--> OpenWorkflowCard
          |
          +--> React Hook Form valida campo file obrigatorio
          +--> buildFormDataForCatalog() mantem guard defensivo
          +--> submit sem arquivo nao chama uploadFile nem onSubmit
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Registry)
1. A rota continua resolvendo workflow ativo com fallback default
2. A UI de listas/dialog passa a usar lookup seguro, sem fallback silencioso

LAYER 2 (Presentation)
3. RequestSummaryList resolve label honesto por item
4. RequestDetailsDialog resolve label honesto por request
5. Workflow desconhecido mostra identificador cru em vez de "Manutencao geral"

LAYER 3 (Open form validation)
6. OpenWorkflowCard aplica regra required no campo file
7. Submit invalido bloqueia efeitos colaterais
8. Teste automatizado cobre esse caminho explicitamente

LAYER 4 (Read-side contract)
9. PilotRequestSummary continua sendo a unica fonte do dialog
10. Nenhuma camada tenta ler formData inexistente do read-side
```

### 4.3. Estado e contratos preservados

| Item | Antes da Etapa 6.1 | Depois da Etapa 6.1 |
|------|--------------------|---------------------|
| bootstrap da rota | fallback para workflow default | igual |
| lookup de config para apresentacao | fallback silencioso para manutencao | lookup seguro com `undefined` |
| label para workflow conhecido | `workflowName` ou `shortLabel` | igual |
| label para workflow desconhecido | podia virar `Manutencao geral` | usa `workflowTypeId` cru |
| dialog de detalhes | metadados operacionais | igual |
| `formData` no dialog | nao disponivel no contrato real | continua fora do contrato |
| teste de `file` requerido | inexistente | passa a ser obrigatorio |

---

## 5. Architecture Decision Records

### ADR-6.1.1: Fallback de URL e fallback de label nao sao o mesmo problema

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-31 |
| Context | A rota precisa continuar resiliente quando o `searchParam` vier vazio ou invalido, mas a lista/dialog nao podem mascarar requests de workflow desconhecido como manutencao. |

**Choice:** manter `resolveFacilitiesPilotWorkflowTypeId()` com fallback default apenas para bootstrap e tornar `getFacilitiesPilotWorkflowConfig()` um lookup sem fallback.

**Consequences:**

- a navegacao da pagina permanece estavel;
- o read-side deixa de ser reinterpretado com label errado;
- o contrato do registry fica mais explicito e menos ambivalente.

### ADR-6.1.2: Fallback honesto usa `workflowTypeId`, nao novo label sintetico

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-31 |
| Context | Quando um workflow nao esta no registry local, a UI precisa continuar funcional sem inventar nome amigavel incorreto. |

**Choice:** usar `workflowTypeId` como ultimo fallback de label.

**Consequences:**

- suporte e debugging ficam mais simples;
- evita traduzir um caso desconhecido para uma mensagem que pode esconder o identificador real;
- a UX fica menos bonita no caso raro, mas permanece correta.

### ADR-6.1.3: O dialog nao simula `formData` ausente

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-31 |
| Context | O design anterior da Etapa 6 sugeria preparar leitura de URL de arquivo no dialog, mas o contrato de `PilotRequestSummary` nao inclui `formData` nem links de anexos. |

**Choice:** documentar explicitamente que o dialog continua restrito aos metadados operacionais do read-side.

**Consequences:**

- o build da 6.1 nao toca backend nem read-side;
- a documentacao volta a refletir o sistema real;
- qualquer preview de anexo fica formalmente adiado para etapa futura com expansao de contrato.

### ADR-6.1.4: A lacuna de teste do `file` obrigatorio e fechada no nivel de componente

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-31 |
| Context | O comportamento de required para campo `file` ja existe no formulario, mas nao havia teste cobrindo o caminho de erro do workflow 2. |

**Choice:** adicionar o teste em `OpenWorkflowCard.test.tsx`, exercitando o formulario real.

**Consequences:**

- a regressao volta a ser detectavel automaticamente;
- o teste valida mensagem visivel e ausencia de chamadas de upload/runtime;
- nao exige camada extra de teste no backend.

---

## 6. File Manifest

| Ordem | Caminho | Acao | Responsabilidade | Skill/Agente sugerido |
|------|---------|------|------------------|-----------------------|
| 1 | [workflow-registry.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/workflow-registry.ts) | Modify | Remover fallback silencioso de `getFacilitiesPilotWorkflowConfig()` e manter `resolveFacilitiesPilotWorkflowTypeId()` intacto | `build` |
| 2 | [RequestSummaryList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestSummaryList.tsx) | Modify | Resolver label com `workflowName || config?.shortLabel || workflowTypeId` | `build` |
| 3 | [RequestDetailsDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestDetailsDialog.tsx) | Modify | Aplicar o mesmo fallback honesto no dialog sem prometer leitura de `formData` | `build` |
| 4 | [OpenWorkflowCard.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx) | Modify | Cobrir submit do workflow 2 sem arquivo obrigatorio e garantir ausencia de side effects | `build` |
| 5 | [RequestDetailsDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx) | Modify | Cobrir request com `workflowName` vazio e `workflowTypeId` desconhecido no dialog | `build` |
| 6 | [RequestSummaryList.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/RequestSummaryList.test.tsx) | Create | Cobrir fallback honesto da lista para workflow conhecido e desconhecido | `build` |

### Execution Order

| Phase | Files | Resultado esperado |
|-------|-------|--------------------|
| 1. Registry | `workflow-registry.ts` | lookup seguro para apresentacao |
| 2. UI labels | `RequestSummaryList.tsx`, `RequestDetailsDialog.tsx` | labels corretos para workflows conhecidos e desconhecidos |
| 3. Tests | `OpenWorkflowCard.test.tsx`, `RequestDetailsDialog.test.tsx`, `RequestSummaryList.test.tsx` | cobertura de regressao para fallback e validacao de `file` |

---

## 7. Code Patterns

### Pattern 1: Registry sem fallback silencioso

```ts
// src/lib/workflows/pilot/workflow-registry.ts

export function getFacilitiesPilotWorkflowConfig(workflowTypeId: string) {
  return FACILITIES_PILOT_WORKFLOWS.find(
    (workflow) => workflow.workflowTypeId === workflowTypeId,
  );
}
```

Regra:

- `resolveFacilitiesPilotWorkflowTypeId()` continua sendo a unica funcao autorizada a aplicar default para a pagina;
- `getFacilitiesPilotWorkflowConfig()` passa a representar apenas um lookup.

### Pattern 2: Fallback de label em componente de apresentacao

```ts
const workflowConfig = getFacilitiesPilotWorkflowConfig(item.workflowTypeId);
const workflowLabel =
  item.workflowName || workflowConfig?.shortLabel || item.workflowTypeId;
```

Aplicacao esperada:

- `RequestSummaryList.tsx`
- `RequestDetailsDialog.tsx`

Regra:

- nunca acessar `.shortLabel` sem optional chaining;
- nunca reintroduzir fallback para o primeiro workflow.

### Pattern 3: Teste do campo `file` obrigatorio

```ts
it('shows required error for workflow 2 file field and blocks side effects', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn().mockResolvedValue({ requestId: 1002 });
  const uploadFile = jest.fn().mockResolvedValue({
    fileUrl: 'https://storage.example.com/planilha.xlsx',
  });

  render(
    <OpenWorkflowCard
      catalog={fileCatalog}
      isLoading={false}
      isSubmitting={false}
      requesterName="Lucas"
      uploadFile={uploadFile}
      onSubmit={onSubmit}
    />,
  );

  await user.type(screen.getByLabelText('Descricao *'), 'Reposicao de insumos');
  await user.click(screen.getByRole('button', { name: 'Enviar solicitacao' }));

  expect(await screen.findByText('Campo obrigatorio.')).not.toBeNull();
  expect(uploadFile).not.toHaveBeenCalled();
  expect(onSubmit).not.toHaveBeenCalled();
});
```

Objetivo do pattern:

- validar o comportamento usuario-a-usuario;
- garantir que a ausencia do arquivo interrompe o fluxo antes de upload e submit.

### Pattern 4: Teste de workflow desconhecido no dialog

```ts
render(
  <RequestDetailsDialog
    open
    request={{
      ...baseRequest,
      workflowTypeId: 'facilities_fluxo_inesperado',
      workflowName: '',
    }}
    actorUserId="owner-1"
    collaborators={collaborators}
    onOpenChange={jest.fn()}
    onAssign={jest.fn().mockResolvedValue(undefined)}
    onFinalize={jest.fn().mockResolvedValue(undefined)}
    onArchive={jest.fn().mockResolvedValue(undefined)}
  />,
);

expect(screen.getAllByText('facilities_fluxo_inesperado').length).toBeGreaterThan(0);
expect(screen.queryByText('Manutencao geral')).toBeNull();
```

---

## 8. API Contract

### 8.1. Backend

Nao ha mudanca de contrato HTTP nesta etapa.

Permanecem inalterados:

- `GET /api/workflows/read/current`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/mine`
- `POST /api/workflows/runtime/requests`
- `POST /api/workflows/runtime/uploads`

### 8.2. Read-side consumido pelo dialog

O contrato efetivo usado pelo dialog continua sendo `PilotRequestSummary`.

Campos relevantes:

```ts
type PilotRequestSummary = {
  requestId: number;
  workflowTypeId: string;
  workflowVersion: number;
  workflowName: string;
  requesterName: string;
  responsibleName: string | null;
  currentStepName: string;
  statusCategory: 'open' | 'in_progress' | 'waiting_action' | 'finalized' | 'archived';
  submittedAt: Date | null;
  lastUpdatedAt: Date | null;
  finalizedAt: Date | null;
  archivedAt: Date | null;
  // sem formData
};
```

Implicacoes:

- o dialog pode identificar o workflow e mostrar metadados operacionais;
- o dialog nao pode reconstruir campos enviados pelo formulario;
- URL de anexo submetido nao esta disponivel no contrato atual do read-side.

### 8.3. Contrato de apresentacao para label

```ts
displayWorkflowLabel =
  workflowName || getFacilitiesPilotWorkflowConfig(workflowTypeId)?.shortLabel || workflowTypeId;
```

Esse contrato vale apenas para UI de apresentacao e nao altera payloads de backend.

---

## 9. Estrategia de Build

### 9.1. Sequencia recomendada

1. ajustar `workflow-registry.ts` para retornar `undefined` em workflows desconhecidos;
2. auditar todos os callsites de `getFacilitiesPilotWorkflowConfig()` e adaptar os dois componentes que consomem `shortLabel`;
3. adicionar testes de regressao para lista e dialog com workflow desconhecido;
4. adicionar teste do submit sem arquivo no workflow 2;
5. validar que o build nao toca `api-client.ts`, rotas ou tipos do read-side.

### 9.2. Invariantes do build

- `resolveFacilitiesPilotWorkflowTypeId()` nao muda;
- workflow 1 e workflow 2 continuam exibindo labels amigaveis conhecidos;
- workflow desconhecido nunca aparece como `Manutencao geral`;
- `RequestDetailsDialog` continua sem `formData`;
- submit invalido do workflow 2 nao chama upload nem runtime mutation;
- nenhuma chamada HTTP, schema ou migration nova e introduzida.

---

## 10. Testing Strategy

### 10.1. Unitario / componente

- `RequestSummaryList.test.tsx`
  - renderiza `shortLabel` para workflow conhecido quando `workflowName` vier vazio;
  - renderiza `workflowTypeId` para workflow desconhecido;
  - nao renderiza `Manutencao geral` por fallback indevido.
- `RequestDetailsDialog.test.tsx`
  - mantem comportamento atual para workflow conhecido;
  - renderiza `workflowTypeId` cru quando o workflow nao estiver no registry e `workflowName` vier vazio.
- `OpenWorkflowCard.test.tsx`
  - workflow 2 sem arquivo mostra `Campo obrigatorio.`;
  - `uploadFile` nao e chamado;
  - `onSubmit` nao e chamado.

### 10.2. Regressao obrigatoria

- workflow 1 continua abrindo normalmente sem upload;
- workflow 2 continua subindo arquivo e enviando `fileUrl` no caminho feliz;
- o dialog continua mostrando apenas metadados operacionais;
- o registry continua resolvendo default para a pagina via `resolveFacilitiesPilotWorkflowTypeId()`.

### 10.3. Manual obrigatorio

- abrir um request real conhecido de manutencao e confirmar label amigavel intacto;
- abrir um request real conhecido de suprimentos e confirmar label amigavel intacto;
- validar localmente, via fixture de teste ou mock, que `workflowTypeId` desconhecido aparece cru nas views;
- tentar submeter workflow 2 sem anexo e confirmar mensagem de erro sem side effects.

### 10.4. Comandos de verificacao esperados

- `npm test -- --runInBand src/components/pilot/facilities/__tests__/RequestSummaryList.test.tsx src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx`
- `npm run typecheck -- --pretty false`

---

## 11. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|------|---------|-----------|
| Mudanca do retorno de `getFacilitiesPilotWorkflowConfig()` quebrar callsites nao auditados | Medio | revisar todos os usos com `rg` e adaptar optional chaining antes de finalizar |
| Fallback para `workflowTypeId` cru gerar UX menos amigavel | Baixo | aceitar o trade-off porque a prioridade da etapa e honestidade semantica |
| Teste do campo `file` passar sem cobrir ausencia de side effects | Medio | assertar explicitamente `uploadFile` e `onSubmit` nao chamados |
| Leitores continuarem usando o design da Etapa 6 isoladamente | Baixo | deixar neste documento que a 6.1 supera qualquer promessa anterior sobre `formData` no dialog |

---

## 12. Rollback Plan

Se a Etapa 6.1 introduzir regressao inesperada:

1. restaurar o comportamento anterior dos componentes de apresentacao;
2. manter `resolveFacilitiesPilotWorkflowTypeId()` e todo o bootstrap da pagina intactos;
3. reverter os testes adicionados apenas se a decisao funcional for revista;
4. nao ha rollback de backend, schema, Storage ou dados persistidos porque a etapa nao os altera.

Rollback e trivial porque a correcao esta confinada a UI, testes e artefatos tecnicos.

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-31 | codex | Criado o design da Etapa 6.1 para corrigir o fallback silencioso de workflow, adicionar cobertura do campo `file` obrigatorio e alinhar o dialog ao contrato real do read-side. |
