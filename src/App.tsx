import { useState } from "react";
import type { GroupId } from "./data/scenarios";
import { loadSettings, saveSettings, type Settings as S } from "./lib/storage";
import type { VocabQueueItem } from "./lib/vocab";
import { Home } from "./screens/Home";
import { Practice } from "./screens/Practice";
import { Progress } from "./screens/Progress";
import { Settings } from "./screens/Settings";
import { VocabHome } from "./screens/VocabHome";
import { VocabSession } from "./screens/VocabSession";

type Route =
  | { name: "home" | "progress" | "settings" | "vocab" }
  | { name: "practice"; group: GroupId | "mix" }
  | { name: "vocabSession"; queue: VocabQueueItem[] };

export default function App() {
  const [settings, setSettings] = useState<S>(loadSettings);
  const [route, setRoute] = useState<Route>(() => (loadSettings().apiKey ? { name: "home" } : { name: "settings" }));
  const home = () => setRoute({ name: "home" });

  switch (route.name) {
    case "practice":
      return <Practice group={route.group} settings={settings} onExit={home} />;
    case "vocab":
      return <VocabHome settings={settings} onBack={home} onStart={(queue) => setRoute({ name: "vocabSession", queue })} />;
    case "vocabSession":
      return <VocabSession queue={route.queue} settings={settings} onExit={() => setRoute({ name: "vocab" })} />;
    case "progress":
      return <Progress settings={settings} onBack={home} />;
    case "settings":
      return (
        <Settings
          settings={settings}
          onSave={(s) => {
            saveSettings(s);
            setSettings(s);
          }}
          onBack={home}
        />
      );
    default:
      return <Home settings={settings} onStart={(group) => setRoute({ name: "practice", group })} onNav={(name) => setRoute({ name })} />;
  }
}
