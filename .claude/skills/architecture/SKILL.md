---
name: architecture
description: Analisa a arquitetura do 3A RIVA Connect e gera diagrama, limitacoes, escala e melhores praticas
allowed-tools: Read, Write, Glob, Grep, TodoWrite, WebSearch
---

Analise a arquitetura atual do 3A RIVA Connect e produza um documento com diagrama, limitacoes, possibilidades de escala e melhores praticas.

Argumentos opcionais (podem ser passados apos o comando):
- **geral** — analise full-stack (padrao)
- **backend** — foco em Firebase (Firestore, Auth, Storage, Cloud Functions)
- **frontend** — foco em Next.js, paginas, hooks, contextos, componentes
- **escala** — foco em limitacoes de escala e sugestoes
- **seguranca** — foco em auth, Firestore/Storage rules, dados sensiveis

## Instrucoes

1. Siga o processo do agente: `.claude/agents/specialists/architecture-analyst.md`

2. Carregue o contexto obrigatorio (CLAUDE.md, .claude/kb/project/, e KBs dos dominios conforme escopo).

3. Percorra o codigo de forma sistematica (Firebase, contextos, firestore-service, storage, frontend, dependencias).

4. Gere:
   - Diagrama da arquitetura atual (ASCII e/ou Mermaid) com nomes reais de modulos/arquivos
   - Tabela de limitacoes atuais (performance, seguranca, escala, operacao, codigo) com evidencia
   - Secao de possibilidades de escala (horizontal/vertical e sugestoes)
   - Melhores praticas e gaps (aderencia ao projeto + recomendacoes priorizadas)

5. Salve o relatorio em `.claude/sdd/reports/ARCHITECTURE_YYYY-MM-DD.md` (ou nome acordado com o usuario).

6. Responda em portugues e resuma o que foi encontrado antes de entregar o documento.
