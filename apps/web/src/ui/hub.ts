// The village (hub): where the player lands, manages puffs and gear, and heads out on an adventure.
// Buildings for later phases are shown locked so the village already feels like a place.
import { recommendedLevel, isBossStage, isGiantStage } from '@puff/sim';
import { BACKGROUND, STAGE_NAME, frameUrl, hasSheet } from '../assets';

/** Generated village art (docs/art-prompts-v2.md §8); until it exists the meadow and drawn signs stand in. */
const VILLAGE_BG = '/sprites/v2/bg/village-hub.jpg';
const BUILDING_SHEET = 'item/building';
import { teamLevel, type SaveData } from '../meta/save';
import { readyBlooms } from '../meta/garden';

export interface HubDeps {
  getSave(): SaveData;
  onAdventure(): void;
  onOpenBag(): void;
  onOpenTeam(): void;
  /** an unlocked building was tapped */
  onBuilding(id: string): void;
  onClick(): void;
}

interface Building {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  /** position on the village map, % of the screen */
  readonly x: number;
  readonly y: number;
  readonly icon: string;
  /** which roadmap phase opens it (undefined = open now) */
  readonly phase?: number;
}

const BUILDINGS: readonly Building[] = [
  { id: 'garden', name: 'สวนปลุกโลก', note: 'ปลูกเมล็ดจากการ Bonk', x: 24, y: 30, icon: '<path d="M12 21 V11"/><path d="M12 13 C8 13 6 10 6 6 C10 6 12 9 12 13 Z"/><path d="M12 11 C12 7 14 4 18 4 C18 8 16 11 12 11 Z"/><path d="M6 21 H18"/>' },
  { id: 'album', name: 'สมุดพัฟ', note: 'สะสม & ตู้ Puff Capsule', x: 74, y: 27, phase: 3, icon: '<path d="M5 4 H17 A2 2 0 0 1 19 6 V20 H7 A2 2 0 0 1 5 18 Z"/><path d="M5 18 A2 2 0 0 1 7 16 H19"/><circle cx="12" cy="10" r="2.5"/>' },
  { id: 'board', name: 'กระดานภารกิจ', note: 'ภารกิจรายวัน', x: 50, y: 40, phase: 4, icon: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9 H15 M9 13 H15 M9 17 H12"/>' },
  { id: 'pond', name: 'บ่อตกปลา', note: 'Puff Pond', x: 20, y: 55, phase: 4, icon: '<path d="M4 15 C7 12 10 12 12 15 C14 18 17 18 20 15"/><path d="M14 9 C16 7 19 8 20 10 C19 12 16 13 14 11 L12 12 L12 8 Z"/>' },
  { id: 'arena', name: 'ลานประลอง', note: 'Pillow Fight Arena', x: 79, y: 52, phase: 5, icon: '<path d="M6 18 L16 8"/><path d="M18 18 L8 8"/><path d="M14 6 H18 V10 M10 6 H6 V10"/>' },
  { id: 'raid', name: 'รังบอสยักษ์', note: 'Raid รายสัปดาห์', x: 50, y: 20, phase: 5, icon: '<path d="M4 18 L7 8 L12 13 L17 8 L20 18 Z"/><path d="M4 18 H20"/>' },
];

export class HubScreen {
  private readonly el: HTMLElement;
  private toastTimer = 0;

  constructor(
    root: HTMLElement,
    private readonly deps: HubDeps,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'hub';
    this.el.setAttribute('aria-label', 'หมู่บ้านพัฟ');
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => this.onClick(e));
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  show(): void {
    this.el.hidden = false;
    this.render();
  }

  hide(): void {
    this.el.hidden = true;
  }

  /** Refresh numbers (Petals, levels) while open. */
  refresh(): void {
    if (!this.el.hidden) this.render();
  }

  private onClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!target) return;
    this.deps.onClick();
    switch (target.dataset.act) {
      case 'adventure':
        return this.deps.onAdventure();
      case 'bag':
        return this.deps.onOpenBag();
      case 'team':
        return this.deps.onOpenTeam();
      case 'building': {
        const b = BUILDINGS.find((x) => x.id === target.dataset.id);
        if (b?.phase) this.toast(`${b.name} กำลังสร้างอยู่ — เปิดในเฟส ${b.phase}`);
        else if (b) this.deps.onBuilding(b.id);
        return;
      }
    }
  }

  private toast(text: string): void {
    const t = this.el.querySelector<HTMLElement>('.hub-toast');
    if (!t) return;
    t.textContent = text;
    t.classList.add('on');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.remove('on'), 1800);
  }

  /** Live line under an open building. */
  private note(id: string, save: SaveData): string {
    if (id === 'garden') {
      const growing = save.plots.filter(Boolean).length;
      return growing ? `ปลูกอยู่ ${growing}/${save.plots.length} แปลง` : 'แปลงว่าง — ไปปลูกกัน';
    }
    return BUILDINGS.find((b) => b.id === id)?.note ?? '';
  }

  /** Red counter on a building when something is waiting (e.g. blooms to pick). */
  private badge(id: string, save: SaveData): string {
    const n = id === 'garden' ? readyBlooms(save) : 0;
    return n ? `<i class="spot-count">${n}</i>` : '';
  }

  private render(): void {
    const save = this.deps.getSave();
    const stage = save.stage;
    const rec = recommendedLevel(stage);
    const lv = teamLevel(save);
    const badge = isGiantStage(stage) ? '<em class="giant">GIANT BOSS</em>' : isBossStage(stage) ? '<em class="boss">BOSS</em>' : '';
    this.el.innerHTML = `
      <div class="hub-sky" style="background-image:url('${VILLAGE_BG}'), url('${BACKGROUND}')"></div>
      <header class="hub-top">
        <div class="hub-title"><small>ยินดีต้อนรับกลับ</small><strong>หมู่บ้านพัฟ</strong></div>
        <div class="hub-wallet">
          <span><i class="petal-ico"></i>${save.petals.toLocaleString('en-US')}</span>
          <span><i class="dust-ico"></i>${save.stardust.toLocaleString('en-US')}</span>
        </div>
      </header>
      <div class="hub-map">
        ${BUILDINGS.map(
          (b, i) => `
          <button type="button" class="spot ${b.phase ? 'locked' : ''}" data-act="building" data-id="${b.id}" style="--x:${b.x}%;--y:${b.y}%">
            <span class="spot-badge ${hasSheet(BUILDING_SHEET) ? 'art' : ''}">${hasSheet(BUILDING_SHEET) ? `<img src="${frameUrl(BUILDING_SHEET, i)}" alt="">` : `<svg viewBox="0 0 24 24" aria-hidden="true">${b.icon}</svg>`}${b.phase ? '<i class="lock" aria-hidden="true"></i>' : ''}</span>
            <span class="spot-name">${b.name}</span>
            <span class="spot-note">${b.phase ? 'เร็วๆ นี้' : this.note(b.id, save)}</span>
            ${this.badge(b.id, save)}
          </button>`,
        ).join('')}
      </div>
      <p class="hub-toast" aria-live="polite"></p>
      <div class="hub-go">
        <div class="hub-stage">
          <span class="where">${STAGE_NAME}</span>
          <strong>ด่าน 1-${stage} ${badge}</strong>
          <span class="lv ${lv < rec ? 'under' : ''}">ทีม Lv.${lv} · แนะนำ Lv.${rec}</span>
        </div>
        <button type="button" class="go-btn" data-act="adventure"><span>ออกผจญภัย</span><small>เตรียมทีมก่อนลงด่าน</small></button>
      </div>
      <nav class="hub-nav" aria-label="เมนูหมู่บ้าน">
        <button type="button" class="on" aria-current="page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z"/></svg><span>หมู่บ้าน</span></button>
        <button type="button" data-act="team"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3.5"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20 C3 15 15 15 15 20 M15 16 C17 15 21 16 21 20"/></svg><span>ทีม</span></button>
        <button type="button" data-act="bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9 H19 L18 20 H6 Z"/><path d="M9 9 V7 A3 3 0 0 1 15 7 V9"/></svg><span>กระเป๋า</span></button>
      </nav>`;
  }
}
