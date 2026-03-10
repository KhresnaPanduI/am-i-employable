import { beforeEach, describe, expect, it, vi } from "vitest";

const { callOpenRouterJson } = vi.hoisted(() => ({
  callOpenRouterJson: vi.fn(),
}));

vi.mock("@/lib/openrouter", () => ({
  callOpenRouterJson,
  encodePdfDataUrl: (buffer: Buffer) => `data:application/pdf;base64,${buffer.toString("base64")}`,
}));

import { analyzeGeneralCv, analyzeGeneralCvFromPdf, analyzeJobFit, analyzeJobFitFromPdf } from "@/lib/analysis";

beforeEach(() => {
  callOpenRouterJson.mockReset();
});

describe("analysis helpers", () => {
  it("builds a general employability analysis request", async () => {
    callOpenRouterJson.mockResolvedValueOnce({ score: 78 });

    await analyzeGeneralCv({
      cvText: "Built product analytics systems with measurable business impact across experiments.",
      cvFileName: "resume.pdf",
    });

    expect(callOpenRouterJson).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "General employability analysis",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("resume.pdf"),
          }),
        ]),
      }),
    );
  });

  it("builds a PDF-based general analysis request with OCR plugin", async () => {
    callOpenRouterJson.mockResolvedValueOnce({ score: 61 });

    await analyzeGeneralCvFromPdf({
      cvFileName: "resume.pdf",
      pdfBuffer: Buffer.from("fake-pdf"),
    });

    expect(callOpenRouterJson).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "General employability analysis from PDF",
        plugins: [{ id: "file-parser", pdf: { engine: "mistral-ocr" } }],
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.arrayContaining([
              expect.objectContaining({ type: "text" }),
              expect.objectContaining({
                type: "file",
                file: expect.objectContaining({ filename: "resume.pdf" }),
              }),
            ]),
          }),
        ]),
      }),
    );
  });

  it("rejects a weak job-fit request before calling the model", async () => {
    await expect(
      analyzeJobFit({
        cvText: "Strong analytics generalist.",
        cvFileName: "resume.pdf",
        jobDescription: "Too short",
      }),
    ).rejects.toThrow();

    expect(callOpenRouterJson).not.toHaveBeenCalled();
  });

  it("builds a PDF-based job-fit request with OCR plugin", async () => {
    callOpenRouterJson.mockResolvedValueOnce({ score: 73 });

    await analyzeJobFitFromPdf({
      cvFileName: "resume.pdf",
      pdfBuffer: Buffer.from("fake-pdf"),
      jobDescription:
        "We need a product analyst who can own experimentation, run SQL deep dives, and influence product decisions across teams.",
    });

    expect(callOpenRouterJson).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Job fit analysis from PDF",
        plugins: [{ id: "file-parser", pdf: { engine: "mistral-ocr" } }],
      }),
    );
  });
});