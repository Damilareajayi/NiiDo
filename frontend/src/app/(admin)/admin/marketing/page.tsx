"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { FadeIn } from "@/components/ui/FadeIn";
import { Sparkles, Loader2, Copy, Check, Mail, MessageCircle, ArrowRight } from "lucide-react";

export default function MarketingPage() {
  const { user } = useAuth();
  const [campaignType, setCampaignType] = useState<"school-pitch" | "parent-nudge">("school-pitch");

  // Form states for School Pitch
  const [adminName, setAdminName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [totalStudents, setTotalStudents] = useState("120");
  const [assessedCount, setAssessedCount] = useState("45");
  const [lessonsGenerated, setLessonsGenerated] = useState("18");
  const [primaryNeedsCount, setPrimaryNeedsCount] = useState("8");

  // Form states for Parent Nudge
  const [parentName, setParentName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [primaryTrack, setPrimaryTrack] = useState("visual");
  const [completedLessons, setCompletedLessons] = useState("4");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const payload = campaignType === "school-pitch" 
        ? {
            type: "school-pitch",
            adminName,
            schoolName,
            totalStudents: Number(totalStudents),
            assessedCount: Number(assessedCount),
            lessonsGenerated: Number(lessonsGenerated),
            primaryNeedsCount: Number(primaryNeedsCount),
          }
        : {
            type: "parent-nudge",
            parentName,
            studentName,
            primaryTrack,
            completedLessons: Number(completedLessons),
          };

      const res = await apiFetch("/api/admin/growth-marketing", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to generate campaign copy");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = campaignType === "school-pitch" 
      ? `Subject: ${result.subject}\n\n${result.body}`
      : result.message;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <FadeIn className="mb-8">
        <span className="badge-pulse mb-2">NiiDo Growth</span>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900 mt-1">
          Growth & Outreach Portal
        </h1>
        <p className="text-stone-500 mt-1">
          Generate targeted, high-converting marketing copy and school-wide outreach campaigns powered by the NiiDo Growth Agent.
        </p>
      </FadeIn>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-6">
        <button
          onClick={() => { setCampaignType("school-pitch"); setResult(null); }}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all
            ${campaignType === "school-pitch" 
              ? "border-sky-500 text-sky-600" 
              : "border-transparent text-stone-500 hover:text-stone-700"}`}
        >
          <Mail className="w-4 h-4" /> B2B School Pitch Email
        </button>
        <button
          onClick={() => { setCampaignType("parent-nudge"); setResult(null); }}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all
            ${campaignType === "parent-nudge" 
              ? "border-sky-500 text-sky-600" 
              : "border-transparent text-stone-500 hover:text-stone-700"}`}
        >
          <MessageCircle className="w-4 h-4" /> Parent WhatsApp Nudge
        </button>
      </div>

      {!result && !loading && (
        <FadeIn className="card p-6 md:p-8">
          <form onSubmit={generateCampaign} className="space-y-5">
            {campaignType === "school-pitch" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Admin Name</label>
                    <input className="input" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="e.g. Mr. Kola" />
                  </div>
                  <div>
                    <label className="label">School Name</label>
                    <input className="input" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Bright Future Academy" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Total Students</label>
                    <input type="number" className="input" required value={totalStudents} onChange={(e) => setTotalStudents(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Assessed Profiles (LearnerDNA)</label>
                    <input type="number" className="input" required value={assessedCount} onChange={(e) => setAssessedCount(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Lessons Generated this Month</label>
                    <input type="number" className="input" required value={lessonsGenerated} onChange={(e) => setLessonsGenerated(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Struggling Students (Mild-Significant needs)</label>
                    <input type="number" className="input" required value={primaryNeedsCount} onChange={(e) => setPrimaryNeedsCount(e.target.value)} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Parent Name</label>
                    <input className="input" required value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="e.g. Mrs. Adebayo" />
                  </div>
                  <div>
                    <label className="label">Child's Name</label>
                    <input className="input" required value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Tunde" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Child's Cognitive Style</label>
                    <select className="input" value={primaryTrack} onChange={(e) => setPrimaryTrack(e.target.value)}>
                      <option value="visual">Visual (Charts, Pictures)</option>
                      <option value="auditory">Auditory (Explanation, Rhymes)</option>
                      <option value="kinesthetic">Kinesthetic (Practical, Physical)</option>
                      <option value="readwrite">Read/Write (Study Notes, Lists)</option>
                      <option value="multimodal">Multimodal (Balanced)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Completed Lessons</label>
                    <input type="number" className="input" required value={completedLessons} onChange={(e) => setCompletedLessons(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" className="btn-sky w-full flex items-center justify-center gap-2 py-3">
              <Sparkles className="w-4 h-4" /> Generate Campaign Copy
            </button>
          </form>
        </FadeIn>
      )}

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-4" />
          <p className="text-stone-600 font-medium">NiiDo Growth Agent is writing copy...</p>
        </div>
      )}

      {result && !loading && (
        <FadeIn className="space-y-4">
          <div className="card p-6 md:p-8 relative">
            <div className="absolute right-4 top-4">
              <button onClick={copyToClipboard} className="btn-ghost flex items-center gap-1.5 text-xs">
                {copied ? <><Check className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Text</>}
              </button>
            </div>

            {campaignType === "school-pitch" ? (
              <div className="space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <p className="text-xs font-semibold text-sky-600 uppercase tracking-widest">Growth Pitch Email</p>
                  <h2 className="text-lg font-bold text-stone-900 mt-1">Subject: {result.subject}</h2>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line bg-stone-50 rounded-xl p-4 border border-stone-100 font-mono">
                  {result.body}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <p className="text-xs font-semibold text-sky-600 uppercase tracking-widest">WhatsApp Conversional Nudge</p>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line bg-stone-50 rounded-xl p-4 border border-stone-100 font-mono">
                  {result.message}
                </p>
              </div>
            )}
          </div>

          <button onClick={() => setResult(null)} className="btn-outline w-full flex items-center justify-center gap-2">
            Generate Another Campaign <ArrowRight className="w-4 h-4" />
          </button>
        </FadeIn>
      )}
    </div>
  );
}
