import { TENSE_IDS, TENSES, type AnyTense, type TenseId } from "../data/tenses";
import type { Recording } from "./recorder";
import type { VerbCheck } from "./storage";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const TENSE_ENUM: AnyTense[] = [...TENSE_IDS, "modal_other", "imperative", "other"];

export interface Analysis {
  transcript: string;
  understood: boolean;
  verbs: VerbCheck[];
  corrected: string;
  natural: string;
  feedback: string;
  score: number;
}

const SYSTEM = `You are an English speaking coach for a Spanish-speaking project manager at an intermediate (B1–B2) level.
Your only job is to evaluate VERB TENSES and verb forms in what they say.

Rules:
1. If you receive audio, transcribe it VERBATIM into "transcript". Keep every grammar mistake exactly as spoken (e.g. "I work here since January", "yesterday I have sent"). Never fix the transcript. Drop filler sounds like "uh"/"um". If the audio is empty or unintelligible, set understood=false.
2. List every conjugated verb phrase in "verbs" (in order). "phrase" must be copied exactly from the transcript so it can be highlighted.
   - "used": the tense the speaker actually produced.
   - "expected": the tense that fits the situation best. If what they said is also natural and correct, expected = used.
   - "ok": false for wrong tense or wrong verb form (missing 3rd-person -s, wrong irregular past/participle, wrong auxiliary, "will" after "if", continuous with stative verbs like know/need).
   - "correction": the corrected verb phrase (same as phrase if ok).
   - "why": one short sentence in Spanish explaining the rule, only if not ok (empty string otherwise).
3. "corrected": the full sentence(s) with ONLY tense/verb-form errors fixed, keeping their words.
4. "natural": how a native project manager would say it in a meeting (concise, professional).
5. "feedback": 1–2 sentences in Spanish, encouraging and specific. Mention the key tense rule if there were errors.
6. "score": 0–100 for tense accuracy only. Ignore pronunciation, vocabulary and non-verb grammar unless it changes the meaning. If they did not answer the task at all, score low and say so in feedback.`;

const SCHEMA = {
  type: "object",
  properties: {
    transcript: { type: "string" },
    understood: { type: "boolean" },
    verbs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          phrase: { type: "string" },
          used: { type: "string", enum: TENSE_ENUM },
          expected: { type: "string", enum: TENSE_ENUM },
          ok: { type: "boolean" },
          correction: { type: "string" },
          why: { type: "string" },
        },
        required: ["phrase", "used", "expected", "ok", "correction", "why"],
      },
    },
    corrected: { type: "string" },
    natural: { type: "string" },
    feedback: { type: "string" },
    score: { type: "integer" },
  },
  required: ["transcript", "understood", "verbs", "corrected", "natural", "feedback", "score"],
};

export class GeminiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export interface Part {
  text?: string;
  thought?: boolean;
  inlineData?: { mimeType: string; data: string };
}

async function call(apiKey: string, model: string, body: unknown): Promise<string> {
  if (!apiKey) throw new GeminiError("Falta tu API key de Gemini. Agrégala en Ajustes.");
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GeminiError("Sin conexión con Gemini. Revisa tu internet.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg: string = json?.error?.message ?? res.statusText;
    if (res.status === 429)
      throw new GeminiError("Llegaste al límite gratuito de Gemini (por minuto o por día). Espera un momento o cambia de modelo en Ajustes.", 429);
    if (res.status === 400 && /api key/i.test(msg)) throw new GeminiError("La API key no es válida. Revísala en Ajustes.", 400);
    if (res.status === 403) throw new GeminiError("La API key no tiene permiso para este modelo.", 403);
    if (res.status === 404) throw new GeminiError(`El modelo «${model}» no existe o no está disponible para tu cuenta.`, 404);
    throw new GeminiError(`Gemini respondió ${res.status}: ${msg}`, res.status);
  }
  const parts: Part[] = json?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought && p.text).map((p) => p.text).join("");
  if (!text) {
    const reason = json?.candidates?.[0]?.finishReason ?? json?.promptFeedback?.blockReason ?? "respuesta vacía";
    throw new GeminiError(`Gemini no devolvió resultado (${reason}). Intenta de nuevo.`);
  }
  return text;
}

/** One structured-output request: system prompt + user parts, parsed against a JSON schema. */
export async function generateJson<T>(
  apiKey: string,
  model: string,
  system: string,
  parts: Part[],
  schema: object,
  temperature = 0.2
): Promise<T> {
  const raw = await call(apiKey, model, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature },
  });
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new GeminiError("La respuesta de Gemini no se pudo leer. Intenta de nuevo.");
  }
}

/** User content for an answer that was either spoken (audio) or typed. */
export function answerParts(label: string, audio?: Recording, text?: string): Part[] {
  return audio
    ? [{ text: `${label} (spoken):` }, { inlineData: { mimeType: audio.mimeType, data: audio.base64 } }]
    : [{ text: `${label} (typed, use it as the transcript): "${text ?? ""}"` }];
}

export interface AnalyzeInput {
  apiKey: string;
  model: string;
  situation: string;
  targets: TenseId[];
  audio?: Recording;
  text?: string;
  /** When repeating, the sentence they are supposed to reproduce. */
  repeatOf?: string;
}

export async function analyze(input: AnalyzeInput): Promise<Analysis> {
  const task = input.repeatOf
    ? `The speaker is REPEATING this corrected sentence to practice it: "${input.repeatOf}". Evaluate whether their verb tenses now match it.`
    : `Situation given to the speaker (in Spanish): "${input.situation}"
Tenses this exercise is designed to practice: ${input.targets.map((t) => TENSES[t].name).join(", ")} (other correct choices are acceptable).`;

  const parts: Part[] = [{ text: task }, ...answerParts("Their answer", input.audio, input.text)];

  const data = await generateJson<Analysis>(input.apiKey, input.model, SYSTEM, parts, SCHEMA);
  return {
    transcript: data.transcript ?? "",
    understood: data.understood !== false,
    verbs: Array.isArray(data.verbs) ? data.verbs : [],
    corrected: data.corrected ?? "",
    natural: data.natural ?? "",
    feedback: data.feedback ?? "",
    score: Math.max(0, Math.min(100, Math.round(Number(data.score) || 0))),
  };
}

/** Cheap request to validate the key and model from Settings. */
export async function ping(apiKey: string, model: string): Promise<void> {
  await call(apiKey, model, {
    contents: [{ role: "user", parts: [{ text: "Reply with the single word: ok" }] }],
  });
}
