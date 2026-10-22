import type { Metadata } from "next";
import Link from "next/link";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OAuth Approval Paths",
  description:
    "How long it takes to get an OAuth app approved with a provider, what blocks it, and what an agent can do for you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${schibsted.variable} min-h-screen`}>
        <header className="border-b border-line">
          <nav className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-6">
            <Link href="/" className="font-semibold tracking-tight">
              OAuth Approval Paths
            </Link>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <Link href="/" className="hover:text-ink">Library</Link>
              <Link href="/generate" className="hover:text-ink">Research an app</Link>
              <Link href="/method" className="hover:text-ink">How guides are checked</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-[1100px] px-4 pb-24 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
