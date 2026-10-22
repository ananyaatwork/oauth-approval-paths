import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Schibsted_Grotesk } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderHeight } from "@/components/HeaderHeight";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OAuth Approval Paths",
  description:
    "How long it takes to get an OAuth app approved with a provider, what blocks it, and what an agent can do for you.",
};

export const viewport: Viewport = { themeColor: "#0c1020" };

// Applies a saved light-theme choice before first paint, so there's no flash.
const themeScript = `try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${schibsted.variable} min-h-screen`}>
        <a href="#main" className="skip-link">Skip to content</a>
        <HeaderHeight />
        <header id="site-header" className="sticky top-0 z-30 border-b border-line bg-paper">
          <nav className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
            <Link href="/" className="font-semibold tracking-tight">
              OAuth Approval Paths
            </Link>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
              <Link href="/" className="hover:text-ink">Library</Link>
              <Link href="/generate" className="hover:text-ink">Research an app</Link>
              <Link href="/method" className="hover:text-ink">How guides are checked</Link>
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main id="main" className="mx-auto max-w-[1100px] px-4 pb-24 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
