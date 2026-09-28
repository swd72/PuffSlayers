# Cinematic painterly generation — art-prompts-v2 §13

Generated on 2026-09-28 with the built-in `image_gen` tool. Final assets follow [art-prompts-v2.md §13](art-prompts-v2.md#13-สไตล์-ภาพยนตร์อนิเมะ-cinematic-painterly--ฉากหลัง--เอฟเฟกต์ชุดใหม่).

17 final PNGs: four Taro VFX sheets, six chapter backgrounds, six matching boss arenas, and the village hub. Boss arenas use their new regular battlefield as a reference. The village is a repaint of the previous hub with its six plots and connecting paths preserved.

Source backups for the replaced root eruption and village hub are in `assets/generated/pre-cinematic-2026-09-28/`. The original built-in outputs also remain under the Codex generated image directory.

The sprite pipeline exports all 13 backgrounds and 15 painted VFX frames. Painted effects use gray background removal, clear enclosed gray openings, retain dark bark, and use normal alpha blending (`additive: false`). The game already consumes meadow, meadow boss, village, ground burst and root eruption. The remaining chapter images and vine sheets are exported assets; chapter selection and vine animation code are unchanged.

## Verification and previews

- `npm run sprites`: passed, 131/131 sheets and 13 backgrounds exported.
- `node --check tools/extract-v2.mjs`: passed.
- `node output/cinematic-generation-2026-09-28/verify.mjs`: passed; checked all 17 PNG sources, all 13 portrait background exports, frame counts, shared canvas sizes, transparent backdrop, visible opaque artwork, and non-additive blending for all 15 painted frames.
- Visually inspected all generated sources, the battlefield overview, and every extracted VFX frame on a checkerboard. The hollow vine coils have transparent openings.
- [Battlefields and boss arenas overview](../output/cinematic-generation-2026-09-28/backgrounds-overview.jpg)
- [Extracted VFX frames overview](../output/cinematic-generation-2026-09-28/vfx-frames-overview.png)
- [Source dimensions](../output/cinematic-generation-2026-09-28/source-metadata.json) and [extracted-frame measurements](../output/cinematic-generation-2026-09-28/extracted-metadata.json).

## Exact prompts and outputs

### druid-ground-burst

- Output: `assets/generated/vfx2/druid-ground-burst.png`

```text
Use case: stylized-concept. Asset type: game VFX animation sprite sheet, druid-ground-burst.png. Primary request: a patch of earth seen from a high 55 degree top-down angle tearing open from below: four frames — the soil bulging and cracking in a small mound, the crust splitting with clods and pebbles flying up, a dark round hole with a rim of broken turf and dust spraying outward, dust settling around the open hole. hand-painted anime movie effect element, same painterly style as a Japanese anime film background, subtle clean linework, soft cel-painted shapes, visible brush texture, warm golden-hour key light with peach-orange highlights and cool teal-blue shadows, dynamic motion, readable silhouette at small size, isolated on a plain flat light gray #E8E8E8 background, no ground plane, no scenery, no characters, no text, not photorealistic, not 3D. sprite sheet, single horizontal row, frames evenly spaced with equal size and identical baseline, consistent design across frames, nothing overlapping between frames. Exactly four separate frames from left to right, on one very wide 4:1 canvas. All dirt, pebbles and dust stay fully inside their own cell with generous empty gutters, no grid lines, no labels or numbers. The ground effect is an isolated small elliptical earth patch, with the rest of the canvas uniformly light gray.
```

### druid-vine-emerge

- Output: `assets/generated/vfx2/druid-vine-emerge.png`

```text
Use case: stylized-concept. Asset type: game VFX animation sprite sheet, druid-vine-emerge.png. Primary request: a thick twisting green-brown vine with bark texture, small leaves and a curled glowing sprout tip bursting straight up out of a hole in the ground: four frames — the tip poking out with dirt flying, shooting up tall, arching over at the top, bending down as if to wrap something, the base always at the same spot at the bottom of the frame. hand-painted anime movie effect element, same painterly style as a Japanese anime film background, subtle clean linework, soft cel-painted shapes, visible brush texture, warm golden-hour key light with peach-orange highlights and cool teal-blue shadows, dynamic motion, readable silhouette at small size, isolated on a plain flat light gray #E8E8E8 background, no ground plane, no scenery, no characters, no text, not photorealistic, not 3D. sprite sheet, single horizontal row, exactly 4 evenly spaced frames, equal cell size and identical baseline, consistent design across frames, nothing overlapping between frames. Very wide landscape canvas, each frame fully fits with generous gray gutters and margins; no frame numbers, labels, grid lines or borders. Keep the earth contact point in the same position of each cell, don't crop tall vines or flying debris. Background is perfectly flat #E8E8E8 with no gradient or shadow.
```

### druid-vine-coil

- Output: `assets/generated/vfx2/druid-vine-coil.png`

```text
Use case: stylized-concept. Asset type: game VFX animation sprite sheet, druid-vine-coil.png. Primary request: a spiral of thick leafy vines wrapped three times around an invisible upright round body, empty in the middle, seen from a 55 degree angle, front loops in front and back loops behind, three frames of the coils squeezing tighter with leaves shaking. The hollow middle must show the same flat gray background as outside, not a painted gray body. hand-painted anime movie effect element, same painterly style as a Japanese anime film background, subtle clean linework, soft cel-painted shapes, visible brush texture, warm golden-hour key light with peach-orange highlights and cool teal-blue shadows, dynamic motion, readable silhouette at small size, isolated on a plain flat light gray #E8E8E8 background, no ground plane, no scenery, no characters, no text, not photorealistic, not 3D. sprite sheet, single horizontal row, exactly 3 evenly spaced frames, equal cell size and identical baseline, consistent design across frames, nothing overlapping between frames. Very wide landscape canvas, each frame fully fits with generous gray gutters and margins; no frame numbers, labels, grid lines or borders. Keep the earth contact point in the same position of each cell, don't crop tall vines or flying debris. Background is perfectly flat #E8E8E8 with no gradient or shadow.
```

### druid-root-erupt

- Output: `assets/generated/vfx2/druid-root-erupt.png`

```text
Use case: stylized-concept. Asset type: game VFX animation sprite sheet, druid-root-erupt.png. Primary request: a colossal ancient tree root erupting from a fissure in the earth, gnarled bark with moss and vines, boulders and turf blasting outward: four frames — fissure splitting with dust, root bursting up, towering at full height with leaves swirling, crashing down in a ring of dust, high top-down 55 degree view. hand-painted anime movie effect element, same painterly style as a Japanese anime film background, subtle clean linework, soft cel-painted shapes, visible brush texture, warm golden-hour key light with peach-orange highlights and cool teal-blue shadows, dynamic motion, readable silhouette at small size, isolated on a plain flat light gray #E8E8E8 background, no ground plane, no scenery, no characters, no text, not photorealistic, not 3D. sprite sheet, single horizontal row, exactly 4 evenly spaced frames, equal cell size and identical baseline, consistent design across frames, nothing overlapping between frames. Very wide landscape canvas, each frame fully fits with generous gray gutters and margins; no frame numbers, labels, grid lines or borders. Keep the earth contact point in the same position of each cell, don't crop tall vines or flying debris. Background is perfectly flat #E8E8E8 with no gradient or shadow.
```

### 01-meadow-of-naps

- Output: `assets/generated/v2/backgrounds/01-meadow-of-naps.png`

```text
Use case: stylized-concept. Asset type: mobile RPG battlefield background. Top-down 55 degree game battlefield for a mobile RPG, vertical 9:16, a sleepy flower meadow kingdom, a wide open clearing of soft trampled grass and sunlit dirt path filling the middle half of the image for characters to fight on, framed by round bushes, sleeping daisies, mossy rocks and a wooden fence along the left, right and bottom edges, distant rolling hills, a white castle and waterfalls and sky in the top quarter, no characters, no UI, no text. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. Exactly one full-bleed portrait scene, 9:16 aspect ratio. The high camera clearly looks down on the playable ground, which occupies the broad center between 25% and 80% image height and is flat, smooth, unobstructed, without large foreground props crossing it. Vegetation and rocks frame only the outer edges. No collage, no panels, no labels, no watermarks. For the lagoon, preserve its dusk atmosphere and moon while using subtle warm peach highlights and cool teal shadows.
```

### 02-carrot-forest

- Output: `assets/generated/v2/backgrounds/02-carrot-forest.png`

```text
Use case: stylized-concept. Asset type: mobile RPG battlefield background. Top-down 55 degree game battlefield for a mobile RPG, vertical 9:16, a cozy forest of giant carrot trees, a wide open clearing of packed earth with fallen carrot leaves filling the middle half of the image for characters to fight on, framed by giant carrot trunks, mushrooms and ferns along the left, right and bottom edges, distant layered misty forest ridges and sky in the top quarter, no characters, no UI, no text. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. Exactly one full-bleed portrait scene, 9:16 aspect ratio. The high camera clearly looks down on the playable ground, which occupies the broad center between 25% and 80% image height and is flat, smooth, unobstructed, without large foreground props crossing it. Vegetation and rocks frame only the outer edges. No collage, no panels, no labels, no watermarks. For the lagoon, preserve its dusk atmosphere and moon while using subtle warm peach highlights and cool teal shadows.
```

### 03-lotus-lagoon

- Output: `assets/generated/v2/backgrounds/03-lotus-lagoon.png`

```text
Use case: stylized-concept. Asset type: mobile RPG battlefield background. Top-down 55 degree game battlefield for a mobile RPG, vertical 9:16, a shallow lotus lagoon at dusk, a wide open clearing of wide flat stone platform over still water filling the middle half of the image for characters to fight on, framed by lotus leaves, reeds and stone lanterns along the left, right and bottom edges, distant a glowing moon rising over the water and sky in the top quarter, no characters, no UI, no text. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. Exactly one full-bleed portrait scene, 9:16 aspect ratio. The high camera clearly looks down on the playable ground, which occupies the broad center between 25% and 80% image height and is flat, smooth, unobstructed, without large foreground props crossing it. Vegetation and rocks frame only the outer edges. No collage, no panels, no labels, no watermarks. For the lagoon, preserve its dusk atmosphere and moon while using subtle warm peach highlights and cool teal shadows.
```

### 04-sunflower-valley

- Output: `assets/generated/v2/backgrounds/04-sunflower-valley.png`

```text
Use case: stylized-concept. Asset type: mobile RPG battlefield background. Top-down 55 degree game battlefield for a mobile RPG, vertical 9:16, a warm valley of towering sunflowers, a wide open clearing of dry golden earth and flat sandstone filling the middle half of the image for characters to fight on, framed by sunflower stalks and warm boulders along the left, right and bottom edges, distant canyon cliffs and a big golden sun and sky in the top quarter, no characters, no UI, no text. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. Exactly one full-bleed portrait scene, 9:16 aspect ratio. The high camera clearly looks down on the playable ground, which occupies the broad center between 25% and 80% image height and is flat, smooth, unobstructed, without large foreground props crossing it. Vegetation and rocks frame only the outer edges. No collage, no panels, no labels, no watermarks. Warm golden hour, no moon.
```

### 05-milk-sea-shore

- Output: `assets/generated/v2/backgrounds/05-milk-sea-shore.png`

```text
Use case: stylized-concept. Asset type: mobile RPG battlefield background. Top-down 55 degree game battlefield for a mobile RPG, vertical 9:16, a creamy white milk-sea shore, a wide open clearing of smooth pale sand and pebble flats filling the middle half of the image for characters to fight on, framed by driftwood, shells and candy-colored rocks along the left, right and bottom edges, distant a calm milky sea and cotton clouds and sky in the top quarter, no characters, no UI, no text. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. Exactly one full-bleed portrait scene, 9:16 aspect ratio. The high camera clearly looks down on the playable ground, which occupies the broad center between 25% and 80% image height and is flat, smooth, unobstructed, without large foreground props crossing it. Vegetation and rocks frame only the outer edges. No collage, no panels, no labels, no watermarks. Warm golden hour, no moon.
```

### 06-star-pond

- Output: `assets/generated/v2/backgrounds/06-star-pond.png`

```text
Use case: stylized-concept. Asset type: mobile RPG battlefield background. Top-down 55 degree game battlefield for a mobile RPG, vertical 9:16, a starlit night garden pond, a wide open clearing of glowing moss stone plaza filling the middle half of the image for characters to fight on, framed by night flowers, fireflies and crystal rocks along the left, right and bottom edges, distant a starry sky with a milky way and sky in the top quarter, no characters, no UI, no text. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. Exactly one full-bleed portrait scene, 9:16 aspect ratio. The high camera clearly looks down on the playable ground, which occupies the broad center between 25% and 80% image height and is flat, smooth, unobstructed, without large foreground props crossing it. Vegetation and rocks frame only the outer edges. No collage, no panels, no labels, no watermarks. Preserve the required starlit NIGHT setting: rich indigo sky and Milky Way, teal blue night shadows, restrained warm peach highlights from luminous flora; do not turn it into sunset.
```

### 01-meadow-of-naps-boss

- Output: `assets/generated/v2/backgrounds/01-meadow-of-naps-boss.png`
- Reference: `assets/generated/v2/backgrounds/01-meadow-of-naps.png`

```text
Use case: style-transfer. Asset type: one portrait 9:16 boss arena game background. Input image 1: reference image of the regular battlefield for this same chapter, preserve its location, camera, edge vegetation, distant vista and painterly style. Create the same place as a boss arena: a sleepy flower meadow kingdom, framed by round bushes, sleeping daisies, mossy rocks and a wooden fence, distant rolling hills, a white castle and waterfalls in the top quarter. The clearing is a large circle of cracked earth with a faint glowing rune ring, giant thorny vines and dark petals creeping in from the edges, stormy dramatic sky with a warm rim of light. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. High top-down 55 degree camera looking down at playable ground. Keep a wide open flat unobstructed central combat area occupying the middle half. Dark thorny vines and petals stay at the left, right and bottom edges, never across the center. One full-bleed portrait image, no characters, no boss creature, no UI, no text, no labels, no watermark. This is the empty environment asset only.
```

### 02-carrot-forest-boss

- Output: `assets/generated/v2/backgrounds/02-carrot-forest-boss.png`
- Reference: `assets/generated/v2/backgrounds/02-carrot-forest.png`

```text
Use case: style-transfer. Asset type: one portrait 9:16 boss arena game background. Input image 1: reference image of the regular battlefield for this same chapter, preserve its location, camera, edge vegetation, distant vista and painterly style. Create the same place as a boss arena: a cozy forest of giant carrot trees, framed by giant carrot trunks, mushrooms and ferns, distant layered misty forest ridges in the top quarter. The clearing is a large circle of cracked earth with a faint glowing rune ring, giant thorny vines and dark petals creeping in from the edges, stormy dramatic sky with a warm rim of light. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. High top-down 55 degree camera looking down at playable ground. Keep a wide open flat unobstructed central combat area occupying the middle half. Dark thorny vines and petals stay at the left, right and bottom edges, never across the center. One full-bleed portrait image, no characters, no boss creature, no UI, no text, no labels, no watermark. This is the empty environment asset only.
```

### 03-lotus-lagoon-boss

- Output: `assets/generated/v2/backgrounds/03-lotus-lagoon-boss.png`
- Reference: `assets/generated/v2/backgrounds/03-lotus-lagoon.png`

```text
Use case: style-transfer. Asset type: one portrait 9:16 boss arena game background. Input image 1: reference image of the regular battlefield for this same chapter, preserve its location, camera, edge vegetation, distant vista and painterly style. Create the same place as a boss arena: a shallow lotus lagoon at dusk, framed by lotus leaves, reeds and stone lanterns, distant a glowing moon rising over the water in the top quarter. The clearing is a large circle of cracked earth with a faint glowing rune ring, giant thorny vines and dark petals creeping in from the edges, stormy dramatic sky with a warm rim of light. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. High top-down 55 degree camera looking down at playable ground. Keep a wide open flat unobstructed central combat area occupying the middle half. Dark thorny vines and petals stay at the left, right and bottom edges, never across the center. One full-bleed portrait image, no characters, no boss creature, no UI, no text, no labels, no watermark. This is the empty environment asset only.
```

### 04-sunflower-valley-boss

- Output: `assets/generated/v2/backgrounds/04-sunflower-valley-boss.png`
- Reference: `assets/generated/v2/backgrounds/04-sunflower-valley.png`

```text
Use case: style-transfer. Asset type: one portrait 9:16 boss arena game background. Input image 1: reference image of the regular battlefield for this same chapter, preserve its location, camera, edge vegetation, distant vista and painterly style. Create the same place as a boss arena: a warm valley of towering sunflowers, framed by sunflower stalks and warm boulders, distant canyon cliffs and a big golden sun in the top quarter. The clearing is a large circle of cracked earth with a faint glowing rune ring, giant thorny vines and dark petals creeping in from the edges, stormy dramatic sky with a warm rim of light. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. High top-down 55 degree camera looking down at playable ground. Keep a wide open flat unobstructed central combat area occupying the middle half. Dark thorny vines and petals stay at the left, right and bottom edges, never across the center. One full-bleed portrait image, no characters, no boss creature, no UI, no text, no labels, no watermark. Warm golden sunset rim light.
```

### 05-milk-sea-shore-boss

- Output: `assets/generated/v2/backgrounds/05-milk-sea-shore-boss.png`
- Reference: `assets/generated/v2/backgrounds/05-milk-sea-shore.png`

```text
Use case: style-transfer. Asset type: one portrait 9:16 boss arena game background. Input image 1: reference image of the regular battlefield for this same chapter, preserve its location, camera, edge vegetation, distant vista and painterly style. Create the same place as a boss arena: a creamy white milk-sea shore, framed by driftwood, shells and candy-colored rocks, distant a calm milky sea and cotton clouds in the top quarter. The clearing is a large circle of cracked earth with a faint glowing rune ring, giant thorny vines and dark petals creeping in from the edges, stormy dramatic sky with a warm rim of light. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. High top-down 55 degree camera looking down at playable ground. Keep a wide open flat unobstructed central combat area occupying the middle half. Dark thorny vines and petals stay at the left, right and bottom edges, never across the center. One full-bleed portrait image, no characters, no boss creature, no UI, no text, no labels, no watermark. Warm golden sunset rim light.
```

### 06-star-pond-boss

- Output: `assets/generated/v2/backgrounds/06-star-pond-boss.png`
- Reference: `assets/generated/v2/backgrounds/06-star-pond.png`

```text
Use case: style-transfer. Asset type: one portrait 9:16 boss arena game background. Input image 1: reference image of the regular battlefield for this same chapter, preserve its location, camera, edge vegetation, distant vista and painterly style. Create the same place as a boss arena: a starlit night garden pond, framed by night flowers, fireflies and crystal rocks, distant a starry sky with a milky way in the top quarter. The clearing is a large circle of cracked earth with a faint glowing rune ring, giant thorny vines and dark petals creeping in from the edges, stormy dramatic sky with a warm rim of light. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. High top-down 55 degree camera looking down at playable ground. Keep a wide open flat unobstructed central combat area occupying the middle half. Dark thorny vines and petals stay at the left, right and bottom edges, never across the center. One full-bleed portrait image, no characters, no boss creature, no UI, no text, no labels, no watermark. Keep the star pond a NIGHT scene with some visible stars and Milky Way through the stormy clouds, warm rim light is magical light on clouds.
```

### village-hub

- Output: `assets/generated/v2/backgrounds/village-hub.png`
- Reference: `assets/generated/v2/backgrounds/village-hub.png`

```text
Use case: style-transfer. Asset type: portrait mobile game village hub background. Input image 1: EDIT TARGET, the existing village map; preserve its exact spatial layout. Repaint this village map in a new style while keeping the exact same layout: the same six round grassy plateaus in the same positions, the same dirt paths, bridge and stream, same top-down 55 degree camera, vertical 9:16, no buildings on the plateaus (they are placed by the game), no characters, no text. Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms, detailed foliage and rocks, warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, atmospheric perspective, soft distant haze, beautiful hand-painted clouds, rich controlled color palette, anime movie background quality, illustrated, not photorealistic, not 3D. Preserve the six empty grassy plots: upper center, middle left, middle right, center, lower left, lower right, exactly matching the reference image's size and location. Preserve the winding connecting paths, the bridge and stream in the lower part, the large tree at the upper left, distant castle, cliffs and waterfalls at the upper right, and dark leafy foreground at the bottom. Change only the rendering style into softer cinematic hand-painted anime background with visible brushwork, warm peach-orange sunlight and teal-blue shadows; keep all playable building footprints unobstructed and empty. One full-bleed portrait image, no new plot, no removal of a plot, no UI, no text, no watermark.
```

