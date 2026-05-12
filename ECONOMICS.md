# ECONOMICS.md

## What is a converted Credex lead worth?

**Setup:**
Credex sells discounted AI credits at 20–35% below retail. The margin on those credits (based on the assignment description — "sourced from companies that overforecast or pivoted") is likely 15–25% of the credit face value, since Credex is buying at below-market and selling below retail.

**Working numbers:**
- Average startup AI spend (from user interviews): ~$800/month, or ~$9,600/year
- Credex discount offered: 25% below retail
- Credex margin: ~40% of the discount amount (i.e., if retail is $800/mo and Credex sells at $600/mo, Credex sourced at ~$500, margin is ~$100/mo)
- Estimated gross margin per active customer: ~$100/month = $1,200/year

This is conservative. High-spend customers (>$2k/month in API usage) would have proportionally higher margin.

**LTV estimate:**
Assume average customer retention of 18 months (credits run out, teams re-purchase if happy).
- LTV = $1,200/year × 1.5 years = $1,800 per converted customer

---

## CAC at each GTM channel

| Channel | Effort/Cost | Expected conversions | CAC |
|---|---|---|---|
| Direct DM seeding (founder) | ~8 hours at $0 cash | 3–5 Credex consultations | $0 cash / ~$200 time-value |
| HN / Reddit posts | ~3 hours at $0 cash | 2–4 consultations per post | $0 cash / ~$50 time-value |
| Credex existing customer email | $0 (in-house list) | 5–8 consultations | $0 cash / minimal |
| Paid X promotion (future) | ~$500/week CPM | ~2 consultations/week | ~$250 |
| Influencer mention (niche tech X account) | ~$500–1,500 per mention | 5–15 consultations | $100–300 |

At launch (zero paid), blended CAC is effectively $0 in cash and ~$150 in time-value. That's extraordinary for a B2B product.

---

## Conversion funnel

```
Cold visitor → audit completed: 30% (source: similar B2B lead-gen tools)
Audit completed → email captured: 18% (incentivised with report + consultation for high-savings)
Email captured → consultation booked: 25% (high-savings filter means these are warm leads)
Consultation booked → credit purchase: 40% (product-market fit assumptions)
```

**Overall funnel:** 100 visitors → 30 audits → 5.4 emails → 1.35 consultations → 0.54 purchases

**Implication:** You need ~185 visitors per paying Credex customer.
At blended CAC of $0–$150 and LTV of $1,800, the economics work at essentially any traffic level.

---

## What conversion rates make this profitable

The tool has near-zero marginal cost to run (Vercel free tier handles 100k requests/month, Supabase free tier handles 500MB, Resend free handles 100 emails/day). The only variable cost is the Anthropic API for summaries: ~$0.002 per audit at Haiku pricing.

**Break-even scenario (tool running costs):**
- Monthly hosting cost (Supabase Pro + Vercel Pro): ~$45/month
- To cover with Credex revenue: 45/1800 = 2.5% of LTV per month → need 1 paying customer per month minimum
- At the conversion rates above, that's ~370 visitors/month

This is not a meaningful hurdle. The tool pays for itself at <400 monthly visitors.

---

## What would have to be true for $1M ARR in 18 months

**Target:** $1M ARR from Credex credit sales enabled by SpendWise AI leads.

At $1,200 gross margin/customer/year, you need ~833 active Credex customers.

**Working backwards from the funnel:**
- 833 customers / 18 months = 46 new customers/month
- At 40% consultation → purchase rate: 116 consultations/month
- At 25% email → consultation rate: 464 emails/month
- At 18% audit → email rate: 2,578 audits/month
- At 30% visitor → audit rate: 8,593 visitors/month

**Is 8,593 visitors/month achievable in 18 months?**

Month 1–3: Organic seeding, targeting 500 visitors/month
Month 4–6: HN Show HN, one viral thread, 1,500 visitors/month
Month 7–12: SEO (ranking for "AI tool spend", "Cursor vs Copilot cost") builds, 3,000–5,000 visitors/month
Month 13–18: Paid amplification of top organic content, partnerships with YC batch announcements, 6,000–10,000 visitors/month

**What has to be true:**
1. One piece of content (HN post, tweet thread, or blog) has to go semi-viral in months 4–6 to break through
2. The shareable audit URL creates a viral coefficient >0.3 (each audit generates 0.3 new users via sharing) — achievable given the share-worthy format
3. Credex's close rate stays at 40% or above — only likely if the consultation UX is tight and the lead is actually warm (savings > $500/mo confirmed)
4. Average deal size doesn't shrink — the $1,200/year estimate holds only if customers are spending at least $4,800/year on AI (i.e., $400/month retail), which our audit user profile confirms

**Rough inputs:** these are estimates based on comparable B2B SaaS lead-gen tools, not guarantees. The actual conversion rates will differ and should be measured from week 1. The North Star metric (see METRICS.md) is "audits with qualifying savings captured" not "total traffic" — because optimising for visitors who don't have meaningful AI spend is a waste of sales time.
