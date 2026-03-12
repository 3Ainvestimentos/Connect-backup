"""
verify_workflow_migrations.py

Verifica a integridade apenas dos documentos migrados (com o marcador _legacyMigration).
Tambem checa se ainda restam tipos legados no banco.

Uso:
  PYTHONPATH=. python verify_workflow_migrations.py
"""

import argparse
from typing import List, Dict, Any

from google.cloud.firestore_v1.base_query import FieldFilter
from shared.firestore_client import init_firestore
from shared.workflow_migration_utils import RH_MIGRATION_MAP, TARGET_OWNER

COLLECTION = "workflows"

def main():
    parser = argparse.ArgumentParser(description="Verifica migracao de workflows.")
    parser.add_argument("--project", default="a-riva-hub", help="ID do projeto Firebase.")
    args = parser.parse_args()

    db = init_firestore(args.project)
    print(f"\n  Verificando projeto: {args.project}")

    # 1. Checagem de sobreviventes legados
    legacy_types = list(RH_MIGRATION_MAP.keys())
    docs_legacy = db.collection(COLLECTION).where(
        filter=FieldFilter("type", "in", legacy_types)
    ).stream()
    
    legacy_count = 0
    for doc in docs_legacy:
        legacy_count += 1
        if legacy_count == 1: print("\n  [ALERTA] Documentos legados ainda presentes:")
        print(f"    - ID: {doc.id} | Tipo: {doc.get('type')}")

    # 2. Auditoria dos Migrados
    target_types = list(set(RH_MIGRATION_MAP.values()))
    issues = []
    migrated_count = 0
    
    print(f"\n  Auditando documentos migrados (com marcador _legacyMigration)...")
    
    # Buscamos todos os documentos dos tipos de destino
    for t_type in target_types:
        docs = db.collection(COLLECTION).where(
            filter=FieldFilter("type", "==", t_type)
        ).stream()
        
        for doc in docs:
            data = doc.to_dict()
            
            # FILTRO CRUCIAL: Apenas os migrados!
            if "_legacyMigration" not in data:
                continue
            
            migrated_count += 1
            id_doc = doc.id
            meta = data["_legacyMigration"]
            
            # Auditoria de Owner
            if data.get("ownerEmail") != TARGET_OWNER:
                issues.append(f"Owner incorreto: {id_doc} ({data.get('ownerEmail')})")
            
            # Auditoria de Status
            if data.get("status") != "finalizado":
                issues.append(f"Status incorreto: {id_doc} ({data.get('status')})")
            
            # Auditoria de Placeholders
            placeholders = meta.get("placeholderFields", [])
            if placeholders:
                # Informacional, nao erro
                pass

    print(f"  Total de documentos migrados analisados: {migrated_count}")

    if not legacy_count and not issues:
        print("\n  [SUCESSO] Todos os documentos migrados estao em conformidade.")
    else:
        if issues:
            print(f"\n  Inconsistencias encontradas ({len(issues)}):")
            for iss in issues[:10]:
                print(f"    - {iss}")

    print("\n  Verificacao concluida.\n")

if __name__ == "__main__":
    main()
