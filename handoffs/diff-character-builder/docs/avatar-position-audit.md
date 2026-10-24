# Position-only garment audit

The detailed per-item report is in `artifacts/avatar-position-audit/REPORT.md`. It covers all 94 current garments, footwear models and the tie. This change adjusts positions/coverage only; it does not modify palette definitions or the editor's color controls.

Confirmed sleeve defects are repaired after color-mask generation with a source-coordinate map. `garmentPositionMap` completes the fixed arm coverage and brings cuffs toward the canonical wrists. The same map is applied to the sprite, primary material mask and detail mask, keeping original RGB/role tuples together. Only garments with confirmed coverage gaps are modified. Short sleeves have an explicit `sleeveLength` contract and retain exposed forearms.

Trouser maps complete coverage at hip and leg anchors. Tiny detached outsole/cord components are connected to nearby same-item artwork; shoe baseline y=122 stays fixed. All these steps occur in the build. The renderer still draws full 128×128 layers at 0,0.

Use `scripts/avatar/auditPositions.ts` to regenerate individual position sheets and measurements, and `scripts/avatar/validatePositions.ts` for the pairwise position compatibility run plus 5,000 seeded random combinations. `tests/avatar/positions.test.ts` protects full-sleeve wrist/arm coverage, full-length trouser coverage and shoe baselines/components.

The before pack is retained under `artifacts/avatar-position-audit/before/`. `prove-colors.ts` in that audit directory verifies every changed pixel's original RGB plus primary/detail mask tuple against its source and checks that palette files are byte-identical. The approved default, body, hands and face assets are preserved.
