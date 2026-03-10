import { PDFDocument, StandardFonts } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeGeneralCv, analyzeGeneralCvFromPdf } = vi.hoisted(() => ({
  analyzeGeneralCv: vi.fn(),
  analyzeGeneralCvFromPdf: vi.fn(),
}));

vi.mock("@/lib/analysis", () => ({
  analyzeGeneralCv,
  analyzeGeneralCvFromPdf,
}));

import { POST } from "@/app/api/analyze/general/route";

beforeEach(() => {
  analyzeGeneralCv.mockReset();
  analyzeGeneralCvFromPdf.mockReset();
});

async function createPdfFile(text: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 400]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 300, size: 22, font });
  return new File([await pdf.save()], "resume.pdf", { type: "application/pdf" });
}

describe("general analyze route", () => {
  it("returns 400 for invalid request bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: "", cvFileName: "resume.pdf" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 502 when the model layer fails", async () => {
    analyzeGeneralCv.mockRejectedValueOnce(new Error("Malformed LLM JSON"));

    const response = await POST(
      new Request("http://localhost/api/analyze/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText:
            "Senior data analyst with measurable ownership across experimentation and stakeholder communication.",
          cvFileName: "resume.pdf",
        }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Malformed LLM JSON" });
  });

  it("accepts multipart pdf requests for OCR fallback", async () => {
    analyzeGeneralCvFromPdf.mockResolvedValueOnce({ score: 67, verdict: "OCR path worked." });

    const formData = new FormData();
    formData.append("file", await createPdfFile("Image-style fallback CV"));

    const response = await POST(
      new Request("http://localhost/api/analyze/general", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(200);
    expect(analyzeGeneralCvFromPdf).toHaveBeenCalledTimes(1);
  });
});