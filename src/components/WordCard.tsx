import type { Word } from "../data/words";
import { speak } from "../lib/tts";
import { Icon } from "./Icon";

/** Highlights the target word (any inflection that starts with it) inside the example. */
function withWord(example: string, word: string) {
  const i = example.toLowerCase().indexOf(word.toLowerCase().split(" ")[0]);
  if (i < 0) return example;
  const end = example.indexOf(" ", i + word.length - 1);
  const j = end < 0 ? example.length : end;
  return (
    <>
      {example.slice(0, i)}
      <strong>{example.slice(i, j)}</strong>
      {example.slice(j)}
    </>
  );
}

/** The word and its English definition lead; the Spanish translation is secondary support. */
export function WordCard({ word, rate }: { word: Word; rate: number }) {
  return (
    <article className="card">
      <div className="row between">
        <span className="chip static">{word.cat}</span>
        <span className="label-m on-variant">{word.pos}</span>
      </div>

      <div className="stack" style={{ gap: 4 }}>
        <div className="word-head">
          <h2 className="word">{word.word}</h2>
          <div className="row" style={{ gap: 0, flexWrap: "nowrap" }}>
            <button className="icon-btn tonal" onClick={() => speak(word.word, rate)} aria-label="Listen">
              <Icon name="volume_up" />
            </button>
            <button className="icon-btn tonal" onClick={() => speak(word.word, 0.55)} aria-label="Listen slowly">
              <Icon name="slow_motion_video" />
            </button>
          </div>
        </div>
        <p className="pron body-m">
          <Icon name="record_voice_over" size={18} />
          <strong>{word.say}</strong>
          <span className="body-s">(MAYÚSCULAS = sílaba fuerte)</span>
        </p>
      </div>

      {word.def && <p className="definition">{word.def}</p>}
      <p className="translation body-m">
        <Icon name="translate" />
        {word.es}
      </p>

      <div className="inset say example">
        <span className="body-l">{withWord(word.example, word.word)}</span>
        <button className="icon-btn primary" onClick={() => speak(word.example, rate)} aria-label="Listen to the example">
          <Icon name="volume_up" />
        </button>
      </div>

      {word.tip && (
        <div className="banner warn">
          <Icon name="lightbulb" />
          <span className="body-m">{word.tip}</span>
        </div>
      )}
    </article>
  );
}
