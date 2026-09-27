// Weekly Raid (รังบอสยักษ์): one giant boss per week with a huge shared HP pool. Each timed attempt
// chips away at it; milestone chests pay out as the pool drops. Local for now (a server pool later).
import { ENEMY_NAMES, RAID, chapterPuff, msToNextDay, recommendedLevel, type BossKind } from '@puff/sim';
import { bossSheet, frameUrl, hasSheet, heroDef } from '../assets';
import { tzOffset } from '../meta/daily';
import { currentRaidBoss, currentRaidStage, raidState, raidTicketsLeft } from '../meta/pvp';
import { teamLevel, type SaveData } from '../meta/save';
import { Sheet, type SheetDeps } from './sheet';

export interface RaidDeps extends SheetDeps {
  onRaid(boss: BossKind, stage: number): void;
}

export class RaidPanel extends Sheet {
  constructor(
    root: HTMLElement,
    private readonly raidDeps: RaidDeps,
  ) {
    super(root, raidDeps, 'raid', 'รังบอสยักษ์');
  }

  protected head() {
    const now = Date.now();
    const toMonday = ((8 - new Date(now).getDay()) % 7 || 7) - 1;
    const hours = Math.floor(msToNextDay(now, tzOffset()) / 3_600_000);
    return { sub: `บอสเปลี่ยนในอีก ${toMonday} วัน ${hours} ชม.`, title: 'รังบอสยักษ์' };
  }

  protected body(save: SaveData): string {
    const boss = currentRaidBoss();
    const state = raidState(save);
    const left = Math.max(0, 1 - state.dealt);
    const stage = currentRaidStage(save);
    const tickets = raidTicketsLeft(save);
    const art = hasSheet(bossSheet(boss)) ? `<img src="${frameUrl(bossSheet(boss), 0)}" alt="">` : '';
    const puff = heroDef(chapterPuff(save.stage))?.name ?? '';
    return `
      <div class="raid-boss ${left <= 0 ? 'done' : ''}">
        <span class="raid-art">${art}</span>
        <div class="raid-info">
          <b>Giant ${ENEMY_NAMES[boss]}</b>
          <small>Lv.${recommendedLevel(stage)} · ทีมคุณ Lv.${teamLevel(save)}</small>
          <span class="raid-hp" style="--p:${left * 100}%"><i></i><em>${(left * 100).toFixed(1)}%</em></span>
          <small>ตีไปแล้ว ${(state.dealt * 100).toFixed(1)}% ของพลังชีวิตทั้งสัปดาห์</small>
        </div>
      </div>
      <ol class="raid-chests">
        ${RAID.milestones
          .map(
            (m, i) => `<li class="${i < state.claimed ? 'open' : ''}"><span class="chest" aria-hidden="true"></span><b>${Math.round(m * 100)}%</b>
              <small>${RAID.milestoneDew[i]} Dew${RAID.milestoneShards[i] ? ` · ${RAID.milestoneShards[i]} ชิ้น ${puff}` : ''}</small></li>`,
          )
          .join('')}
      </ol>
      <button type="button" class="prep-start raid-go" data-act="raid" ${tickets > 0 && left > 0 ? '' : 'disabled'}>
        <span>${left <= 0 ? 'ปราบสำเร็จแล้ว!' : 'บุกรังบอส!'}</span><small>เหลือ ${tickets}/${RAID.ticketsPerDay} ครั้งวันนี้ · ครั้งละ ${RAID.timeLimitMs / 1000} วิ · มื้อก่อนลุยใช้ได้</small>
      </button>
      <p class="sheet-hint">ดาเมจทุกครั้งสะสมรวมกันทั้งสัปดาห์ ยิ่งตีลึกยิ่งได้กล่องใหญ่ · ตอนนี้เล่นในเครื่องคนเดียว — อนาคตจะเป็นพูลร่วมกับเพื่อน (Co-op)</p>`;
  }

  protected onAct(act: string): void {
    if (act !== 'raid') return;
    const save = this.deps.getSave();
    if (raidTicketsLeft(save) <= 0) return this.say('ตั๋ววันนี้หมดแล้ว', false);
    this.el.hidden = true;
    this.raidDeps.onRaid(currentRaidBoss(), currentRaidStage(save));
  }
}
