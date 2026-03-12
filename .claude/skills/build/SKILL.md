---
name: build
description: Executa a implementacao de uma feature do 3A RIVA Connect seguindo o DESIGN
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

Execute a implementacao da feature: $ARGUMENTS

## Instrucoes

1. Leia o DESIGN document:
   - `.claude/sdd/features/DESIGN_{FEATURE}.md`

2. Execute na ordem de dependencias:
   - Database migrations primeiro
   - Backend services e routes (registrar em `utils/api/main.py`)
   - Frontend components, hooks e pages
   - AI services (se aplicavel)

3. Para cada arquivo:
   - Siga o pattern do DESIGN
   - Verifique sintaxe (`python -m py_compile` para Python, `pnpm lint` para TS)
   - Delegue para specialists se complexo

4. Gere o relatorio em `.claude/sdd/reports/BUILD_REPORT_{FEATURE}.md`

Siga as instrucoes detalhadas do agente: `.claude/agents/workflow/build-agent.md`
