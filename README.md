GuideGPT - Prototype (floating chat + screen sharing)
----------------------------------------------------

How to run locally (Chrome):
1. Open Chrome and go to: chrome://extensions
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked".
4. Select the folder that contains manifest.json, content.js, style.css.
5. Visit any website. The floating GuideGPT chat will appear in the bottom-right.
6. Click "Share My Screen" in the chat, allow Chrome's screen picker, and then interact.
   - The prototype will capture periodic frames and show mock guidance + highlights.
7. To demo "ask for help", type something like "I want to build a website" into the input box.

Notes:
- This is a prototype: AI analysis is mocked locally (no OpenAI key is used).
- For real AI:
  - Build a backend (Node/Express) to accept images and call the OpenAI vision or chat API.
  - Never include API keys in front-end code; always proxy via a server.
  - The commented function in content.js shows an example of a backend call.
- The extension uses getDisplayMedia() for screen sharing; the browser will ask the user to choose a screen/window/tab to share.
- This code is intentionally simple to be demo-ready within a few hours. You can expand it:
  - Send frames to backend for OCR or vision analysis.
  - Return bounding boxes to show more accurate highlights.
  - Add speechSynthesis for voice guidance.

Good luck at the hackathon! If you want, I can now:
- Produce a simple Node.js backend file that takes the image and returns a mocked AI response, OR
- Produce a real backend example that calls OpenAI (you'll need an API key).
