import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { SpendFormData, AuditResult } from "@/lib/types";
import { TOOLS } from "@/lib/pricing-data";

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function buildPrompt(formData: SpendFormData, auditResult: AuditResult): string {
  const toolList = formData.tools
    .map((t) => {
      const label = TOOLS.find((tool) => tool.id === t.toolId)?.label ?? t.toolId;
      return `- ${label} (${t.plan}, ${t.seats} seat${t.seats !== 1 ? "s" : ""}, $${t.monthlySpend}/mo)`;
    })
    .join("\n");

  const recList = auditResult.recommendations
    .filter((r) => r.monthlySavings > 0)
    .map((r) => {
      const label = TOOLS.find((t) => t.id === r.toolId)?.label ?? r.toolId;
      return `- ${label}: ${r.reason}`;
    })
    .join("\n");

  return `You are writing a concise AI spend audit summary paragraph for a startup team. 
Write exactly 80–110 words. Be specific, direct, and honest. Do not use hype words like "revolutionary" or "game-changing". 
Focus on the numbers and the specific recommendations. Write in second person ("your team", "you're").
Do not include a headline — just the paragraph.

TEAM CONTEXT:
- Team size: ${formData.teamSize}
- Primary use case: ${formData.useCase}
- Monthly AI spend: $${auditResult.totalCurrentSpend}
- Potential monthly savings: $${auditResult.totalMonthlySavings}

TOOLS IN USE:
${toolList}

TOP RECOMMENDATIONS:
${recList || "No significant savings found — spend is well-optimised."}

Write the summary paragraph now:`;
}

function templateFallback(formData: SpendFormData, auditResult: AuditResult): string {
  const { totalMonthlySavings, totalCurrentSpend, savingsTier } = auditResult;

  if (savingsTier === "optimal") {
    return `Your team's AI tool spend of $${totalCurrentSpend}/month is well-optimised for a ${formData.teamSize}-person team focused on ${formData.useCase}. You're on the right plans and seat counts across your stack — no significant overspend detected. Keep monitoring as your team grows, since plan thresholds and tool alternatives shift regularly. We'll flag new optimisation opportunities as they emerge.`;
  }

  const topRec = auditResult.recommendations.find((r) => r.monthlySavings > 0);
  const topTool = TOOLS.find((t) => t.id === topRec?.toolId)?.label ?? "your primary tool";

  return `Your team is spending $${totalCurrentSpend}/month on AI tools and could save $${totalMonthlySavings}/month ($${auditResult.totalAnnualSavings}/year) with targeted plan changes. The biggest opportunity is ${topTool}: ${topRec?.reason ?? "a plan mismatch for your team size"}. For a ${formData.teamSize}-person team doing ${formData.useCase} work, the changes recommended here are straightforward and require no vendor negotiations.`;
}

export async function POST(req: NextRequest) {
  let body: { formData: SpendFormData; auditResult: AuditResult };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { formData, auditResult } = body;

  if (!formData || !auditResult) {
    return NextResponse.json({ error: "Missing formData or auditResult" }, { status: 400 });
  }

  // If no API key configured, return template immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ summary: templateFallback(formData, auditResult) });
  }

  try {
    const message = await getAnthropicClient().messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      messages: [{ role: "user", content: buildPrompt(formData, auditResult) }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    const summary = textContent?.type === "text" ? textContent.text.trim() : null;

    if (!summary) throw new Error("Empty response from Claude");

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Anthropic API error:", err);
    // Graceful fallback — never surface API errors to the user
    return NextResponse.json({ summary: templateFallback(formData, auditResult) });
  }
}
