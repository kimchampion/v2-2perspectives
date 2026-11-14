# Open Peeps local avatar assets

Illustrations by **Pablo Stanley**, from [Open Peeps](https://www.openpeeps.com/).
Open Peeps is dedicated to the public domain under
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

These are all 46 head, 30 face, 30 body, 9 accessory, and 17 facial-hair elements
from the user's local `Flat Assets.zip`, under `Flat Assets/Separate Atoms/`.
No account, API, remote image dependency, or
participant information is involved. Assets are served locally with the app.

`manifest.json` records the exact source-to-output mappings, original dimensions,
palette, source SHA-256 checksums, and layer placements from the original bust.
The original 1136 × 1533 bust defines these coordinates: body (147, 639), head
(372, 180), face (531, 366), facial hair (494.999934, 517.999659), and accessories
(419, 421).

The 46 original heads are retained byte-for-byte under `originals/head/`.
Each `head/{style}-{color}.svg` changes only `fill="#000000"` attributes to its
selected ink color. The original monochrome art combines hair/headwear and head
outline ink in the same path, so this is a **head ink color**, not isolated hair
recoloring. White fills, all path geometry, root dimensions, and viewBoxes remain
unchanged. Each renderable file adds an `avatar-part` group around the source
content. The app references that group with SVG `use`, allowing art that extends
beyond the source viewport to render fully without changing its geometry.
The source None files are included for completeness; None choices render no layer.

Regenerate deterministically from the local archive:

```sh
python3 scripts/import-peeps.py '/path/to/Flat Assets.zip'
python3 scripts/import-peeps.py '/path/to/Flat Assets.zip' --check
```

The importer reads only the explicitly selected entries and source bust. Before
writing, it requires UTF-8 text without NUL bytes, rejects active SVG content,
event handlers, external hrefs, external CSS URL dependencies, and DTD/entity
declarations; checks source dimensions and bust placements; and compares every
variant's complete XML structure and path `d` strings with its original.
`--check` additionally runs UTF-16 processing-instruction/DTD regression probes
and verifies that every expected output file matches its deterministic generated
bytes without changing files.
