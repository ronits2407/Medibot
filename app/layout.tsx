import type { Metadata } from "next";
import { Instrument_Sans, Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";
import { DisclaimerGate } from "@/components/disclaimer/DisclaimerGate";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

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
    <html lang="en">
      <body
        className={`${instrument.variable} ${bricolage.variable} ${spaceMono.variable} font-sans bg-background text-foreground antialiased selection:bg-blush selection:text-ink min-h-screen`}
      >
        <DisclaimerGate />
        {children}
      </body>
    </html>
  );
}
