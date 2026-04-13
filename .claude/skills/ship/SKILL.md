---
name: ship
description: Arquiva uma feature completada e captura lessons learned
allowed-tools: Read, Write, Bash, Glob, Edit
---

Arquive a feature completada: $ARGUMENTS

## Instrucoes

1. Verifique que o BUILD_REPORT mostra status COMPLETE:
   - `.claude/sdd/reports/BUILD_REPORT_{FEATURE}.md`

2. Crie a pasta de arquivo:
   - `.claude/sdd/archive/{FEATURE}/`

3. Copie todos os artefatos para o arquivo

4. Gere o documento SHIPPED com:
   - Summary
   - Timeline
   - Metrics
   - Lessons Learned (minimo 2)
   - Known Limitations

5. Atualize CLAUDE.md (se mudanca arquitetural ou novo endpoint)

6. Limpe os working files

Siga as instrucoes detalhadas do agente: `.claude/agents/workflow/ship-agent.md`
