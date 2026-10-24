# Avatar collection v6

The current `/avatar-studio` uses `atelier-r6` through `/api/collection/*`. The rig remains `front_reference_v1`, and the complete approved default is pixel-identical to the previous reference master. Earlier pictures, packs and saved configurations remain available. The README is unchanged.

## Artwork changes

Five alternate heads were regenerated with built-in Imagegen against the approved mannequin/reference. Friendly and focused expressions were regenerated and separated into eyes, brows, nose and mouth. All skin palettes and six eye colors remain supported. The default face's visible pixels remain unchanged.

Some old eye-line marks were baked into the reference head. They now belong to the eyebrow, eye and hair-shadow layers; removing features reveals a clean underlying eye band. A stray dark wrist projection, hidden by the default long sleeve but exposed by tees, was removed from the shared body support.

The collection adds **24 wearables**, increasing clothing and footwear from 17 to **41**:

- Tops: oat fleece quarter-zip, graphite tech quarter-zip, burgundy hoodie, gray crewneck, striped long sleeve, cream cable knit, tobacco work shirt, olive knit polo, terminal tee and washed sky tee.
- Jackets: studio bomber, washed denim jacket, cream fleece, rust chore jacket, navy piped track jacket and DIFF track jacket.
- Bottoms: cream chinos, slate pleated trousers, washed jeans, olive cargos, DIFF track pants and burgundy sweatpants.
- Shoes: brown work boots and cream retro runners.

Together with face, hair and accessories, the manifest contains **74 unique cosmetic IDs** and **290 compiled layer PNGs**. The new Studio bomber has its own ID, separate from the retained Black bomber.

## Sources and build

Source images are preserved in `references/avatar-revision-v6`. Three prompt sets record the built-in Imagegen calls: `prompts-heads.json`, `prompts-expressions.json` and `prompts-clothes.json`. No image-generation CLI fallback was used.

New garment geometry is sampled from the isolated source silhouette, then normalized to shared neck, wrist, waist and ankle anchors. It is no longer forced into the navy sweater's alpha template. Open jacket centers and enclosed neck openings have real transparency. Back collars use a separate layer behind the body. Every production image remains full-canvas RGBA8 128×128, with binary alpha and rendering at 0,0.

The garment-fit correction uses a shared 40×41 source registration frame at (44,33), retaining the hem at row 73. Shoulder panels must cover `masks/required_shoulders_v6.png`; only the central rear collar may sit behind the body. The validator checks coverage in front of the body, so dimension-valid garments that expose unintended shoulder skin fail the build. See `artifacts/avatar-fit-fix/REPORT.md` for the before/after comparison and regression evidence.

Hems also satisfy `required_waist_full_v6.png` or `required_waist_sides_v6.png`, preserving open jacket centers and hands. This prevents bare skin strips immediately above the trousers.

`src/collection/authoring.ts` performs offline source extraction and normalization; `scripts/avatar/buildCollection.ts` writes the pack. Referenced old layers are copied without modification; obsolete intermediate copies are moved to `artifacts/avatar-revision-v6/retired-compiled-layers`, not deleted from earlier packs.

```sh
npm run collection:assets
npm run collection:previews
npm run collection:validate
npm run check
npm run preview
```

Restart the preview server after rebuilding images to reload its in-memory cache. Do not run the legacy `assets` command to rebuild this collection.

Builds now use isolated staging directories under `artifacts/avatar-builds`. A candidate must pass the full pack validator before publication. The previous published folder is retained in `artifacts/avatar-builds/archive`; a failed validation leaves the active pack untouched. Missing source images are build errors, not silently skipped jobs.

## Editor fixes

- Search and collection filters apply to the current wardrobe category. Irrelevant collections are excluded, category changes clear stale filters, and empty searches have a clear empty state.
- Face cards include the chin and neck. Hair cards show the longer hairstyles down to their ends. These are global display crops, not per-item renderer offsets.
- A top's card can be inspected without an equipped jacket hiding it. The editor offers a direct remove-jacket action when the actual preview is covered.
- The inspector lists every PNG component, including hair front/back and garment back collars, with its corresponding source link.
- PNG export includes inspector visibility, so its contents match the visible preview. Saving retains equipment; hidden inspection slots are not persisted as unequipped items. The inspector explains this distinction.
- Visual comparisons use canonical configuration serialization. Selection repainting preserves scroll position, and card images load lazily.
- Color-only randomization changes skin and eye color while preserving equipment.

The new save key is `diff-avatar-collection-r6`; earlier save keys remain untouched. There is no silent appearance migration of old packs.

The tab-session draft is stored separately as `diff-avatar-collection-r6-draft`, so unsaved edits can survive reload without being mistaken for an explicit save. Render/save controls use generation-aware state and request deadlines. Failed cosmetic groups fall back only within their slot and can be retried. PNG export uses `/api/collection/snapshot/<hash>.png`, containing the exact displayed pixels; snapshots are bounded and tied to the current server session. See `artifacts/avatar-hardening/REPORT.md` for failure-injection and browser evidence.

## Validation and review

The final validator checked **21,858** renders: 10,450 top/jacket/bottom/shoe sets, 4,608 face-part combinations, 432 headgear combinations, 1,368 head/skin/top combinations and 5,000 seeded random configurations. Missing-item states are included. These are exhaustive within the stated groups, not the entire Cartesian product of all avatar attributes.

All 53 tests passed. Additional tests cover duplicate IDs, new garment silhouette diversity, transparent jacket centers, removal of residual eye marks and wrist artifacts, approved-default equality, strict schemas, independent hidden slots, source preservation and HTTP/export agreement.

Exactly one independent visual reviewer checked 216 head/skin/expression examples and 190 top/jacket examples, plus the clothing, shoe and preset sheets. No remaining concrete assembly blocker was found in those final sheets. Passing tests does not replace visual review of future assets.

Evidence: `artifacts/avatar-revision-v6/qa/check.log`, `validation.json`, browser captures and `final-review` PNG/JSON sheets. The local editor is the integration target; no remote DIFF account service was deployed.
