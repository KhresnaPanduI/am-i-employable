import type { Metadata } from "next";

import { AnalyzerPage } from "@/components/analyzer-page";

export const metadata: Metadata = {
  title: "How Employable Am I?",
  description: "General CV diagnosis for interview-readiness.",
};

export default function GeneralPage() {
  return <AnalyzerPage mode="general" />;
}
