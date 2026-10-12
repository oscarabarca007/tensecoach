import { useEffect, useRef, useState } from "react";
import type { ListeningItem } from "../data/listening";
import { Icon } from "../components/Icon";
import { usePracticeClock } from "../lib/hooks";
import { saveListeningResult } from "../lib/listening";
import { playDialogue, stopSpeaking, ttsAvailable } from "../lib/tts";

const SPEEDS = [0.75, 0.9, 1];

const initials = (name: string) => name.replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, "").slice(0, 1).toUpperCase();

export function ListeningSession({
  item,
  onExit,
  onNext,
}: {
  item: ListeningItem;
  onExit: () => void;
  onNext: () => void;
}) {
  usePracticeClock();
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(-1);
  const [plays, setPlays] = useState(0);
  const [speed, setSpeed] = useState(0.9);
  // Hidden by default on every situation; it's a help, not the main way to listen.
  const [showText, setShowText] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(item.questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => {
    stopRef.current();
    stopSpeaking();
  }, []);

  function play(startAt = 0) {
    stopRef.current();
    setPlaying(true);
    if (startAt === 0) setPlays((n) => n + 1);
    stopRef.current = playDialogue(item.lines, {
      rate: speed,
      startAt,
      onLine: setLine,
      onEnd: () => {
        setPlaying(false);
        setLine(-1);
      },
    });
  }

  function stop() {
    stopRef.current();
  }

  function check() {
    setChecked(true);
    saveListeningResult(item.id, answers.filter((a, i) => a === item.questions[i].answer).length);
  }

  function retry() {
    setAnswers(item.questions.map(() => null));
    setChecked(false);
    play();
  }

  const correct = answers.filter((a, i) => a === item.questions[i].answer).length;
  const allAnswered = answers.every((a) => a !== null);

  return (
    <main className="page flow">
      <header className="topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Close listening"><Icon name="close" /></button>
        <h1 className="title-l" style={{ fontSize: 18 }}>Listening</h1>
        <span className="trailing"><span className="badge info">{item.level}</span></span>
      </header>

      <div className="grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card">
            <div className="row between">
              <span className="chip static">{item.context}</span>
              {item.custom && <span className="badge"><Icon name="auto_awesome" /> AI</span>}
            </div>
            <h2 className="headline-s">{item.title}</h2>
            <ul className="speakers">
              {item.speakers.map((s, i) => (
                <li key={i} className={`speaker ${playing && item.lines[line]?.s === i ? "talking" : ""}`}>
                  <span className={`avatar sp-${i % 3}`}>{initials(s.name)}</span>
                  <span className="stack" style={{ gap: 0 }}>
                    <span className="label-l">{s.name}</span>
                    <span className="body-s on-variant">{s.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card high">
            <div className="player">
              <button
                className={`fab ${playing ? "recording" : ""}`}
                onClick={() => (playing ? stop() : play())}
                aria-label={playing ? "Stop" : "Play the conversation"}
                disabled={!ttsAvailable()}
              >
                <Icon name={playing ? "stop" : plays ? "replay" : "play_arrow"} filled />
              </button>
              <div className="stack grow" style={{ gap: 6 }}>
                <span className="title-m">{playing ? "Playing…" : plays ? "Play again" : "Play the conversation"}</span>
                <div className="linear">
                  <span style={{ width: `${playing && line >= 0 ? ((line + 1) / item.lines.length) * 100 : 0}%` }} />
                </div>
                <span className="body-s on-variant">
                  {plays === 0 ? "Listen at least twice before opening the transcript." : `Played ${plays} ${plays === 1 ? "time" : "times"}`}
                </span>
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Icon name="speed" className="on-variant" />
              {SPEEDS.map((s) => (
                <button key={s} className={`chip ${speed === s ? "selected" : ""}`} onClick={() => setSpeed(s)} aria-pressed={speed === s}>
                  {speed === s && <Icon name="check" />}
                  {s}×
                </button>
              ))}
            </div>
            {!ttsAvailable() && (
              <div className="banner error"><Icon name="error" /><span className="body-m">This browser can't play speech.</span></div>
            )}
          </section>

          <button className="btn btn-outlined" style={{ alignSelf: "flex-start" }} onClick={() => setShowText((v) => !v)} aria-expanded={showText}>
            <Icon name={showText ? "subtitles_off" : "subtitles"} /> {showText ? "Hide transcript" : "Show transcript"}
          </button>

          {showText && (
            <section className="card transcript-card" aria-label="Transcript">
              <p className="body-s on-variant">Tap a line to hear it from there.</p>
              <ol className="dialogue">
                {item.lines.map((l, i) => (
                  <li key={i}>
                    <button className={`dl-line ${line === i ? "current" : ""}`} onClick={() => play(i)}>
                      <span className={`label-m sp-text-${l.s % 3}`}>{item.speakers[l.s]?.name}</span>
                      <span className="body-l">{l.text}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <section className="card sticky" aria-label="Questions">
          <div className="row" style={{ gap: 12 }}>
            <span className="avatar"><Icon name="quiz" /></span>
            <div className="stack" style={{ gap: 0 }}>
              <h2 className="title-m">Questions</h2>
              <span className="body-s on-variant">Choose the best answer.</span>
            </div>
          </div>

          {item.questions.map((q, qi) => (
            <fieldset key={qi} className="question" disabled={checked}>
              <legend className="title-s">{qi + 1}. {q.q}</legend>
              <div className="options">
                {q.options.map((o, oi) => {
                  const state = !checked ? "" : oi === q.answer ? "right" : answers[qi] === oi ? "wrong" : "";
                  return (
                    <label key={oi} className={`option ${answers[qi] === oi ? "chosen" : ""} ${state}`}>
                      <input
                        type="radio"
                        name={`q${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => setAnswers((a) => a.map((x, k) => (k === qi ? oi : x)))}
                      />
                      <span className="body-m grow">{o}</span>
                      {state === "right" && <Icon name="check_circle" filled />}
                      {state === "wrong" && <Icon name="error" filled />}
                    </label>
                  );
                })}
              </div>
              {checked && (
                <p className="inset body-m why">
                  <Icon name="lightbulb" size={18} /> <span>{q.why}</span>
                </p>
              )}
            </fieldset>
          ))}

          {!checked ? (
            <button className="btn btn-filled btn-lg btn-block" disabled={!allAnswered} onClick={check}>
              <Icon name="check" /> Check answers
            </button>
          ) : (
            <>
              <div className={`banner ${correct === 3 ? "good" : correct === 2 ? "warn" : "error"}`}>
                <Icon name={correct === 3 ? "task_alt" : "headphones"} />
                <div className="banner-body">
                  <span className="title-m">{correct} / 3 correct</span>
                  <span className="body-m">
                    {correct === 3
                      ? "Excellent listening!"
                      : showText
                      ? "Read the explanations, then listen again without the transcript."
                      : "Open the transcript and listen again to find the answers."}
                  </span>
                </div>
              </div>
              <div className="row">
                <button className="btn btn-outlined" onClick={retry}><Icon name="replay" /> Try again</button>
                <button className="btn btn-filled grow trailing-icon" onClick={onNext}>Next situation <Icon name="arrow_forward" /></button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
