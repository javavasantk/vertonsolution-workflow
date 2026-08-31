import type { Express } from "express";
import { createContext } from "./_core/context";
import { getFinanceTimesheetEvidenceDocument } from "./db";
import { storageGetSignedUrl } from "./storage";

/** Serves a one-time, no-store redirect only to a Finance session; object keys never reach the browser. */
export function registerTimesheetEvidenceReviewRoute(app: Express) {
  app.get("/api/finance/timesheet-evidence/:evidenceId", async (req, res) => {
    try {
      const evidenceId = Number(req.params.evidenceId);
      if (!Number.isInteger(evidenceId) || evidenceId < 1) return res.status(400).json({ error: "A valid evidence record is required." });
      const ctx = await createContext({ req, res, info: {} } as any);
      if (!ctx.user || ctx.user.role !== "finance") return res.status(403).json({ error: "Finance access is required." });
      const document = await getFinanceTimesheetEvidenceDocument(evidenceId);
      if (!document) return res.status(404).json({ error: "The private timesheet evidence was not found." });
      const signedUrl = await storageGetSignedUrl(document.fileKey);
      res.set("Cache-Control", "no-store");
      return res.redirect(307, signedUrl);
    } catch (error) {
      console.error("[Timesheet evidence review]", error);
      return res.status(502).json({ error: "The private timesheet evidence could not be opened." });
    }
  });
}
