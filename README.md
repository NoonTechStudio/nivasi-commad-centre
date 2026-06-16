# Nivasi Command Centre

Admin portal for the Nivasi society management platform.

## Tech Stack
- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- Recharts (analytics charts)
- Sonner (toast notifications)
- Axios (API client)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3001

## Login

Use Super Admin credentials:
- Phone: 8000404040
- OTP: 123456 (development)

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview with KPIs and real activity feed |
| `/dashboard/societies` | Society management + 3-step Add Society wizard |
| `/dashboard/societies/[id]` | Society detail — Overview / Wings / Financials tabs |
| `/dashboard/societies/[id]/wings/[wingId]` | Wing detail with flats and secretary |
| `/dashboard/partners` | Partner hierarchy (tree + list view) |
| `/dashboard/subscriptions` | Subscription management with payment recording |
| `/dashboard/analytics` | Charts and reports with CSV/PDF export |
| `/dashboard/support` | Support ticket system |
| `/dashboard/notifications` | Notification centre with unread badge |
| `/dashboard/settings` | Configuration — General / Plans / Notifications / Account / Security |

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Key Features

- **Collapsed sidebar** — icon-only mode, persisted to localStorage
- **⌘K search** — global search across societies and partners, grouped results
- **Skeleton loading** — shimmer placeholders on all data pages
- **Add Society wizard** — 3-step flow: details → wing → success with trial auto-setup
- **Real-time notification badge** — bell icon updates on localStorage events
- **Mobile responsive** — hamburger menu and sidebar overlay
- **PDF export** — browser print for analytics reports
- **Error boundaries** — app/error.tsx + app/not-found.tsx

## Architecture Notes

- Auth: JWT in localStorage + cookie for server-side proxy guard
- Route protection: `proxy.ts` (Next.js 16 replaces `middleware.ts`)
- Colors: Tailwind v4 CSS-based `@theme inline` in `app/globals.css`
- All client-only state (notifications, tickets, settings) persisted in localStorage
