# Kan Logic Server (API + DB)

## Requisitos
- Node.js 20+ (o 18+)

## Setup rápido
```bash
cd ..
docker compose up -d

cd server
npm install
cp .env.example .env
npx prisma db push
npm run seed
npm run dev
```

## Frontend (Vite)
```bash
cd app
npm install
npm run dev
```

El frontend usa proxy a `http://localhost:3001` para `/api`.

## Demo
- Super Admin: `admin@kanlogic.systems` / `admin123`
- Org Admin: `demo@empresa.com` / `demo123`
- Org User: `user@empresa.com` / `user123`

## Notas
- OTP y tokens de reset se imprimen en consola del server (modo demo).
- En Railway (Dockerfile), el `start` ejecuta `prisma db push` y luego `seed` (controlado por `SEED_DEMO=true`).
