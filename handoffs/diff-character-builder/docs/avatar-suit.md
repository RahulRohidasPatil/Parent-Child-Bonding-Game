# Modular suit

Three new source images were generated using the built-in `image_gen` tool against the approved character reference. The sources and exact prompts are saved under `references/avatar-suit/` (`suit_charcoal.png`, `dress_white.png`, `tie_classic.png`, `prompts.json`).

- `top.dress_white`: white dress shirt, fixed color, separate collar component.
- `jacket.suit_charcoal`: open charcoal suit jacket, fixed color.
- `tie.classic`: removable independent accessory, burgundy by default, eighteen palette choices.

The collection schema adds a nullable `equipment.tie` and a defaulted tie entry in both wearable palette records. Older configurations migrate to no tie. `compatibleTops` records which shirts accept a tie. The editor pairs a selected tie with its required shirt and removes it when changing to an incompatible top. Random selection respects that contract. Existing fixed or colored garments and historical rigs remain intact.

Production files are full transparent 128×128 PNGs. Registration happens only during compilation. Shirt fabric renders at z40, the tie at z41, and collar tips and jacket at z42; stable slot order draws collar before the jacket. The collar's center stays open for the knot. Inner sleeve coverage is normalized against the approved body/top masks by copying neighboring source pixels. No runtime positioning or scaling was added.

The fixed-color shirt and jacket deliberately have no primary or detail masks. Their colors do not change when a saved slot color preference exists. The tie's entire material palette, including its border tones, is mapped together to avoid a burgundy border on light-colored ties.

Find the preset under **Looks → Suited up**, or select the shirt and jacket in Clothes and the tie under **Extras → Ties**. The preset uses existing pleated trousers and black-colored derbies. No new suit pants or shoes were generated.

Evidence is under `artifacts/avatar-suit/`: the 89-test suite, focused suit tests, and skin/head/tie-color compatibility results. Preview images are in `assets/avatar/atelier-r6/previews/suit/`; regenerate with `npx tsx scripts/avatar/previewSuit.ts`. Run `npx tsx scripts/avatar/validateSuit.ts` for 2,592 combinations across 12 skin tones, six heads, 18 tie colors and two jacket states.

The subsequent sleeve-fit correction registers each sleeve progressively inward from row 46 to the cuffs, capped by the canonical arm coverage. `src/collection/suitSleeves.ts` performs this only during the asset build. Shoulders, lapels, torso, hands and the renderer remain unchanged. The wrist-row silhouette is at most 31 pixels wide and cuffs directly touch the fixed hand anchors (54,71) and (73,71). Evidence: `artifacts/avatar-suit-fit/`.
