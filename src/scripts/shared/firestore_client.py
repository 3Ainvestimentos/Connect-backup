"""
firestore_client.py

Modulo compartilhado para inicializacao do cliente Firestore.
"""

import sys
import firebase_admin
from firebase_admin import credentials, firestore

def init_firestore(project_id: str = "a-riva-hub") -> firestore.firestore.Client:
    """
    Inicializa o app Firebase (se ainda não inicializado) e retorna o cliente Firestore.
    """
    try:
        if not firebase_admin._apps:
            options = {"projectId": project_id}
            firebase_admin.initialize_app(options=options)
        return firestore.client()
    except Exception as err:
        print(f"\nErro ao conectar ao Firestore: {err}")
        print(
            "Verifique sua autenticacao. Opcoes:\n"
            "  1. gcloud auth application-default login\n"
            "  2. export GOOGLE_APPLICATION_CREDENTIALS=/caminho/sa.json\n"
        )
        sys.exit(1)
