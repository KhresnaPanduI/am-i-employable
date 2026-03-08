import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { analyzeGeneralCv } from "@/lib/analysis";
import { analyzeGeneralRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
