# Keyboard selection grids

Implement the user's request for keyboard navigation on every selection screen in this checkout. Keep all existing avatar layouts, local state, handoff privacy, pointer/touch controls, and response behavior.

Use the W3C WAI-ARIA [layout-grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) and [keyboard conventions](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/): Tab/Shift+Tab enter or leave each grid; arrows move focus without activating; Enter/Space activate a choice. Home/End navigate the current row, Ctrl+Home/End the whole grid. Keep a single roving tabindex=0, logical rows/cells, descriptive names and existing pressed states. Use native buttons inside cells. Remember focus within a mounted grid; a newly opened grid starts at its selected choice or the first choice.

- [x] Write failing tests for row/column navigation, short final rows, boundaries, Home/End, unhandled Tab/activation keys, initial focus and grid rendering.
- [x] Add a shared SelectionGrid component and pure focus-navigation helper. Preserve visible focus and scroll focused controls fully into view.
- [x] Integrate avatar grids (including independent accessory/facial-hair groups and response expressions), horizontal scenario choices, and reflection cards. Keep ordinary navigation/actions in their natural Tab order.
- [x] Verify keyboard entry/exit, selection, cancellation and modal focus return using the browser; check all grids at 320–430px, including the final item in long lists and the pinned reflection footer.
- [x] Run npm test and npm run build under Node 24, obtain a focused review, and record actual checks and remaining assistive-technology/device limitations.
