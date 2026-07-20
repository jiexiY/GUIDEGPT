import { normalizeLanguage } from "./languages";

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "The request could not be completed.");
  }
  return data;
}

export function normalizeMission(mission, fallbackLanguage = "en-US") {
  if (!mission || typeof mission !== "object") return mission;
  return {
    ...mission,
    language: normalizeLanguage(mission.language || fallbackLanguage),
  };
}

export async function getHealth() {
  const response = await fetch("/api/health", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({
    status: "offline",
    services: {},
  }));
  return { ...data, httpOk: response.ok };
}

export async function getHistory() {
  const response = await fetch("/api/history", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await parseJson(response);
  return {
    ...data,
    missions: Array.isArray(data.missions)
      ? data.missions.map((mission) => normalizeMission(mission))
      : [],
  };
}

export async function clearHistory() {
  const response = await fetch("/api/history", {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  return parseJson(response);
}

export async function updateMission(payload) {
  const response = await fetch("/api/mission", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  return { ...data, mission: normalizeMission(data.mission) };
}

export async function transcribeAudio(audioBlob, language) {
  if (!(audioBlob instanceof Blob) || audioBlob.size < 64) {
    throw new Error("No voice recording was captured.");
  }
  if (audioBlob.size > 2_200_000) {
    throw new Error("Keep voice requests under about 30 seconds and try again.");
  }

  const bytes = new Uint8Array(await audioBlob.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32_768));
  }

  const supportedMediaTypes = new Set([
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/mpeg",
  ]);
  const detectedMediaType = String(audioBlob.type || "").split(";")[0].toLowerCase();
  const mediaType = supportedMediaTypes.has(detectedMediaType) ? detectedMediaType : "audio/webm";
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio: window.btoa(binary),
      language,
      mediaType,
    }),
  });
  const data = await parseJson(response);
  return data.transcript || "";
}

export async function streamMission(payload, onPartial) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      Accept: "application/x-ndjson",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return parseJson(response);
  }
  if (!response.body) throw new Error("Streaming is not supported in this browser.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completedMission = null;
  const requestLanguage = normalizeLanguage(payload.language);

  function consumeLine(line) {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "partial") {
      onPartial?.(normalizeMission(event.mission, requestLanguage));
    }
    if (event.type === "complete") {
      completedMission = normalizeMission(event.mission, requestLanguage);
    }
    if (event.type === "error") throw new Error(event.error);
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) consumeLine(line);
    if (done) break;
  }

  if (buffer.trim()) consumeLine(buffer);
  if (!completedMission) throw new Error("The guide ended before a plan was completed.");
  return { mission: completedMission };
}
