# Face, hairline and personal-detail expansion

This pack adds **38 Imagegen-derived modules** while preserving all 391 existing production layers byte for byte. The collection now contains 185 cosmetics and 593 compiled PNG layers. The approved default face, body, clothing and appearance remain unchanged.

## New selection

- Eight hairstyles/hairlines: Receding crop, Receding waves, Balding crown, Flat top, Short twists, Cornrows, Twin afro puffs and Side-swept bob. There are now 35 hairstyles, with the existing twelve hair palettes.
- Six eye shapes: Almond, Hooded, Monolid, Soft round, Upturned and Mature; every one supports all six iris colors.
- Four brow shapes: Fine, Full, Arched and Bushy. New brows follow the hair palette.
- Four noses: Button, Broad, Straight and Curved.
- Four mouths: Wide small smile, Thin relaxed mouth, Full relaxed lips and Mature smile.
- Six facial-hair styles: Light stubble, Simple mustache, Goatee, Short beard, Full beard and Boxed beard. They follow the twelve hair colors.
- Six independently selectable personal details: Soft freckles, Cheek birthmark, Small cheek scar, Soft age lines, Left hearing aid and Right hearing aid.

Personal details are independent optional slots, so they can be combined. They are opt-in in the editor and retained during randomization. They do not imply changes to reputation, abilities or body geometry.

## Imagegen provenance

All sources are saved in `references/avatar-identity-expansion/`. `prompts.json` records the exact final prompt and source path for every item, normalization dimensions and the nose source frame. Retry prompts are retained alongside it. Generation used the built-in `image_gen` tool, not the API/CLI fallback.

The straight nose is extracted from a generated clothed portrait edit, after two isolated-nose generations were rejected by the image service. Birthmark and scar sources were regenerated as small standalone pixel symbols. The production system consumes only the isolated requested feature. It never uses a generated full character as a cosmetic.

## Alignment and layers

All production sprites are full transparent 128×128 PNGs with binary alpha. The source art is normalized offline. No runtime translation, scale or rotation was added.

Eye anchors are x57/x67 at y20; brows use x56/x67 at y18. Noses are centered at x64 and end at y27. Mouths start at y29. Facial-hair masks preserve the nose and mouth openings. Personal marks sit below the eyes; hearing aids occupy compact fixed ear regions and render beneath front hair.

The new hairlines use the same authoring pipeline, face-clearance mask and front/back architecture as existing hair. Nose, mouth and skin-detail tones use explicit curated skin palettes. Primary features remain separate, independently removable images.

## Editor

The Face tab now includes **Facial hair** and **Details**. Clicking a selected detail again removes only that detail. Detail thumbnails isolate the individual option while the main preview shows the combined appearance. Hair/face selections, personal slots, undo/redo, local save validation, session drafts, inspector links and PNG export use the same AvatarConfig pipeline. Older configs migrate with new optional slots set to null. Hats remain removed from the editor.

## Verification

- The 98-test suite passed in `artifacts/avatar-identity-expansion/tests.log`.
- Six focused identity tests passed after the final hearing-aid sizing adjustment, including the subsequently added six-iris-color test (99 unique tests in the current suite).
- 2,736 new-module/head/skin combinations: 38 modules × six heads × twelve skins.
- 5,000 deterministic random identity combinations without missing-resource fallbacks.
- All beard palettes and all new iris variants checked for distinct outputs.
- Default snapshot and all 391 previous production PNGs preserved.
- Visual review of each feature category, all six head matrices and the skin-tone sheet.
- Browser checks covered the 36 face/brow/nose/mouth/beard choices, eight new hairstyles, stacking all six personal details, independent removal, undo, draft reload and native PNG download. Mobile layout at 375px had no horizontal overflow.

The checks establish alignment and operation within the current rig. They are not a claim that every possible full-avatar combination was individually visually reviewed, or that the collection represents every human feature.

Preview sheets and JSON cell labels are in `assets/avatar/atelier-r6/previews/identity/`. Rebuild with `npm run collection:assets`; regenerate those sheets with `npx tsx scripts/avatar/previewIdentity.ts`. Run `npm test` for the full test suite.
