// The village (hub): where the player lands. Six buildings open one by one as the story moves on,
// a guide card always says what to do next, and the chapter path shows how far the next boss is.
// The building layer is sized exactly like the background art, so each building stays on its own
// grassy plateau on any screen shape (phone, tablet, desktop).
import { chapterOf, isBossStage, isGiantStage, recommendedLevel } from '@puff/sim';
import { BACKGROUND, STAGE_NAME, frameUrl, hasSheet } from '../assets';
import { teamLevel, type SaveData } from '../meta/save';
import { readyBlooms } from '../meta/garden';
import { CHAPTER_LEN, chapterName, goals, stageLabel, type GoalAction } from '../meta/guide';
import { isOpen, unlockShort, unlockText, type Feature } from '../meta/unlocks';
import { currentDaily } from '../meta/daily';
import { freePullReady } from '../meta/album';
import { pendingAuto } from '../meta/pond';
import { arenaTicketsLeft, raidTicketsLeft } from '../meta/pvp';
import { claimableCount } from '@puff/sim';

/** Generated village art (docs/art-prompts-v2.md §8); until it exists the meadow stands in. */
const VILLAGE_BG = '/sprites/v2/bg/village-hub.jpg';
const BUILDING_SHEET = 'item/building';

export interface HubDeps {
  getSave(): SaveData;
  onAdventure(): void;
  onOpenBag(): void;
  onOpenTeam(): void;
  /** an open building was tapped */
  onBuilding(id: Feature): void;
  /** a guide goal was tapped */
  onGoal(action: GoalAction): void;
  onStory(): void;
  onClick(): void;
}

interface Building {
  readonly id: Feature;
  readonly name: string;
  readonly note: string;
  /** centre of its plateau in the background art, % of the image */
  readonly x: number;
  readonly y: number;
  /** frame in the building sheet */
  readonly frame: number;
  readonly icon: string;
}

const BUILDINGS: readonly Building[] = [
  { id: 'garden', name: 'สวนปลุกโลก', note: 'ปลูกเมล็ดจากการ Bonk', x: 21, y: 29, frame: 0, icon: '<path d="M12 21 V11"/><path d="M12 13 C8 13 6 10 6 6 C10 6 12 9 12 13 Z"/><path d="M12 11 C12 7 14 4 18 4 C18 8 16 11 12 11 Z"/><path d="M6 21 H18"/>' },
  { id: 'album', name: 'สมุดพัฟ', note: 'สะสม & ตู้แคปซูล', x: 78, y: 29, frame: 1, icon: '<path d="M5 4 H17 A2 2 0 0 1 19 6 V20 H7 A2 2 0 0 1 5 18 Z"/><path d="M5 18 A2 2 0 0 1 7 16 H19"/><circle cx="12" cy="10" r="2.5"/>' },
  { id: 'board', name: 'กระดานภารกิจ', note: 'ภารกิจรายวัน', x: 50, y: 38.5, frame: 2, icon: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9 H15 M9 13 H15 M9 17 H12"/>' },
  { id: 'pond', name: 'บ่อตกปลา', note: 'Puff Pond', x: 20, y: 48.5, frame: 3, icon: '<path d="M4 15 C7 12 10 12 12 15 C14 18 17 18 20 15"/><path d="M14 9 C16 7 19 8 20 10 C19 12 16 13 14 11 L12 12 L12 8 Z"/>' },
  { id: 'arena', name: 'ลานประลอง', note: 'Pillow Fight Arena', x: 79, y: 48.5, frame: 4, icon: '<path d="M6 18 L16 8"/><path d="M18 18 L8 8"/><path d="M14 6 H18 V10 M10 6 H6 V10"/>' },
  { id: 'raid', name: 'รังบอสยักษ์', note: 'Raid รายสัปดาห์', x: 50, y: 20.5, frame: 5, icon: '<path d="M4 18 L7 8 L12 13 L17 8 L20 18 Z"/><path d="M4 18 H20"/>' },
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
      case 'story':
        return this.deps.onStory();
      case 'goal':
        return this.deps.onGoal(target.dataset.goal as GoalAction);
      case 'nav':
        return this.deps.onBuilding(target.dataset.id as Feature);
      case 'building': {
        const b = BUILDINGS.find((x) => x.id === target.dataset.id);
        if (!b) return;
        if (!isOpen(this.deps.getSave(), b.id)) return this.toast(`${b.name} ยังสร้างไม่เสร็จ — ${unlockText(b.id)}`);
        return this.deps.onBuilding(b.id);
      }
    }
  }

  private toast(text: string): void {
    const t = this.el.querySelector<HTMLElement>('.hub-toast');
    if (!t) return;
    t.textContent = text;
    t.classList.add('on');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.remove('on'), 2200);
  }

  /** Live line under an open building. */
  private note(id: Feature, save: SaveData): string {
    switch (id) {
      case 'garden': {
        const growing = save.plots.filter(Boolean).length;
        return growing ? `ปลูกอยู่ ${growing}/${save.plots.length} แปลง` : 'แปลงว่าง — ไปปลูกกัน';
      }
      case 'album':
        return `สะสม ${save.owned.length} ตัว`;
      case 'board': {
        const d = currentDaily(save);
        return `วันนี้ ${d.claimed.length}/${d.quests.length}`;
      }
      case 'arena':
        return `ตั๋ว ${arenaTicketsLeft(save)} ใบ`;
      case 'raid':
        return `ตั๋ว ${raidTicketsLeft(save)} ใบ`;
      default:
        return BUILDINGS.find((b) => b.id === id)?.note ?? '';
    }
  }

  /** Red counter on a building when something is waiting. */
  private badge(id: Feature, save: SaveData): number {
    switch (id) {
      case 'garden':
        return readyBlooms(save);
      case 'board':
        return claimableCount(currentDaily(save));
      case 'album':
        return freePullReady(save) ? 1 : 0;
      case 'pond':
        return pendingAuto(save).length ? 1 : 0;
      default:
        return 0;
    }
  }

  /** The chapter road: ten stops, bosses on 5 and 10, the current one glowing. */
  private chapterPath(stage: number): string {
    const first = (chapterOf(stage) - 1) * CHAPTER_LEN + 1;
    return Array.from({ length: CHAPTER_LEN }, (_, i) => {
      const s = first + i;
      const kind = isGiantStage(s) ? 'giant' : isBossStage(s) ? 'boss' : '';
      const state = s < stage ? 'done' : s === stage ? 'now' : '';
      return `<i class="${kind} ${state}" title="ด่าน ${stageLabel(s)}"></i>`;
    }).join('');
  }

  private render(): void {
    const save = this.deps.getSave();
    const stage = save.stage;
    const rec = recommendedLevel(stage);
    const lv = teamLevel(save);
    const tag = isGiantStage(stage) ? '<em class="giant">GIANT BOSS</em>' : isBossStage(stage) ? '<em class="boss">BOSS</em>' : '';
    const art = hasSheet(BUILDING_SHEET);
    const list = goals(save);
    const [top, ...rest] = list;
    const quests = claimableCount(currentDaily(save));
    this.el.innerHTML = `
      <div class="hub-world" style="background-image:url('${VILLAGE_BG}'), url('${BACKGROUND}')">
        ${BUILDINGS.map((b) => {
          const open = isOpen(save, b.id);
          const n = open ? this.badge(b.id, save) : 0;
          return `
          <button type="button" class="spot ${open ? '' : 'locked'}" data-act="building" data-id="${b.id}" style="--x:${b.x}%;--y:${b.y}%">
            <span class="spot-badge ${art ? 'art' : ''}">${art ? `<img src="${frameUrl(BUILDING_SHEET, b.frame)}" alt="">` : `<svg viewBox="0 0 24 24" aria-hidden="true">${b.icon}</svg>`}${open ? '' : '<i class="lock" aria-hidden="true"></i>'}</span>
            <span class="spot-name">${b.name}</span>
            <span class="spot-note">${open ? this.note(b.id, save) : unlockShort(b.id)}</span>
            ${n ? `<i class="spot-count">${n}</i>` : ''}
          </button>`;
        }).join('')}
      </div>
      <div class="hub-shade" aria-hidden="true"></div>
      <header class="hub-top">
        <button type="button" class="hub-title" data-act="story" aria-label="อ่านเรื่องราว">
          <small>${STAGE_NAME} · บทที่ ${chapterOf(stage)}</small><strong>หมู่บ้านพัฟ</strong><span class="story-link">📖 เรื่องราว</span>
        </button>
        <div class="hub-wallet">
          <span title="Petal"><i class="petal-ico"></i>${save.petals.toLocaleString('en-US')}</span>
          <span title="Dew Drop"><i class="dew-ico"></i>${save.dew.toLocaleString('en-US')}</span>
          <span title="Stardust"><i class="dust-ico"></i>${save.stardust.toLocaleString('en-US')}</span>
        </div>
      </header>
      <p class="hub-toast" aria-live="polite"></p>
      <div class="hub-bottom">
        ${
          top
            ? `<div class="hub-guide">
            <span class="guide-label">เป้าหมายถัดไป</span>
            <button type="button" class="guide-main ${top.ready ? 'hot' : ''}" data-act="goal" data-goal="${top.action}"><span class="g-icon" aria-hidden="true">${top.icon}</span><span>${top.text}</span><b aria-hidden="true">›</b></button>
            ${rest.length ? `<div class="guide-more">${rest.slice(0, 3).map((g) => `<button type="button" class="${g.ready ? 'hot' : ''}" data-act="goal" data-goal="${g.action}"><span aria-hidden="true">${g.icon}</span>${g.text}</button>`).join('')}</div>` : ''}
          </div>`
            : ''
        }
        <div class="hub-go">
          <div class="hub-stage">
            <span class="where">บทที่ ${chapterOf(stage)} · ${chapterName(stage)}</span>
            <strong>ด่าน ${stageLabel(stage)} ${tag}</strong>
            <span class="chapter-path" aria-label="ความคืบหน้าในบทนี้">${this.chapterPath(stage)}</span>
            <span class="lv ${lv < rec ? 'under' : ''}">ทีม Lv.${lv} · แนะนำ Lv.${rec}</span>
          </div>
          <button type="button" class="go-btn" data-act="adventure"><span>ออกผจญภัย</span><small>เตรียมทีมก่อนลงด่าน</small></button>
        </div>
      </div>
      <nav class="hub-nav" aria-label="เมนูหมู่บ้าน">
        <button type="button" class="on" aria-current="page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z"/></svg><span>หมู่บ้าน</span></button>
        <button type="button" data-act="team"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3.5"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20 C3 15 15 15 15 20 M15 16 C17 15 21 16 21 20"/></svg><span>ทีม</span></button>
        <button type="button" data-act="bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9 H19 L18 20 H6 Z"/><path d="M9 9 V7 A3 3 0 0 1 15 7 V9"/></svg><span>กระเป๋า</span></button>
        <button type="button" data-act="nav" data-id="album" ${isOpen(save, 'album') ? '' : 'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true">${BUILDINGS[1]!.icon}</svg><span>สมุดพัฟ</span>${isOpen(save, 'album') && freePullReady(save) ? '<i class="nav-dot"></i>' : ''}</button>
        <button type="button" data-act="nav" data-id="board"><svg viewBox="0 0 24 24" aria-hidden="true">${BUILDINGS[2]!.icon}</svg><span>ภารกิจ</span>${quests ? '<i class="nav-dot"></i>' : ''}</button>
      </nav>`;
  }
}
