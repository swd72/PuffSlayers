# Puff Slayers — Sound Effect Prompts (v0.1)

> ทิศทางเสียง: **แฟนตาซีอนิเมะ อลังการแต่ละมุน** — เสียงจริง (foley + เวทมนตร์) ไม่ใช่ 8-bit/chiptune
> ตัวละครตัวกลมฟู → เสียงโดนตีเป็น "ปุ๊บ/ฟุ้บ" ของผ้านุ่มๆ แต่ท่าไม้ตายต้องหนักแน่นแบบ anime action
>
> ใช้ได้กับ **ElevenLabs Sound Effects** (แนะนำ), Stable Audio, AudioGen/AudioCraft ฯลฯ
> Prompt เป็นภาษาอังกฤษ (โมเดลเข้าใจดีกว่า)

---

## 0. วิธีใช้

1. สร้างทีละเสียงตามตาราง ตั้ง **ความยาว (Duration)** ตามช่อง "ยาว" ถ้าเครื่องมือให้ตั้ง
   - ElevenLabs: ตั้ง *Prompt influence* ≈ 0.5–0.7, สร้าง 3–4 takes แล้วเลือกที่ดีที่สุด
2. **ต่อท้ายทุก prompt ด้วย `[SFX STYLE]`** (ข้อ 1) เพื่อให้เสียงทั้งเกมเป็นชุดเดียวกัน
3. ตัดเงียบหัว–ท้ายออก (สำคัญมาก ไม่งั้นเสียงจะช้ากว่าภาพ) → Normalize peak ≈ **-1 dB**
   - Audacity: *Effect → Truncate Silence* แล้ว *Effect → Normalize*
4. Export **mp3 (128–192 kbps)** หรือ ogg, mono ก็พอ
5. ตั้งชื่อไฟล์ตามคอลัมน์ "ไฟล์" แล้ววางใน `apps/web/public/audio/sfx/`
   - เสียงที่เล่นบ่อย (hit, swing, pew, bonk) ทำ **2–3 takes** ตั้งชื่อ `hit.mp3`, `hit-2.mp3`, `hit-3.mp3` — เกมจะสุ่มสลับให้ไม่ซ้ำซาก
6. รีโหลดเกม — ไฟล์ไหนยังไม่มี เสียงนั้นจะเงียบ (ไม่มีเสียงสังเคราะห์แทน)

> ⚠️ ตรวจเงื่อนไขการใช้เชิงพาณิชย์ของเครื่องมือที่ใช้ (บางแพ็กเกจฟรีห้ามใช้เชิงพาณิชย์)

---

## 1. SFX Style — `[SFX STYLE]`

```
high quality fantasy anime mobile game sound effect, clean and punchy, soft cute textures,
magical sparkle layer, no music, no voice, no retro 8-bit, no chiptune, dry with a short tail
```

---

## 2. เสียงต่อสู้พื้นฐาน (เล่นบ่อย → สั้น เบา ไม่แสบหู)

| ไฟล์ | ยาว | ใช้ตอน | Prompt |
|------|-----|--------|--------|
| `swing.mp3` | 0.5s | ตีประชิด | `quick soft whoosh of a small sword swing through the air, light cloth flutter` |
| `pew.mp3` | 0.5s | ยิงไกล | `small magical projectile launch, soft airy fwip with a tiny sparkle, like a seed shot from a slingshot` |
| `hit.mp3` | 0.5s | โดนตีปกติ | `soft punchy impact on a fluffy plush toy, muffled thump with a tiny cloth puff` |
| `crit.mp3` | 0.7s | คริติคอล | `sharp powerful critical hit, heavy thump with a bright metallic sparkle ring, satisfying impact` |
| `miss.mp3` | 0.5s | หลบได้ | `quick light dodge whoosh, playful air swish` |
| `heal.mp3` | 1.0s | ฮีล | `gentle healing magic, soft rising shimmer with warm bell sparkles` |
| `buff.mp3` | 0.8s | ได้บัฟ | `short magical power up shimmer, bright ascending chime` |
| `bonk.mp3` | 0.8s | ดอกไม้โดนตีปลิว | `cute cartoon pop of a flower creature bursting into petals, soft poof with a springy bounce and a sprinkle of petals` |
| `faint.mp3` | 1.2s | ฮีโร่ล้ม (หลับ) | `sleepy cartoon collapse, soft plush flop onto grass followed by a tiny drowsy sigh sparkle` |

---

## 3. ท่าไม้ตาย (หนัก อลังการ แบบ anime)

| ไฟล์ | ยาว | ใช้ตอน | Prompt |
|------|-----|--------|--------|
| `cast.mp3` | 1.0s | เริ่มร่าย (ตอนแบนเนอร์ขึ้น) | `anime special move charge up, rising magical energy whoosh swelling into a bright shimmering flash, dramatic` |
| `ult-carrot-knight.mp3` | 1.5s | Carrot Crescent | `massive flaming sword crescent slash, roaring fire whoosh, blazing arc cutting the air, heavy explosive impact with crackling embers` |
| `ult-bubble-mage.mp3` | 1.8s | Bubble Bye-bye | `huge magical bubble spell, many large soap bubbles popping in a cascade, deep watery bloom, glittering crystal shimmer` |
| `ult-leaf-archer.mp3` | 1.5s | Leaf Storm | `a glowing arrow whooshing up into the sky, then a rain of many arrows hissing down and thudding into the ground with leafy bursts` |
| `ult-pillow-guard.mp3` | 1.5s | Ultimate Roll | `giant fluffy ball rolling fast then slamming the ground, deep heavy boom, soft dust whoosh, rumbling shockwave` |
| `ult-mochi-cleric.mp3` | 2.0s | Mochi Rain | `holy healing blessing, choir-like shimmering chord, soft bells, warm light raining down, peaceful and grand` |
| `ult-bell-bard.mp3` | 2.0s | Bear Hug Festival | `festive magical celebration burst, cheerful jingling bells, confetti pops and sparkles, uplifting power up` |

---

## 4. จังหวะเกม & UI

| ไฟล์ | ยาว | ใช้ตอน | Prompt |
|------|-----|--------|--------|
| `wave.mp3` | 1.5s | คลื่นศัตรูใหม่มา | `short fantasy battle horn call, distant and heroic, followed by rustling leaves` |
| `victory.mp3` | 3.0s | ผ่านด่าน | `short triumphant fantasy victory jingle, bright brass and bells, cute and cheerful` *(ไม่ต้องใส่ "no music")* |
| `defeat.mp3` | 2.5s | ทีมแพ้ | `short gentle sad jingle, soft descending bells, sleepy and cute rather than dramatic` *(ไม่ต้องใส่ "no music")* |
| `click.mp3` | 0.3s | กดปุ่ม | `soft tactile UI tap, gentle wooden pop, subtle and pleasant` |

---

## 5. เพลงประกอบ (ถ้าต้องการ) — ใช้ Suno / Udio / ElevenLabs Music

> ยังไม่ได้ต่อเข้ากับเกม — ได้ไฟล์แล้วบอกได้ จะเพิ่มระบบเพลงวน (loop) ให้

| ไฟล์ | ยาว | Prompt |
|------|-----|--------|
| `bgm-battle-meadow.mp3` | 90s loop | `upbeat cute fantasy adventure battle music for a mobile idle RPG, orchestral with pizzicato strings, flute and light percussion, energetic but cozy, seamless loop, instrumental` |
| `bgm-boss.mp3` | 90s loop | `epic yet cute anime boss battle music, driving drums, heroic brass, fast strings, playful motifs, seamless loop, instrumental` |
| `bgm-pond.mp3` | 90s loop | `relaxing cozy fishing mini game music, gentle acoustic guitar, soft marimba, water ambience, peaceful, seamless loop, instrumental` |
| `bgm-home.mp3` | 90s loop | `warm cheerful fantasy town menu music, music box, soft strings and woodwinds, cozy and inviting, seamless loop, instrumental` |

---

## 6. Checklist
- [ ] ตัดเงียบหัว–ท้ายทุกไฟล์ (เสียงต้องเริ่มทันทีที่เล่น)
- [ ] ความดังใกล้กันทั้งชุด (normalize) — เกมปรับ mix เพิ่มเองใน `VOLUME` ของ `apps/web/src/audio/sfx.ts`
- [ ] เสียงที่ใช้บ่อยมี 2–3 takes
- [ ] ชื่อไฟล์ตรงตามตาราง (ตัวพิมพ์เล็ก, ขีดกลาง)
