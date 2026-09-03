import { randomUUID } from "node:crypto";
import { createMissionPlanStream, isAiConfigured } from "./_lib/ai.js";
import {
  consumeRateLimit,
  createMission,
  isDatabaseConfigured,
} from "./_lib/db.js";
import { createFallbackMissionPlan, shouldUseFallback } from "./_lib/fallback.js";
import {
  applyCors,
  publicError,
  readJson,
  rejectUnsupportedMethod,
  sendJson,
} from "./_lib/http.js";
import { analyzeRequestSchema, missionPlanSchema } from "./_lib/schema.js";
import { getSession, hasSessionSecret } from "./_lib/session.js";

export const maxDuration = 60;

function partialMission(value) {
  return {
    summary: value?.summary || "",
    steps: Array.isArray(value?.steps)
      ? value.steps.filter(Boolean).map((step) => ({
          title: step?.title || "",
          instruction: step?.instruction || "",
          targetText: step?.targetText || "",
          targetRole: step?.targetRole || "other",
          verification: step?.verification || "",
          caution: step?.caution || "",
        }))
      : [],
  };
}

export default async function handler(request, response) {
  if (!applyCors(request, response)) {
    return sendJson(response, 403, { error: "Origin is not allowed." });
  }
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") {
    return rejectUnsupportedMethod(request, response, ["POST"]);
  }

  if (!isDatabaseConfigured() || !hasSessionSecret()) {
    return sendJson(response, 503, {
      error: "GuideGPT is still completing its production setup.",
      code: "SERVICE_SETUP_REQUIRED",
    });
  }

  let streamStarted = false;

  try {
    const input = analyzeRequestSchema.parse(await readJson(request));
    const { sessionHash } = getSession(request, response);
    const rate = await consumeRateLimit(sessionHash);

    if (!rate.allowed) {
      response.setHeader("Retry-After", "60");
      return sendJson(response, 429, {
        error: "You have reached the short-term guidance limit. Try again in a minute.",
      });
    }

    const id = randomUUID();
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    response.setHeader("Cache-Control", "no-store, no-transform");
    response.setHeader("X-Accel-Buffering", "no");
    streamStarted = true;

    let plan = null;
    let usage = null;
    let generationMode = "fallback";

    if (isAiConfigured()) {
      let aiStream = null;
      try {
        aiStream = createMissionPlanStream(input, sessionHash);
        const { result } = aiStream;
        let lastPartial = "";

        for await (const value of result.partialOutputStream) {
          const payload = JSON.stringify({
            type: "partial",
            mission: {
              ...partialMission(value),
              language: input.language,
            },
          });
          if (payload !== lastPartial) {
            response.write(`${payload}\n`);
            lastPartial = payload;
          }
        }

        plan = missionPlanSchema.parse(await result.output);
        usage = await result.usage;
        generationMode = "ai";
      } catch (error) {
        const providerError = aiStream?.getProviderError() || error;
        if (!shouldUseFallback(providerError)) throw providerError;
        console.warn(
          "GuideGPT is using the safe fallback planner:",
          providerError?.message || "AI provider unavailable",
        );
      }
    }

    if (!plan) {
      plan = missionPlanSchema.parse(createFallbackMissionPlan(input));
      response.write(`${JSON.stringify({
        type: "notice",
        code: "BASIC_GUIDE",
        message: "AI guidance is unavailable, so GuideGPT created a safe basic guide.",
      })}\n`);
    }

    const mission = await createMission({
      id,
      sessionHash,
      goal: input.goal,
      pageUrl: input.pageUrl,
      pageTitle: input.pageTitle,
      language: input.language,
      summary: plan.summary,
      steps: plan.steps,
      usage,
      generationMode,
    });

    response.write(`${JSON.stringify({ type: "complete", mission })}\n`);
    response.end();
  } catch (error) {
    const safe = publicError(error);
    console.error("GuideGPT analyze error:", error?.message || "Unknown error");

    if (streamStarted) {
      response.write(
        `${JSON.stringify({ type: "error", error: safe.message })}\n`,
      );
      response.end();
      return;
    }

    sendJson(response, safe.statusCode, { error: safe.message });
  }
}
