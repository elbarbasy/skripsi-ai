# Optional Dockerfile for Railway/Render/Fly.io (alternative to nixpacks).
# Build from repo root:  docker build -f apps/api/Dockerfile .

FROM node:20-slim AS base
RUN npm i -g pnpm@9
WORKDIR /app

# -- Dependencies --
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile || pnpm install

# -- Source --
COPY packages/shared packages/shared
COPY apps/api apps/api

# -- Build --
WORKDIR /app/apps/api
RUN pnpm prisma:generate && pnpm build

# -- Runtime --
FROM node:20-slim AS runner
WORKDIR /app
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/node_modules ./node_modules
COPY --from=base /app/apps/api/prisma ./prisma
COPY --from=base /app/node_modules/.pnpm node_modules/.pnpm

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
