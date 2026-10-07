import type { ReactNode } from "react";
import { tenseLabel } from "../data/tenses";
import { Icon } from "./Icon";
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
  return <span className={`score score-${tone}`} aria-label={`Score ${score}`}>{score}</span>;
}

/** A sentence with a listen button, used for corrected / natural versions. */
export function SayLine({ label, text, rate }: { label: string; text: string; rate: number }) {
  return (
    <section>
      <p className="overline">{label}</p>
      <div className="say">
        <span className="body-l">{text}</span>
        <button className="icon-btn primary" onClick={() => speak(text, rate)} aria-label={`Listen: ${label}`}>
          <Icon name="volume_up" />
        </button>
      </div>
    </section>
  );
}

export function Correction({ wrong, right, why, children }: { wrong: string; right: string; why?: string; children?: ReactNode }) {
  return (
    <li className="correction">
      <div className="corr-line">
        <s>{wrong}</s>
        <Icon name="arrow_forward" />
        <strong>{right}</strong>
      </div>
      {children}
      {why && <p className="body-m on-variant">{why}</p>}
    </li>
  );
}

export function Feedback({ a, rate }: { a: Analysis; rate: number }) {
  const errors = a.verbs.filter((v) => !v.ok);
  return (
    <div className="card">
      <div className="fb-head">
        <ScoreBadge score={a.score} />
        <p className="body-l">{a.feedback}</p>
      </div>

      <section>
        <p className="overline">What you said</p>
        <p className="transcript">{a.transcript ? highlight(a) : <em className="on-variant">(no text)</em>}</p>
      </section>

      {errors.length > 0 && (
        <section>
          <p className="overline">Corrections</p>
          <ul className="corrections">
            {errors.map((v, i) => (
              <Correction key={i} wrong={v.phrase} right={v.correction} why={v.why}>
                <div className="chips">
                  <span className="badge bad">{tenseLabel(v.used)}</span>
                  <Icon name="arrow_forward" size={16} className="on-variant" />
                  <span className="badge good">{tenseLabel(v.expected)}</span>
                </div>
              </Correction>
            ))}
          </ul>
        </section>
      )}

      {errors.length > 0 && a.corrected && <SayLine label="Corrected version" text={a.corrected} rate={rate} />}
      {a.natural && a.natural.trim() !== a.corrected.trim() && (
        <SayLine label="How a native PM would say it" text={a.natural} rate={rate} />
      )}
    </div>
  );
}
