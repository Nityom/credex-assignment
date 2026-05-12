# PROMPTS.md

## AI Summary Prompt

Used in `/app/api/summary/route.ts` to generate the personalised ~100-word paragraph shown at the top of every audit result.

### Full prompt (as sent to Claude 3 Haiku)

```
You are writing a concise AI spend audit summary paragraph for a startup team. 
Write exactly 80–110 words. Be specific, direct, and honest. Do not use hype words like "revolutionary" or "game-changing". 
Focus on the numbers and the specific recommendations. Write in second person ("your team", "you're").
Do not include a headline — just the paragraph.

TEAM CONTEXT:
- Team size: {teamSize}
- Primary use case: {useCase}
- Monthly AI spend: ${totalCurrentSpend}
- Potential monthly savings: ${totalMonthlySavings}

TOOLS IN USE:
{toolList}

TOP RECOMMENDATIONS:
{recList}

Write the summary paragraph now:
```

### Why this prompt design

**Word count constraint (80–110 words):** The paragraph is displayed inline on the results page alongside structured data. Too short and it feels robotic; too long and it competes with the numbers. 80–110 words forces concision without sacrificing specificity.

**"Be specific, direct, and honest":** Early drafts without this constraint produced generic filler ("AI tools are essential for modern teams..."). Adding this instruction eliminated almost all hallucinated qualitative claims.

**No hype words instruction:** The first version of the prompt returned phrases like "revolutionise your workflow" — actively harmful for a finance-grade audit tool. Explicit prohibition removed this.

**Second person ("your team", "you're"):** Tested first-person ("the team") and third-person ("this startup"). Second-person tested better in informal user feedback — it feels like advice, not a report.

**"Do not include a headline":** Without this, Claude consistently added a bolded headline before the paragraph, which broke the UI layout.

**Variable injection:** `teamSize`, `useCase`, `totalCurrentSpend`, `totalMonthlySavings`, `toolList`, and `recList` are injected at runtime. The `recList` is filtered to only include tools with `monthlySavings > 0` to avoid including optimal-status tools in the recommendation summary.

### What didn't work

1. **Asking for markdown formatting:** The output included bullet points and bold text that rendered as raw syntax in the UI. Switched to prose-only.

2. **Longer prompts with examples:** A few-shot prompt with two example outputs produced copy that sounded like the examples rather than the actual user's data. Removed examples entirely.

3. **GPT-4o for this task:** More expensive ($10/MTok output vs $1.25 for Haiku), slower, and produced no measurable quality improvement for a 100-word paragraph. Haiku is the right model for this volume and use case.

4. **Streaming responses:** Tried streaming the summary to the client. Added significant complexity for a 100-word response that renders in <1 second anyway. Removed.

### Fallback behaviour

If the Anthropic API is unavailable, returns 4xx, or times out after 8 seconds, the API route returns a deterministic template-based summary instead. The fallback is computed from the same audit data, so it's always accurate — just less personalised. Users never see an error state.

The fallback template is in `app/api/summary/route.ts` → `templateFallback()`.
