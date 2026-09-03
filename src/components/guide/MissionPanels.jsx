import { useState } from "react";
import {
  ArrowClockwise,
  ArrowRight,
  ClockCounterClockwise,
  Eye,
  LockSimple,
  Sparkle,
  SpinnerGap,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { BrandMark } from "./GuideOverlay";
import { suggestedGoals } from "./demo-data";

export function StartPanel({
  goal,
  setGoal,
  health,
  loading,
  error,
  onClose,
  onStart,
  onRefresh,
  onOpenHistory,
}) {
  const ready = health?.status === "ready";

  return (
    <aside className="start-panel" data-guidegpt-ui aria-label="Start a GuideGPT mission">
      <div className="panel-header">
        <BrandMark compact />
        <div className="panel-header__actions">
          <button
            className="icon-button icon-button--plain"
            type="button"
            onClick={onOpenHistory}
            aria-label="Mission history"
          >
            <ClockCounterClockwise size={18} />
          </button>
          <button
            className="icon-button icon-button--plain"
            type="button"
            onClick={onClose}
            aria-label="Close mission panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="start-panel__intro">
        <span className="panel-kicker">Live page guidance</span>
        <h2>What are you trying to do?</h2>
        <p>Describe the outcome. GuideGPT will turn the visible page into a safe, confirmable plan.</p>
      </div>

      {!ready && (
        <div className="setup-state">
          <span>
            <SpinnerGap
              size={17}
              className={health?.status === "checking" ? "spin" : ""}
            />
          </span>
          <div>
            <strong>
              {health?.status === "checking"
                ? "Checking production services"
                : "Production setup is still finishing"}
            </strong>
            <p>Guidance and private mission history must both be online before starting.</p>
          </div>
          <button type="button" onClick={onRefresh}>
            <ArrowClockwise size={15} />Check again
          </button>
        </div>
      )}

      <form onSubmit={onStart}>
        <label htmlFor="mission-goal">Your goal</label>
        <textarea
          id="mission-goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Example: Update the Pro price to $29 and publish it safely"
          maxLength={400}
          disabled={loading}
        />
        <div className="context-chip">
          <Eye size={14} />Visible text and controls on this page
        </div>
        {error && (
          <div className="panel-error" role="alert">
            <WarningCircle size={16} />{error}
          </div>
        )}
        <button
          className="primary-button primary-button--wide"
          type="submit"
          disabled={!ready || loading || goal.trim().length < 3}
        >
          {loading
            ? <SpinnerGap size={17} className="spin" />
            : <Sparkle size={16} weight="fill" />}
          {loading ? "Building your guide" : "Build my guide"}
          {!loading && <ArrowRight size={16} weight="bold" />}
        </button>
      </form>

      <div className="suggestion-list" aria-label="Suggested goals">
        {suggestedGoals.map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            onClick={() => setGoal(suggestion)}
            disabled={loading}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="panel-privacy">
        <LockSimple size={14} weight="fill" />
        <span>Page text is used to build this guide and is not saved.</span>
      </div>
    </aside>
  );
}

export function HistoryPanel({ missions, onResume, onClose, onClear }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <aside className="history-panel" data-guidegpt-ui aria-label="Mission history">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Private to this browser</span>
          <h2>Mission history</h2>
        </div>
        <button
          className="icon-button icon-button--plain"
          type="button"
          onClick={onClose}
          aria-label="Close history"
        >
          <X size={18} />
        </button>
      </div>

      <div className="history-list">
        {missions.length === 0 ? (
          <div className="history-empty">
            <ClockCounterClockwise size={24} />
            <strong>No missions yet</strong>
            <span>Your completed and active guides will appear here.</span>
          </div>
        ) : missions.map((mission) => (
          <button
            className="history-item"
            type="button"
            key={mission.id}
            onClick={() => onResume(mission)}
          >
            <span className={"history-item__status is-" + mission.status}>
              {mission.status + (mission.generationMode === "fallback" ? " · basic guide" : "")}
            </span>
            <strong>{mission.goal}</strong>
            <span>{mission.pageTitle || mission.pageUrl || "Untitled page"}</span>
            <small>{new Date(mission.updatedAt).toLocaleString()}</small>
          </button>
        ))}
      </div>

      {missions.length > 0 && (
        <div className="history-footer">
          {confirming ? (
            <div className="delete-confirmation">
              <span>Delete all mission history?</span>
              <button type="button" onClick={() => setConfirming(false)}>Cancel</button>
              <button type="button" className="is-danger" onClick={onClear}>Delete all</button>
            </div>
          ) : (
            <button
              type="button"
              className="clear-history-button"
              onClick={() => setConfirming(true)}
            >
              <Trash size={15} />Clear history
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
