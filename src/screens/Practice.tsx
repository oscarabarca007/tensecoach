import { useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, scenariosFor, shuffle, type GroupId } from "../data/scenarios";
import { TENSES, type TenseId } from "../data/tenses";
import { Analyzing } from "../components/Analyzing";
import { Feedback } from "../components/Feedback";
import { Icon } from "../components/Icon";
import { ErrorBanner, FlowHeader, MicFab } from "../components/ui";
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
  const groupTitle = group === "mix" ? "Mixed practice" : GROUPS.find((g) => g.id === group)?.title;
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
      setError("I can't access the microphone. Allow microphone access for the app, or use «Type instead».");
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
      setError("That recording was too short. Tap, speak, then tap again to finish.");
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
    setError(e instanceof GeminiError ? e.message : `Something went wrong: ${(e as Error)?.message ?? e}`);
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
      setError("I couldn't understand you. Please try again, closer to the microphone.");
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
      <main className="page flow">
        <header className="topbar">
          <button className="icon-btn" onClick={onExit} aria-label="Close"><Icon name="close" /></button>
          <h1 className="title-l" style={{ fontSize: 18 }}>{groupTitle}</h1>
        </header>
        <section className="card" style={{ alignItems: "center", textAlign: "center", padding: "32px 24px" }}>
          <span className="avatar" style={{ width: 64, height: 64 }}><Icon name="task_alt" size={32} /></span>
          <h2 className="headline-s">Session complete!</h2>
          <p className="big-num">{avg}</p>
          <p className="body-m on-variant">Average accuracy in {scores.length} exercises</p>
          <button className="btn btn-filled btn-lg" onClick={onExit}>Back to home</button>
        </section>
      </main>
    );
  }

  const recordingNow = phase === "recording";
  const main = sc.targets[0];
  // Tense of the first mistake, so the timeline explains what went wrong.
  const focus = result?.verbs.find((v) => !v.ok && v.expected in TENSES)?.expected as TenseId | undefined;

  return (
    <main className="page flow">
      <FlowHeader title={groupTitle ?? "Practice"} index={idx} total={deck.length} onClose={onExit} closeLabel="Close practice" />

      <div className="grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card">
            <span className="chip static" style={{ alignSelf: "flex-start" }}>{sc.context}</span>
            <p className="prompt">{sc.prompt}</p>
            {repeatTarget && (
              <div className="banner">
                <Icon name="record_voice_over" />
                <div className="banner-body">
                  <span className="label-l">Say it again</span>
                  <span className="body-l">{repeatTarget}</span>
                </div>
              </div>
            )}
            {!hint ? (
              <button className="btn btn-text" style={{ alignSelf: "flex-start", marginLeft: -12 }} onClick={() => setHint(true)}>
                <Icon name="lightbulb" /> Show hint
              </button>
            ) : (
              <div className="inset hint">
                {sc.starter && <p className="body-m">Start with: <em>{sc.starter}</em></p>}
                <div className="chips">
                  {sc.targets.map((t) => <span key={t} className="badge info">{TENSES[t].name}</span>)}
                </div>
                <div className="only-narrow"><Timeline tense={main} compact /></div>
              </div>
            )}
          </section>

          {error && (
            <ErrorBanner
              message={error}
              retryLabel="Try again"
              onRetry={retryInput && phase !== "analyzing" ? () => void run(retryInput) : undefined}
            />
          )}

          {phase === "analyzing" ? (
            <Analyzing label="Checking your verb tenses…" slowNote="Gemini is very busy; retrying automatically…" />
          ) : typing && !recordingNow ? (
            <div className="stack">
              <label className="textfield">
                <textarea
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Type your answer in English…"
                  rows={3}
                  autoFocus
                  aria-label="Your answer"
                />
              </label>
              <div className="row end">
                <button className="btn btn-text" onClick={() => setTyping(false)}><Icon name="mic" /> Speak</button>
                <button className="btn btn-filled" onClick={submitTyped} disabled={!typed.trim()}><Icon name="check" /> Check</button>
              </div>
            </div>
          ) : (
            <>
              <MicFab
                recording={recordingNow}
                elapsed={elapsed}
                onClick={recordingNow ? stopRecording : phase === "feedback" ? repeat : startRecording}
                idleLabel={phase === "feedback" ? "Tap and say the corrected version out loud" : "Tap and answer out loud"}
                recordingLabel={(s) => `Recording… ${s}s · tap to finish`}
                startAria="Record your answer"
                stopAria="Stop and check"
              />
              {!recordingNow && phase !== "feedback" && (
                <button className="btn btn-text" style={{ alignSelf: "center" }} onClick={() => setTyping(true)}>
                  <Icon name="keyboard" /> Type instead
                </button>
              )}
            </>
          )}

          {phase === "feedback" && (
            <button className="btn btn-filled btn-lg btn-block trailing-icon" onClick={next}>
              Next <Icon name="arrow_forward" />
            </button>
          )}
        </div>

        <div className="stack sticky" style={{ gap: 16 }}>
          {result && <Feedback a={result} rate={settings.voiceRate} />}
          {focus ? (
            <Timeline tense={focus} />
          ) : (
            <div className="only-wide">
              {result || hint ? (
                <Timeline tense={main} />
              ) : (
                <div className="placeholder">
                  <Icon name="graphic_eq" />
                  <span className="body-m">Your corrections and the tense timeline will appear here.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
