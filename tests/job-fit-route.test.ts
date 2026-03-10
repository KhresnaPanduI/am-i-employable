import { PDFDocument, StandardFonts } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeJobFit, analyzeJobFitFromPdf } = vi.hoisted(() => ({
  analyzeJobFit: vi.fn(),
  analyzeJobFitFromPdf: vi.fn(),
}));

vi.mock("@/lib/analysis", () => ({
  analyzeJobFit,
  analyzeJobFitFromPdf,
}));

import { POST } from "@/app/api/analyze/job-fit/route";

beforeEach(() => {
  analyzeJobFit.mockReset();
  analyzeJobFitFromPdf.mockReset();
});

async function createPdfFile(text: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 400]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 300, size: 22, font });
  return new File([await pdf.save()], "resume.pdf", { type: "application/pdf" });
}

describe("job-fit analyze route", () => {
  it("returns 400 when the job description is empty", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze/job-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText:
            "Senior data analyst with measurable ownership across experimentation and stakeholder communication.",
          cvFileName: "resume.pdf",
          jobDescription: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 502 when upstream model analysis fails", async () => {
    analyzeJobFit.mockRejectedValueOnce(new Error("OpenRouter timeout"));

    const response = await POST(
      new Request("http://localhost/api/analyze/job-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText:
            "Senior data analyst with measurable ownership across experimentation and stakeholder communication.",
          cvFileName: "resume.pdf",
          jobDescription:
            "We need a product analyst who can drive experimentation, own SQL analysis, and influence roadmap decisions.",
        }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "OpenRouter timeout" });
  });

  it("accepts multipart pdf requests for OCR fallback", async () => {
    analyzeJobFitFromPdf.mockResolvedValueOnce({ score: 74, verdict: "OCR job fit worked." });

    const formData = new FormData();
    formData.append("file", await createPdfFile("Image-style fallback CV"));
    formData.append(
      "jobDescription",
      "We need a product analyst who can own experimentation, run SQL analysis, and influence roadmap decisions across product teams.",
    );

    const response = await POST(
      new Request("http://localhost/api/analyze/job-fit", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(200);
    expect(analyzeJobFitFromPdf).toHaveBeenCalledTimes(1);
  });
});