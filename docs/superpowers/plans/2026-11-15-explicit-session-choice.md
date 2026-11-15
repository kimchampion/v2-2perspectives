# Explicit session choice implementation plan

**Goal:** Generate a session code only when the person chooses Create a session.

**Approved flow:** Welcome acknowledgment → ground rules → three choices: Create a session, Join a session, Use one device. Create calls the existing bounded API and immediately shows the code/copy action before persona setup; a creator continues directly into joint mode after their persona. Join accepts a partner's code, then builds their own persona and joins without creating another code. One device goes straight through both persona forms without a server call, generated code, or join dialog. Remove the later Enter joint session step. Existing privacy, joint protocol, free-tier waiting, validation, and local interaction flow remain.

**Architecture:** Keep startup/navigation state in src/App.jsx. Replace the old post-persona invitation/creation controls in src/screens/Setup.jsx with SessionChoices and SessionInvitation. Keep the existing JoinCodeForm, JointStatus, client transport, server, and response flow. Initialize/clear local state with an empty code; keep the exported legacy generator available. Cancel pending creation when switching choices or leaving, and ignore late replies. A previously created code can be revisited without generating another one.

- [x] Update setup rendering tests for the three explicit choices, pending/error recovery, immediate code invitation, and no Enter joint session action. Observe expected failures.
- [x] Implement the new screens and route rules acceptance to choices. Move creation into the Create callback; preserve the creator token only in memory. Auto-join after a shared persona, and advance directly to Person 2 for local mode.
- [x] Remove unused automatic/local code generation and obsolete welcome/join-modal controls. Preserve partial persona values when revisiting the same code and ensure Back, cancel, reset/end, and late replies cannot change a newer choice.
- [x] Run npm test and npm run build with Node 24. Use browser request-count fixtures to verify no creation at initialization/rules/local/join; exactly one on explicit Create; copy, cancellation and late-result behavior. Check the real two-client shared flow, local flow and phone widths 320–430 with enlarged text.
- [x] Review startup/navigation changes and update README/AGENTS/verification. Leave changes local; no push/deployment is requested.
