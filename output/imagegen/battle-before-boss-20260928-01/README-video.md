# PuffSlayers — การต่อสู้ก่อนถึงบอส

สร้างด้วยเครื่องมือ image_gen แบบ built-in โดยอ้างอิงภาพเกมที่แนบมา
ภาพแนวตั้ง 9:16 จำนวน 6 ซีน แยกไฟล์ ไม่มี UI และไม่มีบอส
เลือกใช้ตัวละคร 4 ตัวที่เห็นในสนามต่อสู้: แมวแทงก์ แมวดาบ กระต่าย และนักธนูชุดเขียว
ไฟล์ reference-game.png คือภาพอ้างอิงเดิม ไม่ใช่ซีนสำหรับตัดต่อ
พรอมป์ต์สร้างภาพฉบับเต็มอยู่ใน image-prompts.json

## ลำดับตัดต่อที่แนะนำ

| เวลา | ไฟล์ | เหตุการณ์ |
|---|---|---|
| 0–4 วินาที | 01-encounter.png | ทีมเผชิญหน้ามอนสเตอร์ดอกไม้ |
| 4–8 วินาที | 02-enemy-charge.png | ศัตรูพุ่งเข้ามา ทีมเตรียมรับ |
| 8–12 วินาที | 03-shield-block.png | แมวแทงก์รับการโจมตีด้วยโล่ |
| 12–16 วินาที | 04-sword-counter.png | แมวดาบฟันสวน |
| 16–20 วินาที | 05-magic-and-arrow.png | กระต่ายยิงเวท นักธนูยิงสมทบ |
| 20–24 วินาที | 06-victory-walk.png | ทีมชนะและเดินต่อ ยังไม่ถึงบอส |

ระยะเวลาเป็นข้อเสนอสำหรับลองทำวิดีโอ ไม่ได้มีไฟล์วิดีโอสร้างไว้ในชุดนี้
ใช้แต่ละภาพเป็นภาพเริ่มต้นของคลิปแยก แล้วตัดต่อเรียงตามเลขซีน
หากเครื่องมือรองรับภาพเริ่มและภาพจบ สามารถลองใช้ซีน 01 → 02 และ 02 → 03 เป็นคู่ภาพได้
ซีน 03 → 04 และ 04 → 05 เปลี่ยนมุมกล้อง จึงเหมาะกับการทำคลิปแยกแล้วตัดสลับมากกว่าบังคับให้ภาพค่อย ๆ แปลงร่าง

## พรอมป์ต์การเคลื่อนไหวสำหรับ Image-to-video

เพิ่มข้อความนี้ท้ายทุกซีน:

Preserve the input image's exact four hero identities, faces, fur patterns, costumes, weapon shapes, character count, painterly chibi fantasy art, warm afternoon lighting, meadow location, and vertical 9:16 framing. Keep motion readable and faces sharp. No new characters, no boss, no text, no UI, no damage numbers, no gore. Do not morph bodies, duplicate characters or weapons, or redesign the environment.

### 01 — เผชิญหน้า

4-second shot. Slow gentle camera push toward the hero party and the ordinary flower monsters. The heroes settle into alert battle poses while the enemies sway and lean forward. Blue capes and meadow flowers flutter in a breeze. A few petals drift past camera; distant waterfalls flow softly. End with the tank beginning to lift its shield.

### 02 — ศัตรูบุก

4-second shot. The sunflower monsters and yellow flower-bud enemy continue charging toward the party, kicking up small dust clouds and petals. The tank braces and raises its rectangular stone shield. The sword cat shifts its weight forward, while the rabbit and woodland archer stay ready behind. Slight camera push in; preserve clear silhouettes.

### 03 — ตั้งรับ

4-second shot. The sunflower's leafy fist presses against the tank's stone shield. A brief gold impact spark flashes at the existing contact point. The tank leans into the block and holds firm as dust and petals scatter, then settle. The sunflower recoils slightly. The sword cat prepares to advance in the background. One impact only, subtle camera shake, shield remains intact.

### 04 — ฟันสวน

4-second shot. Continue the sword cat's existing single sweeping slash with its blue-violet sword. The bright curved trail follows the blade then fades. The sunflower recoils backward through a spray of yellow petals, while the tank maintains its guard behind. A slight camera track follows the sword cat. One clean slash only; keep the sword and hero consistent.

### 05 — เวทและธนู

4-second shot. The rabbit's existing golden magic bolt pulses and travels toward the yellow flower-bud enemy, while the existing green arrow travels toward the sunflower. Enemies recoil and dissolve gently into petals and small magical sparkles. The rabbit lowers the staff slightly and the archer relaxes the bow after the shot. The two cats keep guard. Keep the two effect paths separate and avoid covering faces.

### 06 — เดินต่อ

4-second shot. The four heroes walk slowly onward along the empty meadow path, weapons lowered, with relaxed happy expressions. Their capes, ears, and tails bounce gently with their steps. Remaining gold sparkles fade and petals drift in the breeze. Camera follows from behind with a gentle widening movement, ending on the peaceful trail ahead. No enemies appear, and the party remains in the meadow before reaching any boss.

