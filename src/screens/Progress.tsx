import { TENSES, tenseLabel } from "../data/tenses";
import { accuracy, lastDays, tenseStats } from "../lib/stats";
import { loadAttempts, loadDaily, loadMistakes, type Settings } from "../lib/storage";
import { speak } from "../lib/tts";

export function Progress({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const attempts = loadAttempts();
  const stats = tenseStats(attempts).filter((s) => s.total > 0).sort((a, b) => (accuracy(a) ?? 0) - (accuracy(b) ?? 0));
  const mistakes = loadMistakes().slice(-20).reverse();
  const days = lastDays(loadDaily());
  const maxMin = Math.max(settings.dailyGoalMin, ...days.map((d) => d.min));

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>← Inicio</button>
        <h1 className="title">Progreso</h1>
        <span />
      </header>

      <div className="home-grid">
        <section className="card">
          <h2>Últimos 7 días</h2>
          <div className="week" role="img" aria-label="Minutos practicados por día">
            {days.map((d) => (
              <div key={d.key} className="day">
                <div className="day-bar">
                  {d.min > 0 && (
                    <span
                      className={d.min >= settings.dailyGoalMin ? "met" : ""}
                      style={{ height: `${(d.min / maxMin) * 100}%` }}
                      title={`${d.min} min`}
                    />
                  )}
                </div>
                <small>{d.label}</small>
              </div>
            ))}
          </div>
          <p className="muted small">{attempts.filter((a) => !a.retry).length} ejercicios en total · meta {settings.dailyGoalMin} min/día</p>
        </section>

        <section className="card">
          <h2>Precisión por tiempo verbal</h2>
          {stats.length === 0 && <p className="muted">Aún no hay datos. ¡Haz tu primera práctica!</p>}
          <ul className="bars">
            {stats.map((s) => {
              const acc = accuracy(s) ?? 0;
              return (
                <li key={s.id}>
                  <div className="bar-label">
                    <span>{TENSES[s.id].name}</span>
                    <span className="muted small">{acc}% · {s.total} verbos</span>
                  </div>
                  <div className="meter"><span className={acc >= 85 ? "good" : acc >= 60 ? "mid" : "bad"} style={{ width: `${acc}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card span-2">
          <h2>Cuaderno de errores</h2>
          {mistakes.length === 0 && <p className="muted">Aquí se guardan tus errores para repasarlos.</p>}
          <ul className="errors">
            {mistakes.map((m, i) => (
              <li key={i}>
                <div className="err-line">
                  <s>{m.said}</s> <span aria-hidden>→</span> <strong>{m.corrected}</strong>
                  <button className="icon-btn" onClick={() => speak(m.corrected, settings.voiceRate)} aria-label="Escuchar">🔊</button>
                </div>
                <div className="err-meta"><span className="chip chip-ok">{tenseLabel(m.expected)}</span></div>
                {m.why && <p className="err-why">{m.why}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
