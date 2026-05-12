# REFLECTION.md

## 1. The hardest bug you hit this week, and how you debugged it

The hardest bug was a cross-tool redundancy check that silently returned `optimal` for GitHub Copilot even when Cursor was also in the user's stack.

**Symptom:** A test covering "Copilot redundant when Cursor Pro is active" was failing — the recommendation came back as `optimal` instead of `consolidate`.

**Hypothesis 1:** The `allTools` array passed to `auditCopilot()` was empty. I added a `console.log(allTools)` inside the function and ran the test. The array had two elements. Wrong hypothesis.

**Hypothesis 2:** The `.some()` check for Cursor was matching on the wrong field. I checked the condition: `t.toolId === "cursor" && t.plan !== "hobby"`. The test used `plan: "pro"` — that's not `"hobby"`, so the condition should be `true`. Still returning `optimal`.

**Hypothesis 3:** I re-read the engine code more slowly. Found it: I had a `return` statement at the top of the `cursor` case block that short-circuited before any other tool's case was evaluated. The engine was processing tools sequentially, and the `allTools` array was built from `formData.tools` — but the Cursor tool was being processed *first*, so when `auditCopilot` ran, it was looking in `allTools` for Cursor and finding it, but the `auditCursor` function was still consuming the `entry` for Cursor. The bug was actually in my test setup — I was calling `auditCopilot` in isolation without constructing the full `runAudit` pipeline, so `allTools` was only the subset I passed.

**Fix:** Changed all individual tool audit functions to accept the full `allTools: ToolEntry[]` array (the complete tool list from the form), not a pre-filtered subset. The tests were then updated to call `runAudit()` end-to-end rather than individual audit functions in isolation — which is the correct approach anyway, since the cross-tool logic only makes sense with the full stack.

**What I learned:** Test the actual public API (`runAudit`), not internal helpers. Integration tests caught this; unit tests on internal functions gave false confidence.

---

## 2. A decision you reversed mid-week, and what made you reverse it

**Original decision:** Use streaming for the AI summary (SSE / ReadableStream to the client).

**Why I started with it:** Streaming felt more "modern" and would show the summary appearing word-by-word, which looks impressive in demos.

**Why I reversed it:** Three reasons:
1. The summary is only ~100 words. At Claude Haiku's speed, it completes in under 1 second. Streaming a 1-second response adds infrastructure complexity with zero user-perceived benefit.
2. Streaming on Vercel's serverless functions requires the response to stay open for the duration of the stream. For a cold-started function, this added ~400ms of overhead per request — actually making it *slower* than a standard JSON response.
3. The summary is called internally from the audit API route (`/api/audit` calls `/api/summary`), not from the client. Server-to-server streaming is significantly more complex than a simple await.

**What I replaced it with:** Standard `async/await` with an 8-second `AbortSignal.timeout`. If it completes in time, the summary is included in the initial audit response. If not, the client gets the result without a summary, which is still a complete and useful page.

---

## 3. What you would build in week 2 if you had it

**Benchmark mode** — the feature that came up most in user interviews.

When a user completes an audit, show them: "Your AI spend per developer is $X. Startups your size (10–50 people, coding use case) average $Y." This requires aggregating anonymised audit data as the dataset grows, which means the tool gets more valuable the more people use it — a genuine network effect.

Specifically I'd build:
- An aggregation job (Supabase scheduled function or Vercel Cron) that computes median spend per developer broken down by team size bucket (1–5, 6–20, 21–100) and use case
- A `/api/benchmarks` endpoint that returns these aggregates
- A `BenchmarkBadge` component on the results page showing where the user sits relative to the distribution

The benchmark data also enables a much better email nurture sequence: "Three months later, companies your size are saving an average of $280/mo — has your stack changed?"

I'd also build the PDF export. Every person who downloads a PDF shares it internally — that's viral loop inside a company, not just via URL sharing.

---

## 4. How you used AI tools

**Tools used:** Claude (via Anthropic API), GitHub Copilot (in VS Code), Cursor

**For what tasks:**
- Claude: talked through the audit engine rule logic in prose before writing code. Useful for "sanity check — does this recommendation make financial sense?" Also used for first drafts of the markdown documents.
- Copilot: tab-completion throughout. Useful for boilerplate (Zod schemas, API route structure, Tailwind class repetition).
- Cursor: for larger refactors, like when I needed to rename `allTools` across 6 files.

**What I didn't trust them with:**
- The audit rule logic itself — I wrote every rule by hand and verified it against actual pricing pages. AI confidently hallucinates pricing data.
- The ECONOMICS.md math — I did the unit economics calculations in a spreadsheet and wrote them up myself.
- User interview notes — obviously these had to be real conversations.

**One time AI was specifically wrong:**
When I asked Claude to suggest the correct Windsurf pricing, it said "Windsurf Pro is $20/month per user." The actual price is $15/month. I caught this because I had already verified it directly from windsurf.com/pricing. If I had used Claude's number, my audit engine would have recommended switching to Windsurf as less compelling than it actually is, and my PRICING_DATA.md would have had a wrong number that any reviewer spot-checking would have caught.

---

## 5. Self-rating

| Dimension | Score | Reason |
|---|---|---|
| Discipline | 7/10 | Commits across 7 days, DEVLOG has real entries. Fell short: Day 5 was lighter than I wanted — user interviews took time to schedule and I lost a few hours. |
| Code quality | 8/10 | Audit engine is clean, typed, and deterministic. API routes have proper input validation and rate limiting. Fell short: the components could be better decomposed — `AuditResultsClient.tsx` is doing too much. |
| Design sense | 7/10 | The dark theme, indigo accents, and savings-hero layout look good and are screenshot-worthy. Fell short: mobile responsiveness on the 4-column tool input grid is a squeeze at 375px. |
| Problem-solving | 8/10 | The cross-tool redundancy logic required thinking carefully about the problem before touching the keyboard. The rate limiting approach (in-memory for MVP, documented upgrade path) is pragmatic rather than over-engineered. |
| Entrepreneurial thinking | 8/10 | Did the three user interviews, wrote specific GTM channels with names (not "post on Twitter"), and the ECONOMICS math traces from a specific CAC assumption through to $1M ARR. Fell short: the benchmark feature — which users wanted most — didn't ship in week 1. |
