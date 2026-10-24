# Secondary wearable colors

The editor now exposes a main color and a detail color for every top, jacket, bottom and shoe. Both use the existing palette. Detail choices include **Auto** plus 17 explicit colors. Accessory detail controls appear only where a separate detail mask exists. Hats remain removed from the editor and its randomization.

`wearAccentColors` is a strict per-slot configuration record, parallel to `wearColors`. Old configurations default to Auto (`wear.original`) without changing their appearance. Undo, redo, draft recovery, save validation, randomization, layer inspection and PNG export retain both records.

`src/collection/accentAuthoring.ts` creates masks from the existing source pixels. It selects contrasting trim plus narrow shared garment detail zones: collar/cuffs, waistband, or shoe soles. A dark garment without readable contrasting trim uses an interior hem band. Dark exterior outline pixels remain protected. Some detail masks intentionally overlap the main-material mask; an explicit detail color overrides those pixels after main recoloring. Auto skips the override and preserves the previous rendering exactly.

This is one grouped detail channel per item, not separate controls for every shoelace, sole or button. The item metadata supplies its detail label. No new source image, layer geometry, positioning override or resolution was introduced. Every previous production layer PNG remains unchanged; masks are full-canvas 128×128 PNGs.

The renderer's tint cache and composite hash include the active detail selection. Unused detail slots normalize to Auto for hashing. The layer inspector serves both colors using the same renderer path.

Validation rejects an unknown detail mask, partial alpha or pixels beyond the source layer. Tests cover strict schema migration, independent colors, protected pixels and alpha, distinct detail palettes, original default preservation, HTTP output and 5,000 seeded combinations with both channels. Evidence is in `artifacts/avatar-secondary-colors/`.

Run `npm run collection:assets` to rebuild the masks and `npx tsx scripts/avatar/previewSecondaryColors.ts` for category contact sheets in `assets/avatar/atelier-r6/previews/secondary-colors/`.
