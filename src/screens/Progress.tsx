import { TENSES, tenseLabel } from "../data/tenses";
import { Correction } from "../components/Feedback";
import { Icon } from "../components/Icon";
import { accuracy, lastDays, tenseStats } from "../lib/stats";
import { loadAttempts, loadDaily, loadMistakes, type Settings } from "../lib/storage";
import { speak } from "../lib/tts";

export function Progress({ settings }: { settings: Settings }) {
  const attempts = loadAttempts();
  const stats = tenseStats(attempts).filter((s) => s.total > 0).sort((a, b) => (accuracy(a) ?? 0) - (accuracy(b) ?? 0));
  const mistakes = loadMistakes().slice(-20).reverse();
  const days = lastDays(loadDaily());
  const maxMin = Math.max(settings.dailyGoalMin, ...days.map((d) => d.min));
  const exercises = attempts.filter((a) => !a.retry).length;

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="title-l">Progress</h1>
      </header>

      <div className="grid-2">
        <section className="card">
          <div className="row between">
            <h2 className="title-m">Últimos 7 días</h2>
            <span className="badge info"><Icon name="timer" /> Meta {settings.dailyGoalMin} min</span>
          </div>
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
          <p className="body-m on-variant">{exercises} {exercises === 1 ? "ejercicio" : "ejercicios"} en total</p>
        </section>

        <section className="card">
          <h2 className="title-m">Precisión por tiempo verbal</h2>
          {stats.length === 0 ? (
            <div className="placeholder" style={{ border: 0, padding: 16 }}>
              <Icon name="bar_chart" />
              <span className="body-m">Aún no hay datos. ¡Haz tu primera práctica!</span>
            </div>
          ) : (
            <ul className="stack" style={{ gap: 14 }}>
              {stats.map((s) => {
                const acc = accuracy(s) ?? 0;
                const tone = acc >= 85 ? "good" : acc >= 60 ? "mid" : "bad";
                return (
                  <li key={s.id} className="stack" style={{ gap: 6 }}>
                    <div className="row between">
                      <span className="body-m">{TENSES[s.id].name}</span>
                      <span className="label-m on-variant">{acc}% · {s.total} {s.total === 1 ? "verbo" : "verbos"}</span>
                    </div>
                    <div className="linear thick"><span className={tone} style={{ width: `${acc}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card span-2">
          <h2 className="title-m">Cuaderno de errores</h2>
          {mistakes.length === 0 ? (
            <p className="body-m on-variant">Aquí se guardan tus errores para repasarlos.</p>
          ) : (
            <ul className="corrections">
              {mistakes.map((m, i) => (
                <Correction key={i} wrong={m.said} right={m.corrected} why={m.why}>
                  <div className="row between">
                    <span className="badge good">{tenseLabel(m.expected)}</span>
                    <button className="icon-btn primary" style={{ margin: -8 }} onClick={() => speak(m.corrected, settings.voiceRate)} aria-label="Escuchar">
                      <Icon name="volume_up" />
                    </button>
                  </div>
                </Correction>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
