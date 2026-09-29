import { useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, scenariosFor, shuffle, type GroupId } from "../data/scenarios";
import { TENSES, type TenseId } from "../data/tenses";
import { Analyzing } from "../components/Analyzing";
import { Feedback } from "../components/Feedback";
import { Timeline } from "../components/Timeline";
import { analyze, GeminiError, type Analysis } from "../lib/gemini";
import { Recorder, type Recording } from "../lib/recorder";
import { usePracticeClock } from "../lib/hooks";
import { addAttempt, addMistakes, type Settings } from "../lib/storage";
import { stopSpeaking } from "../lib/tts";

type Phase = "ready" | "recording" | "analyzing" | "feedback";
const MAX_SECONDS = 60;
const SESSION_LEN = 8;

type EvalInput = { audio?: Recording; text?: string };

export function Practice({
  group,
  settings,
  onExit,
}: {
  group: GroupId | "mix";
  settings: Settings;
  onExit: () => void;
}) {
  const deck = useMemo(() => shuffle(scenariosFor(group)).slice(0, SESSION_LEN), [group]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hint, setHint] = useState(false);
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  // Sentence being repeated after a correction; a ref so the auto-stop timer sees it too.
  const [repeatTarget, setRepeatTarget] = useState("");
  const repeatRef = useRef("");
  const [error, setError] = useState("");
  const [retryInput, setRetryInput] = useState<EvalInput | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const rec = useRef<Recorder | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const sc = deck[idx];
  const groupTitle = group === "mix" ? "Mezcla" : GROUPS.find((g) => g.id === group)?.title;
  const done = idx >= deck.length;

  usePracticeClock();

  useEffect(() => () => {
    rec.current?.cancel();
    window.clearInterval(timer.current);
    stopSpeaking();
  }, []);

  async function startRecording() {
    setError("");
    setRetryInput(null);
    stopSpeaking();
    const r = new Recorder();
    try {
      await r.start();
    } catch {
      setError("No pude acceder al micrófono. Da permiso de micrófono a la app o usa «Escribir».");
      return;
    }
    rec.current = r;
    setElapsed(0);
    setPhase("recording");
    const t0 = Date.now();
    timer.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      setElapsed(s);
      if (s >= MAX_SECONDS) void stopRecording();
    }, 250);
  }

  async function stopRecording() {
    window.clearInterval(timer.current);
    const r = rec.current;
    rec.current = null;
    if (!r) return;
    setPhase("analyzing");
    let audio: Recording;
    try {
      audio = await r.stop();
    } catch (e) {
      fail(e);
      return;
    }
    if (audio.seconds < 0.8) {
      setError("La grabación fue muy corta. Mantén el micrófono activo mientras hablas.");
      setPhase(result ? "feedback" : "ready");
      return;
    }
    await run({ audio });
  }

  function submitTyped() {
    if (typed.trim()) void run({ text: typed.trim() });
  }

  /** Evaluates an answer; if Gemini fails transiently, keeps it so «Reintentar» can resend it. */
  async function run(input: EvalInput) {
    setPhase("analyzing");
    setError("");
    setRetryInput(null);
    try {
      await evaluate(input);
    } catch (e) {
      fail(e);
      if (e instanceof GeminiError && e.retriable) setRetryInput(input);
    }
  }

  function fail(e: unknown) {
    setError(e instanceof GeminiError ? e.message : `Algo falló: ${(e as Error)?.message ?? e}`);
    setPhase(result ? "feedback" : "ready");
  }

  async function evaluate(input: EvalInput) {
    const repeatOf = repeatRef.current || undefined;
    const a = await analyze({
      apiKey: settings.apiKey,
      model: settings.model,
      situation: sc.prompt,
      targets: sc.targets,
      repeatOf,
      ...input,
    });
    if (!a.understood) {
      setError("No te entendí bien. Intenta de nuevo, hablando cerca del micrófono.");
      setPhase(result ? "feedback" : "ready");
      return;
    }
    const now = Date.now();
    addAttempt({
      ts: now,
      scenarioId: sc.id,
      targets: sc.targets,
      transcript: a.transcript,
      score: a.score,
      verbs: a.verbs,
      retry: !!repeatOf,
    });
    if (!repeatOf) {
      addMistakes(
        a.verbs
          .filter((v) => !v.ok)
          .map((v) => ({ ts: now, scenarioId: sc.id, said: v.phrase, corrected: v.correction, expected: v.expected, why: v.why }))
      );
      setScores((s) => [...s, a.score]);
    }
    setResult(a);
    setTyped("");
    setTyping(false); // repetition is always spoken
    setPhase("feedback");
  }

  function next() {
    stopSpeaking();
    setIdx((i) => i + 1);
    setPhase("ready");
    setResult(null);
    setRepeatTarget("");
    repeatRef.current = "";
    setHint(false);
    setError("");
    setRetryInput(null);
  }

  function repeat() {
    if (!repeatRef.current && result) {
      const hasErrors = result.verbs.some((v) => !v.ok);
      repeatRef.current = (hasErrors ? result.corrected : result.natural) || result.corrected;
      setRepeatTarget(repeatRef.current);
    }
    void startRecording();
  }

  if (done) {
    const avg = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0;
    return (
      <div className="screen">
        <header className="bar">
          <button className="link" onClick={onExit}>← Inicio</button>
        </header>
        <div className="card center">
          <h2>¡Sesión completa!</h2>
          <p className="big-num">{avg}</p>
          <p className="muted">Precisión promedio en {scores.length} ejercicios de {groupTitle}</p>
          <button className="primary" onClick={onExit}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  const recordingNow = phase === "recording";
  const main = sc.targets[0];
  // Tense of the first mistake, so the timeline explains what went wrong.
  const focus = result?.verbs.find((v) => !v.ok && v.expected in TENSES)?.expected as TenseId | undefined;

  return (
    <div className="screen practice">
      <header className="bar">
        <button className="link" onClick={onExit}>← Salir</button>
        <span className="muted small">{groupTitle} · {idx + 1}/{deck.length}</span>
      </header>
      <div className="progress-line"><span style={{ width: `${(idx / deck.length) * 100}%` }} /></div>

      <div className="split">
        <div className="pane">
          <div className="card scenario">
            <span className="chip">{sc.context}</span>
            <p className="prompt">{sc.prompt}</p>
            {repeatTarget && (
              <p className="repeat-target">
                Repite: <strong>{repeatTarget}</strong>
              </p>
            )}
            {!hint ? (
              <button className="link small" onClick={() => setHint(true)}>💡 Ver pista</button>
            ) : (
              <div className="hint">
                {sc.starter && <p>Empieza con: <em>{sc.starter}</em></p>}
                <p>Tiempos: {sc.targets.map((t) => TENSES[t].name).join(" + ")}</p>
                <div className="only-narrow"><Timeline tense={main} compact /></div>
              </div>
            )}
          </div>

          {error && (
            <div className="error" role="alert">
              <p>{error}</p>
              {retryInput && phase !== "analyzing" && (
                <button className="ghost" onClick={() => void run(retryInput)}>↻ Reintentar</button>
              )}
            </div>
          )}

          {phase === "analyzing" ? (
            <Analyzing label="Analizando tus tiempos verbales…" />
          ) : typing && !recordingNow ? (
            <div className="type-box">
              <textarea
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Escribe tu respuesta en inglés…"
                rows={3}
                autoFocus
              />
              <div className="row">
                <button className="ghost" onClick={() => setTyping(false)}>🎙️ Hablar</button>
                <button className="primary" onClick={submitTyped} disabled={!typed.trim()}>Revisar</button>
              </div>
            </div>
          ) : (
            <div className="mic-area">
              <button
                className={`mic ${recordingNow ? "mic-on" : ""}`}
                onClick={recordingNow ? stopRecording : phase === "feedback" ? repeat : startRecording}
                aria-label={recordingNow ? "Detener y revisar" : "Grabar respuesta"}
              >
                {recordingNow ? "■" : "🎙️"}
              </button>
              <p className="muted small">
                {recordingNow
                  ? `Grabando… ${elapsed}s · toca para terminar`
                  : phase === "feedback"
                  ? "Toca para repetir la versión corregida en voz alta"
                  : "Toca y responde en inglés"}
              </p>
              {!recordingNow && phase !== "feedback" && (
                <button className="link small" onClick={() => setTyping(true)}>⌨️ Prefiero escribir</button>
              )}
            </div>
          )}

          {phase === "feedback" && (
            <div className="row">
              <button className="primary wide" onClick={next}>Siguiente →</button>
            </div>
          )}
        </div>

        <div className="pane side">
          {result && <Feedback a={result} rate={settings.voiceRate} />}
          {focus ? (
            <Timeline tense={focus} />
          ) : (
            <div className="only-wide">
              {result || hint ? (
                <Timeline tense={main} />
              ) : (
                <p className="muted placeholder">Aquí verás tus correcciones y la línea de tiempo del tiempo verbal.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
