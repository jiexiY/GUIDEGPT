import { normalizeLanguage } from "./languages";

function readableText(value) {
  return String(value || "")
    .replace(/[`*_#>~]/g, "")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function missionSpeechLanguage(mission, interfaceLanguage) {
  return normalizeLanguage(mission?.language || interfaceLanguage);
}

export function shouldCancelMissionSpeech(historyOpen, loading) {
  return Boolean(historyOpen || loading);
}

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function canRecognizeSpeech() {
  return typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function cancelSpeech() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function speak(value, locale, { onStart, onEnd, onError } = {}) {
  const text = readableText(value);
  if (!text || !canSpeak()) return false;

  const synth = window.speechSynthesis;
  const utterance = new window.SpeechSynthesisUtterance(text);
  const localeLower = String(locale || "en-US").toLowerCase();
  const languagePrefix = localeLower.split("-")[0];
  const voices = synth.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === localeLower)
    || voices.find((voice) => voice.lang.toLowerCase().startsWith(`${languagePrefix}-`))
    || null;
  utterance.lang = locale || "en-US";
  utterance.rate = 0.96;
  utterance.pitch = 1;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (event) => onError?.(event);

  synth.cancel();
  synth.speak(utterance);
  return true;
}
