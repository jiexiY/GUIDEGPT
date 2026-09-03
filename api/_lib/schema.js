import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "./language.js";

const text = (max) => z.string().trim().min(1).max(max);
const optionalText = (max) => z.string().trim().max(max).default("");

export const interactiveElementSchema = z.object({
  role: z.enum(["button", "link", "input", "select", "tab", "menuitem", "other"]),
  label: text(160),
}).strict();

export const languageSchema = z.preprocess(
  (value) => value === "en" ? "en-US" : value,
  z.enum(SUPPORTED_LANGUAGES).default("en-US"),
);

export const analyzeRequestSchema = z.object({
  goal: text(400),
  language: languageSchema,
  pageUrl: optionalText(2_000),
  pageTitle: optionalText(240),
  pageContext: optionalText(12_000),
  interactiveElements: z.array(interactiveElementSchema).max(80).default([]),
}).strict();

export const transcribeRequestSchema = z.object({
  audio: z.string().min(100).max(3_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  language: languageSchema,
  mediaType: z.enum(["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/mpeg"]),
}).strict();

export const missionStepSchema = z.object({
  title: text(90),
  instruction: text(360),
  targetText: z.string().trim().max(160).default(""),
  targetRole: z
    .enum(["button", "link", "input", "select", "tab", "menuitem", "other"])
    .default("other"),
  verification: text(240),
  caution: z.string().trim().max(220).default(""),
}).strict();

export const missionPlanSchema = z.object({
  summary: text(280),
  steps: z.array(missionStepSchema).min(2).max(7),
}).strict();

export const missionUpdateSchema = z.object({
  id: z.string().uuid(),
  currentStep: z.number().int().min(0).max(7),
  status: z.enum(["active", "paused", "completed"]),
}).strict();
