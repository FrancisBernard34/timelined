# Timelined

[![CI](https://github.com/FrancisBernard34/timelined/actions/workflows/ci.yml/badge.svg)](https://github.com/FrancisBernard34/timelined/actions/workflows/ci.yml)
[![E2E](https://github.com/FrancisBernard34/timelined/actions/workflows/e2e.yml/badge.svg)](https://github.com/FrancisBernard34/timelined/actions/workflows/e2e.yml)

A timeline-based planner for tracking schedules and routines across periods of the year. Create a "period" for each month, lay out recurring tasks on a visual timeline, and keep everything persisted in a PostgreSQL database.

**[Live demo →](https://timelined.vercel.app)**

## Features

- Create a period (one per month) with a custom name
- Add tasks with a day of the week, start time, and end time
- Visual timeline of periods you can drag to navigate
- Per-period schedule editor — add, remove, and clone tasks between days
- Light/dark theme (system-aware)
- Data persisted server-side in PostgreSQL

## Tech Stack

- **Next.js 15** (App Router) + React 19
- **TypeScript**
- **PostgreSQL** + **Prisma ORM**
- **Zod** for request validation
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI)
- **Vitest** for unit and integration tests, **Playwright** for end-to-end tests

## Architecture

```
app/
  page.tsx                       # client UI (periods, timeline, editor)
  api/periods/route.ts           # GET (list) + POST (create) periods
  api/periods/[id]/route.ts      # DELETE a period
  api/periods/[id]/schedule/route.ts  # PUT: replace a period's tasks
lib/
  db.ts                          # Prisma client singleton
  periods.ts                     # data-access layer (maps DB <-> API DTOs)
  validation.ts                  # Zod schemas
prisma/
  schema.prisma                  # Period + Task models
  migrations/                    # SQL migrations
tests/                           # Vitest unit + integration tests
tests/e2e/                       # Playwright end-to-end tests
```

The API validates every request with Zod and returns DTOs; the data layer is a thin
wrapper over Prisma so it can be tested in isolation.

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start a PostgreSQL database

With Docker:

```bash
docker compose up -d
```

Or use any Postgres (Neon, Supabase, local) and set `DATABASE_URL` accordingly.

### 3. Configure environment

```bash
cp .env.example .env
# edit DATABASE_URL if needed
```

### 4. Run migrations

```bash
pnpm prisma migrate dev
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run unit + integration tests (needs a database) |
| `pnpm test:e2e` | Run Playwright end-to-end tests (starts the app + needs a database) |
| `pnpm db:migrate` | Create and apply a migration in development |
| `pnpm db:deploy` | Apply migrations in production |
| `pnpm db:studio` | Open Prisma Studio |

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/periods` | List all periods with their tasks |
| `POST` | `/api/periods` | Create a period (unique per month/year → `409` on duplicate) |
| `DELETE` | `/api/periods/:id` | Delete a period and its tasks |
| `PUT` | `/api/periods/:id/schedule` | Replace a period's task list |

## Testing

Unit tests cover the validation schemas; integration tests exercise the data layer
against a real PostgreSQL database.

```bash
pnpm test      # Vitest: unit + integration
pnpm test:e2e  # Playwright: full create → schedule → reload → delete flow
```

CI runs tests and a production build against a Postgres service container, and a
separate workflow runs the Playwright end-to-end suite.

## Deployment

1. Provision a Postgres database (e.g. [Neon](https://neon.tech) free tier).
2. Set `DATABASE_URL` in your host's environment.
3. Run `pnpm prisma migrate deploy` (as a release/build step).
4. Deploy to Vercel (or any Node host).

## Roadmap

- [ ] User accounts and per-user periods
- [ ] Edit existing tasks inline
- [ ] Drag-and-drop tasks on the timeline
- [ ] Recurring tasks and exceptions
- [x] Playwright end-to-end tests

## License

MIT
