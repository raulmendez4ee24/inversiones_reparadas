# Kimi Dashboard - Kan Logic

Plataforma web con:
- Landing + dashboard de cliente
- API backend con autenticacion por cookie `httpOnly`
- Multi-tenant por organizacion
- Roles y permisos (`SUPER_ADMIN`, `ORG_ADMIN`, `ORG_USER`)
- SSE para actividad y progreso en tiempo real

## Estructura
- `app/`: frontend (Vite + React)
- `server/`: backend (Express + Prisma)

## Local (rapido)
```bash
docker compose up -d

cd server
npm install
cp .env.example .env
npx prisma db push
npm run seed
npm run dev

cd ../app
npm install
npm run dev
```

## Deploy Railway
Ver `DEPLOY_RAILWAY.md`.

## Credenciales demo
- `admin@kanlogic.systems` / `admin123`
- `demo@empresa.com` / `demo123`
- `user@empresa.com` / `user123`

