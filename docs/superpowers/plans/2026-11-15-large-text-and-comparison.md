# Large text and comparison layout

**Goal:** Respect browser/device text preferences, preserve the current default typography, and apply the user's new participant-response layout to both Compare articles.

**Approach:** Keep the React/Vite/Tailwind stack and all participant data local. Use a root-relative typography unit, with WebKit's Dynamic Type body style as the source on supported Apple browsers. Keep pinch zoom enabled. Use a font-relative container breakpoint to reflow crowded layouts, allow complete dialog/page scrolling at large text sizes, and keep grid rows and keyboard navigation synchronized with their rendered column count.

- [x] Record the existing failure with an ignored 200% text-size fixture that runs the real app. Update comparison rendering tests for the new layout and empty-state copy, then observe their failure.
- [x] Convert all font sizes to relative values while preserving 17px body copy, 14px labels, and other current default sizes. Allow text-bearing controls to grow and wrap.
- [x] Add responsive grid columns derived from CSS so large-text single-column grids retain correct ARIA rows, columns, and arrow navigation. Preserve focus when regrouping rows.
- [x] Implement the normal-size comparison layout: avatar above nickname in the left column, drawing or its placeholder on the right, and the written response across the full width below. Apply the same layout to both participants, retaining partner-first order and the You marker.
- [x] Use the supplied empty messages: “[nickname] did not create a drawing” and “[nickname] did not create a response.” Reveal guards and private handoffs remain unchanged.
- [x] Run Node 24 `npm test` and `npm run build`. Verify normal and simulated 150%/200% text at 320–430 CSS pixels, plus a larger-text stress case. Exercise both submissions, comparison orders, reflection, modal scrolling, grid keyboard navigation, and zoom availability. Document which device settings were simulated and which remain untested on physical phones.

No worktree, new dependencies, storage, backend, publication, or deployment is needed.
