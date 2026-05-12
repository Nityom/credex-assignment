"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { TOOLS } from "@/lib/pricing-data";
import type { UseCase } from "@/lib/types";

const toolEntrySchema = z.object({
  toolId: z.string(),
  plan: z.string(),
  monthlySpend: z.coerce.number().min(0),
  seats: z.coerce.number().min(1),
});

const formSchema = z.object({
  tools: z.array(toolEntrySchema).min(1, "Add at least one tool"),
  teamSize: z.coerce.number().min(1),
  useCase: z.enum(["coding", "writing", "data", "research", "mixed"]),
});

type FormValues = z.infer<typeof formSchema>;

const STORAGE_KEY = "ai-spend-audit-form";

const USE_CASES: { value: UseCase; label: string }[] = [
  { value: "coding", label: "Software Engineering / Coding" },
  { value: "writing", label: "Content & Copywriting" },
  { value: "data", label: "Data Analysis" },
  { value: "research", label: "Research & Knowledge Work" },
  { value: "mixed", label: "Mixed / General Productivity" },
];

export default function Home() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tools: [{ toolId: "cursor", plan: "pro", monthlySpend: 20, seats: 1 }],
      teamSize: 1,
      useCase: "coding",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "tools" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) reset(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [reset]);

  const watchedValues = watch();
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedValues));
    } catch { /* ignore */ }
  }, [watchedValues]);

  function getPlansForTool(toolId: string) {
    return TOOLS.find((t) => t.id === toolId)?.plans ?? [];
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
      router.push(`/audit/${body.auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-10 text-center">
        <span className="inline-block mb-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          Free AI Spend Audit
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
          Are you overpaying<br />
          <span className="text-indigo-400">for AI tools?</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
          Input your AI subscriptions. Get a precise breakdown of where you&apos;re
          overspending and exactly how much you can save — in under 60 seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
          {["No login required", "Instant results", "Finance-grade reasoning"].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> {f}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Team size (people)
                </label>
                <input
                  type="number"
                  min={1}
                  {...register("teamSize")}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 5"
                />
                {errors.teamSize && (
                  <p className="mt-1 text-xs text-red-400">{errors.teamSize.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Primary use case
                </label>
                <select
                  {...register("useCase")}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {USE_CASES.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <h2 className="text-base font-semibold text-white">Your AI tools</h2>
              {fields.map((field, idx) => {
                const toolId = watchedValues.tools[idx]?.toolId ?? "cursor";
                const plans = getPlansForTool(toolId);
                const currentPlan = plans.find((p) => p.plan === watchedValues.tools[idx]?.plan);
                const isUsageBased = currentPlan?.usageBased ?? false;

                return (
                  <div key={field.id} className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
                    <div className="grid sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Tool</label>
                        <select
                          {...register(`tools.${idx}.toolId`)}
                          className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {TOOLS.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Plan</label>
                        <select
                          {...register(`tools.${idx}.plan`)}
                          className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {plans.map((p) => (
                            <option key={p.plan} value={p.plan}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Seats</label>
                        <input
                          type="number"
                          min={1}
                          {...register(`tools.${idx}.seats`)}
                          className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          {isUsageBased ? "Monthly spend ($)" : "Monthly total ($)"}
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          {...register(`tools.${idx}.monthlySpend`)}
                          className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={isUsageBased ? "e.g. 150" : "0"}
                        />
                        {!isUsageBased && currentPlan && currentPlan.pricePerSeat > 0 && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            ${currentPlan.pricePerSeat}/seat × {watchedValues.tools[idx]?.seats ?? 1}
                          </p>
                        )}
                      </div>
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => append({ toolId: "claude", plan: "pro", monthlySpend: 20, seats: 1 })}
                className="w-full rounded-xl border border-dashed border-slate-600 py-3 text-sm text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
              >
                + Add another tool
              </button>
            </div>

            {errors.tools && (
              <p className="mb-4 text-sm text-red-400">{String(errors.tools.message)}</p>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {isSubmitting ? "Running audit…" : "Run my AI spend audit →"}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              No account required. Results load instantly.
            </p>
          </form>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm text-slate-500">
          <span>Used by 200+ startups <span className="text-slate-600">(mocked)</span></span>
          <span>Avg. savings found: <strong className="text-slate-400">$340/mo</strong></span>
          <span>Built by <a href="https://credex.rocks" className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">Credex</a></span>
        </div>
      </section>
    </main>
  );
}
