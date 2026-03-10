import { z } from "zod";

const trimmedString = (label: string, min = 1, max = 280) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const boundedStringArray = (
  label: string,
  { min, max, itemMax }: { min: number; max: number; itemMax: number },
) =>
  z
    .array(z.string())
    .transform((items) =>
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, max),
    )
    .pipe(
      z
        .array(trimmedString(label, 1, itemMax))
        .min(min, `Provide at least ${min} ${label.toLowerCase()}${min > 1 ? "s" : ""}.`)
        .max(max, `Provide at most ${max} ${label.toLowerCase()}${max > 1 ? "s" : ""}.`),
    );

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
  survivalTips: boundedStringArray("Survival tip", { min: 2, max: 3, itemMax: 140 }),
  rewrite: z.object({
    professionalSummary: trimmedString("Professional summary", 40, 500),
    experienceBullets: boundedStringArray("Experience bullet", {
      min: 3,
      max: 4,
      itemMax: 180,
    }),
    skillsSection: boundedStringArray("Skill", { min: 4, max: 8, itemMax: 60 }),
  }),
  shareCard: shareCardSchema,
});

export const jobFitAnalysisResultSchema = z.object({
  score: scoreSchema,
  verdict: trimmedString("Verdict", 1, 140),
  alignment: z.object({
    strong: boundedStringArray("Strong alignment skill", { min: 0, max: 6, itemMax: 80 }),
    partial: boundedStringArray("Partial alignment skill", { min: 0, max: 6, itemMax: 80 }),
    missing: boundedStringArray("Missing skill", { min: 0, max: 6, itemMax: 80 }),
    missingKeywords: boundedStringArray("Missing keyword", { min: 0, max: 6, itemMax: 80 }),
  }),
  gapAnalysis: trimmedString("Gap analysis", 60, 600),
  rewrite: z.object({
    professionalSummary: trimmedString("Professional summary", 40, 500),
    experienceBullets: boundedStringArray("Experience bullet", {
      min: 3,
      max: 4,
      itemMax: 180,
    }),
    keywordAdditions: boundedStringArray("Keyword addition", {
      min: 3,
      max: 6,
      itemMax: 100,
    }),
    sectionReorder: boundedStringArray("Section reorder note", {
      min: 2,
      max: 4,
      itemMax: 120,
    }),
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