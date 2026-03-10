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

  it("trims extra list items and long strings from general analysis output", () => {
    const parsed = generalAnalysisResultSchema.parse({
      score: 77,
      verdict: "Strong experience, slightly overpacked output that keeps going far past the UI limit for a one-line verdict even though the app only needs something compact.",
      recruiterFirstImpression:
        "The candidate looks credible and impact-oriented, but the model tried to hand back more bullets than the UI needs, and the first impression paragraph also rambles long enough to require trimming before it should ever be rendered back to the page in a production product.",
      strongestSignal: "Solid technical ownership repeated again and again until this field is much longer than one hundred and eighty characters, which should be normalized instead of causing the request to fail in front of the user.",
      biggestRisk: "Slightly unfocused positioning.",
      mostFixableWeakness: "Trim noisy details.",
      survivalTips: [
        "Tip 1 with too much explanatory detail that would normally exceed the desired limit for a screenshot-friendly output block, but should now be clipped instead of killing the whole response.",
        "Tip 2 with too much explanatory detail that would normally exceed the desired limit for a screenshot-friendly output block, but should now be clipped instead of killing the whole response.",
        "Tip 3",
        "Tip 4",
      ],
      rewrite: {
        professionalSummary:
          "Impact-oriented analyst with hands-on experimentation, SQL fluency, and a track record of translating messy business questions into useful decisions while also continuing to ramble far past the intended limit for the summary field in this product.",
        experienceBullets: [
          "A bullet that is intentionally much too long for the UI and should be trimmed automatically instead of causing the entire request to fail when the model gets a little too enthusiastic about detail and impact framing.",
          "B",
          "C",
          "D",
          "E",
        ],
        skillsSection: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      },
      shareCard: {
        summary: "Strong experience, clear impact, plus a lot of extra copy that should be clipped for the share card because it does not need to be this long to work in the final exported image.",
        strongestSignal: "Ownership",
        topFix: "Trim the skills section.",
      },
    });

    expect(parsed.verdict.length).toBeLessThanOrEqual(140);
    expect(parsed.strongestSignal.length).toBeLessThanOrEqual(180);
    expect(parsed.survivalTips).toHaveLength(3);
    expect(parsed.survivalTips[0].length).toBeLessThanOrEqual(140);
    expect(parsed.rewrite.experienceBullets).toHaveLength(4);
    expect(parsed.rewrite.experienceBullets[0].length).toBeLessThanOrEqual(180);
    expect(parsed.rewrite.skillsSection).toHaveLength(8);
    expect(parsed.shareCard.summary.length).toBeLessThanOrEqual(120);
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