# Dockerfile for the Next.js web app. BUILD CONTEXT MUST BE THE REPO ROOT.
# On Railway: clear "Root Directory" and set variables
#   RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile
#   NEXT_PUBLIC_API_URL=https://<your-api-domain>/api
# NEXT_PUBLIC_* is inlined at BUILD time, so it must be present during build.

FROM node:22-slim

RUN npm i -g pnpm@9
WORKDIR /app

COPY . .
RUN pnpm install --no-frozen-lockfile

# Compile shared package (web imports it).
RUN pnpm --filter @skripsita/shared build

# Bake the public API URL into the build.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @skripsita/web build

WORKDIR /app/apps/web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
