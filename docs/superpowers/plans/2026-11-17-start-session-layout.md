# Start Session layout implementation plan

**Goal:** Match the supplied session-choice pattern while retaining immediate Create/Join navigation and the existing one-device flow.

**Approved behavior:** Create Session and Join Session open their flows immediately. The user explicitly chose to omit Next. Share one device is the sole outlined bottom action, at the existing 714px frame coordinate. The navigation title is Start Session. Retain Medium headings, text scaling, and bounded/cancellable session creation.

**Architecture:** Keep SessionChoices in src/screens/Setup.jsx and its existing callbacks. Put the two descriptions and immediate actions in responsive rows inside Page content. Keep the local callback in Page actions. Do not change session APIs, data handling, or other screens.

**Tech stack:** React, Vite, Tailwind and existing CSS, Node 24.

- [x] Update the existing three route/pending/error rendering tests for Create Session, Join Session and Share one device; confirm they fail against the old labels.
- [x] Update SessionChoices markup and scoped row styles. Stack descriptions and actions when enlarged text leaves insufficient room. Retain native buttons, focus indicators, pending creation state, live waiting/error messages, and Join/local bypasses.
- [x] Add Start Session to App navigation and use Share one device in creation-error guidance.
- [x] Run the focused tests, full npm test and npm run build. Use a local production preview with the existing loopback test server.
- [x] Check 320/375/390/430px layouts at normal and simulated 200% text, keyboard navigation, and immediate Create/Join/local actions. Verify session codes and the 714px footer coordinate, preserve preexisting preview tabs, and save local screenshot evidence.
- [x] Update README and verification notes with observed results and limits. Keep all changes local.
