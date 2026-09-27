// Desktop side panels (wide screens only, hidden on phones by CSS): the journey and next goals on the
// left, today's quests and the team on the right — so a big monitor shows where the game is heading.
import { PUFFS, QUESTS, chapterOf, restoration } from '@puff/sim';
import { portraitClass, portraitUrl } from '../assets';
import { QUEST_TEXT, currentDaily } from '../meta/daily';
import { CHAPTER_LEN, chapterName, goals, stageLabel, type GoalAction } from '../meta/guide';
import { activeTeam, heroLevel, type SaveData } from '../meta/save';

export interface SideDeps {
  getSave(): SaveData;
  onGoal(action: GoalAction): void;
  onClick(): void;
}

export class SidePanels {
  constructor(
    private readonly left: HTMLElement,
    private readonly right: HTMLElement,
    private readonly deps: SideDeps,
  ) {
    for (const el of [left, right]) {
      el.addEventListener('click', (e) => {
        const goal = (e.target as HTMLElement).closest<HTMLElement>('[data-goal]')?.dataset.goal;
        if (!goal) return;
        this.deps.onClick();
        this.deps.onGoal(goal as GoalAction);
      });
    }
  }

  render(): void {
    const save = this.deps.getSave();
    const chapter = chapterOf(save.stage);
    const inChapter = (save.stage - 1) % CHAPTER_LEN;
    const world = Math.round(restoration(save.blooms) * 100);
    this.left.innerHTML = `
      <h2>เส้นทางพัฟ</h2>
      <p class="side-story">ราชินี Rafflesia สาปดอกไม้ให้ขี้งอน — พัฟออกไป <b>Bonk</b> ให้หายงอน เก็บเมล็ดกลับมาปลูก ปลุกโลกให้สดใสอีกครั้ง</p>
      <div class="side-block">
        <b>บทที่ ${chapter} · ${chapterName(save.stage)}</b>
        <span class="side-bar" style="--p:${(inChapter / CHAPTER_LEN) * 100}%"><i></i></span>
        <small>ถัดไป: ด่าน ${stageLabel(save.stage)} · บอสทุก 5 ด่าน · บอสยักษ์ด่านที่ 10</small>
      </div>
      <div class="side-block">
        <b>โลกฟื้นคืน ${world}%</b>
        <span class="side-bar green" style="--p:${world}%"><i></i></span>
        <small>ปลูกดอกไม้ในสวนเพื่อฟื้นโลก</small>
      </div>
      <div class="side-block">
        <b>สมุดพัฟ ${save.owned.length}/${PUFFS.length}</b>
        <span class="side-bar pink" style="--p:${(save.owned.length / PUFFS.length) * 100}%"><i></i></span>
      </div>
      <h3>ทำอะไรต่อดี?</h3>
      <ul class="side-goals">${goals(save)
        .map((g) => `<li><button type="button" class="${g.ready ? 'hot' : ''}" data-goal="${g.action}"><span aria-hidden="true">${g.icon}</span>${g.text}</button></li>`)
        .join('')}</ul>`;

    const daily = currentDaily(save);
    this.right.innerHTML = `
      <h2>วันนี้</h2>
      <ul class="side-quests">${daily.quests
        .map((k) => {
          const have = daily.progress[k] ?? 0;
          const q = QUESTS[k];
          return `<li class="${daily.claimed.includes(k) ? 'claimed' : have >= q.target ? 'hot' : ''}"><span>${QUEST_TEXT[k].icon} ${QUEST_TEXT[k].title}</span><em>${have}/${q.target}</em></li>`;
        })
        .join('')}</ul>
      <button type="button" class="side-link" data-goal="board">เปิดกระดานภารกิจ ›</button>
      <h3>ทีมลงสนาม</h3>
      <ul class="side-team">${activeTeam(save)
        .map((h) => `<li><img class="${portraitClass(h.species, h.heroClass)}" src="${portraitUrl(h.species, h.heroClass)}" alt=""><span>${h.name}</span><em>Lv.${heroLevel(save, h.id)}</em></li>`)
        .join('')}</ul>
      <button type="button" class="side-link" data-goal="bag">อัปเลเวล / อุปกรณ์ ›</button>
      <p class="side-tip">เคล็ดลับ: เปิดเกมทิ้งไว้หรือปิดไปก็ได้ — พัฟจะฟาร์มด่านล่าสุดให้สูงสุด 12 ชม.</p>`;
  }
}
