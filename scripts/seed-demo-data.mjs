import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to seed Workforce Hub demonstration records.");

const db = await mysql.createConnection(databaseUrl);
const now = new Date();
const daysFromNow = days => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

async function upsert(table, columns, values, updateColumns) {
  const placeholders = columns.map(() => "?").join(", ");
  const updates = updateColumns.map(column => `\`${column}\` = VALUES(\`${column}\`)`).join(", ");
  await db.execute(`INSERT INTO \`${table}\` (${columns.map(column => `\`${column}\``).join(", ")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`, values);
}

try {
  const clients = [
    ["demo-northstar", "Northstar Retail · Demo", "Retail technology", "Dallas, TX", "Mia Carter", "active"],
    ["demo-arcfield", "Arcfield Health · Demo", "Healthcare technology", "Chicago, IL", "Jordan Bell", "active"],
    ["demo-moraine", "Moraine Foods · Demo", "Consumer products", "Remote", "Lena Ortiz", "prospect"],
  ];
  for (const client of clients) await upsert("client_accounts", ["demoKey", "name", "industry", "location", "primaryContact", "status"], client, ["name", "industry", "location", "primaryContact", "status"]);

  const [[northstar], [arcfield], [moraine]] = await Promise.all([
    db.execute("SELECT id FROM client_accounts WHERE demoKey = 'demo-northstar'"),
    db.execute("SELECT id FROM client_accounts WHERE demoKey = 'demo-arcfield'"),
    db.execute("SELECT id FROM client_accounts WHERE demoKey = 'demo-moraine'"),
  ]).then(results => results.map(([rows]) => rows));

  const projects = [
    ["demo-northstar-commerce", northstar.id, "Northstar Commerce Cloud · Demo", JSON.stringify(["React", "TypeScript", "AWS"]), "active", "Casey Rivera", daysFromNow(-75), daysFromNow(120)],
    ["demo-arcfield-data", arcfield.id, "Arcfield Data Modernization · Demo", JSON.stringify(["Python", "SQL", "Azure"]), "active", "Taylor Nguyen", daysFromNow(-30), daysFromNow(150)],
    ["demo-moraine-analytics", moraine.id, "Moraine Analytics Discovery · Demo", JSON.stringify(["Tableau", "SQL", "Snowflake"]), "planned", "Jordan Lee", daysFromNow(20), daysFromNow(110)],
  ];
  for (const project of projects) await upsert("client_projects", ["demoKey", "clientId", "name", "technologyStackJson", "deliveryStatus", "projectManagerName", "startDate", "endDate"], project, ["clientId", "name", "technologyStackJson", "deliveryStatus", "projectManagerName", "startDate", "endDate"]);

  const [[northstarProject], [arcfieldProject], [moraineProject]] = await Promise.all([
    db.execute("SELECT id FROM client_projects WHERE demoKey = 'demo-northstar-commerce'"),
    db.execute("SELECT id FROM client_projects WHERE demoKey = 'demo-arcfield-data'"),
    db.execute("SELECT id FROM client_projects WHERE demoKey = 'demo-moraine-analytics'"),
  ]).then(results => results.map(([rows]) => rows));

  const demands = [
    ["demo-demand-react", northstar.id, northstarProject.id, "Senior React Engineer · Demo", JSON.stringify(["React", "TypeScript", "AWS"]), 2, "high", "open", daysFromNow(21)],
    ["demo-demand-data", arcfield.id, arcfieldProject.id, "Data Engineer · Demo", JSON.stringify(["Python", "SQL", "Azure"]), 1, "critical", "submitted", daysFromNow(14)],
    ["demo-demand-analytics", moraine.id, moraineProject.id, "BI Analyst · Demo", JSON.stringify(["Tableau", "SQL"]), 1, "medium", "open", daysFromNow(35)],
  ];
  for (const demand of demands) await upsert("staffing_demands", ["demoKey", "clientId", "projectId", "title", "skillsJson", "openings", "priority", "status", "targetDate"], demand, ["clientId", "projectId", "title", "skillsJson", "openings", "priority", "status", "targetDate"]);

  const [userRows] = await db.execute("SELECT id, email FROM users WHERE email IN ('recruiter@demo.vertonsolutions.com', 'consultant@demo.vertonsolutions.com', 'finance@demo.vertonsolutions.com', 'project.manager@demo.vertonsolutions.com')");
  const userByEmail = new Map(userRows.map(user => [user.email, user.id]));
  const recruiterId = userByEmail.get("recruiter@demo.vertonsolutions.com");
  const consultantId = userByEmail.get("consultant@demo.vertonsolutions.com");
  const financeId = userByEmail.get("finance@demo.vertonsolutions.com");
  const projectManagerId = userByEmail.get("project.manager@demo.vertonsolutions.com");
  if (!recruiterId || !consultantId || !financeId || !projectManagerId) throw new Error("Expected demonstration role accounts were not found.");

  const seedCandidates = [
    ["Priya Shah · Demo", "priya.shah@demo.verton.local", "555-0101", "Dallas, TX", "Data engineer demonstration profile with cloud delivery experience.", "6 years", JSON.stringify(["Python", "Snowflake", "dbt"]), JSON.stringify([{ title: "Data Engineer", company: "Demo Cloud Analytics", period: "2020–present" }]), JSON.stringify(["B.S. Information Systems"]), JSON.stringify(["Confirm availability and client-specific skills through a recruiter." ]), "high", "pending_human_review"],
    ["Owen Miller · Demo", "owen.miller@demo.verton.local", "555-0102", "Chicago, IL", "Cloud architecture demonstration profile for recruiter exploration.", "9 years", JSON.stringify(["Azure", "Terraform", "Kubernetes"]), JSON.stringify([{ title: "Cloud Architect", company: "Demo Platform Group", period: "2017–present" }]), JSON.stringify(["M.S. Computer Science"]), JSON.stringify(["Confirm project fit through human recruiter review."]), "medium", "reviewed"],
    ["Lena Garcia · Demo", "lena.garcia@demo.verton.local", "555-0103", "Remote", "Quality automation demonstration profile for recruiter search and filters.", "4 years", JSON.stringify(["Playwright", "Cypress", "API testing"]), JSON.stringify([{ title: "QA Automation Lead", company: "Demo Quality Lab", period: "2022–present" }]), JSON.stringify(["B.S. Software Engineering"]), JSON.stringify(["Confirm interview readiness with the candidate."]), "high", "pending_human_review"],
  ];
  for (const candidate of seedCandidates) {
    const [existing] = await db.execute("SELECT id FROM candidate_profiles WHERE createdByUserId = ? AND email = ? LIMIT 1", [recruiterId, candidate[1]]);
    if (existing[0]) {
      await db.execute("UPDATE candidate_profiles SET candidateName = ?, phone = ?, location = ?, professionalSummary = ?, yearsExperience = ?, skillsJson = ?, recentRolesJson = ?, educationJson = ?, recruiterNotesJson = ?, confidence = ?, reviewState = ? WHERE id = ?", [candidate[0], candidate[2], candidate[3], candidate[4], candidate[5], candidate[6], candidate[7], candidate[8], candidate[9], candidate[10], candidate[11], existing[0].id]);
    } else {
      await db.execute("INSERT INTO candidate_profiles (createdByUserId, candidateName, email, phone, location, professionalSummary, yearsExperience, skillsJson, recentRolesJson, educationJson, recruiterNotesJson, confidence, reviewState) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [recruiterId, ...candidate]);
    }
  }

  const assignments = [
    ["demo-assignment-consultant", consultantId, northstar.id, northstarProject.id, "Casey Rivera", 100, "active", daysFromNow(-42), daysFromNow(78), true],
    ["demo-assignment-finance", financeId, arcfield.id, arcfieldProject.id, "Taylor Nguyen", 40, "extension_due", daysFromNow(-85), daysFromNow(18), true],
    ["demo-assignment-project-manager", projectManagerId, moraine.id, moraineProject.id, "Jordan Lee", 50, "pending", daysFromNow(10), daysFromNow(100), false],
  ];
  for (const assignment of assignments) await upsert("consultant_assignments", ["demoKey", "userId", "clientId", "projectId", "managerName", "allocationPercent", "assignmentState", "startDate", "endDate", "billable"], assignment, ["userId", "clientId", "projectId", "managerName", "allocationPercent", "assignmentState", "startDate", "endDate", "billable"]);

  const [[consultantAssignment], [financeAssignment]] = await Promise.all([
    db.execute("SELECT id FROM consultant_assignments WHERE demoKey = 'demo-assignment-consultant'"),
    db.execute("SELECT id FROM consultant_assignments WHERE demoKey = 'demo-assignment-finance'"),
  ]).then(results => results.map(([rows]) => rows));

  const profiles = [
    [consultantId, "W-2 employee · Demo", "human_review", "Demonstration status only; no authorization document is stored.", daysFromNow(160), projectManagerId],
    [financeId, "W-2 employee · Demo", "verified", "Demonstration status only; next confirmation is scheduled.", daysFromNow(250), projectManagerId],
  ];
  for (const profile of profiles) await db.execute("INSERT INTO employee_profiles (userId, employmentType, workAuthorizationStatus, statusNote, expiryDate, updatedByUserId) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE employmentType = VALUES(employmentType), workAuthorizationStatus = VALUES(workAuthorizationStatus), statusNote = VALUES(statusNote), expiryDate = VALUES(expiryDate), updatedByUserId = VALUES(updatedByUserId)", profile);

  const onboarding = [
    [consultantId, "manager_confirmation", 82, true, "Northstar Commerce Cloud · Demo", "active"],
    [financeId, "ready_for_assignment", 92, true, "Arcfield Data Modernization · Demo", "pending"],
    [projectManagerId, "profile_in_progress", 65, false, "Moraine Analytics Discovery · Demo", "pending"],
  ];
  for (const row of onboarding) await db.execute("INSERT INTO onboarding_assignments (userId, onboardingStage, progressPercent, managerConfirmed, projectName, assignmentState) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE onboardingStage = VALUES(onboardingStage), progressPercent = VALUES(progressPercent), managerConfirmed = VALUES(managerConfirmed), projectName = VALUES(projectName), assignmentState = VALUES(assignmentState)", row);

  const timeEntries = [
    ["demo-timesheet-consultant", consultantId, consultantAssignment.id, daysFromNow(-3), 40, "submitted", "Demonstration weekly delivery record."],
    ["demo-timesheet-finance", financeId, financeAssignment.id, daysFromNow(-3), 36, "exception", "Demonstration exception awaiting manager confirmation."],
  ];
  for (const entry of timeEntries) await upsert("timesheet_entries", ["demoKey", "userId", "assignmentId", "weekEnding", "hours", "status", "note"], entry, ["userId", "assignmentId", "weekEnding", "hours", "status", "note"]);

  const activities = [
    ["demo-activity-demand", "staffing_demand", "Senior React Engineer demand remains open", "Northstar Commerce Cloud · Demo", "attention", daysFromNow(-1)],
    ["demo-activity-extension", "assignment", "Finance assignment extension is due", "Arcfield Data Modernization · Demo", "attention", daysFromNow(-2)],
    ["demo-activity-timesheet", "timesheet", "Consultant timesheet submitted", "Northstar Commerce Cloud · Demo", "open", daysFromNow(-1)],
    ["demo-activity-onboarding", "onboarding", "Manager confirmation received", "Arcfield Data Modernization · Demo", "complete", daysFromNow(-4)],
  ];
  for (const activity of activities) await upsert("operational_activities", ["demoKey", "entityType", "title", "detail", "activityState", "occurredAt"], activity, ["entityType", "title", "detail", "activityState", "occurredAt"]);

  console.log("Workforce Hub demonstration records seeded successfully.");
} finally {
  await db.end();
}
