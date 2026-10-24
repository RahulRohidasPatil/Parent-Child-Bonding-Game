# Twenty Imagegen hairstyles — September 8, 2026

The collection now contains 27 hairstyles and 94 cosmetics. Twenty new source images were created with the built-in `image_gen` tool using the approved character and blank head registration reference. Existing source pictures and README were preserved.

## New styles

- Short: Buzz cut, Crew cut, French crop, Classic side part, Soft quiff, Pompadour, Spiky short, Short waves, Rounded afro, Close coils, Tapered curls.
- Medium: Straight curtains, Layered shag, Wolf cut, Soft mullet, Medium twists.
- Long: Shoulder-length straight, Long locs.
- Tied: High ponytail, Messy bun.

Original generated images are in `references/avatar-hair-expansion/`. `prompts.json` records exact prompts, reference paths, filenames and offline registration dimensions. Production layers are in `assets/avatar/atelier-r6/layers/`; the manifest connects stable IDs to sources, layers, masks and hashes.

## Registration and fit

`src/collection/hairAuthoring.ts` removes source mattes and peach mannequin remnants, identifies the face opening and registers it to the existing center line. This avoids centering an asymmetric ponytail by its bounding box. Offline normalization compiles full transparent 128×128 layers; runtime composition stays at 0,0.

New front layers share a protected face opening, enforced by a manifest-referenced clearance mask. Medium, long and tied styles have separate back/front components. Back hair includes volume behind the head rather than repeating a cutout that leaves gaps beside the jaw. Existing long back layers receive the same correction in separately named registered files; originals remain available.

The permitted hair region was widened to `[38, 0, 54, 70]` for the side ponytail. The character center, face, body, eye line and feet did not move. The default PNG remains byte-identical. All 85 pre-existing non-hair cosmetic layer hashes match the before-manifest record.

All 27 styles use the twelve-color system documented in `avatar-hair-colors.md`. Colors reuse geometry and masks; front/back tonal ranges are calibrated together.

## Checks performed

`npm run check` passed: **73 tests**, plus collection validation of **22,938 renders**, including **5,000 seeded random combinations**, with zero failures. The collection contains 319 registered layers. Default preservation passed.

Additional hair tests cover 324 style/color pairs and 486 hairstyle/head/hat combinations. Visual inspection covered the overview, all six head matrices, both hat matrices and all three color sheets. These checks cover the defined rig and masks; every possible cosmetic combination did not receive individual human review.

Browser checks switched all 27 hairstyles and twelve colors, exercised search and the Tied filter, no-hair recovery, the colored-layer inspector and PNG download. Desktop and 320-pixel mobile layouts were inspected; the mobile document had no horizontal overflow. The user's Fluffy middle part / Copper draft and outfit were restored after testing.

Evidence: `artifacts/avatar-hair-expansion/check.log`, `final-review/`, and `qa/`. The full-page mobile browser capture had a stitching artifact, so layout assessment used the viewport screenshot and DOM geometry instead.

## Rebuild

1. `npm run collection:assets` — compile into staging, validate and publish; sources must exist.
2. `npm run check` — compile and run automated validation.
3. `npm run collection:previews` — regenerate collection previews.
4. `npm run hair:previews` — regenerate hair compatibility/color sheets.

Imagegen is an authoring step. Ordinary builds do not call generation or require API credentials.
