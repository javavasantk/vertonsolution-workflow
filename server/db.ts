import { desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { accessRoleChanges, employeeProfiles, InsertUser, onboardingAssignments, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

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

export async function listRecruiterNewHireProgress() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
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
      readinessStatus: employeeProfiles.workAuthorizationStatus,
    })
    .from(users)
    .leftJoin(onboardingAssignments, eq(onboardingAssignments.userId, users.id))
    .leftJoin(employeeProfiles, eq(employeeProfiles.userId, users.id))
    .where(inArray(users.role, ["user", "consultant"]))
    .orderBy(desc(onboardingAssignments.updatedAt));
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

export const demoCredentialDetails = { password: DEMO_PASSWORD, resetTtlMinutes: RESET_TOKEN_TTL_MS / 60 };

// TODO: add feature queries here as your schema grows.
