# viz.cx

Blog-social platform for the VIZ blockchain: Editor.js posts, comments, follows, on-chain awards. Next.js 16 + PostgreSQL.

## Dev

    docker run -d --name viz-pg -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust postgres:16
    cp .env.example .env.local
    pnpm install && pnpm dev

Schema is applied at boot (`lib/schema.ts`). Tests: `DATABASE_URL=postgres://postgres@localhost:5432/postgres pnpm test` (DB tests skip without it).

## Deploy

    kamal deploy      # config/deploy.yml — viz.cx apex
