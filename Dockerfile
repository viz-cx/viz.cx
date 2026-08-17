# Multi-stage Next.js build (output: 'standalone' in next.config.ts).
# Build context = repo root. pnpm all the way — no npm lockfile here, unlike the
# old explorer repo (network.viz.cx/web had both).

FROM node:24-alpine AS deps
RUN corepack enable
WORKDIR /app
# pnpm-workspace.yaml carries allowBuilds verdicts — without it pnpm 11 prompts
# and the non-interactive install fails.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No MONGO_URL at build time on purpose: every page (incl. sitemap.xml) is
# force-dynamic, so nothing queries mongo during prerender.
RUN pnpm build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
