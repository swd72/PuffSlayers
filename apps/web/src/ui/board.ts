// Quest board (กระดานภารกิจ): today's five quests with progress bars, one-tap claims, a bonus chest for
// finishing them all, and a countdown to the next day's board.
import { DAILY, QUESTS, canClaimBonus, canClaimQuest, msToNextDay } from '@puff/sim';
import { QUEST_TEXT, claimBonus, claimQuest, currentDaily, tzOffset } from '../meta/daily';
import type { SaveData } from '../meta/save';
import { Sheet, fmt, type SheetDeps } from './sheet';

const hm = (ms: number): string => {
  const m = Math.ceil(ms / 60000);
  return `${Math.floor(m / 60)} ชม. ${m % 60} นาที`;
};

export class BoardPanel extends Sheet {
  constructor(root: HTMLElement, deps: SheetDeps) {
    super(root, deps, 'board', 'กระดานภารกิจ');
  }

  protected head(save: SaveData) {
    return {
      sub: `รีเซ็ตในอีก ${hm(msToNextDay(Date.now(), tzOffset()))}`,
      title: 'ภารกิจรายวัน',
      extra: `<span class="wallet-chip dew"><i class="dew-ico"></i>${fmt(save.dew)}</span>`,
    };
  }

  protected body(save: SaveData): string {
    const daily = currentDaily(save);
    const done = daily.claimed.length;
    const rows = daily.quests
      .map((k) => {
        const q = QUESTS[k];
        const have = daily.progress[k] ?? 0;
        const claimed = daily.claimed.includes(k);
        const can = canClaimQuest(daily, k);
        return `
          <li class="quest ${claimed ? 'claimed' : can ? 'hot' : ''}">
            <span class="q-icon" aria-hidden="true">${QUEST_TEXT[k].icon}</span>
            <span class="q-main"><b>${QUEST_TEXT[k].title} ${q.target > 1 ? `${q.target} ครั้ง` : ''}</b>
              <span class="q-bar" style="--p:${(have / q.target) * 100}%"><i></i><em>${have}/${q.target}</em></span></span>
            ${
              claimed
                ? '<span class="q-done">รับแล้ว ✓</span>'
                : `<button type="button" class="mini-btn ${can ? 'gold' : ''}" data-act="claim" data-kind="${k}" ${can ? '' : 'disabled'}><i class="dew-ico"></i>${q.dew}</button>`
            }
          </li>`;
      })
      .join('');
    const bonusReady = canClaimBonus(daily);
    return `
      <p class="sheet-hint">ทำภารกิจเล็กๆ ทุกวันเพื่อเก็บ <b>Dew Drop</b> ไว้สุ่ม Puff Capsule — ภารกิจบางอย่างจะโผล่เมื่อเปิดตึกใหม่ในหมู่บ้าน</p>
      <ul class="quest-list">${rows}</ul>
      <div class="bonus-chest ${daily.bonusClaimed ? 'claimed' : bonusReady ? 'hot' : ''}">
        <span class="chest" aria-hidden="true"></span>
        <span><b>กล่องโบนัสประจำวัน</b><small>ทำครบ ${done}/${daily.quests.length} · ได้ ${DAILY.bonusDew} Dew Drop + Petal</small></span>
        ${daily.bonusClaimed ? '<span class="q-done">รับแล้ว ✓</span>' : `<button type="button" class="mini-btn gold" data-act="bonus" ${bonusReady ? '' : 'disabled'}>เปิด!</button>`}
      </div>`;
  }

  protected onAct(act: string, target: HTMLElement): void {
    const save = this.deps.getSave();
    if (act === 'claim') return this.apply(claimQuest(save, target.dataset.kind as never));
    if (act === 'bonus') return this.apply(claimBonus(save));
  }
}
