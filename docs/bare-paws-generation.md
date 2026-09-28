# Bare-pawed hero sheets — generation record

Generated with the built-in `image_gen` tool using the original sheets as edit references. Task: [art-prompts-v2.md §10](art-prompts-v2.md#10-ตัวละคร-มือเปล่า--ให้ถืออาวุธตามไอเทมที่ใส่).

Each of the six heroes has six regular poses plus four signature poses. Tofu’s existing bare sheets are retained.

| Class | Pose sheet | Signature sheet |
|---|---|---|
| pillow-guard | [6 poses](../assets/generated/v2/characters/hamham-pillow-guard-poses-bare.png) | [4 signature poses](../assets/generated/v2/characters/pillow-guard-signature-bare.png) |
| leaf-archer | [6 poses](../assets/generated/v2/characters/bunbun-leaf-archer-poses-bare.png) | [4 signature poses](../assets/generated/v2/characters/leaf-archer-signature-bare.png) |
| bubble-mage | [6 poses](../assets/generated/v2/characters/shibu-bubble-mage-poses-bare.png) | [4 signature poses](../assets/generated/v2/characters/bubble-mage-signature-bare.png) |
| mochi-cleric | [6 poses](../assets/generated/v2/characters/bunbun-mochi-cleric-poses-bare.png) | [4 signature poses](../assets/generated/v2/characters/mochi-cleric-signature-bare.png) |
| bell-bard | [6 poses](../assets/generated/v2/characters/hamham-bell-bard-poses-bare.png) | [4 signature poses](../assets/generated/v2/characters/bell-bard-signature-bare.png) |
| root-druid | [6 poses](../assets/generated/v2/characters/molemo-root-druid-poses-bare.png) | [4 signature poses](../assets/generated/v2/characters/root-druid-signature-bare.png) |

Runtime outputs: `apps/web/public/sprites/v2/hero-bare/` and `sig-bare/`, registered in `manifest.json` by `npm run sprites`. Paw coordinates and weapon angles are calibrated in `apps/web/src/scene/weaponHold.ts`. The legacy Cheek Cannon sheet retains its painted shield, so the separate weapon is hidden during those poses.

Validation: sprite extraction completed with 128/128 sheets; all 70 bare frames across the seven classes are nonempty with transparent backgrounds. All 60 new frames were visually inspected, including composites with Tier 1 weapons using the runtime grip positions and rotations. `npm run build` passed; `npm test` passed all 108 tests. Visual calibration uses the default outfits; skins keep their existing art.

## Shared prompt

```text
Edit the provided reference sprite sheet to produce its bare-pawed version for the Puff Slayers game. Keep EXACTLY the same character identity, species, costume, face, fur color, proportions, camera angle, expression, pose sequence, character center positions, scale and baseline as the reference. The ONLY character change is removing every held weapon and reconstructing the newly exposed empty gripping paw and clothing or body behind it. The weapon paw must be CLOSED AS IF GRIPPING AN INVISIBLE HANDLE, clearly visible and unobstructed. Preserve the original action poses even without their weapon. Plain uniform flat light gray #E8E8E8 background, no floor shadow. Remove all floating attack effects, trails, glowing auras, particles, dust and detached weapon projectiles; the engine renders those separately. Retain costume ornaments and worn accessories. 2.5D anime mobile idle RPG art, high top-down camera at about 55 degrees, tiny chibi proportions with oversized head, bold clean dark outlines, glossy cel shading, saturated fantasy colors. One horizontal row, equally spaced frames, consistent size, nothing overlapping, fully inside canvas with margins. Wide landscape sheet matching the reference aspect ratio as closely as possible. No words, numbers, labels, grid lines or watermark. DO NOT redesign, add additional poses, change costumes, or flatten facial expressions.
```

## Per-sheet prompts and outputs

Append the following frame-count line and character instructions to the shared prompt for each reference.

### hamham-pillow-guard-poses-bare.png

Reference: `assets/generated/v2/characters/hamham-pillow-guard-poses.png`

Output: `assets/generated/v2/characters/hamham-pillow-guard-poses-bare.png`

```text
Frame count: EXACTLY 6 complete separate characters in a SINGLE horizontal row.
Pudding, golden round hamster, blue quilted armour and pot-lid helmet. Remove pillow shields completely in ALL six frames, including shield on back; reconstruct empty closed gripping paw and missing blue quilted torso. Six poses: idle, run, wind-up, release, rolled ball casting ultimate, hurt.
```

### pillow-guard-signature-bare.png

Reference: `assets/generated/v2/characters/pillow-guard-signature.png`

Output: `assets/generated/v2/characters/pillow-guard-signature-bare.png`

```text
Frame count: EXACTLY 4 complete separate characters in a SINGLE horizontal row.
Pudding, same golden hamster knight. Remove ALL pillow shields in all frames including back. Four poses: bracing, curled ball, rolling ball, bouncing up from slam. Reconstruct arm/paw under shield; visible closed gripping paw where feasible, retain round curled body during rolls.
```

### bunbun-leaf-archer-poses-bare.png

Reference: `assets/generated/v2/characters/bunbun-leaf-archer-poses.png`

Output: `assets/generated/v2/characters/bunbun-leaf-archer-poses-bare.png`

```text
Frame count: EXACTLY 6 complete separate characters in a SINGLE horizontal row.
Usagi, snow-white bunny with long pink inner ears, green leaf hood and cape. Remove held vine bow, bowstrings, ALL nocked/held arrows and flying arrows. Keep worn quiver on back. Six poses: idle, run, drawing invisible bow, releasing invisible bow, aiming upward/cast, hurt. The forward bow-grip paw stays closed and visible in its original location.
```

### leaf-archer-signature-bare.png

Reference: `assets/generated/v2/characters/leaf-archer-signature.png`

Output: `assets/generated/v2/characters/leaf-archer-signature-bare.png`

```text
Frame count: EXACTLY 4 complete separate characters in a SINGLE horizontal row.
Usagi, same white leaf-hooded bunny. Remove held bow, bowstrings, ALL nocked/held arrows. Retain back quiver. Four poses unchanged: drawing invisible bow, full draw aiming, release with empty paws, aiming skyward. Forward weapon-grip paw closed as if gripping invisible handle.
```

### shibu-bubble-mage-poses-bare.png

Reference: `assets/generated/v2/characters/shibu-bubble-mage-poses.png`

Output: `assets/generated/v2/characters/shibu-bubble-mage-poses-bare.png`

```text
Frame count: EXACTLY 6 complete separate characters in a SINGLE horizontal row.
Kinako, orange fluffy shiba with cream mask and curled tail, indigo star-and-moon robe, waffle ice-cream-cone wizard hat and gem brooch. Remove entire bubble wand and all bubbles in all frames. Retain belt potion bottle and costume. Six poses: idle, run, wand wind-up with empty gripping paw overhead, release empty fist forward, ultimate overhead empty fist, hurt.
```

### bubble-mage-signature-bare.png

Reference: `assets/generated/v2/characters/bubble-mage-signature.png`

Output: `assets/generated/v2/characters/bubble-mage-signature-bare.png`

```text
Frame count: EXACTLY 4 complete separate characters in a SINGLE horizontal row.
Kinako, same orange shiba wizard. Remove entire bubble wand, all bubbles, magic spirals. Retain costume and belt bottle. Four poses unchanged: twirling empty gripping fist, blowing toward empty gripping fist, both arms raised conjuring, pointing empty gripping fist forward.
```

### bunbun-mochi-cleric-poses-bare.png

Reference: `assets/generated/v2/characters/bunbun-mochi-cleric-poses.png`

Output: `assets/generated/v2/characters/bunbun-mochi-cleric-poses-bare.png`

```text
Frame count: EXACTLY 6 complete separate characters in a SINGLE horizontal row.
Momo, white bunny cleric in white-gold priest robe with dango halo. Remove entire mochi staff including pink topper in ALL frames, and remove flying mochi and magic effects. Keep halo and robe decorations. Six unchanged poses: idle, run, raising empty gripping paw, release, both paws up casting, hurt.
```

### mochi-cleric-signature-bare.png

Reference: `assets/generated/v2/characters/mochi-cleric-signature.png`

Output: `assets/generated/v2/characters/mochi-cleric-signature-bare.png`

```text
Frame count: EXACTLY 4 complete separate characters in a SINGLE horizontal row.
Momo, same white bunny cleric. Remove mochi staff and held/tossed mochi and detached magic effects. Keep dango halo and robe. Four unchanged poses: raising empty gripping fist, underhand toss with empty paw, prayer eyes closed, both arms skyward.
```

### hamham-bell-bard-poses-bare.png

Reference: `assets/generated/v2/characters/hamham-bell-bard-poses.png`

Output: `assets/generated/v2/characters/hamham-bell-bard-poses-bare.png`

```text
Frame count: EXACTLY 6 complete separate characters in a SINGLE horizontal row.
Mimi, golden hamster bard with festive pink ribboned coat. Remove ALL held golden bells, bell handles, mallets/drumsticks and pancake drums including hip drum so there are no weapons/instruments on body. Keep ribbon costume and other costume decorations. Six unchanged poses: idle, run, wind-up, release, musical cast with empty raised closed weapon fist, hurt.
```

### bell-bard-signature-bare.png

Reference: `assets/generated/v2/characters/bell-bard-signature.png`

Output: `assets/generated/v2/characters/bell-bard-signature-bare.png`

```text
Frame count: EXACTLY 4 complete separate characters in a SINGLE horizontal row.
Mimi, same golden hamster bard. Remove ALL bells, bell handles, mallets/drumsticks and pancake drums including hip drum. Four poses unchanged: ringing high with empty closed fist, drumming with empty closed fists, spinning dance, jumping with empty closed weapon fist. Keep costume ribbons.
```

### molemo-root-druid-poses-bare.png

Reference: `assets/generated/v2/characters/molemo-root-druid-poses.png`

Output: `assets/generated/v2/characters/molemo-root-druid-poses-bare.png`

```text
Frame count: EXACTLY 6 complete separate characters in a SINGLE horizontal row.
Taro, round cocoa-brown mole, pink star nose, squinty eyes, large digging paws and green sprout, earth-tone leaf druid robes. Remove entire root staff including seed crystal and all loose magical roots and effects. Keep costume and head sprout. Six unchanged poses: idle, run, wind-up, release, raising empty gripping paw for ultimate, hurt.
```

### root-druid-signature-bare.png

Reference: `assets/generated/v2/characters/root-druid-signature.png`

Output: `assets/generated/v2/characters/root-druid-signature-bare.png`

```text
Frame count: EXACTLY 4 complete separate characters in a SINGLE horizontal row.
Taro, same brown mole druid. Remove entire root staff including seed crystal in every frame, magical roots/dirt effects. Keep costume and head sprout. Four unchanged poses: raising invisible staff overhead with closed paw, stamping invisible staff down, paws spread commanding earth, leaning forward proudly with empty closed staff-grip paw.
```
