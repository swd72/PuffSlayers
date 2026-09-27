// Puff Album (สมุดพัฟ): every puff in the game — owned ones in color, the rest as shadows with how to get
// them — plus the Puff Capsule machine (rates and pity always on show) and star-ups from shards.
import { ALBUM, CAPSULE, MAX_STARS, PUFFS, chapterOf, chapterPuff, puffBonus, starUpCost, type PuffInfo } from '@puff/sim';
import { CLASS_COLOR, portraitClass, portraitUrl } from '../assets';
import { freePullReady, pullCapsules, shardsOf, sparkPick, starUp, starsOf, unlockWithShards, type PullOutcome } from '../meta/album';
import { formatStats, skinPortrait } from '../meta/itemInfo';
import { featuredPuff } from '../meta/pond';
import type { SaveData } from '../meta/save';
import { Sheet, fmt, stars, type SheetDeps } from './sheet';

const CLASS_TH: Record<PuffInfo['heroClass'], string> = {
  'pillow-guard': 'แทงก์หมอน',
  'carrot-knight': 'อัศวินแครอท',
  'leaf-archer': 'นักธนูใบไม้',
  'bubble-mage': 'จอมเวทฟองสบู่',
  'mochi-cleric': 'นักบวชโมจิ',
  'bell-bard': 'กวีกระดิ่ง',
  'root-druid': 'ดรูอิดราก',
};
const SPECIES_TH = { bunbun: 'กระต่าย', hamham: 'แฮมสเตอร์', shibu: 'ชิบะ', molemo: 'ตุ่น' } as const;
const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

export class AlbumPanel extends Sheet {
  private tab: 'album' | 'capsule' = 'album';
  private reveal: PullOutcome[] | null = null;

  constructor(root: HTMLElement, deps: SheetDeps) {
    super(root, deps, 'album', 'สมุดพัฟ');
  }

  /** Opens on a tab (the guide's "free capsule" goes straight to the machine). */
  openOn(tab: 'album' | 'capsule'): void {
    this.tab = tab;
    this.reveal = null;
    this.open();
  }

  protected head(save: SaveData) {
    return {
      sub: `สะสมแล้ว ${save.owned.length}/${PUFFS.length} ตัว`,
      title: 'สมุดพัฟ',
      extra: `<span class="wallet-chip dew" title="Dew Drop"><i class="dew-ico"></i>${fmt(save.dew)}</span>`,
    };
  }

  protected body(save: SaveData): string {
    const tabs = `
      <nav class="sheet-tabs" role="tablist">
        <button type="button" role="tab" data-act="tab" data-tab="album" aria-selected="${this.tab === 'album'}">สมุดสะสม</button>
        <button type="button" role="tab" data-act="tab" data-tab="capsule" aria-selected="${this.tab === 'capsule'}">ตู้ Puff Capsule ${freePullReady(save) ? '<i class="dot"></i>' : ''}</button>
      </nav>`;
    return tabs + (this.tab === 'album' ? this.albumBody(save) : this.capsuleBody(save)) + this.revealLayer();
  }

  private albumBody(save: SaveData): string {
    const chapterMate = chapterPuff(save.stage);
    const pondMate = featuredPuff();
    const card = (p: PuffInfo): string => {
      const owned = save.owned.includes(p.id);
      const shards = shardsOf(save, p.id);
      const st = starsOf(save, p.id);
      const cost = starUpCost(st);
      const skin = save.skins[p.id];
      const img = skin && owned ? skinPortrait(skin) : portraitUrl(p.species, p.heroClass);
      const where: string[] = [];
      if (p.id === chapterMate) where.push(`ฟาร์มบอสบทที่ ${chapterOf(save.stage)}`);
      if (p.id === pondMate) where.push('ร้านบ่อปลาสัปดาห์นี้');
      where.push('ตู้แคปซูล');
      const need = owned ? cost : ALBUM.unlockShards;
      const pct = need ? Math.min(100, (shards / need) * 100) : 100;
      const action = owned
        ? cost === undefined
          ? '<span class="maxed">ดาวเต็ม</span>'
          : `<button type="button" class="mini-btn" data-act="star" data-id="${p.id}" ${shards < cost ? 'disabled' : ''}>อัปดาว</button>`
        : `<button type="button" class="mini-btn gold" data-act="unlock" data-id="${p.id}" ${shards < ALBUM.unlockShards ? 'disabled' : ''}>ปลดล็อก</button>`;
      return `
        <article class="puff-card r${p.rarity} ${owned ? 'owned' : 'shadow'}" style="--class:${hex(CLASS_COLOR[p.heroClass])}">
          <div class="puff-face"><img class="${skin && owned ? '' : portraitClass(p.species, p.heroClass)}" src="${img}" alt="${owned ? p.name : 'พัฟที่ยังไม่พบ'}"><span class="rarity">★${p.rarity}</span></div>
          <strong>${owned ? p.name : '???'}</strong>
          <small>${SPECIES_TH[p.species]} · ${CLASS_TH[p.heroClass]}</small>
          ${owned ? stars(st, MAX_STARS) : `<small class="where">${where.join(' · ')}</small>`}
          <span class="shard-bar" style="--p:${pct}%" title="ชิ้นส่วน"><i></i><b>${shards}${need ? `/${need}` : ''}</b></span>
          ${action}
          ${owned ? `<small class="bonus">${formatStats(puffBonus(p.rarity, st))}</small>` : `<small class="blurb">${p.blurb}</small>`}
        </article>`;
    };
    return `
      <p class="sheet-hint">ได้พัฟ 3 ทาง: <b>ตู้แคปซูล</b> · <b>ชิ้นส่วนจากบอส</b> (บทนี้: ${PUFFS.find((p) => p.id === chapterMate)?.name}) · <b>ร้านบ่อปลา</b> — ครบ ${ALBUM.unlockShards} ชิ้นปลดล็อก, ตัวซ้ำกลายเป็นชิ้นส่วนอัปดาว</p>
      <div class="puff-grid">${PUFFS.map(card).join('')}</div>`;
  }

  private capsuleBody(save: SaveData): string {
    const free = freePullReady(save);
    const { pity } = save;
    const spark = pity.spark >= CAPSULE.spark;
    return `
      <div class="capsule-machine">
        <div class="machine-art" aria-hidden="true">
          <span class="dome">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i class="egg e${i}"></i>`).join('')}</span>
          <span class="base"><i class="knob"></i></span>
        </div>
        <div class="pull-buttons">
          ${free ? '<button type="button" class="pull free" data-act="pull" data-n="1" data-free="1"><b>สุ่มฟรี!</b><small>วันละ 1 ครั้ง</small></button>' : ''}
          <button type="button" class="pull" data-act="pull" data-n="1" ${save.dew < CAPSULE.cost ? 'disabled' : ''}><b>สุ่ม 1</b><small><i class="dew-ico"></i>${CAPSULE.cost}</small></button>
          <button type="button" class="pull ten" data-act="pull" data-n="10" ${save.dew < CAPSULE.tenCost ? 'disabled' : ''}><b>สุ่ม 10</b><small><i class="dew-ico"></i>${CAPSULE.tenCost}</small></button>
        </div>
      </div>
      <div class="pity-box">
        <span>การันตี ★4+ ใน <b>${CAPSULE.pity4 - pity.since4}</b> ครั้ง</span>
        <span>การันตี ★5+ ใน <b>${CAPSULE.pity5 - pity.since5}</b> ครั้ง</span>
        <span>แต้มเลือก ★6 <b>${Math.min(pity.spark, CAPSULE.spark)}/${CAPSULE.spark}</b></span>
      </div>
      ${
        spark
          ? `<div class="spark-pick"><b>ครบ ${CAPSULE.spark} ครั้ง — เลือกพัฟ ★6 ได้เลย!</b>${PUFFS.filter((p) => p.rarity === 6)
              .map((p) => `<button type="button" class="mini-btn gold" data-act="spark" data-id="${p.id}">${p.name}</button>`)
              .join('')}</div>`
          : ''
      }
      <table class="rates">
        <caption>อัตราที่ออก (แสดงเสมอ)</caption>
        <tbody>${([3, 4, 5, 6] as const)
          .map(
            (r) =>
              `<tr class="r${r}"><th>★${r}</th><td>${CAPSULE.rates[r]}%</td><td>${PUFFS.filter((p) => p.rarity === r)
                .map((p) => p.name)
                .join(', ')}</td></tr>`,
          )
          .join('')}</tbody>
      </table>
      <p class="sheet-hint">ตัวซ้ำไม่สูญเปล่า — กลายเป็นชิ้นส่วน (★3 ${ALBUM.dupeShards[3]} · ★4 ${ALBUM.dupeShards[4]} · ★5 ${ALBUM.dupeShards[5]} · ★6 ${ALBUM.dupeShards[6]}) · ไม่มีพัฟที่ได้จากตู้อย่างเดียว · หา Dew Drop ได้จากภารกิจรายวัน, บอส, Raid และร้านบ่อปลา</p>`;
  }

  private revealLayer(): string {
    if (!this.reveal) return '';
    return `
      <div class="capsule-reveal" data-act="reveal-close" role="dialog" aria-label="ผลการเปิดแคปซูล">
        <div class="reveal-grid ${this.reveal.length === 1 ? 'single' : ''}">
          ${this.reveal
            .map((o, i) => {
              const p = PUFFS.find((x) => x.id === o.puff)!;
              return `<div class="reveal-card r${o.rarity}" style="--d:${i * 0.18}s">
                <span class="shell" aria-hidden="true"></span>
                <img class="${portraitClass(p.species, p.heroClass)}" src="${portraitUrl(p.species, p.heroClass)}" alt="">
                <b>${p.name}</b><small>★${o.rarity} ${o.isNew ? '<em>ใหม่!</em>' : `+${o.shards} ชิ้นส่วน`}</small>
              </div>`;
            })
            .join('')}
        </div>
        <p>แตะเพื่อปิด</p>
      </div>`;
  }

  protected onAct(act: string, target: HTMLElement): void {
    const save = this.deps.getSave();
    const id = target.dataset.id ?? '';
    switch (act) {
      case 'tab':
        this.tab = target.dataset.tab === 'capsule' ? 'capsule' : 'album';
        this.toast = null;
        return this.render();
      case 'pull': {
        const { result, outcomes } = pullCapsules(save, target.dataset.n === '10' ? 10 : 1, target.dataset.free === '1');
        if (result.ok) this.reveal = outcomes;
        return this.apply(result);
      }
      case 'reveal-close':
        this.reveal = null;
        return this.render();
      case 'star':
        return this.apply(starUp(save, id));
      case 'unlock':
        return this.apply(unlockWithShards(save, id));
      case 'spark':
        return this.apply(sparkPick(save, id));
    }
  }
}
