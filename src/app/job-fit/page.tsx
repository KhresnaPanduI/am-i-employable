import type { Metadata } from "next";

import { AnalyzerPage } from "@/components/analyzer-page";

export const metadata: Metadata = {
  title: "How Employable Am I for This Job?",
  description: "CV diagnosis against a specific job description.",
};

export default function JobFitPage() {
  return <AnalyzerPage mode="job-fit" />;
}
