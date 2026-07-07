import { Grade, Subject } from "@/types";

export const GRADES: { value: Grade; label: string }[] = [
  { value: "primary_1", label: "Primary 1" },
  { value: "primary_2", label: "Primary 2" },
  { value: "primary_3", label: "Primary 3" },
  { value: "primary_4", label: "Primary 4" },
  { value: "primary_5", label: "Primary 5" },
  { value: "primary_6", label: "Primary 6" },
  { value: "jss_1",     label: "JSS 1" },
  { value: "jss_2",     label: "JSS 2" },
  { value: "jss_3",     label: "JSS 3" },
  { value: "sss_1",     label: "SSS 1" },
  { value: "sss_2",     label: "SSS 2" },
  { value: "sss_3",     label: "SSS 3" },
];

export const SUBJECTS: { value: Subject; label: string }[] = [
  { value: "mathematics",         label: "Mathematics" },
  { value: "english",             label: "English" },
  { value: "basic_science",       label: "Basic Science" },
  { value: "social_studies",      label: "Social Studies" },
  { value: "civic_education",     label: "Civic Education" },
  { value: "agricultural_science", label: "Agricultural Science" },
  { value: "computer_studies",    label: "Computer Studies" },
  { value: "business_studies",    label: "Business Studies" },
  { value: "home_economics",      label: "Home Economics" },
  { value: "fine_art",            label: "Fine Art" },
  { value: "physical_education",  label: "Physical Education" },
];
