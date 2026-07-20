(() => {
  if (window.top !== window || document.getElementById("guidegpt-extension-root")) return;

  const host = document.createElement("div");
  host.id = "guidegpt-extension-root";
  const shadow = host.attachShadow({ mode: "open" });
  document.documentElement.appendChild(host);

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        --gg-blue: #1457f5;
        --gg-blue-hover: #0e4ce2;
        --gg-blue-rgb: 20, 87, 245;
        --gg-blue-soft: #a9bfff;
        --gg-blue-kicker: #91adff;
        --gg-panel-rgb: 24, 32, 47;
        --gg-panel-alpha: .78;
        --gg-coral: #ff5148;
        --gg-ink: #172033;
        --gg-muted: #68758b;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      button, textarea, select { font: inherit; }
      button:focus-visible, textarea:focus-visible, select:focus-visible {
        outline: 3px solid rgba(var(--gg-blue-rgb), .32);
        outline-offset: 2px;
      }
      [hidden] { display: none !important; }
      #launcher {
        position: fixed;
        z-index: 2147483646;
        right: 20px;
        bottom: 20px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 0 14px 0 10px;
        border: 1px solid rgba(221, 227, 237, .94);
        border-radius: 11px;
        color: #253149;
        background: rgba(255, 255, 255, .72);
        box-shadow: 0 12px 30px rgba(30, 43, 68, .17);
        backdrop-filter: blur(18px);
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
      }
      .brand-dot {
        width: 27px;
        height: 27px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: white;
        background: var(--gg-blue);
        font-size: 12px;
        font-weight: 800;
      }
      #panel {
        position: fixed;
        z-index: 2147483647;
        right: 20px;
        bottom: 74px;
        width: min(360px, calc(100vw - 32px));
        max-height: min(680px, calc(100vh - 96px));
        overflow: auto;
        padding: 17px;
        border: 1px solid rgba(255, 255, 255, .88);
        border-radius: 14px;
        color: var(--gg-ink);
        background: rgba(248, 250, 253, .58);
        box-shadow: 0 24px 58px rgba(31, 44, 70, .22), inset 0 1px 0 rgba(255,255,255,.96);
        backdrop-filter: blur(24px) saturate(1.18);
      }
      .header, .header-actions, .brand, .row, .privacy {
        display: flex;
        align-items: center;
      }
      .header { justify-content: space-between; gap: 12px; }
      .header-actions { gap: 3px; }
      .header-actions .icon-button { width: auto; min-width: 38px; padding: 0 6px; }
      .brand { gap: 8px; color: var(--gg-blue); font-size: 11px; font-weight: 800; }
      .brand .brand-dot { width: 24px; height: 24px; font-size: 10px; }
      .drag-handle {
        min-height: 36px;
        padding: 0 7px 0 0;
        border: 0;
        border-radius: 9px;
        background: transparent;
        cursor: grab;
        user-select: none;
        touch-action: none;
      }
      .drag-handle:active { cursor: grabbing; }
      .drag-label {
        margin-left: 3px;
        color: #8995a9;
        font-size: 9px;
        font-weight: 650;
        letter-spacing: .04em;
      }
      .icon-button {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 8px;
        color: #536077;
        background: transparent;
        cursor: pointer;
        font-size: 12px;
      }
      .icon-button:hover { background: rgba(255,255,255,.62); }
      .text-button { width: auto; min-width: 42px; padding: 0 7px; }
      .customizer {
        margin: 10px 0 0;
        padding: 8px 10px;
        display: grid;
        gap: 10px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 10px;
        background: rgba(255,255,255,.05);
      }
      .customizer-label {
        color: #c6cedb;
        font-size: 10px;
        font-weight: 750;
      }
      .customizer-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .preference-controls { display: flex; align-items: center; gap: 7px; }
      .language-select, .voice-toggle {
        min-height: 34px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 8px;
        color: #edf1f7;
        background: rgba(7,12,20,.26);
        font-size: 10px;
        font-weight: 650;
      }
      .language-select { max-width: 150px; padding: 0 26px 0 9px; }
      .language-select option { color: #172033; background: #fff; }
      .voice-toggle { padding: 0 9px; cursor: pointer; }
      .voice-toggle[aria-pressed="true"] {
        border-color: rgba(var(--gg-blue-rgb), .7);
        color: #fff;
        background: rgba(var(--gg-blue-rgb), .24);
      }
      .voice-toggle:disabled, .microphone-button:disabled {
        cursor: not-allowed;
        opacity: .48;
      }
      .swatches { display: flex; align-items: center; gap: 6px; }
      .color-swatch {
        width: 28px;
        height: 28px;
        padding: 0;
        border: 2px solid rgba(255,255,255,.28);
        border-radius: 50%;
        background: var(--swatch);
        box-shadow: inset 0 0 0 2px rgba(15,20,29,.16);
        cursor: pointer;
      }
      .color-swatch:hover { transform: translateY(-1px); }
      .color-swatch[aria-pressed="true"] {
        border-color: #fff;
        box-shadow: 0 0 0 3px rgba(var(--gg-blue-rgb), .3), inset 0 0 0 2px rgba(15,20,29,.12);
      }
      .color-swatch[data-theme="cobalt"] { --swatch: #1457f5; }
      .color-swatch[data-theme="violet"] { --swatch: #8b5cf6; }
      .color-swatch[data-theme="rose"] { --swatch: #e94f79; }
      .color-swatch[data-theme="amber"] { --swatch: #e59a2f; }
      .color-swatch[data-theme="emerald"] { --swatch: #22b879; }
      .color-swatch[data-theme="graphite"] { --swatch: #7e8ba0; }
      .kicker {
        display: block;
        margin-top: 19px;
        color: #5675bd;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: .1em;
        text-transform: uppercase;
      }
      h2 {
        margin: 6px 0 0;
        color: var(--gg-ink);
        font-size: 19px;
        letter-spacing: -.03em;
      }
      .intro {
        margin: 7px 0 15px;
        color: var(--gg-muted);
        font-size: 11px;
        line-height: 1.5;
      }
      label { display: block; margin-bottom: 6px; color: #49556c; font-size: 10px; font-weight: 700; }
      textarea {
        width: 100%;
        min-height: 92px;
        resize: vertical;
        padding: 11px;
        border: 1px solid rgba(190, 200, 215, .92);
        border-radius: 9px;
        color: var(--gg-ink);
        background: rgba(255,255,255,.7);
        font-size: 12px;
        line-height: 1.45;
      }
      .goal-input-wrap { position: relative; }
      .goal-input-wrap textarea { padding-right: 72px; }
      .microphone-button {
        position: absolute;
        top: 8px;
        right: 8px;
        min-width: 54px;
        min-height: 34px;
        padding: 0 8px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 8px;
        color: #dce3ee;
        background: rgba(255,255,255,.07);
        cursor: pointer;
        font-size: 10px;
        font-weight: 750;
      }
      .microphone-button:hover:not(:disabled) { color: #fff; background: rgba(255,255,255,.12); }
      .microphone-button.is-listening {
        border-color: rgba(var(--gg-blue-rgb), .72);
        color: #fff;
        background: rgba(var(--gg-blue-rgb), .3);
        box-shadow: 0 0 0 3px rgba(var(--gg-blue-rgb), .14);
      }
      .speech-status {
        min-height: 15px;
        margin: 5px 0 0;
        color: #aeb8c8;
        font-size: 9px;
        line-height: 1.4;
      }
      .speech-status[data-state="listening"] { color: var(--gg-blue-soft); }
      .speech-status[data-state="ready"] { color: #b9efcb; }
      .speech-status[data-state="error"] { color: #ffd0d0; }
      .context {
        margin: 7px 0 11px;
        color: #758196;
        font-size: 9px;
      }
      .primary, .secondary, .history-item {
        border-radius: 8px;
        cursor: pointer;
      }
      .primary {
        width: 100%;
        min-height: 43px;
        border: 0;
        color: white;
        background: var(--gg-coral);
        box-shadow: 0 8px 18px rgba(255, 81, 72, .2);
        font-size: 12px;
        font-weight: 750;
      }
      .primary:hover { background: #f4443c; }
      .primary:disabled { cursor: not-allowed; opacity: .55; box-shadow: none; }
      .secondary {
        min-height: 38px;
        padding: 0 12px;
        border: 1px solid #cdd6e2;
        color: #3b475d;
        background: rgba(255,255,255,.5);
        font-size: 10px;
        font-weight: 650;
      }
      .secondary:hover { background: rgba(255,255,255,.84); }
      .link-button {
        padding: 0;
        border: 0;
        color: #315ec7;
        background: transparent;
        cursor: pointer;
        font-size: 10px;
        font-weight: 650;
      }
      .privacy {
        align-items: flex-start;
        gap: 6px;
        margin-top: 13px;
        color: #7d8799;
        font-size: 9px;
        line-height: 1.4;
      }
      .error {
        margin: 10px 0;
        padding: 9px 10px;
        border: 1px solid rgba(231, 139, 139, .48);
        border-radius: 8px;
        color: #983535;
        background: rgba(255, 241, 241, .74);
        font-size: 10px;
        line-height: 1.4;
      }
      .loading {
        min-height: 220px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 8px;
        text-align: center;
      }
      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #d9e1ef;
        border-top-color: var(--gg-blue);
        border-radius: 50%;
        animation: spin .9s linear infinite;
      }
      .loading strong { font-size: 12px; }
      .loading span { color: var(--gg-muted); font-size: 10px; }
      .progress {
        margin: 16px 0 13px;
        display: flex;
        gap: 5px;
      }
      .progress span {
        height: 4px;
        flex: 1;
        border-radius: 999px;
        background: #dbe1ea;
      }
      .progress span.done { background: var(--gg-blue); }
      .step-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        color: #768299;
        font-size: 9px;
        font-weight: 750;
        letter-spacing: .07em;
        text-transform: uppercase;
      }
      .target {
        max-width: 170px;
        overflow: hidden;
        color: #315ec7;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .step-card {
        margin-top: 9px;
        padding: 13px;
        border: 1px solid rgba(255,255,255,.82);
        border-radius: 11px;
        background: rgba(255,255,255,.42);
      }
      .step-card h3 { margin: 0; font-size: 14px; letter-spacing: -.02em; }
      .step-card > p { margin: 9px 0 0; color: #536077; font-size: 11px; line-height: 1.5; }
      .verify, .caution {
        margin-top: 10px;
        padding: 8px 9px;
        border-radius: 7px;
        font-size: 9px;
        line-height: 1.4;
      }
      .verify { color: #266a3e; background: rgba(235, 249, 240, .72); }
      .caution { color: #805a18; background: rgba(255, 247, 228, .76); }
      .mission-actions { margin-top: 12px; display: grid; grid-template-columns: 1.2fr .8fr; gap: 8px; }
      .pause-row { margin-top: 11px; display: flex; justify-content: space-between; align-items: center; }
      .complete {
        min-height: 260px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 8px;
        text-align: center;
      }
      .complete .check {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: #1f7a42;
        background: #e7f7ed;
        font-weight: 900;
      }
      .complete h3 { margin: 4px 0 0; font-size: 15px; }
      .complete p { margin: 0 0 8px; color: var(--gg-muted); font-size: 10px; line-height: 1.5; }
      .history-list { margin-top: 14px; display: grid; gap: 8px; }
      .history-item {
        display: grid;
        gap: 4px;
        padding: 10px;
        border: 1px solid rgba(213,220,231,.8);
        color: #2e3a50;
        background: rgba(255,255,255,.42);
        text-align: left;
      }
      .history-item:hover { border-color: #aebfe1; background: rgba(255,255,255,.72); }
      .history-item strong, .history-item span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .history-item strong { font-size: 10px; }
      .history-item span { color: #788499; font-size: 9px; }
      .history-empty { padding: 50px 10px; color: #7d8799; text-align: center; font-size: 10px; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 520px) {
        #panel { left: 12px; right: 12px; bottom: 72px; width: auto; max-height: calc(100vh - 92px); }
        #launcher { right: 12px; bottom: 14px; }
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: .01ms !important; scroll-behavior: auto !important; }
      }

      /* GuideGPT 1.3 command capsule */
      #launcher {
        top: 14px;
        right: auto;
        bottom: auto;
        left: 50%;
        min-height: 42px;
        padding: 0 14px 0 8px;
        border-color: rgba(255, 255, 255, .2);
        border-radius: 999px;
        color: #f7f9fd;
        background: rgba(var(--gg-panel-rgb), var(--gg-panel-alpha));
        box-shadow: 0 16px 38px rgba(18, 28, 47, .24), inset 0 1px 0 rgba(255, 255, 255, .14);
        backdrop-filter: blur(24px) saturate(1.12);
        transform: translateX(-50%);
      }
      #panel {
        top: 16px;
        right: auto;
        bottom: auto;
        left: 50%;
        width: min(680px, calc(100vw - 28px));
        max-height: min(76vh, 700px);
        padding: 20px 22px;
        border-color: rgba(255, 255, 255, .2);
        border-radius: 18px;
        color: #f6f8fd;
        background: rgba(var(--gg-panel-rgb), var(--gg-panel-alpha));
        box-shadow: 0 30px 74px rgba(18, 28, 47, .3), inset 0 1px 0 rgba(255, 255, 255, .15);
        backdrop-filter: blur(28px) saturate(1.12);
        transform: translateX(-50%);
        scrollbar-color: rgba(255,255,255,.2) transparent;
      }
      #panel[data-sized="true"] {
        min-width: min(320px, calc(100vw - 16px));
        min-height: min(260px, calc(100vh - 16px));
        max-width: calc(100vw - 16px);
        max-height: calc(100vh - 16px);
      }
      .header { padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,.13); }
      .brand { color: #f7f9fd; }
      .icon-button { color: #c4ccda; }
      .icon-button:hover { color: #fff; background: rgba(255,255,255,.08); }
      .kicker { color: var(--gg-blue-kicker); }
      h2 { color: #fff; font-size: 21px; }
      .intro { color: #b4bdcc; font-size: 12px; }
      label { color: #d2d8e3; }
      textarea {
        border-color: rgba(255,255,255,.18);
        color: #f7f9fd;
        background: rgba(7, 12, 20, .18);
      }
      textarea::placeholder { color: #98a3b5; }
      .context, .privacy { color: #a8b2c2; }
      .primary {
        background: var(--gg-blue);
        box-shadow: 0 9px 20px rgba(var(--gg-blue-rgb), .28);
      }
      .primary:hover { background: var(--gg-blue-hover); }
      .secondary {
        border-color: rgba(255,255,255,.18);
        color: #e0e5ee;
        background: rgba(255,255,255,.06);
      }
      .secondary:hover { color: #fff; background: rgba(255,255,255,.11); }
      .link-button { color: var(--gg-blue-soft); }
      .error { border-color: rgba(255,142,142,.3); color: #ffd6d6; background: rgba(113,30,30,.28); }
      .loading strong, .complete h3 { color: #f7f9fd; }
      .loading span, .complete p { color: #aeb8c8; }
      .progress span { background: rgba(255,255,255,.16); }
      .step-meta { color: #aeb8c8; }
      .target { color: var(--gg-blue-soft); }
      .step-card {
        border-color: rgba(255,255,255,.14);
        color: #f7f9fd;
        background: rgba(255,255,255,.05);
      }
      .step-card > p { color: #c1c9d6; }
      .verify { color: #b9efcb; background: rgba(45, 139, 78, .18); }
      .caution { color: #ffe1a6; background: rgba(139, 93, 21, .2); }
      .complete .check { color: #b9efcb; background: rgba(45,139,78,.2); }
      .history-item { border-color: rgba(255,255,255,.14); color: #edf0f7; background: rgba(255,255,255,.04); }
      .history-item:hover { border-color: rgba(var(--gg-blue-rgb), .5); background: rgba(255,255,255,.08); }
      .history-item span, .history-empty { color: #aab4c4; }
      #resize-handle {
        position: fixed;
        z-index: 2147483647;
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 9px;
        color: #f7f9fd;
        background: rgba(var(--gg-panel-rgb), .94);
        box-shadow: 0 8px 20px rgba(8,14,25,.24);
        cursor: nwse-resize;
        touch-action: none;
      }
      #resize-handle::before {
        content: "";
        width: 9px;
        height: 9px;
        border-right: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        opacity: .72;
      }

      @media (max-width: 620px) {
        #panel {
          top: auto !important;
          right: 8px !important;
          bottom: 8px !important;
          left: 8px !important;
          width: auto !important;
          height: auto !important;
          max-height: calc(100vh - 16px) !important;
          padding: 17px;
          border-radius: 15px;
          min-width: 0 !important;
          min-height: 0 !important;
          transform: none !important;
        }
        #launcher {
          top: auto;
          right: 12px;
          bottom: 12px;
          left: auto;
          transform: none;
        }
        .drag-handle { cursor: default; touch-action: auto; }
        .drag-label { display: none; }
        #resize-handle { display: none !important; }
        .customizer-row { align-items: flex-start; flex-direction: column; }
        .preference-controls { width: 100%; flex-wrap: wrap; }
      }
    </style>

    <button id="launcher" type="button" aria-label="Open GuideGPT">
      <span class="brand-dot">G</span><span id="launcher-label">GuideGPT</span>
    </button>

    <section id="panel" hidden aria-label="GuideGPT" aria-live="polite">
      <div id="panel-header" class="header">
        <div id="drag-handle" class="brand drag-handle" role="button" tabindex="0" aria-label="Move GuideGPT window. Drag or use arrow keys.">
          <span class="brand-dot">G</span><span>GUIDEGPT</span><span id="drag-label" class="drag-label" aria-hidden="true">Drag</span>
        </div>
        <div class="header-actions">
          <button id="customize-button" class="icon-button text-button" type="button" aria-label="Customize GuideGPT" aria-expanded="false">Options</button>
          <button id="history-button" class="icon-button" type="button" aria-label="Mission history">History</button>
          <button id="close-button" class="icon-button" type="button" aria-label="Close GuideGPT">Close</button>
        </div>
      </div>

      <div id="customizer" class="customizer" role="group" aria-label="GuideGPT options" hidden>
        <div class="customizer-row">
          <span id="window-color-label" class="customizer-label">Window color</span>
          <div class="swatches">
            <button class="color-swatch" data-theme="cobalt" type="button" aria-label="Cobalt" aria-pressed="true"></button>
            <button class="color-swatch" data-theme="violet" type="button" aria-label="Violet" aria-pressed="false"></button>
            <button class="color-swatch" data-theme="rose" type="button" aria-label="Rose" aria-pressed="false"></button>
            <button class="color-swatch" data-theme="amber" type="button" aria-label="Amber" aria-pressed="false"></button>
            <button class="color-swatch" data-theme="emerald" type="button" aria-label="Emerald" aria-pressed="false"></button>
            <button class="color-swatch" data-theme="graphite" type="button" aria-label="Graphite" aria-pressed="false"></button>
          </div>
        </div>
        <div class="customizer-row">
          <label id="language-label" class="customizer-label" for="language-select">Language</label>
          <div class="preference-controls">
            <select id="language-select" class="language-select" aria-label="Guide language">
              <option value="en-US">English (US)</option>
              <option value="zh-CN">简体中文</option>
              <option value="ko-KR">한국어</option>
              <option value="ja-JP">日本語</option>
              <option value="es-ES">Español</option>
              <option value="ru-RU">Русский</option>
              <option value="pt-BR">Português (Brasil)</option>
            </select>
            <button id="voice-over-toggle" class="voice-toggle" type="button" aria-pressed="false">Voice-over off</button>
          </div>
        </div>
      </div>

      <div id="start-view">
        <span id="start-kicker" class="kicker">Live page guidance</span>
        <h2 id="start-heading">What are you trying to do?</h2>
        <p id="start-intro" class="intro">Describe the outcome. GuideGPT uses the visible page to build a safe, confirmable plan.</p>
        <form id="goal-form">
          <label id="goal-label" for="goal-input">Your goal</label>
          <div class="goal-input-wrap">
            <textarea id="goal-input" maxlength="400" placeholder="Example: Invite a teammate and give them editor access"></textarea>
            <button id="microphone-button" class="microphone-button" type="button" aria-label="Start voice input">Mic</button>
          </div>
          <div id="speech-status" class="speech-status" role="status" aria-live="polite"></div>
          <div id="context-label" class="context">Visible text and controls on this page</div>
          <div id="start-error" class="error" hidden></div>
          <button id="start-button" class="primary" type="submit">Build my guide</button>
        </form>
        <div class="privacy"><span id="privacy-prefix">Private:</span><span id="privacy-text">Page text is used to build this guide and is not saved.</span></div>
      </div>

      <div id="loading-view" class="loading" hidden>
        <div class="spinner"></div>
        <strong id="loading-title">Building your guide</strong>
        <span id="loading-detail">Reading visible text and controls only</span>
      </div>

      <div id="mission-view" hidden>
        <div id="progress" class="progress"></div>
        <div class="step-meta">
          <span id="step-count"></span>
          <span id="target-label" class="target"></span>
        </div>
        <div id="step-card" class="step-card">
          <h3 id="step-title"></h3>
          <p id="step-instruction"></p>
          <div id="step-verify" class="verify"></div>
          <div id="step-caution" class="caution" hidden></div>
        </div>
        <div class="mission-actions">
          <button id="complete-step" class="primary" type="button">Mark step complete</button>
          <button id="show-target" class="secondary" type="button">Show me</button>
        </div>
        <div class="pause-row">
          <button id="pause-button" class="link-button" type="button">Pause mission</button>
          <button id="new-button" class="link-button" type="button">New mission</button>
        </div>
        <div id="mission-error" class="error" hidden></div>
      </div>

      <div id="complete-view" class="complete" hidden>
        <div class="check">OK</div>
        <h3 id="complete-title">Mission complete</h3>
        <p id="complete-summary"></p>
        <button id="complete-new" class="primary" type="button">Start another mission</button>
      </div>

      <div id="history-view" hidden>
        <span id="history-kicker" class="kicker">Private to this extension</span>
        <h2 id="history-title">Mission history</h2>
        <div id="history-list" class="history-list"></div>
        <div class="pause-row">
          <button id="history-back" class="link-button" type="button">Back</button>
        </div>
      </div>
    </section>

    <button id="resize-handle" type="button" aria-label="Resize GuideGPT window. Drag or use arrow keys." hidden></button>
  `;

  const q = (selector) => shadow.querySelector(selector);
  const panel = q("#panel");
  const views = {
    start: q("#start-view"),
    loading: q("#loading-view"),
    mission: q("#mission-view"),
    complete: q("#complete-view"),
    history: q("#history-view"),
  };
  let currentView = "start";
  let mission = null;
  let paused = false;
  let loading = false;

  const LAYOUT_STORAGE_KEY = "guidegptWindowV1";
  const DESKTOP_BREAKPOINT = 620;
  const TABLET_BREAKPOINT = 900;
  const LAYOUT_MODES = ["desktop", "tablet", "mobile"];
  const EDGE_MARGIN = 8;
  const MIN_PANEL_WIDTH = 320;
  const MIN_PANEL_HEIGHT = 260;
  const MAX_PANEL_WIDTH = 1200;
  const resizeHandle = q("#resize-handle");
  const dragHandle = q("#drag-handle");
  const mobileQuery = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT}px)`);
  const SUPPORTED_LANGUAGES = ["en-US", "zh-CN", "ko-KR", "ja-JP", "es-ES", "ru-RU", "pt-BR"];
  const englishStrings = {
    openGuide: "Open GuideGPT",
    moveGuide: "Move GuideGPT window. Drag or use arrow keys.",
    moveUnavailable: "GuideGPT window movement is available on larger screens.",
    resizeGuide: "Resize GuideGPT window. Drag or use arrow keys.",
    drag: "Drag",
    options: "Options",
    customizeGuide: "Customize GuideGPT",
    history: "History",
    close: "Close",
    windowColor: "Window color",
    language: "Language",
    guideLanguage: "Guide language",
    voiceOn: "Voice-over on",
    voiceOff: "Voice-over off",
    voiceUnavailable: "Voice-over is unavailable in this browser.",
    kicker: "Live page guidance",
    heading: "What are you trying to do?",
    intro: "Describe the outcome. GuideGPT uses the visible page to build a safe, confirmable plan.",
    goal: "Your goal",
    placeholder: "Example: Invite a teammate and give them editor access",
    context: "Visible text and controls on this page",
    build: "Build my guide",
    privatePrefix: "Private:",
    privateText: "Page text is used to build this guide and is not saved.",
    loadingTitle: "Building your guide",
    loadingDetail: "Reading visible text and controls only",
    markComplete: "Mark step complete",
    showMe: "Show me",
    pause: "Pause mission",
    resume: "Resume mission",
    newMission: "New mission",
    missionComplete: "Mission complete",
    completeDefault: "Your goal is complete.",
    startAnother: "Start another mission",
    historyKicker: "Private to this extension",
    historyTitle: "Mission history",
    back: "Back",
    noMissions: "No missions yet.",
    untitled: "Untitled page",
    basicGuide: "Basic guide / ",
    stepOf: "Step {current} of {total}",
    nextStep: "Next step",
    confirm: "Confirm:",
    defaultVerification: "Check that the page changed as expected.",
    targetMissing: "That control is not visible right now.",
    mic: "Mic",
    startVoice: "Start voice input",
    stopVoice: "Stop listening",
    listening: "Listening…",
    transcriptReady: "Transcript ready — review it, then send manually.",
    noSpeech: "No speech was detected. Try again or type your goal.",
    speechPermission: "Microphone access was blocked. Allow it in the browser or type your goal.",
    speechError: "Voice input stopped. Try again or type your goal.",
    micUnavailable: "Voice input is not supported here. You can still type your goal.",
    active: "active",
    paused: "paused",
    completed: "completed",
    fallback: "basic guide",
  };
  const strings = {
    "en-US": englishStrings,
    "zh-CN": {
      ...englishStrings,
      openGuide: "打开 GuideGPT", moveGuide: "移动 GuideGPT 窗口。拖动或使用方向键。", moveUnavailable: "GuideGPT 窗口只能在较大屏幕上移动。", resizeGuide: "调整 GuideGPT 窗口大小。拖动或使用方向键。", drag: "拖动", options: "设置", customizeGuide: "自定义 GuideGPT", history: "历史", close: "关闭", windowColor: "窗口颜色", language: "语言", guideLanguage: "引导语言", voiceOn: "朗读：开", voiceOff: "朗读：关", voiceUnavailable: "此浏览器不支持朗读。",
      kicker: "实时页面引导", heading: "你想完成什么？", intro: "描述你的目标。GuideGPT 会根据当前页面生成安全且可确认的步骤。", goal: "你的目标", placeholder: "例如：邀请队友并授予编辑权限", context: "当前页面可见的文字和控件", build: "生成引导", privatePrefix: "隐私：", privateText: "页面文字仅用于生成本次引导，不会保存。", loadingTitle: "正在生成引导", loadingDetail: "仅读取可见文字和控件",
      markComplete: "完成此步骤", showMe: "显示位置", pause: "暂停任务", resume: "继续任务", newMission: "新任务", missionComplete: "任务完成", completeDefault: "你的目标已完成。", startAnother: "开始新任务", historyKicker: "仅保存在此扩展中", historyTitle: "任务历史", back: "返回", noMissions: "暂无任务。", untitled: "未命名页面", basicGuide: "基础引导 / ", stepOf: "第 {current} 步，共 {total} 步", nextStep: "下一步", confirm: "确认：", defaultVerification: "检查页面是否按预期发生变化。", targetMissing: "当前看不到该控件。",
      mic: "语音", startVoice: "开始语音输入", stopVoice: "停止聆听", listening: "正在聆听…", transcriptReady: "转写已就绪，请检查后手动发送。", noSpeech: "未检测到语音。请重试或输入目标。", speechPermission: "麦克风权限被阻止。请在浏览器中允许，或输入目标。", speechError: "语音输入已停止。请重试或输入目标。", micUnavailable: "此处不支持语音输入，你仍可输入目标。", active: "进行中", paused: "已暂停", completed: "已完成", fallback: "基础引导",
    },
    "ko-KR": {
      ...englishStrings,
      openGuide: "GuideGPT 열기", moveGuide: "GuideGPT 창을 이동합니다. 드래그하거나 화살표 키를 사용하세요.", moveUnavailable: "GuideGPT 창 이동은 큰 화면에서 사용할 수 있습니다.", resizeGuide: "GuideGPT 창 크기를 조절합니다. 드래그하거나 화살표 키를 사용하세요.", drag: "드래그", options: "설정", customizeGuide: "GuideGPT 맞춤 설정", history: "기록", close: "닫기", windowColor: "창 색상", language: "언어", guideLanguage: "안내 언어", voiceOn: "음성 안내 켜짐", voiceOff: "음성 안내 꺼짐", voiceUnavailable: "이 브라우저에서는 음성 안내를 사용할 수 없습니다.",
      kicker: "실시간 페이지 안내", heading: "무엇을 하려고 하나요?", intro: "원하는 결과를 설명하세요. GuideGPT가 현재 페이지를 바탕으로 안전하고 확인 가능한 계획을 만듭니다.", goal: "목표", placeholder: "예: 팀원을 초대하고 편집 권한 부여", context: "이 페이지의 보이는 텍스트와 컨트롤", build: "가이드 만들기", privatePrefix: "개인정보:", privateText: "페이지 텍스트는 가이드 생성에만 사용되며 저장되지 않습니다.", loadingTitle: "가이드 만드는 중", loadingDetail: "보이는 텍스트와 컨트롤만 읽는 중",
      markComplete: "단계 완료", showMe: "위치 보기", pause: "미션 일시 중지", resume: "미션 계속", newMission: "새 미션", missionComplete: "미션 완료", completeDefault: "목표를 완료했습니다.", startAnother: "다른 미션 시작", historyKicker: "이 확장 프로그램에만 비공개", historyTitle: "미션 기록", back: "뒤로", noMissions: "아직 미션이 없습니다.", untitled: "제목 없는 페이지", basicGuide: "기본 가이드 / ", stepOf: "{total}단계 중 {current}단계", nextStep: "다음 단계", confirm: "확인:", defaultVerification: "페이지가 예상대로 변경되었는지 확인하세요.", targetMissing: "해당 컨트롤이 현재 보이지 않습니다.",
      mic: "음성", startVoice: "음성 입력 시작", stopVoice: "듣기 중지", listening: "듣는 중…", transcriptReady: "변환이 완료되었습니다. 검토한 뒤 직접 보내세요.", noSpeech: "음성이 감지되지 않았습니다. 다시 시도하거나 목표를 입력하세요.", speechPermission: "마이크 접근이 차단되었습니다. 브라우저에서 허용하거나 목표를 입력하세요.", speechError: "음성 입력이 중지되었습니다. 다시 시도하거나 목표를 입력하세요.", micUnavailable: "여기서는 음성 입력을 지원하지 않습니다. 텍스트 입력은 계속 사용할 수 있습니다.", active: "진행 중", paused: "일시 중지", completed: "완료", fallback: "기본 가이드",
    },
    "ja-JP": {
      ...englishStrings,
      openGuide: "GuideGPT を開く", moveGuide: "GuideGPT ウィンドウを移動します。ドラッグまたは矢印キーを使用してください。", moveUnavailable: "GuideGPT の移動は大きな画面で利用できます。", resizeGuide: "GuideGPT ウィンドウのサイズを変更します。ドラッグまたは矢印キーを使用してください。", drag: "移動", options: "設定", customizeGuide: "GuideGPT をカスタマイズ", history: "履歴", close: "閉じる", windowColor: "ウィンドウ色", language: "言語", guideLanguage: "ガイド言語", voiceOn: "読み上げ：オン", voiceOff: "読み上げ：オフ", voiceUnavailable: "このブラウザでは読み上げを利用できません。",
      kicker: "リアルタイムページガイド", heading: "何をしたいですか？", intro: "目的を説明してください。GuideGPT が表示中のページから安全で確認可能な手順を作成します。", goal: "目的", placeholder: "例：メンバーを招待して編集権限を付与", context: "このページに表示されているテキストと操作項目", build: "ガイドを作成", privatePrefix: "プライベート：", privateText: "ページのテキストはガイド作成にのみ使用され、保存されません。", loadingTitle: "ガイドを作成中", loadingDetail: "表示中のテキストと操作項目のみを読み取り中",
      markComplete: "この手順を完了", showMe: "場所を表示", pause: "ミッションを一時停止", resume: "ミッションを再開", newMission: "新しいミッション", missionComplete: "ミッション完了", completeDefault: "目的を達成しました。", startAnother: "別のミッションを開始", historyKicker: "この拡張機能内でのみ非公開", historyTitle: "ミッション履歴", back: "戻る", noMissions: "ミッションはまだありません。", untitled: "無題のページ", basicGuide: "基本ガイド / ", stepOf: "{total} 件中 {current} 件目", nextStep: "次の手順", confirm: "確認：", defaultVerification: "ページが想定どおり変わったことを確認してください。", targetMissing: "その操作項目は現在表示されていません。",
      mic: "音声", startVoice: "音声入力を開始", stopVoice: "聞き取りを停止", listening: "聞き取り中…", transcriptReady: "文字起こしが完了しました。確認してから手動で送信してください。", noSpeech: "音声を検出できませんでした。再試行するか目的を入力してください。", speechPermission: "マイクへのアクセスがブロックされました。ブラウザで許可するか目的を入力してください。", speechError: "音声入力が停止しました。再試行するか目的を入力してください。", micUnavailable: "ここでは音声入力を利用できません。テキスト入力は使用できます。", active: "進行中", paused: "一時停止", completed: "完了", fallback: "基本ガイド",
    },
    "es-ES": {
      ...englishStrings,
      openGuide: "Abrir GuideGPT", moveGuide: "Mueve la ventana de GuideGPT. Arrastra o usa las flechas.", moveUnavailable: "El movimiento de GuideGPT está disponible en pantallas grandes.", resizeGuide: "Cambia el tamaño de GuideGPT. Arrastra o usa las flechas.", drag: "Mover", options: "Opciones", customizeGuide: "Personalizar GuideGPT", history: "Historial", close: "Cerrar", windowColor: "Color de ventana", language: "Idioma", guideLanguage: "Idioma de la guía", voiceOn: "Narración activada", voiceOff: "Narración desactivada", voiceUnavailable: "La narración no está disponible en este navegador.",
      kicker: "Guía de página en vivo", heading: "¿Qué quieres hacer?", intro: "Describe el resultado. GuideGPT usa la página visible para crear un plan seguro y verificable.", goal: "Tu objetivo", placeholder: "Ejemplo: Invitar a alguien y darle acceso de edición", context: "Texto y controles visibles de esta página", build: "Crear mi guía", privatePrefix: "Privado:", privateText: "El texto de la página se usa para crear esta guía y no se guarda.", loadingTitle: "Creando tu guía", loadingDetail: "Leyendo solo el texto y los controles visibles",
      markComplete: "Marcar paso completado", showMe: "Mostrar", pause: "Pausar misión", resume: "Reanudar misión", newMission: "Nueva misión", missionComplete: "Misión completada", completeDefault: "Tu objetivo está completo.", startAnother: "Iniciar otra misión", historyKicker: "Privado para esta extensión", historyTitle: "Historial de misiones", back: "Volver", noMissions: "Aún no hay misiones.", untitled: "Página sin título", basicGuide: "Guía básica / ", stepOf: "Paso {current} de {total}", nextStep: "Siguiente paso", confirm: "Confirma:", defaultVerification: "Comprueba que la página cambió como esperabas.", targetMissing: "Ese control no está visible ahora.",
      mic: "Voz", startVoice: "Iniciar entrada de voz", stopVoice: "Dejar de escuchar", listening: "Escuchando…", transcriptReady: "Transcripción lista: revísala y envíala manualmente.", noSpeech: "No se detectó voz. Inténtalo de nuevo o escribe tu objetivo.", speechPermission: "Se bloqueó el micrófono. Permítelo en el navegador o escribe tu objetivo.", speechError: "La entrada de voz se detuvo. Inténtalo de nuevo o escribe tu objetivo.", micUnavailable: "La entrada de voz no está disponible aquí. Puedes escribir tu objetivo.", active: "activa", paused: "en pausa", completed: "completada", fallback: "guía básica",
    },
    "ru-RU": {
      ...englishStrings,
      openGuide: "Открыть GuideGPT", moveGuide: "Переместить окно GuideGPT. Перетащите его или используйте стрелки.", moveUnavailable: "Перемещение GuideGPT доступно на больших экранах.", resizeGuide: "Изменить размер GuideGPT. Перетащите маркер или используйте стрелки.", drag: "Переместить", options: "Настройки", customizeGuide: "Настроить GuideGPT", history: "История", close: "Закрыть", windowColor: "Цвет окна", language: "Язык", guideLanguage: "Язык инструкций", voiceOn: "Озвучивание включено", voiceOff: "Озвучивание выключено", voiceUnavailable: "Озвучивание недоступно в этом браузере.",
      kicker: "Инструкции на текущей странице", heading: "Что вы хотите сделать?", intro: "Опишите результат. GuideGPT создаст безопасный и проверяемый план по видимой странице.", goal: "Ваша цель", placeholder: "Например: пригласить коллегу и дать права редактора", context: "Видимый текст и элементы этой страницы", build: "Создать инструкцию", privatePrefix: "Конфиденциально:", privateText: "Текст страницы используется только для создания инструкции и не сохраняется.", loadingTitle: "Создаём инструкцию", loadingDetail: "Читаем только видимый текст и элементы управления",
      markComplete: "Отметить шаг выполненным", showMe: "Показать", pause: "Приостановить задачу", resume: "Продолжить задачу", newMission: "Новая задача", missionComplete: "Задача выполнена", completeDefault: "Ваша цель достигнута.", startAnother: "Начать другую задачу", historyKicker: "Доступно только этому расширению", historyTitle: "История задач", back: "Назад", noMissions: "Задач пока нет.", untitled: "Страница без названия", basicGuide: "Базовая инструкция / ", stepOf: "Шаг {current} из {total}", nextStep: "Следующий шаг", confirm: "Проверка:", defaultVerification: "Убедитесь, что страница изменилась ожидаемым образом.", targetMissing: "Этот элемент сейчас не виден.",
      mic: "Голос", startVoice: "Начать голосовой ввод", stopVoice: "Остановить прослушивание", listening: "Слушаю…", transcriptReady: "Текст готов — проверьте его и отправьте вручную.", noSpeech: "Речь не обнаружена. Повторите или введите цель.", speechPermission: "Доступ к микрофону заблокирован. Разрешите его или введите цель.", speechError: "Голосовой ввод остановлен. Повторите или введите цель.", micUnavailable: "Голосовой ввод здесь не поддерживается. Цель можно ввести текстом.", active: "активна", paused: "приостановлена", completed: "выполнена", fallback: "базовая инструкция",
    },
    "pt-BR": {
      ...englishStrings,
      openGuide: "Abrir GuideGPT", moveGuide: "Mova a janela do GuideGPT. Arraste ou use as setas.", moveUnavailable: "O movimento do GuideGPT está disponível em telas maiores.", resizeGuide: "Redimensione o GuideGPT. Arraste ou use as setas.", drag: "Mover", options: "Opções", customizeGuide: "Personalizar GuideGPT", history: "Histórico", close: "Fechar", windowColor: "Cor da janela", language: "Idioma", guideLanguage: "Idioma do guia", voiceOn: "Narração ativada", voiceOff: "Narração desativada", voiceUnavailable: "A narração não está disponível neste navegador.",
      kicker: "Orientação ao vivo na página", heading: "O que você quer fazer?", intro: "Descreva o resultado. O GuideGPT usa a página visível para criar um plano seguro e verificável.", goal: "Seu objetivo", placeholder: "Exemplo: convidar alguém e dar acesso de edição", context: "Texto e controles visíveis nesta página", build: "Criar meu guia", privatePrefix: "Privado:", privateText: "O texto da página é usado para criar este guia e não é salvo.", loadingTitle: "Criando seu guia", loadingDetail: "Lendo apenas texto e controles visíveis",
      markComplete: "Marcar etapa concluída", showMe: "Mostrar", pause: "Pausar missão", resume: "Retomar missão", newMission: "Nova missão", missionComplete: "Missão concluída", completeDefault: "Seu objetivo foi concluído.", startAnother: "Iniciar outra missão", historyKicker: "Privado para esta extensão", historyTitle: "Histórico de missões", back: "Voltar", noMissions: "Ainda não há missões.", untitled: "Página sem título", basicGuide: "Guia básico / ", stepOf: "Etapa {current} de {total}", nextStep: "Próxima etapa", confirm: "Confirme:", defaultVerification: "Confira se a página mudou como esperado.", targetMissing: "Esse controle não está visível agora.",
      mic: "Voz", startVoice: "Iniciar entrada de voz", stopVoice: "Parar de ouvir", listening: "Ouvindo…", transcriptReady: "Transcrição pronta — revise e envie manualmente.", noSpeech: "Nenhuma fala foi detectada. Tente novamente ou digite seu objetivo.", speechPermission: "O acesso ao microfone foi bloqueado. Permita no navegador ou digite seu objetivo.", speechError: "A entrada de voz parou. Tente novamente ou digite seu objetivo.", micUnavailable: "A entrada de voz não é compatível aqui. Você ainda pode digitar seu objetivo.", active: "ativa", paused: "pausada", completed: "concluída", fallback: "guia básico",
    },
  };
  const themes = {
    cobalt: {
      accent: "#1457f5",
      hover: "#0e4ce2",
      rgb: "20, 87, 245",
      soft: "#a9bfff",
      kicker: "#91adff",
      panel: "24, 32, 47",
      alpha: ".78",
    },
    violet: {
      accent: "#8b5cf6",
      hover: "#7645e8",
      rgb: "139, 92, 246",
      soft: "#d0bcff",
      kicker: "#b99bff",
      panel: "40, 29, 58",
      alpha: ".78",
    },
    rose: {
      accent: "#e94f79",
      hover: "#d83c68",
      rgb: "233, 79, 121",
      soft: "#ffb5ca",
      kicker: "#f58dac",
      panel: "55, 27, 39",
      alpha: ".78",
    },
    amber: {
      accent: "#e59a2f",
      hover: "#cb7f19",
      rgb: "229, 154, 47",
      soft: "#ffda9a",
      kicker: "#f5c66f",
      panel: "54, 39, 23",
      alpha: ".78",
    },
    emerald: {
      accent: "#22b879",
      hover: "#139a62",
      rgb: "34, 184, 121",
      soft: "#a9efbd",
      kicker: "#80dca0",
      panel: "20, 48, 41",
      alpha: ".78",
    },
    graphite: {
      accent: "#9ca8bb",
      hover: "#7e8ba0",
      rgb: "156, 168, 187",
      soft: "#d7dde6",
      kicker: "#b8c1cf",
      panel: "28, 32, 39",
      alpha: ".82",
    },
  };
  const legacyThemes = { blue: "cobalt", teal: "emerald", green: "emerald" };
  let layoutMode = currentLayoutMode();
  let layout = {
    theme: "cobalt",
    language: "en-US",
    voiceOver: false,
    layouts: Object.fromEntries(LAYOUT_MODES.map((mode) => [mode, { position: null, size: null }])),
  };
  let saveTimer = 0;
  let viewportFrame = 0;

  function supportedLanguage(value) {
    const normalized = String(value || "").replace("_", "-").toLowerCase();
    const exact = SUPPORTED_LANGUAGES.find((language) => language.toLowerCase() === normalized);
    if (exact) return exact;
    const prefix = normalized.split("-")[0];
    return SUPPORTED_LANGUAGES.find((language) => language.toLowerCase().startsWith(prefix + "-")) || null;
  }

  function normalizeLanguage(value) {
    return supportedLanguage(value) || "en-US";
  }

  function languageForMission(value = mission) {
    return supportedLanguage(value?.language) || normalizeLanguage(layout.language);
  }

  function translate(language, key, variables = {}) {
    const dictionary = strings[normalizeLanguage(language)] || englishStrings;
    return String(dictionary[key] ?? englishStrings[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? "");
  }

  function t(key, variables = {}) {
    return translate(layout.language, key, variables);
  }

  function finiteNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  }

  function currentLayoutMode() {
    if (window.innerWidth <= DESKTOP_BREAKPOINT) return "mobile";
    if (window.innerWidth <= TABLET_BREAKPOINT) return "tablet";
    return "desktop";
  }

  function sanitizeGeometry(value) {
    const x = finiteNumber(value?.position?.x);
    const y = finiteNumber(value?.position?.y);
    const width = finiteNumber(value?.size?.width);
    const height = finiteNumber(value?.size?.height);
    return {
      position: x === null || y === null ? null : { x, y },
      size: width === null || height === null ? null : { width, height },
    };
  }

  function sanitizeLayout(value) {
    const migratedTheme = legacyThemes[value?.theme] || value?.theme;
    const theme = themes[migratedTheme] ? migratedTheme : "cobalt";
    const language = normalizeLanguage(value?.language || navigator.language);
    const voiceOver = value?.voiceOver === true;
    const layouts = Object.fromEntries(
      LAYOUT_MODES.map((mode) => [mode, sanitizeGeometry(value?.layouts?.[mode])]),
    );
    if (!value?.layouts && (value?.position || value?.size)) {
      layouts[currentLayoutMode()] = sanitizeGeometry(value);
    }
    return { theme, language, voiceOver, layouts };
  }

  function activeLayout() {
    if (!layout.layouts[layoutMode]) layout.layouts[layoutMode] = sanitizeGeometry(null);
    return layout.layouts[layoutMode];
  }

  function readSavedLayout() {
    return new Promise((resolve) => {
      if (!chrome.storage?.local) {
        resolve(null);
        return;
      }
      try {
        chrome.storage.local.get(LAYOUT_STORAGE_KEY, (result) => {
          void chrome.runtime?.lastError;
          resolve(result?.[LAYOUT_STORAGE_KEY] || null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  function queueLayoutSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      const snapshot = {
        theme: layout.theme,
        language: normalizeLanguage(layout.language),
        voiceOver: layout.voiceOver === true,
        layouts: Object.fromEntries(
          LAYOUT_MODES.map((mode) => {
            const geometry = layout.layouts[mode] || sanitizeGeometry(null);
            return [mode, {
              position: geometry.position ? { ...geometry.position } : null,
              size: geometry.size ? { ...geometry.size } : null,
            }];
          }),
        ),
      };
      try {
        chrome.storage?.local?.set({ [LAYOUT_STORAGE_KEY]: snapshot }, () => {
          void chrome.runtime?.lastError;
        });
      } catch {
        // Customization remains available for the current page if storage is unavailable.
      }
    }, 140);
  }

  function applyTheme(name, persist = false) {
    const safeName = themes[name] ? name : "cobalt";
    const theme = themes[safeName];
    layout.theme = safeName;
    host.style.setProperty("--gg-blue", theme.accent);
    host.style.setProperty("--gg-blue-hover", theme.hover);
    host.style.setProperty("--gg-blue-rgb", theme.rgb);
    host.style.setProperty("--gg-blue-soft", theme.soft);
    host.style.setProperty("--gg-blue-kicker", theme.kicker);
    host.style.setProperty("--gg-panel-rgb", theme.panel);
    host.style.setProperty("--gg-panel-alpha", theme.alpha);
    shadow.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.setAttribute("aria-pressed", String(swatch.dataset.theme === safeName));
    });
    if (persist) queueLayoutSave();
  }

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const speechSynthesisSupported = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  let recognition = null;
  let listening = false;
  let speechBaseText = "";
  let speechDraft = "";
  let speechState = SpeechRecognitionAPI
    ? { type: "idle", key: "" }
    : { type: "error", key: "micUnavailable" };
  let lastSpokenKey = "";

  function setText(selector, key) {
    const element = q(selector);
    if (element) element.textContent = t(key);
  }

  function updateMicrophoneControl() {
    const button = q("#microphone-button");
    const status = q("#speech-status");
    button.disabled = !SpeechRecognitionAPI;
    button.classList.toggle("is-listening", listening);
    button.setAttribute("aria-pressed", String(listening));
    button.textContent = t("mic");
    button.setAttribute("aria-label", listening ? t("stopVoice") : t("startVoice"));
    button.title = SpeechRecognitionAPI
      ? (listening ? t("stopVoice") : t("startVoice"))
      : t("micUnavailable");
    status.dataset.state = speechState.type;
    status.textContent = speechState.key ? t(speechState.key) : "";
  }

  function setSpeechState(type, key = "") {
    speechState = { type, key };
    updateMicrophoneControl();
  }

  function updateVoiceOverControl() {
    const button = q("#voice-over-toggle");
    const enabled = speechSynthesisSupported && layout.voiceOver;
    button.disabled = !speechSynthesisSupported;
    button.setAttribute("aria-pressed", String(enabled));
    button.textContent = speechSynthesisSupported
      ? t(enabled ? "voiceOn" : "voiceOff")
      : t("voiceUnavailable");
    button.title = speechSynthesisSupported ? button.textContent : t("voiceUnavailable");
  }

  function applyLocale() {
    layout.language = normalizeLanguage(layout.language);
    panel.lang = layout.language;
    q("#launcher").lang = layout.language;
    q("#launcher").setAttribute("aria-label", t("openGuide"));
    q("#customizer").setAttribute("aria-label", t("customizeGuide"));
    q("#customize-button").setAttribute("aria-label", t("customizeGuide"));
    q("#history-button").setAttribute("aria-label", t("history"));
    q("#close-button").setAttribute("aria-label", t("close"));
    q("#resize-handle").setAttribute("aria-label", t("resizeGuide"));
    q("#language-select").setAttribute("aria-label", t("guideLanguage"));
    q("#language-select").value = layout.language;
    setText("#drag-label", "drag");
    setText("#customize-button", "options");
    setText("#history-button", "history");
    setText("#close-button", "close");
    setText("#window-color-label", "windowColor");
    setText("#language-label", "language");
    setText("#start-kicker", "kicker");
    setText("#start-heading", "heading");
    setText("#start-intro", "intro");
    setText("#goal-label", "goal");
    q("#goal-input").placeholder = t("placeholder");
    setText("#context-label", "context");
    setText("#start-button", "build");
    setText("#privacy-prefix", "privatePrefix");
    setText("#privacy-text", "privateText");
    setText("#loading-title", "loadingTitle");
    setText("#loading-detail", "loadingDetail");
    setText("#complete-step", "markComplete");
    setText("#show-target", "showMe");
    setText("#pause-button", paused ? "resume" : "pause");
    setText("#new-button", "newMission");
    setText("#complete-title", "missionComplete");
    setText("#complete-new", "startAnother");
    setText("#history-kicker", "historyKicker");
    setText("#history-title", "historyTitle");
    setText("#history-back", "back");
    updateMoveHandleAccessibility();
    updateMicrophoneControl();
    updateVoiceOverControl();
    if (mission && (currentView === "mission" || currentView === "complete")) renderMission();
  }

  function cancelRecognition() {
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // The recognition session may already have ended.
      }
    }
    recognition = null;
    listening = false;
    speechBaseText = "";
    speechDraft = "";
    setSpeechState(SpeechRecognitionAPI ? "idle" : "error", SpeechRecognitionAPI ? "" : "micUnavailable");
  }

  function startVoiceInput() {
    if (!SpeechRecognitionAPI) {
      setSpeechState("error", "micUnavailable");
      return;
    }
    if (listening && recognition) {
      try {
        recognition.stop();
      } catch {
        cancelRecognition();
      }
      return;
    }

    const input = q("#goal-input");
    speechBaseText = input.value.trim();
    speechDraft = "";
    const session = new SpeechRecognitionAPI();
    recognition = session;
    session.lang = normalizeLanguage(layout.language);
    session.continuous = false;
    session.interimResults = true;
    session.maxAlternatives = 1;
    session.onstart = () => {
      if (recognition !== session) return;
      listening = true;
      setSpeechState("listening", "listening");
    };
    session.onresult = (event) => {
      if (recognition !== session) return;
      const finalParts = [];
      const interimParts = [];
      for (let index = 0; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript?.trim();
        if (!transcript) continue;
        if (event.results[index].isFinal) finalParts.push(transcript);
        else interimParts.push(transcript);
      }
      speechDraft = [...finalParts, ...interimParts].join(" ").trim();
      input.value = [speechBaseText, speechDraft].filter(Boolean).join(" ").slice(0, 400);
      if (finalParts.length) setSpeechState("ready", "transcriptReady");
      else setSpeechState("listening", "listening");
    };
    session.onerror = (event) => {
      if (recognition !== session) return;
      listening = false;
      const key = event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "speechPermission"
        : event.error === "no-speech"
          ? "noSpeech"
          : event.error === "aborted"
            ? ""
            : "speechError";
      setSpeechState(key ? "error" : "idle", key);
    };
    session.onend = () => {
      if (recognition !== session) return;
      recognition = null;
      listening = false;
      if (speechState.type === "listening") {
        setSpeechState(speechDraft ? "ready" : "idle", speechDraft ? "transcriptReady" : "");
      } else {
        updateMicrophoneControl();
      }
      if (speechDraft) input.focus();
    };
    try {
      session.start();
    } catch {
      if (recognition === session) recognition = null;
      listening = false;
      setSpeechState("error", "speechError");
    }
  }

  function cancelVoiceOver() {
    if (speechSynthesisSupported) window.speechSynthesis.cancel();
  }

  function voiceForLanguage(language) {
    if (!speechSynthesisSupported) return null;
    const normalized = normalizeLanguage(language).toLowerCase();
    const prefix = normalized.split("-")[0];
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang.toLowerCase() === normalized)
      || voices.find((voice) => voice.lang.toLowerCase().split("-")[0] === prefix)
      || null;
  }

  function speakCurrentMission(force = false) {
    if (!speechSynthesisSupported || !layout.voiceOver || !mission) return;
    const total = mission.steps?.length || 0;
    const index = Math.min(mission.currentStep || 0, total);
    const spokenLanguage = languageForMission(mission);
    const missionKey = String(mission.id || mission.goal || "mission");
    const completed = mission.status === "completed" || index >= total;
    const spokenPrefix = `${spokenLanguage}:${missionKey}:`;
    const spokenKey = completed ? `${spokenPrefix}complete` : `${spokenPrefix}${index}`;
    if (!force && spokenKey === lastSpokenKey) return;

    const parts = [];
    const sameMission = lastSpokenKey.startsWith(spokenPrefix);
    if (mission.summary && (!sameMission || force || completed)) parts.push(mission.summary);
    if (completed) {
      parts.unshift(translate(spokenLanguage, "missionComplete"));
      if (!mission.summary) parts.push(translate(spokenLanguage, "completeDefault"));
    } else {
      const step = mission.steps?.[index];
      if (!step) return;
      parts.push(step.title || translate(spokenLanguage, "nextStep"));
      if (step.instruction) parts.push(step.instruction);
      parts.push(`${translate(spokenLanguage, "confirm")} ${step.verification || translate(spokenLanguage, "defaultVerification")}`);
      if (step.caution) parts.push(step.caution);
    }

    cancelVoiceOver();
    const utterance = new window.SpeechSynthesisUtterance(parts.join(". "));
    utterance.lang = spokenLanguage;
    const voice = voiceForLanguage(utterance.lang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    lastSpokenKey = spokenKey;
  }

  function updateResizeHandle() {
    if (panel.hidden || mobileQuery.matches) {
      resizeHandle.hidden = true;
      return;
    }
    const rect = panel.getBoundingClientRect();
    resizeHandle.hidden = false;
    resizeHandle.style.left = clamp(rect.right - 22, 0, window.innerWidth - 30) + "px";
    resizeHandle.style.top = clamp(rect.bottom - 22, 0, window.innerHeight - 30) + "px";
  }

  function freezePanelPosition() {
    if (mobileQuery.matches) return null;
    const rect = panel.getBoundingClientRect();
    const geometry = activeLayout();
    panel.style.left = rect.left + "px";
    panel.style.top = rect.top + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.transform = "none";
    geometry.position = { x: rect.left, y: rect.top };
    return rect;
  }

  function setPanelPosition(x, y, persist = false) {
    if (mobileQuery.matches) return;
    const rect = panel.getBoundingClientRect();
    const geometry = activeLayout();
    const safeX = clamp(x, EDGE_MARGIN, window.innerWidth - rect.width - EDGE_MARGIN);
    const safeY = clamp(y, EDGE_MARGIN, window.innerHeight - rect.height - EDGE_MARGIN);
    panel.style.left = safeX + "px";
    panel.style.top = safeY + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.transform = "none";
    geometry.position = { x: safeX, y: safeY };
    updateResizeHandle();
    if (persist) queueLayoutSave();
  }

  function setPanelSize(width, height, persist = false) {
    if (mobileQuery.matches) return;
    const rect = panel.getBoundingClientRect();
    const geometry = activeLayout();
    if (!geometry.position) freezePanelPosition();
    const left = geometry.position?.x ?? rect.left;
    const top = geometry.position?.y ?? rect.top;
    const maxWidth = Math.min(MAX_PANEL_WIDTH, window.innerWidth - left - EDGE_MARGIN);
    const maxHeight = window.innerHeight - top - EDGE_MARGIN;
    const minWidth = Math.min(MIN_PANEL_WIDTH, maxWidth);
    const minHeight = Math.min(MIN_PANEL_HEIGHT, maxHeight);
    const safeWidth = clamp(width, minWidth, maxWidth);
    const safeHeight = clamp(height, minHeight, maxHeight);
    panel.dataset.sized = "true";
    panel.style.width = safeWidth + "px";
    panel.style.height = safeHeight + "px";
    geometry.size = { width: safeWidth, height: safeHeight };
    updateResizeHandle();
    if (persist) queueLayoutSave();
  }

  function applyStoredGeometry() {
    if (panel.hidden || mobileQuery.matches) {
      updateResizeHandle();
      return;
    }

    const geometry = activeLayout();
    const current = panel.getBoundingClientRect();
    const requestedWidth = geometry.size?.width ?? current.width;
    const requestedHeight = geometry.size?.height ?? current.height;
    const maxWidth = Math.min(MAX_PANEL_WIDTH, window.innerWidth - EDGE_MARGIN * 2);
    const maxHeight = window.innerHeight - EDGE_MARGIN * 2;
    const width = clamp(requestedWidth, Math.min(MIN_PANEL_WIDTH, maxWidth), maxWidth);
    const height = clamp(requestedHeight, Math.min(MIN_PANEL_HEIGHT, maxHeight), maxHeight);
    const defaultX = (window.innerWidth - width) / 2;
    const x = clamp(geometry.position?.x ?? defaultX, EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN);
    const y = clamp(geometry.position?.y ?? current.top, EDGE_MARGIN, window.innerHeight - height - EDGE_MARGIN);

    if (geometry.size) {
      panel.dataset.sized = "true";
      panel.style.width = width + "px";
      panel.style.height = height + "px";
    }
    if (geometry.position || geometry.size) {
      panel.style.left = x + "px";
      panel.style.top = y + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.transform = "none";
    }
    updateResizeHandle();
  }

  function resetPanelGeometryStyles() {
    delete panel.dataset.sized;
    ["left", "top", "right", "bottom", "width", "height", "transform"].forEach((property) => {
      panel.style.removeProperty(property);
    });
  }

  function updateMoveHandleAccessibility() {
    const mobile = mobileQuery.matches;
    dragHandle.tabIndex = mobile ? -1 : 0;
    dragHandle.setAttribute("aria-disabled", String(mobile));
    dragHandle.setAttribute(
      "aria-label",
      t(mobile ? "moveUnavailable" : "moveGuide"),
    );
  }

  function showView(name) {
    currentView = name;
    Object.entries(views).forEach(([key, element]) => {
      element.hidden = key !== name;
    });
    window.requestAnimationFrame(() => {
      if (panel.hidden) return;
      const geometry = activeLayout();
      if (geometry.position && !mobileQuery.matches) {
        setPanelPosition(geometry.position.x, geometry.position.y);
      } else {
        updateResizeHandle();
      }
    });
  }

  function openPanel() {
    panel.hidden = false;
    q("#launcher").hidden = true;
    applyStoredGeometry();
    if (currentView === "start") q("#goal-input").focus();
  }

  function closePanel() {
    panel.hidden = true;
    q("#launcher").hidden = false;
    q("#customizer").hidden = true;
    q("#customize-button").setAttribute("aria-expanded", "false");
    resizeHandle.hidden = true;
    cancelRecognition();
    cancelVoiceOver();
  }

  function errorAt(selector, message = "") {
    const element = q(selector);
    element.textContent = message;
    element.hidden = !message;
  }

  async function send(message) {
    const response = await chrome.runtime.sendMessage(message);
    if (!response?.ok) throw new Error(response?.error || "GuideGPT request failed.");
    return response;
  }

  function isVisible(element) {
    if (!(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) > 0 &&
      rect.width > 0 &&
      rect.height > 0;
  }

  function roleFor(element) {
    const role = element.getAttribute("role");
    if (["button", "link", "tab", "menuitem"].includes(role)) return role;
    if (element.matches("button,[role='button']")) return "button";
    if (element.matches("a[href]")) return "link";
    if (element.matches("select")) return "select";
    if (element.matches("input,textarea")) return "input";
    return "other";
  }

  function labelFor(element) {
    return (
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.getAttribute("placeholder") ||
      element.textContent ||
      element.getAttribute("name") ||
      ""
    ).replace(/\s+/g, " ").trim().slice(0, 160);
  }

  const interactiveSelector = [
    "button",
    "a[href]",
    "input:not([type='password']):not([type='hidden'])",
    "select",
    "textarea",
    "[role='button']",
    "[role='tab']",
    "[role='menuitem']",
  ].join(",");

  function isInsideEditableRegion(element) {
    let current = element;
    while (current) {
      if (current.hasAttribute?.("contenteditable")) {
        const value = String(current.getAttribute("contenteditable") || "").trim().toLowerCase();
        if (value === "false") return false;
        if (value === "" || value === "true" || value === "plaintext-only") return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function collectPage() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const chunks = [];
    let length = 0;
    let node;

    while ((node = walker.nextNode()) && length < 12000) {
      const parent = node.parentElement;
      if (!parent || !isVisible(parent)) continue;
      if (parent.closest("script,style,noscript,template,input,textarea")) continue;
      if (isInsideEditableRegion(parent)) continue;
      const value = node.nodeValue.replace(/\s+/g, " ").trim();
      if (!value) continue;
      chunks.push(value);
      length += value.length + 1;
    }

    const seen = new Set();
    const interactiveElements = [];
    for (const element of document.querySelectorAll(interactiveSelector)) {
      if (!isVisible(element) || element === host) continue;
      if (isInsideEditableRegion(element)) continue;
      const label = labelFor(element);
      if (!label) continue;
      const item = { role: roleFor(element), label };
      const key = item.role + ":" + item.label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      interactiveElements.push(item);
      if (interactiveElements.length >= 80) break;
    }

    return {
      pageUrl: location.origin + location.pathname,
      pageTitle: document.title,
      pageContext: chunks.join(" ").slice(0, 12000),
      interactiveElements,
    };
  }

  function renderMission() {
    if (!mission) return;
    const total = mission.steps?.length || 0;
    const index = Math.min(mission.currentStep || 0, total);

    if (mission.status === "completed" || index >= total) {
      q("#complete-summary").textContent = mission.summary || t("completeDefault");
      showView("complete");
      speakCurrentMission();
      return;
    }

    const step = mission.steps[index];
    if (!step) return;
    showView("mission");
    q("#step-count").textContent = (mission.generationMode === "fallback" ? t("basicGuide") : "") + t("stepOf", { current: index + 1, total });
    q("#target-label").textContent = step.targetText || "";
    q("#step-title").textContent = step.title || t("nextStep");
    q("#step-instruction").textContent = step.instruction || "";
    q("#step-verify").textContent = t("confirm") + " " + (step.verification || t("defaultVerification"));
    q("#step-caution").textContent = step.caution || "";
    q("#step-caution").hidden = !step.caution;
    q("#show-target").hidden = !step.targetText;
    q("#pause-button").textContent = t(paused ? "resume" : "pause");

    const progress = q("#progress");
    progress.replaceChildren();
    mission.steps.forEach((_, stepIndex) => {
      const marker = document.createElement("span");
      if (stepIndex < index) marker.className = "done";
      progress.appendChild(marker);
    });
    speakCurrentMission();
  }

  function findTarget(text) {
    const needle = String(text || "").trim().toLowerCase();
    if (!needle) return null;
    for (const element of document.querySelectorAll(interactiveSelector)) {
      if (!isVisible(element)) continue;
      const label = labelFor(element).toLowerCase();
      if (label === needle || label.includes(needle) || needle.includes(label)) {
        return element;
      }
    }
    return null;
  }

  function highlightTarget(text) {
    const target = findTarget(text);
    if (!target) {
      errorAt("#mission-error", t("targetMissing"));
      return;
    }

    errorAt("#mission-error");
    const rect = target.getBoundingClientRect();
    const accent = themes[layout.theme] || themes.cobalt;
    const highlight = document.createElement("div");
    highlight.setAttribute("aria-hidden", "true");
    Object.assign(highlight.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "2147483645",
      left: Math.max(rect.left - 5, 0) + "px",
      top: Math.max(rect.top - 5, 0) + "px",
      width: rect.width + 10 + "px",
      height: rect.height + 10 + "px",
      border: `3px solid ${accent.accent}`,
      borderRadius: "9px",
      boxShadow: `0 0 0 9px rgba(${accent.rgb},.17)`,
    });
    document.documentElement.appendChild(highlight);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => highlight.remove(), 2400);
  }

  async function startMission(event) {
    event.preventDefault();
    if (listening && recognition) {
      try {
        recognition.stop();
      } catch {
        cancelRecognition();
      }
    }
    const goal = q("#goal-input").value.trim();
    if (goal.length < 3 || loading) return;

    loading = true;
    errorAt("#start-error");
    showView("loading");

    try {
      const result = await send({
        type: "GUIDEGPT_ANALYZE",
        payload: { goal, language: normalizeLanguage(layout.language), ...collectPage() },
      });
      mission = result.mission;
      paused = false;
      renderMission();
    } catch (error) {
      showView("start");
      errorAt("#start-error", error.message);
    } finally {
      loading = false;
    }
  }

  async function updateProgress(nextStep, status) {
    if (!mission?.id) return;
    try {
      const result = await send({
        type: "GUIDEGPT_UPDATE",
        payload: {
          id: mission.id,
          currentStep: nextStep,
          status,
        },
      });
      mission = result.mission;
      paused = mission.status === "paused";
      errorAt("#mission-error");
      renderMission();
    } catch (error) {
      errorAt("#mission-error", error.message);
    }
  }

  async function showHistory() {
    openPanel();
    showView("loading");
    try {
      const result = await send({ type: "GUIDEGPT_HISTORY" });
      const list = q("#history-list");
      list.replaceChildren();
      if (!result.missions?.length) {
        const empty = document.createElement("div");
        empty.className = "history-empty";
        empty.textContent = t("noMissions");
        list.appendChild(empty);
      } else {
        result.missions.forEach((item) => {
          const itemLanguage = languageForMission(item);
          const button = document.createElement("button");
          button.className = "history-item";
          button.type = "button";
          const title = document.createElement("strong");
          title.textContent = item.goal;
          title.lang = itemLanguage;
          title.dir = "auto";
          const page = document.createElement("span");
          page.textContent = item.pageTitle || item.pageUrl || t("untitled");
          const status = document.createElement("span");
          const localizedStatus = t(["active", "paused", "completed"].includes(item.status) ? item.status : "active");
          status.textContent = localizedStatus + (item.generationMode === "fallback" ? " / " + t("fallback") : "") + " / " + new Date(item.updatedAt).toLocaleString(layout.language);
          button.append(title, page, status);
          button.addEventListener("click", () => {
            mission = { ...item, language: itemLanguage };
            layout.language = itemLanguage;
            queueLayoutSave();
            applyLocale();
            paused = item.status === "paused";
            renderMission();
          });
          list.appendChild(button);
        });
      }
      showView("history");
    } catch (error) {
      showView("start");
      errorAt("#start-error", error.message);
    }
  }

  function newMission() {
    mission = null;
    paused = false;
    q("#goal-input").value = "";
    errorAt("#start-error");
    errorAt("#mission-error");
    cancelRecognition();
    cancelVoiceOver();
    lastSpokenKey = "";
    showView("start");
    q("#goal-input").focus();
  }

  let dragSession = null;
  let resizeSession = null;

  q("#panel-header").addEventListener("pointerdown", (event) => {
    if (mobileQuery.matches || event.button !== 0 || event.target.closest("button")) return;
    const rect = freezePanelPosition();
    if (!rect) return;
    event.preventDefault();
    dragSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
    };
    q("#panel-header").setPointerCapture?.(event.pointerId);
  });

  resizeHandle.addEventListener("pointerdown", (event) => {
    if (mobileQuery.matches || event.button !== 0) return;
    const rect = freezePanelPosition();
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    setPanelSize(rect.width, rect.height);
    resizeSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: rect.width,
      height: rect.height,
    };
    resizeHandle.setPointerCapture?.(event.pointerId);
  });

  window.addEventListener("pointermove", (event) => {
    if (dragSession?.pointerId === event.pointerId) {
      setPanelPosition(
        dragSession.left + event.clientX - dragSession.startX,
        dragSession.top + event.clientY - dragSession.startY,
      );
    }
    if (resizeSession?.pointerId === event.pointerId) {
      setPanelSize(
        resizeSession.width + event.clientX - resizeSession.startX,
        resizeSession.height + event.clientY - resizeSession.startY,
      );
    }
  });

  function finishPointerInteraction(event) {
    let changed = false;
    if (dragSession?.pointerId === event.pointerId) {
      dragSession = null;
      changed = true;
    }
    if (resizeSession?.pointerId === event.pointerId) {
      resizeSession = null;
      changed = true;
    }
    if (changed) queueLayoutSave();
  }

  window.addEventListener("pointerup", finishPointerInteraction);
  window.addEventListener("pointercancel", finishPointerInteraction);

  q("#drag-handle").addEventListener("keydown", (event) => {
    if (mobileQuery.matches || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const geometry = activeLayout();
    if (!geometry.position) freezePanelPosition();
    const amount = event.shiftKey ? 32 : 12;
    const horizontal = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0;
    const vertical = event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0;
    setPanelPosition((geometry.position?.x || 0) + horizontal, (geometry.position?.y || 0) + vertical, true);
  });

  resizeHandle.addEventListener("keydown", (event) => {
    if (mobileQuery.matches || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    const amount = event.shiftKey ? 32 : 12;
    const width = rect.width + (event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0);
    const height = rect.height + (event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0);
    setPanelSize(width, height, true);
  });

  q("#customize-button").addEventListener("click", () => {
    const customizer = q("#customizer");
    customizer.hidden = !customizer.hidden;
    q("#customize-button").setAttribute("aria-expanded", String(!customizer.hidden));
    if (!customizer.hidden) {
      shadow.querySelector(`.color-swatch[data-theme="${layout.theme}"]`)?.focus();
    }
    window.requestAnimationFrame(updateResizeHandle);
  });

  shadow.querySelectorAll(".color-swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      applyTheme(swatch.dataset.theme, true);
      q("#customizer").hidden = true;
      q("#customize-button").setAttribute("aria-expanded", "false");
      q("#customize-button").focus();
      window.requestAnimationFrame(updateResizeHandle);
    });
  });

  q("#microphone-button").addEventListener("click", startVoiceInput);
  q("#goal-input").addEventListener("input", () => {
    if (!listening && SpeechRecognitionAPI && speechState.type !== "idle") setSpeechState("idle");
  });
  q("#language-select").addEventListener("change", (event) => {
    cancelRecognition();
    layout.language = normalizeLanguage(event.target.value);
    queueLayoutSave();
    applyLocale();
    if (layout.voiceOver) {
      lastSpokenKey = "";
      speakCurrentMission(true);
    }
  });
  q("#voice-over-toggle").addEventListener("click", () => {
    if (!speechSynthesisSupported) return;
    layout.voiceOver = !layout.voiceOver;
    queueLayoutSave();
    updateVoiceOverControl();
    if (layout.voiceOver) {
      lastSpokenKey = "";
      speakCurrentMission(true);
    } else {
      cancelVoiceOver();
    }
  });

  q("#launcher").addEventListener("click", openPanel);
  q("#close-button").addEventListener("click", closePanel);
  q("#history-button").addEventListener("click", showHistory);
  q("#goal-form").addEventListener("submit", startMission);
  q("#show-target").addEventListener("click", () => {
    const step = mission?.steps?.[mission.currentStep];
    if (step) highlightTarget(step.targetText);
  });
  q("#complete-step").addEventListener("click", () => {
    if (!mission) return;
    const next = Math.min(mission.currentStep + 1, mission.steps.length);
    updateProgress(next, next >= mission.steps.length ? "completed" : "active");
  });
  q("#pause-button").addEventListener("click", () => {
    if (!mission) return;
    paused = !paused;
    updateProgress(mission.currentStep, paused ? "paused" : "active");
  });
  q("#new-button").addEventListener("click", newMission);
  q("#complete-new").addEventListener("click", newMission);
  q("#history-back").addEventListener("click", () => {
    if (mission) renderMission();
    else showView("start");
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "GUIDEGPT_TOGGLE") {
      if (panel.hidden) openPanel();
      else closePanel();
    }
    if (message.type === "GUIDEGPT_ANALYZE_PARTIAL" && loading) {
      mission = {
        ...(mission || {}),
        ...message.mission,
        currentStep: 0,
        status: "active",
      };
    }
  });

  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(viewportFrame);
    viewportFrame = window.requestAnimationFrame(() => {
      const nextMode = currentLayoutMode();
      if (nextMode !== layoutMode) {
        layoutMode = nextMode;
        resetPanelGeometryStyles();
      }
      updateMoveHandleAccessibility();
      if (mobileQuery.matches) {
        dragSession = null;
        resizeSession = null;
        resizeHandle.hidden = true;
      } else {
        applyStoredGeometry();
      }
    });
  });

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[LAYOUT_STORAGE_KEY]?.newValue) return;
    const previousLanguage = layout.language;
    const previousVoiceOver = layout.voiceOver;
    const spokenBeforeUpdate = lastSpokenKey;
    layout = sanitizeLayout(changes[LAYOUT_STORAGE_KEY].newValue);
    applyTheme(layout.theme);
    applyLocale();
    applyStoredGeometry();
    if (!layout.voiceOver) cancelVoiceOver();
    if (layout.voiceOver && lastSpokenKey === spokenBeforeUpdate && (!previousVoiceOver || previousLanguage !== layout.language)) {
      lastSpokenKey = "";
      speakCurrentMission(true);
    }
  });

  readSavedLayout().then((saved) => {
    layout = sanitizeLayout(saved);
    applyTheme(layout.theme);
    applyLocale();
    applyStoredGeometry();
  });

  applyLocale();

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || panel.hidden) return;
    if (!q("#customizer").hidden) {
      q("#customizer").hidden = true;
      q("#customize-button").setAttribute("aria-expanded", "false");
      q("#customize-button").focus();
      window.requestAnimationFrame(updateResizeHandle);
      return;
    }
    closePanel();
  });
})();
