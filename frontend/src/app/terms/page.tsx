import Link from "next/link";

export const metadata = {
  title: "Terms of Use — NiiDo",
  description: "The terms that govern use of NiiDo, an adaptive learning platform by LearnScape Africa.",
};

const LAST_UPDATED = "August 10, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <img src="/niido-icon-mark.svg" alt="" className="w-6 h-6" />
          <span className="font-display font-bold text-stone-900">NiiDo</span>
        </Link>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900 mb-2">Terms of Use</h1>
        <p className="text-stone-400 text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-stone prose-sm max-w-none">
          <p>
            NiiDo is an adaptive learning platform operated by LearnScape Africa (&quot;LearnScape,&quot;
            &quot;we,&quot; &quot;us&quot;). These Terms of Use (&quot;Terms&quot;) govern access to and use of
            NiiDo Read, NiiDo Teach, NiiDo Pulse, and every other part of the NiiDo service (together, the
            &quot;Service&quot;). By creating an account or otherwise using the Service, you agree to these Terms.
            If you do not agree, please do not use the Service.
          </p>

          <h2>1. Who can use NiiDo</h2>
          <p>
            NiiDo is built for learners of any age — from primary school through graduate school — as well as
            teachers and school administrators. If you are under the age of majority in your jurisdiction, a
            parent, guardian, or your school must consent to your use of NiiDo, typically by creating or
            authorizing the account on your behalf. Teachers and school administrators who create student
            accounts confirm that they have the authority to do so under their school&apos;s policies and
            applicable law.
          </p>

          <h2>2. Your account</h2>
          <p>
            You&apos;re responsible for the accuracy of the information you provide and for keeping your
            login credentials secure. Notify us promptly if you believe your account has been accessed
            without authorization. Accounts are personal to the individual (or, for student accounts created
            by a teacher or school, the student) they were created for and may not be shared or transferred.
          </p>

          <h2>3. What NiiDo does</h2>
          <p>
            NiiDo Read generates a personalized learning-style profile (&quot;LearnerDNA&quot;) from an
            adaptive assessment. NiiDo Teach and My Learning generate lesson plans and self-paced learning
            content using artificial intelligence, drawing on curriculum-aligned prompting and, where
            applicable, illustrative images. NiiDo Pulse gives teachers and school administrators an
            aggregated view of how their students or school are engaging with the platform.
          </p>
          <p>
            <strong>AI-generated content is a starting point, not a guarantee.</strong> Lesson plans, learning
            content, and assessment insights are produced by AI systems and may contain errors, omissions, or
            content that needs review before classroom or independent use. Teachers remain responsible for
            reviewing content before using it with students, and students and parents should treat generated
            content as a study aid rather than an authoritative source.
          </p>

          <h2>4. Subscriptions and billing</h2>
          <p>
            NiiDo offers a Free tier, a paid Premium tier for individual students, and custom School plans.
            Premium subscriptions are billed on a recurring basis until cancelled; pricing and included
            features are described on our{" "}
            <Link href="/#pricing">pricing page</Link>. You can cancel at any time; cancellation stops future
            billing but does not retroactively refund the current billing period unless required by law.
            School plans are governed by a separate agreement with LearnScape.
          </p>

          <h2>5. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in a way that violates any applicable law or regulation;</li>
            <li>Attempt to access another user&apos;s account or data without authorization;</li>
            <li>Upload content you don&apos;t have the right to share, or content that is abusive, defamatory, or harmful to minors;</li>
            <li>Interfere with, disrupt, or attempt to reverse-engineer the Service or its underlying AI systems;</li>
            <li>Use automated means to scrape or extract data from the Service beyond normal use.</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these Terms.</p>

          <h2>6. Your content</h2>
          <p>
            You retain ownership of the content you submit to NiiDo (such as assessment responses, lesson
            topics you request, or files you upload). By submitting content, you grant LearnScape a license to
            use it solely to operate and improve the Service — for example, to generate your learning content
            or to power the AI features you request. We do not sell your content or personal data.
          </p>

          <h2>7. Intellectual property</h2>
          <p>
            The NiiDo name, logo, and platform (excluding your own content and AI-generated outputs specific
            to your account) are owned by LearnScape Africa and protected by applicable intellectual property
            law. You may use AI-generated lesson plans and learning content for your own educational purposes.
          </p>

          <h2>8. Disclaimers</h2>
          <p>
            The Service is provided &quot;as is.&quot; We work to keep NiiDo accurate and available, but we
            don&apos;t guarantee it will be uninterrupted, error-free, or that AI-generated content will always
            be correct or appropriate for every context. To the fullest extent permitted by law, LearnScape
            disclaims warranties of any kind, express or implied, regarding the Service.
          </p>

          <h2>9. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, LearnScape will not be liable for indirect, incidental, or
            consequential damages arising from your use of the Service. Nothing in these Terms limits
            liability that cannot be limited under applicable law.
          </p>

          <h2>10. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. We&apos;ll update the &quot;Last updated&quot; date
            above when we do, and for material changes we&apos;ll make reasonable efforts to notify active
            users. Continued use of the Service after changes take effect means you accept the updated Terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about these Terms can be sent to{" "}
            <a href="mailto:support@learnscape.africa">support@learnscape.africa</a>. See also our{" "}
            <Link href="/privacy">Privacy Policy</Link> for how we handle your data.
          </p>
        </div>
      </div>
    </div>
  );
}
