// ============================================
// NiiDo — Core Types
// ============================================

export type UserRole = "student" | "teacher" | "admin";
export type Language =
  | "en"
  | "fr"
  | "es"
  | "pt"
  | "ar"
  | "sw"
  | "ha"
  | "yo"
  | "ig"
  | "am"
  | "zh-CN"
  | "hi"
  | "ur"
  | "bn"
  | "de"
  | "ru"
  | "ja"
  | "ko"
  | "tr"
  | "id";
export type LearningTrack =
  | "visual"
  | "auditory"
  | "kinesthetic"
  | "readwrite"
  | "multimodal";

export type SupportLevel = "none" | "mild" | "moderate" | "significant";

// Used by teacher signup's "subjects you teach" tags and as quick-pick
// suggestions on the lesson generator (see constants.ts's SUBJECTS) — not a
// hard restriction on what a lesson can be generated for. The generator
// itself takes free text (EduPrompt/Gemini can produce a lesson for any
// subject a teacher types), since NiiDo now spans K-12 through grad school
// and no fixed list could cover that.
export type Subject =
  | "mathematics"
  | "english"
  | "basic_science"
  | "physics"
  | "chemistry"
  | "biology"
  | "further_mathematics"
  | "literature"
  | "social_studies"
  | "civic_education"
  | "geography"
  | "history"
  | "government"
  | "economics"
  | "agricultural_science"
  | "computer_studies"
  | "computer_science"
  | "business_studies"
  | "accounting"
  | "home_economics"
  | "fine_art"
  | "music"
  | "physical_education"
  | "french"
  | "religious_studies"
  | "psychology"
  | "engineering"
  | "medicine"
  | "law"
  | "nursing";

export type Grade =
  | "primary_1" | "primary_2" | "primary_3"
  | "primary_4" | "primary_5" | "primary_6"
  | "jss_1" | "jss_2" | "jss_3"
  | "sss_1" | "sss_2" | "sss_3"
  | "undergrad_1" | "undergrad_2" | "undergrad_3" | "undergrad_4" | "undergrad_5"
  | "grad_masters" | "grad_phd";

// ============================================
// User & Auth
// ============================================

export interface NiiDoUser {
  uid: string;
  role: UserRole;
  schoolId: string;
  name: string;
  email: string;
  phone?: string;
  language: Language;
  createdAt: Date;
  lastActive: Date;
  // student-specific
  grade?: Grade;
  age?: number;
  gender?: "male" | "female" | "other";
  // student/teacher-specific — free-text school name given at signup,
  // not necessarily linked to a real School document (see routes/auth.ts)
  schoolName?: string;
  // teacher-specific
  subjects?: Subject[];
  // Billing — defaults to "free" at signup. No payment processor is wired up yet;
  // this is set manually (see backend/scripts/set-premium.ts) until Stripe billing exists.
  subscriptionTier?: "free" | "premium";
}

// ============================================
// School
// ============================================

export interface School {
  id: string;
  name: string;
  state: string;
  lga: string;
  address: string;
  adminUid: string;
  teacherCount: number;
  studentCount: number;
  createdAt: Date;
  subscriptionTier: "free" | "sponsored" | "institutional";
  sponsoredBy?: string; // donor name if sponsored
}

// ============================================
// Student & NiiDo Read (LearnerDNA)
// ============================================

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  schoolId: string;
  teacherId: string;
  classId: string;
  gender: "male" | "female" | "other";
  age?: number;
  parentWhatsApp?: string; // for BridgeAgent notifications
  language: Language;
  readProfile?: ReadProfile;
  createdAt: Date;
}

export interface ReadProfile {
  // NiiDo Read — learning assessment results
  primaryTrack: LearningTrack;
  secondaryTrack?: LearningTrack;
  supportLevel: SupportLevel;
  neurodivergentIndicators: string[]; // flags, never diagnosis
  strengths: string[];
  teacherGuidance: string[];
  contentAdaptations: string[];
  parentNote: string; // plain language, no jargon
  assessmentScore: number; // 0-100 completion confidence
  completedAt: Date;
  // Raw responses stored for future ML training
  rawResponses: AssessmentResponse[];
}

export interface AssessmentResponse {
  questionId: string;
  questionText: string;
  selectedOption: string;
  indicatorType: LearningTrack | "attention" | "social" | "frustration" | "sensory" | "routine" | "focus";
  timeSpent: number; // seconds
}

export interface AssessmentQuestion {
  id: string;
  section: "attention" | "preference" | "challenge" | "social" | "sensory";
  text: string;
  options: {
    label: string;
    indicator: LearningTrack | "attention" | "social" | "frustration" | "sensory" | "routine" | "focus";
  }[];
  ageRange?: [number, number];
}

// ============================================
// Teacher & NiiDo Teach (CurriculumOS)
// ============================================

export interface Teacher {
  id: string;
  uid: string;
  name: string;
  schoolId: string;
  classIds: string[];
  subjects: Subject[];
  whatsAppNumber?: string;
  language: Language;
  createdAt: Date;
}

export interface Class {
  id: string;
  name: string;
  grade: Grade;
  teacherId: string;
  schoolId: string;
  studentIds: string[];
  // Aggregated from student ReadProfiles
  trackDistribution?: Record<LearningTrack, number>;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  schoolId: string;
  classId: string;
  subject: Subject;
  topic: string;
  grade: Grade;
  duration: 30 | 45 | 60 | 80;
  generatedContent: LessonContent;
  createdAt: Date;
  channel: "web" | "whatsapp"; // how it was generated
}

// EduPrompt (the preferred generator) returns a markdown blob + provider name.
// Gemini (fallback, when EduPrompt is unavailable) returns the structured fields below.
// Exactly one of the two shapes is populated on any given LessonContent.
export interface LessonContent {
  markdown?: string;
  provider?: string;

  objectives?: string[];
  materials?: string[];
  introduction?: string;
  mainActivity?: {
    standard: string;
    support: string;    // for struggling learners
    extension: string;  // for advanced learners
  };
  assessment?: string;
  homework?: string;
  neurodivergentTips?: string[];
  adaptationsByTrack?: Record<LearningTrack, string>;
}

// ============================================
// Admin & NiiDo Pulse (SchoolPulse)
// ============================================

export interface SchoolStats {
  schoolId: string;
  totalStudents: number;
  totalTeachers: number;
  readCompletionRate: number; // % of students with a ReadProfile
  trackDistribution: Record<LearningTrack, number>;
  lessonsGeneratedThisWeek: number;
  activeTeachersToday: number;
  supportNeedsCount: number; // students with mild+ support needs
  lastUpdated: Date;
}

// ============================================
// Student Upload (register photo → CSV)
// ============================================

export interface StudentUploadResult {
  detected: DetectedStudent[];
  confidence: number; // 0-1
  rawText: string;    // OCR output for review
  warnings: string[];
}

export interface DetectedStudent {
  name: string;
  grade?: Grade;
  gender?: "male" | "female";
  age?: number;
  confirmed: boolean; // admin confirms before import
}

// ============================================
// Notifications & BridgeAgent
// ============================================

export interface WhatsAppNotification {
  id: string;
  recipientPhone: string;
  recipientType: "parent" | "teacher";
  studentId: string;
  type:
    | "assessment_complete"
    | "weekly_progress"
    | "teacher_flag"
    | "lesson_plan";
  language: Language;
  message: string;
  sentAt: Date;
  status: "pending" | "sent" | "delivered" | "failed";
}
