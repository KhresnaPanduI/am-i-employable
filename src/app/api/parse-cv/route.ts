import { NextResponse } from "next/server";

import { extractCvTextFromBuffer, isPdfUpload, PdfExtractionError } from "@/lib/pdf";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
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
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedCv = await extractCvTextFromBuffer(buffer);

    return NextResponse.json(parsedCv);
  } catch (error) {
    console.error("[parse-cv] Failed to extract PDF text", {
      fileName: file.name,
      fileSize: file.size,
      message: error instanceof Error ? error.message : String(error),
    });

    const message =
      error instanceof PdfExtractionError
        ? error.message
        : "We couldn't read that PDF. Paste your CV text manually and try again.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}