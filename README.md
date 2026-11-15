# Two Perspectives v2

A phone-focused React, Vite, and Tailwind prototype for two people exploring a fictional situation from different points of view. This independent version follows the new Figma screens. The original app remains a read-only reference.

[Source repository](https://github.com/kimchampion/v2-2perspectives)

## Run locally

Use Node.js 24:

```sh
npm ci
npm --prefix server ci
npm run dev
```

Open the local address Vite prints, usually `http://127.0.0.1:5173/`. The phone layout uses available width from 320–430 CSS pixels and stays centered on wider screens. Browser status bars and home indicators are supplied by the device; the app does not draw fake phone controls.

In a second terminal, run `npm --prefix server start` with Node 24. The server listens on port 3001 by default. The frontend uses `http://localhost:3001`; set `VITE_SESSION_SERVER` before starting Vite or building to use another address. The updated server can also run from `server/Containerfile` in Podman; rebuild an older container before testing the joint protocol. On this Mac, Podman's binary is `/opt/podman/bin/podman` if it is not on the shell's PATH.

After the ground rules, choose **Create a session**, **Join a session**, or **Use one device**. Only Create a session contacts the creation API. It allows up to 75 seconds for startup and shows a waking message after five seconds. Join and Use one device stay available while waiting; changing routes cancels creation and ignores late replies. A failed creation shows an error and lets you retry with Create a session. One-device activities need no service or session code.

```sh
npm test
npm run build
npm run preview
```

The production preview is at `http://127.0.0.1:4173/`. Development stays at the root URL on port 5173. Production uses the `/` Vite base for the Render static site.

Tests cover production asset paths, keyboard grid navigation and semantics, session validation, independent private drafts, submission locks, joint reveal, handoff rendering, reset/end, resume navigation, and the fixed-query ColorMind request. UI tests render the real grid and conversation components on the server; temporary compiled test output stays in ignored `test-results/`. The production build goes into ignored `dist/`.

## Render testing

App URL: [twoperspectives.onrender.com](https://twoperspectives.onrender.com/).

The frontend static site builds with `npm ci && npm run build` and publishes `dist`. Set its `VITE_SESSION_SERVER` environment variable to the separate Node web-service URL and rebuild; the React app's address is not the session-server address. For the Node web service use root directory `server`, Node 24, build `npm ci`, and start `npm start`. Keep its service on the free tier for controlled testing. Render sets `PORT`, which the server respects. No paid plan or persistence is required. [Free web services can take about a minute to wake up](https://render.com/docs/free#spinning-down-on-idle), so the app includes a longer startup window with an early one-device bypass.

Set the Node service's `CLIENT_ORIGIN` to `https://twoperspectives.onrender.com` to restrict browser access to the app; multiple exact origins can be comma-separated for local testing. The default is `*`. Sessions are limited to 50 in memory and expire after 30 minutes without a session action. A restart clears them. Updating this feature requires releasing both the frontend and Node service.

The legacy GitHub Pages workflow remains in the repository and installs both root and server test dependencies before running tests/build. The root-path build targets Render; publishing it under a GitHub project subpath would require a separate base-path configuration. Generated builds stay out of Git.

## Try the flow

1. Read or skip the four introduction screens. Acknowledge the welcome note and read the ground rules.
2. Choose how to begin after accepting the ground rules. **Create a session** generates a real code and immediately shows it with Copy code, before persona setup. Share it, then choose Build your persona. **Join a session** accepts a partner’s six-character code and opens your own persona form without creating another session. Completing either shared persona connects directly; there is no later joint-entry step. **Use one device** opens Person 1, then Person 2 directly, without a code or network connection. Going Back to the same code preserves the partial persona. The creator is always participant 1 and the partner participant 2, even if the partner joins first. Both see connection/submission status, and the creator chooses a scenario once both are online. QR artwork remains hidden.

   The avatar preview starts with no hair or facial expression. Hair style, Clothing, Accessories, and Expression open the existing pickers. No expression clears only the face. Accessories and facial hair can be combined. Choose at least one option to continue; expression is optional. Reset avatar keeps the nickname and clears avatar choices.
3. Select one of five fictional scenarios. **Speeding and Changing Lanes** (Shared Rides) assigns the first participant as Passenger and the second as Driver; its card, setup, and perspectives use the entered nicknames. The four original scenarios are unchanged. Your avatar sits beside the scenario introduction, scenario setup, and response prompt. Pass the device at the private handoff, then read the assigned perspective; private screens show only the current participant’s avatar.
4. Optionally change your avatar’s expression while composing your private response. Appearance stays the same, and the expression locks when you submit. Draw with a mouse, pen, or finger, then choose **Next** or **This represents...** to explain the drawing. Drawing and text are both optional. Both tabs keep the same private draft. Explicitly submit one response, even if leaving both parts empty. In a joint session each device receives its own assigned perspective; a submitted response waits for the partner without mounting response content. On one device, pass it at the private handoff instead.
5. After both submissions, both responses appear together. Each comparison puts the partner’s response first. Both participants use the same layout: avatar above nickname on the left, drawing on the right, and written response across the full width below. Avatars include each participant's submitted expression. Your own response is marked **You**. Missing parts show “[nickname] did not create a drawing” or “[nickname] did not create a response.” Whitespace-only entries count as empty. These messages are displayed in the comparison and are not saved into the participant’s draft.
6. Reflect and explore Repair, Pause, Agreement, Set aside, or Later. A joint reflection choice is shared with both devices. Either person can choose a new scenario after reveal, clearing both responses and returning the creator to scenario selection, or end the session for both. No agreement is required.

Hiding the page during a private screen conceals it behind a handoff. Continuing returns to the perspective or draft that was open. Choosing a new scenario clears responses and the reflection choice while retaining avatars. **Start over** and **End session** clear all participant data. Refreshing clears everything.

## Keyboard navigation

Avatar choices, scenario cards, and reflection cards use the [WAI-ARIA layout-grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/). Tab and Shift+Tab enter or leave each grid; arrow keys move focus without choosing. Enter or Space activates the focused choice. Home/End move within a row; Control or Command with Home/End reaches the first/last option. A newly opened picker starts at its selected choice, or its first choice if none is selected. Eyewear and facial hair have independent grid stops.

The focus outline is distinct from the selected state and scrolls into view. Dialogs keep Tab navigation inside, close with Escape, and return focus to the trigger. Ordinary buttons and fields retain their natural Tab order.

## Larger text

Typography follows the browser's preferred root text size. Supported Apple browsers use the [WebKit Dynamic Type body style](https://webkit.org/blog/3709/using-the-system-font-in-web-content/) as their sizing source. Roboto, the current default sizes, and their hierarchy are retained; labels scale along with the rest of the text when the user's preference grows. Pinch/page zoom remains enabled.

When text is large relative to the phone frame, navigation titles get their own row, avatar introductions and comparison visuals stack, and choice grids become one column. Grid rows, ARIA column counts, and arrow-key movement update together; focus stays on the same choice when columns change. Avatar dialogs and reflection use full-content scrolling at these sizes so fixed panels cannot conceal text or actions. The normal text layout retains its existing pinned controls.

Local browser checks include simulated 150%, 200%, and 300% root text preferences at 320–430 CSS pixels. The simulations run the real app from ignored test fixtures; native iOS/Android accessibility settings still need physical-device verification.

## Privacy and catalogs

Drafts and local activity data live in React memory. Creating a server code sends no participant data. Completing a shared persona sends the nickname/avatar; explicit submission sends that person's response/drawing and expression to transient server memory. No unfinished draft is sent. The server exposes response content and submitted expressions to the partner only after both explicit submissions. Socket.IO stays disconnected for one-device activities. There is no disk/browser persistence, login, or analytics. Same-device hiding is a turn-taking convention, not secure storage.

ColorMind receives only the fixed public request `{"model":"default"}`. Requests omit credentials and referrer information, never include participant data, and time out after seven seconds. Responses are validated before use. Preset colors remain usable while loading and are explicitly labeled after failure, with a retry action. Third-party services still receive ordinary connection metadata. Fonts and illustrations are served locally.

The original song catalog, preset symbols, four-card journey, wording checker, and unrelated controls are hidden. The Figma timer and screenshot controls are outside the written interaction scope and are also hidden.

## Files

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Connected screens, private handoffs, dialogs, reset and end |
| `src/session.js` | Local session reducer, validators, and reveal guards |
| `src/lib/sessionClient.js` | Server-code creation, validation, cancellation, and existing Socket.IO helpers |
| `src/useJointSession.js` | In-memory connection credentials, acknowledgements, bounded reconnect and stale-result guards |
| `src/joint-session.js` | Validation of public/session-reveal snapshots before React state accepts them |
| `src/avatar.js` | Complete head/body/face/accessory/facial-hair catalogs, validation, and local SVG placements |
| `src/Avatar.jsx` | Composed Open Peeps preview |
| `src/AvatarBuilder.jsx` | Appearance and expression dialogs |
| `src/SelectionGrid.jsx` | Shared grid roles, roving focus, activation, and visibility |
| `src/grid-navigation.js` | Row/column and Home/End focus movement |
| `src/navigation.js` | Safe return from a private handoff |
| `src/public-assets.js` | Public artwork URLs under the configured deployment path |
| `src/data.js` | Seed scenarios, including Shared Rides, and fallback palette |
| `src/scenario-copy.js` | Plain-text participant-name substitution for scenario copy |
| `src/content.js` | Onboarding and reflection content; artwork mapping |
| `src/screens/` | Phone screen components |
| `src/SketchPad.jsx` | Pointer drawing and local PNG state |
| `src/color-api.js` | Fixed-query ColorMind requests and validation |
| `src/usePalette.js` | Loading, live, fallback, cancellation, and retry state |
| `src/styles.css` | Figma colors, local Roboto, responsive layout, focus, and reduced motion |
| `public/assets/` | Locally exported or supplied Figma illustrations |
| `server/index.js` | Transient joint sessions, stable participant slots, private reveal, shared actions and cleanup |
| `server/avatar-catalog.json` | Avatar ID allowlists generated from the UI catalog; tests enforce exact parity |

The screen map and implementation plan are in `docs/superpowers/`. Verification results and limitations are in `docs/verification.md`.

## Joint-session behavior and limits

The Node server stores only transient sessions, uses stable participant slots and private in-memory rejoin credentials, validates commands and round numbers, locks submitted responses, and reveals only after both explicit submissions. Empty/drawing-only/text-only submissions are valid. A restarted scenario clears responses and reflection while retaining participants and their avatars. End clears participant data and closes the shared session. Never share rejoin credentials; only the short session code is intended for the partner.

Network reconnects automatically rejoin the same slot while the page stays open and preserve the local unsubmitted draft. Commands need acknowledgement and do not queue stale writes while disconnected. A server restart, expired session, refresh, or closing the page can lose the activity because there is no persistence. The UI reports unavailable/full sessions and offers retry or return to start. Creating a shared session requires a compatible server that returns a creator token with the code. Older code-only servers show a creation error; Use one device remains available without a server. QR generation is deferred. Creation and reconnect allow a bounded 75-second startup window; ordinary command acknowledgements are bounded separately. A canceled or late reply cannot replace a new local activity.

## Avatar artwork

The avatar builder uses local [Open Peeps](https://www.openpeeps.com/) vector parts by Pablo Stanley, released under CC0: all 46 heads, 30 bodies, 30 faces, 9 accessories, and 17 facial-hair elements from the supplied archive. None options render no accessory/facial-hair layer. The choices scroll while the live preview and category-specific Apply button stay visible. Every choice, including expressions, shows its text label beneath the image. Descriptive labels also remain available to screen readers. All faces are available during setup and while responding.

All four change dialogs show the complete avatar in a bordered live preview, including the selected clothing. The compact frame grows to 144px, and choice cards have a 76px minimum height with 48px images and a 2px image-to-label gap. The main Persona preview is smaller too. The navigation title shows Person 1 of 2 or Person 2 of 2 during setup. The wider avatar previews reference local vector groups directly, preserving artwork that extends beyond the original SVG frames. No avatar API, account, or new runtime dependency is used. The importer and source mappings are documented in `public/assets/open-peeps/README.md` and `manifest.json`. The app uses fixed monochrome head ink with no hair-color control. Nicknames and the seven avatar fields remain in React state and clear on session reset/end; the ink and pose fields have fixed values.
