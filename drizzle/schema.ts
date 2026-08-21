import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing the auth flow.
 * Supports three login methods:
 *  - "password" : email + password created on /auth
 *  - "google"   : Google OAuth
 *  - "manus"    : Manus OAuth (platform default)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Stable identifier. For password/Google users we mint `pw_<nanoid>` / `google_<sub>`. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** bcrypt-style hash. Null for OAuth-only accounts. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  avatarUrl: text("avatarUrl"),
  /** Denormalised current plan for fast gating reads. */
  planId: varchar("planId", { length: 32 }).default("explorer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * The published learning catalog. `contentJson` preserves rich syllabus and
 * outcome data while the first-class filter fields make server-side discovery
 * and enrolment flows straightforward.
 */
export const catalogCourses = mysqlTable(
  "catalog_courses",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    type: mysqlEnum("type", ["workshop", "course", "bootcamp", "project"])
      .notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    duration: varchar("duration", { length: 80 }).notNull(),
    difficulty: mysqlEnum("difficulty", [
      "beginner",
      "intermediate",
      "advanced",
      "all",
    ]).notNull(),
    /** JSON array, e.g. ["Aerospace","Physics"]. */
    domainsJson: text("domainsJson").notNull(),
    status: mysqlEnum("status", ["open", "upcoming", "application", "active"])
      .notNull(),
    requiredTier: int("requiredTier").notNull().default(0),
    contentJson: text("contentJson").notNull(),
    published: boolean("published").notNull().default(true),
    sortOrder: int("sortOrder").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    typeIdx: index("catalog_courses_type_idx").on(table.type),
    difficultyIdx: index("catalog_courses_difficulty_idx").on(table.difficulty),
  })
);

export type CatalogCourse = typeof catalogCourses.$inferSelect;
export type InsertCatalogCourse = typeof catalogCourses.$inferInsert;

/**
 * One row per subscription attempt/period. The newest active row for a user
 * determines their entitlements.
 */
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** explorer | builder | builder_annual | squad_pro */
    planId: varchar("planId", { length: 32 }).notNull(),
    status: mysqlEnum("status", [
      "created",
      "active",
      "cancelled",
      "expired",
      "failed",
    ])
      .default("created")
      .notNull(),
    /** Amount actually charged, in paise (Razorpay's smallest unit). */
    amountPaise: int("amountPaise").notNull().default(0),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    billingCycle: mysqlEnum("billingCycle", ["none", "monthly", "yearly"])
      .default("none")
      .notNull(),
    razorpayOrderId: varchar("razorpayOrderId", { length: 128 }),
    razorpayPaymentId: varchar("razorpayPaymentId", { length: 128 }),
    razorpaySubscriptionId: varchar("razorpaySubscriptionId", { length: 128 }),
    currentPeriodStart: timestamp("currentPeriodStart"),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdx: index("subscriptions_userId_idx").on(table.userId),
    orderIdx: index("subscriptions_order_idx").on(table.razorpayOrderId),
  })
);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/** Immutable ledger of every Razorpay payment event we observe. */
export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    subscriptionId: int("subscriptionId"),
    planId: varchar("planId", { length: 32 }).notNull(),
    razorpayOrderId: varchar("razorpayOrderId", { length: 128 }).notNull(),
    razorpayPaymentId: varchar("razorpayPaymentId", { length: 128 }),
    razorpaySignature: varchar("razorpaySignature", { length: 255 }),
    amountPaise: int("amountPaise").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    status: mysqlEnum("status", ["created", "paid", "failed", "refunded"])
      .default("created")
      .notNull(),
    method: varchar("method", { length: 64 }),
    /** Raw webhook/verify payload for audit. */
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdx: index("payments_userId_idx").on(table.userId),
    orderIdx: index("payments_order_idx").on(table.razorpayOrderId),
  })
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/** Saved AeroForge solver runs. Gated behind Builder+ subscriptions. */
export const aeroforgeTrials = mysqlTable(
  "aeroforge_trials",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    challengeId: varchar("challengeId", { length: 64 }).notNull(),
    challengeName: varchar("challengeName", { length: 160 }).notNull(),
    label: varchar("label", { length: 160 }),
    mach: decimal("mach", { precision: 5, scale: 3 }).notNull(),
    alphaDeg: decimal("alphaDeg", { precision: 5, scale: 2 }).notNull(),
    altitudeKm: decimal("altitudeKm", { precision: 6, scale: 2 }).notNull(),
    liftCoefficient: decimal("liftCoefficient", { precision: 8, scale: 4 }).notNull(),
    dragCoefficient: decimal("dragCoefficient", { precision: 8, scale: 5 }).notNull(),
    liftToDrag: decimal("liftToDrag", { precision: 8, scale: 2 }).notNull(),
    trueAirspeedKmh: decimal("trueAirspeedKmh", { precision: 8, scale: 1 }).notNull(),
    reynolds: decimal("reynolds", { precision: 14, scale: 0 }),
    benchmarkDelta: decimal("benchmarkDelta", { precision: 6, scale: 2 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userIdx: index("trials_userId_idx").on(table.userId),
  })
);

export type AeroforgeTrial = typeof aeroforgeTrials.$inferSelect;
export type InsertAeroforgeTrial = typeof aeroforgeTrials.$inferInsert;

/** Student sprint backlog inside the workspace. */
export const backlogItems = mysqlTable(
  "backlog_items",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    squad: varchar("squad", { length: 120 }),
    status: mysqlEnum("status", ["todo", "in_progress", "review", "done"])
      .default("todo")
      .notNull(),
    priority: mysqlEnum("priority", ["low", "medium", "high"])
      .default("medium")
      .notNull(),
    dueAt: timestamp("dueAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdx: index("backlog_userId_idx").on(table.userId),
  })
);

export type BacklogItem = typeof backlogItems.$inferSelect;
export type InsertBacklogItem = typeof backlogItems.$inferInsert;

/** Verified certificates awarded for completed programs. */
export const certificates = mysqlTable(
  "certificates",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    programType: varchar("programType", { length: 48 }).notNull(),
    /** The qualifying saved AeroForge run that established this credential's evidence trail. */
    sourceTrialId: int("sourceTrialId"),
    credentialCode: varchar("credentialCode", { length: 64 }).notNull(),
    verified: boolean("verified").default(true).notNull(),
    issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  },
  table => ({
    userIdx: index("certificates_userId_idx").on(table.userId),
  })
);

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

/** Catalog enrolments / seat reservations. */
export const enrollments = mysqlTable(
  "enrollments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    catalogSlug: varchar("catalogSlug", { length: 120 }).notNull(),
    catalogTitle: varchar("catalogTitle", { length: 240 }).notNull(),
    catalogType: varchar("catalogType", { length: 32 }).notNull(),
    progressPercent: int("progressPercent").default(0).notNull(),
    /** A reviewed simulation record that verifies the completion. */
    completionTrialId: int("completionTrialId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdx: index("enrollments_userId_idx").on(table.userId),
  })
);

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

/** Persisted AI Co-Pilot conversation (Squad Pro only). */
export const copilotMessages = mysqlTable(
  "copilot_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userIdx: index("copilot_userId_idx").on(table.userId),
  })
);

export type CopilotMessage = typeof copilotMessages.$inferSelect;
export type InsertCopilotMessage = typeof copilotMessages.$inferInsert;

/** School / institution outreach enquiries from /schools and /contact. */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["school", "contact"]).default("contact").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  organisation: varchar("organisation", { length: 240 }),
  topic: varchar("topic", { length: 160 }),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
