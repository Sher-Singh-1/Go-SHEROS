# Go Sheros

An AI-powered goal planner and productivity coach. Plan → Do → Track → Improve.

This is the MVP implementation of the product blueprint: AI-assisted goal decomposition, task
management, a focus timer, habits, streaks, and analytics — built as a Next.js app with a
PostgreSQL database.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Prisma 7 + PostgreSQL ·
custom email-OTP auth (bcrypt + JWT sessions, no third-party auth vendor) · Anthropic Claude for
the AI coach (optional — falls back to a deterministic planner) · Recharts · @dnd-kit

## Getting started

**1. Start Postgres:**

```bash
docker compose up -d
```

This runs Postgres on `localhost:5433` (not 5432, in case something else on your machine already
uses it — see `docker-compose.yml`).

**2. Configure environment:**

```bash
cp .env.example .env   # already done if you're reading this in the seeded project
```

The defaults match `docker-compose.yml` and work out of the box. `ANTHROPIC_API_KEY` is optional
— see [AI coach](#ai-coach) below.

**3. Install dependencies and set up the database:**

```bash
npm install
npm run db:migrate   # applies prisma/migrations
npm run db:seed      # optional: creates a demo account with sample data
```

**4. Run it:**

```bash
npm run dev
```

Open the printed localhost URL. Sign up with any email — codes print to this terminal
(`[Go Sheros] Verify your email — code for ...`) unless you've configured real email below.

**Demo account** (from `npm run db:seed`): `demo@gosheros.app` / `GoSheros2026!`

## Email (OTP delivery)

Every account uses email OTP three times: signing up, resetting a password, and **every login**
(email/password checks out → a 6-digit code is emailed → only then does a session get created).
This is deliberate 2FA, not a bug — logging in always requires the current code from your inbox
(or the terminal, if email isn't configured).

To send real emails via [Resend](https://resend.com) (free tier):

1. Create a Resend account and grab an API key from the dashboard.
2. Add it to `.env`:
   ```
   RESEND_API_KEY="re_..."
   ```
3. Restart `npm run dev`.

Without a verified sending domain, Resend's shared address (`RESEND_FROM_EMAIL` in `.env`,
defaults to `onboarding@resend.dev`) only delivers to **the email address on your Resend
account** — fine while you're the only user. To send OTPs to other real users, verify your own
domain in the Resend dashboard (a few DNS records) and point `RESEND_FROM_EMAIL` at an address on
it — no code changes needed, just the env var.

If `RESEND_API_KEY` is unset, or a send fails, the code always also prints to the server
console — dev never gets blocked on email.

## AI coach

Without `ANTHROPIC_API_KEY` set, goal planning and the AI chat run on a deterministic, rule-based
engine (`src/lib/planning/decompose.ts` and the fallback branch of `src/lib/ai/provider.ts`) — no
external calls, fully functional. Add a real key to `.env` to switch to Claude:

```
ANTHROPIC_API_KEY="sk-ant-..."
```

Every plan — deterministic or AI-generated — passes through the same validation layer
(`src/lib/planning/validate.ts`) before it's shown to the user, and nothing is written to the
database until the user explicitly accepts it.

## Project structure

```
prisma/schema.prisma        Database schema (see the blueprint's Database Architecture section)
src/lib/auth/               Session (JWT+cookie), password hashing, OTP, rate limiting
src/lib/planning/           Goal → milestone → task decomposition + capacity validation
src/lib/ai/provider.ts      AI coach: Claude if configured, deterministic planner otherwise
src/lib/streaks/engine.ts   Streak calculation with one-per-week recovery protection
src/lib/analytics/          Completion metrics, heatmap series, rule-based insights
src/lib/notifications/email.ts  Resend integration (no-op if RESEND_API_KEY is unset)
src/app/(auth)/             Signup, login (+ login-verify OTP step), verify, forgot/reset password
src/app/onboarding/         Post-signup profile + planning-preferences step
src/app/dashboard/          The authenticated app: today, goals, calendar, habits, focus, analytics, AI, settings
src/proxy.ts                Route protection (Next 16 renamed `middleware` → `proxy`)
```

## What's implemented vs. deferred

This covers the MVP scope from the blueprint (§27): auth, AI-assisted and manual goal/task
management, calendar, focus timer (stopwatch/countdown/Pomodoro), streaks with recovery, habits,
core analytics, and account/data controls (export, deletion).

Deferred to v2/v3 per the blueprint: calendar sync with Google/Outlook, real push notifications
and transactional email (the schema and settings UI exist; delivery doesn't), achievement badge
UI (badges are unlocked and stored, not yet surfaced visually beyond the analytics count),
shared/team goals, and native mobile apps.

## Production notes

- The rate limiter (`src/lib/auth/rate-limit.ts`) is in-memory — fine for one server process,
  swap for Redis before running more than one.
- `AUTH_SECRET` in `.env.example` is a placeholder — generate a real one
  (`openssl rand -base64 32`) before deploying anywhere real.
- Email defaults to Resend's shared sandbox sender — verify your own domain before inviting real
  users, or OTPs will only reach your own inbox (see [Email](#email-otp-delivery) above).
