import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARIAS Estimator",
  description:
    "ARIAS Interior Systems — Estimating & Proposal tool for drywall and metal stud framing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
