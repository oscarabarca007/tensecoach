export type WordCat = "Planeación" | "Riesgos" | "Comunicación" | "Reuniones" | "Presupuesto" | "Agile";

export const WORD_CATS: WordCat[] = ["Planeación", "Riesgos", "Comunicación", "Reuniones", "Presupuesto", "Agile"];

export interface Word {
  id: string;
  word: string;
  pos: string; // n, v, adj, adv, phr v, expr
  es: string;
  /** Simple learner-style definition in English. Optional for words generated before it existed. */
  def?: string;
  /** Approximate pronunciation for Spanish speakers; CAPS = stressed syllable. */
  say: string;
  example: string;
  cat: WordCat;
  /** Common mistake for Spanish speakers (false friend, sound, usage). */
  tip?: string;
  custom?: boolean;
}

const DEFS: Record<string, string> = {
  deadline: "the latest time or date by which something must be finished",
  milestone: "an important point in a project that shows how much progress has been made",
  deliverable: "a product, document or result that must be delivered as part of a project",
  "scope creep": "the slow, uncontrolled growth of a project's scope beyond what was agreed",
  roadmap: "a high-level plan that shows the main goals and steps over time",
  "lead time": "the time between ordering or starting something and receiving it",
  bottleneck: "a point in a process where work slows down or gets stuck",
  workload: "the amount of work a person or team has to do",
  prioritize: "to decide which tasks are most important and do them first",
  allocate: "to give time, money or people to a particular task",
  feasible: "possible and practical to do",
  "on track": "progressing as planned and likely to finish on time",
  "behind schedule": "later than planned",
  issue: "a problem that is affecting the project right now",
  blocker: "something that stops work from moving forward",
  workaround: "a temporary way to avoid a problem without really fixing it",
  mitigate: "to make a risk or problem less serious or less likely",
  escalate: "to pass a problem to someone with more authority",
  "contingency plan": "a backup plan to use if something goes wrong",
  "root cause": "the main underlying reason why a problem happened",
  setback: "a problem that delays progress",
  likelihood: "how probable it is that something will happen",
  stakeholder: "a person or group that is affected by or interested in a project",
  "buy-in": "agreement and support for a plan from the people involved",
  align: "to agree on the same goals, priorities or understanding",
  "follow up": "to contact someone again or take further action on something",
  "push back": "to resist or disagree with a request, plan or decision",
  "sign off": "to give official approval to something",
  "heads-up": "an early warning about something that is going to happen",
  "keep in the loop": "to keep someone informed about what is happening",
  "reach out": "to contact someone, usually to ask for help or information",
  actually: "in fact; used to correct something or add surprising information",
  eventually: "in the end, after a long time or after many problems",
  agenda: "a list of topics to discuss in a meeting",
  "action item": "a specific task that someone must do after a meeting",
  "wrap up": "to finish or conclude something",
  "touch base": "to talk briefly with someone to check how things are going",
  takeaway: "a key point or lesson to remember",
  "run late": "to be behind the planned time",
  budget: "the amount of money available for something",
  overrun: "the amount by which the cost or time goes over the plan",
  forecast: "a prediction of future results, or to make that prediction",
  "cost-effective": "giving good results for the money spent",
  headcount: "the number of people working in a team or company",
  backlog: "a prioritized list of work that still needs to be done",
  estimate: "to calculate approximately how much time, money or effort something will take",
  throughput: "the amount of work a team completes in a period of time",
  ship: "to release a product or feature to users",
  "lessons learned": "knowledge gained from experience that helps future projects",
  streamline: "to make a process simpler and more efficient",
};

const W = (word: string, pos: string, es: string, say: string, cat: WordCat, example: string, tip?: string): Word => ({
  id: word.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""),
  word,
  pos,
  es,
  def: DEFS[word],
  say,
  cat,
  example,
  tip,
});

export const WORDS: Word[] = [
  // Planeación
  W("deadline", "n", "fecha límite", "DED-lain", "Planeación", "We need to move the deadline to next Friday."),
  W("milestone", "n", "hito", "MAIL-stoun", "Planeación", "We reached the first milestone on time."),
  W("deliverable", "n", "entregable", "di-LI-ve-ra-bol", "Planeación", "The main deliverable this month is the migration plan."),
  W("scope creep", "n", "crecimiento descontrolado del alcance", "SKOUP-krip", "Planeación", "Every new request without a change order is scope creep.", "Scope empieza con «s» directa: no digas «e-scope»."),
  W("roadmap", "n", "hoja de ruta", "ROUD-map", "Planeación", "I'll share the updated roadmap with the steering committee."),
  W("lead time", "n", "tiempo de entrega / anticipación", "LID-taim", "Planeación", "The vendor needs a lead time of six weeks.", "«Lead» aquí suena «lid», no «led»."),
  W("bottleneck", "n", "cuello de botella", "BO-tel-nek", "Planeación", "QA has become the bottleneck in our release process."),
  W("workload", "n", "carga de trabajo", "UORK-loud", "Planeación", "Her workload is too high this sprint."),
  W("prioritize", "v", "priorizar", "prai-O-ri-taiz", "Planeación", "We have to prioritize the security fixes."),
  W("allocate", "v", "asignar (recursos)", "A-lo-keit", "Planeación", "We allocated two developers to the integration."),
  W("feasible", "adj", "viable, factible", "FI-si-bol", "Planeación", "Is it feasible to go live in March?"),
  W("on track", "expr", "en tiempo / según el plan", "on TRAK", "Planeación", "The project is on track for the June release."),
  W("behind schedule", "expr", "retrasado", "bi-JAIND SKE-yul", "Planeación", "We're two weeks behind schedule because of the data migration."),

  // Riesgos
  W("issue", "n", "problema, incidencia", "I-shu", "Riesgos", "We have an issue with the payment gateway.", "Se pronuncia «í-shu», no «í-su-e»."),
  W("blocker", "n", "bloqueo, impedimento", "BLO-ker", "Riesgos", "The missing API key is our main blocker."),
  W("workaround", "n", "solución provisional", "UOR-ka-raund", "Riesgos", "We found a workaround until the vendor fixes the bug."),
  W("mitigate", "v", "mitigar", "MI-ti-geit", "Riesgos", "How can we mitigate this risk?"),
  W("escalate", "v", "escalar (a un nivel superior)", "ES-ka-leit", "Riesgos", "If it isn't solved by Friday, I'll escalate it to the sponsor."),
  W("contingency plan", "n", "plan de contingencia", "kon-TIN-yen-si plan", "Riesgos", "We need a contingency plan in case the vendor fails."),
  W("root cause", "n", "causa raíz", "RUT kos", "Riesgos", "We still haven't found the root cause of the outage."),
  W("setback", "n", "contratiempo", "SET-bak", "Riesgos", "Losing the lead developer was a major setback."),
  W("likelihood", "n", "probabilidad", "LAIK-li-jud", "Riesgos", "The likelihood of a delay is high."),

  // Comunicación
  W("stakeholder", "n", "parte interesada", "STEIK-jol-der", "Comunicación", "I'll meet the key stakeholders on Monday.", "Empieza con «st»: no digas «e-stakeholder»."),
  W("buy-in", "n", "apoyo, compromiso", "BAI-in", "Comunicación", "We need buy-in from the finance team before we start."),
  W("align", "v", "alinear, ponerse de acuerdo", "a-LAIN", "Comunicación", "Let's align on the priorities before the demo.", "La «g» es muda."),
  W("follow up", "phr v", "dar seguimiento", "FO-lou AP", "Comunicación", "I'll follow up with the vendor tomorrow."),
  W("push back", "phr v", "oponerse, cuestionar", "push BAK", "Comunicación", "The client pushed back on the new timeline."),
  W("sign off", "phr v", "aprobar formalmente", "sain OF", "Comunicación", "The sponsor signed off on the budget yesterday.", "La «g» es muda: «sain»."),
  W("heads-up", "n", "aviso previo", "JEDS-ap", "Comunicación", "Just a heads-up: the release might slip a few days."),
  W("keep in the loop", "expr", "mantener informado", "kip in de LUP", "Comunicación", "Please keep me in the loop about the contract."),
  W("reach out", "phr v", "contactar", "rich AUT", "Comunicación", "I reached out to the legal team this morning."),
  W("actually", "adv", "en realidad", "AK-chu-a-li", "Comunicación", "Actually, the problem is not the budget, it's the scope.", "Falso amigo: NO significa «actualmente» (eso es currently)."),
  W("eventually", "adv", "finalmente, con el tiempo", "i-VEN-chu-a-li", "Comunicación", "We eventually found the root cause.", "Falso amigo: NO significa «eventualmente/a veces»."),

  // Reuniones
  W("agenda", "n", "orden del día", "a-YEN-da", "Reuniones", "I've sent the agenda for tomorrow's meeting.", "No es «agenda» de calendario (eso es planner/calendar)."),
  W("action item", "n", "tarea asignada / pendiente", "AK-shon AI-tem", "Reuniones", "Let's review the action items from last week."),
  W("wrap up", "phr v", "cerrar, concluir", "rap AP", "Reuniones", "Let's wrap up the meeting; we're out of time.", "La «w» es muda: «rap»."),
  W("touch base", "expr", "ponerse en contacto brevemente", "tach BEIS", "Reuniones", "Let's touch base on Thursday about the risks."),
  W("takeaway", "n", "conclusión clave", "TEIK-a-uei", "Reuniones", "The main takeaway is that we need more testing."),
  W("run late", "expr", "ir con retraso", "ran LEIT", "Reuniones", "Sorry, my previous meeting is running late."),

  // Presupuesto
  W("budget", "n", "presupuesto", "BA-yet", "Presupuesto", "We're still within budget."),
  W("overrun", "n", "sobrecosto", "OU-ve-ran", "Presupuesto", "The cost overrun was caused by extra licenses."),
  W("forecast", "n/v", "pronóstico / proyectar", "FOR-kast", "Presupuesto", "We forecast a 10% saving this quarter."),
  W("cost-effective", "adj", "rentable, costo-eficiente", "kost-i-FEK-tiv", "Presupuesto", "Outsourcing QA is more cost-effective."),
  W("headcount", "n", "número de personas del equipo", "JED-kaunt", "Presupuesto", "We can't increase headcount this year."),

  // Agile
  W("backlog", "n", "lista de pendientes", "BAK-log", "Agile", "Let's groom the backlog before sprint planning."),
  W("estimate", "v", "estimar", "ES-ti-meit", "Agile", "Can you estimate how long this story will take?", "Verbo: «ES-ti-meit». Sustantivo (an estimate): «ES-ti-mat»."),
  W("throughput", "n", "capacidad de entrega", "ZRU-put", "Agile", "Our throughput doubled after we automated testing.", "«th» se pronuncia con la lengua entre los dientes, como la «z» de España."),
  W("ship", "v", "liberar, entregar (producto)", "ship", "Agile", "We'll ship the new feature next week.", "«i» corta. Si la alargas suena «sheep» (oveja)."),
  W("lessons learned", "n", "lecciones aprendidas", "LE-sons LERND", "Agile", "We'll document the lessons learned in the retro.", "«learned» es una sílaba: «lernd»."),
  W("streamline", "v", "simplificar, optimizar", "STRIM-lain", "Agile", "We streamlined the approval process.", "Empieza con «str»: no digas «e-streamline»."),
];
