import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeJobFit } = vi.hoisted(() => ({
  analyzeJobFit: vi.fn(),
}));

vi.mock("@/lib/analysis", () => ({
  analyzeJobFit,
}));

import { POST } from "@/app/api/analyze/job-fit/route";

beforeEach(() => {
  analyzeJobFit.mockReset();
});

describe("job-fit analyze route", () => {
  it("returns 400 when the job description is empty", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze/job-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText:
            "Senior data analyst with measurable ownership across experimentation and stakeholder communication.",
          cvFileName: "resume.pdf",
          jobDescription: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 502 when upstream model analysis fails", async () => {
    analyzeJobFit.mockRejectedValueOnce(new Error("OpenRouter timeout"));

    const response = await POST(
      new Request("http://localhost/api/analyze/job-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText:
            "Senior data analyst with measurable ownership across experimentation and stakeholder communication.",
          cvFileName: "resume.pdf",
          jobDescription:
            "We need a product analyst who can drive experimentation, own SQL analysis, and influence roadmap decisions.",
        }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "OpenRouter timeout" });
  });
});