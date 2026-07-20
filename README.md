# GuideGPT

> **Technology should be available to everyone.**

[Try GuideGPT live](https://guidegpt-next.vercel.app) · [Download the Chrome extension](https://guidegpt-next.vercel.app/guidegpt-extension.zip)

## A note from the founder

I founded GuideGPT because I believe technology should be available to everyone—not only to people who already understand how it works.

Too many useful products assume technical knowledge. They use unfamiliar language, hide important actions inside complex interfaces, and leave people worried that one wrong click could cause a problem. This can make people feel confused, dependent on others, or excluded from tools they need for work, learning, communication, and everyday life.

GuideGPT is my answer to that problem.

It is built first for the non-technical community: people who need to use technology without being expected to study the product before they can benefit from it. My goal is not only to help someone finish one task. I want GuideGPT to help people feel more confident, capable, and independent with technology.

If technology is meant to improve people's lives, everyone should have a fair chance to use it.

## What GuideGPT does

GuideGPT simplifies unfamiliar technology by combining two kinds of help:

1. **Step-by-step guidance on the screen**
   GuideGPT breaks a goal into clear, manageable steps and points to the relevant control on the page. Instead of giving a long tutorial, it explains the next action in the place where the user needs it.

2. **A live side chat in plain language**
   The chat stays available while the user works. People can ask follow-up questions, understand why a step matters, and get technical words explained in approachable language without leaving the page.

The experience is designed to feel like having a patient guide beside you—not a tool that takes control away from you.

## Who GuideGPT is for

GuideGPT is focused on people who do not consider themselves technical but still need to use digital products, including:

- people learning a new workplace or school platform;
- families helping one another complete online tasks;
- community members navigating forms, settings, dashboards, and accounts;
- small organizations without dedicated technical support;
- anyone who sees an unfamiliar screen and wonders, “What should I do next?”

No technical vocabulary is required. A user can describe the outcome they want in their own words.

## How it works

1. The user speaks or types what they want to accomplish.
2. GuideGPT reads the visible text and control labels on the current page.
3. It creates a short, safe sequence using controls that are actually visible.
4. The side chat explains the current step in plain language.
5. **Show me** highlights the relevant control without clicking it.
6. The user completes the action, confirms the result, and moves to the next step.

GuideGPT can help with forms, settings, dashboards, work tools, admin consoles, and other websites where the interface itself is the barrier.

## The user stays in control

GuideGPT provides guidance, not silent automation.

- It does not autonomously click buttons.
- It does not type into fields.
- It does not submit forms, make purchases, publish content, or change permissions.
- It does not ask for passwords, authentication codes, payment-card details, private keys, or other secrets.
- It explains consequential steps before the user chooses what to do.

The user remains in control at every step, with enough context to understand an action before taking it.

## Product experience

- **On-screen guidance:** a compact step card identifies the next relevant action.
- **Live side chat:** ask questions and receive explanations without leaving the current page.
- **Voice input with review:** talk to GuideGPT, check or edit the transcript, and choose when to send it.
- **Optional voice-over:** hear the mission summary and each new step read aloud by the browser.
- **Seven guide languages:** use English, Mandarin Chinese, Korean, Japanese, Spanish, Russian, or Brazilian Portuguese for goals, interface labels, generated guidance, and spoken steps.
- **Show me:** highlight a matching visible control without activating it.
- **Customizable floating window:** drag it, resize width and height independently, minimize it, or choose from six color themes.
- **Remembered layouts:** color, size, and position are saved separately for phone, tablet, and desktop layouts.
- **Mission progress:** pause, resume, complete, reopen, or clear a guide.
- **Provider resilience:** AI is preferred, while a clearly labeled basic planner keeps guidance available when the provider is unavailable.
- **Accessible interaction:** keyboard controls, reduced-motion support, readable contrast, and responsive layouts are built in.

The homepage is a working product demo, not a collection of example screens. Its built-in mission guides the real extension download and live controls.

## Current release

GuideGPT 1.4 includes:

- a responsive React and Vite product experience;
- deployed Vercel API functions;
- structured mission generation through Vercel AI Gateway;
- a deterministic fallback planner;
- anonymous mission history backed by Neon Postgres;
- a Manifest V3 Chrome extension for real webpages;
- draggable, freely resizable, and recolorable floating guidance;
- opt-in voice input and spoken step guidance;
- localized guidance in seven languages;
- request validation, rate limits, session isolation, and privacy protections.

The live product is available at [guidegpt-next.vercel.app](https://guidegpt-next.vercel.app).

## Install the Chrome extension

1. [Download `guidegpt-extension.zip`](https://guidegpt-next.vercel.app/guidegpt-extension.zip).
2. Unzip the downloaded file.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode**.
5. Choose **Load unpacked**.
6. Select the unzipped GuideGPT extension folder.
7. Pin GuideGPT, open a normal website, and select the GuideGPT toolbar icon.

Chrome does not allow extensions to run on internal pages such as `chrome://settings` or the Chrome Web Store. The responsive GuideGPT website can still be used from a phone or computer; the installable Chrome extension is intended for supported desktop Chromium browsers.

See [extension/README.md](extension/README.md) for full extension instructions and [extension/PRIVACY.md](extension/PRIVACY.md) for the privacy disclosure.

## Privacy by design

- Visible page text is used to create the current guide and is not stored.
- URL query strings and fragments are removed before mission history is saved.
- Password fields, hidden fields, typed form values, textareas, and editable content are excluded from capture.
- Page content is treated as untrusted data, never as instructions for GuideGPT itself.
- The microphone starts only after the user chooses it. Browser speech services or GuideGPT's transcription provider may process the audio; GuideGPT does not intentionally store microphone audio.
- Voice transcripts are shown for review and can be edited or deleted before they are sent as a GuideGPT goal.
- Anonymous mission history expires automatically after 30 days and can be cleared earlier.
- API origins, request sizes, session identifiers, and mission schemas are bounded and validated.

## For contributors

GuideGPT should be built with the non-technical community, not only for it.

Contributions are especially valuable when they make an unfamiliar task easier to understand, reduce jargon, improve accessibility, protect user control, or represent a real point of confusion in an everyday product. When opening an issue, describe the task the person was trying to complete, where the interface became confusing, and what explanation would have helped.

### Project stack

- React 19 and Vite
- Inter Variable and Phosphor Icons
- Vercel Functions and AI SDK structured generation
- Vercel AI Gateway with deployment OIDC
- Neon serverless Postgres
- Zod validation and Vitest contract tests
- Chrome Manifest V3 extension with Shadow DOM isolation

### API routes

- `POST /api/analyze` — streamed mission generation with automatic fallback
- `POST /api/transcribe` — bounded, rate-limited speech-to-text for browsers without built-in recognition
- `GET /api/history` — private anonymous-session mission history
- `DELETE /api/history` — clear mission history
- `PATCH /api/mission` — update progress or pause status
- `GET /api/health` — guidance, AI, database, and session readiness

### Local development

Requirements: Node.js 20 or later and the Vercel CLI.

```bash
npm install
vercel link
vercel env pull .env.local
npm run db:migrate
npm run dev
```

Environment variables are documented in `.env.example`:

- `DATABASE_URL` — Neon pooled connection
- `AUTH_SECRET` — at least 32 random characters for anonymous session signing
- `AI_MODEL` — optional Gateway model override
- `TRANSCRIPTION_MODEL` — optional Gateway transcription model override (defaults to `openai/whisper-1`)
- `AI_GATEWAY_API_KEY` — optional local alternative to Vercel OIDC
- `PUBLIC_APP_URL` — canonical public GuideGPT URL

GuideGPT remains usable in basic-guide mode when an AI provider is unavailable. Never commit `.env.local`.

### Verification

```bash
npm test
npm run test:syntax
npm run build
```

The test suite covers request bounds, mission shape, fallback relevance, sensitive-control exclusion, high-risk warnings, progress validation, URL sanitization, CORS boundaries, and malformed cookies. The syntax check validates both extension entry points.

### Deployment

The production project is deployed on Vercel with connected environment variables and Neon storage.

```bash
vercel deploy --prod
```

## The long-term goal

GuideGPT is working toward a simple future: when someone needs to use a technology product, a lack of technical background should not stop them.

The interface should explain itself. Help should appear where it is needed. People should be able to move forward with understanding and confidence.

That is the purpose of GuideGPT—and the standard this project will continue to build toward.
