/* content.js
   Minimal floating chat + screen-share prototype.
   Drop this file and style.css in a folder, load unpacked in Chrome.
*/

(() => {
  // Prevent injecting twice
  if (window.__guidegpt_injected) return;
  window.__guidegpt_injected = true;

  // ========== Create Floating Chat UI ==========
  const chatHtml = `
    <div id="guidegpt-root" aria-live="polite">
      <div id="gg-header">
        <strong>GuideGPT</strong>
        <button id="gg-close" title="Close">✕</button>
      </div>
      <div id="gg-body">
        <div id="gg-messages"></div>
        <div id="gg-controls">
          <button id="gg-share">Share My Screen</button>
          <input id="gg-input" placeholder="Ask for help (e.g. 'build a website')" />
        </div>
      </div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = chatHtml;
  document.body.appendChild(wrapper);

  // ========== Helpers ==========
  const $ = (sel) => document.querySelector(sel);
  const appendMsg = (text, who = 'bot') => {
    const m = document.createElement('div');
    m.className = 'gg-msg ' + (who === 'bot' ? 'bot' : 'user');
    m.textContent = text;
    $('#gg-messages').appendChild(m);
    $('#gg-messages').scrollTop = $('#gg-messages').scrollHeight;
  };

  // Close button
  $('#gg-close').addEventListener('click', () => {
    document.getElementById('guidegpt-root').style.display = 'none';
  });

  // ========== Basic Interaction ==========
  appendMsg('Hi — I can guide you step-by-step. Click "Share My Screen" to begin.');

  // Input enter -> simulate send
  $('#gg-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = e.target.value.trim();
      if (!v) return;
      appendMsg(v, 'user');
      e.target.value = '';
      // trigger mock AI analysis of the current visible page
      requestAiAssistance(v);
    }
  });

  // ========== Screen Sharing ==========
  let screenStream = null;
  let captureInterval = null; // interval id for periodic captures
  const FPS = 1; // capture 1 frame per second in prototype

  $('#gg-share').addEventListener('click', async () => {
    try {
      // Ask user to share screen (Chrome will show picker)
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: FPS },
        audio: false
      });

      appendMsg('Thanks — I can see your screen now. I will analyze and guide you (mocked).');

      // Create a small video preview so user knows sharing is active
      createPreview(videoFromStream(screenStream));

      // Start periodic capture (here we capture a still every few seconds)
      if (captureInterval) clearInterval(captureInterval);
      captureInterval = setInterval(() => {
        captureFrameAndAnalyze();
      }, 3000);

    } catch (err) {
      console.error('Screen share failed', err);
      appendMsg('Screen sharing canceled or blocked. Please allow screen share to proceed.');
    }
  });

  function videoFromStream(stream) {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    // keep it hidden by default; preview element will show it
    video.style.display = 'none';
    document.body.appendChild(video);
    return video;
  }

  function createPreview(video) {
    // Remove existing preview if present
    const prev = document.getElementById('gg-preview');
    if (prev) prev.remove();

    const p = document.createElement('div');
    p.id = 'gg-preview';
    p.innerHTML = '<div class="label">Screen sharing</div>';
    p.appendChild(video);
    document.body.appendChild(p);
    // Make video visible inside preview and small
    video.style.display = 'block';
    video.style.width = '200px';
    video.style.height = 'auto';
    video.style.border = '2px solid #007aff';
    video.style.borderRadius = '6px';
    video.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  }

  // ========== Capture Frame & Mock AI ==========
  async function captureFrameAndAnalyze() {
    try {
      const video = document.querySelector('#gg-preview video') || document.querySelector('video[srcObject]');
      if (!video || video.readyState < 2) return; // not ready

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // For prototype: we use the image data URL but do NOT send anywhere.
      const imageDataUrl = canvas.toDataURL('image/png');

      // Display a small "analysis" message
      appendMsg('Analyzing screen...', 'bot');

      // MOCK AI: For demo, we will generate a simple guidance by scanning visible DOM for common elements.
      // If you want to implement real AI, send imageDataUrl to your backend that calls OpenAI vision / OCR.
      setTimeout(() => {
        // create a mocked response based on some heuristics of the *actual* page DOM (not the image)
        const mock = generateMockGuidanceBasedOnDOM();
        appendMsg(mock.text);
        if (mock.box) {
          showHighlight(mock.box);
        }
      }, 900);
    } catch (err) {
      console.error('capture error', err);
    }
  }

  // Very small heuristic-based "AI" for demo only
  function generateMockGuidanceBasedOnDOM() {
    // Look for likely upload buttons or Create/New project buttons on the page
    const uploadBtn = findElementByText(/upload|choose file|browse/i);
    if (uploadBtn) {
      const rect = uploadBtn.getBoundingClientRect();
      return {
        text: "I see an Upload button — tap it to select your file (I'll highlight it).",
        box: normalizeRect(rect)
      };
    }

    const createBtn = findElementByText(/\b(create|new project|new)\b/i);
    if (createBtn) {
      const rect = createBtn.getBoundingClientRect();
      return {
        text: "I see a Create / New Project button — tap that to start a new website.",
        box: normalizeRect(rect)
      };
    }

    // fallback: guide to open browser address bar and go to replit.com
    const addressBarRect = { x: 20, y: 60, w: 400, h: 40 };
    return {
      text: "I don't see an obvious button. Let's open your browser and go to replit.com to build a website.",
      box: addressBarRect
    };
  }

  function findElementByText(regex) {
    // Search visible buttons/links that match regex
    const tags = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
    for (const el of tags) {
      const txt = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim();
      if (txt && regex.test(txt)) return el;
    }
    // also check labels
    const labels = Array.from(document.querySelectorAll('label'));
    for (const lb of labels) {
      if (regex.test(lb.innerText || '')) return lb;
    }
    return null;
  }

  function normalizeRect(r) {
    // convert DOMRect to simple object {x, y, w, h}
    return {
      x: r.left + window.scrollX,
      y: r.top + window.scrollY,
      w: r.width,
      h: r.height
    };
  }

  // ========== Highlight overlay ==========
  function showHighlight(box) {
    // Remove previous highlight
    const existing = document.getElementById('gg-highlight');
    if (existing) existing.remove();

    const o = document.createElement('div');
    o.id = 'gg-highlight';
    o.style.position = 'absolute';
    o.style.left = `${box.x}px`;
    o.style.top = `${box.y}px`;
    o.style.width = `${box.w}px`;
    o.style.height = `${box.h}px`;
    o.style.border = '3px solid #ff3b30';
    o.style.borderRadius = '8px';
    o.style.boxShadow = '0 6px 18px rgba(255,59,48,0.25)';
    o.style.pointerEvents = 'none';
    o.style.zIndex = 2147483647; // max z-index to sit on top
    document.body.appendChild(o);

    // Pulse then remove after a few seconds
    o.animate(
      [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.06)', opacity: 0.7 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 1200, iterations: 3 }
    );

    setTimeout(() => {
      if (o.parentNode) o.parentNode.removeChild(o);
    }, 4200);
  }

  // ========== Example: How to call a backend for real AI (commented) ==========
  /*
  async function sendImageToBackendForAI(imageDataUrl, userPrompt) {
    // Do NOT put your OpenAI key in front-end. Send to your backend which calls OpenAI.
    // Example POST payload:
    const resp = await fetch('https://your-backend.example.com/api/guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl, prompt: userPrompt })
    });
    const data = await resp.json();
    // data should include text response and optional bounding box {x,y,w,h}
    appendMsg(data.text);
    if (data.box) showHighlight(data.box);
  }
  */

  // ========== Utility to stop sharing when page unloads ==========
  window.addEventListener('beforeunload', () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    if (captureInterval) clearInterval(captureInterval);
  });

})();
