---
name: load-project
description: Carrega todo o contexto do projeto 3A RIVA Connect - use no inicio de cada sessao
allowed-tools: Read, Glob, Grep, Bash
---

Carregue o contexto completo do projeto 3A RIVA Connect.

## Instrucoes

### Fase 1 -- Documentacao (fonte de verdade estavel)

1. **Leia os arquivos de contexto obrigatorios:**
   - README.md e DESIGN_GUIDELINES.md (regras do projeto, arquitetura, stack). Se existir CLAUDE.md, leia tambem.
   - `.claude/kb/project/concepts.md` e `.claude/kb/project/specs.md` (especificacoes do 3A RIVA Connect)
   - `.cursor/plans/*.plan.md` (planos ativos de implementacao, se existirem)

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
   - Liste as rotas em `src/app/(app)/` e `src/app/(auth)/`
   - Liste as paginas em `src/app/**/page.tsx`
   - Liste os componentes em `src/components/`
   - Liste os contextos em `src/contexts/`
   - Liste os servicos em `src/lib/` (firestore-service, firebase-admin, etc.)
   - Cloud Functions em `functions/src/`

### Fase 4 -- Resumo executivo

5. **Forneca um resumo conciso contendo:**
   - Stack tecnologico (Next.js 15, React 19, TypeScript, Firebase Firestore/Auth/Storage, Cloud Functions)
   - Estrutura de pastas principal (src/app/, src/components/, src/contexts/, src/lib/, functions/)
   - Status atual do projeto (da documentacao + planos ativos)
   - **Ultimos commits reais** (do git log)
   - **Trabalho em andamento** (uncommitted changes, feature branches)
   - **Divergencias** entre docs e git (se houver)
   - Issues conhecidos ou divida tecnica
   - Planos ativos em `.cursor/plans/`

6. **Confirme que esta pronto** para ajudar com qualquer tarefa do projeto.

## Regras Importantes (3A RIVA Connect)

- Responder sempre em PORTUGUES (PT-BR)
- NUNCA commitar sem permissao explicita do PM
- Usar feature branches para commits
- Seguir Plan-First Workflow (criar plano antes de implementar; .cursor/plans/ ou .claude/sdd/)
- Seguir Conventional Commits para mensagens
- Manter separacao de responsabilidades (Contexts = orquestrador, firestore-service = logica de dados)
