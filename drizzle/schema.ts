import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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

/** Append-only record that a user submitted an own-profile update request. It deliberately stores no profile values, readiness detail, documents, or decision outcome. */
export const employeeProfileUpdateActivities = mysqlTable("employee_profile_update_activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  activityType: mysqlEnum("activityType", ["requested"]).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
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

/** Personal onboarding tasks are assigned to one consultant account. Acknowledgement is not an approval or assignment decision. */
export const consultantOnboardingTasks = mysqlTable("consultant_onboarding_tasks", {
  id: int("id").autoincrement().primaryKey(),
  /** Stable key used only for idempotent internal demonstration records. */
  demoKey: varchar("demoKey", { length: 96 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  taskType: mysqlEnum("taskType", ["profile", "policy", "equipment_access", "orientation"]).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  ownerGroup: mysqlEnum("ownerGroup", ["consultant", "hr", "it", "manager"]).notNull(),
  dueDate: timestamp("dueDate"),
  consultantCompletionState: mysqlEnum("consultantCompletionState", ["pending", "acknowledged"]).default("pending").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Append-only application activity for a consultant acknowledging an assigned personal onboarding task. */
export const consultantOnboardingTaskActivities = mysqlTable("consultant_onboarding_task_activities", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => consultantOnboardingTasks.id),
  userId: int("userId").notNull().references(() => users.id),
  activityType: mysqlEnum("activityType", ["acknowledged"]).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

/** Consultant-owned factual engagement updates. These records intentionally exclude performance, readiness, health, compensation, and client-credential data. */
export const consultantCheckIns = mysqlTable("consultant_check_ins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  category: mysqlEnum("category", ["engagement_update", "work_update", "support_note"]).notNull(),
  factualNote: varchar("factualNote", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Append-only application activity for a consultant's factual check-in submission. */
export const consultantCheckInActivities = mysqlTable("consultant_check_in_activities", {
  id: int("id").autoincrement().primaryKey(),
  checkInId: int("checkInId").notNull().references(() => consultantCheckIns.id),
  userId: int("userId").notNull().references(() => users.id),
  activityType: mysqlEnum("activityType", ["submitted"]).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
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

/** Recruiter-visible candidate details extracted from an uploaded or pasted resume. Raw extracted text is intentionally not stored. */
export const candidateProfiles = mysqlTable("candidate_profiles", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  candidateName: varchar("candidateName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 96 }),
  location: varchar("location", { length: 255 }),
  professionalSummary: text("professionalSummary"),
  yearsExperience: varchar("yearsExperience", { length: 96 }),
  skillsJson: text("skillsJson").notNull(),
  recentRolesJson: text("recentRolesJson").notNull(),
  educationJson: text("educationJson").notNull(),
  recruiterNotesJson: text("recruiterNotesJson").notNull(),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).default("low").notNull(),
  reviewState: mysqlEnum("reviewState", ["pending_human_review", "reviewed", "archived"]).default("pending_human_review").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Private object-store references for original recruiter uploads; file bytes never live in database columns. */
export const resumeUploads = mysqlTable("resume_uploads", {
  id: int("id").autoincrement().primaryKey(),
  candidateProfileId: int("candidateProfileId").notNull().references(() => candidateProfiles.id),
  uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSize: int("fileSize").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Short-lived server-issued upload records bind an object-store target to the authenticated recruiter before parsing. */
export const resumeUploadSessions = mysqlTable("resume_upload_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSize: int("fileSize").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Clearly labeled operational demonstration records backing the client-to-delivery lifecycle. */
export const clientAccounts = mysqlTable("client_accounts", {
  id: int("id").autoincrement().primaryKey(),
  demoKey: varchar("demoKey", { length: 96 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 128 }),
  location: varchar("location", { length: 180 }),
  primaryContact: varchar("primaryContact", { length: 255 }),
  status: mysqlEnum("status", ["prospect", "active", "paused"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const clientProjects = mysqlTable("client_projects", {
  id: int("id").autoincrement().primaryKey(),
  demoKey: varchar("demoKey", { length: 96 }).notNull().unique(),
  clientId: int("clientId").notNull().references(() => clientAccounts.id),
  name: varchar("name", { length: 255 }).notNull(),
  technologyStackJson: text("technologyStackJson").notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["planned", "active", "at_risk", "closing"]).default("planned").notNull(),
  projectManagerName: varchar("projectManagerName", { length: 255 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const staffingDemands = mysqlTable("staffing_demands", {
  id: int("id").autoincrement().primaryKey(),
  demoKey: varchar("demoKey", { length: 96 }).notNull().unique(),
  clientId: int("clientId").notNull().references(() => clientAccounts.id),
  projectId: int("projectId").references(() => clientProjects.id),
  title: varchar("title", { length: 255 }).notNull(),
  skillsJson: text("skillsJson").notNull(),
  openings: int("openings").default(1).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "submitted", "filled", "on_hold"]).default("open").notNull(),
  targetDate: timestamp("targetDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const consultantAssignments = mysqlTable("consultant_assignments", {
  id: int("id").autoincrement().primaryKey(),
  demoKey: varchar("demoKey", { length: 96 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  clientId: int("clientId").notNull().references(() => clientAccounts.id),
  projectId: int("projectId").notNull().references(() => clientProjects.id),
  managerName: varchar("managerName", { length: 255 }),
  allocationPercent: int("allocationPercent").default(100).notNull(),
  assignmentState: mysqlEnum("assignmentState", ["pending", "active", "extension_due", "roll_off", "bench"]).default("pending").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  billable: boolean("billable").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const timesheetEntries = mysqlTable("timesheet_entries", {
  id: int("id").autoincrement().primaryKey(),
  demoKey: varchar("demoKey", { length: 96 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  assignmentId: int("assignmentId").references(() => consultantAssignments.id),
  weekEnding: timestamp("weekEnding").notNull(),
  hours: int("hours").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "exception"]).default("draft").notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Append-only application activity for consultant-owned time-entry creation, revision, and submission. It is not an approval or financial-processing ledger. */
export const consultantTimeEntryActivities = mysqlTable("consultant_time_entry_activities", {
  id: int("id").autoincrement().primaryKey(),
  timeEntryId: int("timeEntryId").notNull().references(() => timesheetEntries.id),
  userId: int("userId").notNull().references(() => users.id),
  activityType: mysqlEnum("activityType", ["created", "updated", "submitted"]).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

/** A short-lived, consultant-bound private upload session for one existing own time entry. */
export const consultantTimesheetUploadSessions = mysqlTable("consultant_timesheet_upload_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  timeEntryId: int("timeEntryId").notNull().references(() => timesheetEntries.id),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSize: int("fileSize").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Private client-approved timesheet evidence metadata and bounded OCR total. Document bytes remain in private object storage. */
export const consultantTimesheetEvidence = mysqlTable("consultant_timesheet_evidence", {
  id: int("id").autoincrement().primaryKey(),
  uploadSessionId: varchar("uploadSessionId", { length: 64 }).notNull(),
  userId: int("userId").notNull().references(() => users.id),
  timeEntryId: int("timeEntryId").notNull().references(() => timesheetEntries.id),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSize: int("fileSize").notNull(),
  fileSha256: varchar("fileSha256", { length: 64 }).notNull(),
  extractionStatus: mysqlEnum("extractionStatus", ["extracted", "needs_human_review"]).default("needs_human_review").notNull(),
  extractedHours: int("extractedHours"),
  extractionConfidence: mysqlEnum("extractionConfidence", ["high", "medium", "low"]).default("low").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("consultant_timesheet_evidence_session_uq").on(table.uploadSessionId),
  uniqueIndex("consultant_timesheet_evidence_file_uq").on(table.userId, table.timeEntryId, table.fileSha256),
]);

/** Append-only operational activity for upload, extraction, and one own-account evidence-viewed event. It contains no document content. */
export const consultantTimesheetEvidenceActivities = mysqlTable("consultant_timesheet_evidence_activities", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: int("evidenceId").notNull().references(() => consultantTimesheetEvidence.id),
  userId: int("userId").notNull().references(() => users.id),
  activityType: mysqlEnum("activityType", ["uploaded", "hours_extracted", "needs_human_review", "evidence_viewed"]).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, table => [uniqueIndex("ts_evidence_activity_uq").on(table.evidenceId, table.userId, table.activityType)]);

/** A single designated Finance reviewer may claim one private timesheet-evidence record for human follow-up. */
export const consultantTimesheetEvidenceReviews = mysqlTable("consultant_timesheet_evidence_reviews", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: int("evidenceId").notNull().references(() => consultantTimesheetEvidence.id),
  reviewerUserId: int("reviewerUserId").notNull().references(() => users.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("consultant_timesheet_evidence_review_uq").on(table.evidenceId)]);

/** Append-only factual discrepancy notes. A note is not an approval, correction, payroll, invoice, or legal decision. */
export const consultantTimesheetEvidenceDiscrepancyNotes = mysqlTable("consultant_timesheet_evidence_discrepancy_notes", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: int("evidenceId").notNull().references(() => consultantTimesheetEvidence.id),
  authorUserId: int("authorUserId").notNull().references(() => users.id),
  note: varchar("note", { length: 1000 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** A Consultant may acknowledge a reviewer note only on evidence owned by that Consultant. Acknowledgement is not resolution, correction, or approval. */
export const consultantTimesheetEvidenceNoteAcknowledgements = mysqlTable("consultant_timesheet_evidence_note_acknowledgements", {
  id: int("id").autoincrement().primaryKey(),
  reviewerNoteId: int("reviewerNoteId").notNull().references(() => consultantTimesheetEvidenceDiscrepancyNotes.id),
  evidenceId: int("evidenceId").notNull().references(() => consultantTimesheetEvidence.id),
  userId: int("userId").notNull().references(() => users.id),
  acknowledgedAt: timestamp("acknowledgedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("ts_note_ack_uq").on(table.reviewerNoteId, table.userId)]);

/** One bounded factual Consultant response per reviewer note. It is a request for designated human follow-up, not a timesheet or financial outcome. */
export const consultantTimesheetEvidenceDiscrepancyResponses = mysqlTable("consultant_timesheet_evidence_discrepancy_responses", {
  id: int("id").autoincrement().primaryKey(),
  reviewerNoteId: int("reviewerNoteId").notNull().references(() => consultantTimesheetEvidenceDiscrepancyNotes.id),
  evidenceId: int("evidenceId").notNull().references(() => consultantTimesheetEvidence.id),
  authorUserId: int("authorUserId").notNull().references(() => users.id),
  body: varchar("body", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("ts_note_response_uq").on(table.reviewerNoteId, table.authorUserId)]);

/** Immutable factual activity for a Consultant acknowledgement or response. It contains no private document content or reviewer identity. */
export const consultantTimesheetEvidenceResponseActivities = mysqlTable("consultant_timesheet_evidence_response_activities", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: int("evidenceId").notNull().references(() => consultantTimesheetEvidence.id),
  userId: int("userId").notNull().references(() => users.id),
  reviewerNoteId: int("reviewerNoteId").notNull().references(() => consultantTimesheetEvidenceDiscrepancyNotes.id),
  activityType: mysqlEnum("activityType", ["discrepancy_acknowledged", "discrepancy_response_submitted"]).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, table => [uniqueIndex("ts_resp_activity_uq").on(table.reviewerNoteId, table.userId, table.activityType)]);

/** Session-scoped presentation state for deterministic Action Inbox items. Reminder content remains derived from protected source records. */
export const consultantActionInboxStates = mysqlTable("consultant_action_inbox_states", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  dedupKey: varchar("dedupKey", { length: 160 }).notNull(),
  state: mysqlEnum("state", ["unread", "read", "dismissed"]).default("unread").notNull(),
  dismissedAt: timestamp("dismissedAt"),
  restoredAt: timestamp("restoredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("consultant_inbox_user_dedup_uq").on(table.userId, table.dedupKey)]);
export const operationalActivities = mysqlTable("operational_activities", {
  id: int("id").autoincrement().primaryKey(),
  demoKey: varchar("demoKey", { length: 96 }).notNull().unique(),
  entityType: varchar("entityType", { length: 96 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  detail: varchar("detail", { length: 500 }),
  activityState: mysqlEnum("activityState", ["open", "attention", "complete"]).default("open").notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export type EmployeeProfile = typeof employeeProfiles.$inferSelect;
export type InsertEmployeeProfile = typeof employeeProfiles.$inferInsert;
export type EmployeeProfileUpdateActivity = typeof employeeProfileUpdateActivities.$inferSelect;
export type OnboardingAssignment = typeof onboardingAssignments.$inferSelect;
export type InsertOnboardingAssignment = typeof onboardingAssignments.$inferInsert;
export type ConsultantOnboardingTask = typeof consultantOnboardingTasks.$inferSelect;
export type ConsultantOnboardingTaskActivity = typeof consultantOnboardingTaskActivities.$inferSelect;
export type AccessRoleChange = typeof accessRoleChanges.$inferSelect;
export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type ResumeUpload = typeof resumeUploads.$inferSelect;
export type ResumeUploadSession = typeof resumeUploadSessions.$inferSelect;
export type ClientAccount = typeof clientAccounts.$inferSelect;
export type ClientProject = typeof clientProjects.$inferSelect;
export type StaffingDemand = typeof staffingDemands.$inferSelect;
export type ConsultantAssignment = typeof consultantAssignments.$inferSelect;
export type TimesheetEntry = typeof timesheetEntries.$inferSelect;
export type ConsultantTimesheetEvidence = typeof consultantTimesheetEvidence.$inferSelect;
export type ConsultantTimesheetUploadSession = typeof consultantTimesheetUploadSessions.$inferSelect;
export type ConsultantTimesheetEvidenceReview = typeof consultantTimesheetEvidenceReviews.$inferSelect;
export type ConsultantTimesheetEvidenceDiscrepancyNote = typeof consultantTimesheetEvidenceDiscrepancyNotes.$inferSelect;
export type ConsultantTimesheetEvidenceNoteAcknowledgement = typeof consultantTimesheetEvidenceNoteAcknowledgements.$inferSelect;
export type ConsultantTimesheetEvidenceDiscrepancyResponse = typeof consultantTimesheetEvidenceDiscrepancyResponses.$inferSelect;
export type ConsultantTimesheetEvidenceResponseActivity = typeof consultantTimesheetEvidenceResponseActivities.$inferSelect;
export type ConsultantActionInboxState = typeof consultantActionInboxStates.$inferSelect;
export type OperationalActivity = typeof operationalActivities.$inferSelect;
