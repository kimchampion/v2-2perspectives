# Shared Rides scenario

Add a fifth seed scenario without changing the four existing records or the interaction flow. The user confirmed that participant 1 is the passenger and participant 2 is the driver; swap only the supplied name placeholders to make the copy consistent with those roles.

1. Add the three supplied PNGs to `public/assets/` using the requested filenames.
2. Add `ride` to `src/data.js` and its passenger/driver artwork to the existing image mapping. Use an optional card description and image filename, preserving the original scenarios' current rendering.
3. Resolve numbered name placeholders using the two local participants, as plain React text. Preserve the supplied perspective paragraph breaks.
4. Verify original scenario records, exact approved copy, role/image pairing, nickname interpolation, private submissions, discussion, and reflection with tests.
5. Run `npm test` and `npm run build` on Node 24. Check the fifth card and both perspective screens at 320–430px, then complete the local flow through reflection. Keep the work local.
