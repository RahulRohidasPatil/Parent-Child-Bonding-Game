# DIFF Avatar Atelier

The active editor is `/avatar-studio`. The collection uses original Imagegen artwork as transparent image layers. It does not draw replacement character geometry in canvas, SVG or CSS. Every production layer and composite is 128 × 128 RGBA. CSS enlarges the same bitmap at integer multiples for inspection.

## Current collection

43 selectable modules: 8 tops, 3 jackets, 4 bottoms, 2 sneakers, 7 hairstyles, 4 eye styles, 3 brows, 3 mouths, 2 ear shapes, 1 subtle nose, 2 hats, 2 glasses and 2 earrings. Twelve curated skin palettes share the same silhouette. Four starter looks are included. This is the expanded, reviewed editor collection; it is not the original proposed 300-item catalogue.

All clothing, hair, eyes, brows, mouths, alternative ears, glasses and headwear come from separately generated Imagegen images. Classic ears are isolated from the Imagegen master body. The two-pixel nose comes directly from the supplied quality-reference picture after two Imagegen nose extraction attempts were rejected. Each layer records its source image and checksum.

## Source and build files

- `references/avatar-atelier`: immutable source artwork, raw generations, quality reference and exact generation prompts.
- `src/atelier/collection.ts`: compile-time placement of isolated source artwork on the common rig. These positions never enter the runtime compositor or avatar configuration.
- `src/atelier/pixels.ts`: nearest-neighbor source sampling, retaining source RGB pixels and normalizing alpha to 0 or 255.
- `scripts/avatar/buildAtelier.ts`: compiler, curated skin palette lookup, ear isolation, standard long-hair head occlusion and mask export.
- `assets/avatar/atelier-r2/manifest.json`: semantic IDs, slots, source links, checksums, skin variants and occlusion metadata.
- `assets/avatar/atelier-r2/rig/coordinates.json`: final coordinates, including the explicitly requested face revision.
- `src/atelier/render.ts`: fixed layer order, 0,0 composition, declared bitmap masks and a bounded composite cache.

The user-requested face revision reduces the eye-pair box from 14 × 3 at (57,20) to 10 × 2 at (59,19). Brows sit at y=17, the subtle nose at y=22, and mouths at y=24. Hair, body, clothing, shoes, headwear, glasses and earrings were frozen before this face-only revision; `accepted-nonface-hashes.json` verifies their 45 image files remain byte-for-byte unchanged.

## Run locally

```sh
npm install
npm run build
npm run preview
```

Open `http://localhost:4312/avatar-studio`. The server binds to 127.0.0.1. It serves compiled browser modules from `dist`; run the TypeScript build after code changes. Restart the server after rebuilding artwork so its sprite cache reloads.

```sh
npm run atelier:assets
npm run atelier:previews
npm run check
```

`atelier:assets` builds the new pack only. Existing pictures and legacy packs are retained. `check` compiles TypeScript, runs the legacy and current tests, validates the pack, and renders 5,000 seeded combinations. It does not regenerate source pictures.

## Configuration and rendering

Avatar data uses version 2, pack `atelier-r2`, rig `front_idle_atelier_v1`, a skin ID and nullable equipment IDs. Unknown IDs, wrong-slot selections and unsupported rigs are rejected. Ear color variants are selected from the skin palette. A missing `nose` property in a previously saved configuration becomes `null`, preserving the previous choice to have no nose.

The cache key includes canonical schema-parsed configuration, the artwork manifest digest and the sorted inspector visibility set. An intentional asset update therefore changes render hashes. Renderers never use per-item translation, scale, rotation, CSS recoloring or floating-point placement. Source normalization happens only when compiling a PNG.

Long hair retains back and front components. The standard head mask places face-overlapping hair below the brow behind the head while long tresses continue in front of clothes. Headwear references the same crown mask; jackets reference the same sleeve mask. The compositor interprets manifest metadata rather than cosmetic-specific branches.

## Editor behavior

The editor offers manifest-backed visual cards, separate face controls, randomize all/hair/outfit, undo/redo, reset, save, transparent PNG download, background swatches, a pixel grid, layer visibility and source-artwork links. Saves are local to the browser; the previous `studio-r1` save and its pictures are preserved. Export always includes the equipped layers, even when the inspector temporarily hides layers.

The original artwork dialog includes current image sources and the previous reference collection. The `/api/studio/*` legacy renderer endpoints remain available. `/api/atelier/catalog`, `/render` and `/validate` serve the current collection. Only size 128 is supported by the production render endpoint. `/dev/avatar-lab` is a local alias and returns 404 with `NODE_ENV=production`.

## Adding an asset

1. Generate an isolated module using the master and quality reference. Do not generate a new dressed person as a substitute for a clothing layer.
2. Preserve the raw result. Confirm true PNG alpha; a drawn checkerboard is not transparency.
3. Add a semantic catalogue item and its source normalization box in `collection.ts`. Add no renderer branch.
4. Compile and inspect the resulting 128-pixel layer over the fixed body. Confirm face, hand, waist and foot transitions.
5. Run validation and compatibility previews. The build rejects one pixel outside its declared region.
6. Inspect actual combinations in the browser on light and dark backgrounds before accepting the new artwork.

Previews include each collection, all tops × jackets, all hairs × hats, all skin tones, four starter looks and 200 seeded avatars. Each sheet has an accompanying JSON cell index. These sheets are QA documents containing 128-pixel composites, not additional production avatar resolutions.
