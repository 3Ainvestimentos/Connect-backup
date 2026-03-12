"""
migrate_rh_workflows.py

Executa a migracao dos workflows de RH baseada nas definicoes reais.
Move metadados para a raiz do documento e valida campos obrigatorios.

Uso:
  PYTHONPATH=. python migrate_rh_workflows.py
  PYTHONPATH=. python migrate_rh_workflows.py --execute
"""

import argparse
import sys
from typing import List, Dict, Any

from google.cloud.firestore_v1.base_query import FieldFilter
from shared.firestore_client import init_firestore
from shared.workflow_migration_utils import (
    RH_MIGRATION_MAP, TARGET_OWNER, run_backup, transform_form_data, 
    load_target_definitions, get_migration_meta
)

COLLECTION = "workflows"
BATCH_SIZE = 500

def main():
    parser = argparse.ArgumentParser(description="Migra workflows de RH com validacao de schema.")
    parser.add_argument("--project", default="a-riva-hub", help="ID do projeto Firebase.")
    parser.add_argument("--execute", action="store_true", help="Executa a migracao real.")
    args = parser.parse_args()

    db = init_firestore(args.project)
    print(f"\n  Iniciando migracao no projeto: {args.project}")

    target_defs = load_target_definitions(db)
    
    legacy_types = list(RH_MIGRATION_MAP.keys())
    docs_stream = db.collection(COLLECTION).where(
        filter=FieldFilter("type", "in", legacy_types)
    ).stream()
    
    to_migrate = []
    backup_data = []
    blocking_errors = []

    for doc in docs_stream:
        data = doc.to_dict()
        legacy_type = data.get("type")
        target_name = RH_MIGRATION_MAP.get(legacy_type)
        target_def = target_defs.get(target_name)

        if not target_def:
            continue

        new_form_data, log, placeholders = transform_form_data(
            legacy_type, target_def, data.get("formData", {})
        )

        if log["erros_obrigatorios"]:
            err_list = ", ".join(log["erros_obrigatorios"])
            blocking_errors.append(f"Doc {doc.id} ({legacy_type}): Campos ausentes [{err_list}]")
            continue

        updates = {
            "type": target_name,
            "ownerEmail": TARGET_OWNER,
            "formData": new_form_data,
            "_legacyMigration": get_migration_meta(legacy_type, placeholders)
        }
        
        if data.get("status") != "finalizado":
            updates["status"] = "finalizado"

        to_migrate.append({
            "ref": doc.reference,
            "id": doc.id,
            "log": log,
            "updates": updates
        })
        backup_data.append({"id": doc.id, "data": data})

    print(f"\n  Candidatos encontrados: {len(to_migrate)}")
    if blocking_errors:
        print(f"  [ERRO] {len(blocking_errors)} inconsistencias bloqueantes:")
        for err in blocking_errors[:10]:
            print(f"    - {err}")
        if len(blocking_errors) > 10: print(f"    - ... (mais {len(blocking_errors)-10} erros)")

    if not args.execute:
        print("\n  RELATORIO DE MUDANCAS (Exemplo do primeiro doc):")
        if to_migrate:
            m = to_migrate[0]
            print(f"    ID: {m['id']}")
            print(f"    Mantidos: {m['log']['mantidos']}")
            print(f"    Renomeados: {m['log']['renomeados']}")
            print(f"    Removidos: {m['log']['removidos']}")
            print(f"    Placeholders: {m['log']['placeholders']}")
        print("\n  Para aplicar, use --execute (bloqueado se houver erros de campo)")
        return

    if blocking_errors:
        print("\n  [ABORTADO] Corrija os erros obrigatorios antes de prosseguir.")
        sys.exit(1)

    backup_path = run_backup(backup_data, "rh_migration_pre_v1.1")
    print(f"\n  Backup salvo: {backup_path}")
    
    confirm = input("  Digite 'MIGRATE' para executar: ")
    if confirm != "MIGRATE": return

    count = 0
    for i in range(0, len(to_migrate), BATCH_SIZE):
        batch = db.batch()
        chunk = to_migrate[i : i + BATCH_SIZE]
        for item in chunk:
            batch.update(item["ref"], item["updates"])
        batch.commit()
        count += len(chunk)
        print(f"    Progresso: {count}/{len(to_migrate)}")

    print(f"\n  Sucesso: {len(to_migrate)} documentos migrados.\n")

if __name__ == "__main__":
    main()
