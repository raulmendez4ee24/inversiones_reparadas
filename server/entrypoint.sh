#!/usr/bin/env sh
set -e

DB_READY=0

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[boot] prisma db push"
  if npx prisma db push; then
    DB_READY=1
  else
    echo "[boot] WARN: prisma db push failed, continuing boot"
  fi
else
  echo "[boot] WARN: DATABASE_URL missing, skipping prisma db push"
fi

if [ "${SEED_DEMO:-true}" = "true" ] || [ "${SEED_DEMO:-1}" = "1" ]; then
  if [ "$DB_READY" = "1" ]; then
    echo "[boot] seed demo data"
    if ! npm run seed; then
      echo "[boot] WARN: seed failed, continuing boot"
    fi
  else
    echo "[boot] skip seed (database not ready)"
  fi
fi

echo "[boot] start server"
node dist/index.js
