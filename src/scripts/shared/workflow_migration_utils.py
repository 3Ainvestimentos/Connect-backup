"""
workflow_migration_utils.py

Funcoes utilitarias e configuracoes para migracao de workflows.
Inclui validacao contra definicoes reais do Firestore e metadados de seguranca.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from google.cloud.firestore_v1.base_query import FieldFilter

# Mapeamento de Tipos Legados -> Tipos Destino
RH_MIGRATION_MAP = {
    "AC - Altera\u00e7\u00e3o de Cargo / Remunera\u00e7\u00e3o / Time ou Equipe": "Altera\u00e7\u00e3o de Cargo / Remunera\u00e7\u00e3o / Time ou Equipe",
    "Altera\u00e7\u00e3o de Cargo / Remunera\u00e7\u00e3o / Time ou Equipe (Somente L\u00edderes)": "Altera\u00e7\u00e3o de Cargo / Remunera\u00e7\u00e3o / Time ou Equipe",
    "HJ - Altera\u00e7\u00e3o de Cargo / Remunera\u00e7\u00e3o / Time ou Equipe": "Altera\u00e7\u00e3o de Cargo / Remunera\u00e7\u00e3o / Time ou Equipe",
    "TH - Altera\u00e7\u00e3o de Cargo / Remunera\u00e7\u00e3o / Time ou Equipe": "Altera\u00e7\u00e3o de Cargo / Remunera\u00e7\u00e3o / Time ou Equipe",
    "Cadastro de Novos Entrantes": "Cadastro de Novos Entrantes - Demais \u00c1reas ",
    "Solicita\u00e7\u00e3o Desligamento": "Solicita\u00e7\u00e3o Desligamento - Demais \u00e1reas (N\u00e3o comerciais)"
}

TARGET_OWNER = "fernanda.adami@3ainvestimentos.com.br"
RESULTS_DIR = "/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results"

# Regras de Transformacao
FIELD_RENAME_MAP = {
    "carta_proposta": "anexo"
}

PLACEHOLDER_RULES = {
    "anexo": "LEGADO_SEM_ANEXO",
    "nome_sobrenome_colaborador": "LEGADO_SEM_NOME_COLABORADOR",
    "observacoes": "LEGADO_SEM_OBSERVACOES",
    "data_inicio": "1900-01-01",
    "data": "1900-01-01",
    "email": "LEGADO_SEM_EMAIL",
    "tipo_desligamento": "Outros",
    "nome_sobrenome": "LEGADO_SEM_NOME_SOBRENOME",
    "tipo_cargo": "Demais \u00c1reas",
    "descricao_detalhada": "LEGADO_SEM_DESCRICAO",
    "area_desligado": "LEGADO_SEM_AREA_DESLIGADO",
    "cargo_desligado": "LEGADO_SEM_CARGO_DESLIGADO",
    "setor_area": "LEGADO_SEM_SETOR_AREA",
    "nome_desligado": "LEGADO_SEM_NOME_DESLIGADO"
}

def load_target_definitions(db) -> Dict[str, Dict[str, Any]]:
    """Carrega as definicoes de workflow de destino do Firestore."""
    target_names = list(set(RH_MIGRATION_MAP.values()))
    print(f"  Carregando {len(target_names)} definicoes de destino...")
    
    defs = {}
    docs = db.collection("workflowDefinitions").where(
        filter=FieldFilter("name", "in", target_names)
    ).stream()
    for doc in docs:
        data = doc.to_dict()
        defs[data["name"]] = data
    return defs

def transform_form_data(
    legacy_type: str, 
    target_def: Dict[str, Any], 
    old_form_data: Dict[str, Any]
) -> Tuple[Dict[str, Any], Dict[str, Any], List[str]]:
    """
    Transforma o formData baseado na definicao de destino.
    Retorna: (novo_form_data, log_alteracoes, placeholders_usados)
    """
    new_form_data = {}
    # log["erros_obrigatorios"] agora eh uma lista para capturar todos de uma vez
    log = {"mantidos": [], "renomeados": [], "removidos": [], "placeholders": [], "erros_obrigatorios": []}
    placeholders_usados = []
    
    target_fields = target_def.get("fields", [])
    valid_field_ids = {f["id"] for f in target_fields}
    required_field_ids = {f["id"] for f in target_fields if f.get("required")}
    
    # 1. Tentar preencher campos validos do destino
    for field in target_fields:
        f_id = field["id"]
        val = None
        
        # Caso A: Campo ja existe no legado
        if f_id in old_form_data:
            val = old_form_data[f_id]
            log["mantidos"].append(f_id)
        
        # Caso B: Campo precisa ser renomeado
        else:
            for old_id, new_id in FIELD_RENAME_MAP.items():
                if new_id == f_id and old_id in old_form_data:
                    val = old_form_data[old_id]
                    log["renomeados"].append(f"{old_id} -> {new_id}")
                    break
        
        # Caso C: Campo obrigatorio ausente -> Aplicar Placeholder
        if (val is None or val == "") and f_id in required_field_ids:
            if f_id in PLACEHOLDER_RULES:
                val = PLACEHOLDER_RULES[f_id]
                log["placeholders"].append(f_id)
                placeholders_usados.append(f_id)
            else:
                log["erros_obrigatorios"].append(f_id)
        
        if val is not None:
            new_form_data[f_id] = val

    # 2. Identificar campos removidos
    for old_id in old_form_data:
        if old_id not in valid_field_ids and old_id not in FIELD_RENAME_MAP:
            log["removidos"].append(old_id)

    return new_form_data, log, placeholders_usados

def get_migration_meta(legacy_type: str, placeholders: List[str]) -> Dict[str, Any]:
    return {
        "originalType": legacy_type,
        "migratedAt": datetime.now().isoformat(),
        "placeholderFields": placeholders,
        "migrationVersion": "1.1"
    }

def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def run_backup(docs_data: List[Dict[str, Any]], prefix: str) -> str:
    if not os.path.exists(RESULTS_DIR):
        os.makedirs(RESULTS_DIR)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(RESULTS_DIR, f"{prefix}_{timestamp}.json")
    with open(filepath, 'w', encoding='ascii') as f:
        json.dump(docs_data, f, indent=2, default=json_serial)
    return filepath
