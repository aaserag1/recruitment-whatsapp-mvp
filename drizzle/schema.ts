import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  location: varchar("location", { length: 180 }).notNull(),
  salaryMin: int("salaryMin").notNull(),
  salaryMax: int("salaryMax").notNull(),
  description: text("description").notNull(),
  applicationUrl: varchar("applicationUrl", { length: 2048 }).notNull(),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("jobs_status_idx").on(table.status),
  index("jobs_location_idx").on(table.location),
]);

export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  preferredLocation: varchar("preferredLocation", { length: 180 }).notNull(),
  currentSalary: int("currentSalary").notNull(),
  expectedSalary: int("expectedSalary").notNull(),
  yearsExperience: int("yearsExperience").notNull(),
  noticePeriodDays: int("noticePeriodDays").notNull(),
  desiredJobTitle: varchar("desiredJobTitle", { length: 180 }).notNull(),
  cvFileKey: varchar("cvFileKey", { length: 512 }),
  cvFileName: varchar("cvFileName", { length: 255 }),
  cvFileUrl: varchar("cvFileUrl", { length: 2048 }),
  cvMimeType: varchar("cvMimeType", { length: 128 }),
  extractionStatus: mysqlEnum("extractionStatus", ["not_requested", "processing", "completed", "failed"]).default("not_requested").notNull(),
  extractedTitle: varchar("extractedTitle", { length: 180 }),
  extractedExperienceYears: int("extractedExperienceYears"),
  skillsJson: text("skillsJson"),
  status: mysqlEnum("status", ["new", "reviewing", "matched", "contacted"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("candidates_status_idx").on(table.status),
  index("candidates_location_idx").on(table.preferredLocation),
  index("candidates_created_idx").on(table.createdAt),
]);

export const jobMatches = mysqlTable("jobMatches", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  jobId: int("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  score: int("score").notNull(),
  reasonsJson: text("reasonsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("job_matches_candidate_idx").on(table.candidateId),
  index("job_matches_job_idx").on(table.jobId),
]);

export const candidateSkills = mysqlTable("candidateSkills", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  skill: varchar("skill", { length: 180 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("candidate_skills_candidate_idx").on(table.candidateId),
]);

export const cvFiles = mysqlTable("cvFiles", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 2048 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("cv_files_candidate_idx").on(table.candidateId),
]);

export const notificationLogs = mysqlTable("notificationLogs", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").references(() => candidates.id, { onDelete: "set null" }),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  delivered: int("delivered").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("notification_logs_candidate_idx").on(table.candidateId),
  index("notification_logs_event_idx").on(table.eventType),
]);

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;
export type JobMatchRecord = typeof jobMatches.$inferSelect;
export type CandidateSkill = typeof candidateSkills.$inferSelect;
export type CvFile = typeof cvFiles.$inferSelect;
export type NotificationLog = typeof notificationLogs.$inferSelect;
