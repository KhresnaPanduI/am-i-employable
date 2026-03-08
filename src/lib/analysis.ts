import {
  analyzeGeneralRequestSchema,
  analyzeJobFitRequestSchema,
  generalAnalysisResultSchema,
  jobFitAnalysisResultSchema,
  type AnalyzeGeneralRequest,
  type AnalyzeJobFitRequest,
} from "@/lib/schemas";
import {
  buildGeneralUserPrompt,
  buildJobFitUserPrompt,
  generalSystemPrompt,
  jobFitSystemPrompt,
} from "@/lib/prompts";
import { callOpenRouterJson } from "@/lib/openrouter";

export async function analyzeGeneralCv(input: AnalyzeGeneralRequest) {
  const payload = analyzeGeneralRequestSchema.parse(input);

  return callOpenRouterJson({
    schema: generalAnalysisResultSchema,
    label: "General employability analysis",
    messages: [
      {
        role: "system",
        content: generalSystemPrompt,
      },
      {
        role: "user",
        content: buildGeneralUserPrompt(payload),
      },
    ],
  });
}

export async function analyzeJobFit(input: AnalyzeJobFitRequest) {
  const payload = analyzeJobFitRequestSchema.parse(input);

  return callOpenRouterJson({
    schema: jobFitAnalysisResultSchema,
    label: "Job fit analysis",
    messages: [
      {
        role: "system",
        content: jobFitSystemPrompt,
      },
      {
        role: "user",
        content: buildJobFitUserPrompt(payload),
      },
    ],
  });
}
