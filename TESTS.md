# TESTS.md

## Test suite: Audit Engine

All tests are in `__tests__/audit-engine.test.ts` and cover the core audit logic in `lib/audit-engine.ts`.

### How to run

```bash
npm test
# or for watch mode:
npm run test:watch
```

### Test list

| File | Test name | What it covers |
|---|---|---|
| `__tests__/audit-engine.test.ts` | Cursor audit: recommends downgrading Business→Pro for teams under 5 | Cursor Business plan with <5 seats should recommend Pro, with correct $savings |
| `__tests__/audit-engine.test.ts` | Cursor audit: does not flag Cursor Pro for a solo coder | Cursor Pro for 1 coding-use-case user should be `optimal` |
| `__tests__/audit-engine.test.ts` | Cursor audit: suggests switching Cursor Business to Windsurf for non-coding teams | Writing-focused teams on Cursor Business should get `switch_tool` → Windsurf |
| `__tests__/audit-engine.test.ts` | GitHub Copilot audit: flags Business plan for a single user → recommend Individual | Single-seat Copilot Business should downgrade to Individual, saving $9 |
| `__tests__/audit-engine.test.ts` | GitHub Copilot audit: flags Enterprise plan for teams under 10 → recommend Business | Copilot Enterprise with 5 seats should downgrade to Business, saving $100/mo |
| `__tests__/audit-engine.test.ts` | GitHub Copilot audit: flags Copilot as redundant when Cursor Pro is also in the stack | When Cursor Pro is active, Copilot should be `consolidate` (full monthly cost saved) |
| `__tests__/audit-engine.test.ts` | Claude audit: flags Claude Max-5x → recommend Pro for non-extreme users | Max-5× at $100/seat should downgrade to Pro, saving $80/seat |
| `__tests__/audit-engine.test.ts` | Claude audit: flags Claude Team with <5 seats as cheaper via individual Pro | Claude Team with 3 seats (min 5 billed) should show $90/mo savings via Pro |
| `__tests__/audit-engine.test.ts` | Claude audit: flags Claude Pro as redundant alongside ChatGPT Plus for writing | Writing teams with both Claude Pro + ChatGPT Plus get `consolidate` on Claude |
| `__tests__/audit-engine.test.ts` | Anthropic API audit: recommends switching to Claude Pro when spend < $20/mo | Low Anthropic API spend (<$20) should recommend the Pro subscription |
| `__tests__/audit-engine.test.ts` | Anthropic API audit: recommends Credex credits for spend > $200/mo | High API spend triggers `use_credits` with `credexApplicable: true` |
| `__tests__/audit-engine.test.ts` | Total savings aggregation: sums monthly savings correctly across multiple tools | Multi-tool audit totals are correct ($69/mo for two concurrent recommendations) |
| `__tests__/audit-engine.test.ts` | Total savings aggregation: assigns 'high' savings tier for $500+/mo savings | 10-seat Claude Max-5× triggers `savingsTier: "high"` |
| `__tests__/audit-engine.test.ts` | Total savings aggregation: assigns 'optimal' tier when no savings found | Single optimal tool returns `savingsTier: "optimal"` and $0 savings |
| `__tests__/audit-engine.test.ts` | Windsurf audit: flags Windsurf as redundant when Cursor Pro is active | Cursor + Windsurf overlap triggers `consolidate` on Windsurf |
| `__tests__/audit-engine.test.ts` | Windsurf audit: flags Windsurf Teams < 5 seats → recommend Pro | Windsurf Teams with 2 seats should downgrade to Pro, saving $40/mo |

### Total: 16 tests — all passing ✓

```
 ✓ __tests__/audit-engine.test.ts (16)
   ✓ Cursor audit (3)
   ✓ GitHub Copilot audit (3)
   ✓ Claude audit (3)
   ✓ Anthropic API audit (2)
   ✓ Total savings aggregation (3)
   ✓ Windsurf audit (2)
```

### What's not tested here

- React components (UI rendering) — not included because the brief asks specifically for audit engine tests
- API routes — would require mocking Supabase and Resend clients; future work
- End-to-end — the deployed URL has been manually tested against all 6 MVP feature flows
