import { describe, expect, it } from "vitest";

import { collectNormalizationDiffs } from "@/lib/output-diagnostics";

describe("output diagnostics", () => {
  it("detects string truncation caused by schema normalization", () => {
    const diffs = collectNormalizationDiffs(
      {
        verdict:
          "A brilliant engineer with a stellar technical portfolio, but missing the critical, explicit GCP experience this role demands for immediate success.",
      },
      {
        verdict:
          "A brilliant engineer with a stellar technical portfolio, but missing the critical, explicit GCP experience this role demands for immediate s",
      },
    );

    const verdictDiff = diffs.find((diff) => diff.path === "$.verdict");

    expect(verdictDiff).toMatchObject({
      path: "$.verdict",
      kind: "string-truncated",
      afterLength: 140,
    });
    expect(verdictDiff?.beforeLength).toBeGreaterThan(verdictDiff?.afterLength ?? 0);
  });

  it("detects array truncation and nested item truncation", () => {
    const diffs = collectNormalizationDiffs(
      {
        alignment: {
          strong: [
            "Extensive experience architecting, deploying, and scaling production AI/ML solutions across distributed systems.",
            "Deep hands-on expertise in generative AI, agentic systems, and orchestration frameworks.",
            "Proven ability to transform AI experiments into production-ready systems with measurable outcomes.",
            "Strong Python proficiency and collaborative development experience in professional environments.",
            "Fifth item that should be dropped entirely.",
          ],
        },
      },
      {
        alignment: {
          strong: [
            "Extensive experience architecting, deploying, and scaling production AI/ML solutions a",
            "Deep hands-on expertise in generative AI, agentic systems, and orchestration fram",
            "Proven ability to transform AI experiments into production-ready systems with measu",
            "Strong Python proficiency and collaborative development experience in professional e",
          ],
        },
      },
    );

    const arrayDiff = diffs.find((diff) => diff.path === "$.alignment.strong");
    const firstItemDiff = diffs.find((diff) => diff.path === "$.alignment.strong[0]");

    expect(arrayDiff).toMatchObject({
      path: "$.alignment.strong",
      kind: "array-truncated",
      beforeLength: 5,
      afterLength: 4,
    });
    expect(firstItemDiff).toMatchObject({
      path: "$.alignment.strong[0]",
      kind: "string-truncated",
    });
    expect(firstItemDiff?.beforeLength).toBeGreaterThan(firstItemDiff?.afterLength ?? 0);
  });
});
