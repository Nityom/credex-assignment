import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}

// Rate limit per email (honeypot + IP already handled at audit creation)
const emailRateLimit = new Map<string, number>();
const EMAIL_COOLDOWN_MS = 60_000;

const requestSchema = z.object({
  email: z.string().email().max(320),
  companyName: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  teamSize: z.coerce.number().min(1).max(10_000).optional(),
  auditId: z.string().uuid(),
  website: z.string().max(0, "Bot detected"), // honeypot
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    // Honeypot triggered — silently accept but don't store
    if (parsed.error.issues.some((e) => e.message === "Bot detected")) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, companyName, role, teamSize, auditId } = parsed.data;

  // Per-email rate limit
  const last = emailRateLimit.get(email);
  if (last && Date.now() - last < EMAIL_COOLDOWN_MS) {
    return NextResponse.json({ error: "Already submitted. Check your inbox." }, { status: 429 });
  }
  emailRateLimit.set(email, Date.now());

  // Look up the audit to get savings data for the email
  const { data: audit } = await getSupabase()
    .from("audits")
    .select("total_monthly_savings, total_annual_savings")
    .eq("id", auditId)
    .single();

  const monthlySavings = (audit?.total_monthly_savings as number) ?? 0;
  const annualSavings = (audit?.total_annual_savings as number) ?? 0;
  const isHighSavings = monthlySavings >= 500;

  // Store lead
  const { error: dbError } = await getSupabase().from("leads").insert({
    audit_id: auditId,
    email,
    company_name: companyName,
    role,
    team_size: teamSize,
  });

  if (dbError) {
    console.error("Lead insert error:", dbError.message);
    return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  }

  // Send transactional email
  const auditUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://spendwise.ai"}/audit/${auditId}`;
  const emailSubject =
    monthlySavings > 0
      ? `Your AI spend audit: $${monthlySavings}/mo in potential savings`
      : "Your AI spend audit results";

  try {
    await getResend().emails.send({
      from: "SpendWise AI <audit@spendwise.ai>",
      to: email,
      subject: emailSubject,
      html: buildEmailHtml({ monthlySavings, annualSavings, isHighSavings, auditUrl, companyName }),
    });
  } catch (emailErr) {
    // Email failure is non-fatal — lead is already stored
    console.error("Email send error:", emailErr);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

function buildEmailHtml(opts: {
  monthlySavings: number;
  annualSavings: number;
  isHighSavings: boolean;
  auditUrl: string;
  companyName?: string;
}) {
  const { monthlySavings, annualSavings, isHighSavings, auditUrl, companyName } = opts;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; color: #1e293b;">
  <h2 style="color: #6366f1;">Your AI Spend Audit Results</h2>
  ${companyName ? `<p>Hi ${companyName} team,</p>` : "<p>Hi there,</p>"}
  ${
    monthlySavings > 0
      ? `<p>We found <strong>$${monthlySavings}/month ($${annualSavings}/year)</strong> in potential savings on your AI tool subscriptions.</p>`
      : `<p>Good news — your AI stack looks lean and well-optimised. No significant overspend detected.</p>`
  }
  <p><a href="${auditUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">View your full audit →</a></p>
  ${
    isHighSavings
      ? `<p>Given the savings magnitude we identified, a Credex specialist will be in touch within 1–2 business days to discuss how discounted AI credits could capture additional savings for your team.</p>`
      : ""
  }
  <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0;" />
  <p style="font-size:12px;color:#94a3b8;">SpendWise AI is powered by <a href="https://credex.rocks" style="color:#6366f1;">Credex</a> — discounted AI infrastructure credits for startups. <a href="#">Unsubscribe</a></p>
</body>
</html>`;
}
