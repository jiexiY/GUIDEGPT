import { describe, expect, it } from "vitest";
import { sanitizeStoredUrl } from "./db.js";
import { createFallbackMissionPlan, shouldUseFallback } from "./fallback.js";
import { isAllowedOrigin, publicError } from "./http.js";
import { parseCookies } from "./session.js";
import {
  analyzeRequestSchema,
  missionPlanSchema,
  missionUpdateSchema,
} from "./schema.js";

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
    expect(input.interactiveElements).toHaveLength(2);
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
});