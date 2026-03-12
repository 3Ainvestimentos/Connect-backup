---
name: design
description: Cria especificacao tecnica completa para uma feature do 3A RIVA Connect
allowed-tools: Read, Glob, Grep, Write, Task
---

Crie a especificacao tecnica para a feature: $ARGUMENTS

## Instrucoes

1. Leia o DEFINE document:
   - `.claude/sdd/features/DEFINE_{FEATURE}.md`

2. Explore padroes existentes no codigo:
   - Backend: `airchtect-back/utils/core/` (separacao core/service)
   - Frontend: `airchtect-front/components/` e `airchtect-front/hooks/`
   - AI: `airchtect-back/utils/core/ai/` (modular architecture)
   - Database: `airchtect-back/utils/database/models.py`

3. Crie:
   - ASCII Architecture Diagram
   - ADRs (Architecture Decision Records)
   - File Manifest com agents (@firebase-specialist, @react-frontend-developer, @)
   - Code Patterns copy-paste
   - API Contract (se endpoint)
   - Testing Strategy
   - Rollback Plan

4. Gere o documento em `.claude/sdd/features/DESIGN_{FEATURE}.md`

Siga as instrucoes detalhadas do agente: `.claude/agents/workflow/design-agent.md`
