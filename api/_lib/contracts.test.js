import { describe, expect, it } from "vitest";
import { normalizeMission } from "../../src/lib/api.js";
import { buildMissionMessages } from "./ai.js";
import { mapMission, sanitizeStoredUrl } from "./db.js";
import { createFallbackMissionPlan, shouldUseFallback } from "./fallback.js";
import { isAllowedOrigin, publicError } from "./http.js";
import { SUPPORTED_LANGUAGES } from "./language.js";
import { parseCookies } from "./session.js";
import {
  analyzeRequestSchema,
  missionPlanSchema,
  missionUpdateSchema,
} from "./schema.js";
import {
  decodeTranscriptionRequest,
  MAX_AUDIO_BYTES,
  transcribeRequestSchema,
} from "./transcription.js";

describe("GuideGPT request contracts", () => {
  it("accepts a bounded page observation", () => {
    const input = analyzeRequestSchema.parse({
      goal: "Update the Pro price safely",
      pageUrl: "https://example.com/settings?token=secret#billing",
      pageTitle: "Billing",
      pageContext: "Pricing Pro price Save changes",
      interactiveElements: [
        { role: "input", label: "Pro price" },
        { role: "button", label: "Save changes" },
      ],
    });

    expect(input.goal).toBe("Update the Pro price safely");
    expect(input.language).toBe("en-US");
    expect(input.interactiveElements).toHaveLength(2);
  });

  it("accepts exactly the seven supported response languages", () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(analyzeRequestSchema.parse({
        goal: "Explain this page",
        language,
      }).language).toBe(language);
    }

    expect(() => analyzeRequestSchema.parse({
      goal: "Explain this page",
      language: "fr-FR",
    })).toThrow();

    expect(analyzeRequestSchema.parse({
      goal: "Explain this page",
      language: "en",
    }).language).toBe("en-US");
  });

  it("rejects unknown fields and oversized context", () => {
    expect(() => analyzeRequestSchema.parse({
      goal: "Do something",
      pageContext: "x".repeat(12_001),
      privateFormValues: ["should never be accepted"],
    })).toThrow();
  });

  it("requires confirmable plans with two to seven steps", () => {
    const step = {
      title: "Open pricing",
      instruction: "Select the Pricing section.",
      targetText: "Pricing",
      targetRole: "tab",
      verification: "The pricing controls are visible.",
      caution: "",
    };

    expect(() => missionPlanSchema.parse({
      summary: "Update the price.",
      steps: [step],
    })).toThrow();

    expect(missionPlanSchema.parse({
      summary: "Update the price.",
      steps: [step, { ...step, title: "Save safely" }],
    }).steps).toHaveLength(2);
  });

  it("validates progress updates", () => {
    expect(() => missionUpdateSchema.parse({
      id: "not-a-uuid",
      currentStep: 99,
      status: "deleted",
    })).toThrow();
  });
});

describe("voice transcription request boundaries", () => {
  const validAudio = Buffer.alloc(96, 0x5a).toString("base64");
  const mediaTypes = [
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/mpeg",
  ];

  it("accepts valid base64 with every supported MIME type and language", () => {
    for (const mediaType of mediaTypes) {
      expect(transcribeRequestSchema.parse({
        audio: validAudio,
        language: "en-US",
        mediaType,
      }).mediaType).toBe(mediaType);
    }

    for (const language of SUPPORTED_LANGUAGES) {
      expect(transcribeRequestSchema.parse({
        audio: validAudio,
        language,
        mediaType: "audio/webm",
      }).language).toBe(language);
    }

    const decoded = decodeTranscriptionRequest({
      audio: validAudio,
      language: "zh-CN",
      mediaType: "audio/webm",
    });
    expect(decoded.audio).toEqual(Buffer.alloc(96, 0x5a));
    expect(decoded.language).toBe("zh-CN");
    expect(decoded.mediaType).toBe("audio/webm");
  });

  it("rejects empty and structurally malformed base64", () => {
    expect(() => decodeTranscriptionRequest({
      audio: "",
      language: "en-US",
      mediaType: "audio/webm",
    })).toThrow();

    expect(() => decodeTranscriptionRequest({
      audio: "A".repeat(101),
      language: "en-US",
      mediaType: "audio/webm",
    })).toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("rejects unsupported audio MIME types", () => {
    expect(() => transcribeRequestSchema.parse({
      audio: validAudio,
      language: "en-US",
      mediaType: "audio/flac",
    })).toThrow();
  });

  it("accepts the decoded limit and rejects audio one byte over it", () => {
    const atLimit = decodeTranscriptionRequest({
      audio: Buffer.alloc(MAX_AUDIO_BYTES).toString("base64"),
      language: "en-US",
      mediaType: "audio/webm",
    });
    expect(atLimit.audio).toHaveLength(MAX_AUDIO_BYTES);

    expect(() => decodeTranscriptionRequest({
      audio: Buffer.alloc(MAX_AUDIO_BYTES + 1).toString("base64"),
      language: "en-US",
      mediaType: "audio/webm",
    })).toThrow(expect.objectContaining({ statusCode: 413 }));
  });
});

describe("localized AI mission instructions", () => {
  it("binds the exact goal and visible context to the selected language", () => {
    const messages = buildMissionMessages({
      goal: "Cambiar el nombre del perfil a Ana",
      language: "es-ES",
      pageTitle: "Perfil",
      pageUrl: "https://example.com/profile",
      pageContext: "Nombre del perfil Guardar cambios",
      interactiveElements: [
        { role: "input", label: "Nombre del perfil" },
        { role: "button", label: "Guardar cambios" },
      ],
    });

    expect(messages.system).toContain("exact stated goal");
    expect(messages.system).toContain("Spanish (Español) (es-ES)");
    expect(messages.system).toContain("targetText exactly as it appears");
    expect(messages.prompt).toContain(
      "User's exact goal: Cambiar el nombre del perfil a Ana",
    );
    expect(messages.prompt).toContain('"label":"Nombre del perfil"');
    expect(messages.prompt).toContain("this exact goal for this exact visible page state");
  });
});

describe("privacy and access boundaries", () => {
  it("stores only an HTTP origin and pathname", () => {
    expect(sanitizeStoredUrl(
      "https://example.com/settings/billing?token=secret#card",
    )).toBe("https://example.com/settings/billing");
    expect(sanitizeStoredUrl("javascript:alert(1)")).toBe("");
  });

  it("allows the product, its own previews, local development, and extensions", () => {
    expect(isAllowedOrigin("https://guidegpt-next.vercel.app")).toBe(true);
    expect(isAllowedOrigin(
      "https://guidegpt-next-git-main-jessie4jiexi-3146s-projects.vercel.app",
    )).toBe(true);
    expect(isAllowedOrigin("http://localhost:5173")).toBe(true);
    expect(isAllowedOrigin("chrome-extension://abcdefghijklmnop")).toBe(true);
    expect(isAllowedOrigin("https://guidegpt-next-evil.vercel.app")).toBe(false);
    expect(isAllowedOrigin("https://example.com")).toBe(false);
  });

  it("allows the current request host without trusting unrelated origins", () => {
    const request = {
      headers: {
        host: "guide.example.org",
        "x-forwarded-proto": "https",
      },
    };

    expect(isAllowedOrigin("https://guide.example.org", request)).toBe(true);
    expect(isAllowedOrigin("http://guide.example.org", request)).toBe(false);
    expect(isAllowedOrigin("https://attacker.example", request)).toBe(false);
  });

  it("allows only normalized configured app and Vercel deployment origins", () => {
    const previousPublicAppUrl = process.env.PUBLIC_APP_URL;
    const previousVercelUrl = process.env.VERCEL_URL;
    process.env.PUBLIC_APP_URL = "https://app.guidegpt.example/some/path";
    process.env.VERCEL_URL = "guidegpt-new-target.vercel.app";

    try {
      expect(isAllowedOrigin("https://app.guidegpt.example")).toBe(true);
      expect(isAllowedOrigin("https://guidegpt-new-target.vercel.app")).toBe(true);
      expect(isAllowedOrigin("https://app.guidegpt.example.evil.test")).toBe(false);
      expect(isAllowedOrigin("https://unrelated.vercel.app")).toBe(false);
    } finally {
      if (previousPublicAppUrl === undefined) delete process.env.PUBLIC_APP_URL;
      else process.env.PUBLIC_APP_URL = previousPublicAppUrl;
      if (previousVercelUrl === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = previousVercelUrl;
    }
  });

  it("turns an AI billing failure into a useful setup message", () => {
    const result = publicError(new Error("AI Gateway requires a valid credit card"));
    expect(result.statusCode).toBe(503);
    expect(result.message).toContain("billing");
  });

  it("survives malformed cookie encoding without trusting it", () => {
    expect(parseCookies("good=value; malformed=%E0%A4%A")).toEqual({
      good: "value",
      malformed: "%E0%A4%A",
    });
  });
});

describe("mission language persistence", () => {
  const storedRow = {
    id: "b56bde3d-3f67-4e1f-8cc9-fb49bd985485",
    goal: "プロフィール名を更新する",
    page_url: "https://example.com/profile",
    page_title: "Profile",
    summary: "プロフィール名を更新する手順です。",
    steps: "[]",
    generation_mode: "ai",
    status: "active",
    current_step: 0,
    created_at: "2026-07-19T00:00:00.000Z",
    updated_at: "2026-07-19T00:00:00.000Z",
    completed_at: null,
  };

  it("maps a stored canonical locale into history and progress responses", () => {
    expect(mapMission({ ...storedRow, language: "ja-JP" }).language).toBe("ja-JP");
    expect(mapMission({ ...storedRow, language: "pt-BR" }).language).toBe("pt-BR");
  });

  it("maps legacy or noncanonical stored locales to en-US", () => {
    expect(mapMission(storedRow).language).toBe("en-US");
    expect(mapMission({ ...storedRow, language: "en" }).language).toBe("en-US");
    expect(mapMission({ ...storedRow, language: "fr-FR" }).language).toBe("en-US");
  });

  it("keeps client mission objects canonical for history and resume", () => {
    expect(normalizeMission({ id: "one", language: "ko-KR" }).language).toBe("ko-KR");
    expect(normalizeMission({ id: "two", language: "en" }).language).toBe("en-US");
    expect(normalizeMission({ id: "three" }).language).toBe("en-US");
    expect(normalizeMission({ id: "four" }, "es-ES").language).toBe("es-ES");
  });
});
describe("resilient fallback planning", () => {
  it("builds a validated field-to-save guide from visible controls", () => {
    const plan = createFallbackMissionPlan({
      goal: "Update the Pro price to 29 dollars and save it",
      interactiveElements: [
        { role: "button", label: "Edit" },
        { role: "input", label: "Pro price" },
        { role: "button", label: "Save changes" },
      ],
    });

    expect(missionPlanSchema.parse(plan)).toEqual(plan);
    expect(plan.steps[0].targetText).toBe("Pro price");
    expect(plan.steps.at(-1).targetText).toBe("Save changes");
  });

  it("never targets sensitive controls", () => {
    const plan = createFallbackMissionPlan({
      goal: "Sign in and continue",
      interactiveElements: [
        { role: "input", label: "Password" },
        { role: "button", label: "Continue" },
      ],
    });

    expect(plan.steps.some((step) => /password/i.test(step.targetText))).toBe(false);
    expect(missionPlanSchema.parse(plan).steps.length).toBeGreaterThanOrEqual(2);
  });

  it("returns a useful two-step guide without observed controls", () => {
    const plan = createFallbackMissionPlan({
      goal: "Review this page",
      interactiveElements: [],
    });

    expect(plan.steps).toHaveLength(2);
    expect(plan.steps.every((step) => step.targetText === "")).toBe(true);
  });

  it("does not suggest an unrelated destructive control", () => {
    const plan = createFallbackMissionPlan({
      goal: "Update the profile name",
      interactiveElements: [
        { role: "input", label: "Profile name" },
        { role: "button", label: "Delete account" },
      ],
    });

    expect(plan.steps.some((step) => step.targetText === "Delete account")).toBe(false);
    expect(plan.steps[0].targetText).toBe("Profile name");
  });

  it("does not mistake action words inside longer field labels", () => {
    const plan = createFallbackMissionPlan({
      goal: "Update the mailing address",
      language: "en-US",
      interactiveElements: [{ role: "input", label: "Mailing address" }],
    });

    expect(plan.steps[0].targetText).toBe("Mailing address");
  });

  it("adds a consequence warning to high-risk actions", () => {
    const plan = createFallbackMissionPlan({
      goal: "Publish the changes",
      interactiveElements: [{ role: "button", label: "Publish now" }],
    });

    expect(plan.steps.at(-1).caution).toMatch(/money|published data|other people/i);
  });

  it("activates only when an AI error exists", () => {
    expect(shouldUseFallback(new Error("provider unavailable"))).toBe(true);
    expect(shouldUseFallback(null)).toBe(false);
  });

  const localizedScenarios = [
    {
      language: "en-US",
      goal: "Update the profile name and save it",
      field: "Profile name",
      commit: "Save changes",
      summary: "Basic guide created for your goal",
      title: "Update Profile name",
    },
    {
      language: "zh-CN",
      goal: "更新个人资料名称并保存",
      field: "个人资料名称",
      commit: "保存更改",
      summary: "已根据你的目标创建基础指南",
      title: "更新个人资料名称",
    },
    {
      language: "ko-KR",
      goal: "프로필 이름을 업데이트하고 저장",
      field: "프로필 이름",
      commit: "변경 사항 저장",
      summary: "다음 목표에 맞는 기본 안내를 만들었습니다",
      title: "프로필 이름 업데이트",
    },
    {
      language: "ja-JP",
      goal: "プロフィール名を更新して保存",
      field: "プロフィール名",
      commit: "変更を保存",
      summary: "次の目標に合わせて基本ガイドを作成しました",
      title: "プロフィール名を更新",
    },
    {
      language: "es-ES",
      goal: "Actualizar el nombre del perfil y guardar",
      field: "Nombre del perfil",
      commit: "Guardar cambios",
      summary: "Guía básica creada para tu objetivo",
      title: "Actualizar Nombre del perfil",
    },
    {
      language: "ru-RU",
      goal: "Обновить имя профиля и сохранить",
      field: "Имя профиля",
      commit: "Сохранить изменения",
      summary: "Базовое руководство для вашей цели",
      title: "Обновить: Имя профиля",
    },
    {
      language: "pt-BR",
      goal: "Atualizar o nome do perfil e salvar",
      field: "Nome do perfil",
      commit: "Salvar alterações",
      summary: "Guia básico criado para seu objetivo",
      title: "Atualizar Nome do perfil",
    },
  ];

  it.each(localizedScenarios)(
    "creates a genuinely localized $language mission",
    ({ language, goal, field, commit, summary, title }) => {
      const plan = createFallbackMissionPlan({
        goal,
        language,
        interactiveElements: [
          { role: "input", label: field },
          { role: "button", label: commit },
        ],
      });

      expect(missionPlanSchema.parse(plan)).toEqual(plan);
      expect(plan.summary).toContain(summary);
      expect(plan.summary).toContain(goal);
      expect(plan.steps[0].title).toBe(title);
      expect(plan.steps[0].targetText).toBe(field);
      expect(plan.steps.at(-1).targetText).toBe(commit);
    },
  );

  it.each([
    ["en-US", "Password"],
    ["zh-CN", "验证码"],
    ["ko-KR", "비밀번호"],
    ["ja-JP", "認証コード"],
    ["es-ES", "Contraseña"],
    ["ru-RU", "Пароль"],
    ["pt-BR", "Senha"],
  ])("excludes sensitive controls from %s plans", (language, label) => {
    const plan = createFallbackMissionPlan({
      goal: label,
      language,
      interactiveElements: [{ role: "input", label }],
    });

    expect(plan.steps.every((step) => step.targetText === "")).toBe(true);
    expect(missionPlanSchema.parse(plan)).toEqual(plan);
  });
});
