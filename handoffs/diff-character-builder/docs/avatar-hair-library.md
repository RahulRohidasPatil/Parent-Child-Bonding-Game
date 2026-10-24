# DIFF hair library

The library adds 65 Imagegen-authored hairstyles to the existing 35, for 100 selectable styles. Every hairstyle supports the existing twelve hair palettes. Source images and prior drafts are preserved in `references/avatar-hair-library`; the exact prompt set and input references are recorded in `prompts.json` and per-image provenance records.

Generation uses the **built-in Imagegen tool**, one call per hairstyle and additional targeted calls for corrections. No API/CLI fallback, stock replacement sprites or programmatically drawn hairstyle substitutes are used.

## Asset contract

Production layers use the existing `atelier-r6` pack and `front_reference_v1` rig. Each is a full transparent 128×128 RGBA PNG with alpha 0 or 255. The renderer always draws at 0,0 with no item-specific translation, rotation or scale. Sources are registered during export using integer guides. Medium, long and tied styles have separate rear and front layers. The shared front-face opening protects eyes, eyebrows, nose and mouth; the center neck remains visible.

Some generated source drafts contain a neutral matte/checkerboard rather than usable alpha. The established source-isolation step extracts the brown hair and retains the original source file. Production PNGs are normalized, validated and never accepted directly from freeform generation.

The longest style was reduced by one output row to remain within the locked hair slot. The rig and compositor were not changed to accept out-of-bounds pixels. Several compact fade sources received second drafts, and two crown shapes received source corrections after checking broader head shapes.

## Browse and match

The Hair editor supports search, length group, texture and fringe/part filters. Metadata stays in the manifest, with legacy inference for older hair entries. These groups are gender-neutral. Hair colors are palette mappings on the same geometry, including matching front/back tones.

New hairstyles also provide initial shape descriptors for selfie suggestions. These descriptors have lower priority than calibrated core profiles; they are approximate art descriptors, not a trained hairstyle classifier. Users can always choose a style directly.

## Rebuild and review

```sh
# Inspect available source modules without publishing a partial library.
npx tsx scripts/avatar/buildHairLibrary.ts --available

# After reviewing the complete staged library:
npx tsx scripts/avatar/buildHairLibrary.ts --publish

# Normal complete collection rebuild also includes this library.
npm run collection:assets

npm run build
npm test
```

`appendHairLibrary` is shared by the additive library build and full collection build. Rebuilding replaces only this library's staged compiled entries; the previous published pack is archived before installation. Original source pictures are not deleted or rewritten.

The additive builder validates every layer, renders all new styles on all six head shapes, and creates five-style pages for visual review. Publication additionally renders 5,000 deterministic random configurations. `tests/avatar/hairLibrary.test.ts` checks source and manifest completeness, distinct compiled assets, strict RGBA geometry, face and neck integrity, twelve distinct colorways and exact preservation of existing pack images.

Contact-sheet labels are stored alongside the images as JSON. The new images should be reviewed at their actual 128×128 output size as well as enlarged with nearest-neighbor display. No test result is a claim that every hairstyle is universally flattering or a pixel-perfect likeness of a real person's hair.

## Delivered QA evidence

The published pack contains 250 cosmetics, including 100 hairstyles and 698 compiled layer files. All 593 previously compiled image files and the approved default were preserved byte-for-byte. The validation record is `artifacts/avatar-hair-library/qa-summary.json`.

All 127 automated tests passed. The published library includes 600 hairstyle/head previews and 1,200 color previews under `assets/avatar/atelier-r6/previews/hair-library`. The new styles passed 390 direct head-fit checks, and 5,000 deterministic random combinations were rendered before publication. Browser checks covered combined filters, search, representative new hairstyles, color changes and exact undo restoration.
