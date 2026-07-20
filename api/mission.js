import { isDatabaseConfigured, updateMission } from "./_lib/db.js";
import {
  applyCors,
  publicError,
  readJson,
  rejectUnsupportedMethod,
  sendJson,
} from "./_lib/http.js";
import { missionUpdateSchema } from "./_lib/schema.js";
import { getSession, hasSessionSecret } from "./_lib/session.js";

export default async function handler(request, response) {
  if (!applyCors(request, response)) {
    return sendJson(response, 403, { error: "Origin is not allowed." });
  }
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "PATCH") {
    return rejectUnsupportedMethod(request, response, ["PATCH"]);
  }
  if (!isDatabaseConfigured() || !hasSessionSecret()) {
    return sendJson(response, 503, {
      error: "Mission progress is still being configured.",
      code: "SERVICE_SETUP_REQUIRED",
    });
  }

  try {
    const input = missionUpdateSchema.parse(await readJson(request, 4_000));
    const { sessionHash } = getSession(request, response);
    const mission = await updateMission({ sessionHash, ...input });
    if (!mission) return sendJson(response, 404, { error: "Mission not found." });
    return sendJson(response, 200, { mission });
  } catch (error) {
    const safe = publicError(error);
    console.error("GuideGPT mission error:", error?.message || "Unknown error");
    return sendJson(response, safe.statusCode, { error: safe.message });
  }
}
