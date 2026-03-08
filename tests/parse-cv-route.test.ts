import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/parse-cv/route";

async function createPdfFile(text?: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 400]);

  if (text) {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText(text, { x: 50, y: 300, size: 22, font });
  }

  const bytes = await pdf.save();
  return new File([bytes], "resume.pdf", { type: "application/pdf" });
}

describe("parse-cv route", () => {
  it("returns 400 when no file is uploaded", async () => {
    const formData = new FormData();
    const response = await POST(
      new Request("http://localhost/api/parse-cv", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
  });

  it("parses a valid pdf upload", async () => {
    const formData = new FormData();
    formData.append("file", await createPdfFile("Built AI workflows that shipped to production."));

    const response = await POST(
      new Request("http://localhost/api/parse-cv", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ text: expect.stringContaining("Built AI workflows") }),
    );
  });

  it("returns 400 for a blank pdf", async () => {
    const formData = new FormData();
    formData.append("file", await createPdfFile());

    const response = await POST(
      new Request("http://localhost/api/parse-cv", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
  });
});
