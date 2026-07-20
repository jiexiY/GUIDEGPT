# GuideGPT

GuideGPT turns a goal and the visible state of a webpage into a short, confirmable mission. Version 1.3 is a production rebuild inspired by [jiexiY/GUIDEGPT](https://github.com/jiexiY/GUIDEGPT), with streamed AI planning, a resilient basic planner, anonymous mission history, a responsive product website, and an installable Chrome extension.

**Live product:** https://guidegpt-next.vercel.app

## Reference lineage

The original repository is a Manifest V3 extension with a 340 px injected widget, goal prompt, visible-page capture, five-item local history, provider picker, and a hard-coded `http://localhost:3001/analyze` request. This rebuild deliberately preserves the valuable product ideas—on-page guidance, a compact floating surface, page-aware planning, history, and target highlighting—while replacing the prototype constraints:

- the missing localhost backend became deployed Vercel functions;
- free-form provider responses became streamed, schema-validated missions;
- the provider picker moved out of the user journey;
- five local history records became anonymous, expiring Postgres history;
- broad page/screenshot capture became bounded visible text and control labels with sensitive-value exclusions;
- page-global markup became an isolated Shadow DOM extension surface;
- provider failure now activates a labeled, deterministic basic planner rather than breaking the product.

## Product experience

- **Customizable floating capsule:** a Cluely-inspired dark glass conversation can be dragged, resized freely to practical aspect ratios, minimized, and recolored with six accessible themes.
- **Remembered layouts:** theme, size, and position persist locally, with independent layouts for phone, tablet, and desktop viewports.
- **Anchored guidance:** a compact step card points to the real control the user should review next.
- **Show me:** highlights a matching visible control but never clicks it.
- **Progress and history:** pause, resume, complete, reopen, or clear missions.
- **Real webpage support:** the Chrome extension brings the same flow to normal HTTP and HTTPS pages.
- **Provider resilience:** AI is preferred, but a clearly labeled basic guide is generated when the provider is unavailable.
- **Responsive and accessible:** keyboard focus, reduced-motion support, mobile layouts, and readable controls over the translucent surface.

The homepage is the working demo. Its built-in installation mission guides the actual download and live-demo controls, and the composer can generate a real mission from the visible GuideGPT page. There are no fake pricing or admin example pages.

## How it works

1. The user writes a goal.
2. GuideGPT captures bounded visible text and control labels from the current page.
3. A Vercel function attempts a structured mission through the Vercel AI Gateway.
4. If the provider is unavailable, a deterministic planner selects relevant observed controls, excludes sensitive controls, and creates a safe 2–4 step guide.
5. Every plan is validated against the same Zod schema.
6. Neon Postgres stores only the goal, sanitized page path, generated plan, generation mode, status, and progress.
7. A signed anonymous browser session keeps each history isolated.

Both the web dashboard and extension use the same API:

- `POST /api/analyze` — streamed NDJSON mission generation with automatic fallback
- `GET /api/history` — session mission history
- `DELETE /api/history` — clear session history
- `PATCH /api/mission` — update progress or pause state
- `GET /api/health` — guidance, AI configuration, database, and session readiness

## Resilient basic planner

The basic planner is a real server-side production path rather than static demo data. It:

- scores visible control labels against the user's goal;
- prefers relevant fields, selects, tabs, and links;
- keeps save, publish, delete, payment, and access actions as explicit confirmation steps;
- removes password, security-code, card, private-key, and seed-phrase controls;
- adds warnings before consequential actions;
- never invents a target that was not observed on the page;
- persists and resumes through the same mission API.

Missions display **Basic guide** when this path was used. When AI Gateway access becomes available, new missions automatically use AI without a redeploy.

## Privacy and safety

- Page text is used for generation and is not persisted.
- URL query strings and fragments are removed before storage.
- Password fields, hidden fields, typed form values, textareas, and editable content are excluded from capture.
- Page content is treated as untrusted prompt data.
- GuideGPT does not click, type, submit, purchase, publish, or change permissions.
- Mission creation is rate-limited to eight requests per anonymous session per minute.
- Mission history automatically expires after 30 days and can be cleared earlier.
- API origins, request sizes, session identifiers, and mission schemas are bounded and validated.

See [extension/PRIVACY.md](extension/PRIVACY.md) for the extension disclosure.

## Stack

- React 19 and Vite
- Tailwind CSS, shadcn/ui, AI Elements, Inter Variable, and Phosphor Icons
- Vercel Functions and AI SDK structured streaming
- Vercel AI Gateway with deployment OIDC
- Deterministic provider-outage planner
- Neon serverless Postgres
- Zod validation and Vitest contract tests
- Chrome Manifest V3 extension

## Local development

Requirements: Node.js 20 or later and the Vercel CLI.

```bash
npm install
vercel link
vercel env pull .env.local
npm run db:migrate
npm run dev
```

Environment variables:

- `DATABASE_URL` — Neon pooled connection
- `AUTH_SECRET` — at least 32 random characters
- `AI_MODEL` — optional Gateway model override; defaults to `openai/gpt-5.6-luna`
- `AI_GATEWAY_API_KEY` — optional local alternative to Vercel OIDC

The app remains usable in basic-guide mode without an available AI provider. Do not commit `.env.local`.

## Verification

```bash
npm test
npm run test:syntax
npm run build
```

The suite covers request bounds, AI plan shape, fallback relevance, sensitive-control exclusion, high-risk warnings, progress validation, URL sanitization, CORS boundaries, and malformed cookies. The syntax check validates both extension entry points.

## Install the extension

Download `guidegpt-extension.zip` from the live product, unzip it, then load that folder from `chrome://extensions` with Developer mode enabled. Full instructions are in [extension/README.md](extension/README.md).

## Deploy

The project is linked to Vercel. Production deployment uses the project environment variables, deployment OIDC for the AI Gateway, and the connected Neon integration.

```bash
vercel deploy --prod
```
