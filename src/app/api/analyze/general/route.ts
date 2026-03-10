import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { analyzeGeneralCv, analyzeGeneralCvFromPdf } from "@/lib/analysis";
import { isPdfUpload } from "@/lib/pdf";
import { analyzeGeneralRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a PDF CV before running OCR fallback." }, { status: 400 });
    }

    if (!isPdfUpload(file.name, file.type)) {
      return NextResponse.json({ error: "OCR fallback only supports PDF uploads." }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Upload a PDF under 5 MB with readable pages." }, { status: 400 });
    }

    try {
      const result = await analyzeGeneralCvFromPdf({
        cvFileName: file.name,
        pdfBuffer: Buffer.from(await file.arrayBuffer()),
      });

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: error.issues[0]?.message ?? "Invalid OCR analysis request." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "The OCR diagnosis engine stalled. Try again in a moment.",
        },
        { status: 502 },
      );
    }
  }

  let payload;

  try {
    payload = analyzeGeneralRequestSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid analysis request." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Invalid analysis request." }, { status: 400 });
  }

  try {
    const result = await analyzeGeneralCv(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The diagnosis engine stalled. Try again in a moment.",
      },
      { status: 502 },
    );
  }
}