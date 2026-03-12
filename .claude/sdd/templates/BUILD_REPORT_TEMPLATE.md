# BUILD REPORT: {FEATURE_NAME}

> Generated: {DATE}
> Source: DESIGN_{FEATURE_NAME}.md
> Status: COMPLETE | PARTIAL | BLOCKED

## 1. Summary

| Metric | Value |
|--------|-------|
| Tasks Total | {N} |
| Tasks Completed | {N} |
| Tasks Remaining | {N} |
| Files Created | {N} |
| Files Modified | {N} |
| Lines Added | ~{N} |

## 2. Execution Timeline

| Time | Task | Agent | Status |
|------|------|-------|--------|
| {HH:MM} | {Descricao da task} | {agent-name} | Done/Blocked/Skipped |

## 3. Files Modified

### {path/file}
```{language}
{Resumo das mudancas feitas}
```
**Verification:** {Metodo de verificacao + resultado}

{Repetir para cada arquivo}

## 4. Verification Results

### Syntax Checks
| File | Result |
|------|--------|
| {path/file} | Pass/Fail |

### Integration Checks
| Check | Result |
|-------|--------|
| {Verificacao} | Verified/Failed |

### Manual Testing Required
- [ ] {Teste manual 1}
- [ ] {Teste manual 2}

## 5. Issues Encountered

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 1 | {Descricao do problema} | {Como resolvido} | Resolved/Open |

{Se nenhum: "Nenhum issue encontrado."}

## 6. Deviations from DESIGN

| Item | Design Said | Actual Implementation | Reason |
|------|-------------|----------------------|--------|
| {Item} | {O que o DESIGN especificava} | {O que foi feito} | {Razao do desvio} |

{Se nenhum: "Implementacao 100% conforme DESIGN."}

## 7. Documentation Updates Required

| Document | Update Needed |
|----------|---------------|
| CLAUDE.md | {O que atualizar} |
| .cursor/plans/ | {Plano a atualizar/fechar, se aplicavel} |

## 8. Post-Build Checklist

### Completed
- [x] {Item completado 1}
- [x] {Item completado 2}

### Pending
- [ ] {Item pendente 1}
- [ ] {Item pendente 2}

## 9. Next Steps

1. **Testes:** {O que testar}
2. **Documentacao:** {O que atualizar}
3. **Commit:** {Branch name + merge strategy}
4. **Deploy:** {Instrucoes de deploy}

## 10. Implementation Notes

### Code Quality
- {Nota sobre qualidade}

### Architecture Decisions
- {Decisoes tomadas durante build que nao estavam no DESIGN}

### Performance Impact
- {Impacto em performance, se relevante}

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {DATE} | build-agent | Initial build report |
