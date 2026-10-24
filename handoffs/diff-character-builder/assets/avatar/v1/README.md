# DIFF Avatar v1 – Production Checkpoint

This directory contains the first locked `front_idle_v1` checkpoint. It intentionally includes only the assets needed to prove one universal body rig before the larger cosmetic library is produced.

## Rig contract

- Every production layer is a `128 × 128` RGBA PNG.
- Production pixels are sampled from the approved Imagegen reference PNGs and normalized onto one `128 × 128` canvas.
- Every layer is drawn at `x=0`, `y=0`, rotation `0`, scale `1`.
- The base layer contains one body/head silhouette, twelve curated skin palettes and neutral underwear.
- Face, hair, clothing, shoes, outerwear, glasses and headwear are isolated transparent layers.
- Medium/long hair supports separate back and front layers.
- Caps and beanies use standardized visibility masks rather than per-item offsets.

## Included checkpoint

The canonical configuration is `skin_04`, neutral eyes, straight brows, a small smile, dark-brown fluffy-middle hair, cream fleece quarter-zip, black straight trousers and white low sneakers.

Variants test a cap, folded beanie, open track jacket, long wavy hair, round glasses and tapered track pants. The system intentionally emits only `128 × 128` production renders.

Imagegen source art and the provided DIFF reference board remain under `/references/avatar-v1/`. Each production manifest entry records the exact Imagegen source used. The build samples those image pixels directly; it does not redraw cosmetics in code.

## Commands

```sh
npm run assets
npm run validate
npm test
npm run preview
```

The preview is available at `http://localhost:4312/dev/avatar-lab` while `npm run preview` is running.
