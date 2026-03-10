import { createRequire } from "node:module";

import { parsedCvSchema, type ParsedCv } from "@/lib/schemas";

const require = createRequire(import.meta.url);
const PAGE_MARKER_PATTERN = /--\s*\d+\s+of\s+\d+\s*--/gi;
const LOW_CONFIDENCE_CHAR_THRESHOLD = 320;
const globalPdfRuntime = globalThis as Record<string, unknown>;

type PdfParseModule = {
  PDFParse: new (options: { data: Buffer }) => {
    getText: () => Promise<{
      text: string;
      total: number;
    }>;
    destroy: () => Promise<void>;
  };
};

type CanvasRuntimeModule = {
  DOMMatrix?: unknown;
  ImageData?: unknown;
  Path2D?: unknown;
};

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

function ensureCanvasRuntime() {
  const needsDomMatrix = typeof globalPdfRuntime["DOMMatrix"] === "undefined";
  const needsImageData = typeof globalPdfRuntime["ImageData"] === "undefined";
  const needsPath2D = typeof globalPdfRuntime["Path2D"] === "undefined";

  if (!needsDomMatrix && !needsImageData && !needsPath2D) {
    return;
  }

  const canvas = require("@napi-rs/canvas") as CanvasRuntimeModule;

  if (needsDomMatrix && canvas.DOMMatrix) {
    globalPdfRuntime["DOMMatrix"] = canvas.DOMMatrix;
  }

  if (needsImageData && canvas.ImageData) {
    globalPdfRuntime["ImageData"] = canvas.ImageData;
  }

  if (needsPath2D && canvas.Path2D) {
    globalPdfRuntime["Path2D"] = canvas.Path2D;
  }
}

function loadPdfParseModule() {
  ensureCanvasRuntime();
  return require("pdf-parse") as PdfParseModule;
}

export function sanitizeExtractedText(rawText: string) {
  return rawText.replace(PAGE_MARKER_PATTERN, " ").replace(/\s+/g, " ").trim();
}

function getQualityWarning(text: string, pageCount: number) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const wordsPerPage = words / Math.max(pageCount, 1);

  if (text.length < LOW_CONFIDENCE_CHAR_THRESHOLD || wordsPerPage < 45) {
    return "The PDF text looks thin. Paste your CV text manually if the preview seems incomplete.";
  }

  return undefined;
}

export async function extractCvTextFromBuffer(buffer: Buffer): Promise<ParsedCv> {
  const { PDFParse } = loadPdfParseModule();
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = sanitizeExtractedText(result.text);
    const warning = getQualityWarning(text, result.total);

    if (!text) {
      throw new PdfExtractionError(
        "We could open the PDF, but it did not contain enough readable text.",
      );
    }

    return parsedCvSchema.parse({
      text,
      pageCount: result.total,
      quality: warning ? "low" : "ok",
      warning,
    });
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      throw error;
    }

    throw new PdfExtractionError(
      error instanceof Error
        ? error.message
        : "We couldn't parse that PDF. Try another file or paste the CV text.",
    );
  } finally {
    await parser.destroy();
  }
}

export function isPdfUpload(fileName: string, mimeType?: string) {
  return fileName.toLowerCase().endsWith(".pdf") || mimeType === "application/pdf";
}

