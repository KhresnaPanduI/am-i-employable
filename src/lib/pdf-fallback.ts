function toSentence(message: string) {
  return message.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
}

export function stripManualPasteInstruction(message: string) {
  return message.replace(/\s*Paste your CV text manually and try again\.?/i, "").trim();
}

export function buildOcrFallbackNotice(message?: string) {
  const summary = toSentence(
    stripManualPasteInstruction(message ?? "We couldn't read that PDF locally."),
  );

  return `${summary}. Trying OCR fallback automatically.`;
}

export function buildManualPasteAfterFallbackFailure(
  parseMessage?: string,
  ocrMessage?: string,
) {
  const parseSummary = toSentence(
    stripManualPasteInstruction(parseMessage ?? "We couldn't finish reading that PDF automatically."),
  );
  const ocrSummary = ocrMessage ? `${toSentence(ocrMessage)}. ` : "";

  return `${parseSummary}. OCR fallback also failed. ${ocrSummary}Paste your CV text manually and try again.`;
}
