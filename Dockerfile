# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /repo
ENV NODE_ENV=development

COPY server/package.json server/package.json
COPY app/package.json app/package.json
COPY app/package-lock.json app/package-lock.json

RUN cd server && npm install
RUN cd app && npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /repo
ENV NODE_ENV=development
# Prisma needs DATABASE_URL at generate-time (it does not connect, but validates env presence).
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"

COPY --from=deps /repo/server/node_modules server/node_modules
COPY --from=deps /repo/app/node_modules app/node_modules

COPY server server
COPY app app

RUN cd server && npx prisma generate
RUN cd server && npm run build
RUN cd app && npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Server runtime
COPY --from=build /repo/server/dist ./server/dist
COPY --from=build /repo/server/node_modules ./server/node_modules
COPY --from=build /repo/server/prisma ./server/prisma
COPY --from=build /repo/server/package.json ./server/package.json
COPY --from=build /repo/server/entrypoint.sh ./server/entrypoint.sh

# Web build (served by server)
COPY --from=build /repo/app/dist ./app/dist

ENV WEB_DIST_DIR=/app/app/dist

WORKDIR /app/server
EXPOSE 3001

RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]
