import { useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowsOut,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  CopySimple,
  DotsSixVertical,
  Eye,
  LockSimple,
  Minus,
  Palette,
  PaperPlaneTilt,
  Sparkle,
  SpinnerGap,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trash,
  User,
  X,
} from "@phosphor-icons/react";
import { GuideBrand } from "./ProductHome";

const PREFERENCES_KEY = "guidegpt:capsule-preferences:v1";
const EDGE_MARGIN = 8;
const THEME_OPTIONS = [
  { id: "cobalt", label: "Cobalt" },
  { id: "violet", label: "Violet" },
  { id: "rose", label: "Rose" },
  { id: "amber", label: "Amber" },
  { id: "emerald", label: "Emerald" },
  { id: "graphite", label: "Graphite" },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function finiteOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function currentLayoutMode() {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth <= 560) return "mobile";
  if (window.innerWidth <= 900) return "tablet";
  return "desktop";
}

function defaultLayout(mode = currentLayoutMode()) {
  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 1024 : window.innerHeight;

  if (mode === "mobile") {
    const width = Math.max(300, viewportWidth - 16);
    const height = Math.min(625, viewportHeight * 0.74, viewportHeight - 16);
    return { x: 8, y: Math.max(8, viewportHeight - height - 8), width, height };
  }

  if (mode === "tablet") {
    const width = Math.min(600, viewportWidth - 24);
    const height = Math.min(650, viewportHeight * 0.72, viewportHeight - 28);
    return {
      x: Math.max(12, (viewportWidth - width) / 2),
      y: Math.max(14, viewportHeight - height - 14),
      width,
      height,
    };
  }

  const width = Math.min(570, viewportWidth - 36);
  const height = Math.min(650, viewportHeight - 190);
  return {
    x: clamp(viewportWidth * 0.54 - width / 2, EDGE_MARGIN, viewportWidth - width - EDGE_MARGIN),
    y: clamp(164, EDGE_MARGIN, viewportHeight - height - EDGE_MARGIN),
    width,
    height,
  };
}

function normalizeLayout(layout, mode = currentLayoutMode()) {
  if (typeof window === "undefined") return layout || defaultLayout(mode);
  const fallback = defaultLayout(mode);
  const viewportWidth = Math.max(window.innerWidth, 320);
  const viewportHeight = Math.max(window.innerHeight, 480);
  const minWidth = Math.min(mode === "mobile" ? 300 : 340, viewportWidth - EDGE_MARGIN * 2);
  const minHeight = Math.min(mode === "mobile" ? 360 : 420, viewportHeight - EDGE_MARGIN * 2);
  const width = clamp(finiteOr(layout?.width, fallback.width), minWidth, viewportWidth - EDGE_MARGIN * 2);
  const height = clamp(finiteOr(layout?.height, fallback.height), minHeight, viewportHeight - EDGE_MARGIN * 2);
  return {
    x: clamp(finiteOr(layout?.x, fallback.x), EDGE_MARGIN, viewportWidth - width - EDGE_MARGIN),
    y: clamp(finiteOr(layout?.y, fallback.y), EDGE_MARGIN, viewportHeight - height - EDGE_MARGIN),
    width,
    height,
  };
}

function readPreferences() {
  const fallback = { theme: "cobalt", layouts: {} };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || "null");
    const theme = THEME_OPTIONS.some((option) => option.id === saved?.theme) ? saved.theme : fallback.theme;
    return { theme, layouts: saved?.layouts && typeof saved.layouts === "object" ? saved.layouts : {} };
  } catch {
    return fallback;
  }
}

function MissionProgress({ mission }) {
  const total = mission?.steps?.length || 0;
  const current = Math.min(mission?.currentStep || 0, total);

  return (
    <ol className="capsule-plan" aria-label="Guide plan">
      {(mission?.steps || []).map((step, index) => {
        const complete = mission.status === "completed" || index < current;
        const active = mission.status !== "completed" && index === current;
        return (
          <li className={complete ? "is-complete" : active ? "is-active" : ""} key={`${step.title}-${index}`}>
            <span className="capsule-plan__marker" aria-hidden="true">
              {complete ? <Check size={12} weight="bold" /> : index + 1}
            </span>
            <span>{step.title || "Preparing the next step"}</span>
          </li>
        );
      })}
    </ol>
  );
}

function StepContents({ mission, onAdvance, onHighlight, compact = false }) {
  const total = mission?.steps?.length || 0;
  const index = Math.min(mission?.currentStep || 0, total);
  const step = mission?.steps?.[index];

  if (!step || mission.status === "completed") return null;

  return (
    <div className={compact ? "step-contents is-compact" : "step-contents"}>
      <div className="step-contents__topline">
        <strong>Step {index + 1} of {total}</strong>
        <span className="step-progress" aria-label={`${index + 1} of ${total} steps`}>
          {mission.steps.map((_, stepIndex) => (
            <span className={stepIndex <= index ? "is-active" : ""} key={stepIndex} />
          ))}
        </span>
      </div>
      <p>{step.instruction}</p>
      <div className="step-actions">
        {step.targetText && (
          <button type="button" onClick={() => onHighlight(step.targetText)}>
            <Target size={16} weight="bold" />Show me
          </button>
        )}
        <button className="is-primary" type="button" onClick={onAdvance}>
          Done <Check size={15} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function GuideTooltip({ mission, loading, theme, onAdvance, onHighlight }) {
  if (loading || !mission?.steps?.length || mission.status === "completed") return null;

  return (
    <aside className="guide-tooltip" data-theme={theme} data-guidegpt-ui aria-label="Current GuideGPT step" aria-live="polite">
      <StepContents mission={mission} onAdvance={onAdvance} onHighlight={onHighlight} />
    </aside>
  );
}

function HistoryView({ missions, onBack, onResume, onClear }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="capsule-history">
      <div className="capsule-history__heading">
        <button type="button" onClick={onBack} aria-label="Back to GuideGPT">
          <ArrowLeft size={18} />
        </button>
        <div>
          <span>Private to this browser</span>
          <h2>Mission history</h2>
        </div>
      </div>

      <div className="capsule-history__list">
        {missions.length === 0 ? (
          <div className="capsule-history__empty">
            <ClockCounterClockwise size={25} />
            <strong>No missions yet</strong>
            <span>Your saved guides will appear here.</span>
          </div>
        ) : missions.map((item) => (
          <button className="capsule-history__item" type="button" key={item.id} onClick={() => onResume(item)}>
            <span>{item.status}{item.generationMode === "fallback" ? " · basic guide" : ""}</span>
            <strong>{item.goal}</strong>
            <small>{item.pageTitle || item.pageUrl || "Untitled page"}</small>
          </button>
        ))}
      </div>

      {missions.length > 0 && (
        <div className="capsule-history__footer">
          {confirming ? (
            <div>
              <span>Clear all private mission history?</span>
              <button type="button" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="is-danger" type="button" onClick={onClear}>Clear</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)}><Trash size={15} />Clear history</button>
          )}
        </div>
      )}
    </div>
  );
}

export function FloatingGuide({
  open,
  historyOpen,
  health,
  mission,
  loading,
  error,
  composer,
  setComposer,
  missions,
  onOpen,
  onClose,
  onShowHistory,
  onBackFromHistory,
  onResume,
  onClearHistory,
  onSubmit,
  onAdvance,
  onHighlight,
}) {
  const [copied, setCopied] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [interaction, setInteraction] = useState("");
  const [initialPreferences] = useState(readPreferences);
  const [theme, setTheme] = useState(initialPreferences.theme);
  const [layoutMode, setLayoutMode] = useState(currentLayoutMode);
  const [layouts, setLayouts] = useState(initialPreferences.layouts);
  const layoutsRef = useRef(initialPreferences.layouts);
  const themeRef = useRef(initialPreferences.theme);
  const pointerStartRef = useRef(null);
  const total = mission?.steps?.length || 0;
  const complete = mission?.status === "completed" || (total > 0 && mission.currentStep >= total);
  const layout = normalizeLayout(layouts[layoutMode], layoutMode);

  function persistPreferences(nextLayouts = layoutsRef.current, nextTheme = themeRef.current) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ theme: nextTheme, layouts: nextLayouts }));
    } catch {
      // Personalization remains available for the current session when storage is blocked.
    }
  }

  function updateCurrentLayout(nextLayout, persist = false) {
    const normalized = normalizeLayout(nextLayout, layoutMode);
    const nextLayouts = { ...layoutsRef.current, [layoutMode]: normalized };
    layoutsRef.current = nextLayouts;
    setLayouts(nextLayouts);
    if (persist) persistPreferences(nextLayouts);
    return normalized;
  }

  function chooseTheme(nextTheme) {
    if (!THEME_OPTIONS.some((option) => option.id === nextTheme)) return;
    themeRef.current = nextTheme;
    setTheme(nextTheme);
    persistPreferences(layoutsRef.current, nextTheme);
  }

  function resetCurrentLayout() {
    updateCurrentLayout(defaultLayout(layoutMode), true);
  }

  function beginPointerInteraction(event, type) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerStartRef.current = {
      pointerId: event.pointerId,
      type,
      clientX: event.clientX,
      clientY: event.clientY,
      layout: { ...layout },
    };
    setInteraction(type);
  }

  function continuePointerInteraction(event) {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - start.clientX;
    const deltaY = event.clientY - start.clientY;
    if (start.type === "drag") {
      updateCurrentLayout({ ...start.layout, x: start.layout.x + deltaX, y: start.layout.y + deltaY });
      return;
    }
    updateCurrentLayout({
      ...start.layout,
      width: start.layout.width + deltaX,
      height: start.layout.height + deltaY,
    });
  }

  function endPointerInteraction(event) {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pointerStartRef.current = null;
    setInteraction("");
    persistPreferences();
  }

  function moveWithKeyboard(event) {
    const distance = event.shiftKey ? 24 : 8;
    const movement = {
      ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0],
      ArrowUp: [0, -distance],
      ArrowDown: [0, distance],
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    updateCurrentLayout({ ...layout, x: layout.x + movement[0], y: layout.y + movement[1] }, true);
  }

  function resizeWithKeyboard(event) {
    const distance = event.shiftKey ? 32 : 12;
    const change = {
      ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0],
      ArrowUp: [0, -distance],
      ArrowDown: [0, distance],
    }[event.key];
    if (!change) return;
    event.preventDefault();
    updateCurrentLayout({ ...layout, width: layout.width + change[0], height: layout.height + change[1] }, true);
  }

  useEffect(() => {
    function handleViewportChange() {
      const nextMode = currentLayoutMode();
      setLayoutMode(nextMode);
      const nextLayout = normalizeLayout(layoutsRef.current[nextMode], nextMode);
      const nextLayouts = { ...layoutsRef.current, [nextMode]: nextLayout };
      layoutsRef.current = nextLayouts;
      setLayouts(nextLayouts);
    }

    window.addEventListener("resize", handleViewportChange);
    return () => window.removeEventListener("resize", handleViewportChange);
  }, []);

  useEffect(() => {
    if (!open) setCustomizerOpen(false);
  }, [open]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") setCustomizerOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  async function copySummary() {
    const text = [mission?.summary, ...(mission?.steps || []).map((step, index) => `${index + 1}. ${step.title}: ${step.instruction}`)]
      .filter(Boolean)
      .join("\n");
    if (!text) return;
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!open) {
    return (
      <button className="guide-launcher" data-theme={theme} data-guidegpt-ui type="button" onClick={onOpen} aria-label="Open GuideGPT">
        <span><Sparkle size={17} weight="fill" /></span>
        <strong>GuideGPT</strong>
      </button>
    );
  }

  return (
    <>
      <aside
        className={`command-capsule${interaction ? ` is-${interaction}` : ""}`}
        data-theme={theme}
        data-guidegpt-ui
        aria-label="GuideGPT assistant"
        aria-live="polite"
        style={{
          left: `${layout.x}px`,
          top: `${layout.y}px`,
          right: "auto",
          bottom: "auto",
          width: `${layout.width}px`,
          height: `${layout.height}px`,
          maxHeight: "none",
          transform: "none",
        }}
      >
        <div className="capsule-header">
          <div className="capsule-header__identity">
            <button
              className="capsule-drag-handle"
              type="button"
              aria-label="Drag GuideGPT window"
              title="Drag window · Arrow keys also move it"
              onPointerDown={(event) => beginPointerInteraction(event, "drag")}
              onPointerMove={continuePointerInteraction}
              onPointerUp={endPointerInteraction}
              onPointerCancel={endPointerInteraction}
              onKeyDown={moveWithKeyboard}
            >
              <DotsSixVertical size={18} weight="bold" />
            </button>
            <GuideBrand compact />
          </div>
          <div className="capsule-header__status">
            <span className={health?.status === "ready" ? "is-ready" : ""} />
            {health?.status === "ready" ? "On this page" : "Demo mode"}
          </div>
          <div className="capsule-header__actions">
            <button
              type="button"
              onClick={() => setCustomizerOpen((current) => !current)}
              aria-label="Customize GuideGPT"
              aria-expanded={customizerOpen}
              title="Customize window"
            >
              <Palette size={18} />
            </button>
            <button type="button" onClick={onShowHistory} aria-label="Mission history" title="Mission history">
              <ClockCounterClockwise size={18} />
            </button>
            <button type="button" onClick={onClose} aria-label="Minimize GuideGPT" title="Minimize">
              <Minus size={18} />
            </button>
            <button type="button" onClick={onClose} aria-label="Close GuideGPT" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {customizerOpen && (
          <section className="capsule-customizer" aria-label="Customize GuideGPT window">
            <div className="capsule-customizer__heading">
              <div>
                <strong>Make it yours</strong>
                <span>Drag anywhere. Resize to any ratio.</span>
              </div>
              <span>{Math.round(layout.width)} × {Math.round(layout.height)}</span>
            </div>
            <div className="theme-options" role="group" aria-label="Window color">
              {THEME_OPTIONS.map((option) => (
                <button
                  className={theme === option.id ? "is-selected" : ""}
                  data-color={option.id}
                  type="button"
                  key={option.id}
                  onClick={() => chooseTheme(option.id)}
                  aria-label={`Use ${option.label} color`}
                  aria-pressed={theme === option.id}
                  title={option.label}
                >
                  <span aria-hidden="true">{theme === option.id && <Check size={12} weight="bold" />}</span>
                  <small>{option.label}</small>
                </button>
              ))}
            </div>
            <button className="reset-window" type="button" onClick={resetCurrentLayout}>
              <ArrowCounterClockwise size={15} />Reset size and position
            </button>
          </section>
        )}

        {historyOpen ? (
          <HistoryView
            missions={missions}
            onBack={onBackFromHistory}
            onResume={onResume}
            onClear={onClearHistory}
          />
        ) : (
          <>
            <div className="capsule-conversation">
              {mission?.goal && (
                <div className="conversation-turn is-user">
                  <span className="conversation-avatar"><User size={15} weight="fill" /></span>
                  <p>{mission.goal}</p>
                </div>
              )}

              <div className="conversation-turn is-assistant">
                <span className="conversation-avatar"><Sparkle size={14} weight="fill" /></span>
                <div>
                  {loading ? (
                    <div className="assistant-loading">
                      <SpinnerGap size={17} className="spin" />
                      <span>Reading the visible page and building your guide…</span>
                    </div>
                  ) : complete ? (
                    <>
                      <strong>Mission complete.</strong>
                      <p>{mission?.summary || "You finished every step in this guide."}</p>
                    </>
                  ) : (
                    <>
                      <p>{mission?.summary || "Tell me what you want to accomplish and I’ll guide you one safe step at a time."}</p>
                      <MissionProgress mission={mission} />
                    </>
                  )}
                  <div className="privacy-inline">
                    <LockSimple size={15} weight="fill" />
                    <span><strong>Privacy first.</strong> I only use what is visible on this page.</span>
                  </div>
                </div>
              </div>

              {!loading && mission && (
                <div className="response-actions" aria-label="Response actions">
                  <button type="button" aria-label="Helpful"><ThumbsUp size={16} /></button>
                  <button type="button" aria-label="Not helpful"><ThumbsDown size={16} /></button>
                  <button type="button" onClick={copySummary} aria-label="Copy guide"><CopySimple size={16} />{copied && <span>Copied</span>}</button>
                </div>
              )}

              <div className="mobile-step">
                <StepContents mission={mission} onAdvance={onAdvance} onHighlight={onHighlight} compact />
              </div>

              {error && <div className="capsule-error" role="alert">{error}</div>}
            </div>

            <form className="capsule-composer" onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="guide-composer">Ask GuideGPT about this page</label>
              <textarea
                id="guide-composer"
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder="Ask a follow-up or start a new guide…"
                maxLength={400}
                rows={2}
                disabled={loading}
              />
              <div className="composer-tools">
                <span><Eye size={15} />Visible page</span>
                <button type="submit" disabled={loading || composer.trim().length < 3} aria-label="Send to GuideGPT">
                  {loading ? <SpinnerGap size={17} className="spin" /> : <PaperPlaneTilt size={18} weight="fill" />}
                </button>
              </div>
            </form>
          </>
        )}

        <button
          className="capsule-resize-handle"
          type="button"
          aria-label="Resize GuideGPT window"
          title="Drag to resize · Arrow keys also resize"
          onPointerDown={(event) => beginPointerInteraction(event, "resize")}
          onPointerMove={continuePointerInteraction}
          onPointerUp={endPointerInteraction}
          onPointerCancel={endPointerInteraction}
          onKeyDown={resizeWithKeyboard}
        >
          <ArrowsOut size={15} weight="bold" />
        </button>
      </aside>

      {!historyOpen && (
        <GuideTooltip
          mission={mission}
          loading={loading}
          theme={theme}
          onAdvance={onAdvance}
          onHighlight={onHighlight}
        />
      )}
    </>
  );
}
