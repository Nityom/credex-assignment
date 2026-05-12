# SpendWise AI — Free AI Tool Spend Audit

SpendWise AI is a free web app that audits your team's AI tool subscriptions — Cursor, Claude, ChatGPT, GitHub Copilot, and others — and gives you a precise, finance-grade breakdown of where you're overspending and how much you can save. Built as a lead-generation asset for [Credex](https://credex.rocks), a marketplace for discounted AI infrastructure credits.

**Live URL:** https://ai-spend-audit.vercel.app *(update with actual deployment URL)*

---

## Screenshots

> Add 3+ screenshots or a Loom/YouTube link here before submission.

---

## Quick Start

### Prerequisites
- Node.js 20+
- A Supabase project (free tier works)
- Resend account (free tier: 100 emails/day)
- Anthropic API key (optional — tool falls back to template summary if absent)

### Install and run locally

```bash
git clone https://github.com/your-username/ai-spend-audit
cd ai-spend-audit
npm install

# Copy and fill in environment variables
cp .env.local.example .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run tests

```bash
npm test
```

### Supabase schema

Run these SQL statements in your Supabase SQL editor:

```sql
create table audits (
  id uuid primary key,
  created_at timestamptz default now(),
  form_data jsonb not null,
  audit_result jsonb not null,
  total_monthly_savings numeric not null,
  total_annual_savings numeric not null
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  audit_id uuid references audits(id),
  email text not null,
  company_name text,
  role text,
  team_size int
);
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Set the environment variables from `.env.local.example` in your Vercel project settings.

---

## Decisions

Five trade-offs made during the week:

1. **Deterministic audit engine, not AI-generated rules.** The brief says "knowing when not to use AI is part of the test." A rules engine is auditable, explainable, and never hallucinates a pricing figure. AI is used only for the 100-word personalised summary paragraph — a task where variation and natural language actually help.

2. **In-memory rate limiting instead of Redis.** For a 7-day build, adding Upstash Redis would have consumed 3–4 hours of setup time and added a third external service. In-memory rate limiting resets on cold starts, which is a known limitation — documented in ARCHITECTURE.md with the production upgrade path. The honeypot field handles bots; the rate limit handles naive abuse.

3. **No login wall, ever.** The brief is explicit: email is captured after value is shown. Every B2B SaaS that gates value behind login loses 60–80% of users at the gate. The email gate comes after the full audit result is displayed — when the user has already received value and has a reason to share their contact information.

4. **Supabase over Cloudflare D1.** D1 is fast and cheap but the SDK and migrations tooling at the time of this build were less mature than Supabase's. Supabase's JS client has first-class TypeScript types that save significant time in a 7-day build.

5. **Static OG image with text overlay instead of dynamic Satori rendering.** Satori (Vercel's OG image library) works well for simple text but requires custom font loading that had conflicts with Next.js 14 App Router edge functions on the free Vercel tier. A static background image with dynamic metadata is simpler, faster, and works on every deployment environment without configuration.
