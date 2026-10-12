import { useMemo, useState } from "react";
import type { ListeningItem } from "../data/listening";
import { Icon } from "../components/Icon";
import { GeminiError } from "../lib/gemini";
import { allListening, generateListening, loadListeningResults, nextListening } from "../lib/listening";
import type { Settings } from "../lib/storage";

export function ListeningHome({ settings, onOpen }: { settings: Settings; onOpen: (item: ListeningItem) => void }) {
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const items = useMemo(allListening, [version]);
  const results = useMemo(loadListeningResults, [version]);
  const done = items.filter((i) => results[i.id]).length;
  const attempted = Object.values(results);
  const avg = attempted.length ? Math.round((attempted.reduce((n, r) => n + r.best, 0) / (attempted.length * 3)) * 100) : null;
  const next = nextListening();

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const item = await generateListening(settings.apiKey, settings.model);
      setVersion((v) => v + 1);
      onOpen(item);
    } catch (e) {
      setError(e instanceof GeminiError || e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="title-l">Listening</h1>
      </header>

      <div className="grid-2">
        <section className="card">
          <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", gap: 16 }}>
            <span className="avatar"><Icon name="headphones" /></span>
            <div className="stack" style={{ gap: 2 }}>
              <h2 className="title-m">Real tech & PM conversations</h2>
              <p className="body-m on-variant">Listen to a short meeting or call, then answer 3 questions. The transcript stays hidden unless you need it.</p>
            </div>
          </div>
          <div className="stats" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="stat"><span className="num">{done}/{items.length}</span><span className="label-m on-variant">Completed</span></div>
            <div className="stat"><span className="num">{avg === null ? "–" : `${avg}%`}</span><span className="label-m on-variant">Best accuracy</span></div>
          </div>
          {next && (
            <button className="btn btn-filled btn-lg btn-block" onClick={() => onOpen(next)}>
              <Icon name="play_arrow" filled /> Start: {next.title}
            </button>
          )}
        </section>

        <section className="card">
          <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", gap: 16 }}>
            <span className="avatar"><Icon name="auto_awesome" /></span>
            <div className="stack" style={{ gap: 2 }}>
              <h2 className="title-m">New situation with AI</h2>
              <p className="body-m on-variant">Gemini writes a fresh workplace conversation with 3 questions. Uses 1 request.</p>
            </div>
          </div>
          <button className="btn btn-tonal" style={{ alignSelf: "flex-start" }} onClick={generate} disabled={busy || !settings.apiKey}>
            {busy ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 3 }} /> : <Icon name="auto_awesome" />}
            {busy ? "Writing the conversation…" : "Generate a situation"}
          </button>
          {!settings.apiKey && <p className="body-s on-variant">Add your Gemini API key in Settings to generate new situations.</p>}
          {error && (
            <div className="banner error" style={{ padding: "10px 14px" }}>
              <Icon name="error" />
              <span className="body-m">{error}</span>
            </div>
          )}
        </section>

        <section className="stack span-2" style={{ gap: 8 }}>
          <h2 className="title-m section-title">All situations</h2>
          <div className="card tight">
            <ul className="list">
              {items.map((it) => {
                const r = results[it.id];
                return (
                  <li key={it.id}>
                    <button className="list-btn" onClick={() => onOpen(it)}>
                      <span className="avatar"><Icon name={r ? "check" : it.custom ? "auto_awesome" : "headphones"} /></span>
                      <span className="li-text">
                        <span className="body-l">{it.title}</span>
                        <span className="li-sub">
                          {it.context} · {it.level} · <Icon name="groups" size={16} /> {it.speakers.length}
                        </span>
                      </span>
                      <span className={`badge ${!r ? "" : r.best === 3 ? "good" : r.best === 2 ? "mid" : "bad"}`}>
                        {r ? `${r.best}/3` : "New"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
