import { NextResponse } from "next/server";

import { extractCvTextFromBuffer, isPdfUpload, PdfExtractionError } from "@/lib/pdf";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function getStackPreview(error: unknown) {
  if (!(error instanceof Error) || !error.stack) {
    return undefined;
  }

  return error.stack.split("\n").slice(0, 4).join("\n");
}

export async function POST(request: Request) {
  let routeStage = "read-form-data";
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Upload a PDF CV before running the diagnosis." },
      { status: 400 },
    );
  }

  if (!isPdfUpload(file.name, file.type)) {
    return NextResponse.json(
      { error: "Only PDF CV uploads are supported in v1." },
      { status: 400 },
    );
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Upload a PDF under 5 MB with readable text." },
      { status: 400 },
    );
  }

  try {
    routeStage = "read-array-buffer";
    const buffer = Buffer.from(await file.arrayBuffer());

    routeStage = "extract-cv-text";
    const parsedCv = await extractCvTextFromBuffer(buffer);

    return NextResponse.json(parsedCv);
  } catch (error) {
    console.error("[parse-cv] Failed to extract PDF text", {
      routeStage,
      extractionStage: error instanceof PdfExtractionError ? error.stage : undefined,
      causeMessage: error instanceof PdfExtractionError ? error.causeMessage : undefined,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      message: error instanceof Error ? error.message : String(error),
      stackPreview: getStackPreview(error),
    });

    const message =
      error instanceof PdfExtractionError
        ? error.message
        : "We couldn't read that PDF. Paste your CV text manually and try again.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
