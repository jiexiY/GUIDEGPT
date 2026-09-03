import { isAiConfigured, selectedModel } from "./_lib/ai.js";
import { checkDatabase, isDatabaseConfigured } from "./_lib/db.js";
import { applyCors, sendJson } from "./_lib/http.js";
import { hasSessionSecret } from "./_lib/session.js";

export default async function handler(request, response) {
  if (!applyCors(request, response)) {
    return sendJson(response, 403, { error: "Origin is not allowed." });
  }
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET, OPTIONS");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const databaseConfigured = isDatabaseConfigured();
  let databaseReachable = false;
  if (databaseConfigured) {
    try {
      databaseReachable = await checkDatabase();
    } catch (error) {
      console.error(
        "GuideGPT database health error:",
        error?.message || "Unknown error",
      );
    }
  }

  const sessions = hasSessionSecret();
  const aiConfigured = isAiConfigured();
  const services = {
    guidance: databaseReachable && sessions,
    ai: aiConfigured,
    database: databaseReachable,
    sessions,
  };
  const ready = services.guidance;

  return sendJson(response, ready ? 200 : 503, {
    status: ready ? "ready" : "setup_required",
    services,
    mode: aiConfigured ? "ai_with_fallback" : "fallback",
    model: selectedModel(),
    version: "1.3.0",
  });
}
