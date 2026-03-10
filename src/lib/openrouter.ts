import { ZodType } from "zod";

import { collectNormalizationDiffs } from "@/lib/output-diagnostics";

type OpenRouterTextPart = {
  type: "text";
  text: string;
};

type OpenRouterFilePart = {
  type: "file";
  file: {
    filename: string;
    file_data: string;
  };
};

export type OpenRouterContentPart = OpenRouterTextPart | OpenRouterFilePart;

export type OpenRouterMessage = {
  role: "system" | "user";
  content: string | OpenRouterContentPart[];
};

type OpenRouterPlugin = {
  id: "file-parser";
  pdf: {
    engine: "pdf-text" | "mistral-ocr" | "native";
  };
};

type CallOpenRouterJsonOptions<T> = {
  schema: ZodType<T>;
  messages: OpenRouterMessage[];
  label: string;
  plugins?: OpenRouterPlugin[];
  temperature?: number;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function requireEnv(name: "OPENROUTER_API_KEY" | "OPENROUTER_MODEL") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalHeaders() {
  const referer =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return {
    ...(referer ? { "HTTP-Referer": referer } : {}),
    "X-Title": "How Employable Am I?",
  };
}

function readMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) =>
        typeof item === "object" &&
        item !== null &&
        "text" in item &&
        typeof item.text === "string"
          ? item.text
          : "",
      )
      .join("\n");
  }

  return "";
}

function stripCodeFence(raw: string) {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractJsonPayload(raw: string) {
  const cleaned = stripCodeFence(raw);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function getChoiceFinishReason(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "choices" in payload &&
    Array.isArray(payload.choices) &&
    payload.choices[0] &&
    typeof payload.choices[0] === "object" &&
    payload.choices[0] !== null &&
    "finish_reason" in payload.choices[0] &&
    typeof payload.choices[0].finish_reason === "string"
  ) {
    return payload.choices[0].finish_reason;
  }

  return undefined;
}

export function encodePdfDataUrl(buffer: Buffer) {
  return `data:application/pdf;base64,${buffer.toString("base64")}`;
}

export async function callOpenRouterJson<T>({
  schema,
  messages,
  label,
  plugins,
  temperature = 0.8,
}: CallOpenRouterJsonOptions<T>) {
  const apiKey = requireEnv("OPENROUTER_API_KEY");
  const model = requireEnv("OPENROUTER_MODEL");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...getOptionalHeaders(),
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: {
        type: "json_object",
      },
      messages,
      ...(plugins ? { plugins } : {}),
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `${label} request failed with status ${response.status}.`;

    throw new Error(errorMessage);
  }

  const rawContent =
    payload &&
    typeof payload === "object" &&
    "choices" in payload &&
    Array.isArray(payload.choices) &&
    payload.choices[0] &&
    typeof payload.choices[0] === "object" &&
    payload.choices[0] !== null &&
    "message" in payload.choices[0] &&
    typeof payload.choices[0].message === "object" &&
    payload.choices[0].message !== null &&
    "content" in payload.choices[0].message
      ? readMessageContent(payload.choices[0].message.content)
      : "";

  if (!rawContent) {
    throw new Error(`${label} returned an empty response.`);
  }

  const parsed = JSON.parse(extractJsonPayload(rawContent));
  const normalized = schema.parse(parsed);
  const finishReason = getChoiceFinishReason(payload);
  const normalizationDiffs = collectNormalizationDiffs(parsed, normalized);

  if (finishReason === "length" || normalizationDiffs.length > 0) {
    console.warn("[openrouter] Output diagnostics", {
      label,
      model,
      finishReason,
      rawContentLength: rawContent.length,
      normalizationDiffCount: normalizationDiffs.length,
      normalizationDiffs: normalizationDiffs.slice(0, 12),
    });
  }

  return normalized;
}
