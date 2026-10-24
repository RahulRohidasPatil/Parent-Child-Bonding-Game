# Wardrobe expansion and wearable colors

This expansion adds **50 Imagegen-authored pieces**: 26 shoes, 10 jackets, 8 bottoms and 6 tops. The collection now has 144 cosmetics, including 91 clothing/footwear items and 6 wearable accessories. All 97 wearables support 18 color choices. The existing face, skin and hair options remain available.

## Source artwork

The built-in `image_gen` tool generated one source per item against `references/avatar-exact-v5/body-reference.png`. Original PNGs and exact prompts are retained in `references/avatar-wardrobe-expansion/` and `prompts.json`. `scripts/avatar/defineWardrobeExpansion.ts` records the source briefs. No generation credentials are required to rebuild from saved artwork.

New footwear includes retro basketball high/mid/low tops, skate and canvas shoes, terrace sneakers, mesh/knit/trail runners, platform and tennis shoes, six boot styles, penny and tassel loafers, derbies, Mary Janes, clogs and house mules. These are original generic style names, not licensed branded products.

Bottoms include baggy, wide, carpenter and barrel jeans, parachute cargos, wide pleated trousers, stacked sweats and piped warmup pants. Jackets include two puffers, quilted liner, flight bomber, varsity, denim trucker, biker, rain parka, sherpa fleece and track jacket. Tops include a boxy tee, rugby shirt, knit polo, waffle henley, half zip and cardigan.

## Locked geometry

`src/collection/wearAuthoring.ts` normalizes generated artwork offline. Neutral source mattes are removed by connected flood fill, preserving enclosed trim. The output is full-canvas 128×128 RGBA with binary alpha.

Tops and jackets use existing shared shoulder/hem registration. Collar pixels behind the neck are separate rear components. Open jackets use a shared central opening so the equipped top is visible. Baggy trousers use wider offline silhouettes while retaining waist and ankle heights. Shoes are registered as two components inside one layer, with each sole reaching row 122, the current approved rig baseline. Boot shafts extend upwards; the character does not become taller.

The legal shoe mask now permits `[46, 104, 38, 20]` to accommodate boots. Existing skeleton landmarks are unchanged. No per-item runtime translation, rotation or scale was added; composition still draws each layer at 0,0.

All 319 previous production layer files retain their hashes. Original source images and README were preserved. The default composite remains byte-identical to the frozen reference.

## Colors

`wearColors` stores an independent color for top, jacket, bottom, shoes, hat, glasses and earrings. The strict schema defaults old drafts to Original for all seven slots and rejects unknown colors/fields.

Choices: Original, Black, Charcoal, White, Cream, Tan, Brown, Navy, Blue, Sky, Forest, Olive, Burgundy, Red, Lilac, DIFF green, Silver and Gold.

`wearToneMask` identifies the dominant material and calibrates its tonal range across all components of an item. Contrasting hardware, trim and outsole pixels are protected where identified by the material mask. Entirely protected components need no recolor metadata. The renderer applies curated tonal palettes without changing alpha or positions. Original uses the unchanged source raster. The additional detail-color channel is documented in `avatar-secondary-colors.md`.

Dark source values are included in calibration, preventing very dark jackets from turning into flat fills. A regression test checks that a light recolor retains the navy track jacket's fold detail. Hashes include palette revisions and active colors; unused slot colors do not change the composite hash.

## Editor

The current clothing/accessory section displays its equipped item and color swatches. Color preferences persist when switching items within a slot. Shoe, trouser and torso cards use consistent category crop previews so details are easier to compare; the actual exported avatar remains 128×128.

Undo/redo, draft recovery, local save validation, layer inspection and PNG export include wearable colors. Color/outfit randomization produces supported choices. Inspector links serve the selected material color rather than the uncolored source.

## Verification

Evidence is saved in `artifacts/avatar-wardrobe-expansion/`:

- `build.log`: staged validation and publication of the complete pack.
- `tests.log`: the 79-test suite passed; `wear-tests.log` includes the subsequently added dark-fold regression, all seven wearable tests passing (80 unique tests across the suite).
- `validation.log`: exhaustive clothing Cartesian combinations, facial/headgear/skin checks and 5,000 deterministic random avatars; 307,420 successful renders in total (294,500 clothing combinations), zero failures.
- `review/`: all items, all 1,746 wearable colorways, every new jacket against all tops, and every new trouser against all shoes, with JSON cell labels.
- `qa/`: browser screenshots, interaction results and preservation hashes.

Browser QA selected all 91 clothing/shoe items, clicked 180 color controls across clothing and every accessory, checked undo/redo, draft recovery, layer links and native PNG download. Desktop and mobile layouts were inspected. Visual sheets sample appearance and overlap; automated render success alone does not establish subjective visual perfection for every combination.

Rebuild with `npm run collection:assets`; check with `npm run build`, `npm test` and `npm run collection:validate`. Generate preview sheets with `npm run collection:previews` and `npm run wear:previews`.
