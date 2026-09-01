import type { Express } from "express";
import { createContext } from "./_core/context";
import { getConsultantOwnedTimesheetEvidenceDocument, recordConsultantTimesheetEvidenceViewed } from "./db";
import { storageGetSignedUrl } from "./storage";

function attachmentFilename(fileName: string) {
  const cleaned = fileName.replace(/[\\/\r\n";]/g, "_").trim();
  return cleaned || "timesheet-evidence";
}

/** Streams a private attachment only after proving the session user owns both its evidence row and underlying time entry. */
export function registerConsultantTimesheetEvidenceViewRoute(app: Express) {
  app.get("/api/consultant/timesheet-evidence/:evidenceId", async (req, res) => {
    try {
      const evidenceId = Number(req.params.evidenceId);
      if (!Number.isInteger(evidenceId) || evidenceId < 1) return res.status(400).json({ error: "A valid private timesheet evidence record is required." });
      const ctx = await createContext({ req, res, info: {} } as any);
      if (!ctx.user) return res.status(401).json({ error: "Sign in is required to open a private timesheet source." });
      if (!["consultant", "user"].includes(ctx.user.role)) return res.status(403).json({ error: "Consultant access is required." });
      const document = await getConsultantOwnedTimesheetEvidenceDocument(ctx.user.id, evidenceId);
      if (!document) return res.status(404).json({ error: "This private timesheet source is unavailable for your account." });
      if (!["application/pdf", "image/png", "image/jpeg"].includes(document.mimeType)) return res.status(415).json({ error: "This private timesheet source format is unavailable." });

      const signedUrl = await storageGetSignedUrl(document.fileKey);
      const source = await fetch(signedUrl);
      if (!source.ok) return res.status(404).json({ error: "This private timesheet source is unavailable for your account." });
      const bytes = Buffer.from(await source.arrayBuffer());
      res.set({
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
        "Content-Disposition": `attachment; filename="${attachmentFilename(document.originalFileName)}"`,
        "Content-Type": document.mimeType,
      });
      await recordConsultantTimesheetEvidenceViewed(ctx.user.id, evidenceId);
      return res.status(200).send(bytes);
    } catch (error) {
      console.error("[Consultant timesheet evidence view]", error);
      return res.status(502).json({ error: "This private timesheet source is unavailable right now. Please try again later." });
    }
  });
}
