// Sound effects played from audio files in public/audio/sfx (see docs/sfx-prompts.md).
// A sound whose file is missing simply stays silent — there is no synthesized fallback.
import type { HeroClass } from '@puff/sim';

export type SfxName =
  | 'swing'
  | 'pew'
  | 'hit'
  | 'crit'
  | 'miss'
  | 'heal'
  | 'bonk'
  | 'faint'
  | 'cast'
  | 'buff'
  | 'victory'
  | 'defeat'
  | 'click'
  | `ult-${HeroClass}`;

export const SFX_NAMES: readonly SfxName[] = [
  'swing',
  'pew',
  'hit',
  'crit',
  'miss',
  'heal',
  'bonk',
  'faint',
  'cast',
  'buff',
  'victory',
  'defeat',
  'click',
  'ult-carrot-knight',
  'ult-bubble-mage',
  'ult-leaf-archer',
  'ult-pillow-guard',
  'ult-mochi-cleric',
  'ult-bell-bard',
  'ult-root-druid',
];

const BASE_URL = '/audio/sfx';
const EXTENSIONS = ['mp3', 'ogg', 'wav'] as const;
/** optional take variations: hit.mp3, hit-2.mp3, hit-3.mp3 … picked at random so repeats don't sound robotic */
const MAX_VARIANTS = 3;
const MASTER_VOLUME = 0.8;
const MUTE_KEY = 'puff.muted';

/** Per-sound mix: frequent sounds sit lower so ultimates and bonks stand out. */
const VOLUME: Partial<Record<SfxName, number>> = {
  swing: 0.35,
  pew: 0.3,
  hit: 0.45,
  crit: 0.6,
  miss: 0.35,
  heal: 0.45,
  bonk: 0.55,
  buff: 0.4,
  click: 0.5,
};

/** Same sound can't retrigger faster than this (keeps big fights readable). */
const THROTTLE_MS: Partial<Record<SfxName, number>> = { swing: 70, pew: 60, hit: 55, crit: 70, miss: 90, heal: 110, bonk: 80, buff: 150 };

/** Small random pitch drift for sounds that repeat a lot. */
const PITCH_DRIFT: Partial<Record<SfxName, number>> = { swing: 0.08, pew: 0.08, hit: 0.07, crit: 0.05, bonk: 0.08, heal: 0.04 };

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // storage can be blocked (private mode); muting still works for this session
  }
}

export class Sfx {
  private readonly ctx: AudioContext | null;
  private readonly master: GainNode | null;
  private readonly buffers = new Map<SfxName, AudioBuffer[]>();
  private readonly lastPlayed = new Map<SfxName, number>();
  private mutedState = readMuted();

  constructor() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    this.ctx = Ctor ? new Ctor() : null;
    if (this.ctx) {
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.mutedState ? 0 : MASTER_VOLUME;
      this.master.connect(comp).connect(this.ctx.destination);
    } else {
      this.master = null;
    }
  }

  get muted(): boolean {
    return this.mutedState;
  }

  /** Names that actually have a file, for debugging the sound set. */
  get loaded(): SfxName[] {
    return [...this.buffers.keys()];
  }

  /** Fetches and decodes every sound file that exists. Missing files are skipped quietly. */
  async preload(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    await Promise.all(
      SFX_NAMES.map(async (name) => {
        const takes: AudioBuffer[] = [];
        for (let v = 1; v <= MAX_VARIANTS; v++) {
          const buffer = await this.loadFirst(ctx, v === 1 ? name : `${name}-${v}`);
          if (buffer) takes.push(buffer);
          else if (v > 1) break;
        }
        if (takes.length) this.buffers.set(name, takes);
      }),
    );
  }

  private async loadFirst(ctx: AudioContext, stem: string): Promise<AudioBuffer | null> {
    for (const ext of EXTENSIONS) {
      try {
        const res = await fetch(`${BASE_URL}/${stem}.${ext}`);
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || type.includes('text/html')) continue;
        return await ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        // not decodable in this browser (e.g. ogg on older Safari) — try the next format
      }
    }
    return null;
  }

  /** Browsers only allow audio after a user gesture: call this from the first tap / key press. */
  unlock(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.mutedState = !this.mutedState;
    writeMuted(this.mutedState);
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.mutedState ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.02);
    return this.mutedState;
  }

  play(name: SfxName): void {
    const ctx = this.ctx;
    const takes = this.buffers.get(name);
    if (!ctx || !this.master || !takes || this.mutedState || ctx.state !== 'running') return;
    const now = performance.now();
    const gap = THROTTLE_MS[name] ?? 0;
    if (gap && now - (this.lastPlayed.get(name) ?? -Infinity) < gap) return;
    this.lastPlayed.set(name, now);

    const buffer = takes[Math.floor(Math.random() * takes.length)];
    if (!buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const drift = PITCH_DRIFT[name] ?? 0;
    src.playbackRate.value = 1 + (Math.random() * 2 - 1) * drift;
    const gain = ctx.createGain();
    gain.gain.value = VOLUME[name] ?? 0.8;
    src.connect(gain).connect(this.master);
    src.start();
  }
}
