# GuideGPT extension privacy

Last updated: July 18, 2026

GuideGPT is designed around explicit user action and data minimization.

## Data used

When you choose **Build my guide**, the extension collects:

- your written goal;
- the current page title;
- the current page origin and path;
- visible page text, limited to 12,000 characters;
- labels and roles for up to 80 visible controls.

The extension excludes password and hidden inputs, typed form values, textareas, editable content, and URL query strings or fragments.

## Data storage

Visible page text and control labels are used to create the guide but are not stored in mission history. GuideGPT stores the goal, page title, sanitized page path, generated steps, whether AI or the basic planner was used, status, and progress under a random anonymous extension session. Missions expire after 30 days and can be deleted from mission history.

## Processing and third parties

GuideGPT first attempts guide generation through the Vercel AI Gateway. If that service is unavailable, the GuideGPT Vercel function creates a basic guide from observed control labels without another AI provider. Mission history uses a managed Neon Postgres database connected to the GuideGPT Vercel project. The extension contacts only `https://guidegpt-next.vercel.app`.

## User control

GuideGPT only reads a page after you start a mission. It never reads passwords or typed form values and never clicks, types, submits, purchases, or changes page permissions for you.
