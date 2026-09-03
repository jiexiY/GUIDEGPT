// content.js  — with tiny history (last 5 runs in localStorage)
(function () {
  const rootId = "guidegpt-root";
  if (document.getElementById(rootId)) return;

  // ---------- UI ----------
  const root = document.createElement("div");
  root.id = rootId;
  root.style.position = "fixed";
  root.style.right = "20px";
  root.style.bottom = "20px";
  root.style.width = "340px";
  root.style.fontFamily = "Inter, system-ui, sans-serif";
  root.style.zIndex = 2147483647;
  root.style.boxShadow = "0 8px 30px rgba(0,0,0,.25)";
  root.style.borderRadius = "16px";
  root.style.overflow = "hidden";
  root.style.background = "#121417";
  root.style.color = "#fff";
  root.innerHTML = `
    <div style="padding:12px 14px; background:#0b0e11; display:flex; align-items:center; gap:8px;">
      <div style="font-weight:700;">GuideGPT</div>
      <div style="flex:1;"></div>
      <button id="gg-history-toggle" title="History" style="border:0; background:#1b1f24; color:#fff; border:1px solid #2b3139; padding:6px 10px; border-radius:8px; font-size:12px;">History</button>
      <button id="gg-close" title="Close" style="border:0; background:#1b1f24; color:#fff; border:1px solid #2b3139; padding:6px 10px; border-radius:8px; font-size:14px;">×</button>
    </div>

    <div style="padding:12px; display:flex; gap:8px; align-items:center;">
      <label style="font-size:12px; opacity:.8;">Provider</label>
      <select id="gg-provider" style="flex:1; padding:6px; border-radius:8px; background:#1b1f24; color:#fff; border:1px solid #2b3139;">
        <option value="openai">OpenAI (screenshot)</option>
        <option value="perplexity">Perplexity (URL+text)</option>
      </select>
    </div>

    <div style="padding:0 12px 12px 12px;">
      <textarea id="gg-input" rows="3" placeholder="What do you want to do?" style="width:100%; resize:vertical; padding:10px; border-radius:10px; background:#1b1f24; color:#fff; border:1px solid #2b3139;"></textarea>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button id="gg-send" style="flex:1; padding:10px; border-radius:10px; border:0; background:#4f46e5; color:#fff; font-weight:600;">Send</button>
        <button id="gg-clear" style="padding:10px; border-radius:10px; border:1px solid #2b3139; background:#1b1f24; color:#fff;">Clear</button>
      </div>
    </div>

    <div id="gg-output" style="max-height:240px; overflow:auto; border-top:1px solid #2b3139; padding:12px; background:#0b0e11;"></div>

    <!-- History drawer -->
    <div id="gg-history" style="
      position:absolute; right:340px; bottom:0;
      width:320px; max-height:440px; overflow:auto;
      background:#0b0e11; border:1px solid #2b3139; border-radius:12px;
      display:none; padding:10px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <div style="font-weight:700;">History</div>
        <div style="flex:1;"></div>
        <button id="gg-history-clear" style="border:0; background:#1b1f24; color:#fff; border:1px solid #2b3139; padding:6px 10px; border-radius:8px; font-size:12px;">Clear All</button>
      </div>
      <div id="gg-history-list" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>
  `;
  document.body.appendChild(root);

  // ---------- History (localStorage) ----------
  const LS_KEY = "guidegpt_history_v1";

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch { return []; }
  }
  function saveHistoryItem(item) {
    const arr = loadHistory();
    arr.unshift(item);
    while (arr.length > 5) arr.pop();
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  }
  function clearHistory() {
    localStorage.removeItem(LS_KEY);
    renderHistory();
  }
  function renderHistory() {
    const box = document.getElementById("gg-history-list");
    const data = loadHistory();
    box.innerHTML = "";
    if (!data.length) {
      const empty = document.createElement("div");
      empty.style.opacity = ".7";
      empty.style.fontSize = "12px";
      empty.textContent = "No history yet.";
      box.appendChild(empty);
      return;
    }
    data.forEach((h, idx) => {
      const card = document.createElement("div");
      card.style.border = "1px solid #2b3139";
      card.style.borderRadius = "10px";
      card.style.padding = "10px";
      card.style.background = "#0f1216";
      card.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="font-size:11px; opacity:.7;">${new Date(h.ts).toLocaleString()}</span>
          <span style="margin-left:auto; font-size:11px; opacity:.75; border:1px solid #2b3139; padding:2px 6px; border-radius:999px;">${h.provider}</span>
        </div>
        <div style="margin-top:6px; font-weight:600; font-size:13px;">${escapeHtml(h.prompt).slice(0,140)}</div>
        <div style="margin-top:6px; font-size:12px; opacity:.85;">${(h.steps && h.steps[0]) ? escapeHtml(h.steps[0]).slice(0,160) : ""}</div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button data-idx="${idx}" class="gg-history-rerun" style="border:0; background:#4f46e5; color:#fff; padding:6px 10px; border-radius:8px; font-size:12px;">Re-run</button>
          <button data-idx="${idx}" class="gg-history-insert" style="border:1px solid #2b3139; background:#1b1f24; color:#fff; padding:6px 10px; border-radius:8px; font-size:12px;">Use prompt</button>
        </div>
      `;
      box.appendChild(card);
    });

    box.querySelectorAll(".gg-history-rerun").forEach(btn => {
      btn.onclick = async (e) => {
        const idx = Number(e.currentTarget.getAttribute("data-idx"));
        const h = loadHistory()[idx];
        if (!h) return;
        document.getElementById("gg-provider").value = h.provider;
        document.getElementById("gg-input").value = h.prompt;
        document.getElementById("gg-send").click();
      };
    });
    box.querySelectorAll(".gg-history-insert").forEach(btn => {
      btn.onclick = (e) => {
        const idx = Number(e.currentTarget.getAttribute("data-idx"));
        const h = loadHistory()[idx];
        if (!h) return;
        document.getElementById("gg-input").value = h.prompt;
      };
    });
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // ---------- Helpers ----------
  document.getElementById("gg-close").onclick = () => root.remove();
  document.getElementById("gg-history-toggle").onclick = () => {
    const panel = document.getElementById("gg-history");
    const isOpen = panel.style.display === "block";
    if (!isOpen) renderHistory();
    panel.style.display = isOpen ? "none" : "block";
  };
  document.getElementById("gg-history-clear").onclick = clearHistory;
  document.getElementById("gg-clear").onclick = () => {
    document.getElementById("gg-output").innerHTML = "";
    document.getElementById("gg-input").value = "";
  };

  function getVisibleText(limit = 12000) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.nodeValue && n.nodeValue.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    });
    let out = "", n;
    while ((n = walker.nextNode()) && out.length < limit) out += " " + n.nodeValue.trim();
    return out.slice(0, limit);
  }

  async function captureOneScreenshot() {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "browser" },
      audio: false
    });
    const track = stream.getVideoTracks()[0];
    const image = new ImageBitmap(await new ImageCapture(track).grabFrame());
    const canvas = document.createElement("canvas");
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    track.stop();
    return canvas.toDataURL("image/png", 0.92);
  }

  function renderJSON({ steps = [], tips = [], citations = [] } = {}) {
    const out = document.getElementById("gg-output");
    const ol = document.createElement("ol");
    ol.style.margin = "0"; ol.style.paddingLeft = "18px";
    steps.forEach((s) => {
      const li = document.createElement("li");
      li.style.margin = "6px 0"; li.textContent = s;
      ol.appendChild(li);
    });
    out.innerHTML = ""; out.appendChild(ol);
    if (tips.length) {
      const t = document.createElement("div");
      t.style.opacity = ".85"; t.style.marginTop = "8px";
      t.textContent = "Tips: " + tips.join(" • ");
      out.appendChild(t);
    }
    if (citations.length) {
      const c = document.createElement("div");
      c.style.marginTop = "8px";
      c.innerHTML = "Sources: " + citations.map(h => `<a href="${h}" target="_blank" rel="noreferrer">link</a>`).join(" ");
      out.appendChild(c);
    }
  }

  function setBusy(isBusy) {
    const btn = document.getElementById("gg-send");
    btn.disabled = isBusy;
    btn.textContent = isBusy ? "Working..." : "Send";
  }

  async function sendToServer(body) {
    const resp = await fetch("http://localhost:3001/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return resp.json().catch(() => ({}));
  }

  // ---------- Send ----------
  document.getElementById("gg-send").addEventListener("click", async () => {
    const prompt = document.getElementById("gg-input").value.trim();
    if (!prompt) return;
    const provider = document.getElementById("gg-provider").value;

    setBusy(true);
    try {
      let payload = { prompt };
      if (provider === "openai") {
        try { payload.imageDataUrl = await captureOneScreenshot(); }
        catch { /* user may cancel; send text-only */ }
      } else {
        payload.pageUrl = location.href;
        payload.pageText = getVisibleText();
      }

      const data = await sendToServer(payload);

      // Normalize response to {steps, tips, citations}
      const steps = data.steps || (data.message ? [data.message] : ["No response"]);
      const tips = data.tips || [];
      const citations = data.citations || [];
      renderJSON({ steps, tips, citations });

      // Save to history
      saveHistoryItem({
        ts: Date.now(),
        provider,
        prompt,
        steps: steps.slice(0, 3) // store only first few for brevity
      });
    } catch (e) {
      renderJSON({ steps: ["Network error"], tips: [String(e?.message || e)] });
    } finally {
      setBusy(false);
    }
  });
})();
