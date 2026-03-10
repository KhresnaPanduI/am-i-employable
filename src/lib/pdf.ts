import { createRequire } from "node:module";

import { parsedCvSchema, type ParsedCv } from "@/lib/schemas";

const require = createRequire(import.meta.url);
const PAGE_MARKER_PATTERN = /--\s*\d+\s+of\s+\d+\s*--/gi;
const LOW_CONFIDENCE_CHAR_THRESHOLD = 320;
const globalPdfRuntime = globalThis as Record<string, unknown>;

export type PdfExtractionStage =
  | "ensure-canvas-runtime"
  | "load-pdf-parse-module"
  | "create-parser"
  | "extract-text";

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
  stage?: PdfExtractionStage;
  causeMessage?: string;

  constructor(
    message: string,
    options?: { stage?: PdfExtractionStage; cause?: unknown },
  ) {
    super(message);
    this.name = "PdfExtractionError";
    this.stage = options?.stage;
    this.causeMessage =
      options?.cause instanceof Error ? options.cause.message : undefined;
  }
}

function ensureCanvasRuntime() {
  const needsDomMatrix = typeof globalPdfRuntime["DOMMatrix"] === "undefined";
  const needsImageData = typeof globalPdfRuntime["ImageData"] === "undefined";
  const needsPath2D = typeof globalPdfRuntime["Path2D"] === "undefined";

  if (!needsDomMatrix && !needsImageData && !needsPath2D) {
    return;
  }

  let canvas: CanvasRuntimeModule;

  try {
    canvas = require("@napi-rs/canvas") as CanvasRuntimeModule;
  } catch (error) {
    throw new PdfExtractionError("Failed to initialize the PDF canvas runtime.", {
      stage: "ensure-canvas-runtime",
      cause: error,
    });
  }

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

  try {
    return require("pdf-parse") as PdfParseModule;
  } catch (error) {
    throw new PdfExtractionError("Failed to load the PDF parsing module.", {
      stage: "load-pdf-parse-module",
      cause: error,
    });
  }
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
  let parser: InstanceType<PdfParseModule["PDFParse"]> | null = null;

  try {
    parser = new PDFParse({ data: buffer });
  } catch (error) {
    throw new PdfExtractionError("Failed to create the PDF parser instance.", {
      stage: "create-parser",
      cause: error,
    });
  }

  try {
    const result = await parser.getText();
    const text = sanitizeExtractedText(result.text);
    const warning = getQualityWarning(text, result.total);

    if (!text) {
      throw new PdfExtractionError(
        "We could open the PDF, but it did not contain enough readable text.",
        { stage: "extract-text" },
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
      {
        stage: "extract-text",
        cause: error,
      },
    );
  } finally {
    if (parser) {
      await parser.destroy().catch((destroyError) => {
        console.warn("[pdf] Failed to destroy parser instance", {
          message:
            destroyError instanceof Error
              ? destroyError.message
              : String(destroyError),
        });
      });
    }
  }
}

export function isPdfUpload(fileName: string, mimeType?: string) {
  return fileName.toLowerCase().endsWith(".pdf") || mimeType === "application/pdf";
}
