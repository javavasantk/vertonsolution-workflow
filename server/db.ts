import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { aeroforgeTrials, backlogItems, catalogCourses, certificates, copilotMessages, enrollments, inquiries, InsertInquiry, InsertUser, passwordResetTokens, payments, subscriptions, users } from "../drizzle/schema";
import type { SolverInput, SolverResult } from "../shared/aeroforge";
import type { BillingCycle, PlanId } from "../shared/plans";
import { nanoid } from "nanoid";
import { createHash, randomBytes } from "node:crypto";
import { ENV } from './_core/env';

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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0];
}

export async function createPasswordUser({
  name,
  email,
  passwordHash,
}: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalizedEmail = email.toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) return { user: existing, created: false };

  await db.insert(users).values({
    openId: `pw_${nanoid(21)}`,
    name,
    email: normalizedEmail,
    loginMethod: "password",
    passwordHash,
    planId: "explorer",
    lastSignedIn: new Date(),
  });
  const user = await getUserByEmail(normalizedEmail);
  if (!user) throw new Error("Unable to create user");
  return { user, created: true };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a one-hour reset token for local-password accounts. The raw token is never stored. */
export async function createPasswordResetToken(email: string) {
  const user = await getUserByEmail(email.toLowerCase());
  if (!user?.passwordHash) return null;
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  await db.transaction(async tx => {
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
    await tx.insert(passwordResetTokens).values({ userId: user.id, tokenHash: hashPasswordResetToken(token), expiresAt });
  });
  return { user, token, expiresAt };
}

/** Atomically consumes a valid reset token, updates the password, and invalidates prior password sessions. */
export async function consumePasswordResetToken({ token, passwordHash }: { token: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tokenHash = hashPasswordResetToken(token);
  return db.transaction(async tx => {
    const [reset] = await tx
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())))
      .limit(1);
    if (!reset) return null;
    const [user] = await tx.select().from(users).where(eq(users.id, reset.userId)).limit(1);
    if (!user || !user.passwordHash) return null;
    const used = await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.id, reset.id), isNull(passwordResetTokens.usedAt)));
    if (!used[0]?.affectedRows) return null;
    const nextSessionVersion = user.sessionVersion + 1;
    await tx.update(users).set({ passwordHash, sessionVersion: nextSessionVersion, lastSignedIn: new Date() }).where(eq(users.id, user.id));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
    return { ...user, passwordHash, sessionVersion: nextSessionVersion };
  });
}

export async function findOrCreateGoogleUser({
  googleSub,
  email,
  name,
  avatarUrl,
}: {
  googleSub: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalizedEmail = email.toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    await db
      .update(users)
      .set({
        name: existing.name || name,
        avatarUrl: avatarUrl ?? existing.avatarUrl,
        lastSignedIn: new Date(),
      })
      .where(eq(users.id, existing.id));
    return (await getUserByEmail(normalizedEmail))!;
  }

  await db.insert(users).values({
    openId: `google_${googleSub}`.slice(0, 64),
    name,
    email: normalizedEmail,
    loginMethod: "google",
    avatarUrl,
    planId: "explorer",
    lastSignedIn: new Date(),
  });
  const user = await getUserByEmail(normalizedEmail);
  if (!user) throw new Error("Unable to create Google user");
  return user;
}

export async function createInquiry(inquiry: InsertInquiry) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  const result = await db.insert(inquiries).values(inquiry);
  return result[0]?.insertId ?? null;
}

export async function listAeroForgeTrials(userId: number, limit = 12) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select()
    .from(aeroforgeTrials)
    .where(eq(aeroforgeTrials.userId, userId))
    .orderBy(desc(aeroforgeTrials.createdAt))
    .limit(limit);
}

export async function createAeroForgeTrial({
  userId,
  input,
  result,
  label,
}: {
  userId: number;
  input: SolverInput;
  result: SolverResult;
  label?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const insert = await db.insert(aeroforgeTrials).values({
    userId,
    challengeId: result.challengeId,
    challengeName: result.challengeName,
    label: label?.trim() || null,
    mach: input.mach.toFixed(3),
    alphaDeg: input.alphaDeg.toFixed(2),
    altitudeKm: input.altitudeKm.toFixed(2),
    liftCoefficient: result.liftCoefficient.toFixed(4),
    dragCoefficient: result.dragCoefficient.toFixed(5),
    liftToDrag: result.liftToDrag.toFixed(2),
    trueAirspeedKmh: result.trueAirspeedKmh.toFixed(1),
    reynolds: String(result.reynolds),
    benchmarkDelta: result.benchmarkDelta.toFixed(2),
  });
  return insert[0]?.insertId ?? null;
}

export async function createCheckoutAttempt({
  userId,
  planId,
  amountPaise,
  billingCycle,
  razorpayOrderId,
}: {
  userId: number;
  planId: PlanId;
  amountPaise: number;
  billingCycle: BillingCycle;
  razorpayOrderId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const subscriptionInsert = await db.insert(subscriptions).values({
    userId,
    planId,
    status: "created",
    amountPaise,
    currency: "INR",
    billingCycle,
    razorpayOrderId,
  });
  const subscriptionId = Number(subscriptionInsert[0]?.insertId);
  await db.insert(payments).values({
    userId,
    subscriptionId,
    planId,
    razorpayOrderId,
    amountPaise,
    currency: "INR",
    status: "created",
  });
  return subscriptionId;
}

export async function getCheckoutAttempt(razorpayOrderId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, razorpayOrderId)).limit(1);
  if (!payment?.subscriptionId) return null;
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, payment.subscriptionId)).limit(1);
  if (!subscription) return null;
  return { payment, subscription };
}

export async function activateCheckoutAttempt({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const checkout = await getCheckoutAttempt(razorpayOrderId);
  if (!checkout) throw new Error("Checkout attempt was not found");
  const plan = (await import("../shared/plans")).getPlan(checkout.subscription.planId);
  const now = new Date();
  const periodEnd = new Date(now.getTime() + plan.periodDays * 24 * 60 * 60 * 1000);
  await db.update(payments).set({ status: "paid", razorpayPaymentId, razorpaySignature }).where(eq(payments.id, checkout.payment.id));
  await db.update(subscriptions).set({ status: "active", razorpayPaymentId, currentPeriodStart: now, currentPeriodEnd: periodEnd }).where(eq(subscriptions.id, checkout.subscription.id));
  await db.update(users).set({ planId: checkout.subscription.planId }).where(eq(users.id, checkout.subscription.userId));
  return { ...checkout, planId: checkout.subscription.planId, currentPeriodEnd: periodEnd };
}

export async function failCheckoutAttempt(razorpayOrderId: string, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const checkout = await getCheckoutAttempt(razorpayOrderId);
  if (!checkout) return null;
  await db.update(payments).set({ status: "failed", notes }).where(eq(payments.id, checkout.payment.id));
  await db.update(subscriptions).set({ status: "failed" }).where(eq(subscriptions.id, checkout.subscription.id));
  return checkout;
}

export async function getSubscriptionSummary(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  const paymentHistory = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(12);
  return { subscription: subscription ?? null, payments: paymentHistory };
}

export async function getCurrentSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  return subscription ?? null;
}

/** Schedule an end-of-cycle cancellation. Entitlements remain active until expiry. */
export async function scheduleCurrentSubscriptionCancellation(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const subscription = await getCurrentSubscription(userId);
  if (!subscription || subscription.status !== "active") return null;
  await db.update(subscriptions).set({ cancelledAt: new Date() }).where(eq(subscriptions.id, subscription.id));
  return subscription;
}

export async function listBacklogItems(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(backlogItems).where(eq(backlogItems.userId, userId)).orderBy(desc(backlogItems.updatedAt));
}

export async function createBacklogItem({ userId, title, squad, priority, dueAt }: { userId: number; title: string; squad?: string; priority: "low" | "medium" | "high"; dueAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const insert = await db.insert(backlogItems).values({ userId, title, squad: squad?.trim() || null, priority, dueAt: dueAt ?? null, status: "todo" });
  return insert[0]?.insertId ?? null;
}

export async function setBacklogItemStatus({ userId, itemId, status }: { userId: number; itemId: number; status: "todo" | "in_progress" | "review" | "done" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(backlogItems).set({ status }).where(and(eq(backlogItems.id, itemId), eq(backlogItems.userId, userId)));
}

export async function listCertificates(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issuedAt));
}

/** Records an engineering completion only from a saved, user-owned numerical trial. */
export async function recordEngineeringProjectCompletion({ userId, catalogSlug, trialId }: { userId: number; catalogSlug: string; trialId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [course] = await db.select().from(catalogCourses).where(eq(catalogCourses.slug, catalogSlug)).limit(1);
  if (!course) throw new Error("Catalog item was not found");
  const [trial] = await db.select().from(aeroforgeTrials).where(and(eq(aeroforgeTrials.id, trialId), eq(aeroforgeTrials.userId, userId))).limit(1);
  if (!trial) throw new Error("A user-owned saved AeroForge trial is required for completion");
  if (Number(trial.liftToDrag) <= 0 || Number(trial.dragCoefficient) <= 0) throw new Error("The saved trial does not contain qualifying numerical evidence");
  const [existing] = await db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.catalogSlug, catalogSlug))).limit(1);
  if (existing) {
    await db.update(enrollments).set({ progressPercent: 100, completionTrialId: trial.id }).where(eq(enrollments.id, existing.id));
    return { enrollmentId: existing.id, course };
  }
  const insert = await db.insert(enrollments).values({ userId, catalogSlug: course.slug, catalogTitle: course.title, catalogType: course.type, progressPercent: 100, completionTrialId: trial.id });
  return { enrollmentId: Number(insert[0]?.insertId), course };
}

/** Certificates derive their title/type from a previously verified 100% completion. */
export async function issueCertificateForVerifiedCompletion({ userId, catalogSlug }: { userId: number; catalogSlug: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [completion] = await db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.catalogSlug, catalogSlug))).limit(1);
  if (!completion || completion.progressPercent < 100 || !completion.completionTrialId) throw new Error("A verified engineering completion with a saved trial is required before issuing a certificate");
  const [sourceTrial] = await db.select().from(aeroforgeTrials).where(and(eq(aeroforgeTrials.id, completion.completionTrialId), eq(aeroforgeTrials.userId, userId))).limit(1);
  if (!sourceTrial || Number(sourceTrial.liftToDrag) <= 0 || Number(sourceTrial.dragCoefficient) <= 0) throw new Error("The completion evidence trial is no longer valid");
  const [existingCertificate] = await db.select().from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.sourceTrialId, sourceTrial.id))).limit(1);
  if (existingCertificate) return { certificateId: existingCertificate.id, alreadyIssued: true };
  const credentialCode = `PP-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;
  const insert = await db.insert(certificates).values({ userId, title: completion.catalogTitle, programType: completion.catalogType, sourceTrialId: sourceTrial.id, credentialCode, verified: true });
  return { certificateId: Number(insert[0]?.insertId), alreadyIssued: false };
}

export async function listCopilotMessages(userId: number, limit = 16) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const messages = await db.select().from(copilotMessages).where(eq(copilotMessages.userId, userId)).orderBy(desc(copilotMessages.createdAt)).limit(limit);
  return messages.reverse();
}

export async function saveCopilotMessage({ userId, role, content }: { userId: number; role: "user" | "assistant"; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const insert = await db.insert(copilotMessages).values({ userId, role, content });
  return insert[0]?.insertId ?? null;
}

// TODO: add feature queries here as your schema grows.
