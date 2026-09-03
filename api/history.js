import { clearMissions, isDatabaseConfigured, listMissions } from "./_lib/db.js";
import {
  applyCors,
  publicError,
  rejectUnsupportedMethod,
  sendJson,
} from "./_lib/http.js";
import { getSession, hasSessionSecret } from "./_lib/session.js";

export default async function handler(request, response) {
  if (!applyCors(request, response)) {
    return sendJson(response, 403, { error: "Origin is not allowed." });
  }
  if (request.method === "OPTIONS") return response.status(204).end();
  if (!["GET", "DELETE"].includes(request.method)) {
    return rejectUnsupportedMethod(request, response, ["GET", "DELETE"]);
  }
  if (!isDatabaseConfigured() || !hasSessionSecret()) {
    return sendJson(response, 503, {
      error: "Mission history is still being configured.",
      code: "SERVICE_SETUP_REQUIRED",
    });
  }

  try {
    const { sessionHash } = getSession(request, response);
    if (request.method === "DELETE") {
      const deleted = await clearMissions(sessionHash);
      return sendJson(response, 200, { deleted });
    }

    const missions = await listMissions(sessionHash);
    return sendJson(response, 200, { missions });
  } catch (error) {
    const safe = publicError(error);
    console.error("GuideGPT history error:", error?.message || "Unknown error");
    return sendJson(response, safe.statusCode, { error: safe.message });
  }
}
