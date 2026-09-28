// "ขณะที่คุณหลับ..." — the Nap Bank screen: puffs asleep on their pile of loot, one tap collects it all.
import { NAP, type NapReward } from '@puff/sim';
import { portraitClass, portraitUrl } from '../assets';
import { activeTeam, type SaveData } from '../meta/save';
import { TIER_COLOR, frameIcon, itemIcon, itemName, skinPortrait } from '../meta/itemInfo';

export interface NapDeps {
  getSave(): SaveData;
  onClaim(): void;
  onClick(): void;
}

/** Most item icons shown before the rest become a "+N" chip. */
const MAX_ICONS = 10;

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} ชม. ${m} นาที` : `${m} นาที`;
}

export class NapPanel {
  private readonly el: HTMLElement;

  constructor(
    root: HTMLElement,
    private readonly deps: NapDeps,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'nap-panel';
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'รางวัลตอนหลับ');
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('[data-act="claim"]')) return;
      this.deps.onClick();
      this.el.hidden = true;
      this.deps.onClaim();
    });
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  show(reward: NapReward): void {
    const save = this.deps.getSave();
    const skins = save.skins;
    const capped = reward.ms >= NAP.capMs;
    const shown = reward.items.slice(0, MAX_ICONS);
    const extra = reward.items.length - shown.length;
    this.el.innerHTML = `
      <div class="nap-card">
        <p class="nap-kicker">ขณะที่คุณหลับ…</p>
        <h2>พัฟฟาร์มให้ ${formatDuration(reward.ms)}</h2>
        ${capped ? '<p class="nap-cap">คลังงีบเต็มแล้ว (สูงสุด 12 ชม.) — กลับมาเร็วกว่านี้จะได้ไม่เสียรางวัล</p>' : ''}
        <div class="nap-bed" aria-hidden="true">
          ${activeTeam(save).map((h, i) => {
            const skin = skins[h.id];
            return `<img class="nap-puff ${skin ? '' : portraitClass(h.species, h.heroClass)}" style="--i:${i}" src="${skin ? skinPortrait(skin) : portraitUrl(h.species, h.heroClass)}" alt="">`;
          }).join('')}
          <span class="nap-z">z</span><span class="nap-z">z</span><span class="nap-z">Z</span>
        </div>
        <div class="nap-totals">
          <span class="petal"><i class="petal-ico"></i><b>+${reward.petals.toLocaleString('en-US')}</b> Petal</span>
          <span class="dust"><i class="dust-ico"></i><b>+${reward.stardust.toLocaleString('en-US')}</b> Stardust</span>
        </div>
        ${
          reward.items.length
            ? `<div class="nap-items">${shown
                .map((it) => `<span class="tile" style="--tier:${TIER_COLOR[it.tier]}"><img class="frame" src="${frameIcon(it.tier)}" alt=""><img class="icon" src="${itemIcon(it)}" alt="${itemName(it)}"></span>`)
                .join('')}${extra > 0 ? `<span class="nap-more">+${extra}</span>` : ''}</div>`
            : ''
        }
        <button type="button" class="nap-claim" data-act="claim">รับทั้งหมด</button>
      </div>`;
    this.el.hidden = false;
    this.el.querySelector<HTMLButtonElement>('.nap-claim')?.focus();
  }
}
