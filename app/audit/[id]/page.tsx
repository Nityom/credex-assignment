import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import type { StoredAudit } from "@/lib/types";
import AuditResultsClient from "./AuditResultsClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getSupabase()
    .from("audits")
    .select("total_monthly_savings, total_annual_savings")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Audit Not Found | SpendWise AI" };
  }

  const savings = data.total_monthly_savings as number;
  const title =
    savings > 0
      ? `Save $${savings}/mo on AI tools | SpendWise AI Audit`
      : "AI Spend Audit Results | SpendWise AI";

  return {
    title,
    description: `This AI spend audit identified $${savings}/month in potential savings across AI tool subscriptions.`,
    openGraph: {
      title,
      description: `Potential savings: $${savings}/month · $${(data.total_annual_savings as number).toFixed(0)}/year. Run your own free audit at SpendWise AI.`,
      images: [{ url: `/api/og?id=${id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `$${savings}/month in AI tool savings identified.`,
      images: [`/api/og?id=${id}`],
    },
  };
}

export default async function AuditPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const audit = data as StoredAudit;

  return <AuditResultsClient audit={audit} />;
}
