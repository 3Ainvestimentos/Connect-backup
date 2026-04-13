# DESIGN: {FEATURE_NAME}

> Generated: {DATE}
> Status: Ready for /build
> Source: DEFINE_{FEATURE_NAME}.md

## 1. Requirements Summary

### Problem
{Resumo do problema em 1-2 frases}

### Success Criteria
| Criterion | Target |
|-----------|--------|
| {Criterio 1} | {Alvo} |

### Constraints
- {Restricao 1}
- {Restricao 2}

## 2. Architecture

### System Diagram

```text
{Diagrama ASCII mostrando componentes e fluxo de dados}

Example (3A RIVA Connect):
[Browser] --> [Next.js App Router] --> [React Contexts]
                                              |
                                    [firestore-service.ts] --> [Firestore / Auth / Storage]
                                              |
                                    [Cloud Functions] (triggers / server logic)
```

### Data Flow

```text
LAYER 1 (Frontend):
1. src/app/(app)/{feature}/page.tsx: {acao}
2. src/components/{domain}/{component}.tsx: {acao}

LAYER 2 (State / Orchestration):
3. src/contexts/{Feature}Context.tsx: {acao} (listeners, React Query)

LAYER 3 (Data):
4. src/lib/firestore-service.ts: {acao} (CRUD, sanitization)
5. src/lib/firebase.ts / firebase-admin.ts: {acao}

LAYER 4 (Backend):
6. functions/src/index.ts: {acao} (triggers, callable)
7. firestore.rules / storage.rules: {regras de seguranca}
```

### State Management
| State | Storage | Lifecycle |
|-------|---------|-----------||
| {Estado 1} | {React state/context/localStorage/DB} | {Quando criado, quando limpo} |

## 3. Architecture Decisions

### ADR-001: {Titulo da decisao}

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | {DATE} |
| **Context** | {Contexto que motivou a decisao} |

**Choice:** {O que foi escolhido}

**Rationale:**
1. {Razao 1}
2. {Razao 2}

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| {Alternativa 1} | {Razao} |

**Consequences:**
- Positivo: {Beneficio}
- Negativo: {Trade-off}

---

{Repetir ADR para cada decisao arquitetural significativa}

## 4. File Manifest

### Execution Order
| Phase | Files | Agent |
|-------|-------|-------|
| 1. Database | {models, migrations} | @firebase-specialist |
| 2. Backend | {routes, services, core} | @firebase-specialist |
| 4. Frontend | {pages, components, hooks} | @react-frontend-developer |

### Detailed Manifest
| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | {path/file} | {Create/Modify} | {O que faz} | @{agent} | - |
| 2 | {path/file} | {Create/Modify} | {O que faz} | @{agent} | #1 |

## 5. Code Patterns

### Pattern 1: {Nome do pattern}

```python
# functions/src/utils/core/{feature}.py
# Orchestrator pattern (core.py = orchestrator, service.py = logic)

async def process_{feature}(request_data, db, user_id):
    """Orchestrates {feature} workflow."""
    # 1. Validate input
    # 2. Call service layer
    result = await {feature}_service.execute(request_data)
    # 3. Save to DB
    # 4. Return response
    return result
```

### Pattern 2: {Nome do pattern}

```typescript
// src/app/components/{Component}.tsx

"use client";
import { useState } from "react";

export function {Component}() {
  // Component implementation
}
```

{Repetir para cada pattern significativo}

## 6. API Contract

{Se novos endpoints ou mudancas em endpoints existentes:}

### {METHOD} {/api/endpoint} ({novo/sem mudanca})
```http
{METHOD} /api/{endpoint}
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body
```json
{
  "field": "value"
}
```

### Response (Success)
```json
{
  "success": true,
  "data": {}
}
```

### Response (Error)
```json
{
  "detail": "{error message}"
}
```

{Se nenhum endpoint muda: "Nenhum endpoint novo ou alterado."}

## 7. Database Schema (mudancas)

| Model | Field | Type | Details |
|-------|-------|------|---------|
| {Model} | {field} | {String/Integer/etc} | {nullable, default, index} |

{Se nenhuma mudanca: "Nenhuma mudanca no schema."}

## 8. Testing Strategy

### Unit Tests
| Component | Test |
|-----------|------|
| {Componente} | {Como testar} |

### Integration Tests
| Flow | Test |
|------|------|
| {Fluxo} | {Como testar} |

### Acceptance Tests

```gherkin
GIVEN {pre-condicao}
WHEN {acao}
THEN {resultado}
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | {Acao de rollback} | {Como verificar} |

**Metodo rapido:** `git revert {commit-hash}`

## 10. Implementation Checklist

### Pre-Build
- [ ] DEFINE document approved
- [ ] Architecture decisions documented
- [ ] File manifest complete
- [ ] Code patterns validated against codebase
- [ ] PM approved scope

### Post-Build
- [ ] Todos os arquivos do manifest modificados/criados
- [ ] {Verificacao especifica 1}
- [ ] {Verificacao especifica 2}
- [ ] Testes passaram
- [ ] CLAUDE.md atualizado (se mudanca arquitetural)

## 11. Specialist Instructions

### For @firebase-specialist
```markdown
Files to modify:
- {path/file}

Key requirements:
- {Requisito especifico}
- {Restricao especifica}
```

### For @react-frontend-developer
```markdown
Files to modify:
- {path/file}

Key requirements:
- {Requisito especifico}
```

```markdown
Files to modify:
- {path/file}

Key requirements:
- {Requisito especifico}
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {DATE} | design-agent | Initial design based on DEFINE_{FEATURE_NAME}.md |
