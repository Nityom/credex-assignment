"use client";

import { useState } from "react";
import { z } from "zod";

const leadSchema = z.object({
  email: z.string().email(),
  companyName: z.string().optional(),
  role: z.string().optional(),
  teamSize: z.coerce.number().optional(),
  website: z.string().max(0, "Bot detected"), // honeypot
});

interface Props {
  auditId: string;
  isHighSavings: boolean;
  isMediumSavings: boolean;
  isOptimal: boolean;
  onSuccess: () => void;
}

export default function LeadCapture({ auditId, isHighSavings, isMediumSavings, isOptimal, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [honeypot, setHoneypot] = useState(""); // must stay empty
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = leadSchema.safeParse({
      email,
      companyName: company,
      role,
      website: honeypot,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, auditId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to save");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const headline = isHighSavings
    ? "Get your full report + a Credex consultation"
    : isOptimal
    ? "Get notified when new optimisations apply"
    : "Get your full report by email";

  const subtext = isHighSavings
    ? "We'll send you a PDF of this audit and have a Credex specialist reach out about capturing your savings through discounted credits."
    : isOptimal
    ? "Your stack looks lean today. Enter your email and we'll notify you when new savings opportunities emerge for your exact tools."
    : "We'll send a copy of this audit to your inbox — handy for sharing with your CFO or co-founder.";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold text-white mb-1">{headline}</h2>
      <p className="text-sm text-slate-400 mb-5">{subtext}</p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Honeypot — hidden from real users */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          className="absolute opacity-0 pointer-events-none h-0 w-0"
        />

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Work email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Company <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Your role <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="CTO / Engineering Manager"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email}
          className="mt-4 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {isLoading ? "Saving…" : isHighSavings ? "Get report + consultation →" : "Send me the report →"}
        </button>

        <p className="mt-2 text-center text-xs text-slate-500">
          No spam. Unsubscribe any time.
        </p>
      </form>
    </div>
  );
}
