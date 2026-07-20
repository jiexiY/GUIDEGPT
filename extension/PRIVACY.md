# GuideGPT extension privacy

Last updated: July 19, 2026

GuideGPT is designed around explicit user action and data minimization.

## Data used

When you choose **Build my guide**, the extension collects:

- the goal you typed or the voice transcript you reviewed and chose to send;
- the current page title;
- the current page origin and path;
- visible page text, limited to 12,000 characters;
- labels and roles for up to 80 visible controls.

The extension excludes password and hidden inputs, typed form values, textareas, editable content, and URL query strings or fragments.

## Voice features

Voice input is optional. In the Chrome extension, it uses speech recognition provided by Chrome or the browser. That browser service may process microphone audio to create the transcript. The transcript is shown in the goal box first: you can review, edit, or delete it before manually choosing **Build my guide**. GuideGPT receives the transcript only after you send it, and then treats it exactly like a typed goal.

The responsive web demo may use a fallback transcription provider. When that fallback is needed, the provider processes the audio before the transcript is shown for review. GuideGPT does not intentionally store microphone audio. Browser and transcription-provider processing may be subject to their own privacy terms.

Voice-over is optional and off by default. When enabled, the browser's speech-synthesis feature reads the current mission summary and new steps aloud. You can turn it off at any time.

## Data storage

Visible page text and control labels are used to create the guide but are not stored in mission history. GuideGPT stores the goal, page title, sanitized page path, generated steps, whether AI or the basic planner was used, status, and progress under a random anonymous extension session. Missions expire after 30 days and can be deleted from mission history.

The selected language, voice-over choice, color, position, and size preferences are stored locally by the extension. The available guide languages are English (US), Simplified Chinese, Korean, Japanese, Spanish, Russian, and Brazilian Portuguese.

## Processing and third parties

GuideGPT first attempts guide generation through the Vercel AI Gateway. If that service is unavailable, the GuideGPT Vercel function creates a basic guide from observed control labels without another AI provider. Mission history uses a managed Neon Postgres database connected to the GuideGPT Vercel project. For its own guide and history requests, the extension contacts only `https://guidegpt-next.vercel.app`. Browser speech recognition may separately use the browser provider described above.

## User control

GuideGPT only reads a page after you start a mission. A dictated transcript always remains review-before-send. GuideGPT never reads passwords or typed form values and never clicks, types, submits, purchases, or changes page permissions for you.
