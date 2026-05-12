import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://spendwise.ai"),
  title: "SpendWise AI — Free AI Tool Spend Audit",
  description:
    "Find out if you're overpaying for Cursor, Claude, ChatGPT, GitHub Copilot and more. Get an instant, finance-grade breakdown of your AI tool spend.",
  openGraph: {
    title: "SpendWise AI — Free AI Tool Spend Audit",
    description:
      "Find out if you're overpaying for AI tools. Get an instant audit of your Cursor, Claude, ChatGPT and GitHub Copilot spend.",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWise AI — Free AI Tool Spend Audit",
    description: "Instant, finance-grade audit of your AI subscriptions.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
