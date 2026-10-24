# Local selfie matching

The Avatar Studio's **Find my face** dialog proposes three editable faces from the existing DIFF catalog. A selected suggestion changes head, eyes, brows, nose, mouth, skin palette, hairstyle and hair palette. Iris color, beard style, personal marks, hearing aids, clothing and garment colors remain as configured. Beard and brow colors follow the existing shared hair palette where their assets support it. Apply participates in the existing undo/redo history; Save remains explicit.

This is an approximate starting-point feature. Facial landmarks are mapped to art-directed descriptors for the available pixel features. It is not a trained likeness ranking model, identity recognition or an exact portrait reconstruction. More diverse real-world evaluation is needed before making resemblance or accuracy claims.

## Local processing and cost

- One to three recent JPEG, PNG or WebP photos of the same person are selected locally. Maximum 20 MB, 40 megapixels after decoding, minimum short edge 160 px.
- `createImageBitmap` honors image orientation. The client downsizes to at most 1024 px on the longest edge for analysis. The avatar remains 128 × 128.
- A module Worker runs pinned MediaPipe Face Landmarker 1.0.1, IMAGE mode, CPU delegate, with a local model. It detects up to two faces to reject multi-person photos. After successful face analysis, a 781,618-byte Hair Segmenter model analyzes a face-relative 512 × 512 photo crop in the same Worker.
- Proportions use image-pixel distances, correcting for rectangular images and modest head roll. Very small, cropped, substantially tilted and obvious side-facing faces are rejected.
- Existing manifest items are scored from those proportions. Three combinations differing in at least two face-feature slots are offered. All three use the best-ranked hairstyle, which can be adjusted independently before applying.
- Approximate skin color comes from median colors in two cheek patches; it is mapped to the nearest existing skin palette. Clipped samples or markedly different cheek illumination retain the current tone. Colored lighting, makeup, filters and exposure can still affect the estimate.
- Twelve tone buttons and **Keep my current skin tone** let the user correct the estimate before applying. All three previews update together.

There is no server-side face inference. First use fetches about **17 MB** of versioned static runtime/model assets (one shared WASM binary, two cached loader module URLs, the bundle and both models). The browser can reuse its HTTP cache. Files are lazy-loaded only after a photo is selected. Cached files and model memory are separate: each photo creates a Worker and releases it afterwards; photos are processed sequentially to bound memory.

The existing avatar server still renders three configuration-based previews and the selected avatar. Therefore this feature has static bandwidth and ordinary avatar rendering costs, not zero server usage. No inference latency guarantee has been established for low-end phones.

## Photo privacy and network policy

Photos, decoded pixels and landmarks are not uploaded or written to localStorage, IndexedDB, application files or analytics. The Worker sends only geometric ratios, compact hair descriptors and small color samples back to the page. Preview requests contain ordinary avatar configuration JSON, never the photograph, landmarks or sampled RGB values.

Closing, replacing or applying invalidates pending work, terminates the Worker, revokes the preview object URL and clears the file input and photo/results DOM. Browser garbage collection ultimately releases memory; this is not a promise of immediate secure memory erasure. A generation counter prevents late work from replacing a newer selection. Analysis has a 45-second deadline and errors preserve manual editing.

MediaPipe 1.0.1 includes usage/performance telemetry. **DIFF blocks it.** `src/selfie/network.ts` restricts Worker fetches to exact local model/runtime paths, GET only, no queries, no credentials and no redirects. The Worker response independently carries:

```text
Content-Security-Policy: default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self';
```

Keep this header when deploying behind another server/CDN. Serve JavaScript with a JS MIME type and WASM as `application/wasm`. Do not load this SDK on the main page outside the guarded Worker. Versioned runtime paths use immutable caching; changing those bytes requires a new asset directory and matching Worker paths.

## Skin recoloring

Selfie matching selects the existing `skin_01`–`skin_12` palettes. Existing compiled palette variants recolor skin material across body, head, ears and skin-dependent facial layers while preserving silhouettes, alpha and shading. This is the same source-geometry-plus-palette principle as garment recoloring; it does not put a CSS color filter over the whole character, redraw a body or create new cosmetic artwork.

## Setup and verification

```sh
npm ci
npm run selfie:assets
npm run build
npm test
npm run preview
```

The vendored runtime and model are already present in `assets/selfie/v1`. `selfie:assets` reproduces the inventory from the exact npm package and pinned model URL. The model SHA-256 is `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`. `manifest.json` records all runtime hashes and sizes; `LICENSE.txt` contains the Apache license.

`tests/avatar/selfie.test.ts` checks geometric invariance, unusable landmarks, catalog coverage, deterministic/distinct/renderable matching, preservation of unrelated choices, local-only network policy, runtime checksums, production route restrictions, all twelve skin matches, uncertain skin sampling and identical avatar alpha across tones.

`/dev/selfie-lab` provides public test fixtures using the same `processPhoto` path, real Worker and real editor apply/undo. `/dev/selfie-fixture/*` and the lab page return 404 when `NODE_ENV=production`. Fixture buttons are absent from the normal editor. Fixture tests do not exercise the operating system's native file picker.

The implementation does not estimate ethnicity, gender, age, health or personality. Feature labels describe catalog artwork, not personal classifications.

## Sources

- [MediaPipe Face Landmarker for Web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- [MediaPipe Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/index)
- [Official module Worker setup](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/base-worker.ts)
- [MediaPipe license](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)
- Installed package privacy/metrics notice: `node_modules/@mediapipe/tasks-vision/README.md`.

## Hair selection

`src/selfie/hair.ts` measures the confident hair segmentation relative to the face: visible length, width, forehead coverage, crown coverage, coarse texture and asymmetry. Colors are sampled only inside high-confidence hair pixels. Neutral dark/gray samples are compared against neutral palettes to avoid turning gray-black hair brown. All 100 catalog hairstyles have art-directed descriptors. A deterministic ranking picks up to three candidates, and each face preview starts with a different ranked hairstyle. Choosing a fixed hairstyle applies it to all previews. Cornrows and bald-crown options have additional evidence gates to avoid treating coarse texture or an exposed forehead as those styles.

Landmark 10 describes the upper forehead rather than the top of the skull. A shared anatomical allowance separates approximate scalp height from added hair volume. These descriptors and allowances are heuristics, not a trained hairstyle classifier. Fine texture, exact braid structure, hair hidden behind the head, colored lighting and covered/cropped hair remain limitations. Segmentation failure or low confidence preserves the existing hairstyle and explains the fallback. Absence of a hair mask does not automatically mean baldness.

**Keep my current hair** restores both the existing hairstyle and color in all previews; **Use photo-matched hair** restores the suggestions. Hairstyle and hair-color selectors allow correction before applying. The regular Hair editor remains available for choosing any catalog style afterwards.

The pinned Hair Segmenter model has SHA-256 `2628cf3ce5f695f604cbea2841e00befcaa3624bf80caf3664bef2656d59bf84`; its URL and byte count are included in the runtime inventory. Its [model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20-%20Hair%20Segmentation.pdf) describes the model and its limits. See the [official Image Segmenter guide](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter) for the hair class and Web API.

MediaPipe 1.0.1 consumes the module loader factory during task creation. The second task uses a stable `?task=hair-v1` loader URL so its module initialization runs separately; the WASM binary is shared through the browser cache. This does not mutate private SDK objects. Retest both tasks together when upgrading the SDK. The face task is closed before the hair task is created. The model fetch allowlist includes the pinned hair model, and the server serves `.tflite` with `application/octet-stream`.

The development lab includes an expandable, visible analysis-details panel for diagnosis and calibration. It clears with the photo; the production route has no such panel. No user-photo analysis is written to disk.

## Multi-photo precision pass

The file input supports up to three photos. A memory-only SHA-256 digest skips byte-identical duplicates. Each file is decoded and analyzed sequentially, with its own 45-second model timeout. Individual file failures are reported while valid photos can still produce suggestions. Closing or replacing a batch invalidates all pending work, terminates the active Worker and revokes every thumbnail URL.

`aggregate.ts` combines consistent observations using medians. It compares stable geometric ratios to exclude a gross outlier; this **does not verify identity**. Users must select photographs of the same person. Contradictory pairs are rejected. Changing hairstyles or sufficiently conflicting hair colors cause the current hair to be kept instead of synthesizing an intermediate style. Three consistent photos tolerate a color outlier; two must agree. Skin and hair estimates remain manually correctable.

The precision update adds side-hair depth relative to the face. This distinguishes a bob ending near the chin from a short crop, even when neither extends below the chin. Chromatic hair color is sampled from diffuse mid-high tones to reduce the effect of dark pooled shadows; neutral black/gray hair continues using the median. Eyebrow descriptor ranges were calibrated to the measured landmark range rather than assigning almost every portrait to the highest arch.

A local development comparison is available at `/dev/selfie-comparison`. Rebuild it from recorded browser observations with `npx tsx scripts/selfie/generatePrecisionReport.ts`. It shows six public portraits, actual before/after first-choice avatars and three-photo aggregation results. Both this route and fixture images are blocked in production mode.

The test set contains **six independent original portraits** and two simulated exposure variants per portrait (88% and 112% brightness), giving 18 variants. These are not 18 independent photographs or new camera angles. Barack Obama, Michelle Obama, Joe Biden and Donald Trump supplied calibration cases; Kamala Harris and Jill Biden supplied separate verification cases. This small, narrow set does not establish population-wide accuracy, bias performance, identity recognition or exact likeness. No model training or server inference was added.

Tests cover median robustness to blinking/expression changes, inconsistent geometry, conflicting colors and haircuts, unchanged single-photo behavior and the 1–3 photo bounds. Browser QA covers all six single photos and six three-variant batches, duplicate rejection, partial failure, excessive batch size, manual hairstyle selection, applying, undo and cancellation. Native OS file selection remains outside the browser automation coverage.

The selfie dialog stays anchored at the top of the viewport and keeps its heading visible while scrolling. This prevents asynchronous photo/result insertion from moving the close button during a pointer click.


## September 9 refinement and independent retest

`hair.ts` now uses local luminance-relative gradients, so dark hair does not automatically appear smoother than light hair. Mask sampling uses pixel centers to avoid floating-point boundary leakage. Crown coverage receives less weight; receding hairlines require a narrow silhouette. Braids, locs and twists receive an uncertainty penalty without directional evidence. Very close crops use a weaker texture weight because individual strands are not resolved. These are heuristics and do not reliably distinguish every texture or tie arrangement.

Head descriptors use the measured upper-forehead-to-chin proportions rather than a full skull-height assumption. The existing head artwork is unchanged. `skinTone.ts` samples wider cheek regions with a diffuse percentile and abstains on clipped or uneven illumination. It does not infer the true skin color under unknown lighting. A three-photo batch can use the remaining reliable skin samples when an original photo is clipped; the output can consequently differ from the single-photo fallback.

`facialHair.ts` checks bilateral contrast between the upper-lip/chin regions and nearby cheeks, excluding lip and nostril pixels. It can suggest a mustache or short beard and otherwise preserves the current facial-hair selection. Multiple photos require agreement. This is a conservative dark-hair heuristic, not a trained beard classifier: gray beards, makeup, and shadows remain limitations. The dialog provides an explicit facial-hair selector, including None and Keep my current facial hair. Other personal marks, outfit and iris color remain unchanged.

The frozen-rule retest is at `/dev/selfie-refinement`, generated with `npx tsx scripts/selfie/generateRefinementReport.ts`. Evidence is in `artifacts/selfie/refinement/`. Twelve original photos were analyzed singly and as three simulated brightness variants: 36 distinct variants and 48 inference runs. Ten photos were known development cases. Sally Ride and Guion Bluford were added only for the final held-out evaluation; rule hashes are recorded before this test and verified by report generation. The original four-photo report remains unchanged at `/dev/selfie-new-photo-tests`.

All twelve single and batch cases completed. The first hairstyle stayed the same in 11/12 single-versus-batch comparisons; Jill's ranking changed. Some skin choices also changed. Known curly/wavy cases improved and Hadfield's mustache was suggested, but the two held-out first hairstyles remained visibly wrong. This does not establish general accuracy. No rules were adjusted to fit those two held-out results. The report includes the misses.

Validation: 131 automated tests pass, including four added refinement tests. Browser QA exercises fixed and varied hair previews, keep-current hair/color, facial-hair selection, apply and undo; undo restored the initial configuration exactly. Native OS file picking remains untested. No new model, remote inference or photo upload was introduced.
