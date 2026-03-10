import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "How Employable Am I?",
  description:
    "Upload a CV, get a dramatic diagnosis, and leave with sharper rewrite suggestions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${monoFont.variable}`}>
        <div className="site-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
