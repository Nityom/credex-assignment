/**
 * Audit Engine — deterministic rule-based logic.
 * Deliberately NOT using AI here. Rules are transparent, auditable, and
 * defensible to a finance-literate reviewer. AI is used only for the
 * personalized summary paragraph (see /api/summary).
 */

import {
  SpendFormData,
  ToolEntry,
  AuditResult,
  ToolRecommendation,
  RecommendationType,
  UseCase,
  ToolId,
  AnyPlan,
} from "./types";
import { effectiveMonthlyCost } from "./pricing-data";

// ─── Individual tool rules ────────────────────────────────────────────────────

function auditCursor(entry: ToolEntry, useCase: UseCase, teamSize: number): Partial<ToolRecommendation> {
  const { plan, seats, monthlySpend } = entry;
  const currentCost = effectiveMonthlyCost("cursor", plan, seats, monthlySpend);

  // Non-coding use cases don't leverage Cursor's core code-completion value — check this first
  // because switching tool is a bigger saving than a plan downgrade.
  if (plan === "business" && useCase !== "coding") {
    const savings = (40 - 15) * seats;
    return {
      recommendedAction: "switch_tool",
      recommendedTool: "windsurf",
      recommendedPlan: "pro",
      monthlySavings: savings,
      reason: `Cursor is optimised for code. For ${useCase} work, Windsurf Pro at $15/seat has comparable AI features at 62% lower cost ($${savings}/month saved).`,
      credexApplicable: false,
    };
  }

  if (plan === "business" && seats < 5) {
    // Business ($40/seat) vs Pro ($20/seat): Business adds SSO/audit logs.
    // For coding teams under 5, those features rarely justify 2× the cost.
    const savings = (40 - 20) * seats;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "pro",
      monthlySavings: savings,
      reason: `Business plan adds SSO and audit logs — features coding teams under 5 rarely need. Pro at $20/seat covers AI completions identically and saves $${savings}/month.`,
      credexApplicable: false,
    };
  }

  if (plan === "pro" && useCase === "writing" && seats <= 3) {
    // For pure-writing teams Cursor is overkill; Claude Pro is the right fit.
    const savings = (20 - 20) * seats; // same price but better fit
    return {
      recommendedAction: "switch_tool",
      recommendedTool: "claude",
      recommendedPlan: "pro",
      monthlySavings: 0,
      reason: `Cursor Pro is built for code editing; for writing-focused teams, Claude Pro ($20/seat) provides superior long-form and document intelligence at the same price.`,
      credexApplicable: false,
    };
  }

  return {
    recommendedAction: "optimal",
    monthlySavings: 0,
    reason: `You're on the right Cursor plan for your team size and use case.`,
    credexApplicable: currentCost > 200,
  };
}

function auditCopilot(entry: ToolEntry, useCase: UseCase, allTools: ToolEntry[]): Partial<ToolRecommendation> {
  const { plan, seats, monthlySpend } = entry;
  const currentCost = effectiveMonthlyCost("github_copilot", plan, seats, monthlySpend);

  // Check for overlap with Cursor
  const hasCursor = allTools.some((t) => t.toolId === "cursor" && t.plan !== "hobby");
  if (hasCursor && (plan === "business" || plan === "individual")) {
    const savings = currentCost;
    return {
      recommendedAction: "consolidate",
      monthlySavings: savings,
      reason: `You're already paying for Cursor, which includes GitHub Copilot-equivalent AI completions. Running both simultaneously is redundant; consolidating saves $${savings}/month.`,
      credexApplicable: false,
    };
  }

  if (plan === "business" && seats === 1) {
    const savings = (19 - 10) * 1;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "individual",
      monthlySavings: savings,
      reason: `Business plan adds org-level policy controls and audit logs, which are meaningless for a single seat. Individual at $10/month saves $${savings}/month with identical completion quality.`,
      credexApplicable: false,
    };
  }

  if (plan === "enterprise" && seats < 10) {
    const savings = (39 - 19) * seats;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "business",
      monthlySavings: savings,
      reason: `Enterprise adds SAML SSO, IP allow-listing, and audit logs — features that matter at 50+ seats. Business at $19/seat is identical for teams under 10 and saves $${savings}/month.`,
      credexApplicable: false,
    };
  }

  return {
    recommendedAction: "optimal",
    monthlySavings: 0,
    reason: `GitHub Copilot plan and seat count look well-matched to your team.`,
    credexApplicable: currentCost > 150,
  };
}

function auditClaude(entry: ToolEntry, useCase: UseCase, allTools: ToolEntry[]): Partial<ToolRecommendation> {
  const { plan, seats, monthlySpend } = entry;
  const currentCost = effectiveMonthlyCost("claude", plan, seats, monthlySpend);

  if (plan === "max_5x") {
    // Max-5x at $100/seat is only justified for extremely heavy users who
    // routinely exhaust Pro limits. For most teams, Pro at $20/seat suffices.
    const savings = (100 - 20) * seats;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "pro",
      monthlySavings: savings,
      reason: `Claude Max (5×) is $100/seat vs Pro at $20/seat — a 5× price jump for 5× the usage limit. Unless your team consistently hits Pro limits daily, downgrading saves $${savings}/month.`,
      credexApplicable: true,
    };
  }

  if (plan === "max_20x") {
    // At $200/seat this is expensive; if they also have API, consolidate.
    const hasApi = allTools.some((t) => t.toolId === "anthropic_api");
    if (hasApi) {
      return {
        recommendedAction: "consolidate",
        monthlySavings: currentCost,
        reason: `Claude Max-20× subscription ($200/seat) and Anthropic API direct overlap significantly. Consolidating to API-only (or Max for light API use) eliminates duplicate spend.`,
        credexApplicable: true,
      };
    }
    const savings = (200 - 100) * seats;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "max_5x",
      monthlySavings: savings,
      reason: `Max-20× at $200/seat is designed for teams replacing multiple API calls with a subscription. If you're not exhausing 20× limits, Max-5× at $100/seat saves $${savings}/month.`,
      credexApplicable: true,
    };
  }

  if (plan === "team" && seats < 5) {
    // Team requires a minimum of 5 seats ($150/month min).
    // Individual Pro at $20/seat for <5 users is always cheaper.
    const teamCost = 30 * Math.max(seats, 5); // min 5 seats enforced by Anthropic
    const proCost = 20 * seats;
    const savings = teamCost - proCost;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "pro",
      monthlySavings: savings,
      reason: `Claude Team has a 5-seat minimum ($150/month floor). With ${seats} users, ${seats} × Pro at $20/seat = $${proCost}/month — saving $${savings}/month for identical AI capability.`,
      credexApplicable: false,
    };
  }

  // Check redundancy with ChatGPT Plus for single-use-case teams
  const hasChatGPT = allTools.some((t) => t.toolId === "chatgpt" && (t.plan === "plus" || t.plan === "team"));
  if (hasChatGPT && plan === "pro" && (useCase === "writing" || useCase === "research")) {
    return {
      recommendedAction: "consolidate",
      monthlySavings: currentCost,
      reason: `You're paying for both Claude Pro and ChatGPT Plus for ${useCase} tasks. Both are capable LLM assistants; for most ${useCase} workflows, one subscription at $20/seat eliminates $${currentCost}/month in overlap.`,
      credexApplicable: false,
    };
  }

  return {
    recommendedAction: "optimal",
    monthlySavings: 0,
    reason: `Claude plan and seat count look appropriately matched to your team size.`,
    credexApplicable: currentCost > 200,
  };
}

function auditChatGPT(entry: ToolEntry, useCase: UseCase, allTools: ToolEntry[]): Partial<ToolRecommendation> {
  const { plan, seats, monthlySpend } = entry;
  const currentCost = effectiveMonthlyCost("chatgpt", plan, seats, monthlySpend);

  if (plan === "team" && seats === 1) {
    const savings = 30 - 20;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "plus",
      monthlySavings: savings,
      reason: `ChatGPT Team adds shared workspaces and admin controls — useful for groups, not for a single user. Plus at $20/month saves $${savings}/month with identical model access.`,
      credexApplicable: false,
    };
  }

  if (plan === "team" && seats === 2) {
    const savings = (30 - 20) * 2;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "plus",
      monthlySavings: savings,
      reason: `ChatGPT Team's collaboration features (shared custom GPTs, usage analytics) don't justify the $10/seat premium at just 2 users. Two Plus subscriptions save $${savings}/month.`,
      credexApplicable: false,
    };
  }

  // Check for redundancy: coding teams with Cursor or Copilot don't need ChatGPT Plus
  const hasCodingTool = allTools.some(
    (t) => (t.toolId === "cursor" && t.plan !== "hobby") || (t.toolId === "github_copilot")
  );
  if (hasCodingTool && useCase === "coding" && (plan === "plus" || plan === "team")) {
    return {
      recommendedAction: "consolidate",
      monthlySavings: currentCost,
      reason: `For coding-focused teams, Cursor or GitHub Copilot already provide inline AI assistance and chat. ChatGPT Plus ($${currentCost}/month) is largely redundant for pure coding workflows.`,
      credexApplicable: false,
    };
  }

  if (plan === "api_direct") {
    if (monthlySpend < 20) {
      return {
        recommendedAction: "downgrade_plan",
        recommendedPlan: "plus",
        monthlySavings: 0,
        reason: `At <$20/month on OpenAI API, a ChatGPT Plus subscription ($20/month) gives you GPT-4o access with no metered risk and similar effective capacity for conversational tasks.`,
        credexApplicable: false,
      };
    }
    if (monthlySpend > 200) {
      return {
        recommendedAction: "use_credits",
        monthlySavings: monthlySpend * 0.3,
        reason: `At $${monthlySpend}/month on OpenAI API, bulk credits through Credex typically deliver 20–35% savings over retail pay-as-you-go rates.`,
        credexApplicable: true,
      };
    }
  }

  return {
    recommendedAction: "optimal",
    monthlySavings: 0,
    reason: `ChatGPT plan looks right for your team size and use case.`,
    credexApplicable: currentCost > 150,
  };
}

function auditAnthropicApi(entry: ToolEntry, allTools: ToolEntry[]): Partial<ToolRecommendation> {
  const { monthlySpend } = entry;

  // If spending less than $20/month, Claude Pro subscription is better value
  if (monthlySpend < 20) {
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "pro",
      monthlySavings: 0,
      reason: `At <$20/month on Anthropic API, a Claude Pro subscription ($20/month flat) gives predictable billing with ~5× more usage per dollar than pay-as-you-go at this volume.`,
      credexApplicable: false,
    };
  }

  if (monthlySpend > 200) {
    const savings = monthlySpend * 0.28; // ~28% typical Credex discount
    return {
      recommendedAction: "use_credits",
      monthlySavings: Math.round(savings),
      reason: `At $${monthlySpend}/month on Anthropic API, pre-purchased credits through Credex typically yield 20–35% off retail token pricing — saving ~$${Math.round(savings)}/month.`,
      credexApplicable: true,
    };
  }

  return {
    recommendedAction: "optimal",
    monthlySavings: 0,
    reason: `Anthropic API spend is in the moderate range; retail pricing is reasonable at this volume.`,
    credexApplicable: monthlySpend > 100,
  };
}

function auditOpenAIApi(entry: ToolEntry, allTools: ToolEntry[]): Partial<ToolRecommendation> {
  const { monthlySpend } = entry;

  if (monthlySpend < 20) {
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "plus",
      monthlySavings: 0,
      reason: `At <$20/month on OpenAI API, a ChatGPT Plus subscription ($20/month) offers GPT-4o access with predictable cost and no per-token billing overhead.`,
      credexApplicable: false,
    };
  }

  if (monthlySpend > 200) {
    const savings = monthlySpend * 0.28;
    return {
      recommendedAction: "use_credits",
      monthlySavings: Math.round(savings),
      reason: `At $${monthlySpend}/month on OpenAI API, pre-purchased credits through Credex typically deliver 20–35% savings — roughly $${Math.round(savings)}/month at your current volume.`,
      credexApplicable: true,
    };
  }

  return {
    recommendedAction: "optimal",
    monthlySavings: 0,
    reason: `OpenAI API spend is in the moderate range; pay-as-you-go is appropriate at this volume.`,
    credexApplicable: monthlySpend > 100,
  };
}

function auditGemini(entry: ToolEntry, useCase: UseCase, allTools: ToolEntry[]): Partial<ToolRecommendation> {
  const { plan, seats, monthlySpend } = entry;
  const currentCost = effectiveMonthlyCost("gemini", plan, seats, monthlySpend);

  if (plan === "ai_premium" && useCase === "coding") {
    // For coding, Gemini Advanced is weaker than Cursor/Windsurf
    const savings = 19.99 * seats;
    return {
      recommendedAction: "switch_tool",
      recommendedTool: "windsurf",
      recommendedPlan: "pro",
      monthlySavings: Math.round((savings - 15 * seats) * 100) / 100,
      reason: `For coding workflows, Gemini Advanced ($19.99/seat) underperforms dedicated coding assistants. Windsurf Pro ($15/seat) offers superior code completion with IDE integration, saving $${((savings - 15 * seats)).toFixed(2)}/month.`,
      credexApplicable: false,
    };
  }

  const hasClaude = allTools.some((t) => t.toolId === "claude" && t.plan !== "free");
  if (hasClaude && plan === "ai_premium") {
    return {
      recommendedAction: "consolidate",
      monthlySavings: currentCost,
      reason: `Both Claude Pro and Gemini Advanced serve similar long-form AI tasks. For ${useCase} work, Claude consistently ranks higher on writing quality benchmarks; eliminating Gemini Advanced saves $${currentCost.toFixed(2)}/month.`,
      credexApplicable: false,
    };
  }

  return {
    recommendedAction: "optimal",
    monthlySavings: 0,
    reason: `Gemini plan looks appropriate for your current usage and team size.`,
    credexApplicable: false,
  };
}

function auditWindsurf(entry: ToolEntry, useCase: UseCase, allTools: ToolEntry[]): Partial<ToolRecommendation> {
  const { plan, seats, monthlySpend } = entry;
  const currentCost = effectiveMonthlyCost("windsurf", plan, seats, monthlySpend);

  const hasCursor = allTools.some((t) => t.toolId === "cursor" && t.plan !== "hobby");
  if (hasCursor && (plan === "pro" || plan === "teams")) {
    return {
      recommendedAction: "consolidate",
      monthlySavings: currentCost,
      reason: `You're paying for both Cursor and Windsurf — both are AI-first coding editors that serve the same role. Consolidating to one saves $${currentCost}/month with zero capability loss.`,
      credexApplicable: false,
    };
  }

  if (plan === "teams" && seats < 5) {
    const savings = (35 - 15) * seats;
    return {
      recommendedAction: "downgrade_plan",
      recommendedPlan: "pro",
      monthlySavings: savings,
      reason: `Windsurf Teams adds team analytics and priority support, which rarely matters under 5 seats. Pro at $15/seat is functionally identical for small teams and saves $${savings}/month.`,
      credexApplicable: false,
    };
  }

  return {
    recommendedAction: "optimal",
    monthlySavings: 0,
    reason: `Windsurf plan and seat count are well-matched to your team.`,
    credexApplicable: false,
  };
}

// ─── Main audit function ───────────────────────────────────────────────────────

export function runAudit(formData: SpendFormData): AuditResult {
  const { tools, teamSize, useCase } = formData;
  const recommendations: ToolRecommendation[] = [];

  for (const entry of tools) {
    const currentCost = effectiveMonthlyCost(entry.toolId, entry.plan, entry.seats, entry.monthlySpend);

    let partial: Partial<ToolRecommendation> = {
      recommendedAction: "optimal",
      monthlySavings: 0,
      reason: "Spending looks appropriate.",
      credexApplicable: false,
    };

    switch (entry.toolId) {
      case "cursor":
        partial = auditCursor(entry, useCase, teamSize);
        break;
      case "github_copilot":
        partial = auditCopilot(entry, useCase, tools);
        break;
      case "claude":
        partial = auditClaude(entry, useCase, tools);
        break;
      case "chatgpt":
        partial = auditChatGPT(entry, useCase, tools);
        break;
      case "anthropic_api":
        partial = auditAnthropicApi(entry, tools);
        break;
      case "openai_api":
        partial = auditOpenAIApi(entry, tools);
        break;
      case "gemini":
        partial = auditGemini(entry, useCase, tools);
        break;
      case "windsurf":
        partial = auditWindsurf(entry, useCase, tools);
        break;
    }

    const monthlySavings = partial.monthlySavings ?? 0;

    recommendations.push({
      toolId: entry.toolId,
      currentPlan: entry.plan,
      currentMonthlyCost: currentCost,
      recommendedAction: partial.recommendedAction ?? "optimal",
      recommendedPlan: partial.recommendedPlan,
      recommendedTool: partial.recommendedTool,
      monthlySavings,
      annualSavings: monthlySavings * 12,
      reason: partial.reason ?? "Spending looks appropriate.",
      credexApplicable: partial.credexApplicable ?? false,
    });
  }

  const totalMonthlySavings = recommendations.reduce((sum, r) => sum + r.monthlySavings, 0);
  const totalAnnualSavings = totalMonthlySavings * 12;
  const totalCurrentSpend = recommendations.reduce((sum, r) => sum + r.currentMonthlyCost, 0);

  let savingsTier: AuditResult["savingsTier"];
  if (totalMonthlySavings >= 500) savingsTier = "high";
  else if (totalMonthlySavings >= 100) savingsTier = "medium";
  else if (totalMonthlySavings > 0) savingsTier = "low";
  else savingsTier = "optimal";

  return {
    recommendations,
    totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
    totalAnnualSavings: Math.round(totalAnnualSavings * 100) / 100,
    totalCurrentSpend: Math.round(totalCurrentSpend * 100) / 100,
    savingsTier,
  };
}
