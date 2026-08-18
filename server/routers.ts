import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { calculateJobMatches } from "../shared/matching";
import {
  createCvFileRecord,
  createCandidate,
  createJob,
  deleteJob,
  getCandidateWithMatches,
  listCandidates,
  listJobs,
  logNotification,
  replaceCandidateMatches,
  replaceCandidateSkills,
  updateCandidateExtraction,
  updateCandidateStatus,
  updateJob,
} from "./db";
import { extractCandidateInformation, extractResumeText, type ResumeExtraction } from "./cvExtraction";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";

export const jobInput = z
  .object({
    title: z.string().trim().min(2).max(180),
    location: z.string().trim().min(2).max(180),
    salaryMin: z.number().int().min(0),
    salaryMax: z.number().int().min(0),
    description: z.string().trim().min(20).max(20000),
    applicationUrl: z.string().url().max(2048),
    status: z.enum(["open", "closed"]).default("open"),
  })
  .refine(data => data.salaryMax >= data.salaryMin, {
    message: "يجب أن يكون الحد الأعلى للراتب أكبر من أو مساويًا للحد الأدنى.",
    path: ["salaryMax"],
  });

export const candidateInput = z.object({
  language: z.enum(["ar", "en"]).default("ar"),
  fullName: z.string().trim().min(2).max(180),
  preferredLocation: z.string().trim().min(2).max(180),
  currentSalary: z.number().int().min(0),
  expectedSalary: z.number().int().min(0),
  yearsExperience: z.number().int().min(0).max(60),
  noticePeriodDays: z.number().int().min(0).max(365),
  desiredJobTitle: z.string().trim().min(2).max(180),
  cvFile: z.object({
    fileName: z.string().trim().min(3).max(255),
    mimeType: z.enum([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
    dataBase64: z.string().min(20).max(14_000_000),
  }),
});

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 160);
}

function createCsv(rows: string[][]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return `\uFEFF${rows.map(row => row.map(escape).join(",")).join("\n")}`;
}

function formatDate(value: Date) {
  return value.toISOString();
}

export const appRouter = router({
  system: router({}),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  jobs: router({
    list: adminProcedure.input(z.object({ search: z.string().trim().max(180) }).optional()).query(({ input }) => listJobs(true, input?.search)),
    create: adminProcedure.input(jobInput).mutation(async ({ input }) => {
      const id = await createJob(input);
      return { id };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: jobInput })).mutation(async ({ input }) => {
      await updateJob(input.id, input.data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await deleteJob(input.id);
      return { success: true };
    }),
  }),

  candidates: router({
    list: adminProcedure.query(() => listCandidates()),
    detail: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const record = await getCandidateWithMatches(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "المرشح غير موجود." });
      return record;
    }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "reviewing", "matched", "contacted"]) }))
      .mutation(async ({ input }) => {
        await updateCandidateStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  exports: router({
    jobsCsv: adminProcedure.input(z.object({ language: z.enum(["ar", "en"]) }).optional()).query(async ({ input }) => {
      const records = await listJobs();
      const headers = input?.language === "en"
        ? ["ID", "Job title", "Location", "Minimum salary", "Maximum salary", "Status", "Application URL", "Created at"]
        : ["ID", "المسمى الوظيفي", "الموقع", "الحد الأدنى للراتب", "الحد الأعلى للراتب", "الحالة", "رابط التقديم", "تاريخ الإنشاء"];
      return createCsv([
        headers,
        ...records.map(job => [
          String(job.id), job.title, job.location, String(job.salaryMin), String(job.salaryMax), job.status, job.applicationUrl, formatDate(job.createdAt),
        ]),
      ]);
    }),
    candidatesCsv: adminProcedure.input(z.object({ language: z.enum(["ar", "en"]) }).optional()).query(async ({ input }) => {
      const records = await listCandidates();
      const headers = input?.language === "en"
        ? ["ID", "Name", "Desired title", "Preferred location", "Current salary", "Expected salary", "Years of experience", "Notice period (days)", "Candidate status", "CV extraction status", "Skills", "Registered at"]
        : ["ID", "الاسم", "المسمى المطلوب", "الموقع المفضل", "الراتب الحالي", "الراتب المتوقع", "سنوات الخبرة", "فترة الإشعار (يوم)", "حالة المرشح", "حالة استخراج السيرة", "المهارات", "تاريخ التسجيل"];
      return createCsv([
        headers,
        ...records.map(candidate => [
          String(candidate.id), candidate.fullName, candidate.desiredJobTitle, candidate.preferredLocation,
          String(candidate.currentSalary), String(candidate.expectedSalary), String(candidate.yearsExperience),
          String(candidate.noticePeriodDays), candidate.status, candidate.extractionStatus,
          candidate.skillsJson ?? "", formatDate(candidate.createdAt),
        ]),
      ]);
    }),
  }),

  candidateIntake: router({
    submit: publicProcedure.input(candidateInput).mutation(async ({ input }) => {
      const localized = (arabic: string, english: string) => input.language === "en" ? english : arabic;
      const fileBuffer = Buffer.from(input.cvFile.dataBase64, "base64");
      if (!fileBuffer.length || fileBuffer.length > 10 * 1024 * 1024) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: localized("يجب ألا يتجاوز حجم ملف السيرة الذاتية 10 ميغابايت.", "The CV file must not exceed 10 MB.") });
      }

      const uploaded = await storagePut(
        `candidate-cvs/${Date.now()}-${safeFileName(input.cvFile.fileName)}`,
        fileBuffer,
        input.cvFile.mimeType,
      );

      const candidateId = await createCandidate({
        fullName: input.fullName,
        preferredLocation: input.preferredLocation,
        currentSalary: input.currentSalary,
        expectedSalary: input.expectedSalary,
        yearsExperience: input.yearsExperience,
        noticePeriodDays: input.noticePeriodDays,
        desiredJobTitle: input.desiredJobTitle,
        cvFileKey: uploaded.key,
        cvFileName: input.cvFile.fileName,
        cvFileUrl: uploaded.url,
        cvMimeType: input.cvFile.mimeType,
        extractionStatus: "processing",
      });

      if (!candidateId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: localized("تعذر حفظ بيانات المرشح.", "Unable to save candidate details.") });

      await createCvFileRecord({ candidateId, fileKey: uploaded.key, fileName: input.cvFile.fileName, fileUrl: uploaded.url, mimeType: input.cvFile.mimeType });
      const notificationTitle = "مرشح جديد";
      const notificationContent = `تم تسجيل المرشح ${input.fullName} وإرفاق سيرته الذاتية.`;
      const notificationDelivered = await notifyOwner({ title: notificationTitle, content: notificationContent });
      await logNotification({ candidateId, eventType: "candidate_registered", title: notificationTitle, content: notificationContent, delivered: notificationDelivered });

      let extraction: ResumeExtraction | null = null;
      try {
        const resumeText = await extractResumeText(fileBuffer, input.cvFile.mimeType);
        extraction = await extractCandidateInformation(resumeText);
        await updateCandidateExtraction(candidateId, {
          extractionStatus: "completed",
          extractedTitle: extraction.title,
          extractedExperienceYears: extraction.experienceYears,
          skillsJson: JSON.stringify(extraction.skills),
        });
        await replaceCandidateSkills(candidateId, extraction.skills);
      } catch (error) {
        console.error("[CV extraction]", error);
        await updateCandidateExtraction(candidateId, {
          extractionStatus: "failed",
          extractedTitle: null,
          extractedExperienceYears: null,
          skillsJson: null,
        });
      }

      const openJobs = await listJobs(false);
      const rankedMatches = calculateJobMatches(
        {
          desiredJobTitle: extraction?.title && extraction.title !== "غير محدد" ? extraction.title : input.desiredJobTitle,
          preferredLocation: input.preferredLocation,
          expectedSalary: input.expectedSalary,
          yearsExperience: extraction?.experienceYears || input.yearsExperience,
          noticePeriodDays: input.noticePeriodDays,
          skills: extraction?.skills,
        },
        openJobs,
      );
      await replaceCandidateMatches(candidateId, rankedMatches);

      const jobsById = new Map(openJobs.map(job => [job.id, job]));
      return {
        candidateId,
        extraction,
        matches: rankedMatches
          .map(match => ({ ...match, job: jobsById.get(match.jobId) }))
          .filter((match): match is typeof match & { job: NonNullable<typeof match.job> } => Boolean(match.job)),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
