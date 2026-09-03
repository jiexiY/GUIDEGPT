import { RequestError } from "./http.js";
import { transcribeRequestSchema } from "./schema.js";

export { transcribeRequestSchema };

export const MIN_AUDIO_BYTES = 64;
export const MAX_AUDIO_BYTES = 2_200_000;

function decodeCanonicalBase64(value) {
  const decoded = Buffer.from(value, "base64");
  const canonical = decoded.toString("base64");
  const accepted = value.endsWith("=")
    ? value === canonical
    : value === canonical.replace(/=+$/, "");

  if (!accepted) {
    throw new RequestError(400, "Voice recording data must be valid base64.");
  }
  return decoded;
}

export function decodeTranscriptionRequest(value) {
  const input = transcribeRequestSchema.parse(value);
  const audio = decodeCanonicalBase64(input.audio);

  if (audio.length < MIN_AUDIO_BYTES || audio.length > MAX_AUDIO_BYTES) {
    throw new RequestError(413, "Voice recordings must be short and under 2 MB.");
  }

  return {
    audio,
    language: input.language,
    mediaType: input.mediaType,
  };
}
