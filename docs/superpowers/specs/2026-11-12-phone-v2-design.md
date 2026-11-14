# Two Perspectives v2 design and screen map

## Scope

Implement the supplied Figma phone screens as an independent React/Vite/Tailwind app in the current folder. The user's instruction to continue building authorizes proceeding with the supplied design and behavior. Preserve the original project as read-only. Do not deploy or publish the app. The public GitHub repository is connected; no remote source push is needed for local implementation.

This phase is a local, one-device prototype of a future two-device experience. A visible demo label accompanies the join-code/QR UI. Two participants take turns with private handoffs. Codes do not connect browsers. No session server, Podman container, persistence, response uploads, analytics, or login is in scope.

## Screen map

| Screen | Purpose | Actions and next screen | Response visibility |
| --- | --- | --- | --- |
| Onboarding 1: See both sides | Introduce two perspectives | Next → 2; Skip → Let's begin | None |
| Onboarding 2: Share your perspective | Explain individual responses | Next → 3; Skip → Let's begin | None |
| Onboarding 3: Compare and reflect | Explain the shared reveal | Next → 4; Skip → Let's begin | None |
| Onboarding 4: Plan for next time | Explain the next step | Next → Let's begin; Skip → Let's begin | None |
| Let's begin | Welcome and acknowledge the experience | Begin → Ground rules | None |
| Ground rules modal | Establish conversation expectations | Agree → Person 1; Close → welcome | None |
| Persona | Enter nickname and choose a local avatar configuration | Valid Continue → join-code preview for participant 1; participant 2 setup → scenario or private handoff | None |
| Join-code modal | Demonstrate the future join interaction | Copy code; validate a demo code; continue to participant 2 setup | None; explicitly local demo |
| Choose scenario | Choose a shared fictional situation | Select a card and Continue → private handoff to participant 1 | None |
| View perspective U1 | Show the assigned character view | Next → U1 feelings | U1 perspective only; no partner response |
| View perspective U2 | Show the other assigned character view after handoff | Next → U2 feelings | U2 perspective only; no partner response |
| Feelings / response, each participant | Draw or write and explain a response | Color palette; clear drawing; validate and Submit → handoff after first, Compare after second | Current participant draft only |
| Private handoff | Conceal completed and unfinished responses while passing the device | Ready → assigned perspective/response | No response elements mounted |
| Compare U1 | Put both completed responses together, U2 first | Next → Compare U2; reflection remains available only after both submissions | Both submitted responses |
| Compare U2 | Show both completed responses with U1 first | Next → Reflection | Both submitted responses |
| Reflection | Ask what changed and choose a way forward | Choose Repair, Pause, Agree, Set aside, or Later → corresponding modal; the selected path stays local | Both submitted responses may be revisited |
| Reflection: Repair modal | Discuss a small action to reconnect | Close → Reflection; finish → end confirmation | No new private response reveal |
| Reflection: Pause modal | Discuss a break and what is needed | Close → Reflection; finish → end confirmation | Same |
| Reflection: Agree modal | Discuss something both can work with | Close → Reflection; finish → end confirmation | Same |
| Reflection: Set aside modal | Allow different views without forced agreement | Close → Reflection; finish → end confirmation | Same |
| Reflection: Later modal | Discuss when/how to return | Close → Reflection; finish → end confirmation | Same; no saved session implied |
| Reset / end confirmation | Deliberately clear all participant data | Reset → fresh setup; End → cleared ending screen | All nicknames, choices, text, drawings, and submission flags cleared |

Figma provides visual appearance; the written prompt provides behavior. Displayed phone status bars and home indicators belong to the design mockups and are replaced with actual browser safe areas. Portrait layouts use available width rather than a fixed 402px canvas. The original four-card journey, songs, symbols, wording checker, and unrelated catalog UI are hidden.

## Architecture

- `src/data.js`: seed scenarios and preset palette. `src/content.js`: onboarding text, avatar configurations, reflection paths, and artwork mapping.
- `src/session.js`: pure reducer and validation helpers for participant setup, private response flow, joint reveal, reset, and end. React `useReducer` owns the session state; no storage APIs.
- `src/App.jsx` and focused screen components: navigation, selected states, local join-code demonstration, dialog state, and screen focus.
- `src/SketchPad.jsx`: pointer-based touch/pen/mouse drawing with selected brush color, clear, and local PNG state. Text entry provides the keyboard-accessible alternative.
- `src/color-api.js` and `src/usePalette.js`: reuse the original fixed-query ColorMind request/validation/cancellation logic, with explicit loading, live, and preset fallback labels.
- `src/styles.css`: shared tokens, phone layout, visible focus, safe-area padding, keyboard-friendly fields, modal overflow, and reduced-motion behavior.

## Validation and privacy boundaries

Require two distinct trimmed nicknames, a selected avatar configuration, one valid scenario, and one explicit submission per participant. Drawing and text are optional; an empty or whitespace-only part produces the nickname-based missing-content message in the comparison after both people submit. Keep the 1,200-character text limit and field-type validation. Freeze submissions until a reset; no accidental duplicate submission. Handoffs render no response content or missing-content messages. Compare and reflection cannot be reached before both submissions. Back/navigation never bypasses this gate.

ColorMind receives only the fixed request `{"model":"default"}` with credentials omitted and no referrer. Invalid JSON, invalid colors, timeout, network failure, and empty palettes use visibly labeled presets with retry. Nothing is uploaded or saved. Refresh clears everything.

## Verification

Use test-first development for reducer privacy/validation/reset behavior and catalog request/validation failures. Run `npm test` and `npm run build` with Node 24. In a browser, test onboarding, validation, both participant handoffs, touch drawing, comparison, all five reflection modals, reset/end, keyboard navigation, narrow phone widths, and overflow. Distinguish controlled catalog fixtures from live access. Record unverified behavior honestly.

## Reference access

The Figma connector reports no edit access for `kimchampion.work@gmail.com`. The user explicitly authorized the open desktop Figma screens as the visual reference. The supplied screens were inspected there; matching local artwork and exported illustrations are served from `public/assets/`. Timer and screenshot controls shown in Figma remain hidden because they are outside the written interaction scope. Actual verification and device limitations are recorded in `docs/verification.md`.
