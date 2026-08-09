import { Suspense } from "react";
import CompleteProfileForm from "./CompleteProfileForm";

// See login/page.tsx — this export only takes effect from a Server
// Component, which is why the actual form lives in CompleteProfileForm.tsx.
export const dynamic = "force-dynamic";

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
