#!/usr/bin/env sh
set -e

echo "[boot] prisma db push"
npx prisma db push

if [ "${SEED_DEMO:-true}" = "true" ] || [ "${SEED_DEMO:-1}" = "1" ]; then
  echo "[boot] seed demo data"
  npm run seed
fi

echo "[boot] start server"
node dist/index.js

