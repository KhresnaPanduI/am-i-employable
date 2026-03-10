import { z } from "zod";

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
import { callOpenRouterJson, encodePdfDataUrl } from "@/lib/openrouter";

const pdfAnalysisInputSchema = z.object({
  cvFileName: z.string().trim().min(1).max(120),
  pdfBuffer: z.instanceof(Buffer),
});

const pdfJobFitAnalysisInputSchema = pdfAnalysisInputSchema.extend({
  jobDescription: z.string().trim().min(60).max(12000),
});

const OCR_PLUGIN = [
  {
    id: "file-parser" as const,
    pdf: {
      engine: "mistral-ocr" as const,
    },
  },
];

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

export async function analyzeGeneralCvFromPdf(input: {
  cvFileName: string;
  pdfBuffer: Buffer;
}) {
  const payload = pdfAnalysisInputSchema.parse(input);

  return callOpenRouterJson({
    schema: generalAnalysisResultSchema,
    label: "General employability analysis from PDF",
    plugins: OCR_PLUGIN,
    messages: [
      {
        role: "system",
        content: generalSystemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this attached CV PDF for general interview-readiness. The file name is ${payload.cvFileName}. Use the PDF content as the source of truth and return the required JSON diagnosis.`,
          },
          {
            type: "file",
            file: {
              filename: payload.cvFileName,
              file_data: encodePdfDataUrl(payload.pdfBuffer),
            },
          },
        ],
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

export async function analyzeJobFitFromPdf(input: {
  cvFileName: string;
  pdfBuffer: Buffer;
  jobDescription: string;
}) {
  const payload = pdfJobFitAnalysisInputSchema.parse(input);

  return callOpenRouterJson({
    schema: jobFitAnalysisResultSchema,
    label: "Job fit analysis from PDF",
    plugins: OCR_PLUGIN,
    messages: [
      {
        role: "system",
        content: jobFitSystemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this attached CV PDF against the following job description and return the required JSON diagnosis. File name: ${payload.cvFileName}. Job description:\n${payload.jobDescription}`,
          },
          {
            type: "file",
            file: {
              filename: payload.cvFileName,
              file_data: encodePdfDataUrl(payload.pdfBuffer),
            },
          },
        ],
      },
    ],
  });
}