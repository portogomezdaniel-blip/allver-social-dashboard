# Allver Social Dashboard

Personal content management dashboard for managing AI agents and content operations. Single-user, private app.

## Tech Stack

- **Framework:** Next.js 15 (App Router, `src/` directory)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Theme:** Dark mode globally (`<html className="dark">`)
- **Font:** Geist Sans via `next/font/google`
- **Package manager:** npm

## Architecture Decisions

- **App Router** with `src/app/` directory structure — each section has its own route folder
- **Shared sidebar layout** defined in `src/app/layout.tsx` wrapping all pages
- **shadcn/ui** initialized with Tailwind v4 integration (`shadcn/tailwind.css`, `tw-animate-css`)
- **Custom dark theme** uses oklch color space with violet/purple accent (`oklch(0.7 0.18 280)`)
- **No icon library** — inline SVGs used in sidebar to avoid extra dependencies
- **Static pages** — no SSR needed since this is a private dashboard

## Color System

- Primary/accent: Violet (`oklch(0.7 0.18 280)`) — used for active states, rings, chart-1
- Background: Deep dark with slight purple tint (`oklch(0.13 0.005 285)`)
- Cards: Slightly lighter (`oklch(0.18 0.005 285)`)
- Borders: Subtle (`oklch(0.3 0.01 285)`)
- Charts: 5-color palette across different hues for data visualization

## Routes

| Route | Section | Purpose |
|-------|---------|---------|
| `/` | Home | Landing with section links |
| `/instagram` | Instagram Manager | Posts, drafts, backlog, scheduling |
| `/analytics` | Analytics | Charts, Metricool integration |
| `/calendar` | Content Calendar | Monthly view, platform filters |
| `/competitors` | Competitor Tracker | Handles, engagement, growth |
| `/news` | News Consolidator | RSS feeds, AI/marketing news |
| `/agents` | Agent Control Panel | AI agent status, triggers, approve/reject |

## Key Files

- `src/components/sidebar.tsx` — Shared navigation sidebar (client component)
- `src/app/globals.css` — Theme variables (shadcn + custom dark overrides)
- `src/lib/utils.ts` — shadcn utility (cn function)
- `src/components/ui/` — shadcn/ui components

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run start  # Start production server
```

## Conventions

- All new UI components go in `src/components/`
- shadcn/ui components auto-install to `src/components/ui/`
- Use `cn()` from `@/lib/utils` for conditional class merging
- Keep pages as server components unless interactivity is needed
- Use `"use client"` directive only when state/effects are required
