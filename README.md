# Puff Slayers

Idle RPG บนเว็บ — กองทัพสัตว์กลมฟูตีมอนสเตอร์ดอกไม้ ดูแนวทางทั้งหมดใน [docs/GDD.md](docs/GDD.md)

## โครงสร้าง

| Path | หน้าที่ |
|------|--------|
| `packages/sim` | ระบบต่อสู้แบบ deterministic (seed เดิม = ผลเดิม) ใช้ร่วมกันได้ทั้ง client/server |
| `apps/web` | หน้าจอเกม: Vite + TypeScript + PixiJS v8 + GSAP |
| `tools/extract-v2.mjs` | ตัดภาพชุด v2 (`assets/generated/v2`, `vfx2`) เป็นเฟรม ลบพื้นหลัง เขียน `apps/web/public/sprites/v2/manifest.json` |
| `assets/` | ภาพ concept จาก AI (ต้นฉบับ) |
| `docs/` | GDD และ prompt สร้างภาพ |

## คำสั่ง

```bash
npm install
npm run dev        # เปิดเกมที่ http://localhost:5173
npm test           # เทสต์ระบบต่อสู้
npm run sprites    # ตัด sprite ใหม่หลังแก้/เพิ่มภาพใน assets/generated
npm run build      # build production
```
