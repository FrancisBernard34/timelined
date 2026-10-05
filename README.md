# Timelined

[![CI](https://github.com/FrancisBernard34/timelined/actions/workflows/ci.yml/badge.svg)](https://github.com/FrancisBernard34/timelined/actions/workflows/ci.yml)
[![E2E](https://github.com/FrancisBernard34/timelined/actions/workflows/e2e.yml/badge.svg)](https://github.com/FrancisBernard34/timelined/actions/workflows/e2e.yml)

A timeline-based planner for tracking schedules and routines across periods of the year. Create a "period" for each month, lay out recurring tasks on a visual timeline, and keep everything persisted in a PostgreSQL database.

**[Live demo →](https://timelined.vercel.app)**

## Features

- Email/password accounts — each user only ever sees their own periods
- Create a period (one per month) with a custom name
- Add tasks with a day of the week, start time, and end time
- Visual timeline of periods you can drag to navigate
- Per-period schedule editor — add, remove, and clone tasks between days
- Light/dark theme (system-aware)
- Data persisted server-side in PostgreSQL, scoped per user

## Tech Stack

- **Next.js 15** (App Router) + React 19
- **TypeScript**
- **PostgreSQL** + **Prisma ORM**
- **Zod** for request validation
- **Auth** — email/password with `scrypt` hashing and HMAC-signed, httpOnly session cookies (no auth dependency)
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI)
- **Vitest** for unit and integration tests, **Playwright** for end-to-end tests

## Architecture

```
app/
  page.tsx                       # client UI (auth gate, periods, timeline, editor)
  api/auth/signup/route.ts       # POST: create account + session
  api/auth/login/route.ts        # POST: verify credentials + session
  api/auth/logout/route.ts       # POST: clear session
  api/auth/me/route.ts           # GET: current user (401 if signed out)
  api/periods/route.ts           # GET (list) + POST (create) periods
  api/periods/[id]/route.ts      # DELETE a period
  api/periods/[id]/schedule/route.ts  # PUT: replace a period's tasks
components/
  auth-form.tsx                  # login / signup form
lib/
  db.ts                          # Prisma client singleton
  auth.ts                        # password hashing + signed session cookie
  api-auth.ts                    # requireUser() guard for route handlers
  periods.ts                     # data-access layer (maps DB <-> API DTOs, scoped by user)
  validation.ts                  # Zod schemas
prisma/
  schema.prisma                  # User + Period + Task models
  migrations/                    # SQL migrations
tests/                           # Vitest unit + integration tests
tests/e2e/                       # Playwright end-to-end tests
```

The API validates every request with Zod and returns DTOs; the data layer is a thin
wrapper over Prisma so it can be tested in isolation. Periods are owned by a user and
every query is scoped to the authenticated session, so the same month can exist for
different accounts.

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
# set DATABASE_URL and a random SESSION_SECRET
```

`SESSION_SECRET` signs the session cookie — use a long random value in production
(e.g. `openssl rand -base64 32`).

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

All `/api/periods` routes require an authenticated session (`401` otherwise).

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account and start a session (`409` if email taken) |
| `POST` | `/api/auth/login` | Verify credentials and start a session (`401` on failure) |
| `POST` | `/api/auth/logout` | Clear the session |
| `GET` | `/api/auth/me` | Current user (`401` when signed out) |
| `GET` | `/api/periods` | List the current user's periods with their tasks |
| `POST` | `/api/periods` | Create a period, unique per month/year for that user (`409` on duplicate) |
| `DELETE` | `/api/periods/:id` | Delete one of the user's periods and its tasks |
| `PUT` | `/api/periods/:id/schedule` | Replace a period's task list |

## Testing

Unit tests cover the validation schemas; integration tests exercise the data layer
against a real PostgreSQL database, including per-user isolation.

```bash
pnpm test      # Vitest: unit + integration
pnpm test:e2e  # Playwright: signup → create → schedule → reload → logout/login → delete
```

CI runs tests and a production build against a Postgres service container, and a
separate workflow runs the Playwright end-to-end suite.

## Deployment

1. Provision a Postgres database (e.g. [Neon](https://neon.tech) free tier).
2. Set `DATABASE_URL` and `SESSION_SECRET` in your host's environment.
3. Run `pnpm prisma migrate deploy` (as a release/build step).
4. Deploy to Vercel (or any Node host).

## Roadmap

- [x] User accounts and per-user periods
- [ ] Edit existing tasks inline
- [ ] Drag-and-drop tasks on the timeline
- [ ] Recurring tasks and exceptions
- [x] Playwright end-to-end tests

## License

MIT
