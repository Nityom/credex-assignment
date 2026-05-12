# ARCHITECTURE.md

## System Diagram

```mermaid
graph TD
    A[User — cold visitor] -->|fills form| B[Next.js App — /]
    B -->|POST /api/audit| C[Audit API Route]
    C -->|runAudit — deterministic| D[Audit Engine<br/>lib/audit-engine.ts]
    C -->|POST /api/summary| E[Summary API Route]
    E -->|Claude 3 Haiku| F[Anthropic API]
    F -->|100-word paragraph| E
    E -->|fallback if fail| G[Template Summary]
    C -->|INSERT| H[(Supabase — audits table)]
    C -->|auditId| B
    B -->|redirect| I[/audit/:id]
    I -->|SELECT| H
    I -->|renders results| J[AuditResultsClient]
    J -->|email + optional fields| K[Lead API Route — /api/lead]
    K -->|INSERT| L[(Supabase — leads table)]
    K -->|send| M[Resend — transactional email]
    J -->|shareable URL| N[Public /audit/:id]
    N -->|OG meta tags| O[Twitter / LinkedIn preview]
```

## Data Flow: Input → Audit Result

1. **User submits form** at `/`. Form state is persisted in `localStorage` across reloads.
2. **`POST /api/audit`** receives the `SpendFormData` payload (tools + teamSize + useCase). Input is validated with Zod before any processing.
3. **Rate limiting** is applied per IP (10 requests/minute) using an in-memory map. This is sufficient for MVP; production would use Upstash Redis.
4. **`runAudit(formData)`** runs entirely in-memory — no I/O, no ML, no LLM. It applies deterministic rule trees for each tool and returns a `AuditResult` with per-tool recommendations and totals.
5. **`POST /api/summary`** is called with the form data + audit result. It constructs a structured prompt and calls Claude 3 Haiku. If the call fails or times out (8s), it returns a template-based fallback. The parent route continues regardless.
6. The complete audit (form data + result + savings totals) is **inserted into Supabase** with a UUID primary key.
7. The client is redirected to `/audit/:id`.
8. **`/audit/:id`** is a Next.js server component that fetches the audit from Supabase and generates Open Graph metadata dynamically. The identifying fields (email, company) are never stored in the `audits` table — only in `leads`.
9. When the user submits the **lead capture form**, `POST /api/lead` validates the payload, checks the honeypot field, rate-limits by email, inserts into the `leads` table, and fires a transactional email via Resend.

## Stack Choices

### Next.js 14 (App Router)
**Why:** Server components give us free SSR for the audit results page (important for OG metadata correctness). The App Router collocates API routes, pages, and server logic without a separate Express layer. Vercel deployment is one command. The alternative was SvelteKit — comparable in philosophy, but the React ecosystem's TypeScript tooling (react-hook-form, zod resolvers) is more mature for form-heavy UIs.

### TypeScript
Mandatory for a data-heavy application where the shape of `AuditResult` flows through 8+ files. Zod at the API boundary means the TypeScript types and the runtime validation are derived from the same source.

### Tailwind CSS v4
No design system overhead. Tailwind v4 compiles to a single CSS file at build time — zero runtime cost. shadcn/ui was considered but adds component boilerplate that obscures what's custom vs library-provided. For a product that lives or dies on design polish, owning every component is the right call.

### Supabase (Postgres)
Real database with a generous free tier, built-in Postgres Row Level Security, and a typed JS client. Alternatives: Cloudflare D1 (no free persistent storage at audit volume), Firebase (NoSQL makes the leads ↔ audits join painful), Render Postgres (no managed hosting discount for this tier). Supabase wins on simplicity + cost.

### Anthropic API (Claude 3 Haiku)
The audit engine itself uses zero AI — deterministic rules only. AI is used exclusively for the personalised summary paragraph. Haiku is chosen over Sonnet/Opus for this task: it's 10× cheaper, fast enough for a synchronous call, and a 100-word paragraph does not require frontier reasoning capability. The call is wrapped in a try/catch with an 8-second timeout and a template fallback — the feature gracefully degrades.

### Resend
Transactional email with a generous free tier (100 emails/day), excellent deliverability, and a typed Node.js SDK. Alternatives: Postmark (similar), AWS SES (requires domain verification setup time that compresses a 7-day build).

## What Changes at 10k Audits/Day

| Concern | Current | At 10k/day |
|---|---|---|
| Rate limiting | In-memory Map (resets on cold start) | Upstash Redis with sliding window |
| DB writes | Supabase free tier | Supabase Pro or self-hosted Postgres on Render |
| AI summary | Synchronous call in audit route | Async job queue (e.g. Inngest) to avoid request timeouts |
| OG image | `/api/og` dynamic (Vercel Satori) | Edge-cached with CDN |
| Form state | localStorage | Same — client-side, no server impact |
| Email | Resend free tier (100/day) | Resend scale plan or Postmark |

The audit engine itself (`runAudit`) is a pure function with O(n) tool complexity — it will handle any load without changes.
