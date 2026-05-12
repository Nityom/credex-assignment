"use client";

import { useState } from "react";

interface Props {
  auditId: string;
}

export default function ShareButton({ auditId }: Props) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/audit/${auditId}`
      : `https://spendwise.ai/audit/${auditId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="font-semibold text-white mb-1">Share this audit</h3>
      <p className="text-sm text-slate-400 mb-4">
        Public link — identifying details stripped. Share with your co-founder, CFO, or on Hacker News.
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 text-sm truncate focus:outline-none"
          aria-label="Shareable audit URL"
        />
        <button
          onClick={handleCopy}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 text-sm transition-colors whitespace-nowrap"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
      <div className="mt-3 flex gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=Just+audited+my+AI+tool+spend+with+SpendWiseAI+%E2%80%94+found+savings+I+didn%27t+know+I+had+%F0%9F%92%B8&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Share on X →
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Share on LinkedIn →
        </a>
      </div>
    </div>
  );
}
