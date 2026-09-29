import { TENSE_IDS, type TenseId } from "../data/tenses";
import type { Attempt } from "./storage";

export interface TenseStat {
  id: TenseId;
  ok: number;
  total: number;
}

/** Accuracy per expected tense, counted per verb over first attempts (not repetitions). */
export function tenseStats(attempts: Attempt[]): TenseStat[] {
  const map = new Map<TenseId, TenseStat>(TENSE_IDS.map((id) => [id, { id, ok: 0, total: 0 }]));
  for (const a of attempts) {
    if (a.retry) continue;
    for (const v of a.verbs) {
      const s = map.get(v.expected as TenseId);
      if (!s) continue;
      s.total++;
      if (v.ok) s.ok++;
    }
  }
  return [...map.values()];
}

export function accuracy(s: { ok: number; total: number }): number | null {
  return s.total ? Math.round((s.ok / s.total) * 100) : null;
}

export function groupAccuracy(stats: TenseStat[], tenses: TenseId[]) {
  const sel = stats.filter((s) => tenses.includes(s.id));
  return accuracy({ ok: sel.reduce((n, s) => n + s.ok, 0), total: sel.reduce((n, s) => n + s.total, 0) });
}

export function lastDays(daily: Record<string, number>, n = 7) {
  const out: { key: string; label: string; min: number }[] = [];
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const key = d.toLocaleDateString("en-CA");
    out.push({ key, label: d.toLocaleDateString("es", { weekday: "narrow" }), min: Math.round((daily[key] ?? 0) / 60) });
    d.setDate(d.getDate() + 1);
  }
  return out;
}
