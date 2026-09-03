import { useEffect, useState } from "react";
import { FloatingGuide } from "@/components/guide/FloatingGuide";
import { ProductHome } from "@/components/guide/ProductHome";
import {
  clearHistory as clearRemoteHistory,
  getHealth,
  getHistory,
  streamMission,
  updateMission,
} from "@/lib/api";
import { capturePageContext, findVisibleTarget } from "@/lib/page-context";
import {
  localizedDemoCopy,
  normalizeLanguage,
  persistLanguagePreference,
  readLanguagePreference,
  t,
} from "@/lib/languages";

const demoMission = {
  id: "guidegpt-welcome-demo",
  goal: "Help me install GuideGPT and start my first guide.",
  summary: "I can help with that. Here’s the quickest way to get GuideGPT ready:",
  currentStep: 0,
  status: "active",
  generationMode: "demo",
  pageTitle: "GuideGPT",
  steps: [
    {
      title: "Install the Chrome extension",
      instruction: "Click “Install extension” to download GuideGPT for Chrome.",
      verification: "The GuideGPT extension archive appears in your downloads.",
      caution: "Chrome will ask you to review the extension before enabling it.",
      targetText: "Install extension",
    },
    {
      title: "Add GuideGPT to Chrome",
      instruction: "Unzip the download, open Chrome extensions, enable Developer mode, then choose Load unpacked.",
      verification: "GuideGPT appears in your Chrome extensions list.",
      caution: "Only load the folder you downloaded from this official GuideGPT page.",
      targetText: "Get the GuideGPT extension",
    },
    {
      title: "Start your first guide",
      instruction: "Open GuideGPT on any website and describe the outcome you want in plain language.",
      verification: "A step-by-step guide appears without GuideGPT clicking anything for you.",
      caution: "Review every instruction before confirming a sensitive action.",
      targetText: "Try live demo",
    },
  ],
};

function freshDemoMission(language) {
  const localized = localizedDemoCopy(language);
  return {
    ...demoMission,
    goal: localized.goal,
    summary: localized.summary,
    language,
    steps: demoMission.steps.map((step, index) => ({
      ...step,
      title: localized.steps[index]?.[0] || step.title,
      instruction: localized.steps[index]?.[1] || step.instruction,
    })),
  };
}

export function App() {
  const [language, setLanguage] = useState(readLanguagePreference);
  const [health, setHealth] = useState({ status: "checking", services: {} });
  const [missions, setMissions] = useState([]);
  const [mission, setMission] = useState(() => freshDemoMission(language));
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [composer, setComposer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refreshServices() {
    setHealth((current) => ({ ...current, status: "checking" }));
    const nextHealth = await getHealth();
    setHealth(nextHealth);

    if (nextHealth.status !== "ready") return;
    try {
      const data = await getHistory();
      setMissions(data.missions || []);
    } catch (historyError) {
      setError(historyError.message);
    }
  }

  useEffect(() => {
    refreshServices();
  }, []);

  function openDemo() {
    setMission(freshDemoMission(language));
    setComposer("");
    setError("");
    setHistoryOpen(false);
    setAssistantOpen(true);
    window.setTimeout(() => {
      document.querySelector(".command-capsule")?.focus?.();
    }, 0);
  }

  function changeLanguage(nextLanguage) {
    const normalized = persistLanguagePreference(nextLanguage);
    setLanguage(normalized);
    setError("");
    setMission((current) => current?.id === demoMission.id
      ? freshDemoMission(normalized)
      : current);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const goal = composer.trim();
    if (goal.length < 3 || loading) return;

    if (health.status !== "ready") {
      setError(t(language, "connectingError"));
      return;
    }

    setLoading(true);
    setError("");
    setHistoryOpen(false);
    setAssistantOpen(true);
    setMission({
      goal,
      language,
      summary: t(language, "preparingSafePlan"),
      steps: [],
      currentStep: 0,
      status: "active",
    });

    try {
      const root = document.querySelector("#product-surface") || document.body;
      const page = capturePageContext(root);
      const data = await streamMission(
        { goal, language, ...page },
        (partial) => setMission((current) => ({
          ...current,
          ...partial,
          goal,
          currentStep: 0,
          status: "active",
        })),
      );

      setMission(data.mission);
      setMissions((current) => [
        data.mission,
        ...current.filter((item) => item.id !== data.mission.id),
      ]);
      setComposer("");
    } catch (missionError) {
      setError(missionError.message);
      setMission(freshDemoMission(language));
    } finally {
      setLoading(false);
    }
  }

  async function persistProgress(nextMission) {
    if (!nextMission?.id || nextMission.id === demoMission.id) {
      setMission(nextMission);
      return;
    }

    setMission(nextMission);
    try {
      const data = await updateMission({
        id: nextMission.id,
        currentStep: nextMission.currentStep,
        status: nextMission.status,
      });
      setMission(data.mission);
      setMissions((current) => current.map((item) =>
        item.id === data.mission.id ? data.mission : item
      ));
    } catch (missionError) {
      setError(missionError.message);
    }
  }

  function handleAdvance() {
    if (!mission?.steps?.length) return;
    const nextStep = Math.min((mission.currentStep || 0) + 1, mission.steps.length);
    persistProgress({
      ...mission,
      currentStep: nextStep,
      status: nextStep >= mission.steps.length ? "completed" : "active",
    });
  }

  function handleHighlight(targetText) {
    const target = findVisibleTarget(targetText, document.body);
    if (!target) {
      setError(t(language, "highlightError"));
      return;
    }

    setError("");
    target.classList.add("is-guide-target");
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus({ preventScroll: true });
    window.setTimeout(() => target.classList.remove("is-guide-target"), 2400);
  }

  function resumeMission(selected) {
    const missionLanguage = normalizeLanguage(selected?.language);
    setLanguage(persistLanguagePreference(missionLanguage));
    setMission({ ...selected, language: missionLanguage });
    setComposer("");
    setError("");
    setHistoryOpen(false);
    setAssistantOpen(true);
  }

  async function handleClearHistory() {
    try {
      await clearRemoteHistory();
      setMissions([]);
      setHistoryOpen(false);
    } catch (historyError) {
      setError(historyError.message);
    }
  }

  return (
    <div className={assistantOpen ? "app-shell has-guide" : "app-shell"}>
      <ProductHome health={health} onTryDemo={openDemo} />
      <FloatingGuide
        open={assistantOpen}
        historyOpen={historyOpen}
        health={health}
        language={language}
        mission={mission}
        loading={loading}
        error={error}
        composer={composer}
        setComposer={setComposer}
        missions={missions}
        onOpen={() => setAssistantOpen(true)}
        onLanguageChange={changeLanguage}
        onClose={() => {
          setAssistantOpen(false);
          setHistoryOpen(false);
        }}
        onShowHistory={() => setHistoryOpen(true)}
        onBackFromHistory={() => setHistoryOpen(false)}
        onResume={resumeMission}
        onClearHistory={handleClearHistory}
        onSubmit={handleSubmit}
        onAdvance={handleAdvance}
        onHighlight={handleHighlight}
      />
    </div>
  );
}
