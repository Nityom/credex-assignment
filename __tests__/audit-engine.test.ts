import { describe, it, expect } from "vitest";
import { runAudit } from "../lib/audit-engine";
import type { SpendFormData } from "../lib/types";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeForm(overrides: Partial<SpendFormData> = {}): SpendFormData {
  return {
    tools: [],
    teamSize: 3,
    useCase: "coding",
    ...overrides,
  };
}

// ─── Cursor audit rules ───────────────────────────────────────────────────────

describe("Cursor audit", () => {
  it("recommends downgrading Business→Pro for teams under 5", () => {
    const form = makeForm({
      tools: [{ toolId: "cursor", plan: "business", monthlySpend: 120, seats: 3 }],
    });
    const result = runAudit(form);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("pro");
    expect(rec.monthlySavings).toBe(60); // (40-20)*3
  });

  it("does not flag Cursor Pro for a solo coder", () => {
    const form = makeForm({
      tools: [{ toolId: "cursor", plan: "pro", monthlySpend: 20, seats: 1 }],
    });
    const result = runAudit(form);
    expect(result.recommendations[0].recommendedAction).toBe("optimal");
  });

  it("suggests switching Cursor Business to Windsurf for non-coding teams", () => {
    const form = makeForm({
      useCase: "writing",
      tools: [{ toolId: "cursor", plan: "business", monthlySpend: 80, seats: 2 }],
    });
    const result = runAudit(form);
    expect(result.recommendations[0].recommendedAction).toBe("switch_tool");
    expect(result.recommendations[0].recommendedTool).toBe("windsurf");
  });
});

// ─── GitHub Copilot audit rules ───────────────────────────────────────────────

describe("GitHub Copilot audit", () => {
  it("flags Business plan for a single user → recommend Individual", () => {
    const form = makeForm({
      tools: [{ toolId: "github_copilot", plan: "business", monthlySpend: 19, seats: 1 }],
    });
    const result = runAudit(form);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("individual");
    expect(rec.monthlySavings).toBe(9);
  });

  it("flags Enterprise plan for teams under 10 → recommend Business", () => {
    const form = makeForm({
      tools: [{ toolId: "github_copilot", plan: "enterprise", monthlySpend: 195, seats: 5 }],
    });
    const result = runAudit(form);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("business");
    expect(rec.monthlySavings).toBe(100); // (39-19)*5
  });

  it("flags Copilot as redundant when Cursor Pro is also in the stack", () => {
    const form = makeForm({
      tools: [
        { toolId: "cursor", plan: "pro", monthlySpend: 20, seats: 1 },
        { toolId: "github_copilot", plan: "individual", monthlySpend: 10, seats: 1 },
      ],
    });
    const result = runAudit(form);
    const copilotRec = result.recommendations.find((r) => r.toolId === "github_copilot");
    expect(copilotRec?.recommendedAction).toBe("consolidate");
    expect(copilotRec?.monthlySavings).toBe(10);
  });
});

// ─── Claude audit rules ───────────────────────────────────────────────────────

describe("Claude audit", () => {
  it("flags Claude Max-5x → recommend Pro for non-extreme users", () => {
    const form = makeForm({
      tools: [{ toolId: "claude", plan: "max_5x", monthlySpend: 200, seats: 2 }],
    });
    const result = runAudit(form);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("pro");
    expect(rec.monthlySavings).toBe(160); // (100-20)*2
  });

  it("flags Claude Team with <5 seats as cheaper via individual Pro", () => {
    const form = makeForm({
      tools: [{ toolId: "claude", plan: "team", monthlySpend: 150, seats: 3 }],
    });
    const result = runAudit(form);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("pro");
    // Team min is 5 seats at $30 = $150; Pro for 3 = $60; savings = $90
    expect(rec.monthlySavings).toBe(90);
  });

  it("flags Claude Pro as redundant alongside ChatGPT Plus for writing use case", () => {
    const form = makeForm({
      useCase: "writing",
      tools: [
        { toolId: "claude", plan: "pro", monthlySpend: 20, seats: 1 },
        { toolId: "chatgpt", plan: "plus", monthlySpend: 20, seats: 1 },
      ],
    });
    const result = runAudit(form);
    const claudeRec = result.recommendations.find((r) => r.toolId === "claude");
    expect(claudeRec?.recommendedAction).toBe("consolidate");
  });
});

// ─── Anthropic API audit rules ────────────────────────────────────────────────

describe("Anthropic API audit", () => {
  it("recommends switching to Claude Pro subscription when spend < $20/mo", () => {
    const form = makeForm({
      tools: [{ toolId: "anthropic_api", plan: "api_direct", monthlySpend: 12, seats: 1 }],
    });
    const result = runAudit(form);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("pro");
  });

  it("recommends Credex credits for Anthropic API spend > $200/mo", () => {
    const form = makeForm({
      tools: [{ toolId: "anthropic_api", plan: "api_direct", monthlySpend: 500, seats: 1 }],
    });
    const result = runAudit(form);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toBe("use_credits");
    expect(rec.credexApplicable).toBe(true);
    expect(rec.monthlySavings).toBeGreaterThan(0);
  });
});

// ─── Total savings calculation ─────────────────────────────────────────────────

describe("Total savings aggregation", () => {
  it("sums monthly savings correctly across multiple tools", () => {
    // Cursor Business (3 seats) → Pro: saves (40-20)*3 = $60/mo
    // Copilot Business (1 seat) → consolidate (Cursor already in stack): saves full $19/mo
    // Total: $79/mo
    const form = makeForm({
      tools: [
        { toolId: "cursor", plan: "business", monthlySpend: 120, seats: 3 },
        { toolId: "github_copilot", plan: "business", monthlySpend: 19, seats: 1 },
      ],
    });
    const result = runAudit(form);
    expect(result.totalMonthlySavings).toBe(79);
    expect(result.totalAnnualSavings).toBe(948);
  });

  it("assigns 'high' savings tier for $500+/mo savings", () => {
    const form = makeForm({
      tools: [{ toolId: "claude", plan: "max_5x", monthlySpend: 1000, seats: 10 }],
    });
    const result = runAudit(form);
    expect(result.savingsTier).toBe("high");
  });

  it("assigns 'optimal' tier when no savings found", () => {
    const form = makeForm({
      tools: [{ toolId: "cursor", plan: "pro", monthlySpend: 20, seats: 1 }],
    });
    const result = runAudit(form);
    expect(result.savingsTier).toBe("optimal");
    expect(result.totalMonthlySavings).toBe(0);
  });
});

// ─── Windsurf audit rules ─────────────────────────────────────────────────────

describe("Windsurf audit", () => {
  it("flags Windsurf as redundant when Cursor Pro is active", () => {
    const form = makeForm({
      tools: [
        { toolId: "cursor", plan: "pro", monthlySpend: 40, seats: 2 },
        { toolId: "windsurf", plan: "pro", monthlySpend: 30, seats: 2 },
      ],
    });
    const result = runAudit(form);
    const wsRec = result.recommendations.find((r) => r.toolId === "windsurf");
    expect(wsRec?.recommendedAction).toBe("consolidate");
    expect(wsRec?.monthlySavings).toBe(30);
  });

  it("flags Windsurf Teams < 5 seats → recommend Pro", () => {
    const form = makeForm({
      tools: [{ toolId: "windsurf", plan: "teams", monthlySpend: 70, seats: 2 }],
    });
    const result = runAudit(form);
    expect(result.recommendations[0].recommendedAction).toBe("downgrade_plan");
    expect(result.recommendations[0].recommendedPlan).toBe("pro");
    expect(result.recommendations[0].monthlySavings).toBe(40); // (35-15)*2
  });
});
