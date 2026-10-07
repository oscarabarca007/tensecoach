import { useMemo, useState } from "react";
import type { WordCat } from "../data/words";
import { TENSES, type TenseId } from "../data/tenses";
import { Analyzing } from "../components/Analyzing";
import { Correction, SayLine, ScoreBadge } from "../components/Feedback";
import { Icon } from "../components/Icon";
import { ErrorBanner, FlowHeader, MicFab } from "../components/ui";
import { WordCard } from "../components/WordCard";
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
      const r = await checkUsage(settings.apiKey, settings.model, item.word, answer, false, TENSES[challenge].name);
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
    setTyping(false);
    setCounted(false);
  }

  if (!item || step === "done") {
    const ok = results.filter((r) => r.passed).length;
    return (
      <main className="page flow">
        <header className="topbar">
          <button className="icon-btn" onClick={onExit} aria-label="Cerrar"><Icon name="close" /></button>
          <h1 className="title-l" style={{ fontSize: 18 }}>Vocabulario</h1>
        </header>
        <section className="card" style={{ alignItems: "center", textAlign: "center", padding: "32px 24px" }}>
          <span className="avatar" style={{ width: 64, height: 64 }}><Icon name="school" size={32} /></span>
          <h2 className="headline-s">¡Sesión completa!</h2>
          <p className="big-num">{ok}/{results.length}</p>
          <p className="body-m on-variant">palabras usadas correctamente</p>
          <div className="chips" style={{ justifyContent: "center" }}>
            {results.map((r, i) => (
              <span key={i} className={`badge ${r.passed ? "good" : "mid"}`}>
                <Icon name={r.passed ? "check" : "refresh"} /> {r.word}
              </span>
            ))}
          </div>
          <button className="btn btn-filled btn-lg" onClick={onExit}>Listo</button>
        </section>
      </main>
    );
  }

  const w = item.word;
  const micBlock = (label: string) =>
    busy ? (
      <Analyzing label="Escuchando con atención…" />
    ) : (
      <MicFab
        recording={mic.recording}
        elapsed={mic.elapsed}
        onClick={mic.recording ? mic.stop : mic.start}
        idleLabel={label}
        recordingLabel={(s) => `Grabando… ${s}s · toca para terminar`}
        startAria="Grabar"
        stopAria="Detener y revisar"
      />
    );

  const steps: { id: Step; label: string }[] = isReview
    ? [{ id: "use", label: "Úsala" }]
    : [
        { id: "learn", label: "Escucha" },
        { id: "pronounce", label: "Pronuncia" },
        { id: "use", label: "Úsala" },
      ];
  const stepIdx = steps.findIndex((s) => s.id === step);

  return (
    <main className="page flow">
      <FlowHeader
        title={isReview ? "Repaso" : "Palabra nueva"}
        index={idx}
        total={queue.length}
        onClose={onExit}
        closeLabel="Cerrar sesión de vocabulario"
      />

      {steps.length > 1 && (
        <div className="stepper" role="list">
          {steps.map((s, i) => (
            <span key={s.id} role="listitem" className={`step ${i === stepIdx ? "on" : i < stepIdx ? "done" : ""}`}>
              {i < stepIdx && <Icon name="check" />}
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <WordCard word={w} rate={settings.voiceRate} />

          {error && <ErrorBanner message={error} retryLabel="Reintentar" onRetry={retry && !busy && !mic.recording ? retry : undefined} />}

          {step === "learn" && (
            <section className="card high">
              <p className="body-m">
                Lee la definición, escucha la palabra 2-3 veces (usa <Icon name="slow_motion_video" size={18} /> para oírla despacio) y repítela fijándote en la sílaba fuerte.
              </p>
              <button
                className="btn btn-filled btn-lg btn-block trailing-icon"
                onClick={() => {
                  setStep("pronounce");
                  speak(w.word, settings.voiceRate);
                }}
              >
                Estoy listo para pronunciarla <Icon name="arrow_forward" />
              </button>
            </section>
          )}

          {step === "pronounce" && (
            <>
              {micBlock(pron ? "Toca para intentarlo otra vez" : `Toca y di «${w.word}»`)}
              {pron && (
                <button className="btn btn-filled btn-lg btn-block trailing-icon" onClick={() => setStep("use")}>
                  Ahora úsala en una oración <Icon name="arrow_forward" />
                </button>
              )}
            </>
          )}

          {step === "use" && (
            <>
              <section className="card high">
                <p className="title-m">Di una oración con «{w.word}».</p>
                <p className="body-m on-variant">{CONTEXT[w.cat]}.</p>
                <div className="banner" style={{ padding: "10px 14px" }}>
                  <Icon name="tune" />
                  <span className="body-m">Reto: úsala en <strong>{TENSES[challenge].es}</strong></span>
                </div>
              </section>
              {usage ? (
                <div className="row">
                  <button className="btn btn-outlined" onClick={() => setUsage(null)}><Icon name="refresh" /> Otra oración</button>
                  <button className="btn btn-filled grow trailing-icon" onClick={next}>Siguiente <Icon name="arrow_forward" /></button>
                </div>
              ) : typing && !busy ? (
                <div className="stack">
                  <label className="textfield">
                    <textarea value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Escribe tu oración en inglés…" rows={3} autoFocus aria-label="Tu oración" />
                  </label>
                  <div className="row end">
                    <button className="btn btn-text" onClick={() => setTyping(false)}><Icon name="mic" /> Hablar</button>
                    <button className="btn btn-filled" disabled={!typed.trim()} onClick={() => onUse({ text: typed.trim() })}>
                      <Icon name="check" /> Revisar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {micBlock("Toca y di tu oración")}
                  {!mic.recording && !busy && (
                    <button className="btn btn-text" style={{ alignSelf: "center" }} onClick={() => setTyping(true)}>
                      <Icon name="keyboard" /> Prefiero escribir
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="stack sticky" style={{ gap: 16 }}>
          {step === "pronounce" && pron && <PronFeedback r={pron} target={w.word} rate={settings.voiceRate} />}
          {step === "use" && usage && <UsageFeedback r={usage} rate={settings.voiceRate} />}
          {step === "use" && !usage && pron && <PronFeedback r={pron} target={w.word} rate={settings.voiceRate} />}
          {!pron && !usage && (
            <div className="placeholder only-wide">
              <Icon name="graphic_eq" />
              <span className="body-m">Aquí verás cómo te escuchó la IA y las correcciones.</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function PronFeedback({ r, target, rate }: { r: PronunciationResult; target: string; rate: number }) {
  return (
    <section className="card">
      <div className="fb-head">
        <ScoreBadge score={r.score} />
        <div className="stack" style={{ gap: 2 }}>
          <span className="overline" style={{ margin: 0 }}>Pronunciación</span>
          <span className="title-m">{r.ok ? "Se entiende bien" : "Todavía no suena claro"}</span>
          {!r.stressOk && <span className="badge mid" style={{ alignSelf: "flex-start" }}>Revisa la sílaba fuerte</span>}
        </div>
      </div>
      <p className="body-l">Te escuché decir: <strong>«{r.heard}»</strong></p>
      <p className="body-m on-variant">{r.tips}</p>
      <div className="row">
        <button className="btn btn-tonal" onClick={() => speak(target, rate)}><Icon name="volume_up" /> Modelo</button>
        <button className="btn btn-tonal" onClick={() => speak(target, 0.55)}><Icon name="slow_motion_video" /> Despacio</button>
      </div>
    </section>
  );
}

function UsageFeedback({ r, rate }: { r: UsageResult; rate: number }) {
  const check = (ok: boolean, yes: string, no: string) => (
    <span className={`badge ${ok ? "good" : "bad"}`}>
      <Icon name={ok ? "check" : "close"} /> {ok ? yes : no}
    </span>
  );
  return (
    <section className="card">
      <div className="fb-head">
        <ScoreBadge score={r.score} />
        <p className="body-l">{r.feedback}</p>
      </div>
      <section>
        <p className="overline">Lo que dijiste</p>
        <p className="transcript">{r.transcript}</p>
      </section>
      <div className="chips">
        {check(r.usedWord, "Usaste la palabra", "No usaste la palabra")}
        {check(r.meaningOk, "Significado correcto", "Revisa el significado")}
        {r.pronunciationTip && check(r.pronunciationOk, "Pronunciación", "Pronunciación")}
      </div>
      {r.pronunciationTip && (
        <div className="inset row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
          <Icon name="record_voice_over" size={20} className="on-variant" />
          <span className="body-m">{r.pronunciationTip}</span>
        </div>
      )}
      {r.notes.length > 0 && (
        <section>
          <p className="overline">Correcciones</p>
          <ul className="corrections">
            {r.notes.map((n, i) => <Correction key={i} wrong={n.wrong} right={n.right} why={n.why} />)}
          </ul>
        </section>
      )}
      {r.notes.length > 0 && r.corrected && <SayLine label="Versión corregida" text={r.corrected} rate={rate} />}
      {r.natural && r.natural.trim() !== r.corrected.trim() && <SayLine label="Como lo diría un PM nativo" text={r.natural} rate={rate} />}
    </section>
  );
}
