import { createHmac, randomBytes } from "node:crypto";

const COOKIE_NAME = "gg_session";
const SESSION_PATTERN = /^[A-Za-z0-9_-]{24,96}$/;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
    return "guidegpt-local-development-secret-only";
  }

  throw new Error("AUTH_SECRET is not configured.");
}

export function hasSessionSecret() {
  try {
    getSecret();
    return true;
  } catch {
    return false;
  }
}

export function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, ...value]) => {
        const raw = value.join("=");
        try {
          return [key, decodeURIComponent(raw)];
        } catch {
          return [key, raw];
        }
      }),
  );
}

function setSessionCookie(response, sessionId) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=31536000",
  ];
  if (secure) parts.push("Secure");
  response.setHeader("Set-Cookie", parts.join("; "));
}

export function getSession(request, response) {
  const headerSession = request.headers["x-guidegpt-session"];
  const cookies = parseCookies(request.headers.cookie);
  const cookieSession = cookies[COOKIE_NAME];

  let sessionId = SESSION_PATTERN.test(String(headerSession || ""))
    ? String(headerSession)
    : SESSION_PATTERN.test(String(cookieSession || ""))
      ? String(cookieSession)
      : null;

  const usesHeader = Boolean(
    headerSession && SESSION_PATTERN.test(String(headerSession)),
  );

  if (!sessionId) {
    sessionId = randomBytes(32).toString("base64url");
    if (!usesHeader) setSessionCookie(response, sessionId);
  }

  const sessionHash = createHmac("sha256", getSecret())
    .update(sessionId)
    .digest("hex");

  return { sessionHash, usesHeader };
}
