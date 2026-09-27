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
| `packages/sim` | ระบบต่อสู้ **deterministic** (seed เดิม = ผลเดิม), pure step(), tick 100ms · `data.ts` ค่าทั้งหมด/TUNING · `combat.ts` TickContext (AI, สกิล, บอส, ของแรร์) · `battle.ts` step/cast/wave · `units.ts` สร้างยูนิต+เลเวล/เกียร์ · `gear.ts` ไอเทม/ดรอป/ของแรร์ · `forge.ts` ตีบวก/รวม/แยก/สุ่ม substat/ย้าย +N · `progression.ts` ค่าเลเวล Petal, Petal ต่อด่าน, Nap Bank · `stages.ts` คลื่น/บอส/Giant · `puffs.ts` แคตตาล็อกพัฟ 13 ตัว + กาชา/ดาว/ชิ้นส่วน · `quests.ts` ภารกิจรายวัน+ปฏิทิน local · `fishing.ts` ปลา/สมุดปลา/ตกอัตโนมัติ · `arena.ts` คู่แข่ง Arena (`PVP`) + Raid |
| `apps/web` | Vite + TS + PixiJS v8 + GSAP + pixi-filters; UI เป็น HTML/CSS (cqw units) |
| `apps/web/src/scene` | `BattleScene` (ตัวคุม+จับคู่ event→เวลา impact) · `actor.ts` (ท่า/สถานะ/HP) · `skills.ts` (ตีปกติ, Cheek Cannon, บอส) · `ultimates.ts`/`ultimateSupport.ts` (ท่าไม้ตาย 6 แบบ เป็นคอมโบ 1.5–2 วิ หลายฮิต — ดาเมจเดียวจาก sim ถูกแบ่งแสดงตามจังหวะฮิต, finisher ใหญ่สุด) · `choreo.ts` (at/dash/hop/script — ทุกสเต็ปเช็กว่า actor ยังไม่ถูก destroy) · `projectiles.ts` · `fx.ts` (playFx/decal/statusLoop) · `anime.ts` (shockwave/zoom/speedlines/glow) |
| `apps/web/src/meta` | `save.ts` (localStorage key `puff.save.v1` แต่ข้อมูล `v: 4` — v4 เพิ่ม owned/stars/shards/dew/pity/daily/pond/arena/raid/intro; `ownedRoster()`, `welcomePuff()`) · `album.ts` `daily.ts` `pond.ts` `pvp.ts` (Arena/Raid) `power.ts` (เกียร์+ดาว+สวน+สมุดปลา = พลังที่ใช้สู้) `guide.ts` (เป้าหมายถัดไป, ชื่อบท, `stageLabel` แบบ บท-ด่าน) `unlocks.ts` (ตึกปลดล็อกตามด่าน, `?dev` เปิดทั้งหมด) · เดิม: (ข้อมูลเดิม `v: 3`: stage, team, levels ต่อตัว, petals, stardust, lastSeen, pendingNap, items, equipped, skins — migrate จาก v1/v2 + `withRoster()` เติมพัฟที่เพิ่มเข้ามาใหม่ให้เซฟเก่าเอง) · `workshop.ts` (อัปเลเวล/ตีบวก/รวม/แยก บนเซฟ + ข้อความ toast) · `itemInfo.ts` (ชื่อไทย/ไอคอน) |
| `apps/web/src/ui` | `sheet.ts` (ฐานหน้าต่างตึก) · `album.ts` `board.ts` `pond.ts` (มินิเกมตกปลา DOM+rAF) `arena.ts` `raid.ts` `result.ts` `story.ts` `side.ts` (แผงข้างบน PC กว้าง ≥1000px) · `village.css` · `hud.ts` (แถบบน, portrait, บอสบาร์, cut-in, loot) · `inventory.ts` (หน้ากระเป๋า+อัปเลเวล) · `itemDetail.ts` (การ์ดไอเทม+ปุ่มตีบวก/รวม/แยก) · `nap.ts` (หน้า "ขณะที่คุณหลับ…") · `workshop.css` |
| `apps/web/src/audio/sfx.ts` | เล่นไฟล์จาก `public/audio/sfx/<name>.mp3|ogg|wav` — **ห้ามกลับไปใช้เสียงสังเคราะห์** (ผู้ใช้บอกว่าป๋องแป๋ง) |
| `tools/extract-v2.mjs` | ตัดภาพ `assets/generated/{v2,vfx2}` → `apps/web/public/sprites/v2/*` + `manifest.json` (หาจุดตัดจากช่องว่าง, ลบพื้นเทา, key ควันดำ→additive, portrait อัตโนมัติ, ไอคอนแบบกริด) |

## คำสั่ง
```bash
npm run dev       # http://localhost:5173 (host:true → Wi-Fi 192.168.1.107, Tailscale 100.79.30.74)
npm test          # vitest (108 tests)
npm run sprites   # รัน extract-v2 หลังเพิ่ม/แก้ภาพ
npm run build
```
launch config: `.claude/launch.json` ชื่อ `web` · **dev server ที่ Claude เปิดถูกแอปปิดเองบ่อย** → ต้อง `preview_start` ใหม่ / แนะนำผู้ใช้รัน `npm run dev` เอง

## สถานะเกมตอนนี้ (ทำเสร็จแล้ว)
- ต่อสู้เรียลไทม์เดินอิสระหลายทิศ, มุมมองแผนที่ top-down, ตัวละคร ~72px (ยักษ์ 250, บอส 170), เต็มจอทุกสัดส่วน (fitView)
- Roster 7 ตัว ลงสนาม 6 (`ROSTER`/`TEAM_SIZE` ใน assets.ts, สลับ "ลงทีม/พัก" ในกระเป๋า, `save.team`): Pudding (hamham pillow-guard), Tofu (shibu carrot-knight), Usagi (bunbun leaf-archer), Kinako (shibu bubble-mage), Momo (bunbun mochi-cleric), Mimi (hamham bell-bard), **Taro (molemo root-druid)** — เผ่าตุ่นใหม่ (ไม่ติด Sticky), สถานะ **Rooted** (`rootMs`: เดินไม่ได้แต่ยังตีได้), อัลติ Root Awakening (`scene/rootDruid.ts`)
- Taro มีภาพจริงแล้ว (stand-in จะใช้เฉพาะพัฟที่ยังไม่มีแผ่น:  (`STAND_IN` ใน assets.ts = แผ่น hamham-bell-bard ย้อมน้ำตาล + CSS `.stand-in`, เอฟเฟกต์ยืม boss-summon/boss-vine-slam ย้อมเขียว ผ่าน `vfxOr()`)) · pipeline รองรับ job `optional` (ข้ามถ้ายังไม่มีไฟล์)
- **ปิกนิกก่อนลุย** (GDD 6.12, `sim/pantry.ts`, `meta/picnic.ts`, `ui/lunchbox.ts`): วัตถุดิบ 16 ชนิดดรอปจากด่าน, แต่ละพัฟเลือกมื้อก่อนลุย → กินอัตโนมัติก่อนทุกด่าน (รวมตอนเริ่มใหม่หลังแพ้), บางอย่างเป็นพิษกับบางเผ่าตามสัตว์จริง (ปวดท้อง = บัฟติดลบ), สมุดอาหาร `save.foodLog` · ไอคอนวัตถุดิบยังไม่มีภาพ (แสดงเป็นวงกลมตัวอักษร) → prompt ใน art-prompts ข้อ 4.10
- **อาวุธ 7 Tier ออกแบบใหม่:** ทำทีละ Tier ที่ `assets/generated/v2/items/weapons/<class>-t<1-7>.png` (ทับแผ่นแถวเดิมทีละ Tier) · ห้ามกลับไปใช้ template แถวเดียว "same shape family"
- ท่าไม้ตาย: cast 900ms (เกมหยุด + cut-in แบนเนอร์) แล้วค่อยปล่อย; cooldown ต่างกันต่ออาชีพ; สกิล "ออกจากตัว→วิ่ง→กระแทก" (ลูกศร, เมล็ดพ่นจากปาก, ฟองลอย, โมจิโค้ง, กระโดดฟัน, กลิ้ง)
- Hamham Cheek Cannon, สถานะ bubble/sticky/sleepy, บอสทุก 5 ด่าน (เรียกสมุน, วงเตือนฟาดพื้น), **Giant Boss ทุก 10 ด่าน** (×2.4 HP, ENRAGED <50%)
- ความยากตามเลเวล (recommendedLevel = 6 + stage*2) · **เลเวลต่อตัวอัปด้วย Petal** (ราคา ×1.08/เลเวล, Petal/ตัวที่ Bonk ×1.08²/ด่าน + โบนัสผ่านด่าน) — ไม่มี +2 Lv/ด่านอัตโนมัติแล้ว
- อุปกรณ์ 5 ช่อง × 7 Tier, ดรอปตอนชนะ, ของแรร์ 6 ชิ้นมีผลจริง, สกิน 6 ชุด (ปลดล็อกทุกชุดเพื่อทดลอง), หน้ากระเป๋า, เซฟ localStorage · **ตีบวก** (+1–3 สำเร็จเสมอ, เกจการันตี, ไม่แตก) · **รวม** 3→Tier ถัดไป (+รวมอัตโนมัติ Crumb–Silky) · **แยก** → Stardust · สุ่ม substat · ย้าย +N · **Nap Bank** (สูงสุด 12 ชม., ฟาร์มด่านล่าสุดที่ผ่าน, แตะรับทีเดียว)

- **หน้าหมู่บ้าน (Hub)** `ui/hub.ts` + **เตรียมลงด่าน** `ui/prep.ts` (`ui/hub.css`): เปิดเกมมาที่หมู่บ้าน, สนามหยุด (`game.mode`), เวลาในหมู่บ้านนับเป็น Nap, ปุ่มบนซ้ายในสนาม = กลับหมู่บ้าน, มื้อก่อนลุยเสิร์ฟตอนกด "เริ่มลุย!" · ตึก 6 หลังล็อกไว้ตามเฟส (ภาพ: art-prompts ข้อ 8)

- **สวนปลุกโลก (เฟส 2 ✅)** `sim/garden.ts` · `meta/garden.ts` · `ui/garden.ts`+`garden.css`: Bonk ดอกไม้มีโอกาสได้เมล็ด (บอสได้แน่นอน, นับทั้งชนะ/แพ้), ปลูก 6 แปลงโตตามเวลาจริง (ออฟไลน์ก็โต), รดน้ำได้ครั้งละขั้น, เก็บดอก → บัฟถาวรทั้งทีม (ทุก 5 ดอก, มีเพดาน) + % ฟื้นฟูโลก · ภาพต้นไม้แต่ละขั้นยังไม่มี (ใช้สไปรต์ดอกไม้ศัตรูย่อขนาดแทน; รองรับแผ่น `garden/<seed>` 4 เฟรม)
- **อาวุธในมือ (ชั้นแยก)** `scene/weaponHold.ts`: ถ้ามีแผ่น `hero-bare/*` เกมใช้ตัวละครมือเปล่า + วางไอคอนอาวุธ Tier ที่ใส่ตามท่า (ตาราง `WEAPON_POSE` ปรับสดได้ที่ `window.__puff.weaponPose`) · ยังไม่มีภาพมือเปล่า → prompt art-prompts ข้อ 10 · **ห้ามใช้ `gsap.killTweensOf([...])` กับ array ของ Pixi object — ไม่ kill อะไรเลย ให้เรียกทีละตัว**

- **เฟส 3–5 (local) ✅:** สมุดพัฟ 13 ตัว (7 เริ่มต้น + Latte/Senbei/Nugget/Sakura ★5, Daifuku/Kuma-Shiba ★6 — ยังใช้ภาพยืมอาชีพเดียวกัน, prompt art-prompts ข้อ 11) · Puff Capsule (Dew Drop, ฟรีวันละครั้ง, pity ★4/10 ★5/60, spark 150) · ชิ้นส่วนพัฟประจำบทจากทุกด่าน (บอสมากกว่า) · ภารกิจรายวัน · Puff Pond · Arena พัฟ vs พัฟ (`BattleConfig.rivals` + `puffHpScale`, คู่แข่งยิงอัลติเอง, 90 วิ) · Raid (EnemySpec `hpMult`/`hpLeft`, 60 วิ/รอบ, Game mode `'raid'`) · ด่านแสดงเป็น "บท-ด่าน" (10 ด่าน/บท)
- **เลย์เอาต์:** `#app` เป็นกรอบ 9:16; จอกว้างมีแผงข้างซ้าย/ขวา + พื้นหลังเบลอ · หมู่บ้านวางตึกบน `.hub-world` ที่สัดส่วนเท่าภาพ (941×1672) จึงไม่เพี้ยนทุกจอ
- **ห้ามใช้ class `.ready` ใน UI ใหม่** — ชนกับป้าย ULT ของ HUD (style.css) ใช้ `.hot` แทน
- `BattleScene.reset()` kill ทุก tween (`gsap.exportRoot().kill()`) + ล้างเลเยอร์ fx; `ActorView.destroy()` ถอดออกทันทีแต่ free ทีหลัง 5 วิ (`actor.removed` แทน `root.destroyed`)

- Git: remote `origin` = GitHub swd72/PuffSlayers · **ทำงานเสร็จแต่ละรอบ: commit + push ทันที แล้ว merge เข้า `master` แล้ว push `master` ด้วย (ผู้ใช้สั่งไว้ ไม่ต้องถามซ้ำ)** · ผู้ใช้ push ภาพเข้า master เองได้ → `git fetch` + merge master ก่อนเริ่มงาน

## ยังไม่ได้ทำ
- ต่อเซิร์ฟเวอร์ (Arena ของผู้เล่นจริง, Raid pool ร่วม), Co-op Burrow Run, ร้าน Honor, ทำอาหารจากปลา
- ภาพพัฟใหม่ 6 ตัว, ภาพปลา/ไอคอนวัตถุดิบ · อื่นๆ: ชุดเซ็ต, Weapon Perk, บาลานซ์ Petal/Raid, เสียงจริงที่ยังขาด

## วิธีตรวจงานในเบราว์เซอร์ (สำคัญ)
- Browser pane มักถูกซ่อน → rAF แทบไม่เดิน. ใช้ dev handle `window.__puff = { app, game, gsap, sfx }` แล้ว pump เฟรมเอง:
  ```js
  window.__pump = (ms, stop) => { const end = performance.now() + ms; while (performance.now() < end) { const t = performance.now(); while (performance.now() - t < 16) {} gsap.ticker.tick(); app.ticker.update(); if (stop && stop()) return true; } return false; };
  ```
- ข้ามด่าน: `g.state = g.newBattle(10)` (private แต่เข้าถึงได้ใน JS) + `g.scene.reset(); g.start()`
- ทดสอบ Nap Bank: แก้ `lastSeen` ใน localStorage ให้ถอยหลัง (เช่น −3 ชม.) แล้ว reload · pane ซ่อน = `visibilityState` hidden → heartbeat ไม่ stamp เวลา
- ทดสอบมือถือด้วย `resize_window` preset mobile แล้ว reset เป็น desktop ตอนจบ
- CSS animation ตรวจด้วย `el.getAnimations()[0].currentTime = t` (pane ซ่อน)

## ความชอบของผู้ใช้ (จากการคุยที่ผ่านมา)
- ต้องการภาพสไตล์ anime fantasy อลังการ แต่ตัวละครน่ารัก, มุมแผนที่ top-down แบบภาพอ้างอิง
- ไม่ต้องการ turn-based / ยืนประจำช่อง; เอฟเฟกต์ต้องเดินทางจากตัวละคร ไม่ใช่ก้อนระเบิดกับที่
- สร้างภาพเองด้วย AI ตาม prompt แล้วบอก "ทำภาพแล้ว" → หาไฟล์ใหม่ใน `assets/generated/` แล้วรัน pipeline
- ชอบให้ลงมือทำเลย แล้วสรุปผลเป็นภาษาไทยพร้อมตาราง/ข้อจำกัดตามจริง
