import { describe, expect, it } from "vitest";
import { candidateInput, jobInput } from "./routers";

describe("recruitment input validation", () => {
  it("rejects an inverted salary range for a job", () => {
    const result = jobInput.safeParse({
      title: "Sales Manager", location: "Dubai", salaryMin: 19000, salaryMax: 12000,
      description: "Lead a commercial team, manage a pipeline, and develop key accounts.",
      applicationUrl: "https://example.com/apply", status: "open",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete candidate-intake payload with a PDF CV", () => {
    const result = candidateInput.safeParse({
      language: "en", fullName: "Alex Morgan", preferredLocation: "Dubai", currentSalary: 12000,
      expectedSalary: 15000, yearsExperience: 5, noticePeriodDays: 30, desiredJobTitle: "Sales Manager",
      cvFile: { fileName: "alex-morgan.pdf", mimeType: "application/pdf", dataBase64: "dGVzdC1maWxlLWNvbnRlbnQ=" },
    });
    expect(result.success).toBe(true);
  });
});
