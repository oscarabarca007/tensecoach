import { WORDS, WORD_CATS, type Word, type WordCat } from "../data/words";
import { answerParts, generateJson } from "./gemini";
import type { Recording } from "./recorder";
import { readJson, todayKey, writeJson } from "./storage";

// ---------- Spaced repetition (Leitner boxes) ----------

/** Days until the next review for each box. Box 0 = learning, box 5 = known. */
const INTERVALS = [0, 1, 3, 7, 14, 30];
export const KNOWN_BOX = 4;

export interface WordProgress {
  box: number;
  due: string; // YYYY-MM-DD
  introduced: string; // YYYY-MM-DD
  reviews: number;
  lastScore: number;
}

const K = { progress: "tc.vocab.progress", custom: "tc.vocab.custom" };

export const loadWordProgress = () => readJson<Record<string, WordProgress>>(K.progress, {});
export const loadCustomWords = () => readJson<Word[]>(K.custom, []);
export const allWords = (): Word[] => [...WORDS, ...loadCustomWords()];

export function addCustomWords(words: Word[]) {
  const existing = new Set(allWords().map((w) => w.word.toLowerCase()));
  const fresh = words.filter((w) => !existing.has(w.word.toLowerCase()));
  writeJson(K.custom, [...loadCustomWords(), ...fresh]);
  return fresh.length;
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

/** Records the result of using a word in a sentence; passing moves it up a box, failing resets it. */
export function recordReview(wordId: string, passed: boolean, score: number) {
  const all = loadWordProgress();
  const p = all[wordId] ?? { box: 0, due: todayKey(), introduced: todayKey(), reviews: 0, lastScore: 0 };
  const box = passed ? Math.min(INTERVALS.length - 1, p.box + 1) : 0;
  all[wordId] = { ...p, box, due: addDays(passed ? INTERVALS[box] : 1), reviews: p.reviews + 1, lastScore: score };
  writeJson(K.progress, all);
}

export type WordStatus = "new" | "learning" | "known";
export function statusOf(p?: WordProgress): WordStatus {
  if (!p) return "new";
  return p.box >= KNOWN_BOX ? "known" : "learning";
}

export interface VocabQueueItem {
  word: Word;
  kind: "new" | "review";
}

/** Today's session: due reviews first (oldest first), then new words up to the daily allowance. */
export function buildQueue(newPerDay: number, maxReviews = 10): VocabQueueItem[] {
  const prog = loadWordProgress();
  const today = todayKey();
  const words = allWords();
  const reviews = words
    .filter((w) => prog[w.id] && prog[w.id].due <= today)
    .sort((a, b) => prog[a.id].due.localeCompare(prog[b.id].due))
    .slice(0, maxReviews)
    .map((word) => ({ word, kind: "review" as const }));
  const introducedToday = Object.values(prog).filter((p) => p.introduced === today).length;
  const fresh = words
    .filter((w) => !prog[w.id])
    .slice(0, Math.max(0, newPerDay - introducedToday))
    .map((word) => ({ word, kind: "new" as const }));
  return [...reviews, ...fresh];
}

// ---------- Gemini ----------

export interface PronunciationResult {
  heard: string;
  ok: boolean;
  score: number;
  stressOk: boolean;
  tips: string;
}

const PRON_SYSTEM = `You are a strict but friendly English pronunciation coach for a native Spanish speaker (Latin America) at B1–B2 level.
You will hear them say ONE target word or short phrase. Judge it as a listener in an international business meeting would.
Check especially the typical Spanish-speaker problems: adding "e" before s+consonant (e-stakeholder), short vs long vowels (ship/sheep, live/leave),
"th" sounds, final consonants dropped or added, silent letters (align, sign, wrap), "-ed" endings, and WORD STRESS.
- "heard": what you actually heard, written as the English word(s) it sounded like (or a phonetic spelling if unclear).
- "ok": true if a native listener would understand it without effort.
- "stressOk": true if the stressed syllable was correct.
- "score": 0–100.
- "tips": 1–2 short, concrete sentences in Spanish telling them what to change (use Spanish spelling to describe sounds). If perfect, praise briefly.`;

const PRON_SCHEMA = {
  type: "object",
  properties: {
    heard: { type: "string" },
    ok: { type: "boolean" },
    stressOk: { type: "boolean" },
    score: { type: "integer" },
    tips: { type: "string" },
  },
  required: ["heard", "ok", "stressOk", "score", "tips"],
};

export async function checkPronunciation(apiKey: string, model: string, word: Word, audio: Recording): Promise<PronunciationResult> {
  const r = await generateJson<PronunciationResult>(apiKey, model, PRON_SYSTEM, [
    { text: `Target: "${word.word}" (${word.pos}). Expected stress (CAPS = stressed): ${word.say}.` },
    ...answerParts("Their attempt", audio),
  ], PRON_SCHEMA);
  return { ...r, score: clamp(r.score) };
}

export interface GrammarNote {
  wrong: string;
  right: string;
  why: string;
}

export interface UsageResult {
  transcript: string;
  understood: boolean;
  usedWord: boolean;
  meaningOk: boolean;
  pronunciationOk: boolean;
  pronunciationTip: string;
  notes: GrammarNote[];
  corrected: string;
  natural: string;
  feedback: string;
  score: number;
}

const USAGE_SYSTEM = `You are an English speaking coach for a Spanish-speaking project manager (B1–B2).
They must say a sentence using a TARGET word in a work context.
1. If audio is given, transcribe it VERBATIM into "transcript", keeping their grammar mistakes. If unintelligible or empty, understood=false.
2. "usedWord": they used the target word or a valid form of it (ships/shipped, stakeholders…).
3. "meaningOk": the word is used with the right meaning and a natural collocation (e.g. "actually" ≠ "currently").
4. "pronunciationOk"/"pronunciationTip": judge ONLY how they pronounced the target word; tip in Spanish, empty if fine or if typed.
5. "notes": grammar errors that matter, especially VERB TENSES and verb forms (max 3). "why" in Spanish, one sentence.
6. "corrected": their sentence with only the errors fixed. "natural": how a native PM would say the same idea.
7. "feedback": 1–2 encouraging sentences in Spanish. "score": 0–100 (word use and meaning weigh most, then grammar).`;

const USAGE_SCHEMA = {
  type: "object",
  properties: {
    transcript: { type: "string" },
    understood: { type: "boolean" },
    usedWord: { type: "boolean" },
    meaningOk: { type: "boolean" },
    pronunciationOk: { type: "boolean" },
    pronunciationTip: { type: "string" },
    notes: {
      type: "array",
      items: {
        type: "object",
        properties: { wrong: { type: "string" }, right: { type: "string" }, why: { type: "string" } },
        required: ["wrong", "right", "why"],
      },
    },
    corrected: { type: "string" },
    natural: { type: "string" },
    feedback: { type: "string" },
    score: { type: "integer" },
  },
  required: ["transcript", "understood", "usedWord", "meaningOk", "pronunciationOk", "pronunciationTip", "notes", "corrected", "natural", "feedback", "score"],
};

export async function checkUsage(
  apiKey: string,
  model: string,
  word: Word,
  answer: { audio?: Recording; text?: string },
  recall: boolean,
  tenseChallenge: string
): Promise<UsageResult> {
  const task = `Target word: "${word.word}" (${word.pos}) = "${word.es}" in Spanish.
${recall ? "This is a memory review: they were shown only the Spanish meaning and had to recall the English word." : `Example they saw: "${word.example}". They must NOT just repeat the example.`}
They were also challenged to use the tense: ${tenseChallenge}. If they didn't use it, or used it wrongly, add a note (do not lower the score much for this).`;
  const r = await generateJson<UsageResult>(apiKey, model, USAGE_SYSTEM, [{ text: task }, ...answerParts("Their sentence", answer.audio, answer.text)], USAGE_SCHEMA);
  return { ...r, notes: Array.isArray(r.notes) ? r.notes : [], understood: r.understood !== false, score: clamp(r.score) };
}

const GEN_SYSTEM = `You create vocabulary for a Spanish-speaking project manager (B1–B2) who wants to sound natural in English meetings.
Return useful, high-frequency workplace words, phrasal verbs or collocations. Avoid rare jargon.
- "say": approximate pronunciation for Spanish speakers using Spanish spelling, syllables separated by "-", the stressed syllable in CAPS (e.g. "DED-lain", "a-LAIN").
- "es": short meaning in Spanish. "example": one natural sentence a PM would say in a meeting.
- "tip": the most common mistake a Spanish speaker makes with it (false friend, sound, preposition), in Spanish; empty string if none.
- "cat": one of: ${WORD_CATS.join(", ")}.`;

const GEN_SCHEMA = {
  type: "object",
  properties: {
    words: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          pos: { type: "string" },
          es: { type: "string" },
          say: { type: "string" },
          example: { type: "string" },
          cat: { type: "string", enum: WORD_CATS },
          tip: { type: "string" },
        },
        required: ["word", "pos", "es", "say", "example", "cat", "tip"],
      },
    },
  },
  required: ["words"],
};

export async function generateWords(apiKey: string, model: string, count: number, cat?: WordCat): Promise<Word[]> {
  const known = allWords().map((w) => w.word).join(", ");
  const r = await generateJson<{ words: Omit<Word, "id">[] }>(apiKey, model, GEN_SYSTEM, [
    {
      text: `Give me ${count} NEW items${cat ? ` for the category "${cat}"` : " across different categories"}.
Do not repeat any of these: ${known}.`,
    },
  ], GEN_SCHEMA, 0.8);
  return (r.words ?? [])
    .filter((w) => w.word?.trim())
    .map((w) => ({
      ...w,
      id: "c-" + w.word.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""),
      tip: w.tip || undefined,
      custom: true,
    }));
}

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
