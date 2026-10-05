# Timelined

A timeline-based planner for tracking schedules and routines across periods of the year. Create a "period" for the month, then lay out recurring tasks on a visual timeline.

> **Status:** front-end prototype. Data is stored in the browser via `localStorage` — there is no backend yet.

## Features

- Create a period (one per month) with a custom name
- Add schedule tasks with a day of the week, start time, and end time
- Visual timeline view of the period's schedule
- Schedule editor modal per period
- Delete periods
- Light/dark theme (system-aware)

## Tech Stack

- **Next.js 15** (App Router) + React 19
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** components (Radix UI)
- `next-themes` for theming, `lucide-react` for icons

## Getting Started

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # start production server
npm run lint    # lint
```

## Project Structure

```
app/                     # Next.js App Router entry (page, layout, global styles)
components/
  timeline.tsx           # visual timeline of periods
  schedule-modal.tsx     # add/edit tasks for a period
  ui/                    # shadcn/ui primitives
hooks/                   # shared hooks
lib/                     # utilities
```

## Roadmap

- [ ] Persist data to a backend (auth + database)
- [ ] Recurring tasks and exceptions
- [ ] Drag-and-drop task reordering
- [ ] Export / import periods

## License

MIT
