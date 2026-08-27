import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { accessRoleChanges, candidateProfiles, clientAccounts, clientProjects, consultantAssignments, employeeProfiles, InsertUser, onboardingAssignments, operationalActivities, resumeUploads, resumeUploadSessions, staffingDemands, timesheetEntries, users } from "../drizzle/schema";
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
  userId: users.id,
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
    .from(users)
    .leftJoin(onboardingAssignments, eq(onboardingAssignments.userId, users.id))
    .where(inArray(users.role, ["user", "consultant"]))
    .orderBy(desc(onboardingAssignments.updatedAt));
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

export async function getDemoPortalSummary() {
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
  return {
    clients,
    projects: projects.map(project => ({ ...project, technologyStack: parseJson<string[]>(project.technologyStackJson, []) })),
    demands: demands.map(demand => ({ ...demand, skills: parseJson<string[]>(demand.skillsJson, []) })),
    assignments,
    timesheets,
    activities,
  };
}

export async function createResumeUploadSession(userId: number, input: { originalFileName: string; mimeType: string; fileSize: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const id = randomUUID();
  const fileKey = `recruiter-resumes/${userId}/${id}-${input.originalFileName}`;
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
