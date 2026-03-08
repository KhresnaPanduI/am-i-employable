import { z } from "zod";

const trimmedString = (label: string, min = 1, max = 280) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const scoreSchema = z
  .number()
  .int()
  .min(0, "Score must be at least 0.")
  .max(100, "Score must be at most 100.");

export const shareCardSchema = z.object({
  summary: trimmedString("Share summary", 1, 120),
  strongestSignal: trimmedString("Share strongest signal", 1, 140),
  topFix: trimmedString("Share top fix", 1, 140),
});

export const analyzeGeneralRequestSchema = z.object({
  cvText: trimmedString("CV text", 40, 12000),
  cvFileName: trimmedString("CV file name", 1, 120),
});

export const analyzeJobFitRequestSchema = analyzeGeneralRequestSchema.extend({
  jobDescription: trimmedString("Job description", 60, 12000),
});

export const generalAnalysisResultSchema = z.object({
  score: scoreSchema,
  verdict: trimmedString("Verdict", 1, 140),
  recruiterFirstImpression: trimmedString(
    "Recruiter first impression",
    60,
    600,
  ),
  strongestSignal: trimmedString("Strongest signal", 1, 180),
  biggestRisk: trimmedString("Biggest risk", 1, 180),
  mostFixableWeakness: trimmedString("Most fixable weakness", 1, 180),
  survivalTips: z
    .array(trimmedString("Survival tip", 1, 140))
    .min(2, "Provide at least two survival tips.")
    .max(3, "Provide at most three survival tips."),
  rewrite: z.object({
    professionalSummary: trimmedString("Professional summary", 40, 500),
    experienceBullets: z
      .array(trimmedString("Experience bullet", 1, 180))
      .min(3, "Provide at least three rewritten bullets.")
      .max(4, "Provide at most four rewritten bullets."),
    skillsSection: z
      .array(trimmedString("Skill", 1, 60))
      .min(4, "Provide at least four skills.")
      .max(8, "Provide at most eight skills."),
  }),
  shareCard: shareCardSchema,
});

export const jobFitAnalysisResultSchema = z.object({
  score: scoreSchema,
  verdict: trimmedString("Verdict", 1, 140),
  alignment: z.object({
    strong: z
      .array(trimmedString("Strong alignment skill", 1, 80))
      .max(6, "Provide at most six strong matches."),
    partial: z
      .array(trimmedString("Partial alignment skill", 1, 80))
      .max(6, "Provide at most six partial matches."),
    missing: z
      .array(trimmedString("Missing skill", 1, 80))
      .max(6, "Provide at most six missing skills."),
    missingKeywords: z
      .array(trimmedString("Missing keyword", 1, 80))
      .max(6, "Provide at most six missing keywords."),
  }),
  gapAnalysis: trimmedString("Gap analysis", 60, 600),
  rewrite: z.object({
    professionalSummary: trimmedString("Professional summary", 40, 500),
    experienceBullets: z
      .array(trimmedString("Experience bullet", 1, 180))
      .min(3, "Provide at least three rewritten bullets.")
      .max(4, "Provide at most four rewritten bullets."),
    keywordAdditions: z
      .array(trimmedString("Keyword addition", 1, 100))
      .min(3, "Provide at least three keyword additions.")
      .max(6, "Provide at most six keyword additions."),
    sectionReorder: z
      .array(trimmedString("Section reorder note", 1, 120))
      .min(2, "Provide at least two section ordering suggestions.")
      .max(4, "Provide at most four section ordering suggestions."),
  }),
  shareCard: shareCardSchema,
});

export const parsedCvSchema = z.object({
  text: trimmedString("Parsed CV text", 1, 12000),
  pageCount: z.number().int().min(1).max(100),
  quality: z.enum(["ok", "low"]),
  warning: z.string().trim().max(220).optional(),
});

export type AnalyzeGeneralRequest = z.infer<typeof analyzeGeneralRequestSchema>;
export type AnalyzeJobFitRequest = z.infer<typeof analyzeJobFitRequestSchema>;
export type GeneralAnalysisResult = z.infer<typeof generalAnalysisResultSchema>;
export type JobFitAnalysisResult = z.infer<typeof jobFitAnalysisResultSchema>;
export type ShareCard = z.infer<typeof shareCardSchema>;
export type ParsedCv = z.infer<typeof parsedCvSchema>;
