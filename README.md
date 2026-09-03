# GuideGPT

### Technology should be available to everyone.

[Try GuideGPT](https://guidegpt-next.vercel.app/) · [Download the Chrome extension](https://guidegpt-next.vercel.app/guidegpt-extension.zip)

GuideGPT helps people understand unfamiliar websites through on-screen guidance and a plain-language side chat. A user describes what they want to accomplish, receives manageable steps, and can highlight the relevant control without giving up control of the page.

The goal is more than finishing a task: it is helping people move forward with understanding, confidence, and independence.

## The problem

Digital products often assume users already understand their vocabulary and layout. Important actions can be hidden behind unfamiliar menus, while a generic tutorial may not match the screen in front of someone.

GuideGPT places help beside the task. It is designed for people learning a school or workplace platform, navigating online services, helping a family member, or simply wondering what to do next.

## How the experience works

1. Speak or type the outcome you want.
2. GuideGPT uses the page's visible text and control labels to prepare a short guide.
3. Read the current step and ask follow-up questions in the side chat.
4. Choose **Show me** to highlight the relevant visible control.
5. Complete the action yourself, check the result, and continue.

Guidance may be inaccurate or become outdated when a page changes. Confirm the screen state before acting, particularly for consequential tasks.

## Product features

- **Contextual steps and side chat:** concise guidance stays close to the page you are using.
- **On-page highlighting:** identify a matching control without activating it.
- **Voice input with review:** edit or discard a transcript before sending it.
- **Optional spoken guidance:** have the browser read the current guide aloud.
- **Seven languages:** English, Mandarin Chinese, Korean, Japanese, Spanish, Russian, and Brazilian Portuguese.
- **Flexible floating interface:** drag, resize, minimize, and choose among six color themes.
- **Remembered layouts:** keep separate preferences for phone, tablet, and desktop sizes.
- **Mission progress:** pause, resume, complete, reopen, or clear a guide.
- **Service fallback:** a clearly labeled basic planner remains available when the main guidance service is unavailable.
- **Responsive, accessible controls:** keyboard interaction, reduced-motion support, and adaptable layouts.

## The user stays in control

GuideGPT provides guidance, not autonomous control. It does not click buttons, type into fields, submit forms, make purchases, publish content, or change permissions for the user.

It does not ask users to provide passwords, authentication codes, payment-card details, or private keys. Consequential actions remain the user's decision.

## Install the Chrome extension

1. [Download the extension ZIP](https://guidegpt-next.vercel.app/guidegpt-extension.zip) and unzip it.
2. Open `chrome://extensions` in a supported desktop Chromium browser.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose the extracted extension folder.
5. Pin GuideGPT, open a normal webpage, and select its toolbar icon.

Extensions cannot run on restricted browser pages such as `chrome://settings` or the Chrome Web Store. The responsive website is also available on phones; the extension itself targets supported desktop browsers.

See the [extension guide](extension/README.md) and [privacy disclosure](extension/PRIVACY.md).

## Privacy and service boundaries

- Page context excludes password fields, hidden fields, typed form values, textareas, and editable content.
- Selected visible page text is sent to the guidance service for the requested task; it is not saved as mission history.
- URL query strings and fragments are removed before history is stored.
- Page content is treated as untrusted input.
- Microphone access starts only after the user chooses it. Browser speech services or the configured transcription service may process audio.
- Transcripts are presented for review before being used as a goal.
- Anonymous mission history is scoped to its session, can be cleared, and has a 30-day expiration.
- Browser and extension limitations, network availability, and service configuration affect the experience.

## Engineering overview

GuideGPT combines a React 19 and Vite frontend, Vercel Functions, Neon Postgres, Zod request validation, Vitest tests, and a Chrome Manifest V3 extension.

The extension uses an isolated Shadow DOM interface. Server endpoints handle guidance, transcription, anonymous-session history, and mission progress. Request bounds, origin checks, session validation, and structured responses support a consistent experience across the website and extension.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/analyze` | Create a guide with a basic-planner fallback |
| `POST /api/transcribe` | Convert permitted microphone input to a reviewable transcript |
| `GET /api/history` | Read the current anonymous session's history |
| `DELETE /api/history` | Clear that history |
| `PATCH /api/mission` | Update progress and pause state |
| `GET /api/health` | Report configured service readiness |

## Run locally

Use Node.js 20 or later and npm.

```bash
npm ci
npm run dev:web
```

For the full frontend and server experience, configure a local environment using `.env.example`, connect the required services, and use the Vercel CLI:

```bash
npm run db:migrate
npm run dev
```

The database migration requires the intended development database to be configured first. Never commit `.env.local` or other credentials.

## Verification

```bash
npm test
npm run test:syntax
npm run build
```

Tests cover request bounds, guide structure, fallback relevance, sensitive-control exclusion, progress validation, URL handling, origin boundaries, and malformed sessions.

## Contributing

Contributions are welcome when they make a confusing task easier to understand, improve accessibility, reduce jargon, or protect user control. Describe the task, the point of confusion, and the behavior you expect.
