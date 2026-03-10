import { describe, expect, it } from "vitest";

import {
  buildManualPasteAfterFallbackFailure,
  buildOcrFallbackNotice,
  stripManualPasteInstruction,
} from "@/lib/pdf-fallback";

describe("pdf fallback messaging", () => {
  it("removes the manual paste instruction from parse failures during fallback", () => {
    expect(
      stripManualPasteInstruction(
        "We couldn't read that PDF. Paste your CV text manually and try again.",
      ),
    ).toBe("We couldn't read that PDF.");
  });

  it("uses an OCR fallback notice without telling the user to paste manually", () => {
    expect(
      buildOcrFallbackNotice(
        "We couldn't read that PDF. Paste your CV text manually and try again.",
      ),
    ).toBe("We couldn't read that PDF. Trying OCR fallback automatically.");
  });

  it("only tells the user to paste manually after OCR fallback also fails", () => {
    expect(
      buildManualPasteAfterFallbackFailure(
        "We couldn't read that PDF. Paste your CV text manually and try again.",
        "OpenRouter timeout",
      ),
    ).toBe(
      "We couldn't read that PDF. OCR fallback also failed. OpenRouter timeout. Paste your CV text manually and try again.",
    );
  });
});
