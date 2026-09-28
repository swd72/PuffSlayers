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
