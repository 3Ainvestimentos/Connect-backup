# DESIGN: Enable BI Access for All Collaborators

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (Built) |
| **Date** | 2026-02-26 |
| **Author** | Design Agent |
| **Type** | Migration Script (one-time) |
| **Language** | Python |

---

## Problem Statement

O acesso ao BI está restrito a colaboradores individuais via campo `permissions.canViewBI` na coleção `collaborators` do Firestore. A empresa precisa liberar o acesso para **todos** os colaboradores de uma só vez.

---

## Architecture Overview

```text
┌──────────────────────────────────────────────────────────┐
│              MIGRATION SCRIPT (one-time)                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  [Python Script]                                          │
│       │                                                   │
│       ├── 1. Conecta ao Firestore (firebase-admin SDK)    │
│       │                                                   │
│       ├── 2. Lê todos os docs de "collaborators"          │
│       │                                                   │
│       ├── 3. Filtra docs onde canViewBI !== true           │
│       │                                                   │
│       ├── 4. Exibe relatório (dry-run)                    │
│       │                                                   │
│       └── 5. Aplica batch update (com --execute)          │
│               │                                           │
│               └── Batches de 500 docs (limite Firestore)  │
│                                                           │
│  [Firestore: collaborators]                               │
│       └── permissions.canViewBI = true  ✅                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Decision: Python com firebase-admin SDK

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-26 |

**Context:** Precisamos de um script simples e seguro para atualizar um campo em todos os documentos de uma coleção Firestore.

**Choice:** Script Python standalone usando `firebase-admin` com batched writes e modo dry-run por padrão.

**Rationale:**
- Python é a linguagem preferida para scripts de migração
- `firebase-admin` para Python é maduro e bem documentado
- Batched writes garantem atomicidade e respeitam limites do Firestore (500 ops/batch)
- Dry-run por padrão evita execuções acidentais

**Alternatives Rejected:**
1. **TypeScript/Node.js** — Funcional, mas Python foi solicitado explicitamente
2. **Console do Firebase** — Manual, não escalável, sem auditoria
3. **Cloud Function** — Overkill para tarefa one-time
4. **Update doc a doc** — Sem atomicidade, lento, muitas chamadas de rede

**Consequences:** Necessita Python 3.8+ e pip install de `firebase-admin`.

---

## Decision: Modo Dry-Run por Padrão

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-26 |

**Context:** Scripts de migração que alteram dados em produção são operações destrutivas por natureza.

**Choice:** O script roda em modo dry-run (somente leitura) por padrão. A flag `--execute` é necessária para aplicar as mudanças.

**Rationale:** Princípio de menor privilégio — prevenir alterações acidentais. O operador deve conscientemente optar pela execução.

**Consequences:** Sempre requer dois comandos: um para verificar, outro para executar.

---

## Firestore Collection Schema

```yaml
collection: collaborators
document:
  name: string            # "Marcelo Fonseca Gonçalves"
  email: string           # "marcelo.goncalves@3ariva.com.br"
  id: string              # "0CYRbBN4ZwUGD82wqwaO"
  permissions:            # map
    canViewBI: boolean     # ← CAMPO ALVO (set to true)
    canManageContent: boolean
    canManageRequests: boolean
    canManageWorkflows: boolean
    canViewCRM: boolean
    canViewDra: boolean
    canViewRankings: boolean
    canViewStrategicPanel: boolean
    canViewTasks: boolean
  # ... outros campos
```

---

## File Manifest

| # | File | Action | Purpose | Dependencies | Agent |
|---|------|--------|---------|--------------|-------|
| 1 | `scripts/enable_bi_for_all.py` | Create | Script de migração | None | @python-developer |
| 2 | `scripts/requirements.txt` | Create | Dependências Python | None | @python-developer |

---

## Code Pattern: Script Structure

```python
"""
enable_bi_for_all.py

Uso:
  python scripts/enable_bi_for_all.py                  # dry-run
  python scripts/enable_bi_for_all.py --execute         # aplica mudanças

Pré-requisitos:
  - Python 3.8+
  - pip install firebase-admin
  - GOOGLE_APPLICATION_CREDENTIALS apontando para service account JSON
"""

import argparse
import sys

import firebase_admin
from firebase_admin import credentials, firestore

COLLECTION = "collaborators"
FIELD_PATH = "permissions.canViewBI"
BATCH_LIMIT = 500


def init_firestore() -> firestore.Client:
    """Inicializa o Firestore client via Application Default Credentials."""
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    return firestore.client()


def get_docs_to_update(db: firestore.Client) -> list:
    """Retorna docs onde permissions.canViewBI != true."""
    all_docs = db.collection(COLLECTION).stream()
    to_update = []
    total = 0

    for doc in all_docs:
        total += 1
        data = doc.to_dict()
        permissions = data.get("permissions", {})
        if permissions.get("canViewBI") is not True:
            to_update.append((doc.reference, data))

    return to_update, total


def dry_run(to_update: list, total: int) -> None:
    """Mostra relatório sem alterar dados."""
    print(f"\n{'='*60}")
    print(f"  RELATÓRIO — Dry Run (nenhuma alteração feita)")
    print(f"{'='*60}")
    print(f"  Total de colaboradores:          {total}")
    print(f"  A atualizar (canViewBI != true):  {len(to_update)}")
    print(f"  Já com canViewBI = true:          {total - len(to_update)}")
    print(f"{'='*60}\n")

    if to_update:
        print("  Colaboradores que serão atualizados:\n")
        for ref, data in to_update:
            name = data.get("name", ref.id)
            email = data.get("email", "sem email")
            current = data.get("permissions", {}).get("canViewBI", "não definido")
            print(f"    - {name} ({email}) | canViewBI atual: {current}")

        print(f"\n  Para aplicar, rode novamente com: --execute\n")
    else:
        print("  Nenhum documento precisa ser atualizado.")
        print("  Todos já possuem canViewBI = true.\n")


def execute(db: firestore.Client, to_update: list) -> int:
    """Aplica batch update em todos os docs."""
    updated = 0

    for i in range(0, len(to_update), BATCH_LIMIT):
        batch = db.batch()
        chunk = to_update[i : i + BATCH_LIMIT]

        for ref, _ in chunk:
            batch.update(ref, {FIELD_PATH: True})

        batch.commit()
        updated += len(chunk)
        batch_num = (i // BATCH_LIMIT) + 1
        print(f"  Batch {batch_num}: {len(chunk)} docs atualizados ({updated}/{len(to_update)})")

    return updated


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Libera acesso ao BI (canViewBI=true) para todos os colaboradores."
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Aplica as mudanças. Sem esta flag, roda em modo dry-run.",
    )
    args = parser.parse_args()

    db = init_firestore()
    to_update, total = get_docs_to_update(db)

    if not args.execute:
        dry_run(to_update, total)
        return

    if not to_update:
        print("\nNenhum documento precisa ser atualizado.")
        return

    print(f"\nExecutando atualização de {len(to_update)} colaboradores...")
    updated = execute(db, to_update)
    print(f"\nConcluído! {updated} colaboradores atualizados com canViewBI = true.")


if __name__ == "__main__":
    main()
```

---

## Testing Strategy

| Test Type | Scope | Validação |
|-----------|-------|-----------|
| **Dry-run** | Leitura | Rodar sem `--execute` e verificar lista de docs |
| **Manual** | Escrita | Rodar com `--execute` e conferir no console Firestore |
| **Contagem** | Integridade | Comparar total reportado com total real no Firestore |

### Passos de Validação

1. Rodar `python scripts/enable_bi_for_all.py` (dry-run)
2. Conferir a lista de nomes/emails no output
3. Verificar se a contagem bate com o total de colaboradores no Firestore
4. Rodar `python scripts/enable_bi_for_all.py --execute`
5. Verificar no console do Firestore que `permissions.canViewBI = true` para todos

---

## Pre-requisites

```bash
# 1. Instalar dependências
pip install firebase-admin

# 2. Configurar credenciais (apontar para o service account JSON)
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/service-account.json"

# 3. Dry-run
python scripts/enable_bi_for_all.py

# 4. Executar
python scripts/enable_bi_for_all.py --execute
```

---

## Risks & Mitigations

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Execução acidental | Todos ganham acesso BI | Dry-run por padrão, requer `--execute` |
| Credenciais ausentes | Script falha | Mensagem clara de erro |
| Docs sem campo `permissions` | KeyError | `.get()` com fallback para `{}` |
| Mais de 500 docs | Batch falha | Chunking automático em batches de 500 |
| Reverter acesso | Precisa de script inverso | Pode criar script similar com `canViewBI = false` |

---

## Build Status

Arquivos criados em `src/scripts/`:
- `enable_bi_for_all.py` — Script de migração
- `requirements.txt` — Dependências Python

Build concluído em 2026-02-26.
