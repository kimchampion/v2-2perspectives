# Safari-safe phone layout

The user approved replacing the old 714px coordinate with a stable usable-viewport footer. Work stays in this checkout; no publishing or session-protocol changes.

1. Add regression tests for shared action slots and viewport sizing. Verify native external form ownership, conditional/fragment actions, empty reserved slots, keyboard shrink/restore, normal toolbar changes, zoom, and invalid geometry.
2. Replace Page's measured 714px positioning with a flexible scroll region (maximum 636px) and shared pagination/primary/secondary slots. Move onboarding pagination into its own slot. Keep secondary actions 8px below the primary, with safe-area padding.
3. Size the frame with 100svh (100vh fallback). Add an isolated viewport controller that constrains the frame only while editing ordinary page fields, follows keyboard panning, ignores pinch zoom, and cleans up listeners/styles. Keep modals separate. Leave an outer scrolling fallback for very short screens or enlarged text.
4. Run npm test and npm run build with Node 24. Inspect the real portrait flow at 320, 375, 390, and 430 CSS pixels, including short heights, enlarged text, validation, drawing, handoffs, comparison, reflection, ending, and modal scrolling. Distinguish simulated keyboard geometry from physical iPhone verification.
5. Obtain an independent code review, address actionable issues, update AGENTS.md/README.md/verification notes, and open a fresh local preview. Preserve unrelated pending copy edits and the untracked Frame 107.png.

Success means primary actions align across pages for the same viewport/text preference, content scrolls without hiding actions under the normal browser controls, all actions remain reachable with large text/short viewports, and existing private-response/form behavior is preserved.

Completed locally: 142 tests and production build pass; 175 portrait measurements and six explicitly synthetic keyboard integration checks recorded. Review findings about outer-scroll reset, keyboard measurement/panning, and long-nickname button height were addressed. Native iPhone Safari controls/keyboard still require physical-device verification. See docs/verification.md for evidence and limits. No push or deployment.
