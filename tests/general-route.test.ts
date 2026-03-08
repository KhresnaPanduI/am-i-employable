import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeGeneralCv } = vi.hoisted(() => ({
  analyzeGeneralCv: vi.fn(),
}));

vi.mock("@/lib/analysis", () => ({
  analyzeGeneralCv,
}));

import { POST } from "@/app/api/analyze/general/route";

beforeEach(() => {
  analyzeGeneralCv.mockReset();
});

describe("general analyze route", () => {
  it("returns 400 for invalid request bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: "", cvFileName: "resume.pdf" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 502 when the model layer fails", async () => {
    analyzeGeneralCv.mockRejectedValueOnce(new Error("Malformed LLM JSON"));

    const response = await POST(
      new Request("http://localhost/api/analyze/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText:
            "Senior data analyst with measurable ownership across experimentation and stakeholder communication.",
          cvFileName: "resume.pdf",
        }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Malformed LLM JSON" });
  });
});