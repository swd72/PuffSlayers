# Puff Slayers — Art & VFX Prompts v2 (Top-down Map View)

> ออกแบบใหม่ทั้งชุด ไม่อ้างอิงภาพเก่า (v1 เก็บไว้ที่ [art-prompts.md](art-prompts.md))
> เป้าหมาย: ภาพที่ **เอาไปทำเกมได้จริง** ในมุมมองแผนที่มุมสูง ตัวละครตัวจิ๋ว (~70px บนจอ 960px)
> และเอฟเฟกต์ที่ **เดินทางได้** (ออกจากตัว → วิ่งไปหาเป้า → กระแทก → ทิ้งร่องรอย) ไม่ใช่ก้อนเดียวระเบิดอยู่กับที่

---

## 0. หลักคิดของชุด v2

### 0.1 ทำไมภาพเก่าทำเกมแล้วไม่อลังการ
ภาพ key visual สวยเพราะ **ทุกอย่างอยู่ในภาพเดียว** — แสง, ทิศทาง, speed line, ตัวละครกำลังพุ่ง
แต่ asset ที่ได้เป็น "ก้อนเอฟเฟกต์ 4 เฟรม" วางที่จุดเดียว → เกมเลยได้ก้อนแสงกระจุกตัว
v2 จึงแยกเอฟเฟกต์ทุกท่าเป็น **5 ชิ้นส่วน** ที่เอนจินนำไปประกอบและเคลื่อนที่เอง:

| ชิ้นส่วน | หน้าที่ | ตัวอย่าง |
|---|---|---|
| **Origin** (จุดเริ่ม) | แสงวาบที่ตัวละคร/ปาก/ธนู/ไม้เท้า | ประกายตอนปล่อยสายธนู, ควันพ่นจากแก้ม |
| **Projectile** (ตัววิ่ง) | สิ่งที่เดินทางไปหาเป้า หมุน/ส่ายได้ | ลูกศรใบไม้, เมล็ด, ฟองสบู่, โมจิ |
| **Trail** (หาง) | เส้นทาง/หางที่ลากตามหลัง | หางแสงลูกศร, รอยฟันดาบ |
| **Impact** (กระแทก) | เล่นตอนโดนเป้า | ระเบิดใบไม้, ฟองแตก |
| **Aftermath** (ร่องรอย) | สิ่งที่ค้างบนพื้น/บนตัวเป้า | รอยไหม้, วงเวทย์, สถานะติดฟอง |

### 0.2 กฎภาพสำหรับมุมมองแผนที่
- **มุมกล้อง:** มองลงจากด้านบน ~55° (เห็นหัวและไหล่มากกว่าเห็นหน้าตรง) — ทุกภาพต้องมุมเดียวกัน
- **อ่านออกที่ 70px:** silhouette ชัด, เส้นขอบหนา, สีประจำอาชีพเด่น, อาวุธใหญ่เกินตัว (จะได้เห็น)
- **หันขวาเสมอ** (เอนจินกลับด้านเองตอนเดินซ้าย)
- **ตัวละคร/ของ:** พื้นหลัง **สีเทาอ่อนเรียบ (#E8E8E8) ไม่มีเงาบนพื้น** — สคริปต์ `npm run sprites` ตัดพื้นหลังให้
- **เอฟเฟกต์ทั้งหมด:** พื้นหลัง **ดำสนิท (#000000)** — เกมเอาส่วนดำออกและเล่นแบบ additive (เรืองแสง)
- **วงบนพื้น (decal):** วาดเป็น **วงรีตามมุมมอง 55°** ไม่ใช่วงกลมหน้าตรง
- **Sheet หลายเฟรม:** เรียง **แถวเดียวแนวนอน ระยะห่างเท่ากัน ขนาดเท่ากัน ตำแหน่งฐานเท่ากัน**

---

## 1. Style Anchors

> **ลุคหลักของเกม (ผู้ใช้กำหนด):** ทุกภาพใช้โทน **Japanese anime movie / hand-painted cinematic** — `[SCENE STYLE]` ข้อ 13 สำหรับฉาก, `[PAINTED VFX]` สำหรับเอฟเฟกต์ของทึบ, `[MOVE STYLE]` ข้อ 14 สำหรับท่าสกิล (ทั้งสามมีคำชุดเดียวกัน: painterly, visible brush texture, golden-hour peach-orange highlights, teal-blue shadows, not photorealistic, not 3D) · `[STYLE]`/`[VFX STYLE]` ด้านล่างเป็นชุดเดิม — ถ้าทำภาพใหม่ให้ต่อท้ายด้วยบรรทัดสไตล์ภาพยนตร์ด้วย

### `[STYLE]` — ใช้กับตัวละคร, ศัตรู, ฉาก
```
2.5D anime mobile idle RPG art, high top-down camera at about 55 degrees, tiny chibi
proportions with an oversized head, bold clean dark outlines, glossy cel shading with soft rim
light, saturated fantasy colors, strong readable silhouette at very small size, premium quality
```

### `[VFX STYLE]` — ใช้กับเอฟเฟกต์ทุกชิ้น
```
anime fantasy game VFX, hand-painted cel-shaded energy, sharp bright core with soft colored glow,
dynamic swooshing shapes, sparkles and small particles, isolated on a pure black background,
no characters, no text, centered, game asset
```

### `[SHEET]` — ต่อท้ายเมื่อเป็น sprite sheet
```
sprite sheet, single horizontal row, frames evenly spaced with equal size and identical baseline,
consistent design across frames, nothing overlapping between frames
```

> Midjourney/Niji: ใช้ `--sref` ภาพ style ที่เลือก + `--cref`/`--oref` ภาพตัวละครเพื่อล็อกหน้าตา
> ChatGPT (GPT-image): อัปโหลดภาพอ้างอิงแล้วบอก *"keep exactly this character design and art style"*

---

## 2. ตัวละคร (Heroes) — ออกแบบใหม่

### 2.1 เผ่า (Species) — ใส่ใน `<SPECIES>`
| เผ่า | Description | ลักษณะเด่นที่ต้องเห็นจากมุมบน |
|---|---|---|
| **Bunbun** | `a round snow-white bunny with very long upright ears tipped in pink, cotton-ball tail` | หูยาวชี้ขึ้น = silhouette จำง่ายที่สุด |
| **Hamham** | `a perfectly round golden hamster with huge puffy cheeks, tiny round ears, cream belly` | แก้มป่องสองข้าง (ใช้พ่นเมล็ด!) |
| **Shibu** | `a round fluffy shiba inu with pointed triangle ears, cream face mask, curly tail on top` | หูสามเหลี่ยม + หางม้วนบนหลัง |

### 2.2 อาชีพ (Class) v2 — ใส่ใน `<CLASS>`
| อาชีพ | บทบาท | สีหลัก | Outfit & Weapon (prompt) |
|---|---|---|---|
| **Pillow Guard** | Tank | น้ำเงิน | `blue quilted armor with a pot-lid helmet, carrying a huge round pillow shield with a paw emblem` |
| **Carrot Knight** | Melee DPS | ส้มแดง | `red scarf and light samurai armor, wielding an oversized glowing carrot greatsword taller than itself` |
| **Leaf Archer** *(แทน Seed Sniper)* | Ranged DPS | เขียว | `green leaf hood and cape, a large curved bow made of a living vine, quiver of leaf-fletched arrows` |
| **Bubble Mage** | AoE / Control | ฟ้า-ม่วง | `starry indigo robe and an ice-cream-cone wizard hat, a wand with a giant soap bubble floating at its tip` |
| **Mochi Cleric** | Healer | ทอง-ขาว | `white and gold priest robe, a halo of three dango, a staff topped with a glowing pink mochi` |
| **Bell Bard** | Buff | ชมพู | `festival coat with ribbons, a big golden handbell and a small pancake drum on the hip` |

**พลังเผ่า (species skill) — ใช้ได้ทุกอาชีพของเผ่านั้น**
- **Hamham — Cheek Cannon:** อมเมล็ดแก้มป่อง แล้ว **พ่นเมล็ดรัวออกจากปาก** (ท่าพ่นทั้งหมดออกจากปากตามที่ต้องการ)
- **Bunbun — Moon Hop:** กระโดดหลบไกล ทิ้งเงาแสงจันทร์
- **Shibu — Much Wow Howl:** หอนบัฟคริติคอล มีวงคลื่นเสียงออกจากปาก

### 2.3 Model Sheet (ทำก่อน เพื่อล็อกหน้าตา)
```
Character model sheet of a mobile game hero: <SPECIES>, class <CLASS NAME>, <OUTFIT & WEAPON>.
Shown from a high top-down camera at 55 degrees: facing right 3/4 view, facing away 3/4 view,
and a small front view, plus a close-up head with three expressions (determined, happy, sleepy).
Main color accent <CLASS COLOR>. Plain flat light gray background, no floor shadow.
[STYLE]
```

### 2.4 Pose Set (ใช้ทำเกมจริง) — 6 ท่า ในแถวเดียว
```
<SPECIES>, <CLASS NAME>, <OUTFIT & WEAPON>, same character as the reference.
Six game poses facing right, seen from a high top-down camera at 55 degrees:
1 idle, 2 running mid-stride, 3 attack wind-up, 4 attack release, 5 casting ultimate with a
glowing weapon, 6 knocked back hurt. Plain flat light gray background, no floor shadow.
[STYLE] [SHEET]
```
> เอนจินจะสลับท่าตามสถานะ + ใส่ tween (เด้ง/เอียง/ยืด) ระหว่างท่า — ไม่ต้องมีเฟรมเดินครบทุกเฟรม

### 2.5 ท่าเฉพาะอาชีพ (Signature Poses) — แถวเดียว 4 ท่า
| อาชีพ | Prompt ต่อท้าย pose set |
|---|---|
| Carrot Knight | `four poses for a leaping slash: crouch to jump, high in the air with sword raised overhead, spinning mid-air, slamming down with the sword buried in the ground` |
| Leaf Archer | `four poses: drawing the bow, full draw aiming, releasing with the string snapping, aiming straight up at the sky` |
| Bubble Mage | `four poses: twirling the wand, blowing a bubble through the wand, both arms up conjuring, pointing the wand forward` |
| Pillow Guard | `four poses: bracing behind the shield, curling into a fluffy ball, rolling ball with motion smear, bouncing up from a ground slam` |
| Mochi Cleric | `four poses: raising the staff, tossing a mochi underhand, praying with eyes closed, both arms up to the sky` |
| Bell Bard | `four poses: ringing the bell high, drumming, spinning dance, jumping with the bell` |
| *(Hamham ทุกอาชีพ)* | `two extra poses: cheeks puffed full of seeds, spitting seeds forward from the mouth with cheeks squeezing` |

---

## 3. ศัตรู & บอส (Flower Kingdom) — ออกแบบใหม่

### 3.1 ลูกกระจ๊อก — Pose set 4 ท่า ต่อ 1 ชนิด
```
<ENEMY>, a cute grumpy flower monster enemy for a mobile idle RPG, same size as a chibi hamster
hero, seen from a high top-down camera at 55 degrees facing left.
Four poses in a row: idle sway, hopping walk, attack lunge, hit squish.
Plain flat light gray background, no floor shadow. [STYLE] [SHEET]
```
| ชนิด | `<ENEMY>` | พฤติกรรมในเกม |
|---|---|---|
| Daisy Dozer | `a sleepy white daisy with droopy petals and a pouty face` | ประชิด ช้า |
| Tulip Pip | `a tiny angry red tulip bud on two leaf feet` | ประชิด เร็ว มาเป็นฝูง |
| Sunflower Spitter | `a chubby sunflower with a seed-covered face and puffed cheeks` | **พ่นเมล็ดออกจากปาก** (ระยะไกล) |
| Lavender Nurse | `a lavender sprig with a tiny nurse cap and leaf hands` | ฮีลพวก ต้องตีก่อน |
| Cactus Cuddle | `a round cactus with soft spikes and a flower on top, arms crossed` | ถึก สะท้อนดาเมจ |
| Honey Bud *(ใหม่)* | `a golden flower bud dripping honey, carrying a tiny honey pot` | ปาน้ำผึ้ง ทำให้ช้า |

### 3.2 บอส (1 ตัวต่อด่านบอส + เรียกลูกสมุน)
**Model sheet**
```
Boss monster for a mobile idle RPG: <BOSS>, about three times the size of a chibi hero,
seen from a high top-down camera at 55 degrees, intimidating but cute, glowing eyes,
readable silhouette. Front view and 3/4 view. Plain flat light gray background.
[STYLE]
```
**Pose set (6 ท่า)**
```
<BOSS>, same design as the reference. Six poses facing left in a row: idle breathing,
roaring with head up, summoning with vines bursting upward, slamming a giant vine down,
hurt recoil, defeated wilting. Plain flat light gray background. [STYLE] [SHEET]
```
| บอส | `<BOSS>` | ท่าพิเศษ |
|---|---|---|
| Queen Rafflesia | `a giant rafflesia flower queen with spotted crimson petals, a golden crown, thorny vine arms` | เรียก Tulip Pip จากดิน, ฟาดเถาวัลย์เป็นแนวยาว |
| Sunflower Colossus | `a huge sunflower golem with a stone flowerpot body and a blazing sun face` | ยิงเมล็ดยักษ์เป็นพัด, เรียก Sunflower Spitter |
| Lotus Moon Sage | `a floating lotus spirit with a crescent moon halo and long petal sleeves` | วางวงน้ำ (telegraph) แล้วระเบิด, เรียก Daisy |

**เอฟเฟกต์ของบอส** (พื้นดำ, `[VFX STYLE]`)
| ไฟล์ | Prompt |
|---|---|
| `boss-summon` [SHEET 4] | `vines and roots bursting out of cracked earth in a spiral, glowing magenta spores, a small flower monster sprouting from the center, top-down 55 degree view` |
| `boss-telegraph` | `a red warning circle decal on the ground in 55 degree perspective (flattened ellipse), thorny rim, pulsing inner glow` |
| `boss-vine-slam` [SHEET 4] | `a giant thorny vine whipping down and slamming the ground, dust and petals exploding, top-down 55 degree view` |

---

## 4. เอฟเฟกต์สกิล v2 — แยกชิ้นตามลำดับท่า

> ทุก prompt ต่อท้ายด้วย `[VFX STYLE]` · sheet ใส่ `[SHEET]` · ทิศทางทุกชิ้น **ชี้ไปทางขวา**
> ชื่อไฟล์ = ชื่อที่เอนจินจะใช้ ให้วางใน `assets/generated/vfx2/`

### 4.1 Carrot Knight — ตีปกติ & **Carrot Crescent** (กระโดดฟัน)
**ลำดับท่า:** ย่อตัว → กระโดดโค้งขึ้นไปหาเป้า (เงาบนพื้นเล็กลง) → หมุนกลางอากาศ → ฟันลงพร้อมรอยพระจันทร์ไฟ → คลื่นไฟพุ่งไปตามพื้น → ระเบิด → รอยไหม้
| ไฟล์ | ชิ้นส่วน | Prompt |
|---|---|---|
| `knight-slash-small` [SHEET 3] | Trail (ตีปกติ) | `a short orange crescent sword smear, thin and fast, three frames from forming to fading` |
| `knight-leap-dust` | Origin | `a burst of dust and grass kicked up from a powerful jump, seen from above` |
| `knight-crescent-smear` [SHEET 4] | Trail | `a huge blazing crescent sword arc slashing downward, orange fire with a white-hot edge and carrot-leaf sparks, four frames: forming, full arc, stretched, dissipating` |
| `knight-firewave` | Projectile | `a low wave of fire racing forward along the ground, crescent shaped, trailing embers, side view pointing right` |
| `knight-impact` [SHEET 4] | Impact | `explosive fire slash impact, cross-shaped flash, flying embers and leaves, top-down 55 degree view` |
| `knight-scorch` | Aftermath | `a scorched crescent mark on grass with glowing embers, flat ground decal in 55 degree perspective` |

### 4.2 Leaf Archer — ลูกศร & **Leaf Storm** (ฝนลูกศร)
**ลำดับท่า (ตีปกติ):** ง้างธนู → **แสงวาบที่ธนู** → ลูกศรวิ่งออกจากตัวพร้อมหาง → โดนเป้า → ใบไม้แตกกระจาย
**ลำดับท่า (อัลติ):** เล็งขึ้นฟ้า → ยิงลูกศรแสงขึ้นไป → วงเป้าเขียวบนพื้น → ลูกศรหลายสิบดอกตกลงมาเป็นฝน → ใบไม้ระเบิดทั่ววง
| ไฟล์ | ชิ้นส่วน | Prompt |
|---|---|---|
| `archer-release` | Origin | `a small green flash of a bowstring release with a ring of leaves` |
| `archer-arrow` | Projectile | `a single glowing leaf-fletched arrow flying right, green energy tip, horizontal` |
| `archer-arrow-trail` | Trail | `a thin tapering streak of green light with a few tiny leaves, horizontal, fading to the left` |
| `archer-hit` [SHEET 3] | Impact | `a small burst of green leaves and light splinters from an arrow hit` |
| `archer-sky-arrow` | Projectile | `a bright arrow of green light shooting straight up with a long trail, vertical` |
| `archer-target-zone` | Aftermath | `a green target circle decal on the ground in 55 degree perspective with leaf runes` |
| `archer-rain` [SHEET 4] | Impact | `dozens of glowing leaf arrows raining down diagonally into the ground, impacts sprouting leaf bursts, top-down 55 degree view` |

### 4.3 Hamham — **Cheek Cannon** (พ่นเมล็ดจากปาก)
**ลำดับท่า:** แก้มป่อง (สั่น) → **ควันและเมล็ดพ่นออกจากปาก** → เมล็ดหลายเม็ดวิ่งเป็นพัด → โดนแล้วแตกเป็นเปลือก
| ไฟล์ | ชิ้นส่วน | Prompt |
|---|---|---|
| `cheek-spit-puff` [SHEET 3] | Origin (ติดที่ปาก) | `a cartoon spit puff cone blasting right out of a mouth, small cloud with seed husks and sparkles` |
| `seed-bullet` | Projectile | `a single spinning sunflower seed with a golden glow, pointing right` |
| `seed-trail` | Trail | `a short golden motion streak with seed husk flecks, horizontal, fading left` |
| `seed-pop` [SHEET 3] | Impact | `a sunflower seed cracking open on impact, husk shards and golden sparkles` |

### 4.4 Bubble Mage — ฟองลอย & **Bubble Prison**
**ลำดับท่า (ตีปกติ):** เป่าฟองจากไม้กายสิทธิ์ → ฟองลอยส่ายไปหาเป้าช้าๆ → ฟองแตกเป็นละอองน้ำ
**ลำดับท่า (อัลติ):** วงเวทย์ฟ้าใต้ตัว → ฟองยักษ์หลายลูกลอยกระจายออก → ฟองครอบศัตรูแต่ละตัว **(สถานะติดฟอง: ลอยขึ้น ขยับไม่ได้ 2 วิ)** → ฟองทั้งหมดแตกพร้อมกัน
| ไฟล์ | ชิ้นส่วน | Prompt |
|---|---|---|
| `bubble-blow` | Origin | `a swirl of small bubbles and sparkles puffing out from a wand tip` |
| `bubble-orb` | Projectile | `a single iridescent soap bubble with rainbow sheen and a tiny star inside, round` |
| `bubble-splash` [SHEET 3] | Impact | `a soap bubble popping into droplets and glitter` |
| `bubble-prison` [SHEET 3] | Aftermath (สถานะ) | `a giant iridescent bubble shell, empty inside so a monster can be placed within, wobbling, three frames` |
| `bubble-prison-burst` [SHEET 4] | Impact | `a giant bubble bursting violently, ring of droplets, rainbow shockwave, glitter` |
| `bubble-circle` | Aftermath | `a light blue magic circle decal with bubble runes, flat ellipse in 55 degree perspective` |

### 4.5 Pillow Guard — ตีโล่ & **Ultimate Roll**
**ลำดับท่า:** ม้วนตัวเป็นลูกบอล → กลิ้งพุ่งเป็นเส้นตรงผ่านศัตรู (ชนแล้วกระเด็น) → เด้งขึ้น → ทุบพื้นเป็นคลื่นกระแทก
| ไฟล์ | ชิ้นส่วน | Prompt |
|---|---|---|
| `guard-bash` [SHEET 3] | Impact (ตีปกติ) | `a blunt blue shield bash impact, star-shaped flash with fluffy feathers` |
| `guard-roll-trail` | Trail | `a long dust and fluff trail left by a fast rolling ball, horizontal, fading left, seen from above` |
| `guard-slam-ring` [SHEET 4] | Impact | `a ground slam shockwave ring in 55 degree perspective, blue energy, dust and pebbles thrown outward` |
| `guard-taunt` | Aftermath | `a pulsing blue shield-shaped aura ring on the ground in 55 degree perspective` |

### 4.6 Mochi Cleric — โยนโมจิ & **Mochi Rain**
**ลำดับท่า (ฮีล):** ยกไม้เท้า → โยนโมจิลอยโค้งไปหาเพื่อน → โมจิแปะเป็นประกายเขียว
**ลำดับท่า (อัลติ):** วงแสงทองบนฟ้า → โมจิเรืองแสงตกลงมาหาเพื่อนทุกตัว → แปะแล้วเป็นเสาแสงฮีล
| ไฟล์ | ชิ้นส่วน | Prompt |
|---|---|---|
| `mochi-orb` | Projectile | `a glowing pink mochi ball with a paw print, soft golden aura, round` |
| `mochi-splat` [SHEET 3] | Impact | `a soft mochi splatting into green healing sparkles and tiny hearts` |
| `holy-sky-ring` | Origin | `a golden halo portal glowing in the sky, seen from below at an angle, soft light rays` |
| `heal-pillar` [SHEET 3] | Aftermath | `a vertical beam of warm golden healing light with rising motes` |

### 4.7 Bell Bard — คลื่นเสียง & **Bear Hug Festival**
| ไฟล์ | ชิ้นส่วน | Prompt |
|---|---|---|
| `bard-soundwave` [SHEET 3] | Projectile | `concentric pink sound wave rings with music notes expanding outward, flat ellipse in 55 degree perspective` |
| `bard-giant-bell` [SHEET 4] | Impact | `a giant golden bell dropping from the sky and ringing, shockwave of notes and confetti` |
| `bard-aura` | Aftermath | `a warm golden buff aura swirl with small music notes, for placing under a character` |

### 4.8 สถานะ (Status) — วนลูป 3 เฟรม วางบนหัว/ตัวศัตรู
| ไฟล์ | Prompt |
|---|---|
| `status-sleepy` [SHEET 3] | `a floating purple "Zzz" with a snot bubble growing and shrinking` |
| `status-sticky` [SHEET 3] | `dripping golden honey puddle with tiny bees, flat decal in 55 degree perspective` |
| `status-burn` [SHEET 3] | `small cute orange flames flickering` |
| `status-stun` [SHEET 3] | `a ring of yellow stars spinning around, in 55 degree perspective` |

### 4.9 Hit ทั่วไป (ใช้ซ้ำได้ทุกตัว)
| ไฟล์ | Prompt |
|---|---|
| `hit-blunt` [SHEET 3] | `a small white impact star with cloth fluff puffs` |
| `hit-crit` [SHEET 3] | `a sharp critical hit flash, cross-shaped white and gold burst with speed lines` |
| `bonk-petals` [SHEET 4] | `a flower monster bursting into a swirl of pink and white petals and seeds, cute poof` |

---

## 4.10 ไอเทม อาวุธ ของแรร์ และสกิน (ดู GDD ข้อ 6)

### `[ICON]` — ต่อท้ายทุกไอคอน
```
game item icon, centered, three-quarter view, chunky readable silhouette at 64 px, bold dark outline,
glossy cel shading with soft rim light, cute fantasy style, plain flat light gray background, no frame, no text
```

### อาวุธ 7 Tier — **คนละดีไซน์ ไม่ใช่ของเดิมเปลี่ยนสี**
> ❌ แบบเก่า (แถวเดียว 7 ชิ้น + "same shape family") ทำให้ได้ของรูปทรงเดียวกันเปลี่ยนสีผูกโบว์ — **เลิกใช้**
> ✅ แบบใหม่: **สร้างทีละ Tier ทีละภาพ** แต่ละ Tier เป็น "ของคนละชิ้นที่มีเรื่องราว" ไต่จากของเก็บได้ข้างทาง → ของช่างทำ → ของวิเศษ → สิ่งมีชีวิต/ตำนาน → วัตถุจักรวาล
> สีของ Tier มาจาก **กรอบไอคอน** ในเกมอยู่แล้ว ตัวอาวุธไม่ต้องย้อมสีตาม Tier · ห้ามใส่โบว์/ริบบิ้นเป็นตัวแยก Tier

**บันไดดีไซน์ (ใช้กับทุกอาชีพ)**
| Tier | แนวคิด | ความรู้สึกที่อยากได้ |
|---|---|---|
| 1 Crumb | ของเก็บได้ข้างทาง ธรรมดามาก ดูขำๆ | "ของเริ่มต้น" |
| 2 Fluffy | ของทำเองที่บ้าน มีการดัดแปลง | "เริ่มจริงจัง" |
| 3 Silky | ของช่างทำ วัสดุดี มีลวดลาย | "ของจริงแล้ว" |
| 4 Dreamy | ของวิเศษ **มีชีวิต/เวทมนตร์เริ่มโผล่** | "เริ่มอยากได้" |
| 5 Starry | ของชั้นครู ประณีต มีสัตว์/วิญญาณประจำอาวุธ | "อยากโชว์" |
| 6 Mythic Puff | **กลายร่าง** เป็นสิ่งมีชีวิตในตำนาน | "ว้าว" |
| 7 Cosmic Cotton | วัตถุจากจักรวาล ฟิสิกส์แปลก ลอยได้ | "สุดทาง" |

**Template (1 ภาพต่อ 1 Tier)** — บันทึกเป็น `assets/generated/v2/items/weapons/<class>-t<1-7>.png`
```
Game item icon for a cute fantasy RPG: <TIER DESIGN>. A single object, centered, three-quarter view,
filling about 80% of the frame, unique silhouette, no ribbons unless described.
[ICON]
```

| Tier | 🌱 Root Druid (ไม้เท้า) | ⚔️ Carrot Knight (ดาบ) | 🏹 Leaf Archer (ธนู) |
|---|---|---|---|
| 1 | `a crooked bare twig with a single leaf` | `a wooden practice stick with a real carrot tied to the tip with string` | `a bent twig with a blade of grass as the bowstring` |
| 2 | `a forked branch wrapped in twine with a pinecone tied on top and tufts of moss` | `a hand-carved wooden sword painted orange, carrot-top leaves as the pommel, bandaged grip` | `a simple wooden shortbow with a braided vine string and a leaf tassel` |
| 3 | `a carved hazel walking staff with spiral grooves, an acorn charm hanging and a tiny bird nest in the fork` | `a real steel short sword with a carrot-shaped blade and a leaf crossguard` | `a bamboo recurve bow with feathers tucked into the grip wrap` |
| 4 | `a living sapling staff still growing roots at the bottom, new buds, a glowing dewdrop seed cradled in curled roots` | `a warm-glowing crystal carrot blade on a hilt of sprouting green vines` | `a living vine bow blooming flowers along its limbs, a string of glowing pollen` |
| 5 | `an ancient oak staff with a hollow holding a sleeping firefly spirit lantern, mushrooms on the bark, gold-glowing rune carvings` | `a knight's greatsword whose blade is a giant faceted carrot gem, rabbit crest on the guard` | `a golden ivy longbow with a hummingbird figurehead whose wings form the limbs` |
| 6 | `a world-tree sprout staff: a tiny blossoming tree crown on top shedding petals, roots braided like a coiled dragon, one rainbow fruit` | `a carrot dragon sword: the blade is a dragon made of carrot with a leafy mane, flame curling from its jaws` | `a bow made of two crescent moons of rainbow leaves with a string of light and a small wind spirit` |
| 7 | `a root of the cosmic world tree: translucent wood filled with nebula, roots ending in star tips, a planet seed orbited by tiny moons` | `a sword forged from a comet: a carrot-shaped meteor blade trailing sparks, a galaxy swirling in the core` | `a constellation bow: limbs drawn by glowing star-map lines, an aurora drawstring` |

| Tier | 🫧 Bubble Mage (ไม้กายสิทธิ์) | 🍡 Mochi Cleric (คทา) | 🛡️ Pillow Guard (โล่) | 🔔 Bell Bard (กระดิ่ง) |
|---|---|---|---|---|
| 1 | `a bent drinking straw with a drip of soap` | `a plain wooden skewer with one dango ball` | `a flat old cushion with a patch sewn on` | `a tin can with a pebble inside hanging from a string` |
| 2 | `a toy bubble-blower ring wand with a rubber duck charm` | `a bamboo stick with three dango and a paper fortune tag` | `a pot lid shield with a kitchen sponge strapped on the front` | `a dented cowbell on a leather strap` |
| 3 | `a silver wand with a blown-glass bubble orb and sea-glass inlay` | `a red lacquered shrine staff with dango and a small brass bell` | `a round wooden shield with a quilted front and a stitched paw emblem` | `a brass handbell engraved with music notes` |
| 4 | `a coral and pearl wand with bubbles swirling inside a crystal sphere where tiny fish swim` | `a staff crowned with a glowing mochi moon showing a rabbit silhouette, sakura petals drifting` | `a shield made of a solid puffy cloud with a small rainbow along the rim` | `a glass wind-chime bell with floating music notes and tiny flowers` |
| 5 | `a golden wizard scepter holding a floating bubble with a miniature snow-globe village inside` | `a golden temple scepter with a lotus holding a pearl mochi inside a halo ring` | `a golden tortoise-shell shield with a gem paw at its center` | `an ornate golden temple bell carved with clouds, a ruby clapper` |
| 6 | `a jellyfish staff: a glowing rainbow jellyfish bell on top trailing ribbon-like tentacles` | `a phoenix staff: a mochi egg resting in a nest of flaming rainbow feathers` | `a plush baby dragon curled up asleep into the shape of a round shield` | `a giant bluebell flower that rings with light, a tiny fairy sitting inside` |
| 7 | `a black-hole wand: a bubble containing a spiral galaxy, ringed by orbiting planets` | `a celestial staff: a cratered moon made of mochi orbited by star-shaped dango` | `a dream shield: a crescent-moon pillow of galaxy fabric with stars stitched in` | `a planet bell: a ringed planet as the bell with a small moon as the clapper` |

> pipeline ใช้ไฟล์ทีละ Tier ถ้ามี (ไม่งั้นใช้แผ่นแถวเดียวเดิม) — ทำทีละอาชีพได้เลย ไม่ต้องครบทีเดียว

### ชุดเกราะ / หมวก / Charm / Trinket — แผ่นละ 8 ชิ้น
```
Game item icon sheet, 4x2 grid, eight different <SLOT ITEMS>, cute fantasy style for round fluffy animal heroes,
mixed rarities from plain to legendary. [ICON]
```
| ช่อง | `<SLOT ITEMS>` |
|------|----------------|
| หมวก | `hats: pot-lid helmet, leaf hood, ice-cream wizard hat, dango halo, flower crown, knitted beanie, samurai kabuto, star tiara` |
| ชุด | `outfits: quilted armor, pajama onesie, picnic apron, starry robe, festival coat, leaf cape, samurai vest, cloud cloak` |
| Charm | `plush charms: tiny teddy, lucky clover pin, knitted scarf, moon pendant, seed pouch, bell keychain, star locket, honey jar` |
| Trinket | `small trinkets: acorn, pebble with a face, feather, candy, button, shell, marble, tiny key` |

### ของแรร์ (Named Relics) — ทำทีละชิ้น ให้ดูพิเศษที่สุด
```
Legendary unique game item icon: <RELIC>, a one-of-a-kind treasure with a small story feel,
dramatic glow and particles around it, [TIER LOOK of Mythic Puff or Cosmic Cotton]. [ICON]
```
| ชื่อ | `<RELIC>` |
|------|------------|
| Carrot Excalibur | `a legendary carrot greatsword stuck in a tiny stone, golden leaves, holy light` |
| Bottomless Cheek Pouch | `a magical hamster cheek pouch spilling endless glowing sunflower seeds` |
| Grandma's Knitted Scarf | `a cozy hand-knitted scarf with a heart patch, warm galaxy sparkles woven in` |
| Moonlit Lullaby Bell | `a silver crescent-moon bell with sleepy stars and soft music notes` |
| Sunflower Crown | `a crown made of tiny sunflowers with a sunstone at the front` |
| Lucky Clover Pin | `a four-leaf clover brooch with a tiny golden ladybug` |

### ไอเทมเสริม (Boosters) — แผ่นเดียว 6 ชิ้น
```
Game consumable icon sheet, 3x2 grid: a flower-shaped petal cookie, a cup of sleepy lavender tea with steam,
a glowing four-leaf clover, a pink revive mochi with a heart, a golden boss ticket, a fish onigiri. [ICON]
```

### วัตถุดิบเก็บได้ (Forage) — แผ่น 4×4 = 16 ชิ้น → `assets/generated/v2/items/ingredients-sixteen-icons.png`
> ของดรอปจากด่าน เอาไว้ **ให้พัฟกินก่อนเข้าด่าน** (ดู GDD 6.12) · ภาพอ้างอิงแนว "Alchemy Herbals" ใช้แค่เป็นอารมณ์ ห้ามลอก — ออกแบบใหม่ให้เป็นโลก Puff: **อ้วนกลม น่ากิน มีหน้าตาเล็กน้อยได้ในบางชิ้น** และแยกจากกันด้วย**รูปทรง**ไม่ใช่แค่สี
> **ลำดับในแผ่นสำคัญมาก** (ซ้าย→ขวา, บน→ล่าง) เกมจับคู่ตามลำดับนี้
```
Game item icon sheet, 4x4 grid of sixteen separate forage ingredients for a cute fantasy RPG where round fluffy
animals eat them before battle. Each item chunky and appetizing with a distinct silhouette, no background plates,
evenly spaced, nothing overlapping, in this exact order left to right, top to bottom:
1 a sprig of sweet clover with three round heart-shaped leaves and a tiny pink blossom,
2 a dandelion puffball with a few seeds drifting off,
3 a stubby sun-warmed carrot with bouncy leafy top and a sparkle,
4 a roasted sweet potato split open with golden steaming inside,
5 a small heap of striped sunflower seeds with one cracked open,
6 a glossy acorn with a knitted-looking cap,
7 a pair of pale bitter almonds with a faint green tint in a cracked shell,
8 a small bunch of dusky purple wild grapes on a curly vine,
9 a lemon drop with a drip of honey on top,
10 a halved forest avocado with a big round pit,
11 a purple wild onion bulb with tangled roots and green shoots,
12 a ridged cocoa pod split to show beans inside,
13 a cluster of glowing teal mushrooms with spots of light,
14 a chunk of honeycomb dripping amber honey,
15 a wriggly pink earthworm curled into a cute spiral with a leaf,
16 a legendary moon berry: a pale glowing berry with a crescent moon shine and floating sparkles.
[ICON]
```

### สกิน — ทำ Model Sheet + Pose Set แบบข้อ 2.3 / 2.4 โดยเปลี่ยน `<OUTFIT & WEAPON>`
| สกิน | `<OUTFIT & WEAPON>` (ใช้กับเผ่า/อาชีพเดิม) |
|------|---------------------------------------------|
| Pajama Pudding *(Hamham Guard)* | `cozy striped pajamas and a nightcap, hugging a giant star-shaped pillow shield` |
| Sakura Festival Momo *(Bunbun Cleric)* | `pink sakura kimono with a flower hairpin, a staff topped with a sakura mochi` |
| Pumpkin Knight Tofu *(Shibu Knight)* | `orange pumpkin armor and a jack-o-lantern helmet, a carrot sword glowing purple` |
| Rainbow Ranger Usagi *(Bunbun Archer)* | `rainbow cape and cloud hood, a bow made of a rainbow arc` |
| Snow Globe Kinako *(Shibu Mage)* | `winter robe with snowflakes, a wand with a snow globe instead of a bubble` |
| Bear King Mimi *(Hamham Bard)* **Legendary** | `a royal teddy bear costume with a crown and cape, a golden bear-shaped bell` |

> สกินอาวุธ / Aura: ใช้ template อาวุธด้านบน ระบุชื่อสกิน เช่น `a crystal carrot greatsword`
> กรอบไอคอน 7 Tier: ใช้ `items/rarity-frames.png` เดิมได้ หรือสร้างใหม่ให้แต่ละ Tier มี **ลายกรอบต่างกัน** (จุด, ขนฟู, ผ้าไหม, ดาว, อัญมณี, รุ้ง, กาแล็กซี)

---

## 5. ฉาก & Key Visual (มุมมองปัจจุบัน)

### 5.1 ฉากสนาม — ใช้ template ใน [art-prompts.md ข้อ 7](art-prompts.md) (ใช้ได้ดีแล้ว)
เพิ่ม: ฉากบอส 1 ภาพต่อ Chapter
```
Boss arena version of the same map: a circular clearing in the middle with cracked earth,
giant thorny vines at the edges and a darker dramatic sky, same top-down 55 degree camera,
no characters, no UI. [STYLE] --ar 9:16
```

### 5.2 Key Visual ใหม่ (ตรงกับมุมเกมจริง ใช้โปรโมท/Store)
```
Vertical 9:16 gameplay key art of a mobile idle RPG seen from a high top-down camera at
55 degrees. On a wide sunny meadow battlefield, a tiny squad of chibi heroes — a bunny archer
firing a green arrow with a light trail, a hamster spitting a fan of glowing seeds from its
puffed cheeks, a shiba knight leaping high with a blazing carrot sword, a hamster guard rolling
as a fluffy ball, a shiba mage sending iridescent bubbles that trap flower monsters inside —
fights a giant Queen Rafflesia boss at the top of the field while she summons tulip minions
from cracked earth. Clear readable action paths from each hero to the enemies, stroked damage
numbers, a green heal pillar, petals everywhere. Minimal UI: small portraits at the bottom.
[STYLE] --ar 9:16
```

---

## 6. สเปกการต่อสู้ที่ต้องทำในโค้ดควบคู่ (สำหรับทีม dev)

### 6.1 ท่าที่ต้องเคลื่อนที่จริง (แทนการวางเอฟเฟกต์ที่จุดเดียว)
| ท่า | สิ่งที่เอนจินต้องทำ |
|---|---|
| ลูกศร / เมล็ด / ฟอง / โมจิ | Projectile วิ่งจาก **จุดปล่อยบนตัว** (ธนู, ปาก, ปลายไม้) ไปหาเป้า — ลูกศรตรง, เมล็ดเป็นพัด, ฟองส่ายช้า, โมจิโค้ง |
| Carrot Crescent | กระโดดเป็นเส้นโค้ง (เงาเล็กลงกลางอากาศ) → ฟันลง → คลื่นไฟวิ่งต่อไปตามพื้น |
| Ultimate Roll | ตัวละครกลิ้งผ่านศัตรูเป็นเส้นตรง ชนแล้วศัตรูกระเด็น |
| Bubble Prison | ศัตรูในฟองลอยขึ้นและ **ขยับไม่ได้ 2 วิ** (สถานะจริงในระบบต่อสู้) แล้วฟองแตก |
| Leaf Storm | วงเป้าบนพื้นก่อน 0.4 วิ แล้วฝนลูกศรตกเป็นระลอก |

### 6.2 บอส & ความยากตามเลเวล
- **ด่านบอส:** บอส 1 ตัวกลางสนามด้านบน + เรียกลูกสมุน 3–5 ตัวทุก ~12 วิ (มีท่า summon ก่อน)
- **บอสมีท่าเตือน:** วงแดงบนพื้น 1 วิ ก่อนฟาด — ฮีโร่ที่อยู่ในวงโดนหนัก
- **เวลาที่ใช้ฆ่าขึ้นกับเลเวล:** เลือดมอนสเตอร์/บอสสูงขึ้นมาก ส่วนดาเมจฮีโร่ขึ้นกับ level
  - ลูกกระจ๊อก: ~6–10 วิ ต่อคลื่น เมื่อเลเวลทีม = เลเวลแนะนำของด่าน
  - บอส: ~45–90 วิ เมื่อเลเวลพอดี, เลเวลต่ำกว่าแนะนำ 10 → นานขึ้น ~2 เท่า และมีโอกาสแพ้
  - เลเวลสูงกว่ามาก → ฟาร์มเร็ว (เหมาะกับ idle)

---

## 7. ตัวใหม่: **Taro** — Molemo (ตุ่น) × Root Druid

> สายควบคุม: ตีปกติแล้ว **รอยแตกวิ่งไปตามพื้น → รากแทงขึ้นใต้ศัตรู** (มีโอกาสตรึง 1.2 วิ)
> อัลติ **Root Awakening:** ตบไม้เท้าลงพื้น → รอยแตกแตกแขนงไปหาศัตรูทุกตัว → รากแทงขึ้น 3 ระลอก (ใหญ่ขึ้นทุกครั้ง) → รากพันยกศัตรูลอย → **รากยักษ์ระเบิดขึ้นกลางกลุ่มแล้วฟาดลง** → ศัตรูติดสถานะ **Rooted 3 วิ** (เดินไม่ได้ แต่ยังตีสิ่งที่อยู่ในระยะได้)
> ตอนนี้ในเกมใช้ภาพชั่วคราว (ยืมแผ่นของ Mimi ย้อมสีน้ำตาล + เถาวัลย์ของบอสย้อมเขียว) — ทำภาพตามนี้แล้ว `npm run sprites` เกมจะสลับไปใช้ภาพจริงเอง

### 7.1 เผ่า + อาชีพ
| | Description |
|---|---|
| `<SPECIES>` Molemo | `a round chubby mole with velvety cocoa-brown fur, a big pink star-shaped nose, tiny squinty happy eyes, huge soft digging paws with little claws, a small sprout growing on its head` |
| `<CLASS>` Root Druid | `mossy green hooded poncho with woven bark trim, a gnarled root staff topped with a glowing seed crystal, tiny mushrooms and leaves on the shoulders` |
| สีหลัก | moss green `#8FBF3A` + brown |
| ลักษณะเด่นจากมุมบน | จมูกดาวชมพู + ต้นอ่อนบนหัว + ไม้เท้ารากสูงกว่าตัว |

### 7.2 ภาพที่ต้องทำ (ชื่อไฟล์ = ที่ pipeline รออยู่แล้ว)
| ไฟล์ | Template | สิ่งที่ใส่ |
|---|---|---|
| `assets/generated/v2/characters/molemo-root-druid-model.png` | 2.3 Model Sheet | ใช้ล็อกหน้าตาก่อน (ไม่เข้าเกม) |
| `assets/generated/v2/characters/molemo-root-druid-poses.png` | 2.4 Pose Set (6 ท่า) | ท่า 5 = `raising the root staff with the seed crystal blazing green` |
| `assets/generated/v2/characters/root-druid-signature.png` | 2.5 (4 ท่า) | `four poses: raising the root staff overhead, stamping the staff into the ground with a burst of dirt, both paws spread wide commanding the earth, leaning on the staff with a proud grin` |
| `assets/generated/v2/items/weapons/root-druid-t1.png` … `t7.png` | อาวุธ 7 Tier (ข้อ 4.10) | ดีไซน์แยกทีละ Tier ในตาราง Root Druid |

### 7.3 เอฟเฟกต์ (วางใน `assets/generated/vfx2/`)
**ลำดับท่า (ตีปกติ):** เคาะไม้เท้า → รอยแตกเล็กวิ่งไปตามพื้น *(เอนจินวาดเอง)* → **รากเล็กแทงขึ้นใต้ศัตรู**
**ลำดับท่า (อัลติ):** วงเวทเขียวใต้ตัว → ตบพื้น (ฝุ่น) → รอยแตกแตกแขนง *(เอนจินวาดเอง)* → รากแทงขึ้น 3 ระลอก → รากพันยกศัตรู → **รากยักษ์ระเบิดขึ้น** → วงกระแทกบนพื้น
| ไฟล์ | ชิ้นส่วน | Prompt |
|---|---|---|
| `druid-root-spike` [SHEET 4] | Impact (ใช้ทั้งตีปกติและอัลติ) | `a cluster of thick twisting tree roots bursting up out of cracked earth, dirt clods and green glowing sap sparks flying, four frames: ground cracking, roots shooting up, fully extended, sinking back, top-down 55 degree view` |
| `druid-root-erupt` [SHEET 4] | Impact (finisher) | `a colossal ancient tree root erupting from a glowing green fissure in the ground, spiraling upward like a pillar with moss and leaves, boulders and dirt blasting outward, four frames: fissure glowing, root bursting up, towering at full height, crashing down with a shockwave, top-down 55 degree view` |
| `druid-root-bind` [SHEET 3] | Aftermath (สถานะ Rooted — วนลูป) | `small tangled roots curling tightly around the base of a creature's feet with a faint green glow and tiny leaves, empty in the middle so a character can stand inside, flat ring in 55 degree perspective, three frames of gently squirming roots` |

> รอยแตกบนพื้นเอนจินวาดเป็นเส้นเรืองแสงให้อยู่แล้ว ไม่ต้องทำภาพ · ท่าที่ยังไม่มีภาพจะใช้ของเดิมแทนอัตโนมัติ

---

## 8. หมู่บ้านพัฟ (หน้า Hub) — เฟส 1
> ตอนนี้หน้าหมู่บ้านใช้ฉากทุ่งหญ้าเดิม + ป้ายไอคอนแทนตึก · ทำ 2 ภาพนี้แล้ว `npm run sprites` จะเปลี่ยนเอง

| ไฟล์ | อัตราส่วน | Prompt |
|---|---|---|
| `assets/generated/v2/backgrounds/village-hub.png` | **9:16** | ดูด้านล่าง |
| `assets/generated/v2/items/village-buildings.png` | **3:2** (ตาราง 3×2) | ดูด้านล่าง |

**ฉากหมู่บ้าน** — เว้นพื้นที่ว่างให้วางตึก 6 จุด (UI วางตึกทับเอง ห้ามวาดตึกในฉาก)
```
Cozy storybook village clearing for a cute fantasy mobile game hub screen, high top-down camera at about
55 degrees, vertical composition. Soft rolling meadow with winding dirt paths connecting six EMPTY round
grassy plots spread across the middle of the image (no buildings drawn on them), little fences, flower
patches, mushrooms, a tiny stream with a wooden bridge, lanterns on poles, a big old tree at one edge,
warm late-afternoon light, distant castle and waterfalls on the horizon at the top, darker leafy framing
at the bottom edge where the UI sits. No characters, no text. [STYLE] --ar 9:16
```

**ตึก 6 หลัง** — ลำดับสำคัญ (ซ้าย→ขวา, บน→ล่าง) ตรงกับที่เกมใช้
```
Game building icon sheet, 3x2 grid of six separate tiny chibi buildings for a cute animal village, each on a
small round grassy base, chunky readable silhouette, same top-down 55 degree angle, in this exact order:
1 a sprouting garden plot with a watering can and a big glowing seed (World-Waking Garden),
2 a round treehouse library shaped like an open storybook with a capsule toy machine at the door (Puff Album),
3 a wooden notice board with pinned paper quests and a little mailbox (Quest Board),
4 a lily pond with a tiny pier, fishing rod and a floating bobber (Puff Pond),
5 a small pillow-fort arena with cushion walls and pennant flags (Pillow Fight Arena),
6 a cave entrance under a giant flower with glowing eyes peeking out (Giant Boss Raid).
No characters, no text, evenly spaced, nothing overlapping. [ICON]
```

---

## 9. สวนปลุกโลก — ต้นไม้ 4 ขั้น (เฟส 2)
> ตอนนี้ต้นไม้ในสวนใช้สไปรต์ดอกไม้ศัตรูย่อขนาดแทน · ทำแผ่นละ 1 ดอก ได้ครบแล้วเกมเปลี่ยนเอง
> ไฟล์: `assets/generated/v2/garden/<seed>-growth.png` · อัตราส่วน **4:1** (แถวเดียว 4 ช่อง)
> seed = `daisy` `tulip` `sunflower` `lavender` `cactus` `honey-bud` `queen-rafflesia` `sunflower-colossus` `lotus-moon-sage`

**เรื่องราว:** ดอกไม้ที่พัฟ Bop หายงอนแล้ว กลับมาเกิดใหม่ในสวนบ้านเรา — ขั้นสุดท้ายคือดอกไม้ตัวเดิม **ยิ้มแย้มเป็นเพื่อน** (ไม่ใช่มอนสเตอร์)
```
Sprite sheet, single horizontal row of four growth stages of a cute <FLOWER> plant growing in a small round
soil mound, same size soil mound and same baseline in every frame, top-down 55 degree view:
1 a single seed half buried in the soil with a tiny sparkle, 2 a small sprout with two round leaves,
3 a leafy stem with a closed bud peeking the <FLOWER> colors, 4 the fully bloomed <FLOWER> as a happy smiling
flower friend with gentle sparkles. Plain flat light gray background, no floor shadow. [STYLE] [SHEET]
```
| seed | `<FLOWER>` |
|---|---|
| daisy | `white daisy` |
| tulip | `red tulip` |
| sunflower | `sunflower` |
| lavender | `lavender` |
| cactus | `round flowering cactus with a pink bloom` |
| honey-bud | `golden honey flower dripping honey` |
| queen-rafflesia | `giant crimson rafflesia with a tiny golden crown (rare)` |
| sunflower-colossus | `huge towering sunflower (rare)` |
| lotus-moon-sage | `glowing moonlit lotus (rare)` |

---

## 10. ตัวละคร "มือเปล่า" — ให้ถืออาวุธตามไอเทมที่ใส่
> ตอนนี้อาวุธถูกวาดติดไปกับตัวละคร เลยเปลี่ยนตามไอเทมไม่ได้ · ทำภาพชุดนี้แล้วเกมจะ **เอาไอคอนอาวุธ Tier ที่ใส่อยู่ (49 ชิ้น) ไปวางในมือเอง** ตามท่า
> ต้องทำครบ 2 แผ่นต่อตัว ตัวไหนมีครบ ตัวนั้นเปลี่ยนเป็นระบบใหม่ทันที (ตัวอื่นใช้ภาพเดิมไปก่อน)

**กฎสำคัญ**
- **ท่าเหมือนแผ่นเดิมทุกท่า** (อัปโหลดแผ่นเดิมเป็นภาพอ้างอิง) แต่ **ไม่มีอาวุธ/โล่/กระดิ่งเลย**
- มือข้างที่ถืออาวุธ **กำเหมือนจับด้ามอยู่** (ไม่แบมือ) และ **ไม่มีอะไรบังมือนั้น** — เกมจะวางอาวุธทับตรงนั้น
- ตำแหน่งตัวในแต่ละช่องเหมือนเดิม เท้าอยู่แนวเดียวกัน

**Pose Set มือเปล่า** → `assets/generated/v2/characters/<species>-<class>-poses-bare.png` (เช่น `shibu-carrot-knight-poses-bare.png`)
```
<SPECIES>, <CLASS NAME>, <OUTFIT WITHOUT THE WEAPON>, same character and same six poses as the reference sheet,
but holding NOTHING: no weapon, no shield, no bell, no staff. The weapon paw is closed as if gripping a handle,
clearly visible and not covered. Six game poses facing right, seen from a high top-down camera at 55 degrees:
1 idle, 2 running mid-stride, 3 attack wind-up, 4 attack release, 5 casting ultimate, 6 knocked back hurt.
Plain flat light gray background, no floor shadow. [STYLE] [SHEET]
```

**Signature มือเปล่า** → `assets/generated/v2/characters/<class>-signature-bare.png` (เช่น `carrot-knight-signature-bare.png`) — ใช้ prompt ท่าเฉพาะเดิม (ข้อ 2.5) + ต่อท้าย `holding nothing, weapon paw closed as if gripping a handle`

| ไฟล์ Pose | ไฟล์ Signature |
|---|---|
| `hamham-pillow-guard-poses-bare.png` | `pillow-guard-signature-bare.png` |
| `shibu-carrot-knight-poses-bare.png` | `carrot-knight-signature-bare.png` |
| `bunbun-leaf-archer-poses-bare.png` | `leaf-archer-signature-bare.png` |
| `shibu-bubble-mage-poses-bare.png` | `bubble-mage-signature-bare.png` |
| `bunbun-mochi-cleric-poses-bare.png` | `mochi-cleric-signature-bare.png` |
| `hamham-bell-bard-poses-bare.png` | `bell-bard-signature-bare.png` |
| `molemo-root-druid-poses-bare.png` | `root-druid-signature-bare.png` |

> **สถานะ: ครบ 7 อาชีพแล้ว** — Tofu ใช้แผ่นเดิม; อีก 6 ตัวมี Pose + Signature มือเปล่า รวม 12 แผ่น / 60 เฟรม พร้อมจุดจับอาวุธใน `scene/weaponHold.ts` · prompt ที่ใช้สร้างและ cleanup: [bare-paws-generation.md](bare-paws-generation.md)

---

## 11. พัฟใหม่ในสมุดพัฟ (เฟส 3) — 6 ตัว

> ตอนนี้ในเกมใช้ภาพชั่วคราว: **ยืมแผ่นของอาชีพเดียวกัน** (ท่า/อาวุธเข้ากัน) แล้วย้อมสีตามเผ่า + ฟิลเตอร์ `.stand-in-<species>` ที่ portrait
> ทำภาพตามนี้ (Template 2.3 Model Sheet → 2.4 Pose Set 6 ท่า) แล้ว `npm run sprites` เกมจะสลับไปใช้ภาพจริง + ตัด portrait ให้เอง

| ไฟล์ Pose Set (`assets/generated/v2/characters/`) | ตัว | ★ | `<SPECIES>` + `<OUTFIT & WEAPON>` |
|---|---|---|---|
| `bunbun-carrot-knight-poses.png` | **Latte** | 5 | coffee-brown fluffy bunny, one ear flopped, latte-art heart on the chest fur · `a cream knight tabard with a coffee-bean crest, a long carrot greatsword held two-pawed` · ท่า 5 = `leaping high with the carrot sword raised for a downward slash` |
| `shibu-pillow-guard-poses.png` | **Senbei** | 5 | toasted-orange shiba, confident grin · `samurai armour made of rice crackers with nori lacing, a round rice-cracker shield and a cushion on the back` · ท่า 5 = `slamming the cracker shield down, crumbs flying` |
| `hamham-leaf-archer-poses.png` | **Nugget** | 5 | golden hamster with huge cheeks · `sporty sunglasses, a leaf vest with seed-shell bandolier, a rapid-fire slingshot crossbow loaded with sunflower seeds` · ท่า 5 = `spraying seeds from the crossbow in a wide fan` |
| `hamham-mochi-cleric-poses.png` | **Sakura** | 5 | pale-pink hamster · `a sakura-petal priest robe, cherry-blossom hairpin, a dango staff with pink-white-green mochi` · ท่า 5 = `raising the dango staff as sakura petals swirl around` |
| `hamham-bubble-mage-poses.png` | **Daifuku** | 6 | snow-white round hamster · `a starry wizard cape shaped like a daifuku wrapper, a bubble wand as tall as the body blowing a giant bubble` · ท่า 5 = `blowing an enormous glowing bubble overhead` |
| `shibu-bell-bard-poses.png` | **Kuma-Shiba** | 6 | cream shiba **wearing a brown bear onesie hood** (cute on cute) · `pancake drum on a strap, a golden bell mallet` · ท่า 5 = `drumming the pancake drum with shockwave rings of music notes` |

> พัฟ ★5/★6 ควรดูพิเศษขึ้น: ขอบเสื้อผ้ามีดิ้นทอง/แสงเล็กน้อย แต่ **ทรงกลม chibi เท่าเดิม** (ห้ามสูงกว่าพัฟตัวอื่น)

---

## 12. ปลาใน Puff Pond — ไอคอน 12 ชนิด

> ไฟล์ `assets/generated/v2/items/fish-twelve-icons.png` เป็นตาราง **4 คอลัมน์ × 3 แถว** เรียงตาม `FISH` ใน `packages/sim/src/fishing.ts` · `npm run sprites` ตัดเป็น `item/fish-0.png` ถึง `item/fish-11.png` สำหรับหน้าจับปลาและสมุดปลา

```
Twelve separate cute fantasy fish icons for a mobile RPG, exact 4-column by 3-row grid,
one centered creature in each equal cell, ample empty space between cells, same 3/4 side-view
angle and readable size. Row-major order:
1 bread-carp: warm tan plump carp like a loaf;
2 bubble-guppy: tiny turquoise guppy with iridescent bubble tail;
3 pebble-loach: brown spotted bottom-dweller with pebble markings;
4 moon-minnow: tiny silvery-blue crescent-moon minnow;
5 pudding-puffer: round custard-yellow pufferfish with cute soft spikes;
6 petal-betta: pink and violet betta with flower-petal fins;
7 lantern-catfish: deep indigo whiskered catfish with a glowing lantern lure;
8 mochi-ray: flat white-pink stingray shaped like soft mochi;
9 sakura-koi: white-and-rose koi with cherry blossom marks;
10 star-jelly: translucent blue jellyfish with tiny star lights;
11 golden-koi: regal gleaming gold koi with ornate tail;
12 rainbow-whale: tiny round magical whale with rainbow back and star sparkles.
Premium 2.5D anime mobile RPG art, bold clean dark outlines, glossy cel shading,
strong silhouette at 64px. Plain uniform light gray #E8E8E8 background, no floor shadow,
no scenery, labels, numbers, text, grid lines, borders, overlap, or merged creatures.
```

---

## 13. สไตล์ "ภาพยนตร์อนิเมะ" (Cinematic painterly) — ฉากหลัง + เอฟเฟกต์ชุดใหม่

> ใช้แทน `[STYLE]`/`[VFX STYLE]` เดิมสำหรับ **ฉาก** และ **เอฟเฟกต์ธรรมชาติ** (ราก เถาวัลย์ ดิน หิน น้ำ ใบไม้) เพื่อให้ดูเป็นภาพวาดมือแบบหนังอนิเมะ
> ตัวละครยังใช้ `[STYLE]` เดิม (cel-shade ตัดเส้นชัด) — ตัวละครต้องเด่นกว่าฉาก จึงให้ฉากนุ่ม/ละเอียดกว่า

### `[SCENE STYLE]` — ฉากหลังทุกภาพ
```
Japanese anime environment background, hand-painted cinematic scenery,
premium JRPG game background, semi-realistic painterly anime style,
subtle clean linework, soft cel-painted shapes, visible brush texture,
stylized natural forms, detailed foliage and rocks,
warm golden-hour lighting, peach-orange highlights,
cool teal-blue shadows, atmospheric perspective,
soft distant haze, beautiful hand-painted clouds,
rich controlled color palette, anime movie background quality,
illustrated, not photorealistic, not 3D
```

### `[PAINTED VFX]` — เอฟเฟกต์ที่เป็น "ของจริง" (ราก เถา ดิน หิน ใบไม้) — **พื้นเทา**
```
hand-painted anime movie effect element, same painterly style as a Japanese anime film background,
subtle clean linework, soft cel-painted shapes, visible brush texture, warm golden-hour key light with
peach-orange highlights and cool teal-blue shadows, dynamic motion, readable silhouette at small size,
isolated on a plain flat light gray #E8E8E8 background, no ground plane, no scenery, no characters,
no text, not photorealistic, not 3D
```
> **พื้นเทา ไม่ใช่พื้นดำ** — ของทึบ (เปลือกไม้ ดิน) ถ้าวาดบนดำ pipeline จะตัดสีเข้มทิ้งแล้วทำเป็นแสงเรือง (additive) ทำให้เถาดูโปร่งแสง
> เอฟเฟกต์ที่เป็น "แสง/พลัง" (ประกาย วงเวท คลื่นพลัง) ยังใช้ `[VFX STYLE]` พื้นดำเหมือนเดิม

### 13.1 Taro — Root Awakening ชุดใหม่ (เถาวัลย์โผล่จากพื้นดิน)

**ลำดับท่าในเกม (ทำแล้วในโค้ด ภาพด้านล่างจะมาแทนส่วนที่วาดด้วยเส้น):**
ชูไม้เท้า → กระทืบ → รอยแตก+เนินดินวิ่งใต้ดินไปหาศัตรู → **พื้นแตกเป็นหลุมรอบตัวศัตรู** → **เถาพุ่งขึ้นจากหลุม โค้งลงพันตัว** → รัด 3 จังหวะ → รากยักษ์ปะทุกลางวง กระชากลง → เถาหดกลับลงดิน

| ไฟล์ (`assets/generated/vfx2/`) | ชิ้น | Prompt (ต่อท้าย `[PAINTED VFX]` + `[SHEET]`) |
|---|---|---|
| `druid-ground-burst.png` [4 เฟรม] | พื้นแตกตอนเถาโผล่ | `a patch of earth seen from a high 55 degree top-down angle tearing open from below: four frames — the soil bulging and cracking in a small mound, the crust splitting with clods and pebbles flying up, a dark round hole with a rim of broken turf and dust spraying outward, dust settling around the open hole` |
| `druid-vine-emerge.png` [4 เฟรม] | เถาพุ่งจากหลุม | `a thick twisting green-brown vine with bark texture, small leaves and a curled glowing sprout tip bursting straight up out of a hole in the ground: four frames — the tip poking out with dirt flying, shooting up tall, arching over at the top, bending down as if to wrap something, the base always at the same spot at the bottom of the frame` |
| `druid-vine-coil.png` [3 เฟรม] | เถาพันรอบตัว (วนลูป) | `a spiral of thick leafy vines wrapped three times around an invisible upright round body, empty in the middle, seen from a 55 degree angle, front loops in front and back loops behind, three frames of the coils squeezing tighter with leaves shaking` |
| `druid-root-erupt.png` [4 เฟรม] | รากยักษ์ (แทนของเดิม) | `a colossal ancient tree root erupting from a fissure in the earth, gnarled bark with moss and vines, boulders and turf blasting outward: four frames — fissure splitting with dust, root bursting up, towering at full height with leaves swirling, crashing down in a ring of dust` |

> ทำแล้ววางไฟล์ตามชื่อ → `npm run sprites` · เกมใช้ `druid-ground-burst` ทันทีที่มี (ตอนนี้ใช้ฝุ่นของ Carrot Knight แทน) เถาและขดเถาใช้ภาพจริงแล้ว (`paintedVine`/`paintedCoil` ใน `scene/rootDruid.ts`)

### 13.2 ฉากสนามต่อสู้ (1 ภาพ/บท + ฉากบอส)

**กฎสำคัญของฉากสนาม (มุมเกม):**
- มุมกล้องสูงมองลง ~55° แบบเดียวกับตัวละคร · ภาพแนวตั้ง 9:16
- **กลางภาพต้องเป็นลานโล่ง** (พื้นดิน/หญ้าเรียบ อ่านง่าย) กินพื้นที่ ~ครึ่งกลางของภาพ เพราะตัวละครสู้กันตรงนั้น
- ของรกๆ (ต้นไม้ หิน รั้ว ดอกไม้) อยู่ **ขอบซ้าย-ขวาและขอบล่าง** เป็นกรอบ · ท้องฟ้า/วิวไกลอยู่ **1/4 บน**
- ไม่มีตัวละคร ไม่มี UI ไม่มีตัวหนังสือ

```
Top-down 55 degree game battlefield for a mobile RPG, vertical 9:16, <PLACE>,
a wide open clearing of <GROUND> filling the middle half of the image for characters to fight on,
framed by <FRAME> along the left, right and bottom edges, distant <VISTA> and sky in the top quarter,
no characters, no UI, no text. [SCENE STYLE] --ar 9:16
```

| บท | ไฟล์ (`assets/generated/v2/backgrounds/`) | `<PLACE>` | `<GROUND>` | `<FRAME>` | `<VISTA>` |
|---|---|---|---|---|---|
| 1 ทุ่งงีบหลับ | `01-meadow-of-naps.png` | a sleepy flower meadow kingdom | soft trampled grass and sunlit dirt path | round bushes, sleeping daisies, mossy rocks and a wooden fence | rolling hills, a white castle and waterfalls |
| 2 ป่าแครอทกรอบ | `02-carrot-forest.png` | a cozy forest of giant carrot trees | packed earth with fallen carrot leaves | giant carrot trunks, mushrooms and ferns | layered misty forest ridges |
| 3 หนองบัวจันทร์ | `03-lotus-lagoon.png` | a shallow lotus lagoon at dusk | wide flat stone platform over still water | lotus leaves, reeds and stone lanterns | a glowing moon rising over the water |
| 4 หุบเขาทานตะวัน | `04-sunflower-valley.png` | a warm valley of towering sunflowers | dry golden earth and flat sandstone | sunflower stalks and warm boulders | canyon cliffs and a big golden sun |
| 5 ทะเลนม | `05-milk-sea-shore.png` | a creamy white milk-sea shore | smooth pale sand and pebble flats | driftwood, shells and candy-colored rocks | a calm milky sea and cotton clouds |
| 6 สระดาว | `06-star-pond.png` | a starlit night garden pond | glowing moss stone plaza | night flowers, fireflies and crystal rocks | a starry sky with a milky way |

**ฉากบอส** ของแต่ละบท (`0N-...-boss.png`) — ใช้ prompt เดียวกัน เปลี่ยนท้ายเป็น:
```
same place as a boss arena: the clearing is a large circle of cracked earth with a faint glowing rune ring,
giant thorny vines and dark petals creeping in from the edges, stormy dramatic sky with a warm rim of light,
[SCENE STYLE] --ar 9:16
```

### 13.3 หมู่บ้านพัฟ (วาดใหม่ในสไตล์นี้) → `v2/backgrounds/village-hub.png`
> ต้องคงตำแหน่งลานหญ้า 6 วงเดิม (ตึกวางทับตามพิกัด) — อัปโหลดภาพเดิมเป็นภาพอ้างอิงและบอกให้คงเลย์เอาต์
```
Repaint this village map in a new style while keeping the exact same layout: the same six round grassy
plateaus in the same positions, the same dirt paths, bridge and stream, same top-down 55 degree camera,
vertical 9:16, no buildings on the plateaus (they are placed by the game), no characters, no text.
[SCENE STYLE] --ar 9:16
```

---

## 14. Skill Move Sheets — ท่าสกิลแบบแอนิเมชันเต็มท่า (ตามภาพอ้างอิง Raiden chibi / MLBB / VFX breakdown)

> **ปัญหาเดิม:** ท่าเป็น "ตู้มเดียว" คือโพสค้าง 1 ภาพ แล้ววางเอฟเฟกต์ระเบิดทับ
> **แบบใหม่:** ท่าหนึ่งแตกเป็น **12 เฟรม** โดยวาด **ตัวพัฟกับเอฟเฟกต์รวมกันในแต่ละเฟรม** (เส้นฟัน, smear, trail, ประกาย) เหมือนแผ่น Raiden ที่ส่งมา
> เกมเล่นแผ่นนี้ทีละเฟรมบนตัวละครระหว่างที่ตัวละครเคลื่อนที่จริง แล้วเอฟเฟกต์ใหญ่ (คลื่น วง AoE ฝน) ยังวิ่งไปหาเป้าตามโค้ด
> **ต่อสายไว้แล้ว:** วางไฟล์ตามชื่อด้านล่างแล้วรัน `npm run sprites` เกมจะใช้แทนท่าเดิมอัตโนมัติ (ไม่มีไฟล์ก็เล่นท่าเดิม)

### 14.1 หลักการแอนิเมชัน (ใช้ตอนสั่งภาพ + ตรวจภาพ)
| ช่วง | เฟรม (อัลติ 12) | หลักการ | สิ่งที่ต้องเห็นในภาพ |
|---|---|---|---|
| **Anticipation** เตรียม | 1–2 | ย่อตัวก่อนพุ่ง (squash) · ดึงอาวุธไปด้านหลัง | ตัวหดต่ำ, ประกายเล็กที่อาวุธ, ฝุ่นใต้เท้าเล็กน้อย |
| **Charge** สะสมพลัง | 3 | พลังรวมเข้าหาตัว | เส้นพลังวิ่ง **เข้า** หาอาวุธ/ตัว, วงเวทบนพื้น |
| **Startup / Burst** ปล่อยตัว | 4–5 | ยืดตัว (stretch) · speed lines | ตัวพุ่ง/กระโดด, afterimage, ฝุ่นระเบิดที่จุดออกตัว |
| **Active** ช่วงตี | 6–8 | **smear frame**: เส้นโค้งหนาที่หัว บางที่หาง | เส้นฟัน/วงหมุนสีประจำอาชีพ ซ้อน 3 ชั้น (แกนขาว → สีหลัก → ขอบเข้ม) |
| **Impact** กระทบ | 9 | **ค้างนานกว่าเฟรมอื่น 2–3 เท่า** (เกมยืดให้) · แฟลชขาว | เอฟเฟกต์ใหญ่สุดของท่า, เศษดิน/ประกายกระจายเป็นวง, พื้นแตก |
| **Follow-through** ต่อเนื่อง | 10–11 | อาวุธ/ผ้า/หูยังเหวี่ยงตามแรง · particle ร่วงช้ากว่าตัว | เส้นพลังจางลง, ใบไม้/ประกายค่อยๆ ตก |
| **Recovery** คืนท่า | 12 | overshoot เล็กน้อยแล้วนิ่ง | ท่าเท่ปิดท้าย (ยิ้ม/พักอาวุธบนไหล่) |

**กฎรูปทรงเอฟเฟกต์:** smear กับเส้นฟันต้อง "หนาหัวบางหาง" (crescent) ห้ามหนาเท่ากันทั้งเส้น · ขอบต้องคม ไม่ฟุ้ง (เงาฟุ้งจะถูกตัดตอนลบพื้นเทา) · ต้องอ่านรูปทรงออกตอนตัวละครสูง 72px · ภาษารูปทรงต่างกันตามอาชีพ: อัศวิน = เสี้ยวพระจันทร์คม, นักธนู = ใบไม้/ลูกศรยาว, จอมเวท = ฟองกลม, แทงก์ = วงกลมหมุน+คลื่นกระแทก, นักบวช = โมจินุ่ม+ดอกซากุระ, กวี = วงคลื่นเสียง+โน้ต, ดรูอิด = รากไม้/เถาวัลย์

### 14.2 Template

**`[MOVE STYLE]`** — สไตล์ภาพยนตร์อนิเมะเดียวกับฉาก (ข้อ 13) แต่ปรับให้เป็นแผ่นท่าบนพื้นเทา
```
chibi anime web-game skill animation sheet, the exact same puff character as the reference (keep face,
body, outfit and weapon identical), bold readable action poses with squash and stretch,
Japanese anime movie quality, hand-painted cinematic look, semi-realistic painterly anime style,
subtle clean linework, soft cel-painted shapes, visible brush texture, stylized natural forms,
warm golden-hour key light with peach-orange highlights and cool teal-blue shadows,
rich controlled color palette, illustrated, not photorealistic, not 3D,
anime VFX painted together with the character: thick-to-thin crescent smear arcs, layered energy with a
white-hot core, bright class-color middle and a deeper edge, sharp speed lines, sparkles and debris chunks,
effect edges kept crisp (no haze spilling onto the background), top-down 55 degree view, the character faces right
```

**`[MOVE GRID 12]`** (อัลติ → `assets/generated/v2/moves/<class>-ult.png`)
```
a strict 4 columns by 3 rows grid of 12 equal square cells on a plain flat light gray #E8E8E8 background,
read left-to-right, top-to-bottom as one continuous move; the character is the same size in every cell and
its feet stay on the same spot (horizontal centre, lower third of each cell) unless the move lifts it into the
air; effects may extend around the character but must stay inside their own cell; no grid lines, no numbers,
no text, no labels, no floor shadow
```

**`[MOVE GRID 6]`** (ตีปกติ → `assets/generated/v2/moves/<class>-attack.png`) — เหมือนด้านบนแต่ `3 columns by 2 rows grid of 6 equal square cells` · เฟรม: 1 ง้าง, 2 smear ตอนเหวี่ยง, **3 กระทบ**, 4–5 ตามแรง, 6 คืนท่า

> สั่งภาพ: อัปโหลด Model Sheet/Pose Set ของตัวนั้นเป็นภาพอ้างอิง แล้วใช้ `<การกระทำ 12 เฟรม>` + `[MOVE STYLE]` + `[MOVE GRID 12]`
> 1 อาชีพใช้แผ่นเดียวกันทุกตัว (เช่น Tofu กับ Latte ใช้ `carrot-knight-ult`) ถ้าอยากให้ต่างกันค่อยแยกทีหลัง — เริ่มจากตัวหลักของแต่ละอาชีพ

### 14.3 ท่าอัลติทีละอาชีพ (12 เฟรม) — ใส่ใน `<การกระทำ 12 เฟรม>`

**Carrot Knight — Carrot Crescent** · `carrot-knight-ult.png` · สีส้มไฟ `#FF6A2B` + ทอง
```
twelve frames of a dash-and-leap sword ultimate: 1 crouching low gripping the carrot sword with a glint,
2 sword pulled back, orange embers gathering along the blade, 3 lunging forward with speed lines and a dust
burst behind, 4 a wide horizontal slash leaving a thick orange crescent smear, 5 spinning around for a rising
backhand slash with a second crescent, 6 springing upward into the air in a full spin wrapped in a ring of
flame, 7 at the top of the leap with the sword raised overhead blazing gold, 8 plunging down with a huge
vertical crescent smear, 9 IMPACT: the sword slams into the ground and a giant flaming crescent wave bursts
outward with cracked earth and flying rocks, 10 the fire wave rolling forward while embers rain, 11 kneeling
in the follow-through with the sword still glowing, 12 standing up with the sword resting on the shoulder,
proud grin
```

**Leaf Archer — Leaf Storm** · `leaf-archer-ult.png` · สีเขียว `#3CCB5A`
```
twelve frames of a leaping volley ultimate: 1 crouching with ears back, a leaf whirl starting at the feet,
2 springing up with a spiral of leaves, 3 in the air drawing the bow, green light gathering on the arrow,
4 full draw with a glowing leaf-shaped arrowhead and swirling leaves, 5 releasing: a thick green streak
shooting up into the sky, 6 notching three arrows at once, 7 a fan of three green streaks with leaf trails,
8 the arrows bursting in the sky into a shower of leaf blades, 9 IMPACT: a rain of glowing leaf arrows
striking the ground below in a ring of green bursts, 10 landing with a leaf swirl around the feet, 11 leaves
fluttering down as the bow lowers, 12 standing with the bow on the back, winking
```

**Bubble Mage — Bubble Prison** · `bubble-mage-ult.png` · สีฟ้าม่วง `#5B6CFF`
```
twelve frames of a bubble-spell ultimate: 1 twirling the wand, small bubbles popping around, 2 a glowing
magic circle opens under the feet, 3 the wand raised as blue light spirals into its tip, 4 blowing a huge
shimmering bubble that swells in front, 5 pushing the giant bubble forward with both paws, 6 the bubble
flying off with a trail of small bubbles and sparkles, 7 conducting with the wand as rings of foam spread,
8 clenching a paw as if squeezing: bubbles tighten into a glowing orb, 9 IMPACT: the orb bursting into a
dazzling splash of foam, droplets and star sparkles, 10 soap droplets raining down with rainbow glints,
11 bowing with the wand, bubbles drifting, 12 blowing a tiny bubble off the wand tip, smug smile
```

**Pillow Guard — Ultimate Roll** · `pillow-guard-ult.png` · สีน้ำเงิน `#3D8BFF`
```
twelve frames of a rolling-charge ultimate: 1 planting the feet behind the pillow shield, 2 tucking in, the
body squashing round, 3 curled into a ball with the shield wrapped around, blue energy lines gathering,
4 spinning in place with a circular blue smear ring and dust, 5 launching forward in a rolling blur with
speed lines, 6 bouncing high off the ground with a spiral smear, 7 at the top of the bounce uncurling with
the shield held out, 8 slamming down shield-first with motion arcs, 9 IMPACT: a heavy blue shockwave ring
and feathers exploding out from the shield, cracked ground, 10 feathers floating down, 11 hopping up and
brushing off the shield, 12 standing tall behind the shield, chest puffed out
```

**Mochi Cleric — Mochi Rain** · `mochi-cleric-ult.png` · สีทอง `#FFC93C` + ชมพูซากุระ
```
twelve frames of a healing ultimate: 1 hugging the dango staff with closed eyes, 2 raising the staff, soft
gold light gathering, 3 spinning the staff overhead, a ring of sakura petals forming, 4 a warm golden pillar
of light shooting into the sky, 5 the sky above filling with glowing mochi, 6 mochi falling like soft
stars with trails of petals, 7 catching a mochi with a happy face, 8 throwing both arms wide as the rain
peaks, 9 IMPACT: a burst of golden healing light and sakura petals bursting outward in a big soft ring,
10 petals and sparkles settling, 11 nibbling a mochi happily, 12 bowing gently with the staff
```

**Bell Bard — Bear Hug Festival** · `bell-bard-ult.png` · สีชมพู `#FF6FB5`
```
twelve frames of a festival buff ultimate: 1 tapping the bell with a tiny music note, 2 raising the
pancake drum, 3 the first big drum beat sending out a pink sound ring, 4 dancing while a second and third
ring spread with musical notes, 5 spinning with the bell, notes swirling in a spiral, 6 a giant glowing
spirit bear forming behind the puff, 7 the spirit bear opening its arms wide, 8 the bear hugging, pink
hearts and notes bursting, 9 IMPACT: a huge pink shockwave of music notes, hearts and sparkles bursting in
a ring, 10 confetti and notes raining down, 11 bowing to an invisible crowd, 12 posing with the bell raised
```

**Root Druid — Root Awakening** · `root-druid-ult.png` · สีเขียวมอส `#8FBF3A` + น้ำตาล (ใช้ร่วมกับเถาวัลย์ที่เกมวาด ข้อ 13.1)
```
twelve frames of an earth-magic ultimate: 1 closing the eyes with the root staff held upright, sprout on
the head glowing, 2 a moss-green magic circle opening under the feet, 3 raising the staff high as the seed
crystal blazes, 4 stamping the staff into the ground, dirt bursting, 5 cracks glowing green racing away
from the staff, 6 small roots coiling up around the feet, 7 both paws raised commanding the earth, leaves
spinning upward, 8 pulling the paws down as if yanking ropes, 9 IMPACT: a giant root bursting up beside the
puff in a blast of turf, rocks and glowing sap, 10 the root crashing back down, dust ring, 11 leaning on the
staff catching breath, leaves falling, 12 patting the sprout on the head with a sleepy smile
```

### 14.4 ตีปกติ (6 เฟรม) — ใส่ใน `<การกระทำ 6 เฟรม>` + `[MOVE STYLE]` + `[MOVE GRID 6]`
| ไฟล์ | การกระทำ |
|---|---|
| `carrot-knight-attack.png` | `1 raising the carrot sword, 2 a fast diagonal slash with an orange crescent smear, 3 IMPACT spark burst at the blade tip, 4 the blade carried through, 5 small embers, 6 back to ready stance` |
| `leaf-archer-attack.png` | `1 drawing the bow, 2 full draw with a green glint, 3 releasing with a green streak and a leaf puff, 4 bow string snapping back, 5 a leaf floating, 6 ready stance` |
| `bubble-mage-attack.png` | `1 dipping the wand, 2 swirling it with a blue spiral, 3 blowing a bubble that pops out with sparkles, 4 wand follow-through, 5 tiny bubbles, 6 ready stance` |
| `pillow-guard-attack.png` | `1 winding up the pillow shield, 2 a heavy horizontal swing with a blue arc smear, 3 IMPACT feathers bursting, 4 shield follow-through, 5 feathers drifting, 6 guard stance` |
| `mochi-cleric-attack.png` | `1 raising the dango staff, 2 tossing a mochi with a soft arc trail, 3 a golden sparkle at the throw, 4 staff follow-through, 5 petals, 6 ready stance` |
| `bell-bard-attack.png` | `1 lifting the bell, 2 ringing it with a pink sound ring smear, 3 IMPACT a burst of music notes, 4 swing back, 5 notes floating, 6 ready stance` |
| `root-druid-attack.png` | `1 lifting the root staff, 2 tapping it down with a green crack spark, 3 dirt puffing up, 4 a small root sprouting at the feet, 5 leaves falling, 6 ready stance` |

### 14.5 วิธีตรวจภาพก่อนใส่เกม (เช็กลิสต์)
- [ ] ตาราง **ช่องเท่ากันเป๊ะ** (4×3 หรือ 3×2) ไม่มีเส้นตาราง ไม่มีตัวเลข
- [ ] ตัวละครขนาดเท่ากันทุกช่อง เท้าอยู่ตำแหน่งเดิม (ยกเว้นเฟรมกระโดด)
- [ ] เอฟเฟกต์ไม่ล้นข้ามช่อง · พื้นเทาเรียบ ไม่มีเงาพื้น
- [ ] เฟรม 9 (อัลติ) / เฟรม 3 (ตีปกติ) เป็นเฟรมที่ "ใหญ่ที่สุด" ของท่า
- [ ] ย่อภาพให้ตัวสูง ~72px แล้วยังอ่านท่าออก

### 14.6 Cinematic Ultimate — โครงของทุกอัลติ (ตามคลิปตัวอย่าง Raiden + คลิปดาบมุมบน)

> **อัปเดต:** เอาแบนเนอร์ cut-in และสัญลักษณ์อาชีพออกจากเกมแล้ว (หยุดเกมบ่อยเกินไป) → **ไม่ต้องสร้าง `class-emblems.png` และ `cutin-<class>.png`** · ขั้น ① ตอนนี้เป็นกล้องซูม + เส้นพลังในฉากเท่านั้น
> เกมทำโครงนี้ให้ **ทุกอาชีพแล้วในโค้ด** ด้วยเอฟเฟกต์ที่วาดสด · ภาพด้านล่างจะทำให้แต่ละจังหวะสวยขึ้น

| จังหวะ | เวลา | เกมทำอะไร (ทำแล้ว) | ภาพที่เพิ่มได้ |
|---|---|---|---|
| ① Push-in | 0–0.3 วิ | กล้องซูมเข้าตัวที่ร่าย ×1.45 · เส้นพลังวิ่ง **เข้า** หาตัว · แบนเนอร์ชื่อท่า + ภาพโคลสอัป | `cutin-<class>.png` ภาพโคลสอัป |
| ② Flash | ~0.4 วิ | แฟลชขาวทั้งจอ | — |
| ③ Emblem slash | 0.45–0.9 วิ | แถบมืดเฉียง + เส้นฟันสีอาชีพพาดจอ + **สัญลักษณ์อาชีพหมุนขยายกลางจอ** | `class-emblems.png` สัญลักษณ์ 7 อาชีพ |
| ④ Release | 0.9 วิ | กล้องดีดกลับพร้อม overshoot · ท่า/move sheet ปล่อย | move sheet ข้อ 14.3 |
| ⑤ Afterglow | หลังฮิตสุดท้าย | รอยไหม้เรืองบนพื้น + ประกายลอยขึ้นช้าๆ ค้างหลังท่าจบ | — |
| ⑥ Empowered | 5 วิหลังอัลติ | ลูกแสงสีอาชีพโคจรรอบตัว · **ตีปกติมีเส้นฟันยาวทะลุเป้า** | — |

**`class-emblems.png`** → `assets/generated/v2/ui/class-emblems.png` (แถวเดียว 7 ช่อง เรียง: pillow-guard, carrot-knight, leaf-archer, bubble-mage, mochi-cleric, bell-bard, root-druid)
```
seven circular magic emblems in one row, evenly spaced, each a glowing sigil for a fantasy class:
1 a pillow shield crest with a paw print (blue), 2 a crescent moon crossed by a carrot sword (orange-gold),
3 a leaf-shaped arrowhead inside a wind spiral (green), 4 a bubble inside a star circle (blue-violet),
5 a dango skewer with sakura petals and a halo (gold-pink), 6 a bell and music notes inside a heart ring (pink),
7 a seed crystal with roots spreading like a mandala (moss green); each emblem like the eye sigil in an anime
ultimate cut-in: bold clean shapes, white-hot core lines, colored glow edge, symmetrical, readable at small size,
Japanese anime movie quality, hand-painted cinematic look, visible brush texture, rich controlled color palette,
isolated on a plain flat light gray #E8E8E8 background, no text, not photorealistic, not 3D
```

**`cutin-<class>.png`** → `assets/generated/v2/ui/cutin-<class>.png` (ภาพเดี่ยว 1 ตัว/อาชีพ — ใช้ตัวหลัก: Pudding, Tofu, Usagi, Kinako, Momo, Mimi, Taro)
```
dramatic anime ultimate cut-in close-up of this exact puff character (upload the model sheet as reference),
head and shoulders filling the frame, determined sparkling eyes, <WEAPON MOMENT>, class-colored energy
crackling around it, strong rim light, speed lines behind, Japanese anime movie quality, hand-painted
cinematic look, semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes,
visible brush texture, warm golden-hour highlights with cool teal-blue shadows, illustrated, not
photorealistic, not 3D, isolated on a plain flat light gray #E8E8E8 background, square image
```
| อาชีพ | `<WEAPON MOMENT>` |
|---|---|
| pillow-guard | `peeking over the pillow shield as it glows blue` |
| carrot-knight | `drawing the carrot sword from its sheath, blade flaring orange` |
| leaf-archer | `drawing the bow back to the cheek, a glowing leaf arrow` |
| bubble-mage | `holding the bubble wand up as a giant bubble swells` |
| mochi-cleric | `raising the dango staff with a warm golden halo` |
| bell-bard | `ringing the bell beside the face, pink music notes bursting` |
| root-druid | `gripping the root staff as the seed crystal blazes green` |

### 14.7 หลักจากคลิปตัวอย่างที่ใช้กับทุกท่า (สรุปให้ทีมอาร์ต + โค้ด)
1. **ทุกท่ามีทาง** — เอฟเฟกต์เดินทางตามตัวละคร (รอยเสี้ยวตามทางพุ่ง) ไม่เกิดกับที่
2. **วงบนพื้น** — วงหมุน/วงเวทแบนบนพื้นในมุม 55° ช่วยให้รู้ว่าโดนตรงไหน
3. **เรียกของจากพื้น/ฟ้า** — ดาบปักขึ้นเป็นวง, ลำแสงลงจากฟ้า, รากทะลุดิน → ความสูงทำให้อลังการ
4. **ค้างจังหวะกระทบ** — เฟรมใหญ่สุดค้างนานกว่า + hit-stop + จอสั่น
5. **เศษค้างหลังท่าจบ** — ประกาย/รอยไหม้ค่อยๆ จาง ไม่หายทันที
6. **ออร่าหลังอัลติ** — ตัวละครยังเรืองพลังอยู่สักพัก ตีปกติแรงขึ้นทางภาพ

### 14.8 ท่าประจำตัวรายอาชีพ (โค้ดวาดสดแล้ว — `scene/signature.ts`)
ตอนนี้แต่ละอาชีพมี "ช็อตเด่น" ของตัวเองที่วาดด้วยโค้ด (ไม่ต้องรอภาพ) ถ้าจะวาดภาพจริงมาแทน ให้ใช้ `[PAINTED VFX]` + `[SCENE STYLE]` ตามรายการนี้: (**prompt พร้อมใช้ + ชื่อไฟล์อยู่ข้อ 14.9**)

| อาชีพ | ช็อตเด่น | จังหวะ |
|---|---|---|
| Carrot Knight (Tofu) | ดาบแครอทวิญญาณ 6 เล่มผุดจากดินเป็นวงรอบศัตรู ลอยชี้ลง แล้วปักพร้อมกันตอนฟาดจันทร์เสี้ยว + เสาแสง | ขึ้น 0.3 วิ → ปัก 1.35 วิ |
| Leaf Archer (Usagi) | เป้าเล็งสีเขียวหมุนใต้ศัตรูทุกตัว → ฝนธนู 3 ระลอก → ลูกศรยักษ์พันเกลียวลมดิ่งจากฟ้า | เป้า 0.85 → ปิดท้าย 1.82 วิ |
| Bubble Mage (Kinako) | วังวนกาแล็กซีบนพื้นดูดศัตรูเข้าหาตา → ขังฟอง → บีบ + ดาวแตก | 0 → 1.65 วิ |
| Pillow Guard (Pudding) | ทุ่มตัวแล้วโดมหมอนคลุมเพื่อนทุกตัว + "!" แดงเหนือศัตรู (โดนยั่ว) | 1.45 วิ |
| Mochi Cleric (Momo) | ระลอกสุดท้าย: เสาแสง+รัศมีบนหัวเพื่อนทุกตัว + พายุกลีบซากุระพัดผ่านจอ | 1.25–2.6 วิ |
| Bell Bard (Mimi) | หมีวิญญาณยักษ์โปร่งแสงลุกขึ้นหลังทีม กางแขนกอดทุกคนตอนระฆังครั้งที่ 3 + หัวใจ + โน้ตดนตรีวนขึ้นจากเพื่อน | 0 → 1.4 วิ |
| Root Druid (Taro) | (เดิม) มุดดิน → หลุม → เถาพุ่งพันยก → รัด 3 ครั้ง → รากยักษ์กระชาก | ~2.8 วิ |

ระหว่างร่าย (cut-in) มีลูกเล่นเฉพาะอาชีพด้วย: ประกายวิ่งตามดาบ / ใบไม้หมุนรอบตัว / ฟองลอยขึ้นแตก / หกเหลี่ยมโล่ / รัศมี / คลื่นเสียง+โน้ต

### 14.9 ภาพสำหรับท่าประจำตัว (แทนของที่โค้ดวาด) — วางที่ `assets/generated/vfx2/`
> ทำแล้ววางไฟล์ตามชื่อ → `npm run sprites` · เกมเปลี่ยนไปใช้ภาพเองทันทีที่มีไฟล์ (ไม่มีไฟล์ = ใช้ของที่โค้ดวาดเหมือนเดิม)
> **ของทึบ** ต่อท้าย `[PAINTED VFX]` (พื้นเทา #E8E8E8) · **แสง/พลัง** ต่อท้าย `[VFX STYLE]` + บรรทัดสไตล์ภาพยนตร์ด้านล่าง (พื้นดำล้วน — pipeline ทำเป็นแสง additive)
> หลายเฟรม ต่อท้าย `[SHEET]` ด้วย

บรรทัดสไตล์ภาพยนตร์ (ใส่ทุกภาพ):
```
Japanese anime environment background, hand-painted cinematic scenery, premium JRPG game background,
semi-realistic painterly anime style, subtle clean linework, soft cel-painted shapes, visible brush texture,
warm golden-hour lighting, peach-orange highlights, cool teal-blue shadows, anime movie background quality,
illustrated, not photorealistic, not 3D
```

| ไฟล์ | อาชีพ | พื้น | Prompt |
|---|---|---|---|
| `knight-spirit-blade.png` [1] | Tofu | เทา `[PAINTED VFX]` | `a single spirit sword shaped like a giant glowing carrot, standing perfectly vertical with the hilt at the bottom and the sharp tip pointing straight up, orange crystal blade with a white-hot edge and faint fire wisps, green carrot-leaf crossguard, small leather-wrapped grip, soft orange glow around it, centered, full sword visible` |
| `archer-target-mark.png` [1] | Usagi | ดำ `[VFX STYLE]` | `a glowing green hunter's targeting sigil seen perfectly from directly above, flat circle: an outer ring of leaf shapes, an inner thin ring, four arrowhead ticks pointing inward, a small diamond in the center, bright mint-green lines with white core, perfectly round, centered` |
| `archer-spiral-arrow.png` [1] | Usagi | เทา `[PAINTED VFX]` | `one huge magic leaf arrow diving straight down, the arrowhead at the bottom of the image pointing down, long ivory-green shaft above it with leaf fletching at the top, three corkscrew ribbons of jade wind wrapped around the shaft, small leaves, vertical composition, centered, complete projectile on flat light gray #E8E8E8, no shadow` |
| `mage-vortex.png` [1] | Kinako | ดำ `[VFX STYLE]` | `a swirling galaxy whirlpool seen perfectly from directly above, four curved spiral arms of blue-violet starlight and small bubbles, a dark indigo eye in the center, tiny stars along the arms, a thin bright outer ring, perfectly round, centered` |
| `guard-pillow-dome.png` [1] | Pudding | ดำ `[VFX STYLE]` | `a soft translucent protective dome shaped like a puffy quilted pillow, seen from the front at a slight high angle, cream and warm yellow light, stitched quilt seams forming a honeycomb pattern, soft glowing edge, a few floating feathers, bottom edge flat and open, centered` |
| `cleric-halo.png` [1] | Momo | ดำ `[VFX STYLE]` | `a golden angel halo seen from a slightly high angle so it looks like a flat oval, double ring of warm gold light with tiny sakura petals and sparkles around it, bright white core, centered, wide composition` |
| `bard-spirit-bear.png` [2] | Mimi | ดำ `[VFX STYLE]` + `[SHEET]` | `a giant friendly translucent spirit bear made of warm pink-gold light, round ears, gentle smiling face, sitting upright, seen from the front: two frames — frame 1 arms spread wide open ready to hug, frame 2 arms wrapped closed in a big warm hug with little hearts floating up, same size and position in both frames` |

> Taro: เถา (`druid-vine-emerge`) และขดเถา (`druid-vine-coil`) ใช้ภาพจริงในเกมแล้ว

ภาพท่าประจำตัวอยู่ใน `assets/generated/vfx2/` ส่วนแผ่นอัลติและตีปกติครบ 7 อาชีพอยู่ใน `assets/generated/v2/moves/` · prompt ที่ใช้สร้างจริง: `output/imagegen/signature-moves-2026-09-28/prompts.json` และ prompt แก้ระยะช่อง: `refinements.json` ในโฟลเดอร์เดียวกัน · ภาพรวมเฟรมที่ตัดแล้วและผลตรวจอยู่ในโฟลเดอร์นั้นด้วย
