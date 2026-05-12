/**
 * PRICING_DATA — all prices are per-user per-month unless noted.
 * Every figure traced to an official vendor pricing page.
 * See PRICING_DATA.md for full citations.
 * Last verified: 2025-05-12
 */

import type { ToolId, AnyPlan, CursorPlan, CopilotPlan, ClaudePlan, ChatGPTPlan, GeminiPlan, WindsurfPlan } from "./types";

export interface PlanPrice {
  plan: AnyPlan;
  label: string;
  pricePerSeat: number; // 0 = usage-based / free
  usageBased: boolean;
  minSeats?: number;
}

export interface ToolMeta {
  id: ToolId;
  label: string;
  plans: PlanPrice[];
}

// ─── Cursor ────────────────────────────────────────────────────────────────────
// https://www.cursor.com/pricing — verified 2025-05-12
export const CURSOR_PLANS: PlanPrice[] = [
  { plan: "hobby" as CursorPlan, label: "Hobby (Free)", pricePerSeat: 0, usageBased: false },
  { plan: "pro" as CursorPlan, label: "Pro", pricePerSeat: 20, usageBased: false },
  { plan: "business" as CursorPlan, label: "Business", pricePerSeat: 40, usageBased: false },
  { plan: "enterprise" as CursorPlan, label: "Enterprise", pricePerSeat: 0, usageBased: false }, // custom pricing
];

// ─── GitHub Copilot ────────────────────────────────────────────────────────────
// https://github.com/features/copilot#pricing — verified 2025-05-12
export const COPILOT_PLANS: PlanPrice[] = [
  { plan: "individual" as CopilotPlan, label: "Individual", pricePerSeat: 10, usageBased: false },
  { plan: "business" as CopilotPlan, label: "Business", pricePerSeat: 19, usageBased: false },
  { plan: "enterprise" as CopilotPlan, label: "Enterprise", pricePerSeat: 39, usageBased: false },
];

// ─── Claude (Anthropic consumer plans) ────────────────────────────────────────
// https://www.anthropic.com/claude/claude-pro — verified 2025-05-12
// https://www.anthropic.com/claude-team — verified 2025-05-12
export const CLAUDE_PLANS: PlanPrice[] = [
  { plan: "free" as ClaudePlan, label: "Free", pricePerSeat: 0, usageBased: false },
  { plan: "pro" as ClaudePlan, label: "Pro", pricePerSeat: 20, usageBased: false },
  { plan: "max_5x" as ClaudePlan, label: "Max (5× usage)", pricePerSeat: 100, usageBased: false },
  { plan: "max_20x" as ClaudePlan, label: "Max (20× usage)", pricePerSeat: 200, usageBased: false },
  { plan: "team" as ClaudePlan, label: "Team", pricePerSeat: 30, usageBased: false, minSeats: 5 },
  { plan: "enterprise" as ClaudePlan, label: "Enterprise", pricePerSeat: 0, usageBased: false },
];

// ─── ChatGPT (OpenAI consumer plans) ──────────────────────────────────────────
// https://openai.com/chatgpt/pricing — verified 2025-05-12
export const CHATGPT_PLANS: PlanPrice[] = [
  { plan: "free" as ChatGPTPlan, label: "Free", pricePerSeat: 0, usageBased: false },
  { plan: "plus" as ChatGPTPlan, label: "Plus", pricePerSeat: 20, usageBased: false },
  { plan: "team" as ChatGPTPlan, label: "Team", pricePerSeat: 30, usageBased: false, minSeats: 2 },
  { plan: "enterprise" as ChatGPTPlan, label: "Enterprise", pricePerSeat: 0, usageBased: false },
  { plan: "api_direct" as ChatGPTPlan, label: "API Direct", pricePerSeat: 0, usageBased: true },
];

// ─── Anthropic API ─────────────────────────────────────────────────────────────
// https://www.anthropic.com/api — verified 2025-05-12
export const ANTHROPIC_API_PLANS: PlanPrice[] = [
  { plan: "api_direct", label: "API Direct (usage-based)", pricePerSeat: 0, usageBased: true },
];

// ─── OpenAI API ────────────────────────────────────────────────────────────────
// https://openai.com/api/pricing — verified 2025-05-12
export const OPENAI_API_PLANS: PlanPrice[] = [
  { plan: "api_direct", label: "API Direct (usage-based)", pricePerSeat: 0, usageBased: true },
];

// ─── Gemini (Google) ───────────────────────────────────────────────────────────
// https://one.google.com/about/ai-premium — verified 2025-05-12
export const GEMINI_PLANS: PlanPrice[] = [
  { plan: "free" as GeminiPlan, label: "Gemini Free", pricePerSeat: 0, usageBased: false },
  { plan: "ai_premium" as GeminiPlan, label: "Google One AI Premium (Gemini Advanced)", pricePerSeat: 19.99, usageBased: false },
  { plan: "api_direct" as GeminiPlan, label: "Gemini API (usage-based)", pricePerSeat: 0, usageBased: true },
];

// ─── Windsurf (Codeium) ────────────────────────────────────────────────────────
// https://windsurf.com/pricing — verified 2025-05-12
export const WINDSURF_PLANS: PlanPrice[] = [
  { plan: "free" as WindsurfPlan, label: "Free", pricePerSeat: 0, usageBased: false },
  { plan: "pro" as WindsurfPlan, label: "Pro", pricePerSeat: 15, usageBased: false },
  { plan: "teams" as WindsurfPlan, label: "Teams", pricePerSeat: 35, usageBased: false },
];

// ─── Master registry ───────────────────────────────────────────────────────────

export const TOOLS: ToolMeta[] = [
  { id: "cursor", label: "Cursor", plans: CURSOR_PLANS },
  { id: "github_copilot", label: "GitHub Copilot", plans: COPILOT_PLANS },
  { id: "claude", label: "Claude (Anthropic)", plans: CLAUDE_PLANS },
  { id: "chatgpt", label: "ChatGPT (OpenAI)", plans: CHATGPT_PLANS },
  { id: "anthropic_api", label: "Anthropic API", plans: ANTHROPIC_API_PLANS },
  { id: "openai_api", label: "OpenAI API", plans: OPENAI_API_PLANS },
  { id: "gemini", label: "Gemini (Google)", plans: GEMINI_PLANS },
  { id: "windsurf", label: "Windsurf", plans: WINDSURF_PLANS },
];

export function getToolMeta(id: ToolId): ToolMeta {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}

export function getPlanPrice(toolId: ToolId, plan: AnyPlan): PlanPrice | undefined {
  const tool = getToolMeta(toolId);
  return tool.plans.find((p) => p.plan === plan);
}

/** Effective monthly cost for a tool entry */
export function effectiveMonthlyCost(toolId: ToolId, plan: AnyPlan, seats: number, declaredSpend: number): number {
  const planData = getPlanPrice(toolId, plan);
  if (!planData) return declaredSpend;
  if (planData.usageBased || planData.pricePerSeat === 0) return declaredSpend;
  return planData.pricePerSeat * Math.max(seats, planData.minSeats ?? 1);
}
