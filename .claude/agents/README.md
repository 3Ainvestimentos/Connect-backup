# SDD Agents — 3A RIVA Connect

> Specification-Driven Development workflow for the 3A RIVA Connect corporate intranet platform.

## Workflow Overview

```
Phase 0          Phase 1         Phase 2          Phase 3         Phase 4
/brainstorm  -->  /define    -->  /design     -->  /build     -->  /ship
  (explore)      (require)      (architect)     (implement)     (archive)

                        /iterate (cross-phase updates)
```

## Slash Commands

| Command | Phase | What it does |
|---------|-------|-------------|
| `/load-project` | - | Carrega contexto completo do projeto |
| `/brainstorm {idea}` | 0 | Explora ideia com perguntas interativas |
| `/define {feature}` | 1 | Estrutura requisitos com clarity score |
| `/design {feature}` | 2 | Cria especificacao tecnica + file manifest |
| `/build {feature}` | 3 | Implementa seguindo o DESIGN |
| `/ship {feature}` | 4 | Arquiva feature + lessons learned |
| `/iterate {mudanca}` | * | Atualiza documentos com mudancas |
| `/architecture [geral\|backend\|frontend\|escala\|seguranca]` | - | Analisa arquitetura, gera diagrama + limitacoes + escala + boas praticas |

## Specialist Agents

| Agent | Domain | When Used |
|-------|--------|-----------|
| `@firebase-specialist` | Firebase (Firestore, Storage, Auth, Functions) | Security Rules, Context logic, Collections |
| `@react-frontend-developer` | Frontend (Next.js, React, TypeScript) | Pages, components, hooks, UI |
| `@architecture-analyst` | Cross-cutting (codigo como um todo) | Diagrama de arquitetura, limitacoes, escala, melhores praticas |

## Directory Structure

```
.claude/
├── agents/
│   ├── workflow/           # SDD phase agents
│   │   ├── brainstorm-agent.md
│   │   ├── define-agent.md
│   │   ├── design-agent.md
│   │   ├── build-agent.md
│   │   ├── ship-agent.md
│   │   └── iterate-agent.md
│   ├── specialists/        # Domain-specific agents
│   │   ├── firebase-specialist.md
│   │   ├── react-frontend-developer.md
│   │   └── architecture-analyst.md
│   └── README.md           # This file
├── kb/                     # Knowledge Base
│   ├── _index.yaml
│   ├── firebase-nextjs/     # Firebase rules, functions, and SDK patterns
│   ├── react-nextjs/       # Frontend patterns & specs
│   └── project/            # Cross-cutting project knowledge
├── sdd/
│   ├── features/           # Active feature documents
│   ├── reports/            # Build reports
│   ├── archive/            # Shipped features
│   └── templates/          # Document templates
└── skills/                 # Slash command definitions
    ├── load-project/
    ├── brainstorm/
    ├── define/
    ├── design/
    ├── build/
    ├── ship/
    ├── iterate/
    └── architecture/
```

## Contexto do repositório

- Os agentes referenciam **CLAUDE.md** quando disponível; neste repositório use **README.md** e **DESIGN_GUIDELINES.md** (e `.claude/kb/project/`) como fonte de verdade. O skill `/load-project` já está ajustado para isso.

## How It Works

1. **Start a session:** `/load-project` to load context
2. **New feature idea:** `/brainstorm {idea}` to explore interactively
3. **Formalize requirements:** `/define {feature}` to structure requirements
4. **Technical design:** `/design {feature}` to create architecture spec
5. **Implement:** `/build {feature}` to execute implementation
6. **Archive:** `/ship {feature}` to archive and capture lessons
7. **Changes mid-flight:** `/iterate {change}` to update documents

## Key Principles

- **One question at a time** during brainstorm (no question dumps)
- **Clarity score >= 12/15** required before design phase
- **File manifest** in DESIGN drives build execution order
- **Specialist delegation** for complex domain-specific tasks
- **YAGNI** applied at every phase — remove what's not needed NOW
