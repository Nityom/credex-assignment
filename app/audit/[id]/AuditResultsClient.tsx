"use client";

import { useState } from "react";
import Link from "next/link";
import type { StoredAudit, ToolRecommendation, RecommendationType } from "@/lib/types";
import { TOOLS } from "@/lib/pricing-data";
import LeadCapture from "@/components/LeadCapture";
import ShareButton from "@/components/ShareButton";

interface Props {
  audit: StoredAudit;
}

const ACTION_LABELS: Record<RecommendationType, string> = {
  downgrade_plan: "Downgrade plan",
  switch_tool: "Switch tool",
  consolidate: "Consolidate",
  use_credits: "Buy credits",
  optimal: "Already optimal ✓",
  notify_only: "Notify me",
};

const ACTION_COLORS: Record<RecommendationType, string> = {
  downgrade_plan: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  switch_tool: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  consolidate: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  use_credits: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  optimal: "text-slate-400 bg-slate-400/10 border-slate-400/30",
  notify_only: "text-slate-400 bg-slate-400/10 border-slate-400/30",
};

function getToolLabel(id: string) {
  return TOOLS.find((t) => t.id === id)?.label ?? id;
}

function RecommendationCard({ rec }: { rec: ToolRecommendation }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-semibold text-white">{getToolLabel(rec.toolId)}</h3>
          <p className="text-sm text-slate-400 capitalize">{rec.currentPlan.replace(/_/g, " ")} · ${rec.currentMonthlyCost}/mo</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ACTION_COLORS[rec.recommendedAction]}`}
        >
          {ACTION_LABELS[rec.recommendedAction]}
        </span>
      </div>

      <p className="text-sm text-slate-300 mb-3">{rec.reason}</p>

      {rec.monthlySavings > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-emerald-400 font-semibold">
            Save ${rec.monthlySavings}/mo
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-emerald-400/70">${rec.annualSavings}/yr</span>
        </div>
      )}

      {rec.credexApplicable && (
        <div className="mt-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-3 py-2 text-xs text-indigo-400">
          Credex can source pre-purchased credits for this tool at 20–35% off retail.
        </div>
      )}
    </div>
  );
}

export default function AuditResultsClient({ audit }: Props) {
  const [leadCaptured, setLeadCaptured] = useState(false);
  const result = audit.audit_result;
  const isHighSavings = result.savingsTier === "high";
  const isMediumSavings = result.savingsTier === "medium";
  const isOptimal = result.savingsTier === "optimal";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-12 px-4">
      <div className="mx-auto max-w-3xl">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          ← Run another audit
        </Link>

        {/* Hero savings banner */}
        <div className={`rounded-2xl p-8 mb-8 text-center ${
          isOptimal
            ? "bg-emerald-500/10 border border-emerald-500/30"
            : "bg-indigo-500/10 border border-indigo-500/30"
        }`}>
          {isOptimal ? (
            <>
              <div className="text-4xl mb-3">🎉</div>
              <h1 className="text-2xl font-bold text-white mb-2">You&apos;re spending well.</h1>
              <p className="text-slate-400">
                Your current AI stack is reasonably optimised. No significant savings found —
                that&apos;s genuinely good news.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-2">
                Potential savings identified
              </p>
              <div className="text-5xl sm:text-6xl font-extrabold text-white mb-1">
                ${result.totalMonthlySavings.toLocaleString()}
                <span className="text-2xl text-slate-400 font-normal">/mo</span>
              </div>
              <div className="text-xl text-emerald-400 font-semibold">
                ${result.totalAnnualSavings.toLocaleString()} per year
              </div>
              <p className="mt-3 text-slate-400 text-sm">
                vs. your current ${result.totalCurrentSpend}/mo AI spend
              </p>
            </>
          )}
        </div>

        {/* AI summary */}
        {result.aiSummary && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">AI Summary</p>
            <p className="text-slate-300 text-sm leading-relaxed">{result.aiSummary}</p>
          </div>
        )}

        {/* Credex CTA for high-savings audits */}
        {isHighSavings && (
          <div className="rounded-xl bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-500/40 p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-bold text-white mb-1">Capture even more savings with Credex</h2>
                <p className="text-sm text-slate-300">
                  Credex sources discounted AI infrastructure credits (Cursor, Claude, ChatGPT Enterprise)
                  from companies that overforecast. Teams saving $500+/mo typically cut another 20–35% off
                  their remaining spend through credits.
                </p>
              </div>
              <a
                href="https://credex.rocks"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-5 py-2.5 text-sm transition-colors"
              >
                Book a Credex consultation →
              </a>
            </div>
          </div>
        )}

        {/* Per-tool breakdown */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-white">Per-tool breakdown</h2>
          {result.recommendations.map((rec) => (
            <RecommendationCard key={rec.toolId} rec={rec} />
          ))}
        </div>

        {/* Share */}
        <div className="mb-8">
          <ShareButton auditId={audit.id} />
        </div>

        {/* Lead capture */}
        {!leadCaptured ? (
          <LeadCapture
            auditId={audit.id}
            isHighSavings={isHighSavings}
            isMediumSavings={isMediumSavings}
            isOptimal={isOptimal}
            onSuccess={() => setLeadCaptured(true)}
          />
        ) : (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <p className="text-emerald-400 font-semibold">You&apos;re on the list ✓</p>
            <p className="text-sm text-slate-400 mt-1">
              Check your inbox — we&apos;ve sent you a copy of this audit.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
