# METRICS.md

## North Star Metric

**Qualifying audits completed** — defined as: an audit where the user inputs ≥2 tools AND total declared monthly spend ≥$50.

**Why this metric:**

SpendWise AI is a lead-generation tool for Credex, not a consumer app. Its value is not in total traffic or sessions — it's in surfacing genuine, qualified overspend situations that Credex can act on.

A "qualifying audit" filters out:
- People who enter toy data to test the tool
- Single-tool, low-spend users (no real savings opportunity → no Credex lead opportunity)
- Bots / rate-limited abuse

The number of qualifying audits per week is the single best predictor of downstream consultation bookings and credit purchases.

---

## 3 Input Metrics That Drive the North Star

### 1. Form completion rate
**Definition:** % of visitors who reach the form and submit it (not just land on the page)
**Why it matters:** Friction in the form kills the North Star. If users abandon mid-form, the audit never runs. Benchmark: similar lead-gen tools convert 30–40% of form-openers. Anything below 20% means the form is too long or too confusing.
**How to improve:** A/B test step count, auto-fill where possible, add progress indicator.

### 2. Sharing rate (viral coefficient)
**Definition:** Audits that result in a share URL being copied or a social post, divided by total qualifying audits
**Why it matters:** Organic virality is the only zero-CAC growth lever at scale. Every shared audit is a guaranteed-warm inbound visit from someone in the same network as a person who just identified AI overspend.
**How to improve:** Make the savings number prominent and share-worthy. "Save $340/month" as a headline on the shared URL preview card, not "AI Audit Results."

### 3. High-savings rate
**Definition:** % of qualifying audits where total monthly savings ≥ $500
**Why it matters:** Only high-savings audits trigger the Credex CTA. If 95% of audits show <$100 in savings, the funnel to consultation is too thin. This metric tells us whether we're attracting the right users (larger teams, higher spenders) or the wrong ones (solo freelancers, minimal AI budgets).
**How to improve:** GTM channels matter. DM-ing a 2-person team will produce low-savings audits. Targeting EM's at 15+ person companies will produce high-savings audits.

---

## What to Instrument First

1. **Audit submission events:** `audit_completed` with properties: `num_tools`, `total_monthly_spend`, `total_savings`, `use_case`, `team_size`, `savings_tier`
2. **Share button clicks:** `share_url_copied` per audit, with `savings_tier` and `audit_id`
3. **Lead capture conversions:** `lead_captured` with `savings_tier`, `has_company`, `has_role`
4. **Consultation CTA clicks:** `credex_cta_clicked` with `savings_tier` and `monthly_savings`

Use Plausible (privacy-friendly, no cookie banner) or Posthog for the event tracking. No Google Analytics — startup CTOs tend to have ad blockers and GA is blocked by 30–40% of the target audience.

---

## What Number Triggers a Pivot Decision

**Pivot trigger: High-savings rate drops below 8% for 3 consecutive weeks.**

If fewer than 8% of qualifying audits surface ≥$500/mo in savings, the Credex lead quality is too thin to make the tool economically worthwhile. At that point, either:
1. The GTM channels are attracting the wrong users (solution: change distribution strategy)
2. The audit engine is under-identifying savings (solution: review pricing data, add more cross-tool rules)
3. The target user genuinely doesn't exist at scale (solution: pivot to benchmark mode, which has broader appeal even for well-optimised teams)

A secondary trigger: **if form completion rate drops below 15%**, the form UX needs a major redesign before any GTM investment makes sense.
