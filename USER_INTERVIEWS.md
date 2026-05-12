# USER_INTERVIEWS.md

## Interview 1

**Name:** AK (preferred initials)
**Role:** Co-founder & CTO
**Company stage:** Seed, 8 people, 5 engineers
**Date:** 2025-05-15, ~15 minutes, via Twitter DM → Google Meet

**Context:** Found AK through a tweet where he complained about his monthly Cursor bill. DM'd him, he agreed to a quick call.

**Notes:**

> "I honestly couldn't tell you off the top of my head what we pay for AI tools. It's spread across three or four cards."

> "We have Cursor for the engineers, and I have Claude Pro personally, and we're using the OpenAI API for our product. That's at least three different line items on three different billing dashboards."

> "The thing that would actually help me is if I could see it in one place — not even savings specifically, just the full picture."

> "I'd want to know: what does a startup my size typically spend? Am I high or low?"

**Most surprising thing:** AK had no idea his company had both Cursor Business ($40/seat × 5 = $200/mo) and GitHub Copilot Business ($19/seat × 5 = $95/mo) running simultaneously. He set up Copilot a year ago and "forgot about it." The engineers were using Cursor exclusively. That's $95/month in pure waste.

**What it changed:** This confirmed that the most valuable output of the tool isn't the plan recommendation — it's the complete picture. The form forces users to enumerate every tool they're paying for. The enumeration itself is the audit. I added a prominent "You're paying for X tools" summary to the results page and made the share URL more prominent so this kind of discovery gets shared internally.

---

## Interview 2

**Name:** Priya S.
**Role:** Engineering Manager
**Company stage:** Series A, 35 people, 12 engineers
**Date:** 2025-05-15, ~12 minutes, via LinkedIn → Zoom

**Context:** Priya had posted in a private Slack community about managing AI tool budgets. Messaged her directly.

**Notes:**

> "I have to justify the AI budget every quarter to our CFO. She doesn't understand why we need Cursor and GitHub Copilot — she sees two coding tools on the card."

> "The savings number alone won't close the internal conversation. I need the *reasoning* to be in the document I send to finance."

> "If I could forward a URL that says 'here's why we're on the right plan' or 'here's exactly why we should switch,' that's more useful than a PDF."

> "Honestly? I'd use this even just to prove we're spending correctly. That has value."

**Most surprising thing:** The insight that "optimal" audits are valuable too. Priya wanted to be able to show her CFO that the current spend is *defensible*, not just to find savings. I initially wasn't planning to make the "you're spending well" result feel as polished as the savings result — after this, I rebuilt that screen to be equally intentional.

**What it changed:** Added the "You're spending well" result tier with an explicit "share this with your CFO" message. Changed the lead capture CTA for optimal audits from "get notified" to "get a PDF of your optimised spend for internal reporting." Also strengthened the audit reasoning text — each recommendation now includes one specific, citable sentence rather than a vague suggestion.

---

## Interview 3

**Name:** Marcus T.
**Role:** Founder (solo, part-time team)
**Company stage:** Pre-seed, 2 people
**Date:** 2025-05-16, ~10 minutes, via DM in a Discord server for indie hackers

**Context:** Marcus posted in a Discord channel asking which AI coding tool was "worth it." DM'd him after seeing he was using both Cursor and Windsurf.

**Notes:**

> "I'm paying for both Cursor and Windsurf because I couldn't decide which I liked better. I never actually compared them properly."

> "Twenty bucks a month isn't a lot, but I'm doing it for like six different AI tools and it adds up."

> "I don't need a report — I just want to know: which one should I cancel?"

> "The hardest part is I'm paying for stuff I forgot I signed up for. I don't know how to find all of them."

**Most surprising thing:** Marcus said the most useful thing the tool could do is help him *find* subscriptions he's forgotten about — not analyse the ones he knows about. He had signed up for trials of three tools and never cancelled. This is a "subscription discovery" problem, not just a "plan optimisation" problem. I can't solve the discovery problem without access to billing dashboards, but it changed how I write the landing page copy: "Start by listing every AI tool you pay for" is now a more explicit step, with helper text listing all supported tools so users jog their memory.

**What it changed:** Added a "Don't forget these" prompt in the form UI listing all supported tools as potential memory-joggers. Also changed the "Add another tool" button styling to be more prominent — Marcus said he would have added more tools if the button was clearer.
