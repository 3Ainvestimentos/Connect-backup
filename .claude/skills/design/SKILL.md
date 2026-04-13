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
   - Contextos (orquestracao): `src/contexts/`
   - Componentes: `src/components/`
   - Hooks: `src/hooks/`
   - Servicos Firestore: `src/lib/firestore-service.ts`
   - Utilitarios: `src/lib/`
   - Cloud Functions: `functions/src/`
   - Paginas: `src/app/(app)/`

3. Crie:
   - ASCII Architecture Diagram
   - ADRs (Architecture Decision Records)
   - File Manifest com agents (@firebase-specialist, @react-frontend-developer)
   - Code Patterns copy-paste (seguindo CLAUDE.md: Context=Logic, cleanDataForFirestore, buildStorageFilePath)
   - Firestore schema (se houver novos documentos/colecoes)
   - Testing Strategy (jest + mock-firestore-service)
   - Rollback Plan

4. Gere o documento em `.claude/sdd/features/DESIGN_{FEATURE}.md`

Siga as instrucoes detalhadas do agente: `.claude/agents/workflow/design-agent.md`
