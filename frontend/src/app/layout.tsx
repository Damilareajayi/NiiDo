import type { Metadata } from "next";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { LangProvider } from "@/hooks/useLang";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export const metadata: Metadata = {
  title: "NiiDo — Every child learns differently",
  description:
    "The adaptive learning platform for every learner, everywhere. NiiDo Read, NiiDo Teach, NiiDo Pulse.",
};

// Next.js's default Cache-Control for prerendered pages assumes a
// deploy-ID-aware CDN (like Vercel's) that treats a new deploy as an
// automatic cache miss. Fastly, fronting this app via Firebase Hosting,
// has no such awareness — it kept serving old cached HTML that referenced
// JS chunk filenames from a previous build, which the new build no longer
// has (404), leaving the app stuck on a dead page that never finishes
// loading. This was fixed per-page for the auth routes earlier, but every
// other route — including "/", the actual entry point — was still
// exposed to it. Setting this on the root layout applies it to the whole
// route tree at once instead of one page at a time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-stone-50 text-stone-900">
        <AuthProvider>
          <LangProvider>
            <LanguageSwitcher />
            {children}
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
