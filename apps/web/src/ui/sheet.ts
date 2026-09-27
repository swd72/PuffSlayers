// A bottom sheet for village buildings (album, quest board, pond, arena, raid): header with a back
// button, a toast line for action results, and a body each building draws itself. Clicks on any
// element with data-act go to the building's onAct().
import type { SaveData } from '../meta/save';
import type { ActionResult } from '../meta/workshop';

export interface SheetDeps {
  getSave(): SaveData;
  setSave(save: SaveData): void;
  onClick(): void;
  /** the sheet closed (back to the village) */
  onClose(): void;
}

export abstract class Sheet {
  protected readonly el: HTMLElement;
  protected readonly sheet: HTMLElement;
  protected toast: { text: string; ok: boolean } | null = null;

  constructor(
    root: HTMLElement,
    protected readonly deps: SheetDeps,
    private readonly theme: string,
    label: string,
  ) {
    this.el = document.createElement('section');
    this.el.className = `sheet-panel ${theme}`;
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', label);
    this.sheet = document.createElement('div');
    this.sheet.className = `sheet ${theme}-sheet`;
    this.el.appendChild(this.sheet);
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      // tapping the dimmed backdrop closes the sheet
      if (e.target === this.el) {
        this.deps.onClick();
        return this.close();
      }
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!target || (target as HTMLButtonElement).disabled) return;
      this.deps.onClick();
      if (target.dataset.act === 'close') return this.close();
      this.onAct(target.dataset.act ?? '', target);
    });
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  open(): void {
    this.toast = null;
    this.el.hidden = false;
    this.sheet.scrollTop = 0;
    this.render();
  }

  close(): void {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.onHide();
    this.deps.onClose();
  }

  refresh(): void {
    if (!this.el.hidden) this.render();
  }

  /** Applies an action from meta/*: new save + toast. */
  protected apply(result: ActionResult): void {
    this.toast = { text: result.message, ok: result.ok };
    this.deps.setSave(result.save);
    this.render();
  }

  protected say(text: string, ok = true): void {
    this.toast = { text, ok };
    const line = this.sheet.querySelector<HTMLElement>('.sheet-toast');
    if (line) {
      line.textContent = text;
      line.className = `sheet-toast ${ok ? 'ok' : 'bad'}`;
    }
  }

  protected render(): void {
    const save = this.deps.getSave();
    const head = this.head(save);
    this.sheet.innerHTML = `
      <header class="sheet-head">
        <button type="button" class="prep-back" data-act="close" aria-label="กลับหมู่บ้าน">‹</button>
        <div><small>${head.sub}</small><h2>${head.title}</h2></div>
        ${head.extra ?? ''}
      </header>
      <p class="sheet-toast ${this.toast?.ok ? 'ok' : 'bad'}" aria-live="polite">${this.toast?.text ?? ''}</p>
      ${this.body(save)}`;
  }

  protected onHide(): void {}

  protected abstract head(save: SaveData): { title: string; sub: string; extra?: string };
  protected abstract body(save: SaveData): string;
  protected abstract onAct(act: string, target: HTMLElement): void;
}

export const fmt = (n: number): string => Math.floor(n).toLocaleString('en-US');
export const stars = (n: number, max = 5): string =>
  `<span class="stars" aria-label="${n} ดาว">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
