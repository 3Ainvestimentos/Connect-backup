"""
extract_workflow_samples.py

Extrai um documento de exemplo para cada valor único do campo "type" 
na coleção "workflows" do Firestore.

Uso:
  PYTHONPATH=src/scripts python src/scripts/extract_workflow_samples.py
"""

import argparse
import json
import os
from datetime import datetime

from shared.firestore_client import init_firestore

COLLECTION = "workflows"
TYPE_FIELD = "type"
DEFAULT_OUT_DIR = "/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results"

def json_serial(obj):
    """Serializador JSON para objetos não serializáveis (como datas)."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def extract_samples(db):
    print(f"  Buscando documentos na colecao: {COLLECTION}...")
    docs = db.collection(COLLECTION).stream()
    
    samples = {}
    found_types = set()
    
    count = 0
    for doc in docs:
        data = doc.to_dict()
        w_type = data.get(TYPE_FIELD, "unknown")
        
        if w_type not in found_types:
            print(f"    - Novo tipo encontrado: {w_type} (ID: {doc.id})")
            samples[w_type] = {
                "_id": doc.id,
                **data
            }
            found_types.add(w_type)
        
        count += 1
        if count % 100 == 0:
            print(f"    Processados {count} documentos...")

    return samples

def main():
    parser = argparse.ArgumentParser(
        description="Extrai amostras de workflows por tipo."
    )
    parser.add_argument(
        "--project",
        default="a-riva-hub",
        help="Firebase project ID (padrao: a-riva-hub).",
    )
    parser.add_argument(
        "--out",
        default=DEFAULT_OUT_DIR,
        help=f"Diretorio de saida (padrao: {DEFAULT_OUT_DIR}).",
    )
    args = parser.parse_args()

    if not os.path.exists(args.out):
        os.makedirs(args.out)

    db = init_firestore(args.project)
    
    samples = extract_samples(db)
    
    output_file = os.path.join(args.out, "workflow_samples.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(samples, f, indent=2, ensure_ascii=False, default=json_serial)
    
    print(f"\n  Extração concluída!")
    print(f"  Tipos encontrados: {len(samples)}")
    print(f"  Arquivo salvo em: {output_file}\n")

if __name__ == "__main__":
    main()
