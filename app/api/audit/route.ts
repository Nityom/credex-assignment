import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { runAudit } from "@/lib/audit-engine";
import { getSupabase } from "@/lib/supabase";
import type { SpendFormData } from "@/lib/types";

// Simple in-memory rate limiter (per-IP, resets on cold start)
// For production, use Upstash Redis or Supabase-based rate limiting.
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

const toolEntrySchema = z.object({
  toolId: z.string(),
  plan: z.string(),
  monthlySpend: z.coerce.number().min(0).max(100_000),
  seats: z.coerce.number().min(1).max(10_000),
});

const requestSchema = z.object({
  tools: z.array(toolEntrySchema).min(1).max(20),
  teamSize: z.coerce.number().min(1).max(10_000),
  useCase: z.enum(["coding", "writing", "data", "research", "mixed"]),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const formData = parsed.data as SpendFormData;
  const auditResult = runAudit(formData);

  // Fetch AI summary in the background without blocking the response
  // (we'll poll or the client can fetch it separately)
  let aiSummary: string | undefined;
  try {
    const summaryRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/summary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, auditResult }),
        signal: AbortSignal.timeout(8000),
      }
    );
    if (summaryRes.ok) {
      const summaryBody = await summaryRes.json();
      aiSummary = summaryBody.summary;
    }
  } catch {
    // AI summary is non-blocking — we continue without it
  }

  if (aiSummary) {
    auditResult.aiSummary = aiSummary;
  }

  const id = uuidv4();

  const { error: dbError } = await getSupabase().from("audits").insert({
    id,
    form_data: formData,
    audit_result: auditResult,
    total_monthly_savings: auditResult.totalMonthlySavings,
    total_annual_savings: auditResult.totalAnnualSavings,
  });

  if (dbError) {
    console.error("DB insert error:", dbError.message);
    return NextResponse.json({ error: "Failed to save audit. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ auditId: id, result: auditResult }, { status: 201 });
}
