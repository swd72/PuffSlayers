# Puff Slayers — Project Memory (อ่านก่อนเริ่มงานทุก session)

Idle RPG บนเว็บ (มือถือเป็นหลัก) — สัตว์กลมฟู (Bunbun กระต่าย · Hamham แฮมสเตอร์ · Shibu ชิบะ) Bonk มอนสเตอร์ดอกไม้
ผู้ใช้สื่อสารภาษาไทย → ตอบเป็นภาษาไทย, ชื่อระบบ/โค้ดใช้อังกฤษได้

## เอกสารหลัก
- `docs/GDD.md` (v0.2) — ดีไซน์ทั้งหมด: ข้อ 0 แรงจูงใจ (ทุกวัย, เรื่อง "The Grumpy Bloom", สวนปลุกโลก), ข้อ 4 ต่อสู้, ข้อ 5 บอส/Giant, ข้อ 6 ไอเทม/อาวุธ/ของแรร์/สกิน, ข้อ 13.1 ได้พัฟ 3 ทาง (กาชา+ฟาร์ม+ตกปลา), ข้อ 16 decisions
- `docs/art-prompts-v2.md` — prompt ภาพชุดปัจจุบัน (มุม top-down 55°, เอฟเฟกต์แยกชิ้น origin/projectile/trail/impact/aftermath, ไอเทมข้อ 4.10) · `art-prompts.md` = v1 (ข้อ 7 ฉากหลังยังใช้)
- `docs/sfx-prompts.md` — prompt เสียง (ElevenLabs) · ยังไม่มีไฟล์เสียงจริง

## โครงสร้างโค้ด (npm workspaces)
| Path | หน้าที่ |
|---|---|
| `packages/sim` | ระบบต่อสู้ **deterministic** (seed เดิม = ผลเดิม), pure step(), tick 100ms · `data.ts` ค่าทั้งหมด/TUNING · `combat.ts` TickContext (AI, สกิล, บอส, ของแรร์) · `battle.ts` step/cast/wave · `units.ts` สร้างยูนิต+เลเวล/เกียร์ · `gear.ts` ไอเทม/ดรอป/ของแรร์ · `stages.ts` คลื่น/บอส/Giant |
| `apps/web` | Vite + TS + PixiJS v8 + GSAP + pixi-filters; UI เป็น HTML/CSS (cqw units) |
| `apps/web/src/scene` | `BattleScene` (ตัวคุม+จับคู่ event→เวลา impact) · `actor.ts` (ท่า/สถานะ/HP) · `skills.ts` (ตีปกติ, Cheek Cannon, บอส) · `ultimates.ts` (ท่าไม้ตาย 6 แบบ) · `projectiles.ts` · `fx.ts` (playFx/decal/statusLoop) · `anime.ts` (shockwave/zoom/speedlines/glow) |
| `apps/web/src/meta` | `save.ts` (localStorage `puff.save.v1`: stage, teamLevel, petals, items, equipped, skins) · `itemInfo.ts` (ชื่อไทย/ไอคอน) |
| `apps/web/src/ui` | `hud.ts` (แถบบน, portrait, บอสบาร์, cut-in, loot) · `inventory.ts` (หน้ากระเป๋า) |
| `apps/web/src/audio/sfx.ts` | เล่นไฟล์จาก `public/audio/sfx/<name>.mp3|ogg|wav` — **ห้ามกลับไปใช้เสียงสังเคราะห์** (ผู้ใช้บอกว่าป๋องแป๋ง) |
| `tools/extract-v2.mjs` | ตัดภาพ `assets/generated/{v2,vfx2}` → `apps/web/public/sprites/v2/*` + `manifest.json` (หาจุดตัดจากช่องว่าง, ลบพื้นเทา, key ควันดำ→additive, portrait อัตโนมัติ, ไอคอนแบบกริด) |

## คำสั่ง
```bash
npm run dev       # http://localhost:5173 (host:true → Wi-Fi 192.168.1.107, Tailscale 100.79.30.74)
npm test          # vitest (51 tests, coverage ~98% ของ sim)
npm run sprites   # รัน extract-v2 หลังเพิ่ม/แก้ภาพ
npm run build
```
launch config: `.claude/launch.json` ชื่อ `web` · **dev server ที่ Claude เปิดถูกแอปปิดเองบ่อย** → ต้อง `preview_start` ใหม่ / แนะนำผู้ใช้รัน `npm run dev` เอง

## สถานะเกมตอนนี้ (ทำเสร็จแล้ว)
- ต่อสู้เรียลไทม์เดินอิสระหลายทิศ, มุมมองแผนที่ top-down, ตัวละคร ~72px (ยักษ์ 250, บอส 170), เต็มจอทุกสัดส่วน (fitView)
- ทีม 6: Pudding (hamham pillow-guard), Tofu (shibu carrot-knight), Usagi (bunbun leaf-archer), Kinako (shibu bubble-mage), Momo (bunbun mochi-cleric), Mimi (hamham bell-bard)
- ท่าไม้ตาย: cast 900ms (เกมหยุด + cut-in แบนเนอร์) แล้วค่อยปล่อย; cooldown ต่างกันต่ออาชีพ; สกิล "ออกจากตัว→วิ่ง→กระแทก" (ลูกศร, เมล็ดพ่นจากปาก, ฟองลอย, โมจิโค้ง, กระโดดฟัน, กลิ้ง)
- Hamham Cheek Cannon, สถานะ bubble/sticky/sleepy, บอสทุก 5 ด่าน (เรียกสมุน, วงเตือนฟาดพื้น), **Giant Boss ทุก 10 ด่าน** (×2.4 HP, ENRAGED <50%)
- ความยากตามเลเวล (recommendedLevel = 6 + stage*2, ทีม +2 Lv/ด่าน — ตัวแทนชั่วคราว)
- อุปกรณ์ 5 ช่อง × 7 Tier, ดรอปตอนชนะ, ของแรร์ 6 ชิ้นมีผลจริง, สกิน 6 ชุด (ปลดล็อกทุกชุดเพื่อทดลอง), หน้ากระเป๋า, เซฟ localStorage

## ยังไม่ได้ทำ (ลำดับที่เสนอไว้)
1. ตีบวก + รวมของ + แยก Stardust · ชุดเซ็ต · Weapon Perk (Starry+) · ใช้ไอเทมเสริม (มีภาพแล้ว)
2. รางวัลตอนหลับ + อัปเลเวลด้วย Petal (Petal เก็บได้แต่ยังใช้ไม่ได้)
3. สวนปลุกโลก (GDD 0.5) · สมุดสะสม + กาชา Puff Capsule
4. ตกปลา, ภารกิจรายวัน, Co-op, Arena · เสียงจริง/เพลง · ฉากบอส Chapter 2–6 (มีภาพแล้วใน `assets/generated/v2/backgrounds`)
- Git: branch `master`, ยังไม่มี remote — ถามผู้ใช้ก่อน commit/push ทุกครั้ง

## วิธีตรวจงานในเบราว์เซอร์ (สำคัญ)
- Browser pane มักถูกซ่อน → rAF แทบไม่เดิน. ใช้ dev handle `window.__puff = { app, game, gsap, sfx }` แล้ว pump เฟรมเอง:
  ```js
  window.__pump = (ms, stop) => { const end = performance.now() + ms; while (performance.now() < end) { const t = performance.now(); while (performance.now() - t < 16) {} gsap.ticker.tick(); app.ticker.update(); if (stop && stop()) return true; } return false; };
  ```
- ข้ามด่าน: `g.state = g.newBattle(10)` (private แต่เข้าถึงได้ใน JS) + `g.scene.reset(); g.start()`
- ทดสอบมือถือด้วย `resize_window` preset mobile แล้ว reset เป็น desktop ตอนจบ
- CSS animation ตรวจด้วย `el.getAnimations()[0].currentTime = t` (pane ซ่อน)

## ความชอบของผู้ใช้ (จากการคุยที่ผ่านมา)
- ต้องการภาพสไตล์ anime fantasy อลังการ แต่ตัวละครน่ารัก, มุมแผนที่ top-down แบบภาพอ้างอิง
- ไม่ต้องการ turn-based / ยืนประจำช่อง; เอฟเฟกต์ต้องเดินทางจากตัวละคร ไม่ใช่ก้อนระเบิดกับที่
- สร้างภาพเองด้วย AI ตาม prompt แล้วบอก "ทำภาพแล้ว" → หาไฟล์ใหม่ใน `assets/generated/` แล้วรัน pipeline
- ชอบให้ลงมือทำเลย แล้วสรุปผลเป็นภาษาไทยพร้อมตาราง/ข้อจำกัดตามจริง
