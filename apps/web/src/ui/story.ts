// The story in four cards (GDD §0.2): why the puffs fight, what bonking does, and the daily loop.
// Shown once on a new save; the village title opens it again any time.
import { bossSheet, frameUrl, hasSheet, portraitUrl } from '../assets';

interface Card {
  readonly title: string;
  readonly text: string;
  readonly art: () => string;
}

const img = (src: string, cls = ''): string => `<img class="${cls}" src="${src}" alt="">`;

const CARDS: readonly Card[] = [
  {
    title: 'สวนที่ถูกสาป',
    text: 'ราชินี <b>Rafflesia</b> สาปดอกไม้ทั้งอาณาจักรให้ขี้หงุดหงิด ลุกขึ้นมาอาละวาดไปทั่วทุ่ง',
    art: () => (hasSheet(bossSheet('queen-rafflesia')) ? img(frameUrl(bossSheet('queen-rafflesia'), 0), 'boss') : ''),
  },
  {
    title: 'ออกไป Bonk ให้หายงอน',
    text: 'เหล่าพัฟตัวกลมออกเดินทาง <b>Bonk</b> ดอกไม้ด้วยหมอน แครอท และฟองสบู่ — ไม่มีใครเจ็บ ใครแพ้ก็แค่ "งีบ"',
    art: () => ['hamham-pillow-guard', 'shibu-carrot-knight', 'bunbun-leaf-archer'].map((k) => img(portraitUrl(k.split('-')[0] as never, k.split('-').slice(1).join('-') as never), 'puff')).join(''),
  },
  {
    title: 'ปลุกโลกให้กลับมาสดใส',
    text: 'ดอกไม้ที่หายงอนทิ้ง <b>เมล็ด</b> ไว้ — นำกลับไปปลูกที่สวนในหมู่บ้าน ยิ่งบานมาก โลกยิ่งฟื้น และทีมยิ่งเก่งถาวร',
    art: () => '<span class="sprout" aria-hidden="true">🌱🌷🌻</span>',
  },
  {
    title: 'วันหนึ่งของพัฟ',
    text: '① ออกผจญภัยผ่านด่าน ② เอา Petal ไปอัปเลเวล ③ ปลูกสวน ④ ทำภารกิจรายวันเก็บ Dew Drop ไปสุ่มพัฟใหม่ — <b>แม้คุณหลับ พัฟก็ยังฟาร์มให้</b>',
    art: () => '<span class="loop" aria-hidden="true"><i>⚔️</i><i>⬆️</i><i>🌱</i><i>🥚</i></span>',
  },
];

export class StoryOverlay {
  private readonly el: HTMLElement;
  private index = 0;
  private onDone: () => void = () => undefined;

  constructor(
    root: HTMLElement,
    private readonly onClick: () => void,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'story';
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'เรื่องราว');
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (!act) return;
      this.onClick();
      if (act === 'next' && this.index < CARDS.length - 1) {
        this.index++;
        return this.render();
      }
      if (act === 'back' && this.index > 0) {
        this.index--;
        return this.render();
      }
      if (act === 'next' || act === 'skip') this.close();
    });
  }

  open(onDone: () => void = () => undefined): void {
    this.onDone = onDone;
    this.index = 0;
    this.el.hidden = false;
    this.render();
  }

  private close(): void {
    this.el.hidden = true;
    this.onDone();
  }

  private render(): void {
    const card = CARDS[this.index]!;
    const last = this.index === CARDS.length - 1;
    this.el.innerHTML = `
      <div class="story-card" data-i="${this.index}">
        <div class="story-art">${card.art()}</div>
        <h2>${card.title}</h2>
        <p>${card.text}</p>
        <div class="story-dots">${CARDS.map((_, i) => `<i class="${i === this.index ? 'on' : ''}"></i>`).join('')}</div>
        <div class="story-actions">
          ${this.index > 0 ? '<button type="button" data-act="back">ย้อน</button>' : '<button type="button" data-act="skip">ข้าม</button>'}
          <button type="button" class="primary" data-act="next">${last ? 'เริ่มผจญภัย!' : 'ต่อไป'}</button>
        </div>
      </div>`;
  }
}
