import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sasta Room — Broker-free long-term rooms, PGs and flats in India",
    template: "%s | Sasta Room",
  },
  description:
    "Discover PGs, shared rooms, single rooms and flats for long-term stays at unbeatable prices. Zero brokerage, verified listings.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-background text-ink flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
