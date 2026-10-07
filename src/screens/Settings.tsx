import { useState } from "react";
import { Icon } from "../components/Icon";
import { GeminiError, ping } from "../lib/gemini";
import { MODELS, resetProgress, type Settings as S } from "../lib/storage";
import { speak } from "../lib/tts";

export function Settings({ settings, onSave, onDone }: { settings: S; onSave: (s: S) => void; onDone: () => void }) {
  const [draft, setDraft] = useState<S>(settings);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ tone: "good" | "error" | "wait"; msg: string } | null>(null);
  const custom = !MODELS.some((m) => m.id === draft.model);

  const set = <K extends keyof S>(k: K, v: S[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function test() {
    setStatus({ tone: "wait", msg: "Probando conexión…" });
    try {
      await ping(draft.apiKey.trim(), draft.model.trim());
      setStatus({ tone: "good", msg: "Conexión correcta" });
    } catch (e) {
      setStatus({ tone: "error", msg: e instanceof GeminiError ? e.message : String(e) });
    }
  }

  function save() {
    onSave({ ...draft, apiKey: draft.apiKey.trim(), model: draft.model.trim() });
    onDone();
  }

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="title-l">Settings</h1>
      </header>

      <div className="grid-2">
        <section className="card">
          <h2 className="title-m">Gemini</h2>

          <div className="field">
            <span className="label-l">API key</span>
            <label className="textfield">
              <Icon name="key" className="on-variant" />
              <input
                type={show ? "text" : "password"}
                value={draft.apiKey}
                onChange={(e) => set("apiKey", e.target.value)}
                placeholder="Pega tu key de Google AI Studio"
                autoComplete="off"
                spellCheck={false}
                aria-label="API key de Gemini"
                style={{ paddingLeft: 8 }}
              />
              <button className="icon-btn" onClick={() => setShow((v) => !v)} aria-label={show ? "Ocultar key" : "Mostrar key"}>
                <Icon name={show ? "visibility_off" : "visibility"} />
              </button>
            </label>
            <span className="supporting">Créala gratis en aistudio.google.com → «Get API key». Se guarda solo en este teléfono.</span>
          </div>

          <div className="field">
            <span className="label-l">Modelo</span>
            <label className="textfield">
              <select
                value={custom ? "custom" : draft.model}
                onChange={(e) => set("model", e.target.value === "custom" ? "" : e.target.value)}
                aria-label="Modelo"
              >
                {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                <option value="custom">Otro (escribir ID)…</option>
              </select>
              <Icon name="expand_more" className="on-variant" />
              <span style={{ width: 8 }} />
            </label>
            {custom ? (
              <label className="textfield">
                <input value={draft.model} onChange={(e) => set("model", e.target.value)} placeholder="p. ej. gemini-3.5-flash" aria-label="ID del modelo" />
              </label>
            ) : (
              <span className="supporting">{MODELS.find((m) => m.id === draft.model)?.note}</span>
            )}
          </div>

          <div className="row">
            <button className="btn btn-outlined" onClick={test} disabled={!draft.apiKey.trim() || !draft.model.trim()}>
              <Icon name="check_circle" /> Probar conexión
            </button>
          </div>
          {status && (
            <div className={`banner ${status.tone === "wait" ? "" : status.tone}`} style={{ padding: "10px 14px" }} role="status">
              {status.tone === "wait" ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 3 }} /> : <Icon name={status.tone === "good" ? "check_circle" : "error"} />}
              <span className="body-m">{status.msg}</span>
            </div>
          )}

          <div className="banner warn">
            <Icon name="info" />
            <span className="body-m">
              En el tier gratuito, Google puede usar lo que envías para mejorar sus productos. Practica con situaciones genéricas y evita nombres de clientes o datos confidenciales.
            </span>
          </div>
        </section>

        <section className="card">
          <h2 className="title-m">Práctica</h2>

          <div className="slider">
            <div className="row between"><span className="label-l">Meta diaria</span><span className="body-m primary-text">{draft.dailyGoalMin} min</span></div>
            <input type="range" min={10} max={45} step={5} value={draft.dailyGoalMin} onChange={(e) => set("dailyGoalMin", Number(e.target.value))} aria-label="Meta diaria en minutos" />
          </div>

          <div className="slider">
            <div className="row between"><span className="label-l">Palabras nuevas por día</span><span className="body-m primary-text">{draft.newWordsPerDay}</span></div>
            <input type="range" min={3} max={10} step={1} value={draft.newWordsPerDay} onChange={(e) => set("newWordsPerDay", Number(e.target.value))} aria-label="Palabras nuevas por día" />
          </div>

          <div className="slider">
            <div className="row between"><span className="label-l">Velocidad de la voz</span><span className="body-m primary-text">{draft.voiceRate.toFixed(2)}×</span></div>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input type="range" min={0.6} max={1.2} step={0.05} value={draft.voiceRate} onChange={(e) => set("voiceRate", Number(e.target.value))} aria-label="Velocidad de la voz" />
              <button className="icon-btn tonal" onClick={() => speak("We have completed three of the five deliverables so far.", draft.voiceRate)} aria-label="Probar voz">
                <Icon name="volume_up" />
              </button>
            </div>
          </div>

          <button className="btn btn-filled btn-lg btn-block" onClick={save}>
            <Icon name="check" /> Guardar
          </button>
        </section>

        <section className="card outlined span-2">
          <div className="row between">
            <div className="stack" style={{ gap: 2 }}>
              <h2 className="title-m">Borrar progreso</h2>
              <p className="body-m on-variant">Elimina tu historial, estadísticas, cuaderno de errores y el avance del vocabulario.</p>
            </div>
            <button
              className="btn btn-text btn-error"
              onClick={() => {
                if (confirm("¿Borrar todo tu progreso y cuaderno de errores? No se puede deshacer.")) resetProgress();
              }}
            >
              <Icon name="delete" /> Borrar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
