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
