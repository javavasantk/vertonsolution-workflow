import type { Express } from "express";
import express from "express";
import { createContext } from "./_core/context";
import { completeResumeUploadSession, getActiveResumeUploadSession } from "./db";
import { validateResumeMetadata } from "./resumeFileService";
import { storagePutAtKey } from "./storage";

const allowedRoles = new Set(["admin", "recruiter"]);

export function registerResumeUploadRoute(app: Express) {
  app.put("/api/recruiter/resume-upload/:sessionId", express.raw({ type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], limit: "5mb" }), async (req, res) => {
    try {
      const ctx = await createContext({ req, res, info: {} } as any);
      if (!ctx.user || !allowedRoles.has(ctx.user.role)) return res.status(403).json({ error: "Recruiter or administrator access is required." });
      const session = await getActiveResumeUploadSession(ctx.user.id, req.params.sessionId);
      if (!session) return res.status(400).json({ error: "This upload session is invalid, expired, or already completed." });
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      const requestMimeType = req.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
      if (requestMimeType !== session.mimeType) return res.status(400).json({ error: "The uploaded file type does not match the approved upload request." });
      try {
        validateResumeMetadata({ fileName: session.originalFileName, mimeType: session.mimeType, fileSize: body.length });
      } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "The uploaded resume is invalid." });
      }
      if (body.length !== session.fileSize) return res.status(400).json({ error: "The uploaded file size does not match the approved upload request." });
      await storagePutAtKey(session.fileKey, body, session.mimeType);
      return res.status(204).end();
    } catch (error) {
      console.error("[Resume upload]", error);
      return res.status(500).json({ error: "The resume upload could not be stored securely." });
    }
  });
}
