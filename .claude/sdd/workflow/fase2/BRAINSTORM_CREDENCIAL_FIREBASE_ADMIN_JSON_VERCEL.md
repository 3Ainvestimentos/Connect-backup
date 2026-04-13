# BRAINSTORM: Credencial Firebase Admin por JSON em env para Vercel

> Generated: 2026-04-13
> Status: Brainstorm
> Scope: Substituir a dependencia atual de arquivo local em `GOOGLE_APPLICATION_CREDENTIALS` por um padrao unico, limpo e definitivo usando uma env com o JSON inteiro da service account

## 1. Contexto consolidado

As superficies v2 de workflows agora dependem fortemente de rotas server-side com Firebase Admin, por exemplo:

- `GET /api/workflows/requester/catalog`
- `GET /api/workflows/read/mine`
- helpers de auth em `src/lib/workflows/runtime/permission-auth.ts`
- catalogo e configuracao v2 em `src/lib/workflows/admin-config/*`

Hoje o bootstrap do Admin SDK em `src/lib/firebase-admin.ts` assume o uso de `GOOGLE_APPLICATION_CREDENTIALS`, que aponta para um **arquivo fisico** no filesystem.

Esse padrao funciona localmente, mas nao e o mais limpo para Vercel e cria atrito operacional no rollout da feature:

- o backend falha se o arquivo nao existir no runtime;
- a configuracao de producao fica dependente de um path;
- local e producao seguem mecanismos diferentes;
- o erro operacional aparece exatamente nas rotas que precisam estar estaveis para o piloto.

## 2. Perguntas respondidas

### 2.1. Qual o objetivo da mudanca?

Ter uma solucao **definitiva e limpa para producao**, nao uma gambiarra temporaria para destravar o deploy.

### 2.2. Como a credencial deve ser fornecida?

Por **uma env unica com o JSON inteiro** da service account.

### 2.3. Como o ambiente local deve funcionar?

De preferencia com o **mesmo mecanismo da Vercel**, usando o JSON no `.env.local`, para evitar duplicidade operacional e reduzir confusao.

## 3. Problemas que essa mudanca precisa resolver

### 3.1. Dependencia de arquivo fisico em ambiente serverless

O runtime atual do Admin SDK depende de:

- `GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/arquivo.json`

Isso e natural em ambiente local ou servidor tradicional, mas e um encaixe ruim para Vercel, onde o padrao operacional mais limpo e trabalhar com secrets em env.

### 3.2. Inconsistencia entre desenvolvimento e producao

Hoje:

- local usa arquivo;
- producao precisaria de um arranjo especial para simular esse arquivo;
- a aplicacao nao tem um caminho padrao unico para inicializar o Admin SDK.

Isso aumenta o risco de:

- funcionar em local e quebrar em producao;
- ter documentacao duplicada de setup;
- confundir manutencao futura.

### 3.3. A feature v2 depende diretamente desse bootstrap

Sem o Admin SDK inicializado corretamente:

- o catalogo requester quebra;
- a lista de “Minhas Solicitacoes” quebra;
- a configuracao/admin v2 fica vulneravel a falhas operacionais;
- o rollout perde previsibilidade.

## 4. Abordagens consideradas

### Abordagem A — Padrao unico por JSON em env

**Como funciona**

- criar uma env unica, por exemplo:
  - `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`
- `src/lib/firebase-admin.ts` passa a:
  - ler essa env;
  - fazer `JSON.parse(...)`;
  - inicializar o Admin SDK com `credential.cert(...)`.

**Vantagens**

- um unico mecanismo em local e producao;
- elimina dependencia de arquivo fisico;
- combina naturalmente com Vercel;
- reduz ambiguidade operacional;
- mudanca localizada em um unico modulo tecnico.

**Riscos**

- JSON malformado;
- `private_key` colada com escape incorreto;
- service account sem permissao suficiente;
- erro de bootstrap derrubar todas as rotas server-side que usam Admin.

**Mitigacoes**

- validar explicitamente a presenca da env;
- validar os campos obrigatorios do JSON;
- falhar com mensagem clara e orientada;
- documentar o nome exato da env e como colar o JSON.

**Leitura**

E a melhor abordagem para este caso.

---

### Abordagem B — Hibrida com prioridade para JSON e fallback para arquivo

**Como funciona**

- primeiro tenta `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`;
- se nao existir, cai para `GOOGLE_APPLICATION_CREDENTIALS`.

**Vantagens**

- compatibilidade com o modo antigo;
- reduz risco de migracao se ainda houver ambientes usando arquivo.

**Riscos**

- mantem dois caminhos de bootstrap;
- aumenta a superficie de manutencao;
- deixa a operacao menos previsivel no longo prazo.

**Leitura**

Boa para transicao, mas menos limpa que a Abordagem A.

---

### Abordagem C — Variaveis separadas por campo da service account

**Como funciona**

- usar envs como:
  - `FIREBASE_ADMIN_PROJECT_ID`
  - `FIREBASE_ADMIN_CLIENT_EMAIL`
  - `FIREBASE_ADMIN_PRIVATE_KEY`
  - etc.
- montar o objeto de credencial no codigo.

**Vantagens**

- cada campo fica explicitamente visivel.

**Riscos**

- configuracao mais trabalhosa;
- maior chance de erro humano;
- sem ganho real para este projeto.

**Leitura**

YAGNI aqui.

## 5. Recomendacao

### Recomendacao principal

Seguir a **Abordagem A**, com um **padrao unico por JSON em env**.

### Traduzindo isso em pratica

#### Fase 1 — Ajuste tecnico

- adaptar `src/lib/firebase-admin.ts` para ler `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`;
- inicializar o Admin SDK com `credential.cert(...)`;
- manter a inicializacao singleton atual.

#### Fase 2 — Configuracao de ambiente

- adicionar a mesma env:
  - na Vercel Production;
  - opcionalmente na Vercel Preview;
  - no `.env.local`.

#### Fase 3 — Validacao

Testar pelo menos:

- `GET /api/workflows/requester/catalog`
- `GET /api/workflows/read/mine`
- rotas da configuracao v2
- qualquer fluxo de upload/storage que use Admin SDK

## 6. YAGNI

Nao fazer agora:

- script de montagem de credencial;
- multiplas envs por campo;
- nova infra de feature flags/secrets;
- mecanismo diferente para local e producao;
- fallback complexo com varios modos concorrentes.

## 7. Entendimento consolidado

O projeto precisa padronizar o bootstrap do Firebase Admin em uma forma compativel com Vercel e simples de operar.

A melhor solucao para isso e:

- **uma env unica com o JSON completo da service account**
- **mesmo padrao em local e producao**
- **mudanca localizada em `src/lib/firebase-admin.ts`**

## 8. Proximo passo sugerido

Seguir para um `DEFINE` curto com:

- nome final da env;
- comportamento esperado de bootstrap;
- regra de validacao e mensagens de erro;
- impacto em local/Vercel;
- criterio de teste minimo antes do novo deploy.
