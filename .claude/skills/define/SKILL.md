---
name: define
description: Define requisitos estruturados para uma feature do 3A RIVA Connect
allowed-tools: Read, Glob, Grep, AskUserQuestion, Write
---

Defina os requisitos estruturados para a feature: $ARGUMENTS

## Instrucoes

1. Leia o contexto:
   - CLAUDE.md
   - Se existir: `.claude/sdd/features/BRAINSTORM_{FEATURE}.md`

2. Extraia e estruture:
   - Problem Statement (uma frase)
   - Users (com pain points)
   - Goals (MoSCoW: MUST/SHOULD/COULD/WON'T)
   - Success Criteria (mensuraveis)
   - Technical Scope (Backend/Frontend/AI/Database)
   - Auth Requirements (JWT, user isolation)
   - Out of Scope

3. Calcule Clarity Score (minimo 12/15 para prosseguir)

4. Gere o documento em `.claude/sdd/features/DEFINE_{FEATURE}.md`

Siga as instrucoes detalhadas do agente: `.claude/agents/workflow/define-agent.md`
