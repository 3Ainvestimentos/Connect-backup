#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

DEFAULT_PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-a-riva-hub}"
DEFAULT_CREDENTIALS_PATH="$HOME/Documents/3A/credentials/a-riva-hub-admin.json"

export GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT:-$DEFAULT_PROJECT_ID}"
export GOOGLE_APPLICATION_CREDENTIALS="${GOOGLE_APPLICATION_CREDENTIALS:-${FIREBASE_ADMIN_CREDENTIALS_PATH:-$DEFAULT_CREDENTIALS_PATH}}"

if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "Arquivo de credenciais do Firebase Admin nao encontrado."
  echo "Esperado em: $GOOGLE_APPLICATION_CREDENTIALS"
  echo
  echo "Voce pode corrigir de duas formas:"
  echo "1. Exportar GOOGLE_APPLICATION_CREDENTIALS antes de rodar o script"
  echo "2. Definir FIREBASE_ADMIN_CREDENTIALS_PATH no seu .env.local"
  exit 1
fi

echo "Iniciando Next dev com Firebase Admin configurado:"
echo "  GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT"
echo "  GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS"
echo

cd "$ROOT_DIR"
exec npm run dev
