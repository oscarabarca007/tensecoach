import { useState } from "react";
import { GeminiError, ping } from "../lib/gemini";
import { MODELS, resetProgress, type Settings as S } from "../lib/storage";
import { speak } from "../lib/tts";

export function Settings({ settings, onSave, onBack }: { settings: S; onSave: (s: S) => void; onBack: () => void }) {
  const [draft, setDraft] = useState<S>(settings);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "bad" | "wait"; msg: string } | null>(null);
  const custom = !MODELS.some((m) => m.id === draft.model);

  const set = <K extends keyof S>(k: K, v: S[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function test() {
    setStatus({ tone: "wait", msg: "Probando conexión…" });
    try {
      await ping(draft.apiKey.trim(), draft.model.trim());
      setStatus({ tone: "ok", msg: "✓ Conexión correcta" });
    } catch (e) {
      setStatus({ tone: "bad", msg: e instanceof GeminiError ? e.message : String(e) });
    }
  }

  function save() {
    onSave({ ...draft, apiKey: draft.apiKey.trim(), model: draft.model.trim() });
    onBack();
  }

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>← Inicio</button>
        <h1 className="title">Ajustes</h1>
        <span />
      </header>

      <div className="card form">
        <label>
          API key de Gemini
          <div className="row">
            <input
              type={show ? "text" : "password"}
              value={draft.apiKey}
              onChange={(e) => set("apiKey", e.target.value)}
              placeholder="Pega aquí tu key de Google AI Studio"
              autoComplete="off"
              spellCheck={false}
            />
            <button className="ghost" onClick={() => setShow((v) => !v)}>{show ? "Ocultar" : "Ver"}</button>
          </div>
          <span className="muted small">
            Créala gratis en aistudio.google.com → «Get API key». Se guarda solo en este teléfono.
          </span>
        </label>

        <label>
          Modelo
          <select value={custom ? "custom" : draft.model} onChange={(e) => set("model", e.target.value === "custom" ? "" : e.target.value)}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            <option value="custom">Otro (escribir ID)…</option>
          </select>
          {custom ? (
            <input value={draft.model} onChange={(e) => set("model", e.target.value)} placeholder="p. ej. gemini-3.5-flash" />
          ) : (
            <span className="muted small">{MODELS.find((m) => m.id === draft.model)?.note}</span>
          )}
        </label>

        <div className="row">
          <button className="ghost" onClick={test} disabled={!draft.apiKey.trim() || !draft.model.trim()}>Probar conexión</button>
          {status && <span className={`status status-${status.tone}`}>{status.msg}</span>}
        </div>

        <label>
          Meta diaria: {draft.dailyGoalMin} min
          <input type="range" min={10} max={45} step={5} value={draft.dailyGoalMin} onChange={(e) => set("dailyGoalMin", Number(e.target.value))} />
        </label>

        <label>
          Palabras nuevas por día: {draft.newWordsPerDay}
          <input type="range" min={3} max={10} step={1} value={draft.newWordsPerDay} onChange={(e) => set("newWordsPerDay", Number(e.target.value))} />
        </label>

        <label>
          Velocidad de la voz: {draft.voiceRate.toFixed(2)}×
          <div className="row">
            <input type="range" min={0.6} max={1.2} step={0.05} value={draft.voiceRate} onChange={(e) => set("voiceRate", Number(e.target.value))} />
            <button className="icon-btn" onClick={() => speak("We have completed three of the five deliverables so far.", draft.voiceRate)} aria-label="Probar voz">🔊</button>
          </div>
        </label>

        <p className="note">
          ⚠️ En el tier gratuito, Google puede usar lo que envías para mejorar sus productos. Practica con situaciones
          genéricas y evita decir nombres de clientes o datos confidenciales.
        </p>

        <button className="primary wide" onClick={save}>Guardar</button>
      </div>

      <div className="card form">
        <button
          className="danger"
          onClick={() => {
            if (confirm("¿Borrar todo tu progreso y cuaderno de errores? No se puede deshacer.")) resetProgress();
          }}
        >
          Borrar progreso
        </button>
      </div>
    </div>
  );
}
