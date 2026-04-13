"""
enable_bi_for_all.py

Libera acesso ao BI (permissions.canViewBI = true) para todos os
colaboradores na coleção "collaborators" do Firestore.

Uso:
  python src/scripts/enable_bi_for_all.py --project SEU_PROJECT_ID             # dry-run
  python src/scripts/enable_bi_for_all.py --project SEU_PROJECT_ID --execute   # aplica

Autenticação (uma das opções):
  1. gcloud auth application-default login  (usa suas credenciais Google)
  2. export GOOGLE_APPLICATION_CREDENTIALS="/caminho/service-account.json"

Pré-requisitos:
  - Python 3.8+
  - pip install -r src/scripts/requirements.txt
"""

import argparse
import os
import sys
from typing import Tuple

from shared.firestore_client import init_firestore
from firebase_admin import firestore

COLLECTION = "collaborators"
FIELD_PATH = "permissions.canViewBI"
BATCH_LIMIT = 500


def get_docs_to_update(
    db: firestore.firestore.Client,
) -> Tuple[list, int]:
    all_docs = db.collection(COLLECTION).stream()
    to_update: list = []
    total = 0

    for doc in all_docs:
        total += 1
        data = doc.to_dict()
        permissions = data.get("permissions", {})
        if permissions.get("canViewBI") is not True:
            to_update.append((doc.reference, data))

    return to_update, total


def dry_run(to_update: list, total: int) -> None:
    separator = "=" * 60
    print(f"\n{separator}")
    print("  RELATÓRIO — Dry Run (nenhuma alteração feita)")
    print(separator)
    print(f"  Total de colaboradores:           {total}")
    print(f"  A atualizar (canViewBI != true):   {len(to_update)}")
    print(f"  Já com canViewBI = true:           {total - len(to_update)}")
    print(f"{separator}\n")

    if not to_update:
        print("  Nenhum documento precisa ser atualizado.")
        print("  Todos já possuem canViewBI = true.\n")
        return

    print("  Colaboradores que serão atualizados:\n")
    for ref, data in to_update:
        name = data.get("name", ref.id)
        email = data.get("email", "sem email")
        current = data.get("permissions", {}).get("canViewBI", "não definido")
        print(f"    - {name} ({email}) | canViewBI atual: {current}")

    print("\n  Para aplicar, rode novamente com: --execute\n")


def execute_update(
    db: firestore.firestore.Client, to_update: list
) -> int:
    updated = 0

    for i in range(0, len(to_update), BATCH_LIMIT):
        batch = db.batch()
        chunk = to_update[i : i + BATCH_LIMIT]

        for ref, _ in chunk:
            batch.update(ref, {FIELD_PATH: True})

        batch.commit()
        updated += len(chunk)
        batch_num = (i // BATCH_LIMIT) + 1
        print(
            f"  Batch {batch_num}: {len(chunk)} docs atualizados "
            f"({updated}/{len(to_update)})"
        )

    return updated


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Libera acesso ao BI (canViewBI=true) "
            "para todos os colaboradores."
        )
    )
    parser.add_argument(
        "--project",
        default="a-riva-hub",
        help="Firebase project ID (padrao: a-riva-hub).",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Aplica as mudanças. Sem esta flag, roda em modo dry-run.",
    )
    args = parser.parse_args()

    print(f"\n  Projeto Firebase: {args.project}")

    db = init_firestore(args.project)

    to_update, total = get_docs_to_update(db)

    if not args.execute:
        dry_run(to_update, total)
        return

    if not to_update:
        print("\nNenhum documento precisa ser atualizado.")
        print("Todos já possuem canViewBI = true.")
        return

    print(f"\nExecutando atualização de {len(to_update)} colaboradores...")
    updated = execute_update(db, to_update)
    print(
        f"\nConcluído! {updated} colaboradores atualizados "
        f"com canViewBI = true."
    )


if __name__ == "__main__":
    main()
