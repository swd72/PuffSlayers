# Puff Slayers — ภาพไอเทมจาก art-prompts-v2.md ข้อ 4.10

สร้างจาก prompt ใน `docs/art-prompts-v2.md` ข้อ 4.10 โดยแทนค่าอาวุธ ช่องอุปกรณ์ ของแรร์ และสกินตามตารางในหัวข้อนั้น และใช้ระดับ Tier จาก `docs/GDD.md` ข้อ 6 ภาพอาวุธแยก Tier ใน `weapons/` ถูกตัดเป็นไอคอน 128×128 และใช้ในเกมผ่าน `npm run sprites` แล้ว

## อาวุธ 7 Tier (ซ้ายไปขวา: Crumb, Fluffy, Silky, Dreamy, Starry, Mythic Puff, Cosmic Cotton)

ภาพอาวุธดีไซน์ใหม่อยู่ใน [`weapons/`](weapons/) เป็นไฟล์ `<class>-t1.png` ถึง `t7.png` อาชีพละ 7 ภาพ รวม 49 ภาพ ตัวตัดสไปรต์ใช้ภาพเหล่านี้ทับ Tier ที่ตรงกันจากแผ่นแถวเดิมด้านล่าง

- [Carrot Knight](carrot-knight-seven-tiers.png)
- [Pillow Guard](pillow-guard-seven-tiers.png)
- [Leaf Archer](leaf-archer-seven-tiers.png)
- [Bubble Mage](bubble-mage-seven-tiers.png)
- [Mochi Cleric](mochi-cleric-seven-tiers.png)
- [Bell Bard](bell-bard-seven-tiers.png)

## อุปกรณ์และไอเทมเสริม

- [หมวก 8 แบบ](headgear-eight-icons.png)
- [ชุด 8 แบบ](outfits-eight-icons.png)
- [Charm 8 แบบ](charms-eight-icons.png)
- [Trinket 8 แบบ](trinkets-eight-icons.png)
- [Booster 6 แบบ](boosters-six-icons.png)

## วัตถุดิบปิกนิก

[แผ่นวัตถุดิบ 16 ชิ้น](ingredients-sixteen-icons.png) ตาม prompt ข้อ 4.10 เป็นกริด 4×4 เรียงซ้าย→ขวา บน→ล่างตรงกับ `INGREDIENT_IDS` ใน `packages/sim/src/pantry.ts`:

| แถว | ชิ้นที่ 1 | ชิ้นที่ 2 | ชิ้นที่ 3 | ชิ้นที่ 4 |
|---|---|---|---|---|
| 1 | โคลเวอร์หวาน | แดนดิไลออน | แครอทแดดอุ่น | มันหวานเผา |
| 2 | เมล็ดทานตะวัน | ลูกโอ๊กกรอบ | อัลมอนด์ขม | องุ่นป่า |
| 3 | มะนาวหยดน้ำผึ้ง | อะโวคาโดป่า | หัวหอมป่า | ฝักโกโก้ |
| 4 | เห็ดเรืองแสง | รวงผึ้ง | ไส้เดือนดุ๊กดิ๊ก | เบอร์รี่แสงจันทร์ |

`npm run sprites` ตัดและลบพื้นหลังเทาของแผ่นต้นฉบับเป็น PNG โปร่งใส 128×128 ที่ `apps/web/public/sprites/v2/item/ingredient-0.png` ถึง `ingredient-15.png` พร้อม manifest `item/ingredient` 16 เฟรม เกมใช้ไอคอนในช่องมื้อก่อนลุย ตู้วัตถุดิบ และของดรอปหลังผ่านด่านผ่าน `ingredientIcon()`.

## ของแรร์

- [Carrot Excalibur](relic-carrot-excalibur.png)
- [Bottomless Cheek Pouch](relic-bottomless-cheek-pouch.png)
- [Grandma's Knitted Scarf](relic-grandmas-knitted-scarf.png)
- [Moonlit Lullaby Bell](relic-moonlit-lullaby-bell.png)
- [Sunflower Crown](relic-sunflower-crown.png)
- [Lucky Clover Pin](relic-lucky-clover-pin.png)

## สกิน (Model Sheet / Pose Set)

- Pajama Pudding: [model](skins/pajama-pudding-model.png) · [6 poses](skins/pajama-pudding-poses.png)
- Sakura Festival Momo: [model](skins/sakura-festival-momo-model.png) · [6 poses](skins/sakura-festival-momo-poses.png)
- Pumpkin Knight Tofu: [model](skins/pumpkin-knight-tofu-model.png) · [6 poses](skins/pumpkin-knight-tofu-poses.png)
- Rainbow Ranger Usagi: [model](skins/rainbow-ranger-usagi-model.png) · [6 poses](skins/rainbow-ranger-usagi-poses.png)
- Snow Globe Kinako: [model](skins/snow-globe-kinako-model.png) · [6 poses](skins/snow-globe-kinako-poses.png)
- Bear King Mimi: [model](skins/bear-king-mimi-model.png) · [6 poses](skins/bear-king-mimi-poses.png)

กรอบความแรร์ 7 Tier ใช้ภาพเดิมที่ [`assets/generated/items/rarity-frames.png`](../../items/rarity-frames.png) ตามตัวเลือกใน prompt ข้อ 4.10 กรอบแต่ละขั้นมีลายและรูปทรงต่างกัน ไม่อาศัยสีอย่างเดียว

ภาพอาวุธ/ไอเทมอยู่บนพื้นหลังเทาอ่อน ภาพ pose set 5 แผ่นมีพื้นหลังโปร่งใส และ Snow Globe Kinako pose set อยู่บนพื้นหลังเทาอ่อน
