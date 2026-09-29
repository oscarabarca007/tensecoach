import type { TenseId } from "./tenses";

export type Context = "Daily" | "Status report" | "Riesgos" | "Retro" | "Stakeholders" | "Planning" | "Entrevista";

export interface Scenario {
  id: string;
  group: GroupId;
  context: Context;
  /** What to say, in Spanish, without naming the tense. */
  prompt: string;
  /** Optional sentence starter shown only as a hint. */
  starter?: string;
  targets: TenseId[];
}

export type GroupId = "ps_pp" | "since_for" | "past_cont" | "pres" | "future" | "past_perf" | "cond";

export interface Group {
  id: GroupId;
  title: string;
  subtitle: string;
  tenses: TenseId[];
}

export const GROUPS: Group[] = [
  {
    id: "ps_pp",
    title: "Past simple vs Present perfect",
    subtitle: "«I finished» o «I have finished»",
    tenses: ["past_simple", "present_perfect"],
  },
  {
    id: "since_for",
    title: "Since / for",
    subtitle: "«I work here since…» ✗ → «I've been working…» ✓",
    tenses: ["present_perfect", "present_perfect_continuous"],
  },
  {
    id: "past_cont",
    title: "Past simple vs Past continuous",
    subtitle: "Lo que pasaba cuando algo ocurrió",
    tenses: ["past_simple", "past_continuous"],
  },
  {
    id: "pres",
    title: "Present simple vs continuous",
    subtitle: "Rutina vs lo que pasa ahora",
    tenses: ["present_simple", "present_continuous"],
  },
  {
    id: "future",
    title: "Will vs going to vs -ing",
    subtitle: "Decisiones, planes y citas",
    tenses: ["future_will", "future_going_to", "future_present_continuous"],
  },
  {
    id: "past_perf",
    title: "Past perfect",
    subtitle: "El pasado del pasado",
    tenses: ["past_perfect", "past_simple"],
  },
  {
    id: "cond",
    title: "Condicionales",
    subtitle: "Real (if + will) vs hipotético (if + would)",
    tenses: ["conditional_first", "conditional_second"],
  },
];

const S = (
  id: string,
  group: GroupId,
  context: Context,
  targets: TenseId[],
  prompt: string,
  starter?: string
): Scenario => ({ id, group, context, targets, prompt, starter });

export const SCENARIOS: Scenario[] = [
  // Past simple vs present perfect
  S("ps1", "ps_pp", "Daily", ["past_simple"], "En el daily, cuenta qué hiciste ayer: terminaste el cronograma y te reuniste con el equipo de QA.", "Yesterday I…"),
  S("ps2", "ps_pp", "Status report", ["present_perfect"], "Tu jefe pregunta por el avance. Di que esta semana ya completaron 3 de los 5 entregables (la semana aún no termina).", "So far this week, we…"),
  S("ps3", "ps_pp", "Entrevista", ["present_perfect", "past_simple"], "Te preguntan si alguna vez has gestionado un proyecto de más de un millón de dólares. Responde que sí y di cuándo fue y para qué cliente.", "Yes, I have… It was in…"),
  S("ps4", "ps_pp", "Stakeholders", ["past_simple"], "Explica que el cliente aprobó el alcance el lunes pasado y firmó el acta dos días después.", "The client…"),
  S("ps5", "ps_pp", "Riesgos", ["present_perfect"], "Informa que todavía no han recibido la factura del proveedor y que ya le enviaste dos recordatorios.", "We haven't…"),
  S("ps6", "ps_pp", "Daily", ["present_perfect"], "Da la buena noticia: el equipo acaba de terminar la migración de datos.", "Good news: the team has just…"),
  S("ps7", "ps_pp", "Retro", ["past_simple"], "En la retrospectiva, cuenta qué salió mal en el sprint pasado: la demo falló porque el ambiente de pruebas se cayó.", "Last sprint, the demo…"),
  S("ps8", "ps_pp", "Status report", ["present_perfect", "past_simple"], "Di que ya hablaste con el sponsor sobre el presupuesto. Luego aclara que la reunión fue esta mañana a las 9.", "I've already… We met…"),

  // Since / for
  S("sf1", "since_for", "Entrevista", ["present_perfect_continuous"], "Di que trabajas en este proyecto desde enero.", "I…"),
  S("sf2", "since_for", "Status report", ["present_perfect_continuous"], "Explica que el equipo lleva dos semanas probando la nueva versión y todavía no termina.", "The team…"),
  S("sf3", "since_for", "Stakeholders", ["present_perfect"], "Di que conoces al sponsor desde hace cinco años.", "I…"),
  S("sf4", "since_for", "Retro", ["present_perfect_continuous"], "Explica por qué el equipo está cansado: llevan toda la semana haciendo horas extra.", "The team is tired because…"),
  S("sf5", "since_for", "Daily", ["present_perfect"], "Di cuántos tickets has cerrado hoy: doce, y que aún te quedan tres.", "Today I…"),
  S("sf6", "since_for", "Entrevista", ["present_perfect"], "Cuenta cuánto tiempo llevas siendo PM: ocho años.", "I…"),
  S("sf7", "since_for", "Riesgos", ["present_perfect_continuous"], "Avisa que llevas desde el lunes esperando la respuesta del área legal.", "I…"),

  // Past simple vs past continuous
  S("pc1", "past_cont", "Riesgos", ["past_continuous", "past_simple"], "Explica qué estabas haciendo cuando el servidor de producción se cayó.", "When the server went down, I…"),
  S("pc2", "past_cont", "Retro", ["past_continuous", "past_simple"], "Cuenta que mientras el equipo revisaba los requisitos, el cliente cambió el alcance.", "While the team…"),
  S("pc3", "past_cont", "Stakeholders", ["past_continuous"], "Di que ayer a las 3 pm estabas presentando el informe al comité, por eso no contestaste la llamada.", "Yesterday at 3 pm…"),
  S("pc4", "past_cont", "Retro", ["past_continuous", "past_simple"], "Describe qué pasaba en la reunión cuando llegó el director: todos discutían sobre las prioridades.", "When the director arrived…"),
  S("pc5", "past_cont", "Daily", ["past_simple"], "Resume la secuencia de ayer: revisaste el backlog, actualizaste el tablero y enviaste las minutas.", "Yesterday I…"),
  S("pc6", "past_cont", "Riesgos", ["past_continuous", "past_simple"], "Explica que el proveedor estaba instalando el equipo cuando descubrieron un problema eléctrico.", "The vendor…"),

  // Present simple vs continuous
  S("pr1", "pres", "Entrevista", ["present_simple"], "Describe tu rol: qué haces normalmente como PM en tu empresa.", "As a PM, I…"),
  S("pr2", "pres", "Daily", ["present_continuous"], "Di en qué está trabajando el equipo esta semana.", "This week the team…"),
  S("pr3", "pres", "Status report", ["present_simple", "present_continuous"], "Explica que normalmente usan Jira, pero este mes están probando otra herramienta.", "We usually… but this month…"),
  S("pr4", "pres", "Planning", ["present_simple"], "Explica cómo funciona la reunión semanal de seguimiento: cuándo es, cuánto dura y quién asiste.", "Our weekly meeting…"),
  S("pr5", "pres", "Riesgos", ["present_continuous"], "Di que el proyecto va retrasado en este momento y que el equipo está recuperando tiempo.", "Right now…"),
  S("pr6", "pres", "Stakeholders", ["present_simple"], "Explica qué hace el área de QA y a quién le reporta.", "The QA team…"),

  // Future
  S("fu1", "future", "Stakeholders", ["future_will"], "En plena llamada el cliente pide un cambio urgente. Ofrece revisarlo tú mismo hoy.", "No problem,…"),
  S("fu2", "future", "Planning", ["future_going_to"], "Explica el plan que ya decidieron para el próximo sprint.", "Next sprint, we…"),
  S("fu3", "future", "Daily", ["future_present_continuous"], "Di que el jueves a las 10 tienes una reunión agendada con el proveedor.", "On Thursday…"),
  S("fu4", "future", "Riesgos", ["future_going_to"], "Mirando el burndown, predice que no van a terminar a tiempo.", "Looking at the burndown,…"),
  S("fu5", "future", "Stakeholders", ["future_will"], "Promete al sponsor que le enviarás el informe mañana antes de las 10.", "I promise…"),
  S("fu6", "future", "Planning", ["future_present_continuous", "future_going_to"], "Cuenta que el lunes vuela a Monterrey (ya tiene boletos) y que allí va a presentar el roadmap.", "On Monday…"),
  S("fu7", "future", "Daily", ["future_will"], "Alguien dice que el tablero no está actualizado. Decide en el momento actualizarlo tú.", "Oh, sorry,…"),

  // Past perfect
  S("pp1", "past_perf", "Stakeholders", ["past_perfect", "past_simple"], "Explica que cuando llegaste a la reunión, el cliente ya había aprobado el presupuesto.", "When I arrived,…"),
  S("pp2", "past_perf", "Retro", ["past_perfect", "past_simple"], "Cuenta que el proyecto ya se había retrasado antes de que tú asumieras el rol.", "The project…"),
  S("pp3", "past_perf", "Entrevista", ["past_perfect"], "Di que nunca habías usado Scrum antes de este proyecto.", "Before this project,…"),
  S("pp4", "past_perf", "Retro", ["past_perfect", "past_simple"], "Explica que el error ocurrió porque nadie había actualizado la documentación.", "The bug happened because…"),
  S("pp5", "past_perf", "Riesgos", ["past_perfect", "past_simple"], "Cuenta que cuando el proveedor por fin respondió, ya habías encontrado otra alternativa.", "By the time the vendor…"),

  // Conditionals
  S("co1", "cond", "Riesgos", ["conditional_first"], "Explica qué pasará si el proveedor no entrega a tiempo.", "If the vendor…"),
  S("co2", "cond", "Planning", ["conditional_second"], "Di qué harías si tuvieras dos desarrolladores más.", "If I…"),
  S("co3", "cond", "Stakeholders", ["conditional_first"], "Explica al sponsor qué pasará con la fecha si aprueban el cambio de alcance.", "If you approve…"),
  S("co4", "cond", "Retro", ["conditional_second"], "Di qué harías diferente si fueras el sponsor del proyecto.", "If I were…"),
  S("co5", "cond", "Riesgos", ["conditional_first"], "Explica qué harás si el cliente no responde antes del viernes.", "If the client…"),
  S("co6", "cond", "Planning", ["conditional_second"], "Imagina que el presupuesto fuera el doble: di qué cambiarías en el plan.", "If the budget…"),
];

export function scenariosFor(group: GroupId | "mix"): Scenario[] {
  return group === "mix" ? SCENARIOS : SCENARIOS.filter((s) => s.group === group);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
