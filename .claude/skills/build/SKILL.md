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
   - Firestore rules/indexes (`firestore.rules`, `firestore.indexes.json`) se houver novos schemas
   - Cloud Functions em `functions/src/` (se aplicavel)
   - Contextos em `src/contexts/` (logica de negocio e orquestracao Firestore)
   - Servicos em `src/lib/` (firestore-service, utilitarios)
   - Componentes em `src/components/`
   - Paginas em `src/app/(app)/`

3. Para cada arquivo:
   - Siga o pattern do DESIGN e as convencoes do CLAUDE.md
   - Use `cleanDataForFirestore` antes de persistir no Firestore
   - Use `buildStorageFilePath` / `sanitizeStoragePath` para Storage
   - Verifique sintaxe com `npm run lint` e `npm run typecheck`
   - Delegue para specialists se complexo (@firebase-specialist, @react-frontend-developer)

4. Gere o relatorio em `.claude/sdd/reports/BUILD_REPORT_{FEATURE}.md`

Siga as instrucoes detalhadas do agente: `.claude/agents/workflow/build-agent.md`
