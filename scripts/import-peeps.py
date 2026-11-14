#!/usr/bin/env python3
"""Import all heads, faces, bodies, accessories, and facial hair from the local archive.

Usage: python3 scripts/import-peeps.py '/path/to/Flat Assets.zip' [--check]
No network access, third-party packages, or general-purpose archive extraction.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile


PREFIX = "Flat Assets/Separate Atoms/"
OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/open-peeps"
COLORS = {
    "ink": "#1F1F1F",
    "chestnut": "#5C4033",
    "copper": "#91522E",
    "silver": "#77706B",
}
SOURCES = {
    "head": {
        "short": "head/Short 1.svg",
        "afro": "head/Afro.svg",
        "long": "head/Long.svg",
        "shaved": "head/No Hair 1.svg",
        "hijab": "head/Hijab.svg",
        "turban": "head/Turban.svg",
        "bangs": "head/Bangs.svg",
        "bangs-2": "head/Bangs 2.svg",
        "bantu-knots": "head/Bantu Knots.svg",
        "bear": "head/Bear.svg",
        "bun": "head/Bun.svg",
        "bun-2": "head/Bun 2.svg",
        "buns": "head/Buns.svg",
        "cornrows": "head/Cornrows.svg",
        "cornrows-2": "head/Cornrows 2.svg",
        "flat-top": "head/Flat Top.svg",
        "flat-top-long": "head/Flat Top Long.svg",
        "gray-bun": "head/Gray Bun.svg",
        "gray-medium": "head/Gray Medium.svg",
        "gray-short": "head/Gray Short.svg",
        "long-afro": "head/Long Afro.svg",
        "long-bangs": "head/Long Bangs.svg",
        "long-curly": "head/Long Curly.svg",
        "medium-1": "head/Medium 1.svg",
        "medium-2": "head/Medium 2.svg",
        "medium-3": "head/Medium 3.svg",
        "medium-bangs": "head/Medium Bangs.svg",
        "medium-bangs-2": "head/Medium Bangs 2.svg",
        "medium-bangs-3": "head/Medium Bangs 3.svg",
        "medium-straight": "head/Medium Straight.svg",
        "mohawk": "head/Mohawk.svg",
        "mohawk-2": "head/Mohawk 2.svg",
        "no-hair-2": "head/No Hair 2.svg",
        "no-hair-3": "head/No Hair 3.svg",
        "pomp": "head/Pomp.svg",
        "shaved-1": "head/Shaved 1.svg",
        "shaved-2": "head/Shaved 2.svg",
        "shaved-3": "head/Shaved 3.svg",
        "short-2": "head/Short 2.svg",
        "short-3": "head/Short 3.svg",
        "short-4": "head/Short 4.svg",
        "short-5": "head/Short 5.svg",
        "twists": "head/Twists.svg",
        "twists-2": "head/Twists 2.svg",
        "hat-beanie": "head/hat-beanie.svg",
        "hat-hip": "head/hat-hip.svg",
    },
    "clothing": {
        "tee": "body/Tee 1.svg",
        "hoodie": "body/Hoodie.svg",
        "sweater": "body/Sweater.svg",
        "blazer-black-tee": "body/Blazer Black Tee.svg",
        "button-shirt-1": "body/Button Shirt 1.svg",
        "button-shirt-2": "body/Button Shirt 2.svg",
        "coffee": "body/Coffee.svg",
        "device": "body/Device.svg",
        "dress": "body/Dress.svg",
        "explaining": "body/Explaining.svg",
        "fur-jacket": "body/Fur Jacket.svg",
        "gaming": "body/Gaming.svg",
        "gym-shirt": "body/Gym Shirt.svg",
        "killer": "body/Killer.svg",
        "macbook": "body/Macbook.svg",
        "paper": "body/Paper.svg",
        "pointing-up": "body/Pointing Up.svg",
        "polka-dot-jacket": "body/Polka Dot Jacket.svg",
        "polo-and-sweater": "body/Polo and Sweater.svg",
        "shirt-and-coat": "body/Shirt and Coat.svg",
        "sporty-tee": "body/Sporty Tee.svg",
        "striped-pocket-tee": "body/Striped Pocket Tee.svg",
        "striped-tee": "body/Striped Tee.svg",
        "sweater-dots": "body/Sweater Dots.svg",
        "tee-2": "body/Tee 2.svg",
        "tee-arms-crossed": "body/Tee Arms Crossed.svg",
        "tee-selena": "body/Tee Selena.svg",
        "thunder-t-shirt": "body/Thunder T-Shirt.svg",
        "turtleneck": "body/Turtleneck.svg",
        "whatever": "body/Whatever.svg",
    },
    "expression": {
        "calm": "face/Calm.svg",
        "happy": "face/Smile.svg",
        "sad": "face/Solemn.svg",
        "frustrated": "face/Very Angry.svg",
        "unsure": "face/Concerned.svg",
        "tired": "face/Tired.svg",
        "angry-with-fang": "face/Angry with Fang.svg",
        "awe": "face/Awe.svg",
        "blank": "face/Blank.svg",
        "cheeky": "face/Cheeky.svg",
        "concerned-fear": "face/Concerned Fear.svg",
        "contempt": "face/Contempt.svg",
        "cute": "face/Cute.svg",
        "cyclops": "face/Cyclops.svg",
        "driven": "face/Driven.svg",
        "eating-happy": "face/Eating Happy.svg",
        "explaining": "face/Explaining.svg",
        "eyes-closed": "face/Eyes Closed.svg",
        "fear": "face/Fear.svg",
        "hectic": "face/Hectic.svg",
        "loving-grin-1": "face/Loving Grin 1.svg",
        "loving-grin-2": "face/Loving Grin 2.svg",
        "monster": "face/Monster.svg",
        "old": "face/Old.svg",
        "rage": "face/Rage.svg",
        "serious": "face/Serious.svg",
        "smile-big": "face/Smile Big.svg",
        "smile-lol": "face/Smile LOL.svg",
        "smile-teeth-gap": "face/Smile Teeth Gap.svg",
        "suspicious": "face/Suspicious.svg",
    },
    "accessory": {
        "none": "accessories/* None.svg",
        "glasses": "accessories/Glasses.svg",
        "sunglasses": "accessories/Sunglasses.svg",
        "eyepatch": "accessories/Eyepatch.svg",
        "glasses-2": "accessories/Glasses 2.svg",
        "glasses-3": "accessories/Glasses 3.svg",
        "glasses-4": "accessories/Glasses 4.svg",
        "glasses-5": "accessories/Glasses 5.svg",
        "sunglasses-2": "accessories/Sunglasses 2.svg",
    },
    "facialHair": {
        "none": "facial-hair/* None.svg",
        "chin": "facial-hair/Chin.svg",
        "full": "facial-hair/Full.svg",
        "full-2": "facial-hair/Full 2.svg",
        "full-3": "facial-hair/Full 3.svg",
        "full-4": "facial-hair/Full 4.svg",
        "goatee-1": "facial-hair/Goatee 1.svg",
        "goatee-2": "facial-hair/Goatee 2.svg",
        "moustache-1": "facial-hair/Moustache 1.svg",
        "moustache-2": "facial-hair/Moustache 2.svg",
        "moustache-3": "facial-hair/Moustache 3.svg",
        "moustache-4": "facial-hair/Moustache 4.svg",
        "moustache-5": "facial-hair/Moustache 5.svg",
        "moustache-6": "facial-hair/Moustache 6.svg",
        "moustache-7": "facial-hair/Moustache 7.svg",
        "moustache-8": "facial-hair/Moustache 8.svg",
        "moustache-9": "facial-hair/Moustache 9.svg",
    },
}
PLACEMENTS = {
    "clothing": {"x": 147, "y": 639, "width": 818, "height": 733},
    "head": {"x": 372, "y": 180, "width": 473, "height": 567},
    "expression": {"x": 531, "y": 366, "width": 289, "height": 293},
    "facialHair": {"x": 494.999934, "y": 517.999659, "width": 280, "height": 230},
    "accessory": {"x": 419, "y": 421, "width": 392, "height": 138},
}
BUST = {"width": 1136, "height": 1533, "viewBox": "0 0 1136 1533"}
SAFE_TAGS = {"svg", "g", "path", "title", "desc"}
SAFE_ATTRIBUTES = {
    "d", "fill", "fill-rule", "height", "id", "stroke", "stroke-width",
    "version", "viewBox", "width", "transform",
}
BLACK_FILL = re.compile(rb'\bfill\s*=\s*(?P<quote>["\'])#000000(?P=quote)')
URL = re.compile(r"url\s*\(\s*['\"]?([^)'\"]+)['\"]?\s*\)", re.I)
README = """# Open Peeps local avatar assets

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
"""


def require(condition, message):
    if not condition:
        raise ValueError(message)


def local_name(name):
    return name.rsplit("}", 1)[-1]


def validate_svg(data, label):
    require(len(data) <= 2_000_000, f"SVG exceeds size limit: {label}")
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as error:
        raise ValueError(f"SVG must use UTF-8 encoding: {label}") from error
    require("\x00" not in text, f"SVG must use UTF-8 without NUL bytes: {label}")
    declaration = re.search(r"<\?xml\s+[^?]*?\bencoding\s*=\s*(['\"])([^'\"]+)\1", text, re.I)
    require(declaration is None or declaration.group(2).lower() in {"utf-8", "utf8"},
            f"SVG declares a non-UTF-8 encoding: {label}")
    require(not re.search(rb"<!\s*(?:DOCTYPE|ENTITY)\b", data, re.I),
            f"DTD/entity declarations are forbidden: {label}")
    require(not re.search(rb"<\?(?!xml\s)", data, re.I),
            f"XML processing instructions are forbidden: {label}")
    root = ET.fromstring(text)
    require(root.tag == "{http://www.w3.org/2000/svg}svg", f"Not an SVG: {label}")
    for element in root.iter():
        require(element.tag.startswith("{http://www.w3.org/2000/svg}")
                and local_name(element.tag) in SAFE_TAGS,
                f"Unsupported or active SVG element in {label}: {element.tag}")
        for attribute, value in element.attrib.items():
            name = local_name(attribute).lower()
            require(not name.startswith("on"), f"SVG event handler in {label}")
            require("javascript:" not in value.lower(), f"Script URL in {label}")
            if name == "href":
                require(value.startswith("#") and len(value) > 1,
                        f"External href dependency in {label}")
            require(attribute in SAFE_ATTRIBUTES,
                    f"Unsupported SVG attribute in {label}: {attribute}")
            if name in {"fill", "stroke"}:
                require(re.fullmatch(r"none|#[0-9a-fA-F]{6}", value) is not None,
                        f"Unsupported or dependent SVG paint in {label}: {value}")
            require("@import" not in value.lower(), f"CSS import in {label}")
            for match in URL.finditer(value):
                require(match.group(1).strip().startswith("#"),
                        f"External URL dependency in {label}")
    return root


def verify_encoding_guards():
    """Regression probes: alternate XML encodings must not hide PI or DTD bytes."""
    svg = '<svg xmlns="http://www.w3.org/2000/svg"/>'
    fixtures = {
        "stylesheet PI": '<?xml-stylesheet href="https://example.com/remote.css" type="text/css"?>',
        "DTD": '<!DOCTYPE svg [<!ENTITY external SYSTEM "https://example.com/remote.svg">]>',
    }
    for encoding in ("utf-16", "utf-16-le", "utf-16-be"):
        for name, prefix in fixtures.items():
            label = f"{encoding} {name} regression fixture"
            try:
                validate_svg((prefix + svg).encode(encoding), label)
            except ValueError:
                continue
            raise ValueError(f"Encoding safety regression: accepted {label}")


def assert_dimensions(root, width, height, label):
    expected = {"width": f"{width}px", "height": f"{height}px",
                "viewBox": f"0 0 {width} {height}"}
    require(all(root.get(key) == value for key, value in expected.items()),
            f"Unexpected original dimensions in {label}: {root.attrib}")
    return {key: root.get(key) for key in expected}


def assert_variant(original, variant, color, label):
    before, after = list(original.iter()), list(variant.iter())
    require(len(before) == len(after), f"Changed SVG structure in {label}")
    for old, new in zip(before, after):
        expected = dict(old.attrib)
        if expected.get("fill") == "#000000":
            expected["fill"] = color
        require(old.tag == new.tag and expected == new.attrib
                and old.text == new.text and old.tail == new.tail,
                f"Changed more than black ink fills in {label}")
    require([e.get("d") for e in before if local_name(e.tag) == "path"]
            == [e.get("d") for e in after if local_name(e.tag) == "path"],
            f"Changed path geometry in {label}")


def renderable_svg(data, label):
    """Expose the original vectors without the source SVG viewport clipping them."""
    original = validate_svg(data, label)
    require(not any(e.get("id") == "avatar-part" for e in original.iter()),
            f"Reserved render target already present in {label}")
    opening = re.search(rb"<svg\b[^>]*>", data)
    closing = data.rfind(b"</svg>")
    require(opening is not None and closing > opening.end(), f"Invalid SVG frame in {label}")
    content = data[opening.end():closing]
    metadata_pattern = re.compile(rb"<(title|desc)\b[^>]*>.*?</\1\s*>", re.S)
    metadata = b"".join(match.group(0) for match in metadata_pattern.finditer(content))
    vectors = metadata_pattern.sub(b"", content)
    result = (data[:opening.end()] + metadata + b'<g id="avatar-part">' + vectors
              + b'</g>' + data[closing:])
    rendered = validate_svg(result, label)
    require(original.attrib == rendered.attrib, f"Changed source viewport in {label}")
    wrapper = next((e for e in rendered if e.get("id") == "avatar-part"), None)
    original_vectors = [child for child in original if local_name(child.tag) not in {"title", "desc"}]
    require(wrapper is not None and len(wrapper) == len(original_vectors)
            and all(ET.tostring(old) == ET.tostring(new) for old, new in zip(original_vectors, wrapper)),
            f"Changed source vectors in {label}")
    return result


def read_entry(archive, name):
    full_name = PREFIX + name
    require(archive.namelist().count(full_name) == 1,
            f"Missing or duplicate archive entry: {full_name}")
    entry = archive.getinfo(full_name)
    require(not entry.is_dir() and entry.file_size <= 2_000_000,
            f"Invalid archive entry size: {full_name}")
    return archive.read(entry)


def generate(zip_path):
    output = {"README.md": README.encode("utf-8")}
    manifest = {
        "artist": "Pablo Stanley",
        "collection": "Open Peeps",
        "source": "https://www.openpeeps.com/",
        "license": {"name": "CC0 1.0 Universal",
                    "url": "https://creativecommons.org/publicdomain/zero/1.0/"},
        "archivePrefix": PREFIX,
        "composition": {**BUST, "source": PREFIX + "a person/bust.svg",
                        "placements": PLACEMENTS,
                        "layerOrder": ["clothing", "head", "expression", "facialHair", "accessory"]},
        "renderTarget": "avatar-part",
        "colors": COLORS,
        "colorScope": "Black head ink, including combined outline and hair/headwear paths",
        "accessoryNone": None,
        "assets": [],
    }
    with zipfile.ZipFile(zip_path) as archive:
        for category, folder in (("head", "head"), ("expression", "face"),
                                 ("clothing", "body"), ("accessory", "accessories"),
                                 ("facialHair", "facial-hair")):
            entries = {name for name in archive.namelist()
                       if name.startswith(PREFIX + folder + "/") and name.endswith(".svg")}
            require(entries == {PREFIX + source for source in SOURCES[category].values()},
                    f"{category} mappings must cover every {folder} SVG in the archive")
        bust = validate_svg(read_entry(archive, "a person/bust.svg"), "source bust")
        assert_dimensions(bust, BUST["width"], BUST["height"], "source bust")
        prefixes = {"clothing": "body/", "head": "head/", "expression": "face/", "facialHair": "facial-hair/",
                    "accessory": "accessories/"}
        for category, prefix in prefixes.items():
            groups = [e for e in bust.iter() if e.get("id", "").startswith(prefix)]
            placement = PLACEMENTS[category]
            transform = f"translate({placement['x']:.6f}, {placement['y']:.6f})"
            require(len(groups) == 1 and groups[0].get("transform") == transform,
                    f"Unexpected source bust placement for {category}")
        for category, sources in SOURCES.items():
            for asset_id, source in sources.items():
                data = read_entry(archive, source)
                original = validate_svg(data, source)
                place = PLACEMENTS[category]
                dimensions = assert_dimensions(original, place["width"], place["height"], source)
                asset = {"id": asset_id, "category": category, "source": PREFIX + source,
                         "sourceSha256": hashlib.sha256(data).hexdigest(),
                         "dimensions": dimensions, "placement": place}
                if category == "head":
                    raw_path = f"originals/head/{asset_id}.svg"
                    output[raw_path] = data
                    asset["original"] = raw_path
                    asset["variants"] = {}
                    for color_id, color in COLORS.items():
                        path = f"head/{asset_id}-{color_id}.svg"
                        variant = BLACK_FILL.sub(
                            lambda match: match.group(0).replace(b"#000000", color.encode("ascii")), data)
                        root = validate_svg(variant, path)
                        assert_dimensions(root, place["width"], place["height"], path)
                        assert_variant(original, root, color, path)
                        output[path] = renderable_svg(variant, path)
                        asset["variants"][color_id] = path
                else:
                    folder = "facial-hair" if category == "facialHair" else category
                    path = f"{folder}/{asset_id}.svg"
                    output[path] = renderable_svg(data, path)
                    asset["path"] = path
                manifest["assets"].append(asset)
    output["manifest.json"] = (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip_path", type=Path, help="Local Flat Assets.zip file")
    parser.add_argument("--check", action="store_true", help="Verify deterministic outputs without writing")
    args = parser.parse_args()
    try:
        if args.check:
            verify_encoding_guards()
        output = generate(args.zip_path)
        for name, data in output.items():
            destination = OUTPUT / name
            require(not any(p.is_symlink() for p in [destination, *destination.parents]),
                    f"Refusing symlink output path: {destination}")
            if args.check:
                require(destination.is_file() and destination.read_bytes() == data,
                        f"Missing or modified generated file: {destination}")
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(data)
        actual = {str(p.relative_to(OUTPUT)) for p in OUTPUT.rglob("*") if p.is_file()}
        require(actual == set(output), f"Unexpected output files: {sorted(actual - set(output))}")
        mode = "Verified" if args.check else "Imported and verified"
        svg_count = sum(name.endswith(".svg") for name in output)
        source_count = sum(len(sources) for sources in SOURCES.values())
        head_count = len(SOURCES["head"])
        print(f"{mode} {len(output)} files: {svg_count} SVGs, manifest.json, README.md.")
        print(f"{source_count} source assets; {head_count * len(COLORS)} head variants; "
              f"{head_count} raw head originals; {len(SOURCES['expression'])} faces.")
        print("All dimensions, source bust placements, SVG safety, and variant path geometry passed.")
        if args.check:
            print("All 6 UTF-16 processing-instruction/DTD regression probes were rejected.")
    except (OSError, ValueError, ET.ParseError, zipfile.BadZipFile) as error:
        print(f"Import failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
