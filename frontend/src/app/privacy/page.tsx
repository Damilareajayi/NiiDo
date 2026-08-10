import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — NiiDo",
  description: "How NiiDo collects, uses, and protects your data, including special protections for K-12 learners.",
};

const LAST_UPDATED = "August 10, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <img src="/niido-icon-mark.svg" alt="" className="w-6 h-6" />
          <span className="font-display font-bold text-stone-900">NiiDo</span>
        </Link>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900 mb-2">Privacy Policy</h1>
        <p className="text-stone-400 text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-stone prose-sm max-w-none">
          <p>
            This Privacy Policy explains how LearnScape Africa (&quot;LearnScape,&quot; &quot;we,&quot;
            &quot;us&quot;) collects, uses, and protects information when you use NiiDo. Because many NiiDo
            users are K-12 students, we&apos;ve written this to be specific about what we collect from young
            learners and why, not just what&apos;s legally required.
          </p>

          <h2>1. Information we collect</h2>
          <p><strong>Account information:</strong> name, email address, role (student, teacher, or school
          administrator), grade level, and school affiliation where applicable.</p>
          <p><strong>Assessment and learning data:</strong> your responses to the NiiDo Read assessment, the
          resulting LearnerDNA profile, lesson topics you request, and your progress through generated
          content.</p>
          <p><strong>Content you upload:</strong> if you&apos;re a teacher, files you upload to build a class
          list (photos, PDFs, CSV, or Excel files) are processed to extract student names and grade levels,
          then discarded once you&apos;ve confirmed the import — we don&apos;t keep the original file.</p>
          <p><strong>Usage data:</strong> pages visited, features used, and engagement metrics (for example,
          how many lessons a student completes), which power the NiiDo Pulse dashboard for teachers and
          school administrators.</p>
          <p><strong>Device information:</strong> for push notifications, we store a device-specific
          subscription token if you opt in — no notification content is ever sold or shared.</p>

          <h2>2. Children&apos;s data</h2>
          <p>
            NiiDo is used by students under 18, including children under 13. Student accounts are created and
            managed by a teacher or school administrator, who is responsible for obtaining any parental
            consent required under applicable law (such as COPPA in the United States or equivalent local
            regulations) before creating an account for a minor. We collect only the information necessary to
            provide the learning features described in this policy — we do not use student data for
            behavioral advertising, and we do not sell student data, full stop.
          </p>
          <p>
            Parents and guardians who want to review, correct, or request deletion of their child&apos;s data
            should contact their child&apos;s school or teacher first, since they administer the account; if
            that&apos;s not possible, contact us directly using the details below and we&apos;ll work with the
            school to resolve the request.
          </p>

          <h2>3. How we use your information</h2>
          <ul>
            <li>To provide the Service — generating your LearnerDNA profile, lesson plans, and learning content;</li>
            <li>To let teachers and school administrators manage their classes and see aggregated engagement insights;</li>
            <li>To process Premium subscription payments (handled by our payment processor — we don&apos;t store your card details ourselves);</li>
            <li>To send account-related communications and, if you opt in, push notifications;</li>
            <li>To maintain the security and integrity of the Service and troubleshoot issues;</li>
            <li>To improve NiiDo&apos;s features based on aggregated, de-identified usage patterns.</li>
          </ul>

          <h2>4. AI processing</h2>
          <p>
            Lesson plans and learning content are generated using third-party AI models (including Google
            Gemini and other language and image-generation providers). The topic, subject, and relevant parts
            of your LearnerDNA profile are sent to these providers to generate your content; we do not send
            your name, email, or other direct identifiers as part of that request. These providers process
            the data under their own data-handling terms and don&apos;t use it to train their models on our
            plan.
          </p>

          <h2>5. Where your data lives</h2>
          <p>
            NiiDo data is stored using Google Cloud and Firebase infrastructure. We apply access controls so
            that a user can only read their own data (or, for teachers and school administrators, the data of
            students in their own school), and administrative access is limited to what&apos;s needed to
            operate the Service.
          </p>

          <h2>6. Sharing your information</h2>
          <p>
            We don&apos;t sell personal information. We share data only: with the AI and infrastructure
            providers described above, strictly to operate the Service; with your school, if your account is
            affiliated with one (teachers can see their students&apos; progress, and school administrators can
            see school-wide aggregates); with our payment processor for Premium billing; or when required by
            law.
          </p>

          <h2>7. Your choices</h2>
          <ul>
            <li>You can review and update your profile information at any time from your account settings;</li>
            <li>You can opt in or out of push notifications from your device settings or in-app;</li>
            <li>You can request deletion of your account and associated data by contacting us — for student accounts, this request should come from or be verified with the school;</li>
            <li>You can cancel a Premium subscription at any time from your profile.</li>
          </ul>

          <h2>8. Data retention</h2>
          <p>
            We retain account and learning data for as long as your account is active, so your progress and
            history remain available to you. If an account is deleted, we remove personal data within a
            reasonable period, except where we&apos;re required to retain records for legal or accounting
            purposes.
          </p>

          <h2>9. Security</h2>
          <p>
            We use industry-standard measures — encrypted connections, access-controlled databases, and
            scoped service accounts — to protect your data. No system is perfectly secure, but we treat
            learner data, especially that of minors, as a high priority to protect.
          </p>

          <h2>10. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. We&apos;ll update the &quot;Last updated&quot; date
            above, and for material changes affecting how we handle student data, we&apos;ll make reasonable
            efforts to notify schools and account holders directly.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions or requests about your data can be sent to{" "}
            <a href="mailto:privacy@learnscape.africa">privacy@learnscape.africa</a>. See also our{" "}
            <Link href="/terms">Terms of Use</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
