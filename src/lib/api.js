async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "The request could not be completed.");
  }
  return data;
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
  return parseJson(response);
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
  return parseJson(response);
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

  function consumeLine(line) {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "partial") onPartial?.(event.mission);
    if (event.type === "complete") completedMission = event.mission;
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
