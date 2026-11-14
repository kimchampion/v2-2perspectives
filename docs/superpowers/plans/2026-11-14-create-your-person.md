# Create Your Person Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the bounded asset preparation task and independent review. Stay in this checkout; do not create a worktree, switch repositories, commit, push, or deploy. Steps use checkbox syntax.

**Goal:** Replace participant category controls with an accessible local Open Peeps avatar builder, preserving the nickname field and the existing two-person flow.

**Architecture:** `src/avatar.js` defines the curated options, a default preview configuration, and strict avatar validation. Participant state becomes `{ name, avatar }`, with `avatar: null` until a person selects an option. SVG parts are composed with the original bust template's placements. Appearance is edited during setup; the user subsequently requested expression changes during the response step. Those changes remain private and lock with submission. No avatar data is uploaded or persisted.

**Tech Stack:** Node 24, React/Vite/Tailwind, local SVG files, existing reducer, native form controls, Node tests.

## 1. Local artwork

- [x] Import only curated parts from `/Users/kimchampion/Downloads/Flat Assets.zip` into `public/assets/open-peeps/` using `scripts/import-peeps.py`. Preserve source dimensions and path geometry, use the source bust placements, and document Open Peeps/CC0 attribution.
- [x] Provide six heads (`short`, `afro`, `long`, `shaved`, `hijab`, `turban`), four hair/head-cover ink colors (`ink`, `chestnut`, `copper`, `silver`), three outfits (`tee`, `hoodie`, `sweater`), two eyewear assets plus no accessory, and six expressions (`calm`, `happy`, `sad`, `frustrated`, `unsure`, `tired`). The single pose is `bust`.
- [x] Validate the imported SVGs contain no scripts or remote asset dependencies. Keep only the curated set, not the entire library.

## 2. Avatar and participant state

- [x] Write failing avatar tests for complete configurations, every curated option, malformed/unknown values, and independent default objects. Add/update reducer tests for `{ name: '', avatar: null }`, required selection, cloned configurations, two independent participants, setup-only edits, reset/end clearing, and unchanged private-response reveal rules.
- [x] Add `src/avatar.js` with `avatarOptions`, `createAvatar()`, `isAvatar()`, and option/asset metadata. Implement six string fields: `hair`, `hairColor`, `clothing`, `accessory`, `pose`, `expression`.
- [x] Replace the old participant fields in `src/session.js` with the new avatar field. Preserve trimmed distinct names, the 30-character limit, all response privacy guards, and optional response content.
- [x] Run `node --test tests/avatar.test.js tests/session.test.js` and inspect the failures before and after implementation.

## 3. Screen and routing

- [x] Add `src/Avatar.jsx` to compose local parts. Use original body `(147,639)`, head `(372,180)`, face `(531,366)`, and eyewear `(419,421)` placements in the 1136×1533 bust canvas. Provide an accessible full-preview description and decorative thumbnails.
- [x] Replace `Persona` with `CreatePerson` in `src/screens/Setup.jsx`, and update App's screen component/identifier using its existing navigation state. Use the requested heading and supporting copy verbatim; retain the name input styling.
- [x] Show the default avatar as a labeled preview, with a visible instruction to choose an option. Any appearance or feeling selection creates a complete configuration. Mark selected options clearly. Disable Continue until the nickname and avatar are valid, and explain why. Display duplicate-name errors without requiring submission.
- [x] Use the later Figma reference's preview and category-button layout, while retaining the original requested heading and control set as confirmed by the user. Category buttons open a curated option dialog with a live preview. Expression choices use “How are you feeling right now?”. Do not add Skin or Pose controls.
- [x] Add a compact current-expression preview and chooser on the response screen. Add `SET_EXPRESSION` with setup/phase/index/value checks, preserving all appearance fields and freezing submitted participants. Mount no avatar or expression content during handoffs.
- [x] Keep the Continue action after the controls at the bottom of the form and allow the page to scroll naturally, with no overlaid footer hiding category buttons.
- [x] Write setup rendering tests for required copy, local previews, option labels, selection states, disabled/enabled Continue, duplicate names, and absence of the removed controls.

## 4. Cleanup and verification

- [x] Remove obsolete catalogs, styling, copied icon files, tests, and documentation references for the replaced controls. Update README and the current design/verification documents to the avatar model.
- [x] Run `npm test` and `npm run build` under Node 24. Use the local preview to check 320, 375, 390, 430px and a wider desktop viewport; exercise both participant setups, every option, immediate previews, validation, keyboard controls, back navigation, and the connected response/reflection journey.
- [x] Check representative asset combinations visually, especially head coverings, glasses, expressions, and colored heads. Confirm no external avatar requests or broken local assets.
- [x] Obtain an independent specification and quality review, fix relevant findings, and repeat the affected checks. Report actual results and physical-device limitations. Leave work local and the preview running.

## Follow-up catalog and preview revisions

- [x] Remove the hair-color control, add Hair style, default to No hair, and add an avatar-only reset preserving the nickname.
- [x] Include every source head (46), body (30), face (30), accessory (9), and facial-hair element (17). Keep facial hair independently selectable under Accessories.
- [x] Fix source-frame clipping with validated external vector groups and wider preview bounds; preserve source geometry and original placements.
- [x] Hide visible expression names while retaining accessible labels and keyboard selection.
- [x] Exercise every catalog option, all four phone widths, reset, expression changes, private handoffs, new-scenario retention, and end clearing. Complete focused independent reviews and final test/build checks.
