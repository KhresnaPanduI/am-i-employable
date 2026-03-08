import { beforeEach, describe, expect, it, vi } from "vitest";

const { callOpenRouterJson } = vi.hoisted(() => ({
  callOpenRouterJson: vi.fn(),
}));

vi.mock("@/lib/openrouter", () => ({
  callOpenRouterJson,
}));

import { analyzeGeneralCv, analyzeJobFit } from "@/lib/analysis";

beforeEach(() => {
  callOpenRouterJson.mockReset();
});

describe("analysis helpers", () => {
  it("builds a general employability analysis request", async () => {
    callOpenRouterJson.mockResolvedValueOnce({ score: 78 });

    await analyzeGeneralCv({
      cvText: "Built product analytics systems with measurable business impact across experiments.",
      cvFileName: "resume.pdf",
    });

    expect(callOpenRouterJson).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "General employability analysis",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("resume.pdf"),
          }),
        ]),
      }),
    );
  });

  it("rejects a weak job-fit request before calling the model", async () => {
    await expect(
      analyzeJobFit({
        cvText: "Strong analytics generalist.",
        cvFileName: "resume.pdf",
        jobDescription: "Too short",
      }),
    ).rejects.toThrow();

    expect(callOpenRouterJson).not.toHaveBeenCalled();
  });
});