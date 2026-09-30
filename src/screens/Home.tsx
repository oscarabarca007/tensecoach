import { GROUPS, type GroupId } from "../data/scenarios";
import { groupAccuracy, tenseStats } from "../lib/stats";
import { loadAttempts, loadDaily, streakDays, todayKey, type Settings } from "../lib/storage";
import { buildQueue } from "../lib/vocab";

export function Home({
  settings,
  onStart,
  onNav,
}: {
  settings: Settings;
  onStart: (g: GroupId | "mix") => void;
  onNav: (s: "progress" | "settings" | "vocab") => void;
}) {
  const daily = loadDaily();
  const todayMin = Math.floor((daily[todayKey()] ?? 0) / 60);
  const goal = settings.dailyGoalMin;
  const pct = Math.min(100, Math.round((todayMin / goal) * 100));
  const streak = streakDays(daily, goal);
  const stats = tenseStats(loadAttempts());
  const vocabDue = buildQueue(settings.newWordsPerDay).length;

  return (
    <div className="screen">
      <header className="bar">
        <h1 className="brand">TenseCoach</h1>
        <nav className="row">
          <button className="icon-btn" onClick={() => onNav("progress")} aria-label="Progress">📊</button>
          <button className="icon-btn" onClick={() => onNav("settings")} aria-label="Settings">⚙️</button>
        </nav>
      </header>

      {!settings.apiKey && (
        <button className="banner" onClick={() => onNav("settings")}>
          To get started, add your free Gemini API key → Settings
        </button>
      )}

      <div className="home-grid">
        <div className="col">
        <section className="card today">
          <div className="ring" style={{ ["--p" as string]: `${pct}` }}>
            <span>{todayMin}<small>/{goal} min</small></span>
          </div>
          <div>
            <h2>Today</h2>
            <p className="muted">{pct >= 100 ? "Goal reached! 🎉" : `${Math.max(0, goal - todayMin)} min left to reach your goal`}</p>
            <p className="muted small">🔥 Streak: {streak} {streak === 1 ? "day" : "days"}</p>
          </div>
          <button className="primary wide" onClick={() => onStart("mix")} disabled={!settings.apiKey}>
            ▶ Mixed practice
          </button>
        </section>

        <button className="card group vocab-card" onClick={() => onNav("vocab")}>
          <div>
            <strong>📚 Vocabulary</strong>
            <span className="muted small">Learn, pronounce and use project-management words</span>
          </div>
          <span className={`acc ${vocabDue ? "mid" : ""}`}>{vocabDue ? `${vocabDue} today` : "all done"}</span>
        </button>
        </div>

        <section className="groups">
          <h2 className="section-title">Tricky tense pairs</h2>
          {GROUPS.map((g) => {
            const acc = groupAccuracy(stats, g.tenses);
            return (
              <button key={g.id} className="card group" onClick={() => onStart(g.id)} disabled={!settings.apiKey}>
                <div>
                  <strong>{g.title}</strong>
                  <span className="muted small">{g.subtitle}</span>
                </div>
                <span className={`acc ${acc === null ? "" : acc >= 85 ? "good" : acc >= 60 ? "mid" : "bad"}`}>
                  {acc === null ? "new" : `${acc}%`}
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}
