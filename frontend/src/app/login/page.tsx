import { Suspense } from "react";
import LoginForm from "./LoginForm";

// Auth pages must never be served stale. Next.js's default caching for
// prerendered pages assumes a deploy-ID-aware CDN, which Fastly (fronting
// this app via Firebase Hosting) is not — it kept serving a year-old build
// straight through real deploys. This export only takes effect from a
// Server Component, which is why the actual form lives in LoginForm.tsx.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
