// ── Backend-local copies of shared domain types ────────────────
// Kept in sync manually with frontend/src/types/index.ts.
// The backend must not import across into frontend/ — it's a
// separate deployable (Cloud Run) that won't have that folder.

export type Language = "en" | "ha" | "yo" | "ig" | "fr";
export type LearningTrack =
  | "visual"
  | "auditory"
  | "kinesthetic"
  | "readwrite"
  | "multimodal";

export type Grade =
  | "primary_1" | "primary_2" | "primary_3"
  | "primary_4" | "primary_5" | "primary_6"
  | "jss_1" | "jss_2" | "jss_3"
  | "sss_1" | "sss_2" | "sss_3"
  | "undergrad_1" | "undergrad_2" | "undergrad_3" | "undergrad_4" | "undergrad_5"
  | "grad_masters" | "grad_phd";

export type Subject =
  | "mathematics"
  | "english"
  | "basic_science"
  | "social_studies"
  | "civic_education"
  | "agricultural_science"
  | "computer_studies"
  | "business_studies"
  | "home_economics"
  | "fine_art"
  | "physical_education";

export interface AssessmentResponse {
  questionId: string;
  questionText: string;
  selectedOption: string;
  indicatorType: LearningTrack | "attention" | "social" | "frustration" | "sensory" | "routine" | "focus";
  timeSpent: number;
}
