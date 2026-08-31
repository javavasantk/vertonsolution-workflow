import type { Express } from "express";
import express from "express";
import { createContext } from "./_core/context";
import { getActiveConsultantTimesheetUploadSession } from "./db";
import { storagePutAtKey } from "./storage";
import { allowedTimesheetEvidenceMimeTypes, validateTimesheetEvidenceBytes } from "./timesheetEvidenceFileService";

const allowedRoles = new Set(["consultant", "user"]);

/** Stores bytes only at a pre-approved private key; the tRPC completion step performs the bounded OCR and persistence. */
export function registerTimesheetUploadRoute(app: Express) {
  app.put("/api/consultant/timesheet-upload/:sessionId", express.raw({ type: [...allowedTimesheetEvidenceMimeTypes], limit: "5mb" }), async (req, res) => {
    try {
      const ctx = await createContext({ req, res, info: {} } as any);
      if (!ctx.user || !allowedRoles.has(ctx.user.role)) return res.status(403).json({ error: "Consultant access is required." });
      const session = await getActiveConsultantTimesheetUploadSession(ctx.user.id, req.params.sessionId);
      if (!session) return res.status(400).json({ error: "This timesheet upload session is invalid, expired, or already completed." });
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      const requestMimeType = req.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
      if (requestMimeType !== session.mimeType) return res.status(400).json({ error: "The uploaded file type does not match the approved timesheet request." });
      try {
        validateTimesheetEvidenceBytes({ fileName: session.originalFileName, mimeType: session.mimeType, fileSize: body.length, bytes: body });
      } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "The timesheet file is invalid." });
      }
      if (body.length !== session.fileSize) return res.status(400).json({ error: "The uploaded file size does not match the approved timesheet request." });
      await storagePutAtKey(session.fileKey, body, session.mimeType);
      return res.status(204).end();
    } catch (error) {
      console.error("[Timesheet upload]", error);
      return res.status(500).json({ error: "The timesheet upload could not be stored securely." });
    }
  });
}
