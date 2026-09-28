# Signature VFX and move sheets

Generated with the built-in `image_gen` tool using `docs/art-prompts-v2.md` sections 14.9, 14.3 and 14.4. Character model sheets are identity references for every new animation sheet. `prompts.json` records generation prompts; `refinements.json` records edits to keep artwork within each animation cell.

- Signature VFX: seven source PNGs in `assets/generated/vfx2/`, eight extracted frames (the spirit bear has open and hugging poses).
- Move sheets: seven ultimate sheets (12 frames, 4×3) and seven attack sheets (6 frames, 3×2) in `assets/generated/v2/moves/`.
- The existing `carrot-knight-ult.png` is retained. Its original generation history is in `output/imagegen/cinematic-ultimate-prompts.json`.
- Taro reuses the existing four painted root/vine sheets. The game uses these automatically via the painted vine and coil paths.

Rebuild assets with `npm run sprites`. Validate all 25 relevant sheets and 149 frames with `node output/imagegen/signature-moves-2026-09-28/verify.mjs`. The validator checks frame counts, image dimensions, transparency, blend modes and move anchors. It also flags colored content crossing the exact source grid boundaries for visual review.

`signature-overview.png` and the per-class `*-ult-overview.png` / `*-attack-overview.png` show the extracted frames against a dark backdrop. `verification.json` contains the validation result.
