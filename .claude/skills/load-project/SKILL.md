---
name: load-project
description: Carrega todo o contexto do projeto 3A RIVA Connect - use no inicio de cada sessao
allowed-tools: Read, Glob, Grep, Bash
---

Carregue o contexto completo do projeto 3A RIVA Connect.

## Instrucoes

### Fase 1 -- Documentacao (fonte de verdade estavel)

1. **Leia os arquivos de contexto obrigatorios:**
   - `CLAUDE.md` (regras do projeto, arquitetura, stack, convencoes)
   - `README.md` (visao geral, se existir)
   - `.claude/kb/project/concepts.md` e `.claude/kb/project/specs.md` (especificacoes do 3A RIVA Connect, se existirem)
   - `.claude/sdd/` (documentos SDD ativos: BRAINSTORM, DEFINE, DESIGN)

### Fase 2 -- Estado real do repositorio (Git)

2. **Verifique o estado atual do Git:**
   - `git log --oneline -15` -- ultimos 15 commits
   - `git status` -- arquivos modificados/nao commitados
   - `git branch -a` -- branches ativas
   - `git diff --stat` -- resumo das mudancas nao commitadas

3. **Analise divergencias:**
   - Compare commits recentes com o documentado no README.md / DESIGN_GUIDELINES.md (ou CLAUDE.md se existir)
   - Se houver commits NAO documentados, liste como "pendencia de documentacao"
   - Se houver branches abertas, identifique features em andamento

### Fase 3 -- Estrutura do codigo

4. **Entenda a estrutura atual:**
   - Rotas: `src/app/(app)/` (autenticado) e `src/app/(auth)/` (publico)
   - Paginas: `src/app/**/page.tsx`
   - Componentes: `src/components/`
   - Contextos (logica de negocio): `src/contexts/`
   - Hooks: `src/hooks/`
   - Servicos: `src/lib/` (firestore-service.ts, path-sanitizer.ts, etc.)
   - Cloud Functions: `functions/src/`
   - Firestore rules: `firestore.rules` e `firestore.indexes.json`

### Fase 4 -- Resumo executivo

5. **Forneca um resumo conciso contendo:**
   - Stack tecnologico (Next.js 15, React 19, TypeScript, Firebase Firestore/Auth/Storage, Cloud Functions)
   - Estrutura de pastas principal (src/app/, src/components/, src/contexts/, src/lib/, functions/)
   - Status atual do projeto (da documentacao + SDD ativos)
   - **Ultimos commits reais** (do git log)
   - **Trabalho em andamento** (uncommitted changes, feature branches)
   - **Divergencias** entre docs e git (se houver)
   - Issues conhecidos ou divida tecnica
   - Documentos SDD ativos em `.claude/sdd/`

6. **Confirme que esta pronto** para ajudar com qualquer tarefa do projeto.

## Regras Importantes (3A RIVA Connect)

- Responder sempre em PORTUGUES (PT-BR)
- NUNCA commitar sem permissao explicita do PM
- Usar feature branches para commits
- Seguir Plan-First Workflow (criar plano antes de implementar; .claude/sdd/)
- Seguir Conventional Commits para mensagens
- Manter separacao de responsabilidades (Contexts = orquestrador, firestore-service = logica de dados)
