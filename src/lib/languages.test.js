import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  TRANSLATION_KEYS,
  localizedCopyKeys,
  normalizeLanguage,
  t,
} from "./languages.js";

const PARITY_KEYS = [
  "assistantLabel",
  "dragWindow",
  "dragWindowHint",
  "customizerRegion",
  "useColor",
  "responseActions",
  "helpful",
  "notHelpful",
  "copyGuide",
  "copied",
  "copyFailed",
  "resizeWindow",
  "resizeWindowHint",
  "connecting",
  "connectingError",
  "preparingSafePlan",
  "highlightError",
  "statusActive",
  "statusPaused",
  "statusCompleted",
  "basicGuide",
  "untitledPage",
];

describe("GuideGPT interface localization", () => {
  it("keeps the canonical seven-language list", () => {
    expect(LANGUAGE_OPTIONS.map((option) => option.id)).toEqual([
      "en-US",
      "zh-CN",
      "ko-KR",
      "ja-JP",
      "es-ES",
      "ru-RU",
      "pt-BR",
    ]);
    expect(normalizeLanguage("en")).toBe(DEFAULT_LANGUAGE);
  });

  it("keeps every locale in exact key parity with English", () => {
    for (const { id } of LANGUAGE_OPTIONS) {
      expect(localizedCopyKeys(id), id).toEqual(TRANSLATION_KEYS);
    }
  });

  it("provides localized copy for the remaining interactive surfaces", () => {
    for (const { id } of LANGUAGE_OPTIONS) {
      for (const key of PARITY_KEYS) {
        expect(t(id, key), `${id}:${key}`).not.toBe(key);
      }
      expect(t(id, "useColor", { theme: "Cobalt" })).not.toContain("{theme}");
    }
  });
});
