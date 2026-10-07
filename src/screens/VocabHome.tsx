import { useMemo, useState } from "react";
import { WORD_CATS, type Word, type WordCat } from "../data/words";
import { Icon } from "../components/Icon";
import { GeminiError } from "../lib/gemini";
import type { Settings } from "../lib/storage";
import { speak } from "../lib/tts";
import { addCustomWords, allWords, buildQueue, generateWords, loadWordProgress, statusOf, type VocabQueueItem } from "../lib/vocab";

const STATUS = {
  new: { label: "Nueva", tone: "" },
  learning: { label: "Aprendiendo", tone: "mid" },
  known: { label: "Dominada", tone: "good" },
} as const;

export function VocabHome({ settings, onStart }: { settings: Settings; onStart: (q: VocabQueueItem[]) => void }) {
  const [version, setVersion] = useState(0); // bump to re-read storage after generating words
  const [cat, setCat] = useState<WordCat | "all">("all");
  const [query, setQuery] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const words = useMemo(allWords, [version]);
  const progress = useMemo(loadWordProgress, [version]);
  const queue = useMemo(() => buildQueue(settings.newWordsPerDay), [version, settings.newWordsPerDay]);
  const counts = { new: 0, learning: 0, known: 0 };
  words.forEach((w) => counts[statusOf(progress[w.id])]++);
  const reviews = queue.filter((q) => q.kind === "review").length;
  const fresh = queue.length - reviews;
  const ready = !!settings.apiKey;

  const q = query.trim().toLowerCase();
  const shown = words.filter(
    (w) => (cat === "all" || w.cat === cat) && (!q || [w.word, w.es, w.def ?? ""].some((s) => s.toLowerCase().includes(q)))
  );

  async function generate() {
    setGenBusy(true);
    setGenMsg(null);
    try {
      const list = await generateWords(settings.apiKey, settings.model, 5, cat === "all" ? undefined : cat);
      const added = addCustomWords(list);
      setGenMsg(
        added
          ? { ok: true, text: `${added} ${added === 1 ? "palabra nueva agregada" : "palabras nuevas agregadas"}` }
          : { ok: false, text: "No llegaron palabras nuevas; intenta otra categoría." }
      );
      setVersion((v) => v + 1);
    } catch (e) {
      setGenMsg({ ok: false, text: e instanceof GeminiError ? e.message : String(e) });
    } finally {
      setGenBusy(false);
    }
  }

  const practiceOne = (w: Word) => onStart([{ word: w, kind: "new" }]);

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="title-l">Vocabulary</h1>
      </header>

      <div className="grid-2">
        <section className="card">
          <div className="stats">
            <div className="stat"><span className="num">{counts.new}</span><span className="label-m on-variant">Nuevas</span></div>
            <div className="stat"><span className="num">{counts.learning}</span><span className="label-m on-variant">Aprendiendo</span></div>
            <div className="stat"><span className="num">{counts.known}</span><span className="label-m on-variant">Dominadas</span></div>
          </div>
          <p className="body-m on-variant">Hoy: {reviews} para repasar · {fresh} nuevas</p>
          <button className="btn btn-filled btn-lg btn-block" disabled={!queue.length || !ready} onClick={() => onStart(queue)}>
            <Icon name={queue.length ? "play_arrow" : "check"} filled />
            {queue.length ? `Sesión de hoy · ${queue.length} palabras` : "Nada pendiente por hoy"}
          </button>
          <p className="body-s on-variant">
            Cada palabra: escúchala, pronúnciala y úsala en una oración. Las que fallas vuelven mañana; las que dominas, cada vez más espaciadas.
          </p>
        </section>

        <section className="card">
          <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", gap: 16 }}>
            <span className="avatar"><Icon name="auto_awesome" /></span>
            <div className="stack" style={{ gap: 2 }}>
              <h2 className="title-m">¿Quieres más palabras?</h2>
              <p className="body-m on-variant">
                La IA genera 5 términos útiles de gestión de proyectos que aún no tienes{cat !== "all" ? ` de «${cat}»` : ""}.
              </p>
            </div>
          </div>
          <button className="btn btn-tonal" style={{ alignSelf: "flex-start" }} onClick={generate} disabled={genBusy || !ready}>
            {genBusy ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 3 }} /> : <Icon name="auto_awesome" />}
            {genBusy ? "Generando…" : "Generar 5 palabras"}
          </button>
          {genMsg && (
            <div className={`banner ${genMsg.ok ? "good" : "error"}`} style={{ padding: "10px 14px" }}>
              <Icon name={genMsg.ok ? "check_circle" : "error"} />
              <span className="body-m">{genMsg.text}</span>
            </div>
          )}
        </section>

        <section className="stack span-2" style={{ gap: 12 }}>
          <label className="searchbar">
            <Icon name="search" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en inglés o español" aria-label="Buscar palabras" />
          </label>
          <div className="chips-scroll" style={{ margin: 0, padding: 0 }}>
            {(["all", ...WORD_CATS] as const).map((c) => (
              <button key={c} className={`chip ${cat === c ? "selected" : ""}`} onClick={() => setCat(c)} aria-pressed={cat === c}>
                {cat === c && <Icon name="check" />}
                {c === "all" ? "Todas" : c}
              </button>
            ))}
          </div>

          <div className="card tight">
            <ul className="list">
              {shown.map((w) => {
                const st = STATUS[statusOf(progress[w.id])];
                return (
                  <li key={w.id} className="row" style={{ flexWrap: "nowrap", gap: 0, paddingLeft: 8 }}>
                    <button className="icon-btn primary" onClick={() => speak(w.word, settings.voiceRate)} aria-label={`Escuchar ${w.word}`}>
                      <Icon name="volume_up" />
                    </button>
                    <button className="list-btn" style={{ paddingLeft: 8 }} onClick={() => practiceOne(w)} disabled={!ready}>
                      <span className="word-row-text">
                        <span className="w">{w.word} <span className="body-s on-variant">{w.say}</span></span>
                        {w.def && <span className="d">{w.def}</span>}
                        <span className="es">{w.es}</span>
                      </span>
                      <span className={`badge ${st.tone}`}>{st.label}</span>
                    </button>
                  </li>
                );
              })}
              {!shown.length && <li className="list-item body-m on-variant">Sin resultados.</li>}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
