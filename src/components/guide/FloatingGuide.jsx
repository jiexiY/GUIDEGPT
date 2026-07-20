import { useCallback, useEffect, useRef, useState } from "react";
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
  GlobeHemisphereWest,
  LockSimple,
  Minus,
  Palette,
  PaperPlaneTilt,
  Sparkle,
  SpeakerHigh,
  SpeakerSlash,
  SpinnerGap,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trash,
  User,
  X,
} from "@phosphor-icons/react";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { GuideBrand } from "./ProductHome";
import { LANGUAGE_OPTIONS, normalizeLanguage, t } from "@/lib/languages";
import { transcribeAudio } from "@/lib/api";
import {
  cancelSpeech,
  canRecognizeSpeech,
  canSpeak,
  missionSpeechLanguage,
  shouldCancelMissionSpeech,
  speak,
} from "@/lib/speech";

const PREFERENCES_KEY = "guidegpt:capsule-preferences:v1";
const VOICE_OVER_KEY = "guidegpt:voice-over:v1";
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

function readVoicePreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(VOICE_OVER_KEY) === "true";
  } catch {
    return false;
  }
}

function AssistantResponse({ children, language }) {
  return <p className="assistant-response" lang={language}>{children}</p>;
}

function MissionProgress({ mission, language }) {
  const total = mission?.steps?.length || 0;
  const current = Math.min(mission?.currentStep || 0, total);

  return (
    <ol className="capsule-plan" aria-label={t(language, "guidePlan")}>
      {(mission?.steps || []).map((step, index) => {
        const complete = mission.status === "completed" || index < current;
        const active = mission.status !== "completed" && index === current;
        return (
          <li className={complete ? "is-complete" : active ? "is-active" : ""} key={`${step.title}-${index}`}>
            <span className="capsule-plan__marker" aria-hidden="true">
              {complete ? <Check size={12} weight="bold" /> : index + 1}
            </span>
            <span>{step.title || t(language, "preparingStep")}</span>
          </li>
        );
      })}
    </ol>
  );
}

function StepContents({ mission, language, contentLanguage, onAdvance, onHighlight, compact = false }) {
  const total = mission?.steps?.length || 0;
  const index = Math.min(mission?.currentStep || 0, total);
  const step = mission?.steps?.[index];

  if (!step || mission.status === "completed") return null;

  return (
    <div className={compact ? "step-contents is-compact" : "step-contents"}>
      <div className="step-contents__topline">
        <strong>{t(language, "step", { current: index + 1, total })}</strong>
        <span className="step-progress" aria-label={t(language, "stepProgress", { current: index + 1, total })}>
          {mission.steps.map((_, stepIndex) => (
            <span className={stepIndex <= index ? "is-active" : ""} key={stepIndex} />
          ))}
        </span>
      </div>
      <p lang={contentLanguage}>{step.instruction}</p>
      <div className="step-actions">
        {step.targetText && (
          <button type="button" onClick={() => onHighlight(step.targetText)}>
            <Target size={16} weight="bold" />{t(language, "showMe")}
          </button>
        )}
        <button className="is-primary" type="button" onClick={onAdvance}>
          {t(language, "done")} <Check size={15} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function GuideTooltip({ mission, loading, theme, language, contentLanguage, onAdvance, onHighlight }) {
  if (loading || !mission?.steps?.length || mission.status === "completed") return null;

  return (
    <aside className="guide-tooltip" data-theme={theme} data-guidegpt-ui aria-label={t(language, "currentStep")} aria-live="polite">
      <StepContents mission={mission} language={language} contentLanguage={contentLanguage} onAdvance={onAdvance} onHighlight={onHighlight} />
    </aside>
  );
}

function HistoryView({ missions, language, onBack, onResume, onClear }) {
  const [confirming, setConfirming] = useState(false);
  const statusKeys = {
    active: "statusActive",
    paused: "statusPaused",
    completed: "statusCompleted",
  };

  return (
    <div className="capsule-history">
      <div className="capsule-history__heading">
        <button type="button" onClick={onBack} aria-label={t(language, "back")}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <span>{t(language, "privateBrowser")}</span>
          <h2>{t(language, "missionHistory")}</h2>
        </div>
      </div>

      <div className="capsule-history__list">
        {missions.length === 0 ? (
          <div className="capsule-history__empty">
            <ClockCounterClockwise size={25} />
            <strong>{t(language, "noMissions")}</strong>
            <span>{t(language, "savedGuides")}</span>
          </div>
        ) : missions.map((item) => (
          <button className="capsule-history__item" type="button" key={item.id} onClick={() => onResume(item)}>
            <span>
              {t(language, statusKeys[item.status] || "statusActive")}
              {item.generationMode === "fallback" ? ` · ${t(language, "basicGuide")}` : ""}
            </span>
            <strong>{item.goal}</strong>
            <small>{item.pageTitle || item.pageUrl || t(language, "untitledPage")}</small>
          </button>
        ))}
      </div>

      {missions.length > 0 && (
        <div className="capsule-history__footer">
          {confirming ? (
            <div>
              <span>{t(language, "clearHistoryPrompt")}</span>
              <button type="button" onClick={() => setConfirming(false)}>{t(language, "cancel")}</button>
              <button className="is-danger" type="button" onClick={onClear}>{t(language, "clear")}</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)}><Trash size={15} />{t(language, "clearHistory")}</button>
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
  language,
  mission,
  loading,
  error,
  composer,
  setComposer,
  missions,
  onOpen,
  onClose,
  onLanguageChange,
  onShowHistory,
  onBackFromHistory,
  onResume,
  onClearHistory,
  onSubmit,
  onAdvance,
  onHighlight,
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [interaction, setInteraction] = useState("");
  const [voiceOver, setVoiceOver] = useState(readVoicePreference);
  const [speaking, setSpeaking] = useState(false);
  const [voiceState, setVoiceState] = useState(() => ({
    available: canRecognizeSpeech(),
    isListening: false,
    isProcessing: false,
    mode: canRecognizeSpeech() ? "speech-recognition" : "none",
  }));
  const [voiceNotice, setVoiceNotice] = useState("");
  const [initialPreferences] = useState(readPreferences);
  const [theme, setTheme] = useState(initialPreferences.theme);
  const [layoutMode, setLayoutMode] = useState(currentLayoutMode);
  const [layouts, setLayouts] = useState(initialPreferences.layouts);
  const layoutsRef = useRef(initialPreferences.layouts);
  const themeRef = useRef(initialPreferences.theme);
  const pointerStartRef = useRef(null);
  const lastSpokenRef = useRef("");
  const total = mission?.steps?.length || 0;
  const complete = mission?.status === "completed" || (total > 0 && mission.currentStep >= total);
  const layout = normalizeLayout(layouts[layoutMode], layoutMode);
  const inputLanguage = normalizeLanguage(language);
  const missionLanguage = missionSpeechLanguage(mission, language);

  const handleVoiceState = useCallback((nextState) => {
    setVoiceState((current) => (
      current.available === nextState.available
      && current.isListening === nextState.isListening
      && current.isProcessing === nextState.isProcessing
      && current.mode === nextState.mode
        ? current
        : nextState
    ));
    setVoiceNotice((current) => {
      if (nextState.isListening) return t(language, "listening");
      if (nextState.isProcessing) return t(language, "transcribing");
      if ([t(language, "listening"), t(language, "transcribing")].includes(current)) return "";
      return current;
    });
  }, [language]);

  const handleTranscript = useCallback((transcript) => {
    const clean = String(transcript || "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    setComposer((current) => [current.trim(), clean].filter(Boolean).join(" ").slice(0, 400));
    setVoiceNotice(t(language, "transcriptReady"));
  }, [language, setComposer]);

  const handleVoiceError = useCallback(() => {
    setVoiceNotice(t(language, "voiceError"));
  }, [language]);

  const handleAudioRecorded = useCallback(async (audioBlob) => {
    setVoiceNotice(t(language, "transcribing"));
    return transcribeAudio(audioBlob, inputLanguage);
  }, [inputLanguage, language]);

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

  function toggleVoiceOver() {
    const next = !voiceOver;
    setVoiceOver(next);
    lastSpokenRef.current = "";
    try {
      window.localStorage.setItem(VOICE_OVER_KEY, String(next));
    } catch {
      // Voice-over still works for the current session when storage is blocked.
    }
    if (!next) {
      cancelSpeech();
      setSpeaking(false);
    }
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
    cancelSpeech();
    setSpeaking(false);
    lastSpokenRef.current = "";
    setVoiceNotice("");
  }, [language]);

  useEffect(() => {
    if (open) return;
    cancelSpeech();
    setSpeaking(false);
  }, [open]);

  useEffect(() => {
    if (!shouldCancelMissionSpeech(historyOpen, loading)) return;
    cancelSpeech();
    setSpeaking(false);
    lastSpokenRef.current = "";
  }, [historyOpen, loading]);

  useEffect(() => () => cancelSpeech(), []);

  useEffect(() => {
    if (!voiceOver || !open || historyOpen || loading || !mission) return;
    const totalSteps = mission.steps?.length || 0;
    const stepIndex = Math.min(mission.currentStep || 0, Math.max(0, totalSteps - 1));
    const step = mission.steps?.[stepIndex];
    const isComplete = mission.status === "completed" || (totalSteps > 0 && mission.currentStep >= totalSteps);
    const speechKey = [missionLanguage, mission.id || mission.goal, mission.status, mission.currentStep, mission.summary].join(":");
    if (lastSpokenRef.current === speechKey) return;

    const spokenParts = isComplete
      ? [t(missionLanguage, "missionComplete"), mission.summary || t(missionLanguage, "finished")]
      : [
          (mission.currentStep || 0) === 0 ? mission.summary : "",
          step?.title,
          step?.instruction,
        ];
    const spokenText = spokenParts.filter(Boolean).join(" ");
    if (!spokenText) return;

    const started = speak(spokenText, missionLanguage, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    if (started) lastSpokenRef.current = speechKey;
  }, [historyOpen, loading, mission, missionLanguage, open, voiceOver]);

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
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("copyFailed");
    }
    window.setTimeout(() => setCopyStatus(""), 1600);
  }

  if (!open) {
    return (
      <button className="guide-launcher" data-theme={theme} data-guidegpt-ui type="button" onClick={onOpen} aria-label={t(language, "open")}>
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
        aria-label={t(language, "assistantLabel")}
        lang={inputLanguage}
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
              aria-label={t(language, "dragWindow")}
              title={t(language, "dragWindowHint")}
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
            {health?.status === "ready"
              ? t(language, "onPage")
              : t(language, health?.status === "checking" ? "connecting" : "demoMode")}
          </div>
          <div className="capsule-header__actions">
            <button
              className={speaking ? "is-speaking" : ""}
              type="button"
              onClick={toggleVoiceOver}
              aria-label={canSpeak()
                ? t(language, voiceOver ? "voiceOn" : "voiceOff")
                : t(language, "voiceOverUnavailable")}
              aria-pressed={voiceOver}
              title={canSpeak()
                ? t(language, voiceOver ? "voiceOn" : "voiceOff")
                : t(language, "voiceOverUnavailable")}
              disabled={!canSpeak()}
            >
              {voiceOver ? <SpeakerHigh size={18} weight={speaking ? "fill" : "regular"} /> : <SpeakerSlash size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setCustomizerOpen((current) => !current)}
              aria-label={t(language, "customize")}
              aria-expanded={customizerOpen}
              title={t(language, "customize")}
            >
              <Palette size={18} />
            </button>
            <button type="button" onClick={onShowHistory} aria-label={t(language, "missionHistory")} title={t(language, "missionHistory")}>
              <ClockCounterClockwise size={18} />
            </button>
            <button className="capsule-minimize" type="button" onClick={onClose} aria-label={t(language, "minimize")} title={t(language, "minimize")}>
              <Minus size={18} />
            </button>
            <button type="button" onClick={onClose} aria-label={t(language, "close")} title={t(language, "close")}>
              <X size={18} />
            </button>
          </div>
        </div>

        {customizerOpen && (
          <section className="capsule-customizer" aria-label={t(language, "customizerRegion")}>
            <div className="capsule-customizer__heading">
              <div>
                <strong>{t(language, "makeYours")}</strong>
                <span>{t(language, "dragResize")}</span>
              </div>
              <span>{Math.round(layout.width)} × {Math.round(layout.height)}</span>
            </div>
            <label className="capsule-language">
              <span><GlobeHemisphereWest size={15} />{t(language, "language")}</span>
              <select
                value={language}
                onChange={(event) => onLanguageChange(event.target.value)}
                aria-label={t(language, "language")}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option value={option.id} key={option.id}>
                    {option.nativeLabel} · {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="theme-options" role="group" aria-label={t(language, "windowColor")}>
              {THEME_OPTIONS.map((option) => (
                <button
                  className={theme === option.id ? "is-selected" : ""}
                  data-color={option.id}
                  type="button"
                  key={option.id}
                  onClick={() => chooseTheme(option.id)}
                  aria-label={t(language, "useColor", { theme: option.label })}
                  aria-pressed={theme === option.id}
                  title={t(language, "useColor", { theme: option.label })}
                >
                  <span aria-hidden="true">{theme === option.id && <Check size={12} weight="bold" />}</span>
                  <small>{option.label}</small>
                </button>
              ))}
            </div>
            <button className="reset-window" type="button" onClick={resetCurrentLayout}>
              <ArrowCounterClockwise size={15} />{t(language, "resetWindow")}
            </button>
          </section>
        )}

        {historyOpen ? (
          <HistoryView
            missions={missions}
            language={language}
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
                  <p lang={missionLanguage}>{mission.goal}</p>
                </div>
              )}

              <div className="conversation-turn is-assistant">
                <span className="conversation-avatar"><Sparkle size={14} weight="fill" /></span>
                <div>
                  {loading ? (
                    <div className="assistant-loading">
                      <SpinnerGap size={17} className="spin" />
                      <span>{t(language, "reading")}</span>
                    </div>
                  ) : complete ? (
                    <>
                      <strong>{t(language, "missionComplete")}</strong>
                      <AssistantResponse language={missionLanguage}>
                        {mission?.summary || t(language, "finished")}
                      </AssistantResponse>
                    </>
                  ) : (
                    <>
                      <AssistantResponse language={missionLanguage}>
                        {mission?.summary || t(language, "prompt")}
                      </AssistantResponse>
                      <MissionProgress mission={mission} language={missionLanguage} />
                    </>
                  )}
                  <div className="privacy-inline">
                    <LockSimple size={15} weight="fill" />
                    <span><strong>{t(language, "privacyTitle")}</strong> {t(language, "privacyBody")}</span>
                  </div>
                </div>
              </div>

              {!loading && mission && (
                <div className="response-actions" aria-label={t(language, "responseActions")}>
                  <button type="button" aria-label={t(language, "helpful")} title={t(language, "helpful")}><ThumbsUp size={16} /></button>
                  <button type="button" aria-label={t(language, "notHelpful")} title={t(language, "notHelpful")}><ThumbsDown size={16} /></button>
                  <button type="button" onClick={copySummary} aria-label={t(language, "copyGuide")} title={t(language, "copyGuide")}>
                    <CopySimple size={16} />
                    {copyStatus && <span role="status">{t(language, copyStatus)}</span>}
                  </button>
                </div>
              )}

              <div className="mobile-step">
                <StepContents mission={mission} language={language} contentLanguage={missionLanguage} onAdvance={onAdvance} onHighlight={onHighlight} compact />
              </div>

              {error && <div className="capsule-error" role="alert">{error}</div>}
            </div>

            <form className="capsule-composer" onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="guide-composer">{t(language, "composerLabel")}</label>
              <textarea
                id="guide-composer"
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder={t(language, "placeholder")}
                maxLength={400}
                rows={2}
                disabled={loading}
              />
              {voiceNotice && (
                <div
                  className="composer-voice-status"
                  data-error={voiceNotice === t(language, "voiceError") ? "true" : "false"}
                  role="status"
                >
                  <span className={voiceState.isListening ? "is-listening" : ""} aria-hidden="true" />
                  {voiceNotice}
                </div>
              )}
              <div className="composer-tools">
                <span><Eye size={15} />{t(language, "visiblePage")}</span>
                <div className="composer-actions">
                  <SpeechInput
                    key={inputLanguage}
                    className="composer-microphone"
                    type="button"
                    lang={inputLanguage}
                    disabled={loading}
                    onTranscriptionChange={handleTranscript}
                    onAudioRecorded={handleAudioRecorded}
                    onListeningChange={handleVoiceState}
                    onError={handleVoiceError}
                    aria-label={voiceState.isListening ? t(language, "stopListening") : t(language, "microphone")}
                    title={voiceState.available
                      ? (voiceState.isListening ? t(language, "stopListening") : t(language, "microphone"))
                      : t(language, "voiceUnavailable")}
                  />
                  <button className="composer-send" type="submit" disabled={loading || composer.trim().length < 3} aria-label={t(language, loading ? "reading" : "send")}>
                    {loading ? <SpinnerGap size={17} className="spin" /> : <PaperPlaneTilt size={18} weight="fill" />}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        <button
          className="capsule-resize-handle"
          type="button"
          aria-label={t(language, "resizeWindow")}
          title={t(language, "resizeWindowHint")}
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
          language={language}
          contentLanguage={missionLanguage}
          onAdvance={onAdvance}
          onHighlight={onHighlight}
        />
      )}
    </>
  );
}
