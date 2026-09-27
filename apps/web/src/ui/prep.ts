// "เตรียมลงด่าน": see what's ahead, pick who fights (6 of the roster) and check their meals, then go.
import { ENEMY_NAMES, INGREDIENTS, isBossStage, isGiantStage, recommendedLevel, stageWaves, type EnemyKind, type BossKind } from '@puff/sim';
import { CLASS_COLOR, ROSTER, STAGE_NAME, TEAM_SIZE, portraitClass, portraitUrl } from '../assets';
import { INGREDIENT_INFO, REACTION_LABEL, skinPortrait } from '../meta/itemInfo';
import { knownReaction, pantryCount } from '../meta/picnic';
import { heroLevel, teamLevel, type SaveData } from '../meta/save';
import { toggleTeam } from '../meta/workshop';

export interface PrepDeps {
  getSave(): SaveData;
  setSave(save: SaveData): void;
  onStart(): void;
  onBack(): void;
  /** open the bag on this puff (gear, level, meal) */
  onEditHero(heroId: string): void;
  onClick(): void;
}

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

export class PrepPanel {
  private readonly el: HTMLElement;
  private readonly sheet: HTMLElement;
  private note: { text: string; ok: boolean } | null = null;

  constructor(
    root: HTMLElement,
    private readonly deps: PrepDeps,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'prep-panel';
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'เตรียมลงด่าน');
    this.sheet = document.createElement('div');
    this.sheet.className = 'prep-sheet';
    this.el.appendChild(this.sheet);
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => this.onClick(e));
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  open(): void {
    this.note = null;
    this.el.hidden = false;
    this.render();
  }

  close(): void {
    this.el.hidden = true;
  }

  refresh(): void {
    if (!this.el.hidden) this.render();
  }

  private onClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!target) return;
    this.deps.onClick();
    const save = this.deps.getSave();
    const id = target.dataset.id ?? '';
    switch (target.dataset.act) {
      case 'back':
        this.close();
        return this.deps.onBack();
      case 'toggle': {
        const result = toggleTeam(save, id);
        this.note = result.ok ? null : { text: result.message, ok: false };
        this.deps.setSave(result.save);
        return this.render();
      }
      case 'edit':
        return this.deps.onEditHero(id);
      case 'start':
        this.close();
        return this.deps.onStart();
    }
  }

  private render(): void {
    const save = this.deps.getSave();
    const stage = save.stage;
    const rec = recommendedLevel(stage);
    const lv = teamLevel(save);
    const foes = new Map<EnemyKind | BossKind, number>();
    for (const wave of stageWaves(stage)) for (const spec of wave) {
      const kind = 'boss' in spec ? spec.boss : spec.kind;
      foes.set(kind, (foes.get(kind) ?? 0) + 1);
    }
    const boss = isGiantStage(stage) ? 'GIANT BOSS' : isBossStage(stage) ? 'BOSS' : '';
    const gap = rec - lv;
    const advice = gap > 4 ? 'เลเวลต่ำกว่าแนะนำมาก — อัปเลเวลหรือเปลี่ยนเกียร์ก่อนนะ' : gap > 0 ? 'เลเวลต่ำกว่าแนะนำนิดหน่อย — มื้อก่อนลุยช่วยได้' : 'ทีมพร้อมลุย!';

    this.sheet.innerHTML = `
      <header class="prep-head">
        <button type="button" class="prep-back" data-act="back" aria-label="กลับหมู่บ้าน">‹</button>
        <div><small>${STAGE_NAME}</small><h2>เตรียมลงด่าน 1-${stage} ${boss ? `<em>${boss}</em>` : ''}</h2></div>
      </header>

      <div class="prep-stage">
        <div class="prep-foes" aria-label="ศัตรูในด่าน">
          ${[...foes].map(([kind, n]) => `<span>${ENEMY_NAMES[kind]} <b>×${n}</b></span>`).join('')}
        </div>
        <div class="prep-level ${gap > 0 ? 'under' : ''}">
          <span>ทีม Lv.<b>${lv}</b></span><span class="vs">/</span><span>แนะนำ Lv.<b>${rec}</b></span>
          <small>${advice}</small>
        </div>
      </div>

      <h3 class="prep-sub">ทีมลงสนาม <b>${save.team.length}/${TEAM_SIZE}</b> <small>แตะเพื่อลง/พัก</small></h3>
      <div class="prep-team">
        ${ROSTER.map((h) => {
          const inTeam = save.team.includes(h.id);
          const skin = save.skins[h.id];
          const meal = save.lunch[h.id];
          const left = meal ? pantryCount(save, meal) : 0;
          const reaction = meal ? knownReaction(save, h.species, meal) : undefined;
          const mealText = !meal ? 'ไม่มีมื้อ' : left === 0 ? `${INGREDIENT_INFO[meal].name} (หมด)` : INGREDIENT_INFO[meal].name;
          const mealClass = !meal || left === 0 || reaction === 'refuse' ? 'none' : reaction === 'tummyache' ? 'bad' : reaction === 'favorite' ? 'fav' : INGREDIENTS[meal].rarity;
          return `
          <div class="prep-card ${inTeam ? 'in' : 'out'}" style="--class:${hex(CLASS_COLOR[h.heroClass])}">
            <button type="button" class="prep-pick" data-act="toggle" data-id="${h.id}" aria-pressed="${inTeam}" aria-label="${h.name} ${inTeam ? 'อยู่ในทีม' : 'พักอยู่'}">
              <img class="${skin ? '' : portraitClass(h.species, h.heroClass)}" src="${skin ? skinPortrait(skin) : portraitUrl(h.species, h.heroClass)}" alt="">
              <span class="check" aria-hidden="true">${inTeam ? '✓' : ''}</span>
              <b>${h.name}</b><small>Lv.${heroLevel(save, h.id)}</small>
            </button>
            <button type="button" class="prep-meal ${mealClass}" data-act="edit" data-id="${h.id}" title="${reaction ? REACTION_LABEL[reaction] : ''}">${mealText}</button>
          </div>`;
        }).join('')}
      </div>
      <p class="prep-note ${this.note?.ok ? 'ok' : 'bad'}" aria-live="polite">${this.note?.text ?? ''}</p>

      <button type="button" class="prep-start" data-act="start" ${save.team.length ? '' : 'disabled'}>
        <span>เริ่มลุย!</span><small>พัฟจะกินมื้อก่อนลุยตอนเริ่ม</small>
      </button>`;
  }
}
