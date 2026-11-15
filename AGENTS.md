# Two Perspectives v2

Work only in this checkout. The original `/Users/kimchampion/Development/two-perspectives` is a read-only reference. Do not create a worktree, switch repositories, deploy, or publish the app without an explicit new request.

Use Node 24, React, Vite, and Tailwind. Install with `npm ci`. For application changes run `npm test` and `npm run build`, and check the portrait phone flow at 320–430 CSS pixels.

Keep nicknames, persona choices, drawings, responses, and reflections in local React state. The existing local Node/Podman server creates session codes after rule acceptance. Bound session creation to five seconds; after failure offer retry or explicit one-device continuation with a fresh, clearly labeled local demo code. Show the server-created code when creation succeeds. The current screens retain the one-device flow; multi-device participant/response synchronization is future work. Do not add persistence, response uploads, analytics, or login without an explicit request. Keep joint entry disabled and QR artwork hidden until their behavior is explicitly requested. Reset and end clear participant data. Mount no private response content during handoffs; reveal both responses only after both submissions.

Keep seed scenarios in `src/data.js`. ColorMind requests may contain only the fixed public query `{"model":"default"}`. Never send participant data or credentials to catalogs. Validate API data, enforce a timeout, and clearly label preset fallbacks. Do not call mocked API checks live verification.

Preserve touch drawing, accessible labels, keyboard alternatives, visible focus, safe areas, scrolling, and reduced-motion support. Keep unrequested original features hidden. Ignore dependencies, generated builds, local environment files, browser profiles, and temporary test outputs in Git.
