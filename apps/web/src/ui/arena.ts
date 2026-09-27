// Pillow Fight Arena (ลานประลอง): rank, daily tickets and three rival teams to pick from.
// The fight itself runs on the battlefield (Game.startArena) with the current team.
import { PVP, RANKS, rankOf, type HeroClass, type Rival, type Species } from '@puff/sim';
import { portraitClass, portraitUrl } from '../assets';
import { arenaState, arenaTicketsLeft, currentRivals } from '../meta/pvp';
import { activeTeam, teamLevel, type SaveData } from '../meta/save';
import { Sheet, fmt, type SheetDeps } from './sheet';

export interface ArenaDeps extends SheetDeps {
  onFight(rival: Rival): void;
}

const TIER_TEXT = { easy: 'ง่าย', fair: 'สูสี', tough: 'ยาก' } as const;

export class ArenaPanel extends Sheet {
  constructor(
    root: HTMLElement,
    private readonly arenaDeps: ArenaDeps,
  ) {
    super(root, arenaDeps, 'arena', 'ลานประลองหมอน');
  }

  protected head(save: SaveData) {
    return {
      sub: 'Pillow Fight Arena · ทำงานในเครื่องก่อน (ยังไม่ต่อเซิร์ฟเวอร์)',
      title: 'ลานประลองหมอน',
      extra: `<span class="wallet-chip honor" title="Honor"><i class="honor-ico"></i>${fmt(arenaState(save).honor)}</span>`,
    };
  }

  protected body(save: SaveData): string {
    const state = arenaState(save);
    const { rank, next } = rankOf(state.points);
    const pct = next ? ((state.points - rank.from) / (next.from - rank.from)) * 100 : 100;
    const tickets = arenaTicketsLeft(save);
    const team = activeTeam(save);
    const face = (h: { readonly species: Species; readonly heroClass: HeroClass }) =>
      `<img class="${portraitClass(h.species, h.heroClass)}" src="${portraitUrl(h.species, h.heroClass)}" alt="">`;
    const rivals = currentRivals(save);
    return `
      <div class="rank-card rank-${rank.id}">
        <span class="rank-badge" aria-hidden="true"></span>
        <span class="rank-info"><b>${rank.name}</b><small>${fmt(state.points)} แต้ม${next ? ` · อีก ${fmt(next.from - state.points)} ถึง ${next.name}` : ' · อันดับสูงสุด!'}</small>
          <span class="rank-bar" style="--p:${pct}%"><i></i></span></span>
        <span class="rank-record">ชนะ ${state.wins}<br>แพ้ ${state.losses}</span>
      </div>
      <div class="ladder">${RANKS.map((r) => `<span class="${r.id === rank.id ? 'on' : state.points >= r.from ? 'past' : ''}">${r.name}</span>`).join('')}</div>
      <div class="my-team"><span>ทีมของคุณ Lv.${teamLevel(save)}</span><span class="faces">${team.map(face).join('')}</span></div>
      <h3 class="sheet-sub">เลือกคู่ต่อสู้ <small>เหลือ ${tickets}/${PVP.ticketsPerDay} ครั้งวันนี้ · ${PVP.timeLimitMs / 1000} วิ/ตา</small></h3>
      <div class="rival-list">
        ${rivals
          .map(
            (r) => `
          <article class="rival ${r.tier}">
            <header><em>${TIER_TEXT[r.tier]}</em><b>${r.name}</b><small>Lv.${r.level}</small></header>
            <span class="faces">${r.heroes.map((h) => face(h)).join('')}</span>
            <footer><small>ชนะ +${PVP.win[r.tier]} แต้ม · +${PVP.honorWin[r.tier]} Honor</small>
            <button type="button" class="mini-btn gold" data-act="fight" data-tier="${r.tier}" ${tickets > 0 ? '' : 'disabled'}>ท้าชน!</button></footer>
          </article>`,
          )
          .join('')}
      </div>
      <p class="sheet-hint">การต่อสู้เป็นแบบ Auto ด้วยระบบเดียวกับด่าน (ผลซ้ำได้จาก seed) — คุณกดท่าไม้ตายเองได้ · Honor ใช้แลกของแต่งตัวในอนาคต ไม่ขายพลัง</p>`;
  }

  protected onAct(act: string, target: HTMLElement): void {
    if (act !== 'fight') return;
    const save = this.deps.getSave();
    if (arenaTicketsLeft(save) <= 0) return this.say('ตั๋ววันนี้หมดแล้ว — พรุ่งนี้มาใหม่นะ', false);
    const rival = currentRivals(save).find((r) => r.tier === target.dataset.tier);
    if (!rival) return;
    this.el.hidden = true;
    this.arenaDeps.onFight(rival);
  }
}
