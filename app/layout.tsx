import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DisclaimerGate } from "@/components/disclaimer/DisclaimerGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediBot — Intelligent Pharmacy Assistant & Health Companion",
  description:
    "Compare medicine prices across certified pharmacies, discover verified generic alternatives, and check prescription safety deterministically.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
        <DisclaimerGate />
        {children}
      </body>
    </html>
  );
}
