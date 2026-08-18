import { describe, expect, it } from "vitest";
import { calculateJobMatches } from "../shared/matching";

const candidate = {
  desiredJobTitle: "Sales Manager",
  preferredLocation: "Dubai",
  expectedSalary: 15000,
  yearsExperience: 6,
  noticePeriodDays: 30,
  skills: ["CRM", "Salesforce"],
};

describe("calculateJobMatches", () => {
  it("ranks a role with title, location, salary, and skill alignment first", () => {
    const matches = calculateJobMatches(candidate, [
      { id: 1, title: "Sales Manager", location: "Dubai", salaryMin: 12000, salaryMax: 18000, description: "Lead CRM and Salesforce sales operations." },
      { id: 2, title: "Backend Engineer", location: "Berlin", salaryMin: 12000, salaryMax: 18000, description: "Develop API services in TypeScript." },
    ]);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.jobId).toBe(1);
    expect(matches[0]?.score).toBeGreaterThanOrEqual(90);
    expect(matches[0]?.reasons).toContain("title_exact");
  });

  it("does not recommend a salary-compatible role with no profile relevance", () => {
    const matches = calculateJobMatches(candidate, [
      { id: 9, title: "Backend Engineer", location: "Berlin", salaryMin: 12000, salaryMax: 18000, description: "Develop API services in TypeScript." },
    ]);

    expect(matches).toEqual([]);
  });
});
