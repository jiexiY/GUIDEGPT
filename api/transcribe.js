import { gateway } from "@ai-sdk/gateway";
import { experimental_transcribe as transcribe } from "ai";
import { consumeRateLimit, isDatabaseConfigured } from "./_lib/db.js";
import { isAiConfigured } from "./_lib/ai.js";
import {
  applyCors,
  publicError,
  readJson,
  rejectUnsupportedMethod,
  RequestError,
  sendJson,
} from "./_lib/http.js";
import { getSession, hasSessionSecret } from "./_lib/session.js";
import { decodeTranscriptionRequest } from "./_lib/transcription.js";

export const maxDuration = 60;

const DEFAULT_TRANSCRIPTION_MODEL = "openai/whisper-1";
const TRANSCRIPTION_LANGUAGE_HINTS = {
  "en-US": "en",
  "zh-CN": "zh",
  "ko-KR": "ko",
  "ja-JP": "ja",
  "es-ES": "es",
  "ru-RU": "ru",
  "pt-BR": "pt",
};

export default async function handler(request, response) {
  if (!applyCors(request, response)) {
    return sendJson(response, 403, { error: "Origin is not allowed." });
  }
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") {
    return rejectUnsupportedMethod(request, response, ["POST"]);
  }

  if (!isAiConfigured() || !isDatabaseConfigured() || !hasSessionSecret()) {
    return sendJson(response, 503, {
      error: "Voice transcription is still completing its production setup.",
      code: "VOICE_SETUP_REQUIRED",
    });
  }

  try {
    const input = decodeTranscriptionRequest(await readJson(request, 3_100_000));

    const { sessionHash } = getSession(request, response);
    const rate = await consumeRateLimit(sessionHash);
    if (!rate.allowed) {
      response.setHeader("Retry-After", "60");
      return sendJson(response, 429, {
        error: "You have reached the short-term voice limit. Try again in a minute.",
      });
    }

    const result = await transcribe({
      model: gateway.transcriptionModel(
        process.env.TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL,
      ),
      audio: input.audio,
      abortSignal: AbortSignal.timeout(35_000),
      providerOptions: {
        gateway: {
          user: sessionHash.slice(0, 32),
          tags: ["product:guidegpt", "feature:voice-transcription"],
        },
        openai: {
          language: TRANSCRIPTION_LANGUAGE_HINTS[input.language],
        },
      },
    });

    const transcript = String(result.text || "").replace(/\s+/g, " ").trim().slice(0, 400);
    if (!transcript) {
      throw new RequestError(422, "No speech was detected. Try speaking closer to the microphone.");
    }

    return sendJson(response, 200, {
      transcript,
      detectedLanguage: result.language || "",
      selectedLanguage: input.language,
    });
  } catch (error) {
    const safe = publicError(error);
    console.error("GuideGPT transcription error:", error?.message || "Unknown error");
    return sendJson(response, safe.statusCode, {
      error: safe.statusCode >= 500
        ? "Voice transcription is temporarily unavailable. You can still type your question."
        : safe.message,
    });
  }
}
