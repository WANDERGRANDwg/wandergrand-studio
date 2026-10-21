// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — persistence (save slots + options)
// ─────────────────────────────────────────────────────────────
import type { SaveData } from './Game';
import type { Quality } from './Game';
import type { Lang } from './i18n';

export interface Opts {
  lang: Lang;
  quality: Quality;
  master: number; // 0..1
  amb: number;
  sfx: number;
  sens: number;   // 0.3..2.5
}

export const DEFAULT_OPTS: Opts = { lang: 'fr', quality: 'med', master: 0.8, amb: 0.9, sfx: 1, sens: 1 };

const OPTS_KEY = 'sdfaker_opts_v2';
const SLOTS_KEY = 'sdfaker_slots_v2';

export function loadOpts(): Opts {
  try {
    const raw = localStorage.getItem(OPTS_KEY);
    if (!raw) return { ...DEFAULT_OPTS };
    return { ...DEFAULT_OPTS, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_OPTS }; }
}
export function saveOpts(o: Opts) {
  try { localStorage.setItem(OPTS_KEY, JSON.stringify(o)); } catch { /* noop */ }
}

export interface Slot { save: SaveData; updatedAt: number; }
export type Slots = (Slot | null)[];

export function loadSlots(): Slots {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return [null, null, null];
    const arr = JSON.parse(raw) as Slots;
    while (arr.length < 3) arr.push(null);
    return arr.slice(0, 3);
  } catch { return [null, null, null]; }
}
export function writeSlot(i: number, slot: Slot | null): Slots {
  const slots = loadSlots();
  slots[i] = slot;
  try { localStorage.setItem(SLOTS_KEY, JSON.stringify(slots)); } catch { /* noop */ }
  return slots;
}
