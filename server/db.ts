import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { accessRoleChanges, candidateProfiles, clientAccounts, clientProjects, consultantAssignments, consultantCheckInActivities, consultantCheckIns, consultantOnboardingTaskActivities, consultantOnboardingTasks, employeeProfiles, InsertUser, onboardingAssignments, operationalActivities, resumeUploads, resumeUploadSessions, staffingDemands, timesheetEntries, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";

const DEMO_PASSWORD = "VertonDemo!2026";
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const DEMO_ACCOUNTS = [
  { openId: "demo_administrator", name: "Avery Morgan", email: "administrator@demo.vertonsolutions.com", role: "admin" },
  { openId: "demo_recruiter", name: "Riley Brooks", email: "recruiter@demo.vertonsolutions.com", role: "recruiter" },
  { openId: "demo_hr_compliance", name: "Harper Singh", email: "hr.compliance@demo.vertonsolutions.com", role: "hr_compliance" },
  { openId: "demo_account_manager", name: "Jordan Lee", email: "account.manager@demo.vertonsolutions.com", role: "account_manager" },
  { openId: "demo_delivery_manager", name: "Taylor Nguyen", email: "delivery.manager@demo.vertonsolutions.com", role: "delivery_manager" },
  { openId: "demo_project_manager", name: "Casey Rivera", email: "project.manager@demo.vertonsolutions.com", role: "project_manager" },
  { openId: "demo_finance", name: "Morgan Patel", email: "finance@demo.vertonsolutions.com", role: "finance" },
  { openId: "demo_consultant", name: "Jamie Chen", email: "consultant@demo.vertonsolutions.com", role: "consultant" },
] as const;

type DemoRole = (typeof DEMO_ACCOUNTS)[number]["role"];

function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => error ? reject(error) : resolve(derivedKey as Buffer));
  });
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await derivePassword(password, salt);
  return `${salt}:${derived.toString("hex")}`;
}

async function passwordMatches(password: string, stored: string) {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const candidate = await derivePassword(password, salt);
  const expected = Buffer.from(digest, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listWorkforceUsers() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.lastSignedIn));
}

type StoredWorkforceRole = NonNullable<InsertUser["role"]>;

export async function assignWorkforceRole(userId: number, role: StoredWorkforceRole, changedByUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const current = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const previousRole = current[0]?.role ?? "consultant";
  if (!current[0]) throw new Error("User account was not found");
  if (previousRole === role) return;

  await db.update(users).set({ role }).where(eq(users.id, userId));
  await db.insert(accessRoleChanges).values({
    userId,
    changedByUserId,
    previousRole,
    nextRole: role,
  });
}

export async function listAccessRoleChanges() {
  const db = await getDb();
  if (!db) return [];

  const targetUser = alias(users, "access_role_change_target");
  const changedByUser = alias(users, "access_role_change_actor");

  return db
    .select({
      id: accessRoleChanges.id,
      previousRole: accessRoleChanges.previousRole,
      nextRole: accessRoleChanges.nextRole,
      createdAt: accessRoleChanges.createdAt,
      targetName: targetUser.name,
      changedByName: changedByUser.name,
    })
    .from(accessRoleChanges)
    .innerJoin(targetUser, eq(accessRoleChanges.userId, targetUser.id))
    .innerJoin(changedByUser, eq(accessRoleChanges.changedByUserId, changedByUser.id))
    .orderBy(desc(accessRoleChanges.createdAt));
}

export async function getEmployeeProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, userId)).limit(1);
  return results[0];
}

/** Minimal readiness workflow projection for authorized Administrator and HR & Compliance review. */
export async function listReadinessProfiles() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      userId: users.id,
      name: users.name,
      workAuthorizationStatus: employeeProfiles.workAuthorizationStatus,
      employmentType: employeeProfiles.employmentType,
      statusNote: employeeProfiles.statusNote,
      expiryDate: employeeProfiles.expiryDate,
      updatedAt: employeeProfiles.updatedAt,
    })
    .from(employeeProfiles)
    .innerJoin(users, eq(employeeProfiles.userId, users.id))
    .orderBy(desc(employeeProfiles.updatedAt));
}

export async function submitEmployeeProfileUpdate(userId: number, input: { employmentType: string; statusNote: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values = {
    userId,
    employmentType: input.employmentType,
    statusNote: input.statusNote,
    workAuthorizationStatus: "details_requested" as const,
    updatedByUserId: userId,
  };

  await db.insert(employeeProfiles).values(values).onDuplicateKeyUpdate({
    set: {
      employmentType: values.employmentType,
      statusNote: values.statusNote,
      workAuthorizationStatus: values.workAuthorizationStatus,
      updatedByUserId: values.updatedByUserId,
    },
  });
}

export const recruiterLaunchboardSelection = {
  id: onboardingAssignments.id,
  name: users.name,
  email: users.email,
  role: users.role,
  onboardingStage: onboardingAssignments.onboardingStage,
  progressPercent: onboardingAssignments.progressPercent,
  managerConfirmed: onboardingAssignments.managerConfirmed,
  projectName: onboardingAssignments.projectName,
  assignmentState: onboardingAssignments.assignmentState,
  updatedAt: onboardingAssignments.updatedAt,
};

export async function listRecruiterNewHireProgress() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select(recruiterLaunchboardSelection)
    .from(onboardingAssignments)
    .innerJoin(users, eq(onboardingAssignments.userId, users.id))
    .orderBy(desc(onboardingAssignments.updatedAt));
}

function presentConsultantOnboardingTask(row: typeof consultantOnboardingTasks.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    taskType: row.taskType,
    description: row.description,
    ownerGroup: row.ownerGroup,
    dueDate: row.dueDate,
    consultantCompletionState: row.consultantCompletionState,
    acknowledgedAt: row.acknowledgedAt,
    updatedAt: row.updatedAt,
  };
}

/** Own-record task projection. It intentionally omits cross-user task data and any readiness, document, or assignment-decision fields. */
export async function listConsultantOnboardingTasks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(consultantOnboardingTasks).where(eq(consultantOnboardingTasks.userId, userId)).orderBy(desc(consultantOnboardingTasks.updatedAt));
  return rows.map(presentConsultantOnboardingTask);
}

/** A consultant can acknowledge only a task assigned to their own session account. Repeated acknowledgement is deliberately idempotent. */
export async function acknowledgeConsultantOnboardingTask(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(consultantOnboardingTasks).where(eq(consultantOnboardingTasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task || task.userId !== userId) throw new Error("Assigned onboarding task was not found");
  if (task.consultantCompletionState === "acknowledged") return presentConsultantOnboardingTask(task);

  const acknowledgedAt = new Date();
  await db.update(consultantOnboardingTasks).set({ consultantCompletionState: "acknowledged", acknowledgedAt }).where(eq(consultantOnboardingTasks.id, task.id));
  await db.insert(consultantOnboardingTaskActivities).values({ taskId: task.id, userId, activityType: "acknowledged", occurredAt: acknowledgedAt });
  const updatedRows = await db.select().from(consultantOnboardingTasks).where(eq(consultantOnboardingTasks.id, task.id)).limit(1);
  return presentConsultantOnboardingTask(updatedRows[0] ?? task);
}

function presentConsultantCheckIn(row: typeof consultantCheckIns.$inferSelect) {
  return { id: row.id, category: row.category, factualNote: row.factualNote, createdAt: row.createdAt };
}

/** Own-record factual check-ins plus the current assignment manager as the designated human follow-up owner. */
export async function listConsultantCheckIns(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [checkIns, assignments] = await Promise.all([
    db.select().from(consultantCheckIns).where(eq(consultantCheckIns.userId, userId)).orderBy(desc(consultantCheckIns.createdAt)),
    db.select({ managerName: consultantAssignments.managerName }).from(consultantAssignments).where(eq(consultantAssignments.userId, userId)).orderBy(desc(consultantAssignments.updatedAt)).limit(1),
  ]);
  return { designatedHumanOwner: assignments[0]?.managerName || "Designated engagement owner", checkIns: checkIns.map(presentConsultantCheckIn) };
}

/** A consultant can submit only their own bounded factual check-in. The record and activity are append-only. */
export async function createConsultantCheckIn(userId: number, input: { category: "engagement_update" | "work_update" | "support_note"; factualNote: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const createdAt = new Date();
  await db.insert(consultantCheckIns).values({ userId, category: input.category, factualNote: input.factualNote, createdAt });
  const createdRows = await db.select().from(consultantCheckIns).where(eq(consultantCheckIns.userId, userId)).orderBy(desc(consultantCheckIns.id)).limit(1);
  const checkIn = createdRows[0];
  if (!checkIn) throw new Error("Check-in could not be recorded");
  await db.insert(consultantCheckInActivities).values({ checkInId: checkIn.id, userId, activityType: "submitted", occurredAt: createdAt });
  return presentConsultantCheckIn(checkIn);
}

type CandidateProfileInput = {
  candidateName: string;
  email: string;
  phone: string;
  location: string;
  professionalSummary: string;
  yearsExperience: string;
  skills: string[];
  recentRoles: Array<{ title: string; company: string; period: string }>;
  education: string[];
  recruiterNotes: string[];
  confidence: "high" | "medium" | "low";
};

function serializeCandidateProfile(input: CandidateProfileInput) {
  return {
    candidateName: input.candidateName || "Candidate pending review",
    email: input.email || null,
    phone: input.phone || null,
    location: input.location || null,
    professionalSummary: input.professionalSummary || null,
    yearsExperience: input.yearsExperience || null,
    skillsJson: JSON.stringify(input.skills ?? []),
    recentRolesJson: JSON.stringify(input.recentRoles ?? []),
    educationJson: JSON.stringify(input.education ?? []),
    recruiterNotesJson: JSON.stringify(input.recruiterNotes ?? []),
    confidence: input.confidence ?? "low",
    reviewState: "pending_human_review" as const,
  };
}

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function presentCandidate(row: typeof candidateProfiles.$inferSelect) {
  return {
    id: row.id,
    candidateName: row.candidateName,
    email: row.email,
    phone: row.phone,
    location: row.location,
    professionalSummary: row.professionalSummary,
    yearsExperience: row.yearsExperience,
    skills: parseJson<string[]>(row.skillsJson, []),
    recentRoles: parseJson<Array<{ title: string; company: string; period: string }>>(row.recentRolesJson, []),
    education: parseJson<string[]>(row.educationJson, []),
    recruiterNotes: parseJson<string[]>(row.recruiterNotesJson, []),
    confidence: row.confidence,
    reviewState: row.reviewState,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function presentAssistantCandidate(row: typeof candidateProfiles.$inferSelect) {
  return {
    id: row.id,
    candidateName: row.candidateName,
    location: row.location,
    yearsExperience: row.yearsExperience,
    skills: parseJson<string[]>(row.skillsJson, []),
    reviewState: row.reviewState,
  };
}

function presentAssistantProjectStatus(row: typeof clientProjects.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    deliveryStatus: row.deliveryStatus,
    projectManagerName: row.projectManagerName,
  };
}

export async function createCandidateProfile(createdByUserId: number, input: CandidateProfileInput, upload?: { fileKey: string; originalFileName: string; mimeType: string; fileSize: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (input.email) {
    const existing = await db.select().from(candidateProfiles).where(eq(candidateProfiles.email, input.email.trim().toLowerCase())).limit(1);
    if (existing[0]) {
      await db.update(candidateProfiles).set(serializeCandidateProfile(input)).where(eq(candidateProfiles.id, existing[0].id));
      const updated = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, existing[0].id)).limit(1);
      if (upload) await db.insert(resumeUploads).values({ candidateProfileId: existing[0].id, uploadedByUserId: createdByUserId, ...upload });
      return presentCandidate(updated[0] ?? existing[0]);
    }
  }
  await db.insert(candidateProfiles).values({ createdByUserId, ...serializeCandidateProfile(input) });
  const created = await db.select().from(candidateProfiles).where(eq(candidateProfiles.createdByUserId, createdByUserId)).orderBy(desc(candidateProfiles.id)).limit(1);
  const candidate = created[0];
  if (!candidate) throw new Error("Candidate profile could not be created");
  if (upload) await db.insert(resumeUploads).values({ candidateProfileId: candidate.id, uploadedByUserId: createdByUserId, ...upload });
  return presentCandidate(candidate);
}

export async function listRecruiterCandidates() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(candidateProfiles).orderBy(desc(candidateProfiles.updatedAt));
  return rows.map(presentCandidate);
}

export async function getRecruiterCandidateById(candidateId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, candidateId)).limit(1);
  return rows[0] ? presentCandidate(rows[0]) : null;
}

export async function updateCandidateProfile(candidateId: number, updatedByUserId: number, input: Pick<CandidateProfileInput, "candidateName" | "location" | "yearsExperience" | "skills">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, candidateId)).limit(1);
  if (!existing[0]) throw new Error("Candidate profile was not found");
  await db.update(candidateProfiles).set({ candidateName: input.candidateName, location: input.location || null, yearsExperience: input.yearsExperience || null, skillsJson: JSON.stringify(input.skills) }).where(eq(candidateProfiles.id, candidateId));
  await db.insert(operationalActivities).values({ demoKey: `candidate-update-${candidateId}-${Date.now()}`, entityType: "candidate", title: `Candidate profile updated: ${input.candidateName}`, detail: `Updated by recruiter/admin user ${updatedByUserId}`, activityState: "complete" });
  const updated = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, candidateId)).limit(1);
  return presentCandidate(updated[0] ?? existing[0]);
}

export async function updateClientProject(projectId: number, updatedByUserId: number, input: { name: string; deliveryStatus: "planned" | "active" | "at_risk" | "closing"; projectManagerName: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(clientProjects).where(eq(clientProjects.id, projectId)).limit(1);
  if (!existing[0]) throw new Error("Project record was not found");
  await db.update(clientProjects).set({ name: input.name, deliveryStatus: input.deliveryStatus, projectManagerName: input.projectManagerName || null }).where(eq(clientProjects.id, projectId));
  await db.insert(operationalActivities).values({ demoKey: `project-update-${projectId}-${Date.now()}`, entityType: "project", title: `Project status updated: ${input.name}`, detail: `Updated by authorized user ${updatedByUserId}`, activityState: input.deliveryStatus === "at_risk" ? "attention" : "complete" });
  const updated = await db.select().from(clientProjects).where(eq(clientProjects.id, projectId)).limit(1);
  return updated[0] ?? existing[0];
}

export async function getWorkspaceAssistantLookup(role: string, prompt: string) {
  const db = await getDb();
  if (!db) return { kind: "none" as const, records: [] as Array<Record<string, unknown>>, context: "No database records are available." };
  const normalized = prompt.toLowerCase();
  const candidateRoles = ["admin", "recruiter"];
  const projectRoles = ["admin", "recruiter", "account_manager", "delivery_manager", "project_manager"];
  if (candidateRoles.includes(role) && /candidate|resume|profile|skill|experience/.test(normalized)) {
    const rows = (await db.select().from(candidateProfiles).orderBy(desc(candidateProfiles.updatedAt)).limit(12)).filter(row => {
      const searchable = `${row.candidateName} ${row.location ?? ""} ${row.skillsJson}`.toLowerCase();
      const terms = normalized.split(/[^a-z0-9+#.]+/).filter(term => term.length >= 3 && !["candidate", "profile", "resume", "show", "find", "with", "skill", "skills", "experience"].includes(term));
      return terms.length === 0 || terms.some(term => searchable.includes(term));
    }).slice(0, 5).map(presentAssistantCandidate);
    const context = rows.length ? rows.map(row => `Candidate: ${row.candidateName}; location: ${row.location ?? "not stated"}; experience: ${row.yearsExperience ?? "not stated"}; skills: ${row.skills.join(", ") || "not stated"}; review: ${row.reviewState}.`).join("\n") : "No matching recruiter-visible candidate profiles were found.";
    return { kind: "candidate" as const, records: rows, context };
  }
  if (projectRoles.includes(role) && /project|delivery|status|client|assignment/.test(normalized)) {
    const rows = (await db.select().from(clientProjects).orderBy(desc(clientProjects.updatedAt)).limit(12)).filter(row => {
      const terms = normalized.split(/[^a-z0-9+#.]+/).filter(term => term.length >= 3 && !["project", "delivery", "status", "client", "assignment", "show", "find", "with"].includes(term));
      return terms.length === 0 || terms.some(term => `${row.name} ${row.deliveryStatus} ${row.projectManagerName ?? ""}`.toLowerCase().includes(term));
    }).slice(0, 5).map(presentAssistantProjectStatus);
    const context = rows.length ? rows.map(row => `Project: ${row.name}; delivery status: ${row.deliveryStatus}; project manager: ${row.projectManagerName ?? "not assigned"}.`).join("\n") : "No matching project-status records were found.";
    return { kind: "project" as const, records: rows, context };
  }
  return { kind: "none" as const, records: [], context: "No database lookup applies to this question. Provide workflow guidance only." };
}

export type PortalSummaryRole = "admin" | "recruiter" | "hr_compliance" | "account_manager" | "delivery_manager" | "project_manager" | "finance" | "consultant" | "user";

/** Narrow own-record projection for the Consultant My Work dashboard. */
export async function getConsultantMyWork(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [profileRows, onboardingRows, assignmentRows, timesheetRows] = await Promise.all([
    db.select({
      profileUpdateState: employeeProfiles.workAuthorizationStatus,
      updatedAt: employeeProfiles.updatedAt,
    }).from(employeeProfiles).where(eq(employeeProfiles.userId, userId)).limit(1),
    db.select({
      onboardingStage: onboardingAssignments.onboardingStage,
      progressPercent: onboardingAssignments.progressPercent,
      assignmentState: onboardingAssignments.assignmentState,
      updatedAt: onboardingAssignments.updatedAt,
    }).from(onboardingAssignments).where(eq(onboardingAssignments.userId, userId)).limit(1),
    db.select({
      id: consultantAssignments.id,
      projectName: clientProjects.name,
      clientName: clientAccounts.name,
      managerName: consultantAssignments.managerName,
      allocationPercent: consultantAssignments.allocationPercent,
      assignmentState: consultantAssignments.assignmentState,
      startDate: consultantAssignments.startDate,
      endDate: consultantAssignments.endDate,
      updatedAt: consultantAssignments.updatedAt,
    }).from(consultantAssignments)
      .innerJoin(clientProjects, eq(consultantAssignments.projectId, clientProjects.id))
      .innerJoin(clientAccounts, eq(consultantAssignments.clientId, clientAccounts.id))
      .where(eq(consultantAssignments.userId, userId))
      .orderBy(desc(consultantAssignments.updatedAt)),
    db.select({
      assignmentId: timesheetEntries.assignmentId,
      weekEnding: timesheetEntries.weekEnding,
      hours: timesheetEntries.hours,
      status: timesheetEntries.status,
      updatedAt: timesheetEntries.updatedAt,
    }).from(timesheetEntries).where(eq(timesheetEntries.userId, userId)).orderBy(desc(timesheetEntries.updatedAt)),
  ]);

  const assignment = assignmentRows.find(row => row.assignmentState === "active") ?? assignmentRows[0] ?? null;
  const assignmentIds = new Set(assignmentRows.map(row => row.id));
  const latestTimesheet = timesheetRows.find(row => !row.assignmentId || assignmentIds.has(row.assignmentId)) ?? null;
  return {
    profile: profileRows[0] ?? null,
    onboarding: onboardingRows[0] ?? null,
    assignment,
    latestTimesheet,
  };
}

/** Narrow own-record projection for the Consultant My Engagement page. */
export async function getConsultantMyEngagement(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [assignmentRows, timesheetRows] = await Promise.all([
    db.select({
      id: consultantAssignments.id,
      projectName: clientProjects.name,
      clientName: clientAccounts.name,
      managerName: consultantAssignments.managerName,
      allocationPercent: consultantAssignments.allocationPercent,
      assignmentState: consultantAssignments.assignmentState,
      startDate: consultantAssignments.startDate,
      endDate: consultantAssignments.endDate,
      updatedAt: consultantAssignments.updatedAt,
    }).from(consultantAssignments)
      .leftJoin(clientProjects, eq(consultantAssignments.projectId, clientProjects.id))
      .leftJoin(clientAccounts, eq(consultantAssignments.clientId, clientAccounts.id))
      .where(eq(consultantAssignments.userId, userId))
      .orderBy(desc(consultantAssignments.updatedAt)),
    db.select({
      assignmentId: timesheetEntries.assignmentId,
      weekEnding: timesheetEntries.weekEnding,
      hours: timesheetEntries.hours,
      status: timesheetEntries.status,
      updatedAt: timesheetEntries.updatedAt,
    }).from(timesheetEntries)
      .where(eq(timesheetEntries.userId, userId))
      .orderBy(desc(timesheetEntries.updatedAt)),
  ]);

  const activeAssignment = assignmentRows.find(row => row.assignmentState === "active") ?? null;
  const latestAssignment = activeAssignment ?? assignmentRows[0] ?? null;
  const latestTimesheet = latestAssignment
    ? timesheetRows.find(row => row.assignmentId === latestAssignment.id) ?? null
    : null;
  return { assignment: latestAssignment, hasActiveAssignment: Boolean(activeAssignment), latestTimesheet };
}

export async function getDemoPortalSummary(role: PortalSummaryRole, userId: number) {
  const db = await getDb();
  if (!db) return { clients: [], projects: [], demands: [], assignments: [], timesheets: [], activities: [] };
  const [clients, projects, demands, assignments, timesheets, activities] = await Promise.all([
    db.select().from(clientAccounts).orderBy(desc(clientAccounts.updatedAt)),
    db.select().from(clientProjects).orderBy(desc(clientProjects.updatedAt)),
    db.select().from(staffingDemands).orderBy(desc(staffingDemands.updatedAt)),
    db.select().from(consultantAssignments).orderBy(desc(consultantAssignments.updatedAt)),
    db.select().from(timesheetEntries).orderBy(desc(timesheetEntries.updatedAt)),
    db.select().from(operationalActivities).orderBy(desc(operationalActivities.occurredAt)),
  ]);
  const clientRows = clients.map(client => ({ id: client.id, name: client.name, industry: client.industry, location: client.location, status: client.status }));
  const projectRows = projects.map(project => ({ id: project.id, clientId: project.clientId, name: project.name, deliveryStatus: project.deliveryStatus, projectManagerName: project.projectManagerName }));
  const demandRows = demands.map(demand => ({ id: demand.id, clientId: demand.clientId, title: demand.title, priority: demand.priority, openings: demand.openings, status: demand.status, skills: parseJson<string[]>(demand.skillsJson, []) }));
  const assignmentRows = assignments.map(assignment => ({ id: assignment.id, userId: assignment.userId, clientId: assignment.clientId, projectId: assignment.projectId, managerName: assignment.managerName, allocationPercent: assignment.allocationPercent, assignmentState: assignment.assignmentState, startDate: assignment.startDate, endDate: assignment.endDate, billable: assignment.billable }));
  const timeRows = timesheets.map(entry => ({ id: entry.id, assignmentId: entry.assignmentId, weekEnding: entry.weekEnding, hours: entry.hours, status: entry.status, note: entry.note }));
  const activityRows = activities.map(activity => ({ id: activity.id, entityType: activity.entityType, title: activity.title, detail: activity.detail, activityState: activity.activityState, occurredAt: activity.occurredAt }));
  const deliveryRoles = ["admin", "account_manager", "delivery_manager", "project_manager"];
  if (deliveryRoles.includes(role)) return { clients: clientRows, projects: projectRows, demands: demandRows, assignments: assignmentRows, timesheets: timeRows, activities: activityRows };
  if (role === "consultant" || role === "user") {
    const scopedAssignments = assignmentRows.filter(assignment => assignment.userId === userId);
    const projectIds = new Set(scopedAssignments.map(assignment => assignment.projectId));
    const clientIds = new Set(scopedAssignments.map(assignment => assignment.clientId));
    const assignmentIds = new Set(scopedAssignments.map(assignment => assignment.id));
    return { clients: clientRows.filter(client => clientIds.has(client.id)), projects: projectRows.filter(project => projectIds.has(project.id)), demands: [], assignments: scopedAssignments, timesheets: timeRows.filter(entry => entry.assignmentId && assignmentIds.has(entry.assignmentId)), activities: [] };
  }
  if (role === "finance") return { clients: [], projects: projectRows, demands: [], assignments: assignmentRows, timesheets: timeRows, activities: [] };
  return { clients: [], projects: [], demands: [], assignments: [], timesheets: [], activities: [] };
}

export async function createResumeUploadSession(userId: number, input: { originalFileName: string; mimeType: string; fileSize: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const id = randomUUID();
  const safeFileName = input.originalFileName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "resume";
  const fileKey = `recruiter-resumes/${userId}/${id}-${safeFileName}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(resumeUploadSessions).values({ id, userId, fileKey, ...input, expiresAt });
  return { id, fileKey, expiresAt };
}

export async function getActiveResumeUploadSession(userId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const session = await db.select().from(resumeUploadSessions).where(and(eq(resumeUploadSessions.id, sessionId), eq(resumeUploadSessions.userId, userId))).limit(1);
  const active = session[0];
  if (!active || active.completedAt || active.expiresAt.getTime() < Date.now()) return undefined;
  return active;
}

export async function completeResumeUploadSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(resumeUploadSessions).set({ completedAt: new Date() }).where(eq(resumeUploadSessions.id, sessionId));
}

export async function ensureDemoAccounts() {
  const db = await getDb();
  if (!db) return;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  for (const account of DEMO_ACCOUNTS) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.openId, account.openId)).limit(1);
    if (existing[0]) continue;
    await db.insert(users).values({
      ...account,
      passwordHash,
      isDemo: true,
      loginMethod: "demo-credentials",
      role: account.role as DemoRole,
    });
  }
}

export async function listDemoAccounts() {
  await ensureDemoAccounts();
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.isDemo, true));
}

export async function authenticateDemoCredentials(email: string, password: string) {
  await ensureDemoAccounts();
  const db = await getDb();
  if (!db) return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  const user = result[0];
  if (!user?.isDemo || !user.passwordHash || !(await passwordMatches(password, user.passwordHash))) return undefined;
  return user;
}

export async function requestDemoPasswordReset(email: string) {
  await ensureDemoAccounts();
  const db = await getDb();
  if (!db) return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  const user = result[0];
  if (!user?.isDemo) return undefined;
  const token = randomBytes(24).toString("base64url");
  await db.update(users).set({ resetTokenHash: hashResetToken(token), resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) }).where(eq(users.id, user.id));
  return token;
}

export async function resetDemoPassword(token: string, password: string) {
  const db = await getDb();
  if (!db) return false;
  const digest = hashResetToken(token);
  const result = await db.select().from(users).where(eq(users.resetTokenHash, digest)).limit(1);
  const user = result[0];
  if (!user?.isDemo || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) return false;
  await db.update(users).set({ passwordHash: await hashPassword(password), resetTokenHash: null, resetTokenExpiresAt: null }).where(eq(users.id, user.id));
  return true;
}

export const demoCredentialDetails = { resetTtlMinutes: RESET_TOKEN_TTL_MS / 60 };

// TODO: add feature queries here as your schema grows.
