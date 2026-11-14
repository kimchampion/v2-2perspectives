# Two Perspectives v2

A phone-focused React, Vite, and Tailwind prototype for two people exploring a fictional situation from different points of view. This independent version follows the new Figma screens. The original app remains a read-only reference.

[Source repository](https://github.com/kimchampion/v2-2perspectives)

## Run locally

Use Node.js 24:

```sh
npm ci
npm run dev
```

Open the local address Vite prints, usually `http://127.0.0.1:5173/`. The phone layout uses available width from 320–430 CSS pixels and stays centered on wider screens. Browser status bars and home indicators are supplied by the device; the app does not draw fake phone controls.

```sh
npm test
npm run build
npm run preview
```

The production preview is at `http://127.0.0.1:4173/v2-2perspectives/`. Development stays at the root URL on port 5173.

Tests cover production asset paths, keyboard grid navigation and semantics, session validation, independent private drafts, submission locks, joint reveal, handoff rendering, reset/end, resume navigation, and the fixed-query ColorMind request. UI tests render the real grid and conversation components on the server; temporary compiled test output stays in ignored `test-results/`. The production build goes into ignored `dist/`.

## GitHub Pages

Site URL: [kimchampion.github.io/v2-2perspectives](https://kimchampion.github.io/v2-2perspectives/).

In repository Settings → Pages, set **Source** to **GitHub Actions**. The workflow in `.github/workflows/deploy-pages.yml` uses Node 24, runs `npm ci`, tests and builds the app, then publishes `dist/` on pushes to `main`. A manual workflow trigger is also available. Production scripts, styles, favicon, illustrations, and avatar parts use the `/v2-2perspectives/` base path. Generated builds stay out of Git.

## Try the flow

1. Read or skip the four introduction screens. Acknowledge the welcome note and read the ground rules.
2. Enter the first nickname and create an avatar using local Open Peeps parts. The preview starts with no hair or facial expression; choose Hair style, Clothing, Accessories, or Expression to customize it. **No expression** remains available in the expression picker to clear the face without changing appearance. Accessories includes independent eyewear/accessory and facial-hair groups, which can be combined. Choose at least one avatar option to enable Continue; an expression is optional. **Reset avatar** restores the default example and clears avatar choices while keeping the nickname. The join dialog is a **local demonstration**: its code and QR preview do not connect devices. Continue on the same device to enter a different nickname for the second participant. The displayed code or `DEMO24` can be used in the demo-code field.
3. Select a fictional scenario. Your avatar sits beside the scenario introduction, scenario setup, and response prompt. Pass the device at the private handoff, then read the assigned perspective; private screens show only the current participant’s avatar.
4. Optionally change your avatar’s expression while composing your private response. Appearance stays the same, and the expression locks when you submit. Draw with a mouse, pen, or finger, then choose **Next** or **This represents...** to explain the drawing. Drawing and text are both optional. Both tabs keep the same private draft. Explicitly submit one response, even if leaving both parts empty. Pass the device to the other participant; the first response remains hidden.
5. After both submissions, both responses appear together. Each comparison puts the partner’s response first. Missing parts show “[nickname] did not draw anything” or “[nickname] did not provide a response.” Whitespace-only entries count as empty. These messages are displayed in the comparison and are not saved into the participant’s draft.
6. Reflect and explore Repair, Pause, Agreement, Set aside, or Later. No agreement is required. Choose another scenario or end the session.

Hiding the page during a private screen conceals it behind a handoff. Continuing returns to the perspective or draft that was open. Choosing a new scenario clears responses and the reflection choice while retaining avatars. **Start over** and **End session** clear all participant data. Refreshing clears everything.

## Keyboard navigation

Avatar choices, scenario cards, and reflection cards use the [WAI-ARIA layout-grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/). Tab and Shift+Tab enter or leave each grid; arrow keys move focus without choosing. Enter or Space activates the focused choice. Home/End move within a row; Control or Command with Home/End reaches the first/last option. A newly opened picker starts at its selected choice, or its first choice if none is selected. Eyewear and facial hair have independent grid stops.

The focus outline is distinct from the selected state and scrolls into view. Dialogs keep Tab navigation inside, close with Escape, and return focus to the trigger. Ordinary buttons and fields retain their natural Tab order.

## Privacy and catalogs

Nicknames, avatar configurations, drawings, written responses, and the reflection choice live only in React state. There is no persistence, backend, login, analytics, response-upload endpoint, or real multi-device connection. Same-device hiding is a turn-taking convention, not secure storage.

ColorMind receives only the fixed public request `{"model":"default"}`. Requests omit credentials and referrer information, never include participant data, and time out after seven seconds. Responses are validated before use. Preset colors remain usable while loading and are explicitly labeled after failure, with a retry action. Third-party services still receive ordinary connection metadata. Fonts and illustrations are served locally.

The original song catalog, preset symbols, four-card journey, wording checker, and unrelated controls are hidden. The Figma timer and screenshot controls are outside the written interaction scope and are also hidden.

## Files

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Connected screens, private handoffs, dialogs, reset and end |
| `src/session.js` | Local session reducer, validators, and reveal guards |
| `src/avatar.js` | Complete head/body/face/accessory/facial-hair catalogs, validation, and local SVG placements |
| `src/Avatar.jsx` | Composed Open Peeps preview |
| `src/AvatarBuilder.jsx` | Appearance and expression dialogs |
| `src/SelectionGrid.jsx` | Shared grid roles, roving focus, activation, and visibility |
| `src/grid-navigation.js` | Row/column and Home/End focus movement |
| `src/navigation.js` | Safe return from a private handoff |
| `src/public-assets.js` | Public artwork URLs under the configured deployment path |
| `src/data.js` | Original seed scenarios and fallback palette |
| `src/content.js` | Onboarding and reflection content; artwork mapping |
| `src/screens/` | Phone screen components |
| `src/SketchPad.jsx` | Pointer drawing and local PNG state |
| `src/color-api.js` | Fixed-query ColorMind requests and validation |
| `src/usePalette.js` | Loading, live, fallback, cancellation, and retry state |
| `src/styles.css` | Figma colors, local Roboto, responsive layout, focus, and reduced motion |
| `public/assets/` | Locally exported or supplied Figma illustrations |

The screen map and implementation plan are in `docs/superpowers/`. Verification results and limitations are in `docs/verification.md`.

## Future joint session

A Node.js session server, initially hosted locally in Podman, is intentionally deferred until the UI is approved. No part of this prototype joins devices, uploads responses, or saves a session to return to later.

## Avatar artwork

The avatar builder uses local [Open Peeps](https://www.openpeeps.com/) vector parts by Pablo Stanley, released under CC0: all 46 heads, 30 bodies, 30 faces, 9 accessories, and 17 facial-hair elements from the supplied archive. None options render no accessory/facial-hair layer. The choices scroll while the live preview and Done button stay visible. Expression names are visually hidden so participants can interpret the faces; descriptive labels remain available to screen readers. All faces are available during setup and while responding.

All four change dialogs show the complete avatar in a bordered live preview, including the selected clothing. The frame grows to 260px on taller phones and compacts on short screens while keeping choices scrollable and Done visible. The wider avatar previews reference local vector groups directly, preserving artwork that extends beyond the original SVG frames. No avatar API, account, or new runtime dependency is used. The importer and source mappings are documented in `public/assets/open-peeps/README.md` and `manifest.json`. The app uses fixed monochrome head ink with no hair-color control. Nicknames and the seven avatar fields remain in React state and clear on session reset/end; the ink and pose fields have fixed values.
