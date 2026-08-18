import { describe, expect, it, beforeEach, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createCandidate: vi.fn(),
  createCvFileRecord: vi.fn(),
  createJob: vi.fn(),
  deleteJob: vi.fn(),
  getCandidateWithMatches: vi.fn(),
  listCandidates: vi.fn(),
  listJobs: vi.fn(),
  logNotification: vi.fn(),
  replaceCandidateMatches: vi.fn(),
  replaceCandidateSkills: vi.fn(),
  updateCandidateExtraction: vi.fn(),
  updateCandidateStatus: vi.fn(),
  updateJob: vi.fn(),
  storagePut: vi.fn(),
  notifyOwner: vi.fn(),
  extractResumeText: vi.fn(),
  extractCandidateInformation: vi.fn(),
}));

vi.mock("./db", () => ({
  createCandidate: mocks.createCandidate,
  createCvFileRecord: mocks.createCvFileRecord,
  createJob: mocks.createJob,
  deleteJob: mocks.deleteJob,
  getCandidateWithMatches: mocks.getCandidateWithMatches,
  listCandidates: mocks.listCandidates,
  listJobs: mocks.listJobs,
  logNotification: mocks.logNotification,
  replaceCandidateMatches: mocks.replaceCandidateMatches,
  replaceCandidateSkills: mocks.replaceCandidateSkills,
  updateCandidateExtraction: mocks.updateCandidateExtraction,
  updateCandidateStatus: mocks.updateCandidateStatus,
  updateJob: mocks.updateJob,
}));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));
vi.mock("./cvExtraction", () => ({
  extractResumeText: mocks.extractResumeText,
  extractCandidateInformation: mocks.extractCandidateInformation,
}));

import { appRouter } from "./routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const payload = {
  language: "en" as const,
  fullName: "Alex Morgan",
  preferredLocation: "Dubai",
  currentSalary: 12000,
  expectedSalary: 15000,
  yearsExperience: 5,
  noticePeriodDays: 30,
  desiredJobTitle: "Sales Manager",
  cvFile: {
    fileName: "alex-morgan.pdf",
    mimeType: "application/pdf" as const,
    dataBase64: "dGVzdC1maWxlLWNvbnRlbnQ=",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createCandidate.mockResolvedValue(44);
  mocks.storagePut.mockResolvedValue({ key: "candidate-cvs/alex.pdf", url: "/manus-storage/candidate-cvs/alex.pdf" });
  mocks.notifyOwner.mockResolvedValue(true);
  mocks.listJobs.mockResolvedValue([
    { id: 7, title: "Sales Manager", location: "Dubai", salaryMin: 12000, salaryMax: 18000, description: "Manage CRM and Salesforce operations.", status: "open" },
  ]);
  mocks.extractResumeText.mockResolvedValue("Alex Morgan, Sales Manager, CRM, Salesforce");
  mocks.extractCandidateInformation.mockResolvedValue({ title: "Sales Manager", experienceYears: 5, skills: ["CRM", "Salesforce"] });
});

describe("candidateIntake.submit", () => {
  it("stores the CV, extracted skills, match records, and owner notification on success", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.candidateIntake.submit(payload);

    expect(result.candidateId).toBe(44);
    expect(result.matches[0]?.job.id).toBe(7);
    expect(mocks.createCvFileRecord).toHaveBeenCalledWith(expect.objectContaining({ candidateId: 44, fileName: "alex-morgan.pdf" }));
    expect(mocks.replaceCandidateSkills).toHaveBeenCalledWith(44, ["CRM", "Salesforce"]);
    expect(mocks.replaceCandidateMatches).toHaveBeenCalledWith(44, expect.arrayContaining([expect.objectContaining({ jobId: 7 })]));
    expect(mocks.logNotification).toHaveBeenCalledWith(expect.objectContaining({ candidateId: 44, eventType: "candidate_registered", delivered: true }));
  });

  it("marks extraction as failed but continues with deterministic matching when extraction fails", async () => {
    mocks.extractResumeText.mockRejectedValueOnce(new Error("Unreadable CV"));
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.candidateIntake.submit(payload);

    expect(result.extraction).toBeNull();
    expect(mocks.updateCandidateExtraction).toHaveBeenCalledWith(44, expect.objectContaining({ extractionStatus: "failed" }));
    expect(mocks.replaceCandidateMatches).toHaveBeenCalledWith(44, expect.any(Array));
  });
});
