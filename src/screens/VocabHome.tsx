import { useMemo, useState } from "react";
import { WORD_CATS, type Word, type WordCat } from "../data/words";
import { GeminiError } from "../lib/gemini";
import type { Settings } from "../lib/storage";
import { speak } from "../lib/tts";
import { addCustomWords, allWords, buildQueue, generateWords, loadWordProgress, statusOf, type VocabQueueItem } from "../lib/vocab";

const STATUS_LABEL = { new: "nueva", learning: "aprendiendo", known: "dominada" } as const;

export function VocabHome({
  settings,
  onBack,
  onStart,
}: {
  settings: Settings;
  onBack: () => void;
  onStart: (q: VocabQueueItem[]) => void;
}) {
  const [version, setVersion] = useState(0); // bump to re-read storage after generating words
  const [cat, setCat] = useState<WordCat | "all">("all");
  const [query, setQuery] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState("");

  const words = useMemo(allWords, [version]);
  const progress = useMemo(loadWordProgress, [version]);
  const queue = useMemo(() => buildQueue(settings.newWordsPerDay), [version, settings.newWordsPerDay]);
  const counts = { new: 0, learning: 0, known: 0 };
  words.forEach((w) => counts[statusOf(progress[w.id])]++);
  const reviews = queue.filter((q) => q.kind === "review").length;
  const fresh = queue.length - reviews;

  const q = query.trim().toLowerCase();
  const shown = words.filter(
    (w) => (cat === "all" || w.cat === cat) && (!q || [w.word, w.es, w.def ?? ""].some((s) => s.toLowerCase().includes(q)))
  );

  async function generate() {
    setGenBusy(true);
    setGenMsg("");
    try {
      const list = await generateWords(settings.apiKey, settings.model, 5, cat === "all" ? undefined : cat);
      const added = addCustomWords(list);
      setGenMsg(
        added
          ? `✓ ${added} ${added === 1 ? "palabra nueva agregada" : "palabras nuevas agregadas"}`
          : "No llegaron palabras nuevas; intenta otra categoría."
      );
      setVersion((v) => v + 1);
    } catch (e) {
      setGenMsg(e instanceof GeminiError ? e.message : String(e));
    } finally {
      setGenBusy(false);
    }
  }

  const practiceOne = (w: Word) => onStart([{ word: w, kind: "new" }]);

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>← Inicio</button>
        <h1 className="title">Vocabulario</h1>
        <span />
      </header>

      <div className="home-grid">
        <section className="card">
          <div className="stats">
            <div><strong>{counts.new}</strong><span className="muted small">nuevas</span></div>
            <div><strong>{counts.learning}</strong><span className="muted small">aprendiendo</span></div>
            <div><strong>{counts.known}</strong><span className="muted small">dominadas</span></div>
          </div>
          <p className="muted">
            Hoy: {reviews} para repasar · {fresh} nuevas
          </p>
          <button className="primary wide" disabled={!queue.length || !settings.apiKey} onClick={() => onStart(queue)}>
            {queue.length ? `▶ Sesión de hoy (${queue.length} palabras)` : "✓ Nada pendiente por hoy"}
          </button>
          <p className="muted small">
            Cada palabra: escúchala → pronúnciala → úsala en una oración. Las que fallas vuelven mañana; las que dominas, cada vez más espaciadas.
          </p>
        </section>

        <section className="card">
          <h2>¿Quieres más palabras?</h2>
          <p className="muted small">La IA genera 5 términos útiles de gestión de proyectos que aún no tienes{cat !== "all" ? ` de «${cat}»` : ""}.</p>
          <button className="ghost" onClick={generate} disabled={genBusy || !settings.apiKey}>
            {genBusy ? "Generando…" : "✨ Generar 5 palabras con IA"}
          </button>
          {genMsg && <p className="small">{genMsg}</p>}
        </section>

        <section className="card span-2">
          <div className="filters">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en inglés o español…" />
            <div className="chips-scroll">
              {(["all", ...WORD_CATS] as const).map((c) => (
                <button key={c} className={`chip-btn ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
                  {c === "all" ? "Todas" : c}
                </button>
              ))}
            </div>
          </div>
          <ul className="word-list">
            {shown.map((w) => {
              const st = statusOf(progress[w.id]);
              return (
                <li key={w.id}>
                  <button className="icon-btn" onClick={() => speak(w.word, settings.voiceRate)} aria-label={`Escuchar ${w.word}`}>🔊</button>
                  <button className="word-row" onClick={() => practiceOne(w)} disabled={!settings.apiKey}>
                    <span>
                      <strong>{w.word}</strong> <span className="muted small">{w.say}</span>
                      <br />
                      <span className="muted small">{w.es}</span>
                      {w.def && (
                        <>
                          <br />
                          <span className="muted small def-line">{w.def}</span>
                        </>
                      )}
                    </span>
                    <span className={`status-chip st-${st}`}>{STATUS_LABEL[st]}</span>
                  </button>
                </li>
              );
            })}
            {!shown.length && <li className="muted">Sin resultados.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
