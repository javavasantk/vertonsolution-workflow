import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  /** Demo-only accounts use a salted password hash. OAuth accounts never use this field. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Single-use password reset token digest for demo accounts only. */
  resetTokenHash: varchar("resetTokenHash", { length: 128 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  /** Keeps public demonstration credentials isolated from production OAuth identities. */
  isDemo: boolean("isDemo").default(false).notNull(),
  role: mysqlEnum("role", [
    "user",
    "admin",
    "recruiter",
    "hr_compliance",
    "account_manager",
    "delivery_manager",
    "project_manager",
    "finance",
    "consultant",
  ]).default("consultant").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Controlled employee self-service record. This stores workflow status only;
 * it intentionally excludes copies of identity or work-authorization documents.
 */
export const employeeProfiles = mysqlTable("employee_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  employmentType: varchar("employmentType", { length: 96 }),
  workAuthorizationStatus: mysqlEnum("workAuthorizationStatus", [
    "not_started",
    "details_requested",
    "human_review",
    "verified",
    "expiry_watch",
  ]).default("not_started").notNull(),
  statusNote: varchar("statusNote", { length: 500 }),
  expiryDate: timestamp("expiryDate"),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Recruiter-visible operational progress, separate from restricted reviewer detail. */
export const onboardingAssignments = mysqlTable("onboarding_assignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  onboardingStage: mysqlEnum("onboardingStage", [
    "not_started",
    "profile_in_progress",
    "manager_confirmation",
    "ready_for_assignment",
    "assigned",
  ]).default("not_started").notNull(),
  progressPercent: int("progressPercent").default(0).notNull(),
  managerConfirmed: boolean("managerConfirmed").default(false).notNull(),
  projectName: varchar("projectName", { length: 180 }),
  assignmentState: mysqlEnum("assignmentState", ["unassigned", "pending", "active", "roll_off"]).default("unassigned").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Immutable operational history for role changes made through administrator controls. */
export const accessRoleChanges = mysqlTable("access_role_changes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  changedByUserId: int("changedByUserId").notNull().references(() => users.id),
  previousRole: varchar("previousRole", { length: 64 }).notNull(),
  nextRole: varchar("nextRole", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmployeeProfile = typeof employeeProfiles.$inferSelect;
export type InsertEmployeeProfile = typeof employeeProfiles.$inferInsert;
export type OnboardingAssignment = typeof onboardingAssignments.$inferSelect;
export type InsertOnboardingAssignment = typeof onboardingAssignments.$inferInsert;
export type AccessRoleChange = typeof accessRoleChanges.$inferSelect;
