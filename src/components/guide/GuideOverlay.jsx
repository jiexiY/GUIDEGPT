import {
  Check,
  CheckCircle,
  Pause,
  Play,
  Sparkle,
  SpinnerGap,
  Target,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { MessageContent } from "@/components/ai-elements/message";

export function BrandMark({ compact = false }) {
  return (
    <span className={compact ? "guide-brand guide-brand--compact" : "guide-brand"}>
      <span className="guide-brand__icon" aria-hidden="true">
        <Sparkle size={15} weight="fill" />
      </span>
      <span>GUIDEGPT</span>
    </span>
  );
}

export function ServicePill({ health }) {
  const state = health?.status === "ready"
    ? "ready"
    : health?.status === "checking"
      ? "checking"
      : "setup";
  const label = state === "ready"
    ? "Guide service connected"
    : state === "checking"
      ? "Checking services"
      : "Setup finishing";

  return (
    <span className={"service-pill is-" + state}>
      <span className="service-pill__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

function MissionStep({ step, index, mission }) {
  const complete = index < mission.currentStep || mission.status === "completed";
  const active = index === mission.currentStep && mission.status !== "completed";
  const classes = ["mission-step", active && "is-active", complete && "is-complete"]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classes}>
      <span className="mission-step__marker" aria-hidden="true">
        {complete ? <Check size={15} weight="bold" /> : index + 1}
      </span>
      <span className="mission-step__copy">
        <span className="mission-step__title">{step.title || "Preparing step"}</span>
        <span className="mission-step__status">
          {complete ? "Done" : active ? "In progress" : "Pending"}
        </span>
      </span>
    </li>
  );
}

export function MissionBar({ mission, paused, loading, onPause, onClose }) {
  const total = Math.max(mission.steps?.length || 0, 1);
  const position = mission.status === "completed"
    ? total
    : Math.min((mission.currentStep || 0) + 1, total);
  const classes = ["mission-bar", paused && "is-paused", loading && "is-loading"]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} aria-label="Active GuideGPT mission" data-guidegpt-ui>
      <div className="mission-bar__identity">
        <BrandMark />
        <span className="mission-bar__divider" aria-hidden="true" />
        <div className="mission-bar__goal">
          <span>{mission.goal}</span>
          <strong>{position + " of " + total + (mission.generationMode === "fallback" ? " · Basic guide" : "")}</strong>
        </div>
      </div>

      <ol className="mission-steps" style={{ "--mission-step-count": total }}>
        {(mission.steps || []).map((step, index) => (
          <MissionStep
            key={(step.title || "step") + index}
            step={step}
            index={index}
            mission={mission}
          />
        ))}
        {loading && mission.steps.length === 0 && (
          <li className="mission-step is-active">
            <span className="mission-step__marker">
              <SpinnerGap size={16} className="spin" />
            </span>
            <span className="mission-step__copy">
              <span className="mission-step__title">Reading visible controls</span>
              <span className="mission-step__status">Building your guide</span>
            </span>
          </li>
        )}
      </ol>

      <div className="mission-bar__actions">
        <button
          className="icon-button"
          type="button"
          onClick={onPause}
          disabled={loading}
          aria-label={paused ? "Resume guidance" : "Pause guidance"}
        >
          {paused
            ? <Play size={18} weight="fill" />
            : <Pause size={18} weight="fill" />}
        </button>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close GuideGPT">
          <X size={19} />
        </button>
      </div>
    </section>
  );
}

export function GuidePopover({
  mission,
  paused,
  loading,
  onAdvance,
  onHighlight,
  onNewMission,
}) {
  if (paused) return null;

  if (loading && !mission.steps.length) {
    return (
      <aside className="guide-popover guide-popover--loading" data-guidegpt-ui aria-live="polite">
        <div className="guide-popover__title">
          <SpinnerGap size={18} className="spin" />
          <strong>Building your guide</strong>
        </div>
        <p>GuideGPT is reading only the visible page text and controls.</p>
        <div className="stream-lines" aria-hidden="true"><span /><span /><span /></div>
      </aside>
    );
  }

  if (mission.status === "completed" || mission.currentStep >= mission.steps.length) {
    return (
      <aside className="guide-popover guide-popover--complete" data-guidegpt-ui aria-live="polite">
        <div className="guide-popover__title">
          <CheckCircle size={19} weight="fill" />
          <strong>Mission complete</strong>
        </div>
        <MessageContent className="guide-popover__markdown">{mission.summary}</MessageContent>
        <div className="guide-popover__actions">
          <button className="primary-button" type="button" onClick={onNewMission}>
            Start another mission
          </button>
        </div>
      </aside>
    );
  }

  const step = mission.steps[mission.currentStep];
  if (!step) return null;

  return (
    <aside className="guide-popover" data-guidegpt-ui aria-live="polite">
      <div className="guide-popover__eyebrow">
        <span>{(mission.generationMode === "fallback" ? "Basic guide · " : "") + "Step " + (mission.currentStep + 1) + " of " + mission.steps.length}</span>
        {step.targetText && <span><Target size={13} />{step.targetText}</span>}
      </div>
      <div className="guide-popover__title">
        <Sparkle size={17} weight="fill" aria-hidden="true" />
        <strong>{step.title}</strong>
      </div>
      <MessageContent className="guide-popover__markdown">{step.instruction}</MessageContent>
      <div className="verification-note">
        <CheckCircle size={16} />
        <MessageContent>{step.verification}</MessageContent>
      </div>
      {step.caution && (
        <div className="caution-note">
          <WarningCircle size={16} weight="fill" />
          <MessageContent>{step.caution}</MessageContent>
        </div>
      )}
      <div className="guide-popover__actions">
        <button className="primary-button" type="button" onClick={onAdvance}>
          Mark step complete
        </button>
        {step.targetText && (
          <button className="text-button" type="button" onClick={() => onHighlight(step.targetText)}>
            Show me
          </button>
        )}
      </div>
      <div className="guide-popover__hint">GuideGPT never clicks or submits for you.</div>
    </aside>
  );
}
