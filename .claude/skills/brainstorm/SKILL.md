---
name: brainstorm
description: Inicia sessao de brainstorm para explorar uma nova feature do 3A RIVA Connect
allowed-tools: Read, Glob, Grep, AskUserQuestion
---

Inicie uma sessao de brainstorm para a seguinte ideia: $ARGUMENTS

## Instrucoes

1. Primeiro, leia o contexto do projeto:
   - CLAUDE.md
   - Planos ativos em `.cursor/plans/` (se relevantes)

2. Explore o codigo existente relacionado a ideia:
   - Backend: `airchtect-back/utils/core/` e `airchtect-back/utils/api/routes/`
   - Frontend: `airchtect-front/app/` e `airchtect-front/components/`

3. Faca perguntas UMA DE CADA VEZ para entender:
   - Quem vai usar? (Usuarios finais, arquitetos, admins)
   - Onde aparece? (Nova pagina, componente existente, background service)
   - O que envolve? (Frontend, Backend, AI, Full stack)
   - Qual a urgencia?

4. Apos minimo 3 perguntas, apresente 2-3 abordagens com trade-offs

5. Aplique YAGNI - remova features desnecessarias

6. Confirme o entendimento com o usuario

7. Gere o documento em `.claude/sdd/features/BRAINSTORM_{FEATURE}.md`

Siga as instrucoes detalhadas do agente: `.claude/agents/workflow/brainstorm-agent.md`
