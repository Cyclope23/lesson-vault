# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**lesson-vault** — Piattaforma web per istituto scolastico italiano. Docenti caricano programmi di disciplina, l'AI genera lezioni strutturate per ogni argomento.

Repository: https://github.com/Cyclope23/lesson-vault.git

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL 16 + Prisma 7 (with `@prisma/adapter-pg`)
- Auth.js v5 beta (Credentials provider, JWT sessions)
- Anthropic Claude SDK (per-teacher API keys, encrypted with AES-256-GCM)
- shadcn/ui + Tailwind CSS v4 + Radix UI
- Docker multi-stage + docker-compose

## Build & Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client (required after schema changes)
npx prisma generate

# Start dev server (requires PostgreSQL running)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations (dev)
npm run db:push        # Push schema to DB (dev, no migration files)
npm run db:seed        # Seed admin user
npm run db:studio      # Open Prisma Studio

# Docker (full stack)
docker compose up      # App + PostgreSQL
docker compose up db   # PostgreSQL only
```

## Architecture Notes

- **Prisma 7**: Uses `@prisma/adapter-pg` driver adapter. PrismaClient requires `{ adapter }` option.
- **Generated client**: Output at `src/generated/prisma/client` — import from `@/generated/prisma/client`.
- **Prisma config**: `prisma.config.ts` provides datasource URL (not in schema.prisma).
- **Auth**: Middleware checks session cookie only (no Prisma in edge runtime). Admin route protection is server-side.
- **API Keys**: Each teacher stores their own Anthropic API key, encrypted server-side. Never exposed to client.
- **All UI text is in Italian.**

## Project Structure

- `src/app/(auth)/` — Login, register pages
- `src/app/(dashboard)/` — All authenticated pages with sidebar layout
- `src/actions/` — Server actions
- `src/components/` — UI components (layout, settings, programs, lessons, etc.)
- `src/lib/` — Prisma client, crypto, Claude factory, utils
- `src/services/` — Business logic (AI, extraction, etc.)
- `src/types/` — TypeScript interfaces
- `prisma/` — Schema, migrations, seed

Add under a ## UI Implementation section at the top level of CLAUDE.md\n\nWhen implementing UI features, ensure changes are applied to ALL relevant pages/views where the feature should appear, not just one location. Search the codebase for all instances before considering the task complete.
Add under a ## Docker / Deployment section in CLAUDE.md\n\nAfter making code changes, always run `docker compose build --no-cache && docker compose up -d` for deployment. 

Docker layer caching frequently causes new code not to appear. Never use cached builds when verifying changes.
Add under a ## Tech Stack & Known Gotchas section near the top of CLAUDE.md\n\nThis project uses TypeScript, Next.js (with server actions), Prisma ORM, and Radix UI components. 

Key constraints:
- Do NOT test Next.js server actions via curl — they don't work that way. Use direct DB manipulation or the actual UI.
- When adding Prisma schema columns to existing tables, always provide a default value for non-nullable fields.
- Be aware of Prisma 7 breaking changes: Edge middleware cannot import PrismaClient directly, PrismaClient constructor requires an adapter, and corrupted node_modules may need full reinstall.
- Next.js page caching can hide new data; use revalidatePath or dynamic rendering where needed.
- Radix UI DropdownMenu has modal conflicts with Dialog — if embedding a Dialog trigger inside a 

DropdownMenuItem, handle the modal prop or use a different pattern.

Add under a ## Safety Rules section at the very top of CLAUDE.md\n\nNEVER delete the current working directory or any parent directory of the working directory. If you need to clone a repo into the current directory, use `git clone <url> .` or a temporary directory approach instead.
Add under a ## AI Content Generation section in CLAUDE.md\n\nWhen generating AI content (e.g., lesson generation), ensure JSON responses are clean — never wrap them in markdown code fences. Handle max_tokens truncation gracefully by checking for incomplete JSON and retrying or streaming. Use isolated loading states per item (not shared useTransition across multiple buttons).