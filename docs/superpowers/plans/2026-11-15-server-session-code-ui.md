# Server-created session code UI

The latest user request authorizes the existing local Node/Podman session service, superseding the earlier demo-code restriction for this slice. Preserve the existing screens, style, `begin()`, `newSessionCode`, participant setup, and same-device response flow. Remote response synchronization is outside this UI step.

- Validate and normalize six-character server codes, including 0 and 1. Remove the internal demo-code fallback and the join dialog's hardcoded bypass.
- Keep the HTTP creation endpoint and Socket.IO exports; bound creation requests and handle cancellation without submitting participant data.
- Keep `begin()` unchanged. Make rule acceptance show a pending state, prevent duplicate creates, and display an actionable creation error. A canceled request must not advance the UI later.
- Display/copy the code prop in JoinPreview. Use session wording, retain the QR artwork with a placeholder label, and call onContinue for the existing same-device setup path.
- Preserve the current real code when selecting a fresh scenario within the same session. Keep local code generation for initialization and clearing as requested.
- Add meaningful code, request, and real-component rendering checks, then run Node 24 npm test/build.
- Start the supplied Podman container, exercise the live creation/copy/validation/continuation flow, and check the dialog at 320–430 CSS pixels. Distinguish controlled request tests from live verification and document the remaining multi-device work.
