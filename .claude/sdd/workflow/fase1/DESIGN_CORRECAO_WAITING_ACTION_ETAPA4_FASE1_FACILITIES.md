# DESIGN: CORRECAO_WAITING_ACTION_ETAPA4_FASE1_FACILITIES

> Generated: 2026-03-27
> Status: Ready for build
> Source: DEFINE fornecido inline (Clarity Score 15/15)
> Scope: Correcao pontual de semantica `canFinalize` no estado `waiting_action`

## 1. Requirements Summary

### Problem

A funcao `derivePilotRequestPresentation()` retorna `canFinalize: false` para o estado `waiting_action`, mesmo quando o ator e o owner ou o responsavel. O backend permite `finalize` nesse estado para esses papeis, mas a camada de apresentacao esconde o CTA, criando uma inconsistencia entre frontend e backend.

### Success Criteria

| ID | Criterion | Target |
|----|-----------|--------|
| M1 | Alinhar `waiting_action` com regra do backend | `canFinalize: true` para owner ou responsavel |
| M2 | Cobertura de teste explicita | 3 novos casos em `presentation.test.ts` |
| M3 | Escopo estritamente local | Apenas `presentation.ts` e `presentation.test.ts` |
| S1 | Legibilidade | Extrair `isResponsible` como variavel local |

### Constraints

- Nenhum arquivo fora de `presentation.ts` e `presentation.test.ts` deve ser alterado
- Nenhuma outra regra de CTA pode mudar (nao-regressao)
- Nenhuma mudanca em backend, runtime, catalog ou qualquer outro modulo

---

## 2. Architecture

### System Diagram

```text
src/lib/workflows/pilot/
  |
  +-- types.ts                    (nao alterado - define PilotRequestSummary,
  |                                PilotRequestPresentation, PilotStatusCategory)
  |
  +-- presentation.ts             [MODIFICAR] derivePilotRequestPresentation()
  |       |                         - adicionar isResponsible
  |       |                         - corrigir canFinalize em waiting_action
  |       |
  |       v
  +-- __tests__/
        +-- presentation.test.ts  [MODIFICAR] 3 novos casos para waiting_action
```

### Data Flow

```text
LAYER 1 (Presentation Logic):
1. presentation.ts recebe PilotRequestSummary + actorUserId
2. Deriva isOwner e isResponsible a partir do item
3. Retorna PilotRequestPresentation com flags de CTA corretas

LAYER 2 (Consumidores - NAO ALTERADOS):
4. Componentes do piloto leem canFinalize para exibir/esconder botao Finalizar
5. Hook/Context invoca finalize via API quando usuario clica
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `isOwner` | Variavel local em `derivePilotRequestPresentation` | Calculada a cada chamada |
| `isResponsible` | Variavel local em `derivePilotRequestPresentation` (novo) | Calculada a cada chamada |

---

## 3. Architecture Decisions

### ADR-001: Usar `isOwner || isResponsible` em vez de `pendingActionRecipientIds`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-03-27 |
| **Context** | O tipo `PilotRequestSummary` possui tanto `responsibleUserId` quanto `pendingActionRecipientIds`. Precisamos decidir qual campo usar para determinar `canFinalize` no estado `waiting_action`. |

**Choice:** Usar `isOwner || isResponsible` (comparacao direta com `item.responsibleUserId === actorUserId`).

**Rationale:**
1. O backend ja autoriza `finalize` com base em owner ou responsible, independentemente de `pendingActionRecipientIds`.
2. O bloco `in_progress` ja usa essa mesma logica (`isOwner || item.responsibleUserId === actorUserId`), portanto manter consistencia entre os dois estados.
3. `pendingActionRecipientIds` tem semantica diferente: indica quem precisa executar uma acao pendente especifica, nao quem pode finalizar.
4. Introduzir dependencia em `pendingActionRecipientIds` criaria um acoplamento a um campo que pode nao estar populado corretamente para a acao de finalizacao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| `pendingActionRecipientIds.includes(actorUserId)` | Semantica diferente: pending actions nao representam permissao de finalizacao. Pode estar vazio mesmo quando finalize e permitido. |
| Checar `hasPendingActions && isOwner` | Mistura conceitos: pending actions sao sobre tarefas intermediarias, nao sobre a acao terminal de finalizar. |
| Manter `canFinalize: false` e corrigir no componente | Viola separacao de concerns: a logica de permissao deve ficar em `presentation.ts`, nao espalhada em componentes. |

**Consequences:**
- Positivo: Consistencia com o bloco `in_progress` e com o backend.
- Positivo: Mudanca minima (2 linhas de codigo).
- Negativo: Nenhum identificado. A semantica ja era essa no backend.

---

### ADR-002: Extrair `isResponsible` como variavel local no topo da funcao

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-03-27 |
| **Context** | O bloco `in_progress` ja faz `item.responsibleUserId === actorUserId` inline. Com a adicao do mesmo check em `waiting_action`, a expressao apareceria duplicada. |

**Choice:** Extrair `const isResponsible = item.responsibleUserId === actorUserId` no topo da funcao, ao lado de `isOwner`.

**Rationale:**
1. Elimina duplicacao da expressao `item.responsibleUserId === actorUserId`.
2. Melhora legibilidade: `canFinalize: isOwner || isResponsible` e auto-documentado.
3. Alinha com o padrao ja estabelecido por `isOwner`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Manter inline em ambos os blocos | Duplicacao desnecessaria; mais propenso a divergencia futura. |

**Consequences:**
- Positivo: Legibilidade e DRY.
- Negativo: O bloco `in_progress` tambem precisa ser atualizado para usar `isResponsible` em vez da expressao inline (mudanca cosmetica, sem impacto funcional).

---

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Logic | `src/lib/workflows/pilot/presentation.ts` | @react-frontend-developer |
| 2. Tests | `src/lib/workflows/pilot/__tests__/presentation.test.ts` | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/pilot/presentation.ts` | Modify | Extrair `isResponsible`, corrigir `canFinalize` em `waiting_action`, usar `isResponsible` em `in_progress` | @react-frontend-developer | - |
| 2 | `src/lib/workflows/pilot/__tests__/presentation.test.ts` | Modify | Adicionar 3 casos de teste para `waiting_action` | @react-frontend-developer | #1 |

---

## 5. Code Patterns

### Pattern 1: presentation.ts - Correcao de `derivePilotRequestPresentation`

**ANTES** (linhas 9-68 do arquivo atual):

```typescript
export function derivePilotRequestPresentation(
  item: PilotRequestSummary,
  actorUserId: string,
): PilotRequestPresentation {
  const isOwner = item.ownerUserId === actorUserId;

  // ... blocos archived e finalized sem mudanca ...

  if (item.statusCategory === 'waiting_action') {
    return {
      situationKey: 'waiting_action',
      label: 'Aguardando acao',
      badgeVariant: 'outline',
      canAssign: false,
      canFinalize: false,  // <-- BUG
      canArchive: false,
    };
  }

  // ... bloco awaiting_assignment sem mudanca ...

  return {
    situationKey: 'in_progress',
    label: 'Em andamento',
    badgeVariant: 'default',
    canAssign: isOwner,
    canFinalize:
      item.statusCategory === 'in_progress' &&
      (isOwner || item.responsibleUserId === actorUserId),  // <-- inline
    canArchive: false,
  };
}
```

**DEPOIS** (estado final completo da funcao):

```typescript
export function derivePilotRequestPresentation(
  item: PilotRequestSummary,
  actorUserId: string,
): PilotRequestPresentation {
  const isOwner = item.ownerUserId === actorUserId;
  const isResponsible = item.responsibleUserId === actorUserId;

  if (item.statusCategory === 'archived') {
    return {
      situationKey: 'archived',
      label: 'Arquivado',
      badgeVariant: 'outline',
      canAssign: false,
      canFinalize: false,
      canArchive: false,
    };
  }

  if (item.statusCategory === 'finalized') {
    return {
      situationKey: 'finalized',
      label: 'Concluido',
      badgeVariant: 'secondary',
      canAssign: false,
      canFinalize: false,
      canArchive: isOwner,
    };
  }

  if (item.statusCategory === 'waiting_action') {
    return {
      situationKey: 'waiting_action',
      label: 'Aguardando acao',
      badgeVariant: 'outline',
      canAssign: false,
      canFinalize: isOwner || isResponsible,  // <-- CORRECAO
      canArchive: false,
    };
  }

  if (item.statusCategory === 'open' && !item.hasResponsible) {
    return {
      situationKey: 'awaiting_assignment',
      label: 'Aguardando atribuicao',
      badgeVariant: 'destructive',
      canAssign: isOwner,
      canFinalize: false,
      canArchive: false,
    };
  }

  return {
    situationKey: 'in_progress',
    label: 'Em andamento',
    badgeVariant: 'default',
    canAssign: isOwner,
    canFinalize:
      item.statusCategory === 'in_progress' &&
      (isOwner || isResponsible),  // <-- REFATORADO para usar variavel
    canArchive: false,
  };
}
```

**Resumo das mudancas:**
1. Linha 14 (nova): `const isResponsible = item.responsibleUserId === actorUserId;`
2. Bloco `waiting_action`, campo `canFinalize`: `false` --> `isOwner || isResponsible`
3. Bloco fallback `in_progress`, campo `canFinalize`: `item.responsibleUserId === actorUserId` --> `isResponsible`

---

### Pattern 2: presentation.test.ts - Novos casos de teste para `waiting_action`

**ANTES:** 3 testes existentes (awaiting_assignment, in_progress, finalized). Nenhum teste para `waiting_action`.

**DEPOIS:** Adicionar o bloco `describe` abaixo apos os testes existentes, dentro do `describe('derivePilotRequestPresentation')`:

```typescript
  describe('waiting_action status', () => {
    const waitingActionBase: PilotRequestSummary = {
      ...baseRequest,
      statusCategory: 'waiting_action',
      responsibleUserId: 'resp-1',
      responsibleName: 'Responsavel',
      hasResponsible: true,
    };

    it('allows finalize for the owner in waiting_action', () => {
      expect(
        derivePilotRequestPresentation(waitingActionBase, 'owner-1'),
      ).toMatchObject({
        situationKey: 'waiting_action',
        label: 'Aguardando acao',
        canFinalize: true,
        canAssign: false,
        canArchive: false,
      });
    });

    it('allows finalize for the responsible user in waiting_action', () => {
      expect(
        derivePilotRequestPresentation(waitingActionBase, 'resp-1'),
      ).toMatchObject({
        situationKey: 'waiting_action',
        label: 'Aguardando acao',
        canFinalize: true,
        canAssign: false,
        canArchive: false,
      });
    });

    it('denies finalize for a third-party user in waiting_action', () => {
      expect(
        derivePilotRequestPresentation(waitingActionBase, 'random-user'),
      ).toMatchObject({
        situationKey: 'waiting_action',
        label: 'Aguardando acao',
        canFinalize: false,
        canAssign: false,
        canArchive: false,
      });
    });
  });
```

---

## 6. API Contract

Nenhum endpoint novo ou alterado. A correcao e inteiramente na camada de apresentacao do frontend.

---

## 7. Database Schema

Nenhuma mudanca no schema. Nenhuma colecao, campo ou indice e criado, removido ou alterado.

---

## 8. Testing Strategy

### Unit Tests

| Component | Test | Verifica |
|-----------|------|----------|
| `derivePilotRequestPresentation` | `waiting_action` + actor = owner | `canFinalize: true` |
| `derivePilotRequestPresentation` | `waiting_action` + actor = responsible | `canFinalize: true` |
| `derivePilotRequestPresentation` | `waiting_action` + actor = terceiro | `canFinalize: false` |

### Non-Regression

Os 3 testes existentes devem continuar passando sem alteracao:

| Test existente | Expectativa |
|----------------|-------------|
| `awaiting_assignment` para owner | `canAssign: true`, `canFinalize: false` |
| `in_progress` para responsible | `canFinalize: true` |
| `finalized` para owner | `canArchive: true`, `canFinalize: false` |

### Acceptance Tests

```gherkin
GIVEN um item com statusCategory = 'waiting_action' e responsibleUserId = 'resp-1'
WHEN derivePilotRequestPresentation e chamada com actorUserId = 'owner-1'
THEN canFinalize = true

GIVEN um item com statusCategory = 'waiting_action' e responsibleUserId = 'resp-1'
WHEN derivePilotRequestPresentation e chamada com actorUserId = 'resp-1'
THEN canFinalize = true

GIVEN um item com statusCategory = 'waiting_action' e responsibleUserId = 'resp-1'
WHEN derivePilotRequestPresentation e chamada com actorUserId = 'random-user'
THEN canFinalize = false
```

### Execucao

```bash
npx jest src/lib/workflows/pilot/__tests__/presentation.test.ts
```

---

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Identificar o hash do commit da correcao: `git log --oneline src/lib/workflows/pilot/presentation.ts` | Hash visivel no output |
| 2 | Reverter o commit de forma segura: `git revert <commit-hash>` | Cria novo commit de reversao; workspace limpo preservado |
| 3 | Confirmar suite verde apos reversao | `npx jest src/lib/workflows/pilot/__tests__/presentation.test.ts` com 3 testes passando |

**Metodo alternativo (sem commit dedicado):** Editar manualmente os 2 arquivos revertendo as 3 linhas alteradas conforme o ANTES/DEPOIS da Secao 5. Indicado quando a correcao foi aplicada em conjunto com outras mudancas no mesmo commit e `git revert` afetaria mais do que o desejado.

> ⚠️ **Nao usar `git checkout -- <arquivo>`:** esse comando descarta silenciosamente qualquer mudanca local (staged ou unstaged) nos arquivos alvo, podendo causar perda de trabalho nao commitado em workspaces sujos.

**Risco de rollback:** Baixo. A mudanca e de 2 linhas de logica + 1 variavel local. Sem efeitos colaterais em outros modulos.

---

## 10. Implementation Checklist

### Pre-Build

- [x] DEFINE document aprovado (fornecido inline, Clarity Score 15/15)
- [x] Architecture decisions documentadas (ADR-001, ADR-002)
- [x] File manifest completo (2 arquivos)
- [x] Code patterns validados contra codebase atual
- [x] Escopo confirmado: apenas `presentation.ts` e `presentation.test.ts`

### Post-Build (Acceptance)

| Check | Maps to | Criterion |
|-------|---------|-----------|
| [ ] `canFinalize` retorna `isOwner \|\| isResponsible` no bloco `waiting_action` | M1 | Alinhar com backend |
| [ ] 3 novos testes para `waiting_action` existem e passam | M2 | Cobertura de teste |
| [ ] Nenhum outro arquivo foi alterado | M3 | Escopo local |
| [ ] `isResponsible` extraido como variavel local no topo da funcao | S1 | Legibilidade |
| [ ] Os 3 testes pre-existentes continuam passando | M2 | Nao-regressao |
| [ ] Bloco `in_progress` usa `isResponsible` em vez de expressao inline | S1 | DRY |
| [ ] `npx jest src/lib/workflows/pilot/__tests__/presentation.test.ts` passa com 6 testes (3 existentes + 3 novos) | M2 | Suite verde |

---

## 11. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
1. src/lib/workflows/pilot/presentation.ts
2. src/lib/workflows/pilot/__tests__/presentation.test.ts

Key requirements:
- Adicionar `const isResponsible = item.responsibleUserId === actorUserId;` na linha 14 (apos isOwner)
- Alterar `canFinalize: false` para `canFinalize: isOwner || isResponsible` no bloco waiting_action
- Substituir `item.responsibleUserId === actorUserId` por `isResponsible` no bloco in_progress (refatoracao cosmetica)
- Adicionar 3 novos testes dentro de describe('waiting_action status') conforme Pattern 2
- Executar `npx jest src/lib/workflows/pilot/__tests__/presentation.test.ts` e confirmar 6 testes passando
- NAO alterar nenhum outro arquivo
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-27 | design-agent | Initial design based on DEFINE inline |
