// ─── Tool identifiers ────────────────────────────────────────────────────────

export type ToolId =
  | "cursor"
  | "github_copilot"
  | "claude"
  | "chatgpt"
  | "anthropic_api"
  | "openai_api"
  | "gemini"
  | "windsurf";

// ─── Plan identifiers per tool ───────────────────────────────────────────────

export type CursorPlan = "hobby" | "pro" | "business" | "enterprise";
export type CopilotPlan = "individual" | "business" | "enterprise";
export type ClaudePlan = "free" | "pro" | "max_5x" | "max_20x" | "team" | "enterprise";
export type ChatGPTPlan = "free" | "plus" | "team" | "enterprise" | "api_direct";
export type AnthropicApiPlan = "api_direct";
export type OpenAIApiPlan = "api_direct";
export type GeminiPlan = "free" | "ai_premium" | "api_direct";
export type WindsurfPlan = "free" | "pro" | "teams";

export type AnyPlan =
  | CursorPlan
  | CopilotPlan
  | ClaudePlan
  | ChatGPTPlan
  | AnthropicApiPlan
  | OpenAIApiPlan
  | GeminiPlan
  | WindsurfPlan;

// ─── Use cases ───────────────────────────────────────────────────────────────

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

// ─── Form types ───────────────────────────────────────────────────────────────

export interface ToolEntry {
  toolId: ToolId;
  plan: AnyPlan;
  monthlySpend: number; // in USD
  seats: number;
}

export interface SpendFormData {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
}

// ─── Audit engine output ──────────────────────────────────────────────────────

export type RecommendationType =
  | "downgrade_plan"
  | "switch_tool"
  | "consolidate"
  | "use_credits"
  | "optimal"
  | "notify_only";

export interface ToolRecommendation {
  toolId: ToolId;
  currentPlan: AnyPlan;
  currentMonthlyCost: number;
  recommendedAction: RecommendationType;
  recommendedPlan?: AnyPlan;
  recommendedTool?: ToolId;
  monthlySavings: number;
  annualSavings: number;
  reason: string; // ≤1 sentence, defensible
  credexApplicable: boolean;
}

export interface AuditResult {
  recommendations: ToolRecommendation[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  totalCurrentSpend: number;
  savingsTier: "high" | "medium" | "low" | "optimal";
  aiSummary?: string;
}

// ─── Database / API types ─────────────────────────────────────────────────────

export interface StoredAudit {
  id: string;
  created_at: string;
  form_data: SpendFormData;
  audit_result: AuditResult;
  total_monthly_savings: number;
  total_annual_savings: number;
}

export interface LeadCapture {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  auditId: string;
  // honeypot field — must be empty
  website?: string;
}

export interface ApiAuditRequest extends SpendFormData {}

export interface ApiAuditResponse {
  auditId: string;
  result: AuditResult;
}

export interface ApiLeadRequest extends LeadCapture {}
