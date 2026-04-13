"""
export_workflows.py

Exporta as colecoes "workflowDefinitions" e "workflowsAreas" do Firestore para JSON.

Uso:
  python src/scripts/export_workflows.py --project SEU_PROJECT_ID
"""

import argparse
import json
import os
import sys
from datetime import datetime

from shared.firestore_client import init_firestore

COLLECTIONS_TO_EXPORT = ["workflowDefinitions", "workflowAreas"]

def json_serial(obj):
    """Serializador JSON para objetos que não são serializáveis por padrão (como datas)."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def export_collection(db, collection_name, output_dir):
    print(f"  Exportando colecao: {collection_name}...")
    docs = db.collection(collection_name).stream()
    data = {}
    
    count = 0
    for doc in docs:
        data[doc.id] = doc.to_dict()
        count += 1
        
    output_file = os.path.join(output_dir, f"{collection_name}.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=json_serial)
    
    print(f"  Sucesso: {count} documentos exportados para {output_file}")
    return count

def main():
    parser = argparse.ArgumentParser(
        description="Exporta colecoes de Workflows do Firestore para JSON."
    )
    parser.add_argument(
        "--project",
        default="a-riva-hub",
        help="Firebase project ID (padrao: a-riva-hub).",
    )
    parser.add_argument(
        "--out",
        default="/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results",
        help="Diretorio de saida para os arquivos JSON (padrao: src/scripts/results).",
    )
    args = parser.parse_args()

    # Cria diretorio de saida se nao existir
    if not os.path.exists(args.out):
        os.makedirs(args.out)

    print(f"\n  Iniciando exportacao para o projeto: {args.project}")
    
    db = init_firestore(args.project)
    
    total_docs = 0
    for coll in COLLECTIONS_TO_EXPORT:
        try:
            total_docs += export_collection(db, coll, args.out)
        except Exception as e:
            print(f"  Erro ao exportar {coll}: {e}")

    print(f"\n  Exportacao concluida! Total de documentos: {total_docs}")
    print(f"  Arquivos salvos em: {os.path.abspath(args.out)}\n")

if __name__ == "__main__":
    main()
