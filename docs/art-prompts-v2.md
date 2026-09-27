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

**คำขยายตาม Tier** (ใส่ต่อท้ายชื่อของ ให้ของ Tier สูงดูหรูขึ้นจริง ไม่ใช่แค่เปลี่ยนสีกรอบ)
| Tier | `<TIER LOOK>` |
|------|---------------|
| Crumb | `simple homemade look, plain wood and cloth, slightly worn` |
| Fluffy | `soft fluffy trim, mint green ribbon accents` |
| Silky | `polished with silky sky-blue fabric and silver fittings` |
| Dreamy | `lavender enchanted glow, tiny floating stars` |
| Starry | `gold and peach ornate details, sparkling gem, radiant glint` |
| Mythic Puff | `legendary, rainbow iridescent material, bouncy aura, glowing runes` |
| Cosmic Cotton | `mythical, dark galaxy material with swirling nebula and twinkling stars inside` |

### อาวุธ — ไล่ Tier ในแถวเดียว (ใช้ดูภาพรวม แล้วค่อยทำทีละชิ้นถ้าต้องการคมชัด)
```
Seven game weapon icons in a single row showing an upgrade progression from humble to legendary:
<WEAPON>, 1 simple homemade, 2 fluffy mint trim, 3 silky blue and silver, 4 lavender enchanted glow,
5 ornate gold with gems, 6 rainbow iridescent legendary, 7 cosmic galaxy material.
Same weapon shape family across all seven, each clearly fancier than the last. [ICON] [SHEET]
```
| อาชีพ | `<WEAPON>` |
|------|-------------|
| Pillow Guard | `a round pillow shield with a paw emblem` |
| Carrot Knight | `an oversized carrot greatsword with a leafy hilt` |
| Leaf Archer | `a curved bow made of a living vine` |
| Bubble Mage | `a magic wand with a soap bubble at the tip` |
| Mochi Cleric | `a staff topped with a glowing mochi and dango` |
| Bell Bard | `a golden handbell with ribbons` |

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
