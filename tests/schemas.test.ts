import { describe, expect, it } from "vitest";

import {
  analyzeGeneralRequestSchema,
  generalAnalysisResultSchema,
  jobFitAnalysisResultSchema,
} from "@/lib/schemas";

describe("schemas", () => {
  it("accepts a valid general analysis request", () => {
    const parsed = analyzeGeneralRequestSchema.parse({
      cvText: "Senior data analyst with measurable experimentation wins across growth and product teams.",
      cvFileName: "resume.pdf",
    });

    expect(parsed.cvFileName).toBe("resume.pdf");
  });

  it("rejects out-of-range general scores", () => {
    expect(() =>
      generalAnalysisResultSchema.parse({
        score: 111,
        verdict: "Strong signal.",
        recruiterFirstImpression:
          "Reads like someone with clear ownership, but this object should still fail because the score is invalid.",
        strongestSignal: "Impact",
        biggestRisk: "None",
        mostFixableWeakness: "Trim the skills list.",
        survivalTips: ["Add metrics.", "Tighten the opening."],
        rewrite: {
          professionalSummary: "Impact-focused analytics lead with strong business and technical range.",
          experienceBullets: ["Built X", "Improved Y", "Led Z"],
          skillsSection: ["SQL", "Python", "Experimentation", "Stakeholder management"],
        },
        shareCard: {
          summary: "Strong experience, clear impact.",
          strongestSignal: "Ownership",
          topFix: "Trim the skills section.",
        },
      }),
    ).toThrow();
  });

  it("requires targeted rewrite fields for the job-fit schema", () => {
    const parsed = jobFitAnalysisResultSchema.parse({
      score: 72,
      verdict: "Relevant background, but the CV could be tailored harder.",
      alignment: {
        strong: ["SQL", "Stakeholder communication"],
        partial: ["Experimentation"],
        missing: ["Feature engineering"],
        missingKeywords: ["A/B testing", "Product metrics"],
      },
      gapAnalysis:
        "The candidate looks close, but the CV still underplays direct experimentation ownership.",
      rewrite: {
        professionalSummary:
          "Product-minded analyst with strong SQL execution, stakeholder fluency, and a track record of turning data into shipping decisions.",
        experienceBullets: [
          "Owned SQL analysis for product launches and presented adoption trends to cross-functional leaders.",
          "Redesigned dashboards around product questions instead of static reporting requests.",
          "Translated ambiguous asks into decision-ready analyses with measurable business context.",
        ],
        keywordAdditions: ["Experiment design", "A/B testing", "Product analytics"],
        sectionReorder: ["Move impact-heavy experience above the long skills list.", "Pull analytics projects ahead of education."],
      },
      shareCard: {
        summary: "Close match, but not fully tailored.",
        strongestSignal: "Strong analytics foundation.",
        topFix: "Make experimentation work impossible to miss.",
      },
    });

    expect(parsed.rewrite.keywordAdditions).toHaveLength(3);
  });
});
