# DEFINE: Credencial Firebase Admin por JSON em env (Vercel + Local)

> Generated: 2026-04-13
> Status: Ready for /design
> Source: BRAINSTORM_CREDENCIAL_FIREBASE_ADMIN_JSON_VERCEL.md
> Clarity Score: 14/15

## 1. Problem Statement

O bootstrap atual do Firebase Admin SDK em `src/lib/firebase-admin.ts` depende de um arquivo físico apontado por `GOOGLE_APPLICATION_CREDENTIALS`, o que é incompatível com o ambiente serverless da Vercel e quebra as rotas server-side v2 de workflows em produção.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Desenvolvedores (time Connect) | Precisam manter dois mecanismos diferentes de credencial (arquivo local vs. produção), aumentando atrito de setup e risco de drift entre ambientes | A cada novo setup / deploy |
| Operadores de Deploy (Vercel) | Não conseguem subir as rotas v2 de workflows porque o runtime serverless não tem filesystem persistente para o JSON da service account | A cada deploy de rotas server-side |
| Usuários finais das superfícies v2 de Workflows (requesters e admins) | Veem erros 500 em `GET /api/workflows/requester/catalog`, `GET /api/workflows/read/mine` e rotas de configuração v2 quando o Admin SDK falha ao inicializar | Em qualquer acesso durante o piloto v2 |
| Time de manutenção futura | Lida com documentação duplicada e paths divergentes entre local e produção | Contínuo |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Inicializar o Firebase Admin SDK a partir de uma única env contendo o JSON completo da service account | `src/lib/firebase-admin.ts` lê a env, faz `JSON.parse` e inicializa o app via `credential.cert(...)` mantendo o padrão singleton |
| M2 | Usar o mesmo mecanismo de credencial em ambiente local e em produção (Vercel) | Local (`.env.local`) e Vercel (Production) usam a mesma variável com o mesmo formato; nenhum caminho alternativo é necessário para funcionar |
| M3 | Eliminar a dependência de `GOOGLE_APPLICATION_CREDENTIALS` apontando para arquivo físico | Nenhum código de runtime da aplicação depende de `process.env.GOOGLE_APPLICATION_CREDENTIALS` para inicializar o Admin SDK |
| M4 | Validar explicitamente a presença e a integridade mínima do JSON antes de inicializar | Falha rápida e com mensagem clara caso: (a) env ausente, (b) JSON inválido, (c) campos obrigatórios ausentes (`project_id`, `client_email`, `private_key`) |
| M5 | Manter as rotas server-side v2 estáveis após a mudança | `GET /api/workflows/requester/catalog`, `GET /api/workflows/read/mine` e rotas de configuração v2 respondem 200 em ambiente local e em produção após a migração |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Nome único e explícito da env para a credencial | Env nomeada `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` (conforme recomendação do brainstorm) |
| S2 | Tratamento correto de `private_key` com quebras de linha escapadas (`\n`) | Bootstrap normaliza `\n` literais para quebras reais antes de passar para `credential.cert` |
| S3 | Mensagem de erro operacional orientada ao desenvolvedor | Erro no boot indica exatamente: nome da env esperada, campo faltante e passo sugerido de correção |
| S4 | Configurar a mesma env em Vercel Preview para paridade com Production | Deploys Preview conseguem autenticar via Admin SDK sem configuração adicional |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Log estruturado único informando sucesso do bootstrap (sem vazar secrets) | Um único `console.info` com `project_id` e `client_email` mascarado; nenhum log de `private_key` |
| C2 | Utilitário/helper interno para validar o shape da service account | Função isolada e testável que retorna o objeto validado ou lança erro tipado |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Fallback híbrido com `GOOGLE_APPLICATION_CREDENTIALS` como segunda opção | Brainstorm recomendou solução definitiva (Abordagem A), não híbrida (Abordagem B) |
| W2 | Variáveis separadas por campo (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_PRIVATE_KEY`, etc.) | YAGNI — brainstorm descartou Abordagem C por aumentar risco operacional sem ganho |
| W3 | Script de montagem/geração automática da credencial a partir de outras fontes | YAGNI — fora do escopo desta migração |
| W4 | Nova infraestrutura de feature flags ou secrets manager | Fora do escopo; Vercel env + `.env.local` são suficientes |
| W5 | Rotação automática de credenciais | Fora do escopo operacional atual |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Rotas v2 de workflows estáveis em produção | 0 falhas 500 por erro de bootstrap do Admin SDK | Logs de Vercel Production das rotas `/api/workflows/requester/catalog`, `/api/workflows/read/mine` e rotas de admin v2 |
| Paridade local/produção | Mesmo mecanismo único em ambos ambientes | Ambos ambientes consomem `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`; nenhum outro caminho ativo |
| Bootstrap falha rapidamente quando mal configurado | Erro explícito em <1s com mensagem orientativa | Teste manual removendo/corrompendo a env e observando log inicial |
| Feature v2 destravada no piloto | Piloto v2 roda em produção sem erro de credencial | Smoke test pós-deploy das rotas citadas no brainstorm §5 Fase 3 |
| Redução de superfície de manutenção | 1 único caminho de bootstrap em `firebase-admin.ts` | Inspeção do módulo: nenhum branch concorrente nem leitura de `GOOGLE_APPLICATION_CREDENTIALS` |

## 5. Technical Scope

### Backend (src/lib/ e rotas server-side)
| Component | Change Type | Details |
|-----------|------------|---------|
| `src/lib/firebase-admin.ts` | Modify | Substituir bootstrap por leitura de `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`, `JSON.parse`, validação e `initializeApp({ credential: credential.cert(...) })`; manter padrão singleton |
| `src/lib/workflows/runtime/permission-auth.ts` | None (indireto) | Consome `getFirebaseAdminApp()`; deve continuar funcionando sem alteração |
| `src/lib/workflows/admin-config/*` | None (indireto) | Depende do Admin SDK inicializado; nenhuma mudança necessária |
| `app/api/workflows/requester/catalog/route.ts` | None (indireto) | Deve continuar funcional após a troca |
| `app/api/workflows/read/mine/route.ts` | None (indireto) | Deve continuar funcional após a troca |

### Frontend (src/app/)
| Component | Change Type | Details |
|-----------|------------|---------|
| — | None | Mudança 100% server-side; nenhum componente, contexto ou hook de cliente é afetado |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| — | None | Fora do escopo |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| — | None | Nenhuma alteração em Firestore models, rules ou índices |

### Infraestrutura / Ambiente
| Item | Change Type | Details |
|------|------------|---------|
| Vercel Production env | Create | Adicionar `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` com o JSON completo da service account |
| Vercel Preview env | Create | Mesma env para paridade com Production (SHOULD) |
| `.env.local` | Modify | Substituir `GOOGLE_APPLICATION_CREDENTIALS` por `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` |
| Documentação de setup local | Modify | Atualizar instruções de bootstrap do Admin SDK (quando aplicável; não criar novo doc se não existir) |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | A mudança não altera a semântica de autenticação — apenas o mecanismo de bootstrap do Admin SDK usado pelas rotas server-side que verificam tokens e aplicam permissões |
| User Isolation | Inalterado — continua dependendo das regras e dos helpers existentes em `permission-auth.ts` e `firestore.rules` |
| Input Validation | Validação obrigatória no bootstrap: presença da env, JSON parseável, presença de `project_id`, `client_email`, `private_key`; tratamento de `\n` escapado em `private_key` |
| Secret Handling | `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` nunca deve ser logado na íntegra; nenhum commit do valor no repositório; `.env.local` deve permanecer no `.gitignore` |
| Failure Mode | Bootstrap falha fechado: se a env estiver ausente ou inválida, as rotas server-side retornam erro controlado em vez de degradar silenciosamente |

## 7. Out of Scope

- Fallback híbrido para `GOOGLE_APPLICATION_CREDENTIALS` ou qualquer outro mecanismo concorrente.
- Variáveis separadas por campo da service account.
- Alteração em Cloud Functions (`functions/src/*`) — escopo é apenas o Admin SDK consumido pelo Next.js na Vercel.
- Rotação automática ou cofre de segredos (Secret Manager, Doppler, etc.).
- Criação de novos endpoints ou mudanças em regras do Firestore.
- Mudanças em frontend, componentes, contextos ou hooks.
- Migração de outras integrações do Google Cloud que usem `GOOGLE_APPLICATION_CREDENTIALS` para outros fins (se existirem fora do Admin SDK).
- Testes automatizados de integração com Firebase real (smoke test manual é suficiente nesta iteração).

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| Acesso à service account do projeto Firebase (JSON) | External | Ready (já utilizada hoje via arquivo) |
| Acesso de admin ao painel de envs da Vercel (Production e Preview) | External | Ready |
| Rotas server-side v2 de workflows já implementadas | Internal | Ready (referenciadas no brainstorm §1) |
| Módulo `src/lib/firebase-admin.ts` singleton atual | Internal | Ready |
| Nenhum outro código do runtime depende de `GOOGLE_APPLICATION_CREDENTIALS` para propósito diferente | Internal | A confirmar em /design (grep simples) |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Problema, causa raiz e impacto estão precisamente descritos no brainstorm e confirmados no código atual de `firebase-admin.ts` |
| User identification | 3 | Devs, operadores de deploy, usuários finais das rotas v2 e manutenção futura, com pain points explícitos |
| Success criteria measurability | 3 | Critérios observáveis por logs, smoke test das rotas e inspeção do módulo |
| Technical scope definition | 3 | Arquivo único (`src/lib/firebase-admin.ts`) identificado; envs Vercel e `.env.local` mapeadas; rotas impactadas listadas |
| Edge cases considered | 2 | Cobertos: env ausente, JSON malformado, `private_key` com `\n` escapado, campos faltantes. Não coberto explicitamente: caso de múltiplos apps admin inicializados em serverless (comportamento atual do singleton é mantido, mas não foi reavaliado para edge cases de cold start paralelo) |
| **TOTAL** | **14/15** | >= 12, aprovado para /design |

## 10. Next Step

Ready for `/design CREDENCIAL_FIREBASE_ADMIN_JSON_VERCEL` to create technical specification, incluindo:

- Shape exato do JSON esperado e função de validação.
- Estratégia de normalização de `private_key` (`\n` escapado).
- Mensagens de erro finais e comportamento do singleton em cold start.
- Checklist de configuração de envs em Vercel (Production + Preview) e `.env.local`.
- Smoke test mínimo pós-deploy (rotas do brainstorm §5 Fase 3).

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-13 | define-agent | Initial requirements from BRAINSTORM_CREDENCIAL_FIREBASE_ADMIN_JSON_VERCEL.md |
