import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { extractCvTextFromBuffer, PdfExtractionError } from "@/lib/pdf";

async function buildPdf(text?: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 400]);

  if (text) {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText(text, { x: 50, y: 300, size: 24, font });
  }

  return Buffer.from(await pdf.save());
}

describe("PDF extraction", () => {
  it("extracts text from a valid CV pdf", async () => {
    const pdfBuffer = await buildPdf("Built analytics workflows that shipped real business outcomes.");
    const parsed = await extractCvTextFromBuffer(pdfBuffer);

    expect(parsed.text).toContain("analytics workflows");
    expect(parsed.pageCount).toBe(1);
  });

  it("flags a blank pdf as unreadable", async () => {
    const pdfBuffer = await buildPdf();

    await expect(extractCvTextFromBuffer(pdfBuffer)).rejects.toBeInstanceOf(PdfExtractionError);
  });

  it("fails fast on invalid pdf bytes", async () => {
    await expect(
      extractCvTextFromBuffer(Buffer.from("not a real pdf")),
    ).rejects.toBeInstanceOf(PdfExtractionError);
  });
});
