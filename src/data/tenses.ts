export type TenseId =
  | "present_simple"
  | "present_continuous"
  | "past_simple"
  | "past_continuous"
  | "present_perfect"
  | "present_perfect_continuous"
  | "past_perfect"
  | "future_will"
  | "future_going_to"
  | "future_present_continuous"
  | "conditional_first"
  | "conditional_second";

/** Everything the model may label a verb with, including non-target buckets. */
export type AnyTense = TenseId | "modal_other" | "imperative" | "other";

/**
 * Timeline marks are drawn on a 0–100 axis where NOW sits at 60.
 * dot = single finished event, dots = repeated/habit, bar = state or duration,
 * wave = action in progress, x = interrupting event, arrow = link between points.
 */
export type Mark =
  | { k: "dot"; at: number; label?: string; hollow?: boolean }
  | { k: "dots"; from: number; to: number }
  | { k: "bar"; from: number; to: number; label?: string; dashed?: boolean }
  | { k: "wave"; from: number; to: number; label?: string }
  | { k: "x"; at: number; label?: string }
  | { k: "arrow"; from: number; to: number; label?: string; dashed?: boolean };

export interface Tense {
  id: TenseId;
  name: string;
  es: string;
  formula: string;
  key: string; // one-line rule in Spanish
  signals: string[];
  example: string;
  timeline: Mark[];
  hypothetical?: boolean;
}

export const NOW = 60;

export const TENSES: Record<TenseId, Tense> = {
  present_simple: {
    id: "present_simple",
    name: "Present simple",
    es: "Presente simple",
    formula: "I/you/we/they work · he/she/it works",
    key: "Hábitos, rutinas, hechos y horarios. Ojo con la -s en 3.ª persona.",
    signals: ["usually", "every week", "always", "normally"],
    example: "We hold a status meeting every Monday.",
    timeline: [{ k: "dots", from: 8, to: 96 }],
  },
  present_continuous: {
    id: "present_continuous",
    name: "Present continuous",
    es: "Presente continuo",
    formula: "am / is / are + verb-ing",
    key: "Algo en curso ahora o en este periodo (esta semana, este sprint).",
    signals: ["right now", "this week", "currently", "at the moment"],
    example: "The team is testing the new release this week.",
    timeline: [{ k: "wave", from: 48, to: 72, label: "en curso" }],
  },
  past_simple: {
    id: "past_simple",
    name: "Past simple",
    es: "Pasado simple",
    formula: "verb-ed / forma irregular (went, sent, made)",
    key: "Acción terminada en un momento concreto del pasado (ayer, el lunes, en 2024).",
    signals: ["yesterday", "last week", "on Monday", "two days ago", "in 2024"],
    example: "The client approved the scope last Monday.",
    timeline: [{ k: "dot", at: 30, label: "ayer" }],
  },
  past_continuous: {
    id: "past_continuous",
    name: "Past continuous",
    es: "Pasado continuo",
    formula: "was / were + verb-ing",
    key: "Acción en progreso en el pasado, muchas veces interrumpida por otra (past simple).",
    signals: ["while", "when", "at 3 pm yesterday"],
    example: "I was presenting the report when the server went down.",
    timeline: [
      { k: "wave", from: 14, to: 42, label: "was presenting" },
      { k: "x", at: 32, label: "went down" },
    ],
  },
  present_perfect: {
    id: "present_perfect",
    name: "Present perfect",
    es: "Presente perfecto",
    formula: "have / has + participio (done, sent, finished)",
    key: "Pasado conectado con el ahora: resultados, experiencia, periodos sin terminar. Sin fecha exacta.",
    signals: ["already", "yet", "just", "so far", "this week", "ever", "never", "since", "for"],
    example: "We have completed three of the five deliverables so far.",
    timeline: [
      { k: "dots", from: 20, to: 52 },
      { k: "arrow", from: 52, to: NOW, label: "resultado ahora" },
    ],
  },
  present_perfect_continuous: {
    id: "present_perfect_continuous",
    name: "Present perfect continuous",
    es: "Presente perfecto continuo",
    formula: "have / has been + verb-ing",
    key: "Actividad que empezó en el pasado y sigue ahora (o acaba de parar). Clave con since/for.",
    signals: ["since January", "for two weeks", "all week", "lately"],
    example: "I have been working on this project since January.",
    timeline: [{ k: "wave", from: 18, to: NOW, label: "since… / for…" }],
  },
  past_perfect: {
    id: "past_perfect",
    name: "Past perfect",
    es: "Pasado perfecto",
    formula: "had + participio",
    key: "El pasado del pasado: algo que ocurrió antes de otro momento pasado.",
    signals: ["already (by then)", "before", "by the time", "when I arrived"],
    example: "When I joined the meeting, the client had already approved the budget.",
    timeline: [
      { k: "dot", at: 16, label: "had approved" },
      { k: "arrow", from: 16, to: 38 },
      { k: "dot", at: 38, label: "I joined", hollow: true },
    ],
  },
  future_will: {
    id: "future_will",
    name: "Future (will)",
    es: "Futuro con will",
    formula: "will + verbo base",
    key: "Decisión en el momento, promesas, ofrecimientos y predicciones de opinión.",
    signals: ["I'll…", "I promise", "probably", "I think"],
    example: "Don't worry, I'll send you the report tomorrow morning.",
    timeline: [
      { k: "x", at: NOW, label: "decido ahora" },
      { k: "arrow", from: NOW, to: 86, dashed: true },
      { k: "dot", at: 86, label: "mañana" },
    ],
  },
  future_going_to: {
    id: "future_going_to",
    name: "Future (going to)",
    es: "Futuro con going to",
    formula: "am / is / are going to + verbo base",
    key: "Planes ya decididos antes de hablar y predicciones con evidencia actual.",
    signals: ["we've decided", "the plan is", "look at the data"],
    example: "We're going to split the backlog into two releases.",
    timeline: [
      { k: "bar", from: 40, to: NOW, label: "plan / evidencia" },
      { k: "arrow", from: NOW, to: 86 },
      { k: "dot", at: 86 },
    ],
  },
  future_present_continuous: {
    id: "future_present_continuous",
    name: "Present continuous (future)",
    es: "Presente continuo con valor de futuro",
    formula: "am / is / are + verb-ing + momento futuro",
    key: "Citas y acuerdos ya agendados (reuniones, llamadas, viajes).",
    signals: ["on Thursday", "tomorrow at 10", "next week"],
    example: "I'm meeting the vendor on Thursday at 10.",
    timeline: [{ k: "dot", at: 84, label: "agendado" }],
  },
  conditional_first: {
    id: "conditional_first",
    name: "First conditional",
    es: "Primer condicional",
    formula: "If + present simple, … will + verbo",
    key: "Condición real y posible en el futuro. Nunca «will» después de if.",
    signals: ["if", "unless", "as soon as", "when"],
    example: "If the vendor doesn't deliver on time, we will activate plan B.",
    timeline: [
      { k: "dot", at: 74, label: "if…", hollow: true },
      { k: "arrow", from: 74, to: 90 },
      { k: "dot", at: 90, label: "will…" },
    ],
  },
  conditional_second: {
    id: "conditional_second",
    name: "Second conditional",
    es: "Segundo condicional",
    formula: "If + past simple, … would + verbo",
    key: "Situación hipotética o poco probable (presente/futuro imaginario).",
    signals: ["if I were", "if we had", "would"],
    example: "If we had two more developers, we would finish in May.",
    hypothetical: true,
    timeline: [
      { k: "bar", from: 44, to: 92, dashed: true, label: "situación imaginaria" },
    ],
  },
};

export const TENSE_IDS = Object.keys(TENSES) as TenseId[];

export function tenseLabel(id: string): string {
  if (id in TENSES) return TENSES[id as TenseId].name;
  if (id === "modal_other") return "Modal";
  if (id === "imperative") return "Imperativo";
  return "Otro";
}
