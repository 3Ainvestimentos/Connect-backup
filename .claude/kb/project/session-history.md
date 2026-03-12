# Project — Session History

> Commit history by session for reference. Moved from CLAUDE.md to reduce file size.

## Sessao 06-08/03/2026 (Lucas) — Preview Rework: Dual Modality + Planta Realista + Modularização

- Branch: `refactor/architecture`
- `7e0124d` (06/03) — feat(preview): dual modality + planta realista
  - Param `modo`: `planta_mobiliada` | `planta_vazia` (default) em `POST /gerar-imagens`
  - Nova etapa `gerar_planta_realista()`: gera vista top-down fotorrealista após interpretação LLM
  - `ImageSession.gcs_path_planta_realista` (nullable) + Migration 007
  - Novo status_detail: `SD_GERANDO_PLANTA_REALISTA`
  - Frontend: `/preview` com card selection mobiliada vs vazia
- `e6b483b` (07/03) — feat(preview): prompts dedicados para modo mobiliada
  - `utils/core/preview/prompts/mobiliada.py`: 763 linhas, 18 funções por tipo de cômodo
  - Preamble compartilhado `_fidelidade_preamble()`: instrui AI a usar AMBAS as imagens (planta + planta realista)
  - Fidelidade absoluta: sem inventar, adicionar ou remover móveis
- `254a45f` (08/03) — refactor(ai): separar geração de imagem genérica do prompt de preview
  - `generate_image_generic()` em `gemini_service.py` — função standalone com retry, circuit breaker, fallback, upscaling
  - `gerar_imagem()` renomeado para `gerar_imagem_interna_preview()` (alias mantido)
  - `gerar_planta_realista()` usa `generate_image_generic()` diretamente
  - Elimina dependência circular entre `gemini_service` e `image_service`
- `7182f60` (08/03) — refactor(backend): modularizar preview (image_generation → preview)
  - `utils/core/image_generation/` → `utils/core/preview/`
  - `image_service.py` dividido em 3 arquivos (SRP): `core.py` + `generator.py` + `prompt_builder.py`
  - 9 arquivos de prompts movidos para `utils/core/preview/prompts/`
  - Route renomeada: `routes/image_generation.py` → `routes/preview.py`
  - `preview_tasks.py` (Phase B) atualizado com novo import path

## Sessao 05/03/2026 (Vitor + Claude) — Phase B: Celery + Redis + Worker

- Branch: `refactor/architecture`
- `dd40d73` — docs(sdd): SDD docs completos (BRAINSTORM + DEFINE + DESIGN para Phase B)
- `062de93` — feat(worker): implement Phase B — Celery + Redis + Worker migration (22 files, +1342 linhas)
  - `utils/worker/celery_app.py`: config Celery (queue=arqtech, JSON serializer, concurrency=1, Beat schedule 2min)
  - `utils/worker/tasks/`: 6 wrappers (video x2, sketchup x2, photo_edit, preview, architect) + reaper_task.py
  - `Dockerfile`: multi-stage com 3 targets: `api`, `worker`, `beat`
  - `docker-compose.yml`: 5 serviços: db (PostgreSQL), redis, api, worker, beat
  - `.env.example`: todas as env vars documentadas
  - Feature flag `USE_CELERY` (default false) em todas as 5 routes — rollback instantâneo para Phase A
  - Config: `REDIS_URL`, `USE_CELERY`, `CELERY_WORKER_CONCURRENCY`, `CELERY_WORKER_MAX_TASKS_PER_CHILD`
  - Decisões-chave: `worker_concurrency=1` como rate limiter implícito; payloads GCS paths nunca bytes (<3KB); wrapper pattern preserva background functions inalteradas
- **Testes passados:** py_compile (20 files), import sem Redis (`USE_CELERY=false`), Worker conecta Redis e descobre 7 tasks, Reaper marca zombies, payloads <3KB
- **Não testado:** E2E com `USE_CELERY=true` + Docker Compose full stack

## Sessao 25/02/2026 (Lucas) — Fix DetachedInstanceError no Auth Cache

- Branch: `refactor/architecture`
- `2418bcb` — fix(auth): corrigir DetachedInstanceError — cache de identidade mínima em vez de ORM
  - Root cause: cache armazenava objeto `User` ORM; sessão SQLAlchemy fecha após cada request → objeto ficava detached
  - Fix: `Tuple[User, float]` → `CachedIdentity` TypedDict (`user_id`, `email`, `expiry`)
  - Cache hit: reidrata User via `get_user_by_id(db, user_id)` na sessão da request atual
  - Expiry: `min(now + TTL, exp - skew)` respeita validade real do JWT
  - Skip cache quando `exp - skew <= now` (token quase expirado)
  - Hit com user removido: invalida cache + retorna 401 (nunca 500)
  - Novo helper `get_user_by_id` com `session.get()` em `models.py`
  - SDD: DEFINE + DESIGN em `.claude/sdd/features/`
  - Pendências evolutivas: `.claude/kb/project/pending.md`

## Sessao 23/02/2026 (Lucas) — Auth Cache + Polling Optimization

- Branch: `refactor/architecture`
- `7139c5d` — perf(auth): cache de auth com TTL e limpeza em verify_video_ownership
  - `middleware.py`: cache in-memory com SHA-256 key, `threading.Lock`, lazy eviction, TTL configuravel (`AUTH_CACHE_TTL_SECONDS`, default 120s)
  - `utils.py`: log "Token decoded successfully" movido para `logger.debug`
  - `video_db_service.py`: `verify_video_ownership` reduzido de 2 queries para 1, removido log INFO/warning
  - SDD completo: BRAINSTORM + DEFINE + DESIGN + BUILD_REPORT em `.claude/sdd/`
- **Impacto:** Polling a cada 3s nao faz mais decode JWT + get_user_by_email a cada request (apenas 1x por TTL)

## Sessao 22/02/2026 (Lucas) — Front Cache Fix + Architecture Agent

- Branch: `refactor/architecture`
- `38288f5` — (fix) evita cache no front: `cache: "no-store"` no `useJobPolling.ts` fetch
  - Polling retornava dados stale do cache do browser; agora sempre busca dados frescos
- `a536971` (19/02) — architecture detail: criou agent `architecture-analyst`, skill `/architecture`, report `ARCHITECTURE_2026-02-19.plan.md`

## Sessao 22/02/2026 (parte 3) — Phase A Fixes: DESIGN + BUILD + SQLite fix

- Branch: `refactor/architecture`
- `7cc89fb` — fix(async): corrigir event loop blocking e video StatusProgress gap (Phase A Fixes)
  - 6x `async def` → `def` em background tasks (libera event loop)
  - 2x `asyncio.create_task` → `BackgroundTasks.add_task` (sketchup render + architect tipos)
  - Video frontend: `setVideo()` imediato apos POST 202 (StatusProgress instantaneo)
- **Novo fix (sem commit ainda):** SQLite session isolation nos 4 endpoints de polling
  - `db.expire_all()` em sketchup.py, video_generation.py, photo_edit.py
  - `db.expire_all()` + `db.refresh(planta)` em image_generation.py
  - Root cause: `SessionLocal` usa `autocommit=False` — sessao do polling nao via commits da background thread
- **SDD workflow completo:** /define (sessao anterior) → /design → /build
  - DESIGN criado: `.claude/sdd/features/DESIGN_phase_a_fixes.md` (3 ADRs, file manifest B1-B5 + F1)
  - BUILD executado: todos os 6 arquivos modificados, verificados com py_compile e tsc
- **Testes manuais:**
  - SketchUp render: 21 polls servidos em <500ms durante processamento AI (~120s)
  - Event loop responsivo durante toda a geracao
  - status_detail: nao progredia → fix SQLite session isolation aplicado
- **Docs atualizados:** CLAUDE.md, session-history.md, DEFINE, DESIGN

## Sessao 22/02/2026 (parte 2) — Phase A Testing + DEFINE phase_a_fixes

- **CLAUDE.md comprimido:** 42.8k → 28.2k chars (session logs, directory trees, AI module movidos para KBs)
- **Criado:** `.claude/kb/project/session-history.md` (este arquivo)
- **Investigacao profunda:** Status "Na fila" preso → root cause confirmado: event loop blocking
  - Todas 6 background tasks sao `async def` (rodam no event loop)
  - Todas funcoes AI sao sync (`def`) — bloqueiam event loop por 30-180s
  - Polls HTTP nao sao servidos durante blocking
  - Fix: `async def` → `def` (thread pool libera event loop)
  - Este fix e o mesmo codigo que Celery tasks usarao na Phase B
- **Signed URL issue:** Confirmado RESOLVIDO na sessao anterior (status_only=true end-to-end)
- **SketchUp:** JA TEM StatusProgress integrado, gap de submit ~200ms (nao corrigir)
- **Video:** TEM StatusProgress mas so apos video object carregar (3-8s gap, corrigir)
- **DEFINE criado:** `.claude/sdd/features/DEFINE_phase_a_fixes.md` (clarity 14/15)
  - MUST: 6x `async def` → `def`, 2x `asyncio.create_task` → `BackgroundTasks.add_task`
  - SHOULD: Video StatusProgress imediato apos submit
  - WON'T: SketchUp submit (gap minimo), AI async nativo, timeout rigido
- **Proximo passo:** /design phase_a_fixes → /build

## Sessao 22/02/2026 — Phase A: Async + Polling (queue_worker_migration)

- Branch: `refactor/architecture`
- `3f541a5` — feat(async): Phase A — todas as 7 rotas retornam 202 + polling com status granular
- `7b1cbe3` — fix(async): corrigir 3 issues da auditoria Phase A
- `2fb06c7` — fix(async): auditoria Phase A — 7 bugs criticos (DB session leak, status mismatch)
- `398e43c` — fix(migration): incluir migration 006 no init_db.py e auto-run na startup
- `353741b` — perf(polling): status_only em todas as features — polling leve sem signed URLs
- `1aed8cd` — docs: atualizar CLAUDE.md e KBs com status_only pattern e commits da sessao
- **SDD completo:** DEFINE v2.0 -> DESIGN -> BUILD -> audit (4 agentes paralelos)
- **Bugs encontrados em testes:** migration 006 faltando em init_db.py, polling pesado (7s/request), chamadas duplas listPlantas

## Sessao 20-21/02/2026 — Arquitetura + Auditoria

- `0da627b` — fix(preview): resolver CORS no botao Editar com proxy server-side (B3) — PR #24
- `90a91c4` — docs: marcar Fase 1 completa e B3 corrigido no roadmap beta
- `67032b4` — docs(architecture): adicionar docs de nova arquitetura com review PM
- **Revisao de arquitetura** com Lucas (Parte 1: APIs) + referencia Upinai (video Felipe Lemes)
- Documentos atualizados: `analise_gemini_vs_atual.md`, `queue_worker_migration.plan.md`, `VALIDATION_QUEUE_WORKER_PROPOSAL.md`, `DEFINE_queue_worker_migration.md`
- **Auditoria completa** (3 agentes paralelos): backend bottlenecks, frontend beta readiness, infra deploy readiness
- **Decisao arquitetural:** Queue/Worker (Celery+Redis) = pos-beta. Prioridade = deploy readiness.

## Sessao 19/02/2026 — Thumbnail Refinements (PM — Vitor)

- Branch: `refactor/thumbnail-refinements`
- Plano: `.claude/plans/scalable-cuddling-shamir.md`
- Eliminado `blob.exists()` das listagens — agora usa `generate_signed_url_no_check()`
- Extraido `resolve_preview_url()` em `thumbnail.py` — substitui ~15 blocos duplicados
- Thumbnail movido para `BackgroundTasks` nos write paths — `generate_thumb_in_background()`
- Frontend: `ProjectThumbnail` extraido para `components/ui/project-thumbnail.tsx`

## Sessao 15-16/02/2026 (amigo — Lucas)

- `823153b` — feat(historic): miniatura na listagem de projetos (thumbnail nas 4 features)
- `09dfbdb` — feat(preview): thumbnails WebP + fallback base64 (pipeline completo)
- `e9c954c` — docs(design): plano de otimizacao preview/thumbnails
- `4caf0a5` — docs(define): plano de otimizacao preview/thumbnails
- `1a513ce` — fix(video): currentVersion TDZ bug
- PR #20 merged (fix/b5-suspense-b6-cors), PR #21 merged (fix/b1-video-cache-flicker), PR #22 merged (fix/b4-jwt-401-interceptor)
- **Resumo:** Thumbnails WebP nas 4 features. Migration 005. Pipeline: Pillow resize 800px -> WebP q85 -> ~50KB. Bloqueadores B1, B4, B5, B6 corrigidos.

## Sessao 11/02/2026

- `e611ced` — perf(agents): otimizar modelos dos agents para reduzir consumo de tokens
- `68327b0` — Merge branch 'feature/limit-increase-10mb' (upload 20MB, roadmap beta)
- PR #18 merged (docs/claude-md-sdd-section)
- Trello MCP + Context7 MCP configurados

## Sessao 02/02/2026 — Preview: Historico, Prompt, Editar

- `9d7e6ff` — feat(preview): historico de plantas (Item 7)
- `b8d261e` — docs(plan): Item 7 done, Item 8 added
- `6b8fa24` — fix(preview): instrucao anti-planta (Item 8B)
- `7f17c95` — docs: CLAUDE.md e plano atualizados

## Sessao 01/02/2026 — Otimizacao Database & Performance

- Branch: `perf/optimize-latency-database-features`
- Plano: `.cursor/plans/otimizacao_database_e_performance_global.plan.md`
- Auditoria: `.cursor/plans/consolidacao_otimizacao_performance.plan.md`

## Sessao 28/01/2026 — Video UI + SketchUp Prompts

- Branch: `feature/video-mode-selection` (merged em main)
- Branch: `refactor/sketchup-prompts-architecture` (PR pendente)
