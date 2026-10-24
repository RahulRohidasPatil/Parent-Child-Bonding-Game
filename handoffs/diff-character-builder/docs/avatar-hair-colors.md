# Hair colors

All **27 hairstyles** support twelve choices under **Hair → Color**: Original, Black, Espresso, Dark brown, Chestnut, Light brown, Honey blonde, Blonde, Platinum, Copper, Auburn and Silver. Original preserves each style's source color.

## One geometry, twelve palettes

Colors do not require new Imagegen artwork or color-specific production PNGs. Each hair layer has a full-canvas tone mask and references the shared palettes in `assets/avatar/atelier-r6/palettes/hair.json`. Mask alpha selects hair material; a zero shade value protects dark outlines. Remaining values sample five curated tonal anchors, retaining shading and source texture.

The approved Textured side part keeps its original reference-partition mask. Other styles use a calibrated tonal range shared across front and back layers. Dark interior strands remain recolorable, allowing black source hair to become blonde. Non-hair pixels and alpha are unchanged.

`src/collection/recolor.ts` recolors a copy before composition and caches it. It does not mutate source pixels, translate layers or apply CSS filters. The approved default avatar remains byte-identical to its frozen reference.

## Configuration and inspection

`hairColor` is a strict twelve-value enum; older configurations default to `hair.original`. Undo, redo, session drafts, local saves, randomization and PNG export retain the choice. With no hairstyle equipped, the Color panel offers **Choose hairstyle**.

The inspector's `/api/collection/layer` links show the selected color. Exports use immutable snapshots of the displayed 128×128 composite. Hair cards display the active color and support name/color search and collection filters.

## Verification and previews

Tests cover all 27×12 style/color pairs, distinct deterministic outputs, alpha and mask integrity, six heads with all hairstyles and hat states, palette/cache behavior and the colored-layer endpoint. Browser QA switched all 27 styles and twelve colors, checked filtering, no-hair recovery and native PNG download.

Run `npm run hair:previews` for the 27-style overview, six head matrices, two hat matrices and three sheets containing 324 color combinations. Output is in `assets/avatar/atelier-r6/previews/hair-expansion`; JSON sidecars identify each cell. These are QA previews, not separate cosmetics.

See `avatar-hair-expansion.md` for Imagegen sources and normalization details.
