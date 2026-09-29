import { useMemo, useState } from "react";
import type { WordCat } from "../data/words";
import { TENSES, type TenseId } from "../data/tenses";
import { Analyzing } from "../components/Analyzing";
import { WordCard } from "../components/WordCard";
import { ScoreBadge } from "../components/Feedback";
import { GeminiError } from "../lib/gemini";
import { usePracticeClock, useRecorder } from "../lib/hooks";
import type { Recording } from "../lib/recorder";
import { todayKey, type Settings } from "../lib/storage";
import { speak } from "../lib/tts";
import {
  checkPronunciation,
  checkUsage,
  loadWordProgress,
  recordReview,
  type PronunciationResult,
  type UsageResult,
  type VocabQueueItem,
} from "../lib/vocab";

type Step = "learn" | "pronounce" | "use" | "done";

const CONTEXT: Record<WordCat, string> = {
  Planeación: "Habla del plan o del cronograma de tu proyecto",
  Riesgos: "Habla de un riesgo o un problema de tu proyecto",
  Comunicación: "Habla de cómo te comunicas con el cliente o el equipo",
  Reuniones: "Imagina que estás en una reunión de seguimiento",
  Presupuesto: "Habla del presupuesto o de los costos del proyecto",
  Agile: "Habla de tu sprint o de tu equipo",
};

// Each sentence also trains a tense, so vocabulary practice feeds the main weakness.
const TENSE_CHALLENGES: TenseId[] = ["past_simple", "present_perfect", "present_continuous", "future_going_to", "future_will", "conditional_first"];

export function VocabSession({ queue, settings, onExit }: { queue: VocabQueueItem[]; settings: Settings; onExit: () => void }) {
  usePracticeClock();
  const [idx, setIdx] = useState(0);
  const item = queue[idx];
  const [step, setStep] = useState<Step>(item?.kind === "review" ? "use" : "learn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pron, setPron] = useState<PronunciationResult | null>(null);
  const [usage, setUsage] = useState<UsageResult | null>(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState<{ word: string; passed: boolean }[]>([]);
  const [counted, setCounted] = useState(false);
  const [retry, setRetry] = useState<(() => void) | null>(null);

  const challenge = useMemo(() => TENSE_CHALLENGES[Math.floor(Math.random() * TENSE_CHALLENGES.length)], [idx]);
  const isReview = item?.kind === "review";

  const mic = useRecorder(
    (audio) => void (step === "pronounce" ? onPronounce(audio) : onUse({ audio })),
    (msg) => {
      setError(msg);
      setRetry(null);
    }
  );

  /** Shows the error; transient Gemini failures keep `again` so «Reintentar» resends the same answer. */
  function fail(e: unknown, again: () => void) {
    setError(e instanceof GeminiError ? e.message : `Algo falló: ${(e as Error)?.message ?? e}`);
    if (e instanceof GeminiError && e.retriable) setRetry(() => again);
  }

  async function onPronounce(audio: Recording) {
    setBusy(true);
    setError("");
    setRetry(null);
    try {
      setPron(await checkPronunciation(settings.apiKey, settings.model, item.word, audio));
    } catch (e) {
      fail(e, () => void onPronounce(audio));
    } finally {
      setBusy(false);
    }
  }

  async function onUse(answer: { audio?: Recording; text?: string }) {
    setBusy(true);
    setError("");
    setRetry(null);
    try {
      const r = await checkUsage(settings.apiKey, settings.model, item.word, answer, isReview, TENSES[challenge].name);
      if (!r.understood) {
        setError("No te entendí bien. Intenta de nuevo, cerca del micrófono.");
        return;
      }
      setUsage(r);
      setTyping(false);
      setTyped("");
      // Only the first sentence per word counts; extra tries are free practice.
      if (!counted) {
        setCounted(true);
        const passed = r.usedWord && r.meaningOk && r.score >= 60;
        // Words practised from the list before they are due don't move in the review schedule.
        const p = loadWordProgress()[item.word.id];
        if (!p || p.due <= todayKey()) recordReview(item.word.id, passed, r.score);
        setResults((list) => [...list, { word: item.word.word, passed }]);
      }
    } catch (e) {
      fail(e, () => void onUse(answer));
    } finally {
      setBusy(false);
    }
  }

  function next() {
    const n = idx + 1;
    setIdx(n);
    setStep(n >= queue.length ? "done" : queue[n].kind === "review" ? "use" : "learn");
    setPron(null);
    setUsage(null);
    setError("");
    setRetry(null);
    setHint(false);
    setTyping(false);
    setCounted(false);
  }

  if (!item || step === "done") {
    const ok = results.filter((r) => r.passed).length;
    return (
      <div className="screen">
        <header className="bar"><button className="link" onClick={onExit}>← Vocabulario</button></header>
        <div className="card center">
          <h2>¡Sesión de vocabulario completa!</h2>
          <p className="big-num">{ok}/{results.length}</p>
          <p className="muted">palabras usadas correctamente</p>
          <ul className="result-list">
            {results.map((r, i) => <li key={i}>{r.passed ? "✅" : "🔁"} {r.word}</li>)}
          </ul>
          <button className="primary" onClick={onExit}>Listo</button>
        </div>
      </div>
    );
  }

  const w = item.word;
  const micBlock = (label: string) =>
    busy ? (
      <Analyzing label="Escuchando con atención…" />
    ) : (
      <div className="mic-area">
        <button
          className={`mic ${mic.recording ? "mic-on" : ""}`}
          onClick={mic.recording ? mic.stop : mic.start}
          aria-label={mic.recording ? "Detener y revisar" : "Grabar"}
        >
          {mic.recording ? "■" : "🎙️"}
        </button>
        <p className="muted small">{mic.recording ? `Grabando… ${mic.elapsed}s · toca para terminar` : label}</p>
      </div>
    );

  return (
    <div className="screen practice">
      <header className="bar">
        <button className="link" onClick={onExit}>← Salir</button>
        <span className="muted small">{isReview ? "Repaso" : "Palabra nueva"} · {idx + 1}/{queue.length}</span>
      </header>
      <div className="progress-line"><span style={{ width: `${(idx / queue.length) * 100}%` }} /></div>
      <div className="steps">
        {!isReview && <span className={step === "learn" ? "on" : "done"}>1 Escucha</span>}
        {!isReview && <span className={step === "pronounce" ? "on" : step === "use" ? "done" : ""}>2 Pronuncia</span>}
        <span className={step === "use" ? "on" : ""}>{isReview ? "Recuerda y úsala" : "3 Úsala"}</span>
      </div>

      <div className="split">
        <div className="pane">
          <WordCard word={w} rate={settings.voiceRate} hideWord={isReview && !usage && !hint} />
          {isReview && !usage && !hint && (
            <button className="link small" onClick={() => setHint(true)}>💡 Mostrar la palabra</button>
          )}
          {error && (
            <div className="error" role="alert">
              <p>{error}</p>
              {retry && !busy && !mic.recording && (
                <button className="ghost" onClick={retry}>↻ Reintentar</button>
              )}
            </div>
          )}

          {step === "learn" && (
            <div className="card">
              <p>Escúchala 2-3 veces (usa 🐢 para oírla despacio) y repítela en voz baja fijándote en la sílaba fuerte.</p>
              <button
                className="primary wide"
                onClick={() => {
                  setStep("pronounce");
                  speak(w.word, settings.voiceRate);
                }}
              >
                Estoy listo para pronunciarla →
              </button>
            </div>
          )}

          {step === "pronounce" && (
            <>
              {micBlock(pron ? "Toca para intentarlo otra vez" : `Toca y di «${w.word}»`)}
              {pron && (
                <button className="primary wide" onClick={() => setStep("use")}>Ahora úsala en una oración →</button>
              )}
            </>
          )}

          {step === "use" && (
            <>
              <div className="card scenario">
                <p className="prompt">
                  {isReview && !hint
                    ? `Di una oración con la palabra en inglés que significa «${w.es}».`
                    : `Di una oración con «${w.word}».`}
                </p>
                <p className="muted">{CONTEXT[w.cat]}.</p>
                <p className="challenge">🎯 Reto: úsala en <strong>{TENSES[challenge].es}</strong></p>
              </div>
              {usage ? (
                <div className="row">
                  <button className="ghost" onClick={() => setUsage(null)}>Intentar otra oración</button>
                  <button className="primary grow" onClick={next}>Siguiente →</button>
                </div>
              ) : typing && !busy ? (
                <div className="type-box">
                  <textarea value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Escribe tu oración en inglés…" rows={3} autoFocus />
                  <div className="row">
                    <button className="ghost" onClick={() => setTyping(false)}>🎙️ Hablar</button>
                    <button className="primary" disabled={!typed.trim()} onClick={() => onUse({ text: typed.trim() })}>Revisar</button>
                  </div>
                </div>
              ) : (
                <>
                  {micBlock("Toca y di tu oración")}
                  {!mic.recording && !busy && (
                    <button className="link small center-self" onClick={() => setTyping(true)}>⌨️ Prefiero escribir</button>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="pane side">
          {step === "pronounce" && pron && <PronFeedback r={pron} target={w.word} rate={settings.voiceRate} />}
          {step === "use" && usage && <UsageFeedback r={usage} rate={settings.voiceRate} />}
          {step === "use" && !usage && pron && <PronFeedback r={pron} target={w.word} rate={settings.voiceRate} />}
          {!pron && !usage && (
            <p className="muted placeholder only-wide">Aquí verás cómo te escuchó la IA y las correcciones.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PronFeedback({ r, target, rate }: { r: PronunciationResult; target: string; rate: number }) {
  return (
    <div className="feedback">
      <div className="fb-head">
        <ScoreBadge score={r.score} />
        <div>
          <h3>Pronunciación</h3>
          <p>{r.ok ? "✅ Se entiende bien" : "🔁 Todavía no suena claro"}{!r.stressOk && " · revisa la sílaba fuerte"}</p>
        </div>
      </div>
      <p>Te escuché decir: <strong>«{r.heard}»</strong></p>
      <p>{r.tips}</p>
      <div className="row">
        <button className="ghost" onClick={() => speak(target, rate)}>🔊 Modelo</button>
        <button className="ghost" onClick={() => speak(target, 0.55)}>🐢 Despacio</button>
      </div>
    </div>
  );
}

function UsageFeedback({ r, rate }: { r: UsageResult; rate: number }) {
  return (
    <div className="feedback">
      <div className="fb-head">
        <ScoreBadge score={r.score} />
        <p className="fb-summary">{r.feedback}</p>
      </div>
      <section>
        <h3>Lo que dijiste</h3>
        <p className="transcript">{r.transcript}</p>
      </section>
      <div className="checks">
        <span className={`chip ${r.usedWord ? "chip-ok" : "chip-bad"}`}>{r.usedWord ? "✓ Usaste la palabra" : "✗ No usaste la palabra"}</span>
        <span className={`chip ${r.meaningOk ? "chip-ok" : "chip-bad"}`}>{r.meaningOk ? "✓ Significado correcto" : "✗ Revisa el significado"}</span>
        {r.pronunciationTip && <span className={`chip ${r.pronunciationOk ? "chip-ok" : "chip-bad"}`}>{r.pronunciationOk ? "✓ Pronunciación" : "✗ Pronunciación"}</span>}
      </div>
      {r.pronunciationTip && <p className="err-why">🗣️ {r.pronunciationTip}</p>}
      {r.notes.length > 0 && (
        <section>
          <h3>Correcciones</h3>
          <ul className="errors">
            {r.notes.map((n, i) => (
              <li key={i}>
                <div className="err-line"><s>{n.wrong}</s> <span aria-hidden>→</span> <strong>{n.right}</strong></div>
                {n.why && <p className="err-why">{n.why}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {r.notes.length > 0 && r.corrected && (
        <section>
          <h3>Versión corregida</h3>
          <p className="say">{r.corrected}<button className="icon-btn" onClick={() => speak(r.corrected, rate)} aria-label="Escuchar">🔊</button></p>
        </section>
      )}
      {r.natural && r.natural.trim() !== r.corrected.trim() && (
        <section>
          <h3>Como lo diría un PM nativo</h3>
          <p className="say">{r.natural}<button className="icon-btn" onClick={() => speak(r.natural, rate)} aria-label="Escuchar">🔊</button></p>
        </section>
      )}
    </div>
  );
}
