import type { Word } from "../data/words";
import { speak } from "../lib/tts";

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

export function WordCard({ word, rate, hideWord = false }: { word: Word; rate: number; hideWord?: boolean }) {
  return (
    <div className="card word-card">
      <div className="row between">
        <span className="chip">{word.cat}</span>
        <span className="muted small">{word.pos}</span>
      </div>
      {hideWord ? (
        <p className="word-hidden">¿?</p>
      ) : (
        <>
          <div className="word-main">
            <h2 className="word">{word.word}</h2>
            <div className="row">
              <button className="icon-btn" onClick={() => speak(word.word, rate)} aria-label="Escuchar">🔊</button>
              <button className="icon-btn" onClick={() => speak(word.word, 0.55)} aria-label="Escuchar despacio">🐢</button>
            </div>
          </div>
          <p className="say-hint">
            Suena: <strong>{word.say}</strong> <span className="muted small">(MAYÚSCULAS = sílaba fuerte)</span>
          </p>
        </>
      )}
      <p className="meaning">{word.es}</p>
      {!hideWord && (
        <p className="say example">
          <span>{withWord(word.example, word.word)}</span>
          <button className="icon-btn" onClick={() => speak(word.example, rate)} aria-label="Escuchar ejemplo">🔊</button>
        </p>
      )}
      {!hideWord && word.tip && <p className="note">💡 {word.tip}</p>}
    </div>
  );
}
