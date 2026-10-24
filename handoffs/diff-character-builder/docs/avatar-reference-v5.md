# Reference avatar collection v5

The active editor is `/avatar-studio`. It uses `/api/exact/*` and the `atelier-r5` asset pack. Earlier packs, pictures, saved configurations and endpoints are retained. The product README is unchanged.

## Visual master

`references/avatar-exact-v5/body-reference.png` is the geometry authority. The close-up is a detail reference; it is not an exact enlarged crop of the full-body image. The full-body screenshot is recovered once onto a 128×128 grid, then separated into body, head, hair, eyes, brows, nose, mouth, ears, top, trousers and shoes. The default composite is byte-identical to `assets/avatar/atelier-r5/rig/reference_master.png`.

This equality applies to the recovered 128×128 master, not to the larger screenshot. The screenshot's subpixel sampling and colors cannot be represented literally at another resolution. Offline sampling choices, including the mouth and sole sampling rows, are recorded in `artifacts/avatar-exact-v5/recovery/grid.json`.

The frozen rig is `front_reference_v1`: eye rows 20–22, brow row 18, nose rows 23–27, mouth rows 29–31, chin row 33, neck rows 34–37, shoulder row 40, waist row 73, ankle row 113 and sole baseline 122. Runtime composition draws full-canvas layers at 0,0. There are no item offsets, rotations, resizing or CSS color filters.

## Image sources and normalization

Built-in Imagegen produced the hidden body/head support, reference-specific green hoodie, white sneakers and eye-color source artwork. The actual supplied reference pixels remain the default face, hair, visible skin and navy outfit. Source edits are stored under `references/avatar-exact-v5` and `references/avatar-refinement-v4`; prompts are recorded in their JSON prompt files. All production dependencies live in the project.

The 50 cosmetics from the previous collection are compiled against the new master. Garment outlines use the fixed rig silhouette; their interior and outline colors are sampled from Imagegen artwork. Alternate heads share a warm reference-sampled neck attachment. Neutral shoe pixels at the ankle belong to the shoe layer, so black reference footwear cannot leak around white sneakers.

Eyes, brows, nose and mouth remain independent full-canvas PNGs. Six eye palettes change one iris pixel per eye while preserving the reference's small eye shape, pupil and white corners. Their effect is intentionally subtle at 128 pixels. Twelve skin palettes use identical alpha geometry. The reference skin (`skin_02`) preserves source RGB; other skin variants use explicit curated palettes.

## Configuration and UI

`src/exact/model.ts` validates version 5, pack `atelier-r5`, rig `front_reference_v1`, twelve skin IDs, six eye colors and slot-compatible cosmetic IDs. Earlier saved avatars are not silently migrated to a different appearance. The new editor saves to `diff-avatar-exact-r5`.

Face → Eye color selects the iris color. Face options, clothes and accessories retain their existing visual selectors. Undo, redo, reset, scoped randomization, local save and transparent PNG export use the same configuration. Inspect layers temporarily toggles contributions without changing the saved equipment; its PNG links resolve the chosen skin and eye variant.

The compositor caches up to 512 complete PNGs, keyed by validated configuration, asset manifest and inspected layer visibility. Feed integrations can request a single composite rather than separate network images. The only production/export resolution is 128×128; larger editor display sizes are integer pixel zooms.

## Rebuild and validation

```sh
npm run exact:assets
npm run exact:previews
npm run exact:validate
npm run check
npm run preview
```

`exact:assets` is an explicit artwork rebuild. Do not run the legacy `assets` command to update this collection. Restart the local server after rebuilding assets so its in-memory image cache reloads.

The validator checks every referenced layer and variant, RGBA8 dimensions, binary alpha, legal slot masks, filename format, PNG metadata, source hashes, compiled pixel hashes, missing/orphaned layers, palette completeness and reference recomposition. The random validator renders 5,000 seeded combinations and writes a 200-avatar sheet with recorded coverage. Adjacent seeds are mixed before sampling to avoid palette-biased contact sheets.

Tests additionally cover source partition equality, disjoint face layers, unchanged eye geometry across colors, warm head/neck joins, shoe ownership, a deliberately invalid stray pixel, strict schemas, deterministic hashing and HTTP/export contracts. A passing random render test establishes file/geometry integrity; visual quality is assessed separately against the reference.

## Adding artwork

Use the full-body reference and frozen slot masks as registration guides. Generate or edit the desired module with Imagegen, preserve the source picture and prompt, isolate only that module and normalize it during the asset build. For a closed garment, sample its outline as well as its interior onto the rig; do not stretch an interior color out to the silhouette edge. Keep open jacket centers transparent. Hair back and front remain separate; hats use declared crown masks.

Add metadata and body/eye/skin variants to the manifest builder, then run the validator and generate face/neck/shoe previews. Any visual master change requires an explicit reference review and corresponding version decision. Never change compositor positioning to accommodate an asset.

## Review limits

The reviewer accepted the reference default's proportions and found no remaining assembly blocker in the inspected head, neckline and shoe sheets or the final 200-avatar sample. This does not certify every possible outfit or mean each non-reference garment is identical to the navy reference outfit. Source images and unshipped r4 drafts remain available for inspection.
