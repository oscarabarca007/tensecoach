import type { AnyTense, TenseId } from "../data/tenses";

export const MODELS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", note: "Recomendado · ~500 solicitudes/día gratis · entiende audio" },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", note: "Más preciso · solo ~20 solicitudes/día gratis" },
] as const;

export interface Settings {
  apiKey: string;
  model: string;
  dailyGoalMin: number;
  voiceRate: number;
  newWordsPerDay: number;
}

export interface VerbCheck {
  phrase: string;
  used: AnyTense;
  expected: AnyTense;
  ok: boolean;
  correction: string;
  why: string;
}

export interface Attempt {
  ts: number;
  scenarioId: string;
  targets: TenseId[];
  transcript: string;
  score: number;
  verbs: VerbCheck[];
  retry: boolean;
}

export interface Mistake {
  ts: number;
  scenarioId: string;
  said: string;
  corrected: string;
  expected: AnyTense;
  why: string;
}

const K = {
  settings: "tc.settings",
  attempts: "tc.attempts",
  mistakes: "tc.mistakes",
  daily: "tc.daily",
};

const DEFAULTS: Settings = {
  apiKey: "",
  model: MODELS[0].id,
  dailyGoalMin: 20,
  voiceRate: 0.95,
  newWordsPerDay: 5,
};

// localStorage can throw (private mode, blocked storage); the app keeps working in memory.
const memory = new Map<string, string>();

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key) ?? memory.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    localStorage.setItem(key, raw);
  } catch {
    /* in-memory only */
  }
}

export const loadSettings = (): Settings => ({ ...DEFAULTS, ...readJson<Partial<Settings>>(K.settings, {}) });
export const saveSettings = (s: Settings) => writeJson(K.settings, s);

export const loadAttempts = (): Attempt[] => readJson<Attempt[]>(K.attempts, []);
export function addAttempt(a: Attempt) {
  writeJson(K.attempts, [...loadAttempts(), a].slice(-1000));
}

export const loadMistakes = (): Mistake[] => readJson<Mistake[]>(K.mistakes, []);
export function addMistakes(list: Mistake[]) {
  if (list.length) writeJson(K.mistakes, [...loadMistakes(), ...list].slice(-300));
}

export const todayKey = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time

export const loadDaily = (): Record<string, number> => readJson<Record<string, number>>(K.daily, {});
export function addPracticeSeconds(sec: number) {
  const d = loadDaily();
  const k = todayKey();
  d[k] = (d[k] ?? 0) + sec;
  writeJson(K.daily, d);
}

export function streakDays(daily: Record<string, number>, goalMin: number): number {
  let n = 0;
  const d = new Date();
  // Today counts only once the goal is met; otherwise start from yesterday.
  if ((daily[d.toLocaleDateString("en-CA")] ?? 0) < goalMin * 60) d.setDate(d.getDate() - 1);
  while ((daily[d.toLocaleDateString("en-CA")] ?? 0) >= goalMin * 60) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function resetProgress() {
  writeJson(K.attempts, []);
  writeJson(K.mistakes, []);
  writeJson(K.daily, {});
  writeJson("tc.vocab.progress", {});
}
