# Puff Slayers — Image Generation Prompts (v0.2)

> ⚠️ **ชุดใหม่ (v2) สำหรับมุมมองแผนที่ + เอฟเฟกต์แยกชิ้น: [art-prompts-v2.md](art-prompts-v2.md)** — ไฟล์นี้เก็บไว้เป็นอ้างอิง (ข้อ 7 ฉากหลังยังใช้ได้)

> ทิศทางภาพใหม่: **แอ็กชันไอเดิลอนิเมะ 2.5D** มุมกล้องเฉียงทแยง เอฟเฟกต์สกิลจัดเต็ม (ไฟ ฟันเป็นวงแสง ตัวเลขดาเมจใหญ่)
> แต่ตัวละครเป็น **สัตว์กลมฟูตัวจิ๋ว** — ความตลกและเสน่ห์มาจาก "ตัวกลมน่ารัก ที่ปล่อยท่าอลังการเกินตัว"
>
> Prompt เขียนเป็นภาษาอังกฤษ (โมเดลสร้างภาพเข้าใจดีกว่า) ใช้ได้กับ Midjourney / Niji Journey, ChatGPT (GPT-image), Flux, SDXL
> ⚠️ ไม่ใส่ชื่อเกมอื่นใน prompt — บรรยายลักษณะภาพแทน เพื่อให้ได้งานที่เป็นของเราเอง ไม่ลอกแบรนด์ใคร

---

## 0. วิธีใช้ให้ภาพออกมาเป็นชุดเดียวกัน

1. **สร้าง Style Anchor ก่อน** (ข้อ 1) เลือกภาพที่ชอบที่สุด 1–3 ภาพ เก็บไว้เป็นภาพอ้างอิง
2. ทุก prompt ต่อจากนี้ **ต่อท้ายด้วย `[STYLE]`** (ข้อความในข้อ 1) และแนบภาพอ้างอิง
   - Midjourney/Niji: `--sref <url ภาพ style>` และ `--cref <url ตัวละคร>` (หรือ `--oref` ใน v7) เพื่อคุมตัวละครให้หน้าเหมือนเดิม
   - ChatGPT: อัปโหลดภาพอ้างอิงแล้วบอกว่า "match this exact art style and character design"
   - Flux/SDXL: ใช้ seed เดิม + IP-Adapter หรือเทรน LoRA จากภาพที่เลือกแล้ว 15–30 ภาพ
3. **ตัวละครทำ Character Sheet ก่อน** แล้วค่อยเอาไปใส่ฉากต่อสู้
4. Asset ที่จะใช้ในเกมจริง (ตัวละคร/ไอเทม/เอฟเฟกต์) → สั่ง **พื้นหลังสีเรียบ** แล้วค่อยลบพื้นหลังทีหลัง
5. Niji Journey (`--niji 6`) เข้ากับสไตล์นี้ที่สุด ลองก่อน

---

## 1. Style Anchor — `[STYLE]`

```
2.5D anime mobile game art, chibi proportions, glossy cel-shading with soft rim light,
vibrant saturated colors, thick clean lineart, dynamic diagonal camera angle,
high-energy skill effects with glowing slashes, fire trails, light arcs and sparkles,
bold stroked damage numbers popping out, premium idle RPG gacha game quality,
crisp readable silhouettes, cute but epic
```

**Negative prompt** (สำหรับ SDXL/Flux หรือใส่ `--no` ใน Midjourney)
```
realistic, photo, 3d render plastic, horror, gore, blood, dark gritty, muddy colors,
extra limbs, deformed paws, text artifacts, watermark, logo, blurry, low contrast
```

---

## 2. ภาพหน้าจอเกม (Key Visual สำหรับขายไอเดีย)

### 2.1 ฉากต่อสู้ Idle — ใกล้เคียงภาพตัวอย่างที่สุด
```
In-game screenshot of a mobile idle RPG battle, vertical 9:16.
A squad of five tiny round fluffy animal heroes — a chubby hamster knight, a round shiba inu
swordsman with a carrot-shaped blade, a white bunny archer, a hamster healer holding a glowing
mochi staff, a shiba mage with bubble wand — charging diagonally from bottom-left to top-right
against cute grumpy flower monsters (daisy, tulip, sunflower creatures with pouty faces).
The shiba unleashes a massive flaming crescent slash, orange-gold fire arc sweeping across the screen,
feathers and flower petals bursting, soap bubbles exploding into glitter,
huge stroked damage numbers "4960" "2625" "497" floating in red and yellow,
green healing numbers, speed lines, screen-shake energy.
Pastel meadow battlefield seen from a high 3/4 angle.
Minimal game UI: auto-battle toggle top-left, round hero portrait skill buttons at the bottom.
[STYLE] --ar 9:16 --niji 6
```

### 2.2 เวอร์ชันแนวนอน (Desktop / Web)
```
Wide in-game screenshot of a browser idle RPG, 16:9. Round fluffy animal heroes
(hamsters, bunnies, shiba inus) in cute armor fighting chubby flower monsters on a diagonal
battlefield in a candy-colored flower garden. A giant soap bubble ultimate traps three flower enemies,
lightning-bright rainbow burst, damage numbers flying, combo text "FLUFFY x3!".
Side panel UI with team list and loot log, skill bar with circular hero portraits and glowing ready rings.
[STYLE] --ar 16:9 --niji 6
```

### 2.3 Ultimate Cut-in (ภาพตัดเข้ามาตอนปล่อยท่าไม้ตาย)
```
Anime ultimate skill cut-in banner, a round chubby shiba inu warrior with a serious determined face
(funny because it is so round), red scarf flying, gripping a giant glowing carrot sword,
dramatic diagonal split frame, speed lines, fire embers, golden light burst behind,
katakana-style impact streaks, horizontal banner composition.
[STYLE] --ar 21:9 --niji 6
```

---

## 3. Character Sheets (เผ่า × อาชีพ)

**Template** — เปลี่ยนเฉพาะส่วนใน `<...>`
```
Character design sheet for a mobile game hero: <SPECIES DESCRIPTION>, class <CLASS>, <OUTFIT & WEAPON>.
Chibi body — almost perfectly round, tiny paws, huge sparkly eyes, rosy cheeks.
Front view, 3/4 view, back view, plus 3 expression heads (happy, angry-determined, sleepy)
and a small idle pose and attack pose. Plain light background, clean separated layout,
color palette swatches on the side.
[STYLE] --ar 3:2 --niji 6
```

**เผ่า (ใส่ใน `<SPECIES DESCRIPTION>`)**
| เผ่า | Description |
|------|-------------|
| Bunbun | `a round fluffy bunny with long floppy ears, one ear slightly bent, cotton-ball tail` |
| Hamham | `a perfectly round chubby hamster with big puffy cheeks stuffed with snacks, tiny round ears` |
| Shibu | `a round bread-loaf shaped shiba inu with a curly tail, cream muzzle and proud smug expression` |

**อาชีพ (ใส่ใน `<CLASS>` และ `<OUTFIT & WEAPON>`)**
| อาชีพ | Outfit & Weapon |
|-------|-----------------|
| Pillow Guard (tank) | `wearing a pot-lid helmet and quilted armor, carrying a giant fluffy pillow as a shield` |
| Carrot Knight (melee) | `light samurai armor with a flowing red scarf, wielding a glowing carrot-shaped greatsword` |
| Seed Sniper (ranged) | `leaf-hooded ranger cloak and aviator goggles, a slingshot crossbow firing sunflower seeds` |
| Bubble Mage (AoE) | `a wizard hat shaped like an ice cream cone, starry robe, a magic bubble wand` |
| Mochi Cleric (healer) | `white-and-pink priest robe, halo made of dango, a staff topped with a glowing mochi` |
| Bell Bard (buff) | `festival outfit with ribbons, bells tied to ears/tail, a pancake drum and golden handbell` |

**ตัวอย่างเต็ม — Tofu (Shibu × Carrot Knight)**
```
Character design sheet for a mobile game hero: a round bread-loaf shaped shiba inu with a curly tail,
cream muzzle and proud smug expression, class Carrot Knight, light samurai armor with a flowing
red scarf, wielding a glowing carrot-shaped greatsword. Chibi body — almost perfectly round,
tiny paws, huge sparkly eyes, rosy cheeks. Front view, 3/4 view, back view, plus 3 expression heads
(happy, angry-determined, sleepy) and a small idle pose and attack pose. Plain light background,
clean separated layout, color palette swatches on the side.
[STYLE] --ar 3:2 --niji 6
```

**ฮีโร่ระดับ Legend (★6) — ใส่รายละเอียดพิเศษเพิ่ม**
```
... legendary rarity: ornate gold-and-rainbow trims, floating glowing particles around the body,
a small aura halo, more elaborate outfit layers, iconic silhouette
```

---

## 4. ศัตรูดอกไม้

### 4.1 Monster Sheet (ลูกกระจ๊อก)
```
Enemy design sheet for a cute idle RPG: chubby flower monsters with pouty grumpy faces and tiny leaf
arms — a sleepy daisy, a tiny tulip bouncer, a sunflower that spits seeds, a lavender nurse with a
leaf cross, a round cactus with soft spikes. Each shown front and 3/4 view, idle and attack pose,
hit reaction turning into floating seeds instead of dying. Plain background.
[STYLE] --ar 3:2 --niji 6
```

### 4.2 Boss — Queen Rafflesia
```
Raid boss design for a cute idle RPG: Queen Rafflesia, a giant plump rafflesia flower queen
with a golden petal crown, dramatic but adorable pouting face, royal vine cape, surrounded by
orbiting rose-petal shields, towering over tiny round hamster and bunny heroes for scale.
Menacing-cute, magenta and gold palette, glowing pollen storm.
[STYLE] --ar 4:5 --niji 6
```

---

## 5. Skill VFX (เอฟเฟกต์สกิล)

**Template** — ใช้ทำ reference ให้คนทำ VFX / sprite sheet
```
Game skill VFX concept sheet on a dark plain background: <EFFECT>, shown in 4 stages
(wind-up, impact, burst, fade-out), stylized anime effects, clean shapes readable at small size,
additive glow. [STYLE] --ar 16:9 --niji 6
```

| สกิล | `<EFFECT>` |
|------|-----------|
| Carrot Crescent | `a flaming orange-gold crescent sword slash with carrot-leaf sparks and ember trails` |
| Ultimate Roll | `a giant rolling hamster ball trail of fluffy fur puffs and dust clouds, star impacts` |
| Bubble Bye-bye | `huge rainbow soap bubbles trapping targets, then popping into glitter and tiny hearts` |
| Seed Gatling | `rapid stream of glowing sunflower seeds with tracer lines and popcorn-like hit bursts` |
| Mochi Rain | `soft pink healing mochi falling from sky, squishing into green healing sparkles` |
| Bear Hug Festival | `golden music notes, bells and confetti swirling in a party aura buff ring` |
| Sleepy (status) | `a floating "Zzz" with a snot bubble and drowsy purple mist` |
| Sticky (status) | `dripping golden honey slowing effect with cute bee sparkles` |

---

## 6. ไอเทม & Rarity (7 Tier)

### 6.1 Icon Sheet
```
Game item icon sheet, 4x4 grid, each icon centered on its own rarity frame: carrot greatsword,
fluffy pillow shield, golden handbell, dango staff, bubble wand, beanie helmet, plush charm,
sunflower seed pouch. Glossy chibi fantasy style, thick outline, readable at 64px.
[STYLE] --ar 1:1 --niji 6
```

### 6.2 Rarity Frames
```
Set of 7 game item rarity frames in a row, rounded square badges:
1 cream cotton plain frame, 2 mint green fluffy fur-trimmed frame, 3 silky sky-blue frame with sheen,
4 lavender dreamy frame with floating stars, 5 golden peach starry frame with sparkles,
6 rainbow "mythic puff" frame with iridescent bouncy fur trim and rainbow dust,
7 cosmic galaxy frame with deep navy nebula and glittering stars.
Game UI asset, flat background. [STYLE] --ar 7:1
```

---

## 7. ฉากหลัง (Battlefield Map) — มุมมองแผนที่มุมสูง

> อ้างอิงองค์ประกอบ: สนามมองจากมุมสูงเกือบ top-down (≈55–60°), ตัวละครตัวจิ๋ว ≈5% ของความสูงภาพ
> ขนาด 9:16 (เช่น 941×1672) — เกมวางสนามเล่นไว้ช่วง **28%–76% ของความสูงภาพ** (y 270–730 จาก 960, ปรับได้ที่ `ARENA` ใน packages/sim/src/data.ts)

**โครงภาพที่ต้องได้ (สำคัญกว่า style):**
| โซน (จากบนลงล่าง) | สัดส่วน | เนื้อหา |
|---|---|---|
| ขอบฟ้า / ฉากไกล | 0–25% | ภูเขา ปราสาท ต้นไม้ไกลๆ หมอกจางๆ (ศัตรูเดินมาจากทางนี้) |
| **สนามเล่น** | 25–80% | พื้นโล่งกว้าง เรียบ อ่านง่าย มีรายละเอียดเล็กๆ (หญ้า หิน ทางเดินจางๆ) ไม่มีของใหญ่บัง |
| ฉากหน้า (frame) | 80–100% | กิ่งไม้/พุ่มไม้/หินสีเข้มเบลอเล็กน้อย บังขอบล่าง (ตรงนี้ UI portrait จะวางทับ) |

**Template** — เปลี่ยนเฉพาะ `<BIOME>` และ `<MOOD>`
```
Top-down battlefield map for a mobile idle RPG, vertical 9:16, seen from a high camera
looking down at about 55 degrees, no characters, no UI, no text.
Composition: distant horizon with <BIOME> landmarks and soft mist in the top quarter;
a wide open, mostly flat and readable ground area filling the middle of the image
with small-scale details only (tiny grass tufts, pebbles, cracked stone tiles, faint dirt paths),
everything scaled for tiny chibi characters about 5% of the image height;
dark slightly blurred foreground silhouettes (branches, bushes, rocks) framing the bottom edge.
<MOOD> lighting, painterly HD anime game background with subtle pixel-art texture,
soft ambient occlusion, cohesive limited palette.
[STYLE] --ar 9:16 --niji 6
```
**Negative:** `characters, giant flowers in the foreground, close-up props, diagonal road dominating the frame, text, UI, blurry center`

| Chapter | `<BIOME>` | `<MOOD>` |
|---------|-----------|-----------|
| 1 Meadow of Naps | `rolling pastel flower meadows, a far windmill and waterfall cliffs` | `soft sunny afternoon` |
| 2 Tulip Town | `a distant tulip village with cookie-roof houses and a clock tower` | `warm golden morning` |
| 3 Sunflower Desert | `sand dunes, towering sunflowers on the horizon, a sandstone arch` | `hot bright noon with heat haze` |
| 4 Lotus Lagoon | `a misty lagoon with lotus pads, stone bridges and lanterns far away` | `blue twilight with fireflies` |
| 5 Moonflower Night | `ruined garden arches, dead trees and a huge moon in fog` | `moody violet night, cold mist` |
| 6 Candy Orchid Castle | `a candy castle with lollipop towers and syrup falls in the distance` | `pink dreamy sunset` |

> เมื่อได้ภาพแล้ว วางไฟล์ทับใน `assets/generated/backgrounds/` ชื่อเดิม แล้วรัน `npm run sprites`

---

## 8. Mini Mode ตกปลา (Puff Pond)
```
Cozy fishing mini-game scene, vertical 9:16: a chubby hamster wearing sunglasses sitting on a
wooden dock at a moonlit lotus lagoon, holding a bamboo fishing rod bending hard,
a glowing golden koi leaping out of the water with splash and sparkles,
fishing tension meter UI with green zone at the bottom, fireflies, reflection of the moon.
[STYLE] --ar 9:16 --niji 6
```

---

## 9. Co-op & PvP

### 9.1 Co-op Raid (ลงดันกับเพื่อน)
```
Co-op raid battle key art: three squads of round fluffy animal heroes (hamsters, bunnies, shibas)
with player name tags above, attacking a giant Queen Rafflesia flower boss together,
all ultimates firing at the same moment — fire slash, bubble storm, seed barrage —
merging into one huge rainbow explosion labeled "PUFF PILE x2", epic diagonal composition.
[STYLE] --ar 16:9 --niji 6
```

### 9.2 PvP Arena
```
PvP arena versus screen for a cute idle RPG: two teams of round fluffy animal heroes facing off
in a pillow-fight coliseum, split diagonal VS layout with red and blue sides,
feathers exploding everywhere, rank badge "Cloud Tier" in the center, dramatic lighting.
[STYLE] --ar 16:9 --niji 6
```

---

## 10. Logo & App Icon
```
Game logo "PUFF SLAYERS", chunky bouncy rounded letters made of fluffy fur and marshmallow,
a tiny round shiba holding a carrot sword peeking over the letters, flower petals and sparkles,
gold outline with pink and cream colors, transparent-style plain background.
[STYLE] --ar 3:1 --niji 6
```
```
Mobile app icon: close-up of a round fluffy hamster warrior with puffy cheeks and a tiny helmet,
fierce-but-cute expression, orange fire slash behind, bold rounded square composition,
high contrast, readable at small size. [STYLE] --ar 1:1 --niji 6
```

---

## 11. Checklist ก่อนส่งให้นักวาด / ใช้ในเกมจริง
- [ ] เลือก Style Anchor ได้แล้ว 1 แบบ และทุกภาพใช้ `--sref` เดียวกัน
- [ ] ตัวละครหลักทุกตัวมี Character Sheet ก่อนเอาไปใส่ฉาก
- [ ] ภาพจาก AI ใช้เป็น **concept/reference** — asset ในเกมจริง (sprite, Spine rig) ควรให้นักวาดทำ/เกลาใหม่ เพื่อความสม่ำเสมอ ขยับได้ และลิขสิทธิ์ชัดเจน
- [ ] ตรวจเงื่อนไขการใช้เชิงพาณิชย์ของเครื่องมือที่ใช้ (เช่น Midjourney ต้องใช้แพ็กเกจที่ให้สิทธิ์เชิงพาณิชย์)
