# GuideGPT Chrome extension

The extension brings the same live GuideGPT mission flow to real webpages in a dark-glass command capsule inspired by compact desktop assistants. It reads visible text and control labels only after you ask for a guide, then sends that bounded observation to the GuideGPT production API.

## Install

1. Download `guidegpt-extension.zip` from the GuideGPT site.
2. Unzip it.
3. Open `chrome://extensions`.
4. Turn on Developer mode.
5. Choose **Load unpacked** and select the unzipped folder.
6. Pin GuideGPT, open any normal webpage, and select the GuideGPT toolbar icon.

Chrome restricts extensions on internal pages such as `chrome://settings` and the Chrome Web Store.

## What it can do

- Create a 2–7 step plan from your goal and the current visible page.
- Fall back to a clearly labeled basic guide if the AI provider is unavailable.
- Highlight a matching visible control when you choose **Show me**.
- Save mission progress to an anonymous extension session.
- Resume or clear history through the shared GuideGPT service.
- Pause without changing the webpage.
- Drag the capsule anywhere on larger screens and resize its width and height independently.
- Choose Cobalt, Violet, Rose, Amber, Emerald, or Graphite and keep separate desktop and tablet layouts between visits.
- Use GuideGPT in English (US), Simplified Chinese, Korean, Japanese, Spanish, Russian, or Brazilian Portuguese. Your choice is remembered with your other extension preferences.
- Dictate a goal with the microphone when Chrome supports speech recognition. GuideGPT places the transcript in the goal box so you can review and edit it before choosing **Build my guide**.
- Turn voice-over on when you want the browser to read the mission summary and each new step aloud. Voice-over is off by default and can be turned off at any time.

Chrome or another browser speech service may process microphone audio to create a transcript. GuideGPT does not intentionally store the audio. After you review and send a transcript, it is treated like a goal you typed yourself. The responsive web demo may use a fallback transcription provider to process audio before showing the transcript for review.

On narrow phone-sized browser windows, GuideGPT uses a stable bottom sheet so guidance and color controls remain reachable. Standard Chrome extensions run on supported desktop Chromium browsers; the responsive website demo remains available on phones.

GuideGPT never clicks, types, submits, purchases, or changes permissions for you.
