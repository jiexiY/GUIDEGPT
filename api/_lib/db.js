import { neon } from "@neondatabase/serverless";
import { resolveLanguage } from "./language.js";

let sqlClient;
let schemaPromise;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = sql();
      await db`
        CREATE TABLE IF NOT EXISTS guidegpt_missions (
          id UUID PRIMARY KEY,
          session_hash TEXT NOT NULL,
          goal TEXT NOT NULL,
          page_url TEXT NOT NULL DEFAULT '',
          page_title TEXT NOT NULL DEFAULT '',
          language TEXT NOT NULL DEFAULT 'en-US'
            CHECK (language IN ('en-US', 'zh-CN', 'ko-KR', 'ja-JP', 'es-ES', 'ru-RU', 'pt-BR')),
          summary TEXT NOT NULL,
          steps JSONB NOT NULL,
          generation_mode TEXT NOT NULL DEFAULT 'ai'
            CHECK (generation_mode IN ('ai', 'fallback')),
          status TEXT NOT NULL DEFAULT 'active'
            CHECK (status IN ('active', 'paused', 'completed')),
          current_step SMALLINT NOT NULL DEFAULT 0,
          input_tokens INTEGER,
          output_tokens INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
        )
      `;
      await db`
        ALTER TABLE guidegpt_missions
        ADD COLUMN IF NOT EXISTS generation_mode TEXT NOT NULL DEFAULT 'ai'
      `;
      await db`
        ALTER TABLE guidegpt_missions
        ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en-US'
      `;
      await db`
        UPDATE guidegpt_missions
        SET language = 'en-US'
        WHERE
          language IS NULL
          OR language NOT IN ('en-US', 'zh-CN', 'ko-KR', 'ja-JP', 'es-ES', 'ru-RU', 'pt-BR')
      `;
      await db`
        ALTER TABLE guidegpt_missions
        ALTER COLUMN language SET DEFAULT 'en-US'
      `;
      await db`
        ALTER TABLE guidegpt_missions
        ALTER COLUMN language SET NOT NULL
      `;
      await db`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE
              conname = 'guidegpt_missions_language_check'
              AND conrelid = 'guidegpt_missions'::regclass
          ) THEN
            ALTER TABLE guidegpt_missions
            ADD CONSTRAINT guidegpt_missions_language_check
            CHECK (language IN ('en-US', 'zh-CN', 'ko-KR', 'ja-JP', 'es-ES', 'ru-RU', 'pt-BR'));
          END IF;
        END
        $$
      `;
      await db`
        ALTER TABLE guidegpt_missions
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
      `;
      await db`
        UPDATE guidegpt_missions
        SET expires_at = NOW() + INTERVAL '30 days'
        WHERE expires_at IS NULL
      `;
      await db`
        ALTER TABLE guidegpt_missions
        ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '30 days')
      `;
      await db`
        ALTER TABLE guidegpt_missions
        ALTER COLUMN expires_at SET NOT NULL
      `;
      await db`
        CREATE INDEX IF NOT EXISTS guidegpt_missions_session_updated_idx
        ON guidegpt_missions (session_hash, updated_at DESC)
      `;
      await db`
        CREATE INDEX IF NOT EXISTS guidegpt_missions_expires_idx
        ON guidegpt_missions (expires_at)
      `;
      await db`
        CREATE TABLE IF NOT EXISTS guidegpt_rate_limits (
          session_hash TEXT NOT NULL,
          window_start TIMESTAMPTZ NOT NULL,
          request_count INTEGER NOT NULL DEFAULT 1,
          PRIMARY KEY (session_hash, window_start)
        )
      `;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

export function sanitizeStoredUrl(rawUrl) {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return `${url.origin}${url.pathname}`.slice(0, 800);
  } catch {
    return "";
  }
}

export function mapMission(row) {
  const steps = typeof row.steps === "string" ? JSON.parse(row.steps) : row.steps;
  return {
    id: row.id,
    goal: row.goal,
    pageUrl: row.page_url,
    pageTitle: row.page_title,
    language: resolveLanguage(row.language),
    summary: row.summary,
    steps,
    generationMode: row.generation_mode || "ai",
    status: row.status,
    currentStep: Number(row.current_step),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function consumeRateLimit(sessionHash, limit = 8) {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    INSERT INTO guidegpt_rate_limits (
      session_hash,
      window_start,
      request_count
    )
    VALUES (
      ${sessionHash},
      date_trunc('minute', NOW()),
      1
    )
    ON CONFLICT (session_hash, window_start)
    DO UPDATE SET request_count = guidegpt_rate_limits.request_count + 1
    RETURNING request_count
  `;

  if (Math.random() < 0.02) {
    await db`
      DELETE FROM guidegpt_rate_limits
      WHERE window_start < NOW() - INTERVAL '2 days'
    `;
    await db`
      DELETE FROM guidegpt_missions
      WHERE expires_at <= NOW()
    `;
  }

  return { allowed: Number(rows[0].request_count) <= limit, limit };
}

export async function createMission({
  id,
  sessionHash,
  goal,
  pageUrl,
  pageTitle,
  language = "en-US",
  summary,
  steps,
  usage,
  generationMode = "ai",
}) {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    INSERT INTO guidegpt_missions (
      id,
      session_hash,
      goal,
      page_url,
      page_title,
      language,
      summary,
      steps,
      generation_mode,
      input_tokens,
      output_tokens
    )
    VALUES (
      ${id},
      ${sessionHash},
      ${goal},
      ${sanitizeStoredUrl(pageUrl)},
      ${pageTitle.slice(0, 240)},
      ${resolveLanguage(language)},
      ${summary},
      ${JSON.stringify(steps)}::jsonb,
      ${generationMode},
      ${usage?.inputTokens ?? null},
      ${usage?.outputTokens ?? null}
    )
    RETURNING *
  `;
  return mapMission(rows[0]);
}

export async function listMissions(sessionHash, limit = 20) {
  await ensureSchema();
  const db = sql();
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  await db`
    DELETE FROM guidegpt_missions
    WHERE session_hash = ${sessionHash} AND expires_at <= NOW()
  `;
  const rows = await db`
    SELECT *
    FROM guidegpt_missions
    WHERE session_hash = ${sessionHash} AND expires_at > NOW()
    ORDER BY updated_at DESC
    LIMIT ${safeLimit}
  `;
  return rows.map(mapMission);
}

export async function getMission(sessionHash, id) {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT *
    FROM guidegpt_missions
    WHERE
      session_hash = ${sessionHash}
      AND id = ${id}
      AND expires_at > NOW()
    LIMIT 1
  `;
  return rows[0] ? mapMission(rows[0]) : null;
}

export async function updateMission({ sessionHash, id, currentStep, status }) {
  await ensureSchema();
  const db = sql();
  const existing = await getMission(sessionHash, id);
  if (!existing) return null;

  const boundedStep = Math.min(currentStep, existing.steps.length);
  const nextStatus = boundedStep >= existing.steps.length ? "completed" : status;
  const rows = await db`
    UPDATE guidegpt_missions
    SET
      current_step = ${boundedStep},
      status = ${nextStatus},
      updated_at = NOW(),
      completed_at = CASE
        WHEN ${nextStatus} = 'completed' THEN COALESCE(completed_at, NOW())
        ELSE NULL
      END
    WHERE session_hash = ${sessionHash} AND id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapMission(rows[0]) : null;
}

export async function clearMissions(sessionHash) {
  await ensureSchema();
  const db = sql();
  const result = await db`
    DELETE FROM guidegpt_missions
    WHERE session_hash = ${sessionHash}
    RETURNING id
  `;
  return result.length;
}

export async function checkDatabase() {
  await ensureSchema();
  const db = sql();
  await db`SELECT 1 AS ok`;
  return true;
}
