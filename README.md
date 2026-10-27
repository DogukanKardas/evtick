# EvTick — Multi-tenant IT Ticketing on Supabase

A mobile-friendly IT support ticketing platform where many companies share one database but never see each other's data. Tenant isolation is enforced in PostgreSQL with Row-Level Security, not in application code, and is covered by integration tests that try to break it.

**Live demo:** [evtick-live.vercel.app](https://evtick-live.vercel.app)

> 🇹🇷 Türkçe kurulum rehberi: [README.tr.md](README.tr.md)

## What it does

- **Multi-tenant by design** — each company signs up with its own company code; every row carries a `company_id` and RLS policies scope all reads and writes to it.
- **Four roles** — employee, IT support, company admin and platform super admin, each with its own panel and permissions.
- **Ticket lifecycle** — create, assign, update status and close tickets, with a real-time chat thread per ticket (Supabase Realtime).
- **Platform admin panel** — KPIs, company and user management, cross-tenant ticket intervention, super admin invitations and an audit log of every admin action.

## Security model

| Concern | How it's handled |
| --- | --- |
| Tenant isolation | RLS policies on every table, keyed to the caller's `company_id` |
| Privilege escalation | Signup trigger always creates `employee`; role metadata from the client is ignored |
| Privileged operations | `SECURITY DEFINER` functions check the caller's role before acting (e.g. `generate_company_code` is super-admin only) |
| Service role key | Server-only; used solely for super admin invitations |
| Open redirects | Auth callback only accepts same-origin relative paths |

The `tests/security` suite runs against a real Supabase instance seeded with two tenants and checks that these rules hold:

- **RLS matrix** — an employee of company A cannot read company B's tickets
- **IDOR** — an employee cannot post messages to another company's ticket by guessing its ID
- **Role escalation** — users cannot promote themselves or call admin-only functions
- **Auth callback** — redirect targets are validated

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres, Auth, Realtime) · Tailwind CSS · shadcn/ui · Vitest · Playwright

## Project structure

```
src/app/(auth)        Sign-up, login, email verification
src/app/(app)         Employee, support, admin and /system panels
src/lib               Supabase clients, auth helpers, data access
supabase/migrations   Schema, RLS policies, RPCs, hardening, indexes (001–008)
tests/security        RLS, IDOR, role-escalation and auth tests
tests/e2e             Playwright flows: auth, route guards, ticket lifecycle
tests/perf            Query budget smoke tests
```

## Running locally

```bash
npm install
cp .env.local.example .env.local   # add your Supabase URL, anon key and service role key
npm run dev
```

Run the SQL files in `supabase/migrations` in order on a new Supabase project. Run `003` on its own before `004`, because PostgreSQL can't use a new enum value in the same transaction that adds it. Step-by-step setup, environment variables and first super admin creation are covered in [README.tr.md](README.tr.md).

## Tests

```bash
npm run test:seed       # seed two test tenants (needs service role key)
npm run test:security   # RLS / IDOR / role escalation
npm run test:e2e        # Playwright end-to-end flows
npm run test:all        # everything
```

Integration tests skip automatically when Supabase credentials aren't set.

---

Built by [Dogukan Kardas](https://www.linkedin.com/in/dogukan-kardas/) · [dogukankardas.com](https://www.dogukankardas.com)
