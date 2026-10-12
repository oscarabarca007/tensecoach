import { LISTENING, type ListeningItem } from "../data/listening";
import { generateJson } from "./gemini";
import { readJson, writeJson } from "./storage";

const K = { custom: "tc.listening.custom", results: "tc.listening.results" };

export interface ListeningResult {
  best: number; // correct answers, 0–3
  last: number;
  attempts: number;
  ts: number;
}

export const loadCustomListening = () => readJson<ListeningItem[]>(K.custom, []);
/** Newest AI-generated situations first, then the built-in ones. */
export const allListening = (): ListeningItem[] => [...loadCustomListening().slice().reverse(), ...LISTENING];
export const loadListeningResults = () => readJson<Record<string, ListeningResult>>(K.results, {});

export function saveListeningResult(id: string, correct: number) {
  const all = loadListeningResults();
  const prev = all[id];
  all[id] = { best: Math.max(prev?.best ?? 0, correct), last: correct, attempts: (prev?.attempts ?? 0) + 1, ts: Date.now() };
  writeJson(K.results, all);
}

/** First situation not attempted yet, else the one practised longest ago. */
export function nextListening(exceptId?: string): ListeningItem | undefined {
  const items = allListening().filter((i) => i.id !== exceptId);
  const res = loadListeningResults();
  return items.find((i) => !res[i.id]) ?? [...items].sort((a, b) => (res[a.id]?.ts ?? 0) - (res[b.id]?.ts ?? 0))[0];
}

// ---------- AI-generated situations ----------

const TOPICS = [
  "a daily stand-up where someone is blocked by another team",
  "a sprint review where the client gives mixed feedback on a demo",
  "a call with a vendor who wants to increase the price of a contract",
  "a meeting to prioritize the product backlog with limited capacity",
  "a production incident happening right now and the team coordinating the fix",
  "a one-on-one where a manager discusses a developer's workload",
  "a kickoff meeting for a new cloud migration project",
  "a risk review before a big release",
  "a discussion about moving a deadline with a demanding stakeholder",
  "a hiring discussion about whether to hire a contractor or a full-time developer",
  "a security audit with findings that must be fixed before go-live",
  "a team deciding between two technical approaches (build vs buy)",
  "a steering committee status update on a delayed project",
  "a handover meeting before a project manager goes on vacation",
  "a UX review where usability tests revealed problems",
  "a data migration that found quality issues in the old system",
  "an estimation meeting where the team disagrees on story points",
  "a customer escalation about a bug in production",
];

const GEN_SYSTEM = `You write listening-practice material for a Spanish-speaking project manager (English level B1–B2) who works in tech.
Create a realistic spoken workplace conversation and 3 comprehension questions.
Conversation rules:
- 2 or 3 speakers with common international names and job roles from tech/PM.
- 8 to 11 lines, 140–200 words in total, natural spoken English with contractions, no stage directions or sound effects.
- Use a natural mix of tenses (past simple, present perfect, present continuous, going to, will, conditionals) and useful PM/tech vocabulary.
- "s" in each line is the 0-based index of the speaker in "speakers".
Question rules:
- Exactly 3 questions in English: one about the main idea, one about a specific detail (number, day, name…), one that needs a small inference or understanding a decision.
- Each has exactly 4 short options; only one is correct; distractors must be plausible and mention things from the conversation.
- "answer" is the 0-based index of the correct option. Vary its position across questions.
- "why": one sentence in Spanish quoting the exact words from the conversation that prove the answer.`;

const GEN_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    context: { type: "string" },
    level: { type: "string", enum: ["B1", "B2"] },
    speakers: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string" }, role: { type: "string" } }, required: ["name", "role"] },
    },
    lines: {
      type: "array",
      items: { type: "object", properties: { s: { type: "integer" }, text: { type: "string" } }, required: ["s", "text"] },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          q: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer: { type: "integer" },
          why: { type: "string" },
        },
        required: ["q", "options", "answer", "why"],
      },
    },
  },
  required: ["title", "context", "level", "speakers", "lines", "questions"],
};

function valid(x: Omit<ListeningItem, "id">): boolean {
  const n = x.speakers?.length ?? 0;
  return (
    n >= 2 &&
    (x.lines?.length ?? 0) >= 4 &&
    x.lines.every((l) => Number.isInteger(l.s) && l.s >= 0 && l.s < n && l.text?.trim()) &&
    x.questions?.length === 3 &&
    x.questions.every((q) => q.options?.length === 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)
  );
}

export async function generateListening(apiKey: string, model: string): Promise<ListeningItem> {
  const titles = allListening().map((i) => i.title).join("; ");
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  // One retry: small models occasionally break the shape (e.g. 5 options).
  for (let attempt = 0; attempt < 2; attempt++) {
    const x = await generateJson<Omit<ListeningItem, "id">>(apiKey, model, GEN_SYSTEM, [
      { text: `Topic: ${topic}.\nAvoid repeating these existing titles: ${titles}.` },
    ], GEN_SCHEMA, 0.9);
    if (valid(x)) {
      const item: ListeningItem = { ...x, id: `c-${Date.now().toString(36)}`, level: x.level === "B2" ? "B2" : "B1", custom: true };
      writeJson(K.custom, [...loadCustomListening(), item].slice(-50));
      return item;
    }
  }
  throw new Error("La IA devolvió una conversación incompleta. Intenta generar otra.");
}
