---
name: iterate
description: Atualiza documentos SDD quando ha mudancas durante o desenvolvimento
allowed-tools: Read, Write, Edit, AskUserQuestion, Glob, Grep
---

Atualize os documentos SDD com a seguinte mudanca: $ARGUMENTS

## Instrucoes

1. Identifique qual documento precisa ser atualizado:
   - BRAINSTORM_*.md
   - DEFINE_*.md
   - DESIGN_*.md

2. Analise o impacto da mudanca (Low/Medium/High)

3. Aplique a mudanca e atualize revision history

4. Verifique se precisa cascatear para documentos downstream:
   - BRAINSTORM -> DEFINE
   - DEFINE -> DESIGN
   - DESIGN -> BUILD

5. Confirme mudancas de alto impacto com o usuario

Siga as instrucoes detalhadas do agente: `.claude/agents/workflow/iterate-agent.md`
