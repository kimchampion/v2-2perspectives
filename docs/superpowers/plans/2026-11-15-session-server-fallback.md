# Session-server fallback implementation plan

**Goal:** Let people continue the existing one-device experience when session creation fails or stalls.

**Design:** Keep ground rules open after a failed request. Show an accessible error, Try again, and Continue on this device. Bound the whole request, including JSON parsing, to five seconds. Continuing locally generates a fresh code labeled Local demo code, hides remote code entry, and keeps joint entry disabled. Successful server creation retains its existing code and copy behavior. Closing or bypassing cancels the request; late results cannot replace local state. Participant content remains in React memory.

**Architecture:** Keep request validation/deadlines in `src/lib/sessionClient.js`, code provenance in `src/session.js`, startup navigation in `src/App.jsx`, and error actions/invitation copy in the existing `src/screens/Setup.jsx`. Socket.IO connects only on an explicit join, never while using the local fallback.

**Tech stack:** Node 24, React, Vite, Tailwind; existing Node test runner and esbuild fixtures.

- [x] Add failing request tests for a five-second default, ignored aborts, stalled JSON parsing, network failure, and no background Socket.IO connection. Run `node --test tests/session-client.test.js` and confirm failures expose the missing behavior.
- [x] Add failing reducer/rendering checks for code provenance, reset/end clearing, retry/local actions after failure, disabled pending state, and local-only invitation labeling. Run the relevant tests and confirm the failures.
- [x] Implement the bounded request using `Promise.race`, clean up listeners/timers, and defer Socket.IO connection until `joinSession`.
- [x] Implement local/server code provenance, explicit local fallback, retry/cancel guards, and existing-styled accessible controls. Preserve `begin()` and both-participant response/reveal flow.
- [x] Run `npm test` and `npm run build`. Check real success plus controlled HTTP/network/timeout/JSON/late-result fixtures, retry, close, full fallback flow, reset/end, copy, and 320/375/390/430px layouts with enlarged text. Controlled failures are not live server verification.
- [x] Update README, AGENTS, and verification notes with the fallback behavior and actual evidence. Leave publication for an explicit request.
