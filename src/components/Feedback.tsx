import type { ReactNode } from "react";
import { tenseLabel } from "../data/tenses";
import type { Analysis } from "../lib/gemini";
import { speak } from "../lib/tts";

/** Wraps each analysed verb phrase in the transcript with a green/red highlight. */
function highlight(a: Analysis): ReactNode[] {
  const text = a.transcript;
  const lower = text.toLowerCase();
  const spans: { start: number; end: number; ok: boolean }[] = [];
  let cursor = 0;
  for (const v of a.verbs) {
    const needle = v.phrase.toLowerCase().trim();
    if (!needle) continue;
    let at = lower.indexOf(needle, cursor);
    if (at < 0) at = lower.indexOf(needle);
    if (at < 0 || spans.some((s) => at < s.end && at + needle.length > s.start)) continue;
    spans.push({ start: at, end: at + needle.length, ok: v.ok });
    cursor = at + needle.length;
  }
  spans.sort((x, y) => x.start - y.start);
  const out: ReactNode[] = [];
  let i = 0;
  spans.forEach((s, n) => {
    if (s.start > i) out.push(text.slice(i, s.start));
    out.push(<mark key={n} className={s.ok ? "v-ok" : "v-bad"}>{text.slice(s.start, s.end)}</mark>);
    i = s.end;
  });
  if (i < text.length) out.push(text.slice(i));
  return out;
}

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 85 ? "good" : score >= 60 ? "mid" : "bad";
  return <span className={`score score-${tone}`}>{score}</span>;
}

export function Feedback({ a, rate }: { a: Analysis; rate: number }) {
  const errors = a.verbs.filter((v) => !v.ok);
  return (
    <div className="feedback">
      <div className="fb-head">
        <ScoreBadge score={a.score} />
        <p className="fb-summary">{a.feedback}</p>
      </div>

      <section>
        <h3>Lo que dijiste</h3>
        <p className="transcript">{a.transcript ? highlight(a) : <em className="muted">(sin texto)</em>}</p>
      </section>

      {errors.length > 0 && (
        <section>
          <h3>Correcciones</h3>
          <ul className="errors">
            {errors.map((v, i) => (
              <li key={i}>
                <div className="err-line">
                  <s>{v.phrase}</s> <span aria-hidden>→</span> <strong>{v.correction}</strong>
                </div>
                <div className="err-meta">
                  <span className="chip chip-bad">{tenseLabel(v.used)}</span>
                  <span aria-hidden>→</span>
                  <span className="chip chip-ok">{tenseLabel(v.expected)}</span>
                </div>
                {v.why && <p className="err-why">{v.why}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {errors.length > 0 && a.corrected && (
        <section>
          <h3>Versión corregida</h3>
          <p className="say">
            {a.corrected}
            <button className="icon-btn" onClick={() => speak(a.corrected, rate)} aria-label="Escuchar versión corregida">🔊</button>
          </p>
        </section>
      )}

      {a.natural && a.natural.trim() !== a.corrected.trim() && (
        <section>
          <h3>Como lo diría un PM nativo</h3>
          <p className="say">
            {a.natural}
            <button className="icon-btn" onClick={() => speak(a.natural, rate)} aria-label="Escuchar versión natural">🔊</button>
          </p>
        </section>
      )}
    </div>
  );
}
