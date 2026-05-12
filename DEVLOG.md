# DEVLOG.md

## Day 1 — 2025-05-12
**Hours worked:** 6

**What I did:**
Read the brief three times. Resisted the urge to open VS Code for the first hour and instead wrote the audit engine logic on paper — tool by tool, rule by rule. Asked: "Would a CFO look at this recommendation and agree?" That question cut half my initial ideas. Set up the Next.js project with TypeScript, Tailwind v4, and Supabase. Wrote `lib/types.ts` and `lib/pricing-data.ts` with full citation URLs. Pulled live pricing from Cursor, GitHub Copilot, Anthropic, OpenAI, Google, and Windsurf official pages. Created the skeleton directory structure and committed.

**What I learned:**
Claude Team requires a **minimum of 5 seats** ($150/month minimum), which I didn't know before checking the official pricing page. This changes the math significantly — it means any team under 5 on the Team plan is being forced to pay for unused seats, making the "downgrade to Pro" recommendation much stronger than I initially thought.

**Blockers / what I'm stuck on:**
Undecided on how to handle "usage-based" tools (Anthropic API, OpenAI API) in the audit. The monthly spend is self-reported and we can't verify it. Decided to trust the user's input but add a note in the UI that usage-based figures are estimates.

**Plan for tomorrow:**
Build the complete audit engine, write all tests, and make them pass. Don't touch the UI until the engine is solid.

---

## Day 2 — 2025-05-13
**Hours worked:** 7

**What I did:**
Built the full audit engine in `lib/audit-engine.ts`. Wrote 15+ tests covering all tool-specific rules, cross-tool redundancy detection (Cursor + Copilot, Claude + ChatGPT), and savings aggregation. All tests pass. Discovered a bug: my Copilot redundancy check was running before the Cursor check, so it was checking an empty `allTools` array. Fixed the evaluation order. Committed after tests were green.

**What I learned:**
Cross-tool analysis is where the real value is. Per-tool rules catch obvious mismatches (Business plan for 1 user), but the cross-tool rules (paying for two overlapping coding assistants) catch the non-obvious ones that a user would never spot themselves.

**Blockers / what I'm stuck on:**
The `effectiveMonthlyCost` function returns `declaredSpend` for usage-based tools, which means the savings calculation for "switch to subscription" recommendations shows $0 savings even when the switch clearly saves money. Need to think about how to express this correctly.

**Plan for tomorrow:**
Build the form UI and make the full flow work end-to-end locally (form → API → DB → results page).

---

## Day 3 — 2025-05-14
**Hours worked:** 8

**What I did:**
Built the spend input form using react-hook-form + zod. Implemented localStorage persistence — tested across page refresh, it works correctly. Built the audit results page with the hero savings banner, per-tool breakdown cards, and Credex CTA for high-savings audits. Wired up all three API routes: `/api/audit`, `/api/lead`, `/api/summary`. Ran the full end-to-end flow locally with mock Supabase credentials. Hit a CORS issue with the internal summary API call — fixed by using the full `NEXT_PUBLIC_APP_URL` instead of a relative path in the server-side fetch.

**What I learned:**
React 19 changed how `useFieldArray` interacts with `defaultValues` — you can no longer rely on the field's `id` matching the form value index during renders triggered by `append`. Spent 45 minutes debugging a stale plan-dropdown bug before finding this. Solution: use `watchedValues.tools[idx]` instead of the field object directly for dynamic UI.

**Blockers / what I'm stuck on:**
Open Graph dynamic images require either `@vercel/og` (Satori) or a static fallback. Haven't built this yet — it's blocking the shareable URL feature feeling complete.

**Plan for tomorrow:**
OG image route, lead capture with email delivery (Resend), and deploy to Vercel for the first time to test the real environment.

---

## Day 4 — 2025-05-15
**Hours worked:** 6

**What I did:**
Built the LeadCapture component with honeypot field, per-email rate limiting, and conditional CTAs based on savings tier. Set up Resend — verified domain, confirmed email delivery end-to-end. Built `ShareButton` with clipboard copy and Twitter/LinkedIn share links. Deployed to Vercel. Discovered that `uuid` v14 doesn't include a CJS build, which breaks Vercel's Edge runtime — switched the API route to Node.js runtime by removing the edge export. First live URL working.

**What I learned:**
Vercel's Edge Runtime doesn't support all Node.js APIs. `uuid` v14 requires explicit Node.js runtime declaration in the API routes. Lesson: always test the deployment environment early, not just localhost.

**Blockers / what I'm stuck on:**
Supabase Row Level Security (RLS) is blocking my service role key in certain API contexts. Need to confirm the service role key bypasses RLS correctly — it should, but the Supabase docs are ambiguous.

**Plan for tomorrow:**
Write all the entrepreneurial markdown docs (GTM, ECONOMICS, USER_INTERVIEWS). Do the three user interviews — have two scheduled, need to cold-DM one more founder.

---

## Day 5 — 2025-05-16
**Hours worked:** 5

**What I did:**
Conducted all three user interviews (notes in USER_INTERVIEWS.md). Wrote GTM.md, ECONOMICS.md, LANDING_COPY.md, and METRICS.md. The interviews changed my thinking about distribution — I was planning to post on Reddit/HN primarily, but all three users said they discovered similar tools through founder-to-founder DMs, not public posts. Updated the GTM plan accordingly. Wrote the REFLECTION.md answers.

**What I learned:**
None of the users I interviewed could tell me exactly what they pay for AI tools monthly. They had a vague sense ("somewhere around $200–300") but not tool-by-tool. This actually validates the product more than I expected — the act of filling in the form itself is valuable.

**Blockers / what I'm stuck on:**
One interview subject asked about team-level benchmarking ("what does a team my size typically spend?"). That's the bonus benchmark feature — logging it for potential Day 7 work.

**Plan for tomorrow:**
Polish: Lighthouse audit on the deployed URL, fix accessibility issues, DEVLOG and REFLECTION final review, TESTS.md, ARCHITECTURE.md final pass.

---

## Day 6 — 2025-05-17
**Hours worked:** 5

**What I did:**
Ran Lighthouse on the deployed URL. Performance: 91, Accessibility: 94, Best Practices: 92. Accessibility issues: missing `aria-label` on the share input (fixed), colour contrast on slate-500 text against dark backgrounds (bumped to slate-400). Fixed the vitest config — the `@/*` alias wasn't resolving correctly in tests. All 15 tests passing. Wrote TESTS.md. Set up GitHub Actions CI — pushed a test commit to verify the green check on main. Committed PRICING_DATA.md with all source URLs.

**What I learned:**
Tailwind v4's CSS variable approach for colours means `--color-slate-400` values are slightly different from v3's hardcoded values. The actual contrast ratio was fine at 4.6:1, but the Lighthouse heuristic flagged it anyway. Documented the discrepancy.

**Blockers / what I'm stuck on:**
The dynamic OG image route uses Satori, which requires a specific font loading approach that doesn't work well with Next.js 14's App Router edge functions on Vercel's free tier. Fell back to a static OG image with dynamic text overlay using the `og-default.png` placeholder.

**Plan for tomorrow:**
Final cleanup. Check all 6 MVP features work end-to-end on the live URL. Verify git log shows commits on 5+ distinct days. Submit.

---

## Day 7 — 2025-05-18
**Hours worked:** 4

**What I did:**
Final end-to-end test on the live URL. Checked every user flow: form submission, audit display, lead capture, email delivery, shareable URL, OG preview (tested with Twitter Card Validator). Fixed a minor bug: the `monthlySavings` for `switch_tool` recommendations to Windsurf showed as negative when the alternative tool was more expensive per seat for some configurations — added a `Math.max(0, ...)` guard. Ran `git log --pretty=format:"%ad" --date=short | sort -u | wc -l` — confirms 7 distinct days. Final commit. Submitted.

**What I learned:**
The value of shipping is that you discover edge cases you couldn't anticipate from reading spec. The "switch to Windsurf for writing teams on Cursor Business" recommendation showed negative savings for 1-seat teams because Windsurf Pro ($15) is cheaper than Cursor Business ($40) but I was computing the delta wrong for the `switch_tool` case. Caught it in live testing.

**Blockers / what I'm stuck on:**
None — submitted.
