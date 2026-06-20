import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5500 Analyzer",
  description: "Form 5500 analysis and 401(k) plan review reporting MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
