import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  candidateSkills,
  candidates,
  cvFiles,
  InsertCandidate,
  InsertJob,
  InsertUser,
  jobMatches,
  jobs,
  notificationLogs,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await requireDb();
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach(field => {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  });

  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listJobs(includeClosed = true, search = "") {
  const db = await requireDb();
  const normalizedSearch = search.trim();
  const searchCondition = normalizedSearch
    ? or(like(jobs.title, `%${normalizedSearch}%`), like(jobs.location, `%${normalizedSearch}%`), like(jobs.description, `%${normalizedSearch}%`))
    : undefined;
  const statusCondition = includeClosed ? undefined : eq(jobs.status, "open");
  const filter = statusCondition && searchCondition ? and(statusCondition, searchCondition) : statusCondition ?? searchCondition;
  const query = db.select().from(jobs);
  return filter ? query.where(filter).orderBy(desc(jobs.createdAt)) : query.orderBy(desc(jobs.createdAt));
}

export async function createJob(data: InsertJob) {
  const db = await requireDb();
  const created = await db.insert(jobs).values(data).$returningId();
  return created[0]?.id;
}

export async function updateJob(jobId: number, data: Partial<InsertJob>) {
  const db = await requireDb();
  await db.update(jobs).set(data).where(eq(jobs.id, jobId));
}

export async function deleteJob(jobId: number) {
  const db = await requireDb();
  await db.delete(jobs).where(eq(jobs.id, jobId));
}

export async function getOpenJobsByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const db = await requireDb();
  return db.select().from(jobs).where(inArray(jobs.id, ids));
}

export async function listCandidates() {
  const db = await requireDb();
  return db.select().from(candidates).orderBy(desc(candidates.createdAt));
}

export async function getCandidateWithMatches(candidateId: number) {
  const db = await requireDb();
  const candidate = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  if (!candidate[0]) return undefined;

  const matches = await db
    .select({
      id: jobMatches.id,
      score: jobMatches.score,
      reasonsJson: jobMatches.reasonsJson,
      createdAt: jobMatches.createdAt,
      job: jobs,
    })
    .from(jobMatches)
    .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
    .where(eq(jobMatches.candidateId, candidateId))
    .orderBy(desc(jobMatches.score));

  return { candidate: candidate[0], matches };
}

export async function createCandidate(data: InsertCandidate) {
  const db = await requireDb();
  const created = await db.insert(candidates).values(data).$returningId();
  return created[0]?.id;
}

export async function updateCandidateExtraction(
  candidateId: number,
  data: Pick<InsertCandidate, "extractionStatus" | "extractedTitle" | "extractedExperienceYears" | "skillsJson">,
) {
  const db = await requireDb();
  await db.update(candidates).set(data).where(eq(candidates.id, candidateId));
}

export async function updateCandidateStatus(candidateId: number, status: "new" | "reviewing" | "matched" | "contacted") {
  const db = await requireDb();
  await db.update(candidates).set({ status }).where(eq(candidates.id, candidateId));
}

export async function replaceCandidateSkills(candidateId: number, skills: string[]) {
  const db = await requireDb();
  await db.delete(candidateSkills).where(eq(candidateSkills.candidateId, candidateId));
  const uniqueSkills = Array.from(new Set(skills.map(skill => skill.trim()).filter(Boolean))).slice(0, 20);
  if (uniqueSkills.length > 0) {
    await db.insert(candidateSkills).values(uniqueSkills.map(skill => ({ candidateId, skill })));
  }
}

export async function createCvFileRecord(data: { candidateId: number; fileKey: string; fileName: string; fileUrl: string; mimeType: string }) {
  const db = await requireDb();
  await db.insert(cvFiles).values(data);
}

export async function logNotification(data: { candidateId?: number; eventType: string; title: string; content: string; delivered: boolean }) {
  const db = await requireDb();
  await db.insert(notificationLogs).values({
    candidateId: data.candidateId,
    eventType: data.eventType,
    title: data.title,
    content: data.content,
    delivered: data.delivered ? 1 : 0,
  });
}

export async function replaceCandidateMatches(
  candidateId: number,
  matches: Array<{ jobId: number; score: number; reasons: string[] }>,
) {
  const db = await requireDb();
  await db.delete(jobMatches).where(eq(jobMatches.candidateId, candidateId));
  if (matches.length > 0) {
    await db.insert(jobMatches).values(
      matches.map(match => ({
        candidateId,
        jobId: match.jobId,
        score: match.score,
        reasonsJson: JSON.stringify(match.reasons),
      })),
    );
  }
  await db
    .update(candidates)
    .set({ status: matches.length > 0 ? "matched" : "new" })
    .where(eq(candidates.id, candidateId));
}
