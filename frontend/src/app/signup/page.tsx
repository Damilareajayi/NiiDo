import { Suspense } from "react";
import SignupForm from "./SignupForm";

// See login/page.tsx — this export only takes effect from a Server
// Component, which is why the actual form lives in SignupForm.tsx.
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
