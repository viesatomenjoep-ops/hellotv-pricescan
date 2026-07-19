# hellotv-pricescan

Empty, runnable shell for the **hellotv-pricescan** app. No features yet — just the
foundation wired up and ready to build on.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Postgres, Auth, RLS) as backend
- **Vercel** for deployment
- **pnpm**, ESLint + Prettier, absolute imports via `@/`

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev                     # http://localhost:3000
```

## Scripts

| Script              | Description                      |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Start the dev server             |
| `pnpm build`        | Production build                 |
| `pnpm start`        | Run the production build         |
| `pnpm lint`         | ESLint                           |
| `pnpm format`       | Format with Prettier             |
| `pnpm format:check` | Check formatting without writing |

## Project structure

```
app/                     Next.js App Router (routes, layouts, pages)
components/              Shared React components
  ui/                    shadcn/ui components
lib/
  supabase/              Supabase client helpers (browser + server)
  vendit/                Vendit API integration
  rfid/                  RFID scanning
  alternatives/          Alternatives / price comparison
supabase/
  migrations/            SQL migrations
scripts/                 One-off / maintenance scripts
docs/                    Project documentation
```

## Environment variables

See [`.env.example`](./.env.example) for the full list. Copy it to `.env.local`
and fill in the values (Supabase, Vendit, cron secret, Resend).
