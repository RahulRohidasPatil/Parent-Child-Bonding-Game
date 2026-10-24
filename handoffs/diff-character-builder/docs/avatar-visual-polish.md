# Visual polish

The four-part review and comparisons are in `artifacts/avatar-polish/REPORT.md`. Source snapshots remain under `artifacts/avatar-polish/before/`.

`src/collection/sparseFeature.ts` performs coverage-aware source sampling for thin brow and stubble artwork. It copies existing source colors, then the normal authoring pipeline applies the existing palettes. New brow variants share a bottom line at y18, leaving y19 clear before the eyes. The existing default brow is unchanged.

`references/avatar-polish/prompts.json` selects three Imagegen-authored garment revisions. The build resolves these as source overrides for existing IDs, then applies the standard shoulder, hem and wrist registration. New originals are retained alongside previous source pictures. The palette definitions, default sprite and renderer remain unchanged.

Run `npx tsx scripts/avatar/reviewPolish.ts` to regenerate the visual matrices and before/after sheets, `npm test` for regressions and `npx tsx scripts/avatar/validatePositions.ts` for position combinations. These are visual refinements, not new avatar rigs or positioning exceptions.
