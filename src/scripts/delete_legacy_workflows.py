"""
delete_legacy_workflows.py

Remove documentos legados da colecao 'workflows' baseados no campo 'type'.

Tipos a serem removidos:
- Tombamentos - Caso Unico
- Transferencia de Cliente - Caso Unico
- Transferencia de Cliente - Em lote
- Solicitacao de Compra / Equipamento

Uso:
  # Dry Run (apenas consulta e resumo)
  PYTHONPATH=. python delete_legacy_workflows.py

  # Execucao Real (com backup e confirmacao)
  PYTHONPATH=. python delete_legacy_workflows.py --execute
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Any

from google.cloud.firestore_v1.base_query import FieldFilter
from shared.firestore_client import init_firestore

# Configuracoes
COLLECTION = "workflows"
TARGET_TYPES = [
    "Tombamentos - Caso \u00danico",
    "Transfer\u00eancia de Cliente - Caso \u00danico",
    "Transfer\u00eancia de Cliente - Em lote",
    "Solicita\u00e7\u00e3o de Compra / Equipamento"
]
BATCH_SIZE = 500
RESULTS_DIR = "/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results"

def json_serial(obj):
    """Serializador para objetos datetime no backup JSON."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def get_legacy_docs(db) -> List[Dict[str, Any]]:
    """Busca todos os documentos que correspondem aos tipos legados."""
    print(f"  Buscando documentos legados na colecao '{COLLECTION}'...")
    
    # Nota: Firestore 'in' query suporta ate 10 itens
    docs_stream = db.collection(COLLECTION).where(
        filter=FieldFilter("type", "in", TARGET_TYPES)
    ).stream()
    
    legacy_docs = []
    for doc in docs_stream:
        data = doc.to_dict()
        legacy_docs.append({
            "id": doc.id,
            "ref": doc.reference,
            "data": data
        })
    
    return legacy_docs

def print_summary(legacy_docs: List[Dict[str, Any]]):
    """Exibe resumo dos documentos encontrados agrupados por tipo."""
    if not legacy_docs:
        print("\n  Nenhum documento legado encontrado.")
        return

    stats = {}
    examples = {}
    
    for item in legacy_docs:
        w_type = item["data"].get("type", "unknown")
        stats[w_type] = stats.get(w_type, 0) + 1
        
        if w_type not in examples:
            examples[w_type] = item

    separator = "=" * 70
    print(f"\n{separator}")
    print("  RESUMO DE DOCUMENTOS LEGADOS ENCONTRADOS")
    print(separator)
    print(f"  Total de documentos: {len(legacy_docs)}")
    print("\n  Quantidade por tipo:")
    for w_type, count in stats.items():
        print(f"    - {w_type}: {count}")
    
    print("\n  Exemplos de documentos (um de cada tipo):")
    for w_type, item in examples.items():
        data = item["data"]
        doc_id = item["id"]
        status = data.get("status", "N/A")
        email = data.get("ownerEmail", "N/A")
        date = data.get("submittedAt", "N/A")
        print(f"    [{w_type}]")
        print(f"      ID: {doc_id} | Status: {status} | Email: {email} | Data: {date}")
    print(f"{separator}\n")

def run_backup(legacy_docs: List[Dict[str, Any]]) -> str:
    """Salva os documentos encontrados em um arquivo JSON antes da delecao."""
    if not os.path.exists(RESULTS_DIR):
        os.makedirs(RESULTS_DIR)
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"workflows_legacy_backup_{timestamp}.json"
    filepath = os.path.join(RESULTS_DIR, filename)
    
    # Prepara dados para o JSON (sem o objeto de referencia do Firestore)
    backup_data = [
        {"id": item["id"], "data": item["data"]} 
        for item in legacy_docs
    ]
    
    with open(filepath, 'w', encoding='ascii') as f:
        json.dump(backup_data, f, indent=2, default=json_serial)
        
    return filepath

def execute_deletion(db, legacy_docs: List[Dict[str, Any]]):
    """Deleta os documentos em lotes (batch)."""
    total = len(legacy_docs)
    deleted_count = 0
    
    print(f"  Iniciando delecao de {total} documentos em lotes de {BATCH_SIZE}...")
    
    for i in range(0, total, BATCH_SIZE):
        batch = db.batch()
        chunk = legacy_docs[i : i + BATCH_SIZE]
        
        for item in chunk:
            batch.delete(item["ref"])
            
        batch.commit()
        deleted_count += len(chunk)
        print(f"    Progresso: {deleted_count}/{total} deletados...")
        
    print(f"\n  Sucesso: {deleted_count} documentos removidos definitivamente.")

def main():
    parser = argparse.ArgumentParser(description="Deleta workflows legados do Firestore.")
    parser.add_argument("--project", default="a-riva-hub", help="ID do projeto Firebase.")
    parser.add_argument("--execute", action="store_true", help="Executa a delecao real.")
    args = parser.parse_args()

    print(f"\n  Projeto: {args.project}")
    db = init_firestore(args.project)
    
    legacy_docs = get_legacy_docs(db)
    
    if not legacy_docs:
        print("  Encerrando: Nada para processar.\n")
        return

    print_summary(legacy_docs)

    if not args.execute:
        print("  MODO DRY RUN: Nenhuma alteracao foi feita.")
        print("  Para deletar, execute novamente com a flag --execute\n")
        return

    # Backup obrigatorio
    print("  Gerando backup de seguranca...")
    backup_path = run_backup(legacy_docs)
    print(f"  Backup salvo em: {backup_path}")

    # Confirmacao explicita
    print(f"\n  ATENCAO: Voce esta prestes a deletar {len(legacy_docs)} documentos!")
    confirm = input("  Para confirmar a EXCLUSAO DEFINITIVA, digite 'DELETE': ")
    
    if confirm != "DELETE":
        print("  Operacao cancelada pelo usuario.\n")
        return

    execute_deletion(db, legacy_docs)
    print("  Processo concluido.\n")

if __name__ == "__main__":
    main()
