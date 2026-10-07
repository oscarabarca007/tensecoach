import { GROUPS, type GroupId } from "../data/scenarios";
import { Icon, type IconName } from "../components/Icon";
import { groupAccuracy, tenseStats } from "../lib/stats";
import { loadAttempts, loadDaily, streakDays, todayKey, type Settings } from "../lib/storage";
import { buildQueue } from "../lib/vocab";

const GROUP_ICON: Record<GroupId, IconName> = {
  ps_pp: "task_alt",
  since_for: "timer",
  past_cont: "graphic_eq",
  pres: "refresh",
  future: "arrow_forward",
  past_perf: "arrow_back",
  cond: "tune",
};

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
  const ready = !!settings.apiKey;

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="title-l brand">
          <img className="brand-mark" src="./icon.svg" alt="" />
          TenseCoach
        </h1>
      </header>

      {!ready && (
        <button className="banner" onClick={() => onNav("settings")}>
          <Icon name="key" />
          <span className="banner-body">
            <span className="title-s">Add your Gemini API key</span>
            <span className="body-m">It's free. Tap here to open Settings.</span>
          </span>
        </button>
      )}

      <div className="grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card today" aria-label="Today">
            <div className="ring" style={{ ["--p" as string]: `${pct}` }}>
              <div>
                <span className="num">{todayMin}</span>
                <span className="label-m on-variant">of {goal} min</span>
              </div>
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <h2 className="title-l">Today</h2>
              <p className="body-m on-variant">
                {pct >= 100 ? "Goal reached — great job!" : `${Math.max(0, goal - todayMin)} min left to reach your goal`}
              </p>
              <span className="badge mid" style={{ alignSelf: "flex-start", marginTop: 4 }}>
                <Icon name="local_fire_department" filled /> {streak} {streak === 1 ? "day" : "days"} streak
              </span>
            </div>
            <button className="btn btn-filled btn-lg btn-block" onClick={() => onStart("mix")} disabled={!ready}>
              <Icon name="play_arrow" filled /> Start mixed practice
            </button>
          </section>

          <button className="card-btn" onClick={() => onNav("vocab")}>
            <span className="avatar"><Icon name="menu_book" /></span>
            <span className="stack grow" style={{ gap: 0 }}>
              <span className="title-m">Vocabulary</span>
              <span className="body-m on-variant">Learn, pronounce and use project-management words</span>
            </span>
            <span className={`badge ${vocabDue ? "info" : "good"}`}>{vocabDue ? `${vocabDue} today` : "All done"}</span>
          </button>
        </div>

        <section className="stack" style={{ gap: 8 }}>
          <h2 className="title-m section-title">Tricky tense pairs</h2>
          <div className="card tight">
            <ul className="list">
              {GROUPS.map((g) => {
                const acc = groupAccuracy(stats, g.tenses);
                return (
                  <li key={g.id}>
                    <button className="list-btn" onClick={() => onStart(g.id)} disabled={!ready}>
                      <span className="avatar"><Icon name={GROUP_ICON[g.id]} /></span>
                      <span className="li-text">
                        <span className="body-l">{g.title}</span>
                        <span className="li-sub">{g.subtitle}</span>
                      </span>
                      <span className={`badge ${acc === null ? "" : acc >= 85 ? "good" : acc >= 60 ? "mid" : "bad"}`}>
                        {acc === null ? "New" : `${acc}%`}
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
