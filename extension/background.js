const API_BASE = "https://guidegpt-next.vercel.app";

async function sessionId() {
  const stored = await chrome.storage.local.get("guidegptSessionId");
  if (stored.guidegptSessionId) return stored.guidegptSessionId;

  const id = crypto.randomUUID();
  await chrome.storage.local.set({ guidegptSessionId: id });
  return id;
}

async function apiFetch(path, options = {}) {
  const id = await sessionId();
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      Accept: "application/json",
      "X-GuideGPT-Session": id,
      ...(options.headers || {}),
    },
  });
  return response;
}

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "GuideGPT could not reach its service.");
  }
  return data;
}

async function notifyPartial(tabId, mission) {
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "GUIDEGPT_ANALYZE_PARTIAL",
      mission,
    });
  } catch {
    // The page may have navigated while generation was in progress.
  }
}

async function analyze(payload, tabId) {
  const response = await apiFetch("/api/analyze", {
    method: "POST",
    headers: {
      Accept: "application/x-ndjson",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return parseJson(response);
  if (!response.body) throw new Error("Streaming is unavailable.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let mission = null;

  async function handleLine(line) {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "partial") await notifyPartial(tabId, event.mission);
    if (event.type === "complete") mission = event.mission;
    if (event.type === "error") throw new Error(event.error);
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) await handleLine(line);
    if (done) break;
  }

  if (buffer.trim()) await handleLine(buffer);
  if (!mission) throw new Error("GuideGPT did not finish the plan.");
  return { mission };
}

async function handleMessage(message, sender) {
  switch (message.type) {
    case "GUIDEGPT_ANALYZE":
      return analyze(message.payload, sender.tab?.id);
    case "GUIDEGPT_HISTORY":
      return parseJson(await apiFetch("/api/history"));
    case "GUIDEGPT_UPDATE":
      return parseJson(await apiFetch("/api/mission", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.payload),
      }));
    case "GUIDEGPT_HEALTH":
      return parseJson(await apiFetch("/api/health"));
    default:
      throw new Error("Unknown GuideGPT request.");
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!String(message?.type || "").startsWith("GUIDEGPT_")) return false;

  handleMessage(message, sender)
    .then((data) => sendResponse({ ok: true, ...data }))
    .catch((error) => sendResponse({
      ok: false,
      error: error?.message || "GuideGPT request failed.",
    }));
  return true;
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "GUIDEGPT_TOGGLE" });
  } catch {
    // Restricted browser pages do not allow content scripts.
  }
});
