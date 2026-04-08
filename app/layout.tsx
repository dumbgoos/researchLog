import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResearchLog",
  description: "A structured research memory workspace for ideas, experiments, decisions, and assets."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
