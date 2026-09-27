// Puff Pond (บ่อตกปลา, GDD §8): hold to charge a cast (release in the golden zone for rarer fish),
// wait for the real bite (leaves fool you), then reel: hold to push the marker, keep it in the fish's
// green zone until the catch bar fills. Plus the Fishdex, bench puffs fishing on their own, and the shop.
import { FISH, FISHDEX_STEPS, FISHING, createRng, fishInfo, fishdexBonus, isDay, rollFish, type FishInfo } from '@puff/sim';
import { portraitClass, portraitUrl } from '../assets';
import { formatStats } from '../meta/itemInfo';
import { FISH_NAME, RARITY_COLOR, RARITY_TEXT, buy, catchFish, collectAuto, featuredPuff, pendingAuto, shopItems, shopState, toggleAngler } from '../meta/pond';
import { activeTeam, ownedRoster, type SaveData } from '../meta/save';
import { heroDef } from '../assets';
import { Sheet, fmt, type SheetDeps } from './sheet';

type Phase = 'idle' | 'charge' | 'wait' | 'bite' | 'reel' | 'caught' | 'lost';

const GOLD = { from: 0.8, to: 0.93 } as const;
/** window to tap after a real bite */
const BITE_MS = 900;

let serial = 0;
const rng = () => createRng((Date.now() ^ (++serial * 0x85ebca6b)) >>> 0);

export class PondPanel extends Sheet {
  private tab: 'fish' | 'dex' | 'auto' | 'shop' = 'fish';
  private phase: Phase = 'idle';
  private raf = 0;
  private last = 0;
  // charge
  private power = 0;
  private powerDir = 1;
  // wait
  private waitMs = 0;
  private nibbles: number[] = [];
  private biteLeft = 0;
  private fish: { fish: FishInfo; size: number } | null = null;
  // reel
  private marker = 0.2;
  private markerVel = 0;
  private zone = 0.5;
  private zoneVel = 0;
  private catchBar = 0.3;
  private holding = false;
  private message = '';

  constructor(root: HTMLElement, deps: SheetDeps) {
    super(root, deps, 'pond', 'บ่อตกปลา');
    // the reel is a hold: listen for press / release on the whole sheet
    const down = (e: Event) => {
      if (!(e.target as HTMLElement).closest('[data-hold]')) return;
      e.preventDefault();
      this.press();
    };
    const up = () => this.release();
    this.sheet.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', (e) => {
      if (this.el.hidden || e.repeat || (e.key !== ' ' && e.key !== 'Enter') || this.tab !== 'fish') return;
      if ((e.target as HTMLElement).closest?.('button:not([data-hold])')) return;
      e.preventDefault();
      this.press();
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') this.release();
    });
  }

  protected onHide(): void {
    cancelAnimationFrame(this.raf);
    this.phase = 'idle';
  }

  protected head(save: SaveData) {
    const now = new Date();
    return {
      sub: `${isDay(now.getHours()) ? 'กลางวัน ☀️' : 'กลางคืน 🌙'} · ปลาบางชนิดออกเฉพาะช่วงเวลา`,
      title: 'Puff Pond',
      extra: `<span class="wallet-chip scale" title="เกล็ดปลา"><i class="scale-ico"></i>${fmt(shopState(save).scales)}</span>`,
    };
  }

  protected body(save: SaveData): string {
    const waiting = pendingAuto(save).length;
    const tabs = `
      <nav class="sheet-tabs" role="tablist">
        ${(
          [
            ['fish', 'ตกปลา'],
            ['dex', `สมุดปลา ${Object.keys(save.pond.log).length}/${FISH.length}`],
            ['auto', `นั่งตกปลา${waiting ? ' <i class="dot"></i>' : ''}`],
            ['shop', 'ร้าน'],
          ] as const
        )
          .map(([id, label]) => `<button type="button" role="tab" data-act="tab" data-tab="${id}" aria-selected="${this.tab === id}">${label}</button>`)
          .join('')}
      </nav>`;
    const content = this.tab === 'fish' ? this.fishBody(save) : this.tab === 'dex' ? this.dexBody(save) : this.tab === 'auto' ? this.autoBody(save) : this.shopBody(save);
    return tabs + content;
  }

  // ---------- fishing ----------

  private fishBody(save: SaveData): string {
    const angler = activeTeam(save)[0] ?? ownedRoster(save)[0];
    const caught = this.phase === 'caught' && this.fish ? this.fish : null;
    return `
      <div class="pond-scene phase-${this.phase}">
        <span class="lily l1"></span><span class="lily l2"></span><span class="ripple"></span>
        <span class="dock">${angler ? `<img class="${portraitClass(angler.species, angler.heroClass)}" src="${portraitUrl(angler.species, angler.heroClass)}" alt="">` : ''}</span>
        <span class="line"></span>
        <span class="bobber"><i class="bang">!</i></span>
        <span class="leaf"></span>
        ${
          caught
            ? `<div class="catch-card" style="--rc:${RARITY_COLOR[caught.fish.rarity]}"><span class="fish-ico big" style="--rc:${RARITY_COLOR[caught.fish.rarity]}"></span>
                <b>${FISH_NAME[caught.fish.id]}</b><small>${RARITY_TEXT[caught.fish.rarity]} · ${caught.size} ซม. · +${caught.fish.scales} เกล็ด</small></div>`
            : ''
        }
      </div>
      <div class="fish-hud">
        <div class="power ${this.phase === 'charge' ? 'on' : ''}" aria-hidden="true"><span class="gold" style="left:${GOLD.from * 100}%;width:${(GOLD.to - GOLD.from) * 100}%"></span><i></i></div>
        <div class="reel ${this.phase === 'reel' ? 'on' : ''}" aria-hidden="true"><span class="zone"></span><i class="marker"></i></div>
        <div class="catch ${this.phase === 'reel' ? 'on' : ''}" aria-hidden="true"><i></i></div>
        <p class="fish-msg" aria-live="polite">${this.message || this.hint()}</p>
        <button type="button" class="fish-btn" data-hold="1" data-act="fish-tap">${this.buttonText()}</button>
      </div>`;
  }

  private hint(): string {
    switch (this.phase) {
      case 'idle':
        return 'กดค้างเพื่อเหวี่ยงเบ็ด ปล่อยตอนแถบอยู่ในโซนทอง = ปลาหายากขึ้น';
      case 'charge':
        return 'ปล่อยในโซนทอง!';
      case 'wait':
        return 'รอให้ปลากินเหยื่อ… ระวังใบไม้หลอก';
      case 'bite':
        return 'กินแล้ว! แตะเลย!';
      case 'reel':
        return 'กดค้างดันตัวชี้ ให้อยู่ในโซนเขียวของปลา';
      default:
        return '';
    }
  }

  private buttonText(): string {
    switch (this.phase) {
      case 'idle':
      case 'caught':
      case 'lost':
        return 'กดค้างเพื่อเหวี่ยง';
      case 'charge':
        return 'ปล่อย!';
      case 'wait':
      case 'bite':
        return 'ตวัดเบ็ด!';
      case 'reel':
        return 'กดค้างเพื่อดึง';
    }
  }

  private press(): void {
    if (this.el.hidden || this.tab !== 'fish') return;
    this.holding = true;
    if (this.phase === 'idle' || this.phase === 'caught' || this.phase === 'lost') {
      this.phase = 'charge';
      this.power = 0;
      this.powerDir = 1;
      this.message = '';
      this.render();
      this.loop();
    } else if (this.phase === 'wait') {
      this.phase = 'lost';
      this.message = 'ตวัดเร็วไป ปลาตกใจหนีไปแล้ว…';
      this.render();
    } else if (this.phase === 'bite') {
      this.startReel();
    }
  }

  private release(): void {
    if (!this.holding) return;
    this.holding = false;
    if (this.phase === 'charge') this.cast();
  }

  private cast(): void {
    const p = this.power;
    const quality = p >= GOLD.from && p <= GOLD.to ? 1 : Math.max(0, 1 - Math.abs(p - (GOLD.from + GOLD.to) / 2) * 1.6);
    this.fish = rollFish(rng(), { quality, hour: new Date().getHours() });
    const r = rng();
    this.waitMs = 1800 + r.next() * 3200;
    this.nibbles = [];
    if (r.next() < FISHING.fakeBiteChance) this.nibbles.push(this.waitMs * (0.3 + r.next() * 0.4));
    this.phase = 'wait';
    this.message = quality >= 1 ? 'เหวี่ยงเข้าโซนทอง! ปลาหายากสนใจ ✨' : '';
    this.render();
  }

  private startReel(): void {
    this.phase = 'reel';
    this.marker = 0.25;
    this.markerVel = 0;
    this.zone = 0.5;
    this.zoneVel = 0;
    this.catchBar = 0.3;
    this.message = '';
    this.render();
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    this.last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - this.last) / 1000);
      this.last = t;
      if (this.el.hidden) return;
      if (!this.step(dt)) return;
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  /** One frame of whatever phase is running; false stops the loop. */
  private step(dt: number): boolean {
    const q = <T extends HTMLElement>(s: string) => this.sheet.querySelector<T>(s);
    switch (this.phase) {
      case 'charge': {
        this.power += this.powerDir * dt * 1.15;
        if (this.power >= 1) (this.power = 1), (this.powerDir = -1);
        if (this.power <= 0) (this.power = 0), (this.powerDir = 1);
        q('.power i')?.style.setProperty('left', `${this.power * 100}%`);
        return true;
      }
      case 'wait': {
        this.waitMs -= dt * 1000;
        const nibble = this.nibbles.findIndex((n) => this.waitMs <= n);
        if (nibble >= 0) {
          this.nibbles.splice(nibble, 1);
          const leaf = q('.leaf');
          leaf?.classList.remove('drift');
          void leaf?.offsetWidth;
          leaf?.classList.add('drift');
          q('.bobber')?.classList.add('nibble');
          window.setTimeout(() => q('.bobber')?.classList.remove('nibble'), 400);
        }
        if (this.waitMs <= 0) {
          this.phase = 'bite';
          this.biteLeft = BITE_MS;
          // render() restarts the loop for the new phase
          this.render();
          return false;
        }
        return true;
      }
      case 'bite': {
        this.biteLeft -= dt * 1000;
        if (this.biteLeft <= 0) {
          this.phase = 'lost';
          this.message = 'ช้าไปนิด ปลาคาบเหยื่อหนีไปแล้ว';
          this.render();
          return false;
        }
        return true;
      }
      case 'reel': {
        const cfg = FISHING.reel[this.fish?.fish.rarity ?? 'common'];
        // the fish darts left and right; stronger fish dart harder
        this.zoneVel += (Math.random() - 0.5) * cfg.speed * 6 * dt;
        this.zoneVel *= 0.97;
        this.zone += this.zoneVel * dt * 2;
        if (this.zone < cfg.zone / 2 || this.zone > 1 - cfg.zone / 2) {
          this.zone = Math.min(1 - cfg.zone / 2, Math.max(cfg.zone / 2, this.zone));
          this.zoneVel *= -0.6;
        }
        // holding pushes the marker right, letting go lets it drift back
        this.markerVel += (this.holding ? 2.4 : -2.0) * dt;
        this.markerVel *= 0.9;
        this.marker += this.markerVel * dt * 2.2;
        if (this.marker < 0 || this.marker > 1) (this.marker = Math.min(1, Math.max(0, this.marker))), (this.markerVel = 0);
        const inZone = Math.abs(this.marker - this.zone) <= cfg.zone / 2;
        this.catchBar += (inZone ? 1 : -0.55) * (dt * 1000) / cfg.needMs;
        const zoneEl = q('.reel .zone');
        if (zoneEl) {
          zoneEl.style.left = `${(this.zone - cfg.zone / 2) * 100}%`;
          zoneEl.style.width = `${cfg.zone * 100}%`;
          zoneEl.classList.toggle('hit', inZone);
        }
        q('.reel .marker')?.style.setProperty('left', `${this.marker * 100}%`);
        q('.catch i')?.style.setProperty('width', `${Math.max(0, Math.min(1, this.catchBar)) * 100}%`);
        if (this.catchBar >= 1 && this.fish) {
          this.phase = 'caught';
          const { fish, size } = this.fish;
          const first = !this.deps.getSave().pond.log[fish.id];
          this.deps.setSave(catchFish(this.deps.getSave(), fish, size));
          this.message = first ? `ปลาชนิดใหม่! บันทึกลงสมุดปลาแล้ว 📖` : `ได้ ${FISH_NAME[fish.id]}!`;
          this.render();
          return false;
        }
        if (this.catchBar <= 0) {
          this.phase = 'lost';
          this.message = 'สายหลุด… ปลาหนีไปแล้ว';
          this.render();
          return false;
        }
        return true;
      }
      default:
        return false;
    }
  }

  // ---------- the other tabs ----------

  private dexBody(save: SaveData): string {
    const log = save.pond.log;
    const kinds = Object.keys(log).length;
    return `
      <p class="sheet-hint">พลังถาวรจากสมุดปลา: <b>${formatStats(fishdexBonus(log)) || 'ยังไม่มี'}</b></p>
      <ol class="dex-steps">${FISHDEX_STEPS.map((s) => `<li class="${kinds >= s.kinds ? 'on' : ''}">${s.kinds} ชนิด: ${formatStats(s.bonus)}</li>`).join('')}</ol>
      <div class="dex-grid">
        ${FISH.map((f) => {
          const got = log[f.id];
          const time = f.time === 'day' ? '☀️' : f.time === 'night' ? '🌙' : '';
          return `<div class="dex-card ${got ? 'got' : ''}" style="--rc:${RARITY_COLOR[f.rarity]}">
            <span class="fish-ico" style="--rc:${RARITY_COLOR[f.rarity]}"></span>
            <b>${got ? FISH_NAME[f.id] : '???'}</b>
            <small>${RARITY_TEXT[f.rarity]} ${time}</small>
            <small>${got ? `×${got.count} · ใหญ่สุด ${got.best} ซม.` : 'ยังไม่เคยตกได้'}</small>
          </div>`;
        }).join('')}
      </div>`;
  }

  private autoBody(save: SaveData): string {
    const waiting = pendingAuto(save);
    const bench = ownedRoster(save).filter((h) => !save.team.includes(h.id));
    return `
      <p class="sheet-hint">ส่งพัฟที่ <b>พัก</b> อยู่ (ไม่ได้ลงทีม) มานั่งตกปลา — ได้ปลาธรรมดาทุก ${FISHING.autoEveryMs / 60000} นาที/ตัว (สูงสุด 12 ชม.) · ปลาหายากต้องตกเองเท่านั้น</p>
      <div class="auto-collect">
        <span>รอรับ <b>${waiting.length}</b> ตัว</span>
        <button type="button" class="mini-btn gold" data-act="collect" ${waiting.length ? '' : 'disabled'}>รับปลา</button>
      </div>
      <div class="angler-list">
        ${
          bench.length
            ? bench
                .map((h) => {
                  const on = save.pond.anglers.includes(h.id);
                  return `<button type="button" class="angler ${on ? 'on' : ''}" data-act="angler" data-id="${h.id}" aria-pressed="${on}">
                    <img class="${portraitClass(h.species, h.heroClass)}" src="${portraitUrl(h.species, h.heroClass)}" alt=""><b>${h.name}</b><small>${on ? 'กำลังตกปลา 🎣' : 'แตะเพื่อส่งไป'}</small></button>`;
                })
                .join('')
            : '<p class="empty">ทุกตัวลงทีมอยู่ — พักพัฟสักตัวในหน้าทีมเพื่อส่งมานั่งตกปลา</p>'
        }
      </div>`;
  }

  private shopBody(save: SaveData): string {
    const pond = shopState(save);
    const puff = heroDef(featuredPuff());
    return `
      <p class="sheet-hint">แลกเกล็ดปลาเป็นของดี — พัฟประจำสัปดาห์นี้: <b>${puff?.name ?? ''}</b> (เปลี่ยนทุกวันจันทร์)</p>
      <div class="shop-list">
        ${shopItems()
          .map((item) => {
            const bought = pond.bought[item.id] ?? 0;
            const left = item.limit - bought;
            return `<div class="shop-item"><span><b>${item.name}</b><small>เหลือ ${left}/${item.limit} สัปดาห์นี้</small></span>
              <button type="button" class="mini-btn gold" data-act="buy" data-id="${item.id}" ${left <= 0 || pond.scales < item.price ? 'disabled' : ''}><i class="scale-ico"></i>${item.price}</button></div>`;
          })
          .join('')}
      </div>`;
  }

  protected onAct(act: string, target: HTMLElement): void {
    const save = this.deps.getSave();
    switch (act) {
      case 'tab':
        cancelAnimationFrame(this.raf);
        this.phase = 'idle';
        this.message = '';
        this.toast = null;
        this.tab = (target.dataset.tab as typeof this.tab) ?? 'fish';
        return this.render();
      case 'fish-tap':
        // keyboard "click" (Enter/Space is handled by keydown); pointer taps are handled on pointerdown
        return;
      case 'collect': {
        const { result, fish } = collectAuto(save);
        const names = [...new Set(fish)].map((id) => FISH_NAME[id] ?? id).join(', ');
        return this.apply({ ...result, message: fish.length ? `${result.message} (${names})` : result.message });
      }
      case 'angler':
        return this.apply(toggleAngler(save, target.dataset.id ?? ''));
      case 'buy':
        return this.apply(buy(save, target.dataset.id ?? ''));
    }
  }

  protected render(): void {
    super.render();
    // a caught fish that was recorded while the loop ran: keep its info visible
    if (this.phase === 'wait' || this.phase === 'bite' || this.phase === 'reel') this.loop();
  }
}

export const fishName = (id: string): string => FISH_NAME[id] ?? fishInfo(id)?.id ?? id;
