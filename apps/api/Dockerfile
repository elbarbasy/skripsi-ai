# Dockerfile for the NestJS API. BUILD CONTEXT MUST BE THE REPO ROOT.
# On Railway: clear "Root Directory" and set variable
#   RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile
# so the whole monorepo (incl. packages/shared) is available to the build.

FROM node:22-slim

# Prisma needs openssl at build & runtime.
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm i -g pnpm@9

WORKDIR /app

# Copy the whole monorepo (see .dockerignore for exclusions).
COPY . .

# Install all workspace deps (dev deps needed for the build).
RUN pnpm install --no-frozen-lockfile

# Compile the shared package to JS first (api requires it at runtime).
RUN pnpm --filter @skripsita/shared build

# Generate Prisma client + build the API.
RUN pnpm --filter @skripsita/api prisma:generate
RUN pnpm --filter @skripsita/api build

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
