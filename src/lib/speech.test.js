import { describe, expect, it } from "vitest";
import {
  missionSpeechLanguage,
  shouldCancelMissionSpeech,
} from "./speech.js";

describe("mission-owned speech language", () => {
  it("prefers a resumed mission's canonical locale over the interface locale", () => {
    expect(missionSpeechLanguage({ language: "ja-JP" }, "en-US")).toBe("ja-JP");
    expect(missionSpeechLanguage({ language: "pt-BR" }, "ko-KR")).toBe("pt-BR");
  });

  it("uses a canonical interface fallback for legacy missions", () => {
    expect(missionSpeechLanguage({}, "es-ES")).toBe("es-ES");
    expect(missionSpeechLanguage({ language: "en" }, "ru-RU")).toBe("en-US");
    expect(missionSpeechLanguage({}, "unsupported")).toBe("en-US");
  });

  it("cancels speech for history and mission loading transitions", () => {
    expect(shouldCancelMissionSpeech(true, false)).toBe(true);
    expect(shouldCancelMissionSpeech(false, true)).toBe(true);
    expect(shouldCancelMissionSpeech(true, true)).toBe(true);
    expect(shouldCancelMissionSpeech(false, false)).toBe(false);
  });
});
