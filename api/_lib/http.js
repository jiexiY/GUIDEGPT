const PRODUCTION_ORIGIN = "https://guidegpt-next.vercel.app";
const PREVIEW_HOST =
  /^guidegpt-next(?:-[a-z0-9-]+)?-jessie4jiexi-3146s-projects\.vercel\.app$/i;

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === PRODUCTION_ORIGIN) return true;
  if (origin.startsWith("chrome-extension://")) return true;

  try {
    const url = new URL(origin);
    if (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    ) {
      return true;
    }
    return url.protocol === "https:" && PREVIEW_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

export function applyCors(request, response) {
  const origin = request.headers.origin;
  const allowed = isAllowedOrigin(origin);

  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-GuideGPT-Session",
  );
  response.setHeader("Access-Control-Max-Age", "86400");

  if (origin && allowed) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }

  return allowed;
}

export function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.end(JSON.stringify(payload));
}

export async function readJson(request, maxBytes = 20_000) {
  if (request.body !== undefined && request.body !== null) {
    if (typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
      const size = Buffer.byteLength(JSON.stringify(request.body));
      if (size > maxBytes) throw new RequestError(413, "Request is too large.");
      return request.body;
    }

    const raw = Buffer.isBuffer(request.body)
      ? request.body.toString("utf8")
      : String(request.body);
    if (Buffer.byteLength(raw) > maxBytes) {
      throw new RequestError(413, "Request is too large.");
    }
    return raw ? JSON.parse(raw) : {};
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new RequestError(413, "Request is too large.");
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "RequestError";
    this.statusCode = statusCode;
  }
}

export function publicError(error) {
  if (error instanceof RequestError) {
    return { statusCode: error.statusCode, message: error.message };
  }
  if (error?.name === "ZodError") {
    return {
      statusCode: 400,
      message: error.issues?.[0]?.message || "Check the submitted details.",
    };
  }
  if (error instanceof SyntaxError) {
    return { statusCode: 400, message: "The request body must be valid JSON." };
  }

  const message = String(error?.message || "");
  if (/valid credit card|billing|payment method|free credits/i.test(message)) {
    return {
      statusCode: 503,
      message: "AI guidance is waiting for billing to be enabled by the project owner.",
    };
  }

  const status = error?.statusCode || error?.status;
  if (status === 402) {
    return { statusCode: 503, message: "AI guidance is temporarily at its usage limit." };
  }
  if (status === 429) {
    return { statusCode: 429, message: "Too many requests. Try again shortly." };
  }
  if (status === 503 || status === 504) {
    return { statusCode: 503, message: "AI guidance is temporarily unavailable." };
  }

  return { statusCode: 500, message: "Something went wrong while preparing guidance." };
}

export function rejectUnsupportedMethod(request, response, methods) {
  response.setHeader("Allow", [...methods, "OPTIONS"].join(", "));
  sendJson(response, 405, { error: "Method not allowed." });
}
