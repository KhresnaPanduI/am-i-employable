export type NormalizationDiff = {
  path: string;
  kind: "string-truncated" | "array-truncated";
  beforeLength: number;
  afterLength: number;
  beforePreview: string;
  afterPreview: string;
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function previewValue(value: unknown, max = 120) {
  const serialized = typeof value === "string" ? normalizeText(value) : JSON.stringify(value);

  if (!serialized) {
    return "";
  }

  return serialized.length > max ? `${serialized.slice(0, max)}...` : serialized;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function collectNormalizationDiffs(
  raw: unknown,
  normalized: unknown,
  path = "$",
): NormalizationDiff[] {
  if (typeof raw === "string" && typeof normalized === "string") {
    const compactRaw = normalizeText(raw);

    if (compactRaw.length > normalized.length && compactRaw.startsWith(normalized)) {
      return [
        {
          path,
          kind: "string-truncated",
          beforeLength: compactRaw.length,
          afterLength: normalized.length,
          beforePreview: previewValue(compactRaw),
          afterPreview: previewValue(normalized),
        },
      ];
    }

    return [];
  }

  if (Array.isArray(raw) && Array.isArray(normalized)) {
    const diffs: NormalizationDiff[] = [];

    if (raw.length > normalized.length) {
      diffs.push({
        path,
        kind: "array-truncated",
        beforeLength: raw.length,
        afterLength: normalized.length,
        beforePreview: previewValue(raw),
        afterPreview: previewValue(normalized),
      });
    }

    const sharedLength = Math.min(raw.length, normalized.length);
    for (let index = 0; index < sharedLength; index += 1) {
      diffs.push(...collectNormalizationDiffs(raw[index], normalized[index], `${path}[${index}]`));
    }

    return diffs;
  }

  if (isPlainObject(raw) && isPlainObject(normalized)) {
    const diffs: NormalizationDiff[] = [];

    for (const key of Object.keys(raw)) {
      if (!(key in normalized)) {
        continue;
      }

      const nextPath = path === "$" ? `$.${key}` : `${path}.${key}`;
      diffs.push(...collectNormalizationDiffs(raw[key], normalized[key], nextPath));
    }

    return diffs;
  }

  return [];
}
