@AGENTS.md

# VIZ.cx Frontend

Next.js 16 + Tailwind CSS frontend for VIZ blockchain social platform.

## Architecture
- App Router with TypeScript
- viz-js-lib loaded via CDN script tag for blockchain operations
- EditorJS for post creation, custom renderer for display
- Cookie-based auth (login, regular WIF key, avatar)
- Backend API at NEXT_PUBLIC_API_BASE_URL (default http://localhost:8000)

## Routes
- `/` - Post feed (newest/top/replies tabs)
- `/login` - WIF key authentication
- `/logout` - Clear cookies
- `/new` - Create post with EditorJS (auth required)
- `/@{user}` - User profile (rewrites to /user/[name])
- `/@{user}/{block}` - Post detail + comments (rewrites to /user/[name]/[block])

## Key dirs
- `lib/` - Utilities (api, auth, viz blockchain, markdown, links, time)
- `components/` - React components
- `contexts/` - VizContext (blockchain client state)
- `types/` - TypeScript interfaces

## Dev
```
npm run dev   # http://localhost:3000
npm run build # production build
```
