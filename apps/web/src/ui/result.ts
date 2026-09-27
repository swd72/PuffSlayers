// Result card after an Arena fight or a Raid attempt, then back to the village.
import { ENEMY_NAMES, rankOf, type BossKind, type Rival } from '@puff/sim';
import type { ArenaOutcome, RaidOutcome } from '../meta/pvp';
import { fmt } from './sheet';

export class ResultOverlay {
  private readonly el: HTMLElement;
  private onClose: () => void = () => undefined;

  constructor(
    root: HTMLElement,
    private readonly onClick: () => void,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'result';
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('[data-act="ok"]')) return;
      this.onClick();
      this.el.hidden = true;
      this.onClose();
    });
  }

  arena(o: ArenaOutcome, rival: Rival, onClose: () => void): void {
    const { rank } = rankOf(o.save.arena.points);
    this.show(
      o.won ? 'win' : 'lose',
      o.won ? 'ชนะ!' : 'แพ้…',
      `VS ${rival.name}`,
      [
        `แต้ม ${o.delta >= 0 ? '+' : ''}${o.delta} → ${fmt(o.save.arena.points)} (${rank.name})`,
        `Honor +${o.honor}`,
        ...(o.dew ? [`Dew Drop +${o.dew}`] : []),
      ],
      onClose,
    );
  }

  raid(o: RaidOutcome, boss: BossKind, onClose: () => void): void {
    const left = Math.max(0, 1 - o.save.raid.dealt);
    this.show(
      'win',
      `${(o.share * 100).toFixed(1)}%`,
      `ดาเมจใส่ Giant ${ENEMY_NAMES[boss]}`,
      [
        `พลังชีวิตบอสเหลือ ${(left * 100).toFixed(1)}%`,
        ...o.chests.map((c, i) => `🎁 กล่องที่ ${o.save.raid.claimed - o.chests.length + i + 1}: ${c.dew} Dew · ${c.dust} Stardust · ${fmt(c.petals)} Petal${c.shards ? ` · ${c.shards} ชิ้นส่วน` : ''}`),
      ],
      onClose,
    );
  }

  private show(kind: string, big: string, title: string, lines: readonly string[], onClose: () => void): void {
    this.onClose = onClose;
    this.el.hidden = false;
    this.el.innerHTML = `
      <div class="result-card ${kind}">
        <small>${title}</small>
        <strong>${big}</strong>
        <ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
        <button type="button" class="prep-start" data-act="ok"><span>กลับหมู่บ้าน</span></button>
      </div>`;
  }
}
