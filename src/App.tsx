import { useState } from "react";
import type { ListeningItem } from "./data/listening";
import type { GroupId } from "./data/scenarios";
import { Icon, type IconName } from "./components/Icon";
import { loadSettings, saveSettings, type Settings as S } from "./lib/storage";
import { nextListening } from "./lib/listening";
import type { VocabQueueItem } from "./lib/vocab";
import { Home } from "./screens/Home";
import { ListeningHome } from "./screens/ListeningHome";
import { ListeningSession } from "./screens/ListeningSession";
import { Practice } from "./screens/Practice";
import { Progress } from "./screens/Progress";
import { Settings } from "./screens/Settings";
import { VocabHome } from "./screens/VocabHome";
import { VocabSession } from "./screens/VocabSession";

type Tab = "home" | "vocab" | "listening" | "progress" | "settings";
type Route =
  | { name: Tab }
  | { name: "practice"; group: GroupId | "mix" }
  | { name: "vocabSession"; queue: VocabQueueItem[] }
  | { name: "listeningSession"; item: ListeningItem };

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Practice", icon: "record_voice_over" },
  { id: "vocab", label: "Vocabulary", icon: "menu_book" },
  { id: "listening", label: "Listening", icon: "headphones" },
  { id: "progress", label: "Progress", icon: "bar_chart" },
  { id: "settings", label: "Settings", icon: "settings" },
];

/** Bottom navigation bar on the cover screen; becomes a navigation rail when unfolded (CSS). */
function NavBar({ current, onNav }: { current: Tab; onNav: (t: Tab) => void }) {
  return (
    <nav className="navbar" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-item ${current === t.id ? "active" : ""}`}
          onClick={() => onNav(t.id)}
          aria-current={current === t.id ? "page" : undefined}
        >
          <span className="nav-pill"><Icon name={t.icon} filled={current === t.id} /></span>
          <span className="label-m">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [settings, setSettings] = useState<S>(loadSettings);
  const [route, setRoute] = useState<Route>(() => (loadSettings().apiKey ? { name: "home" } : { name: "settings" }));
  const go = (name: Tab) => setRoute({ name });

  // Full-screen flows hide the navigation, like task screens in Google apps.
  if (route.name === "practice")
    return <div className="app"><Practice group={route.group} settings={settings} onExit={() => go("home")} /></div>;
  if (route.name === "vocabSession")
    return <div className="app"><VocabSession queue={route.queue} settings={settings} onExit={() => go("vocab")} /></div>;
  if (route.name === "listeningSession") {
    const current = route.item;
    return (
      <div className="app">
        <ListeningSession
          key={current.id}
          item={current}
          onExit={() => go("listening")}
          onNext={() => {
            const next = nextListening(current.id);
            setRoute(next ? { name: "listeningSession", item: next } : { name: "listening" });
          }}
        />
      </div>
    );
  }

  const openListening = (item: ListeningItem) => setRoute({ name: "listeningSession", item });
  let screen;
  switch (route.name) {
    case "listening":
      screen = <ListeningHome settings={settings} onOpen={openListening} />;
      break;
    case "vocab":
      screen = <VocabHome settings={settings} onStart={(queue) => setRoute({ name: "vocabSession", queue })} />;
      break;
    case "progress":
      screen = <Progress settings={settings} />;
      break;
    case "settings":
      screen = (
        <Settings
          settings={settings}
          onSave={(s) => {
            saveSettings(s);
            setSettings(s);
          }}
          onDone={() => go("home")}
        />
      );
      break;
    default:
      screen = <Home settings={settings} onStart={(group) => setRoute({ name: "practice", group })} onNav={go} />;
  }

  return (
    <div className="app has-nav">
      {screen}
      <NavBar current={route.name} onNav={go} />
    </div>
  );
}
