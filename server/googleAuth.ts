import type { Express, Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { findOrCreateGoogleUser } from "./db";

const GOOGLE_STATE_COOKIE = "__Host-polaris_google_state";
const LOCAL_GOOGLE_STATE_COOKIE = "polaris_google_state";
const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleState = { nonce: string; origin: string };
type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured");
  }
  return { clientId, clientSecret };
}

function googleStateCookieName(req: Request) {
  // __Host- cookies are intentionally rejected unless Secure. Preserve that
  // host-only prefix in HTTPS deployments, with a local-only fallback so the
  // OAuth flow can be validated over http://localhost.
  return getSessionCookieOptions(req).secure ? GOOGLE_STATE_COOKIE : LOCAL_GOOGLE_STATE_COOKIE;
}

function validateOrigin(value: string) {
  const parsed = new URL(value);
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.origin !== value || (!isLocal && parsed.protocol !== "https:")) {
    throw new Error("Invalid application origin");
  }
  return parsed.origin;
}

function encodeState(state: GoogleState) {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

function decodeState(value: string | undefined): GoogleState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed?.nonce !== "string" || typeof parsed?.origin !== "string") return null;
    return { nonce: parsed.nonce, origin: validateOrigin(parsed.origin) };
  } catch {
    return null;
  }
}

export function createGoogleAuthorizationUrl(origin: string, res: Response, req: Request) {
  const normalizedOrigin = validateOrigin(origin);
  const { clientId } = getGoogleConfig();
  const nonce = randomBytes(24).toString("base64url");
  const callbackUrl = `${normalizedOrigin}/api/auth/google/callback`;
  const cookieOptions = getSessionCookieOptions(req);

  // Origin stays only in a host-only httpOnly cookie; state carries only nonce.
  res.cookie(googleStateCookieName(req), encodeState({ nonce, origin: normalizedOrigin }), {
    ...cookieOptions,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state: nonce,
    prompt: "select_account",
    access_type: "online",
  });
  return `${GOOGLE_AUTHORIZATION_URL}?${params.toString()}`;
}

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/google/callback", async (req, res) => {
    const errorRedirect = (message: string) => {
      const cookies = parseCookie(req.headers.cookie ?? "");
      const stored = decodeState(cookies[googleStateCookieName(req)]);
      const fallback = "/auth?google=error";
      const target = stored ? `${stored.origin}${fallback}&reason=${encodeURIComponent(message)}` : fallback;
      res.clearCookie(googleStateCookieName(req), { ...getSessionCookieOptions(req), sameSite: "lax" });
      res.redirect(target);
    };

    try {
      const code = typeof req.query.code === "string" ? req.query.code : "";
      const state = typeof req.query.state === "string" ? req.query.state : "";
      const cookies = parseCookie(req.headers.cookie ?? "");
      const stored = decodeState(cookies[googleStateCookieName(req)]);

      if (!code || !stored || state !== stored.nonce) {
        errorRedirect("invalid_state");
        return;
      }

      const { clientId, clientSecret } = getGoogleConfig();
      const callbackUrl = `${stored.origin}/api/auth/google/callback`;
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: "authorization_code",
        }),
      });
      const token = (await tokenResponse.json()) as { access_token?: string; error?: string };
      if (!tokenResponse.ok || !token.access_token) {
        errorRedirect(token.error ?? "token_exchange_failed");
        return;
      }

      const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { authorization: `Bearer ${token.access_token}` },
      });
      const profile = (await profileResponse.json()) as GoogleUserInfo;
      if (!profileResponse.ok || !profile.sub || !profile.email || !profile.email_verified) {
        errorRedirect("verified_email_required");
        return;
      }

      const user = await findOrCreateGoogleUser({
        googleSub: profile.sub,
        email: profile.email.toLowerCase(),
        name: profile.name ?? profile.email.split("@")[0],
        avatarUrl: profile.picture ?? null,
      });
      const session = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "Polaris Member",
      });
      res.cookie(COOKIE_NAME, session, {
        ...getSessionCookieOptions(req),
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });
      res.clearCookie(googleStateCookieName(req), { ...getSessionCookieOptions(req), sameSite: "lax" });
      res.redirect(`${stored.origin}/portal?google=success`);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      errorRedirect("callback_failed");
    }
  });
}
