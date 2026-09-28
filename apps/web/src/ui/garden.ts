// World-Waking Garden screen: plots growing in real time, a seed pouch, and the buffs the blooms give.
// Until the growth-stage art exists, each plant is drawn with the flower's own sprite, small and sleepy
// while growing and in full color once it blooms (the grumpy flower, now happy at home).
import {
  GARDEN,
  SEEDS,
  SEED_KINDS,
  canWater,
  gardenBonus,
  growth,
  growthStage,
  isBloomed,
  msLeft,
  restoration,
  type BossKind,
  type EnemyKind,
  type Plot,
  type SeedKind,
} from '@puff/sim';
import { STAGE_NAME, bossSheet, enemySheet, frameUrl, hasSheet } from '../assets';
import { SEED_NAME, harvest, harvestAll, plantSeed, waterPlot } from '../meta/garden';
import { formatStats } from '../meta/itemInfo';
import type { SaveData } from '../meta/save';
import type { ActionResult } from '../meta/workshop';

export interface GardenDeps {
  getSave(): SaveData;
  setSave(save: SaveData): void;
  onClick(): void;
  onClose(): void;
}

const BOSSES: readonly SeedKind[] = ['queen-rafflesia', 'sunflower-colossus', 'lotus-moon-sage'];
/** generated growth art (docs/art-prompts-v2.md §9): garden/<seed>-<stage> */
const plantSheet = (kind: SeedKind): string => `garden/${kind}`;

function plantArt(kind: SeedKind, stage: number): string {
  if (hasSheet(plantSheet(kind))) return `<img class="plant-art" src="${frameUrl(plantSheet(kind), stage)}" alt="">`;
  // stand-in: the flower's own battle sprite, growing with the stages
  const sheet = BOSSES.includes(kind) ? bossSheet(kind as BossKind) : enemySheet(kind as EnemyKind);
  if (stage === 0) return '<span class="plant-seed" aria-hidden="true"></span>';
  return `<img class="plant-sprite stage-${stage}" src="${frameUrl(sheet, 0)}" alt="">`;
}

const clock = (ms: number): string => {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

export class GardenPanel {
  private readonly el: HTMLElement;
  private timer = 0;
  private toast: { text: string; ok: boolean } | null = null;
  /** re-render when any plot changes growth stage */
  private shape = '';

  constructor(
    root: HTMLElement,
    private readonly deps: GardenDeps,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'garden';
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'สวนปลุกโลก');
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => this.onClick(e));
  }

  open(): void {
    this.toast = null;
    this.el.hidden = false;
    this.render();
    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.tick(), 1000);
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  close(): void {
    if (this.el.hidden) return;
    this.el.hidden = true;
    window.clearInterval(this.timer);
    this.deps.onClose();
  }

  private apply(result: ActionResult): void {
    this.toast = { text: result.message, ok: result.ok };
    this.deps.setSave(result.save);
    this.render();
  }

  private onClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!target) return;
    this.deps.onClick();
    const save = this.deps.getSave();
    const index = Number(target.dataset.plot);
    switch (target.dataset.act) {
      case 'close':
        return this.close();
      case 'water':
        return this.apply(waterPlot(save, index));
      case 'harvest':
        return this.apply(harvest(save, index));
      case 'harvest-all':
        return this.apply(harvestAll(save));
      case 'seed': {
        const seed = target.dataset.seed as SeedKind;
        const empty = save.plots.findIndex((p) => p === null);
        if (empty < 0) return this.apply({ save, ok: false, message: 'แปลงเต็มแล้ว — เก็บดอกที่บานก่อน' });
        return this.apply(plantSeed(save, empty, seed));
      }
    }
  }

  /** Every second: update countdowns in place; redraw only when a plant reaches a new stage. */
  private tick(): void {
    const now = Date.now();
    const save = this.deps.getSave();
    if (this.stageShape(save, now) !== this.shape) return this.render();
    save.plots.forEach((plot, i) => {
      const el = this.el.querySelector<HTMLElement>(`[data-timer="${i}"]`);
      if (plot && el) el.textContent = `เหลือ ${clock(msLeft(plot, now))}`;
      const bar = this.el.querySelector<HTMLElement>(`[data-grow="${i}"]`);
      if (plot && bar) bar.style.setProperty('--g', String(growth(plot, now)));
    });
  }

  private stageShape(save: SaveData, now: number): string {
    return save.plots.map((p) => (p ? `${p.seed}${growthStage(p, now)}${canWater(p, now) ? 'w' : ''}` : '-')).join('|');
  }

  private plotCard(plot: Plot | null, i: number, now: number): string {
    if (!plot) return `<div class="plot empty"><span class="plant-area"><span class="bed"></span></span><span class="plot-hint">แปลงว่าง<br><small>แตะเมล็ดด้านล่างเพื่อปลูก</small></span></div>`;
    const stage = growthStage(plot, now);
    const bloomed = isBloomed(plot, now);
    const name = SEED_NAME[plot.seed];
    return `
      <div class="plot ${bloomed ? 'bloom' : ''} ${SEEDS[plot.seed].rare ? 'rare' : ''}">
        <span class="plant-area">
          <span class="bed"></span>
          <span class="plant">${plantArt(plot.seed, stage)}</span>
          ${bloomed ? '<span class="sparkle" aria-hidden="true"></span>' : ''}
        </span>
        <span class="plot-name">${name}</span>
        ${
          bloomed
            ? `<button type="button" class="pick" data-act="harvest" data-plot="${i}">เก็บดอก!</button>`
            : `<span class="grow" data-grow="${i}" style="--g:${growth(plot, now)}"><i></i></span>
               <span class="time" data-timer="${i}">เหลือ ${clock(msLeft(plot, now))}</span>
               ${canWater(plot, now) ? `<button type="button" class="water" data-act="water" data-plot="${i}" aria-label="รดน้ำ${name}">รดน้ำ</button>` : ''}`
        }
      </div>`;
  }

  private render(): void {
    const save = this.deps.getSave();
    const now = Date.now();
    this.shape = this.stageShape(save, now);
    const restored = Math.round(restoration(save.blooms) * 100);
    const bonus = gardenBonus(save.blooms);
    const ready = save.plots.filter((p) => p && isBloomed(p, now)).length;
    const pouch = SEED_KINDS.filter((k) => (save.seeds[k] ?? 0) > 0);
    const progress = SEED_KINDS.filter((k) => (save.blooms[k] ?? 0) > 0);

    this.el.innerHTML = `
      <div class="garden-sheet">
        <header class="garden-head">
          <button type="button" class="prep-back" data-act="close" aria-label="กลับหมู่บ้าน">‹</button>
          <div><small>${STAGE_NAME}</small><h2>สวนปลุกโลก</h2></div>
          ${ready ? `<button type="button" class="pick-all" data-act="harvest-all">เก็บทั้งหมด (${ready})</button>` : ''}
        </header>
        <div class="restore" style="--r:${restored}%">
          <span>โลกฟื้นคืน <b>${restored}%</b></span><span class="bar"><i></i></span>
          <small>ปลูกดอกไม้ที่ช่วยจากด่าน ให้ทุ่งกลับมาสดใส — ครบ 100% ได้รางวัลใหญ่</small>
        </div>
        <p class="garden-toast ${this.toast?.ok ? 'ok' : 'bad'}" aria-live="polite">${this.toast?.text ?? ''}</p>
        <div class="plots">${save.plots.map((p, i) => this.plotCard(p, i, now)).join('')}</div>
        <h3 class="garden-sub">ถุงเมล็ด <small>ได้จากการ Bop ดอกไม้ในด่าน</small></h3>
        <div class="pouch">
          ${
            pouch.length
              ? pouch
                  .map(
                    (k) => `<button type="button" class="seed-chip ${SEEDS[k].rare ? 'rare' : ''}" data-act="seed" data-seed="${k}">
                      <span class="seed-dot" aria-hidden="true"></span>${SEED_NAME[k]} <b>×${save.seeds[k]}</b>
                      <small>${formatStats(SEEDS[k].perStep)} / ${SEEDS[k].rare ? 'ดอก' : `${GARDEN.bloomsPerStep} ดอก`}</small></button>`,
                  )
                  .join('')
              : '<p class="empty">ยังไม่มีเมล็ด — ออกผจญภัยแล้ว Bop ดอกไม้เพื่อเก็บเมล็ด</p>'
          }
        </div>
        <h3 class="garden-sub">พลังจากสวน <small>ถาวร ทั้งทีม</small></h3>
        <p class="garden-bonus">${Object.keys(bonus).length ? formatStats(bonus) : 'ยังไม่มี — เก็บดอกไม้ครบชุดแรกเพื่อรับพลัง'}</p>
        ${
          progress.length
            ? `<div class="blooms">${progress
                .map((k) => {
                  const n = save.blooms[k] ?? 0;
                  const per = SEEDS[k].rare ? 1 : GARDEN.bloomsPerStep;
                  return `<span>${SEED_NAME[k]} <b>${n}</b>${SEEDS[k].rare ? '' : ` <small>(${n % per}/${per})</small>`}</span>`;
                })
                .join('')}</div>`
            : ''
        }
      </div>`;
  }
}
