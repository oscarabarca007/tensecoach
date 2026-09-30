import type { TenseId } from "./tenses";

export type Context = "Daily" | "Status report" | "Risks" | "Retro" | "Stakeholders" | "Planning" | "Interview";

export interface Scenario {
  id: string;
  group: GroupId;
  context: Context;
  /**
   * What to say, in English. Written as facts/notes plus a task so the wording
   * doesn't hand over the target verb form.
   */
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
    subtitle: "«I finished» or «I have finished»?",
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
    subtitle: "What was going on when something happened",
    tenses: ["past_simple", "past_continuous"],
  },
  {
    id: "pres",
    title: "Present simple vs continuous",
    subtitle: "Routines vs what's happening now",
    tenses: ["present_simple", "present_continuous"],
  },
  {
    id: "future",
    title: "Will vs going to vs -ing",
    subtitle: "Decisions, plans and appointments",
    tenses: ["future_will", "future_going_to", "future_present_continuous"],
  },
  {
    id: "past_perf",
    title: "Past perfect",
    subtitle: "The past before the past",
    tenses: ["past_perfect", "past_simple"],
  },
  {
    id: "cond",
    title: "Conditionals",
    subtitle: "Real (if + will) vs imaginary (if + would)",
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
  S("ps1", "ps_pp", "Daily", ["past_simple"], "Stand-up meeting. Your notes from yesterday: project schedule — finished; meeting with the QA team — done. Give the team your update about yesterday.", "Yesterday I…"),
  S("ps2", "ps_pp", "Status report", ["present_perfect"], "Your manager asks about progress. It's Wednesday: 3 of this week's 5 deliverables are complete, and the week isn't over. Report your progress so far.", "So far this week, we…"),
  S("ps3", "ps_pp", "Interview", ["present_perfect", "past_simple"], "Interview question about your experience with projects over one million dollars. Your answer: yes — one for a bank, in 2023. Answer and give the details.", "Yes, I have… It was in…"),
  S("ps4", "ps_pp", "Stakeholders", ["past_simple"], "Stakeholder update. Facts: scope approval by the client — last Monday; project charter signature — two days later. Share the news.", "The client…"),
  S("ps5", "ps_pp", "Risks", ["present_perfect"], "Risk review. Vendor invoice: still not received. Reminders sent by you so far: two. Explain the situation.", "We haven't…"),
  S("ps6", "ps_pp", "Daily", ["present_perfect"], "Good news from a few minutes ago: the data migration is complete. Announce it to the team.", "Good news: the team has just…"),
  S("ps7", "ps_pp", "Retro", ["past_simple"], "Retrospective. Topic: last sprint's demo. Problem: it failed because of a crash in the test environment. Explain what went wrong.", "Last sprint, the demo…"),
  S("ps8", "ps_pp", "Status report", ["present_perfect", "past_simple"], "Your boss asks about the budget conversation with the sponsor. Status: already done — the meeting was this morning at 9. Answer your boss.", "I've already… We met…"),

  // Since / for
  S("sf1", "since_for", "Interview", ["present_perfect_continuous"], "Interview. Your start date on the current project: January. You're still on it today. Tell them how long.", "I…"),
  S("sf2", "since_for", "Status report", ["present_perfect_continuous"], "Status report. Testing of the new version: started two weeks ago, still in progress. Explain the situation.", "The team…"),
  S("sf3", "since_for", "Stakeholders", ["present_perfect"], "You first met the sponsor five years ago and you're still in touch. Tell the group how long you two go back.", "I…"),
  S("sf4", "since_for", "Retro", ["present_perfect_continuous"], "Retrospective. The team is exhausted. Reason: overtime every day since Monday, and it's still going on. Explain why they're tired.", "The team is tired because…"),
  S("sf5", "since_for", "Daily", ["present_perfect"], "Stand-up. Tickets closed today so far: 12. Tickets left: 3. Give your update.", "Today I…"),
  S("sf6", "since_for", "Interview", ["present_perfect"], "Interview. You started working as a project manager eight years ago and it's still your job. Tell them how long.", "I…"),
  S("sf7", "since_for", "Risks", ["present_perfect_continuous"], "Escalation. Your question to the legal team: sent on Monday. Answer: still pending. Explain the delay.", "I…"),

  // Past simple vs past continuous
  S("pc1", "past_cont", "Risks", ["past_continuous", "past_simple"], "Incident report. The production server crashed at 10:15. Your activity at that exact moment: a client demo. Explain the situation to your boss.", "When the server went down, I…"),
  S("pc2", "past_cont", "Retro", ["past_continuous", "past_simple"], "Retrospective. In the middle of the team's requirements review, the client changed the scope. Describe what happened.", "While the team…"),
  S("pc3", "past_cont", "Stakeholders", ["past_continuous"], "Your boss called yesterday at 3 pm and you missed it. Your activity at 3 pm: presenting the report to the committee. Explain why you didn't answer.", "Yesterday at 3 pm…"),
  S("pc4", "past_cont", "Retro", ["past_continuous", "past_simple"], "Describe the scene: the director walked into the meeting in the middle of a heated argument about priorities.", "When the director arrived…"),
  S("pc5", "past_cont", "Daily", ["past_simple"], "Stand-up. Yesterday, in order: 1) backlog review, 2) board update, 3) meeting minutes to everyone. Tell the team.", "Yesterday I…"),
  S("pc6", "past_cont", "Risks", ["past_continuous", "past_simple"], "Risk report. In the middle of the vendor's equipment installation, the team discovered an electrical problem. Explain what happened.", "The vendor…"),

  // Present simple vs continuous
  S("pr1", "pres", "Interview", ["present_simple"], "Interview. Describe your role: your typical responsibilities as a PM at your company.", "As a PM, I…"),
  S("pr2", "pres", "Daily", ["present_continuous"], "Stand-up. Explain the team's focus this week.", "This week the team…"),
  S("pr3", "pres", "Status report", ["present_simple", "present_continuous"], "Status report. Your usual tool: Jira. This month: a trial of a different tool. Explain.", "We usually… but this month…"),
  S("pr4", "pres", "Planning", ["present_simple"], "Planning. Explain how the weekly follow-up meeting works: day, length and attendees.", "Our weekly meeting…"),
  S("pr5", "pres", "Risks", ["present_continuous"], "Risk review. Current status: behind schedule. Current action: the team is recovering time. Describe the situation at this moment.", "Right now…"),
  S("pr6", "pres", "Stakeholders", ["present_simple"], "Stakeholder meeting. Explain the QA team's responsibilities and who they report to.", "The QA team…"),

  // Future
  S("fu1", "future", "Stakeholders", ["future_will"], "Client call. The client asks for an urgent change. On the spot, you decide to review it yourself today. Respond.", "No problem,…"),
  S("fu2", "future", "Planning", ["future_going_to"], "Sprint planning. The team already agreed on the plan for next sprint. Explain it.", "Next sprint, we…"),
  S("fu3", "future", "Daily", ["future_present_continuous"], "Stand-up. Your calendar: meeting with the vendor, Thursday 10 am (already confirmed). Mention it.", "On Thursday…"),
  S("fu4", "future", "Risks", ["future_going_to"], "Risk review. The burndown chart shows the team is far behind. Make a prediction about the deadline.", "Looking at the burndown,…"),
  S("fu5", "future", "Stakeholders", ["future_will"], "The sponsor needs the report. Make a promise: report delivered tomorrow before 10 am.", "I promise…"),
  S("fu6", "future", "Planning", ["future_present_continuous", "future_going_to"], "Travel plans. Flight to Monterrey on Monday (tickets booked). Your plan there: a roadmap presentation. Tell your team.", "On Monday…"),
  S("fu7", "future", "Daily", ["future_will"], "Stand-up. Someone points out that the task board is out of date. Offer, right there, to update it.", "Oh, sorry,…"),

  // Past perfect
  S("pp1", "past_perf", "Stakeholders", ["past_perfect", "past_simple"], "Stakeholder update. Your arrival at the meeting: late. The client's budget approval: already done before you got there. Explain.", "When I arrived,…"),
  S("pp2", "past_perf", "Retro", ["past_perfect", "past_simple"], "Retrospective. The project delays started before you took over as PM. Explain the timeline.", "The project…"),
  S("pp3", "past_perf", "Interview", ["past_perfect"], "Interview. Your experience with Scrum before this project: zero. Tell them.", "Before this project,…"),
  S("pp4", "past_perf", "Retro", ["past_perfect", "past_simple"], "Retrospective. Root cause of the bug: outdated documentation — no one updated it before the release. Explain.", "The bug happened because…"),
  S("pp5", "past_perf", "Risks", ["past_perfect", "past_simple"], "Risk report. The vendor's reply finally arrived. By that time: alternative option already found by you. Explain.", "By the time the vendor…"),

  // Conditionals
  S("co1", "cond", "Risks", ["conditional_first"], "Risk review. Explain the consequences in case the vendor misses the delivery date.", "If the vendor…"),
  S("co2", "cond", "Planning", ["conditional_second"], "Planning. Hypothetical situation: two extra developers on the team (you don't have them). Explain the difference they'd make.", "If I…"),
  S("co3", "cond", "Stakeholders", ["conditional_first"], "Stakeholder meeting. Explain to the sponsor the effect on the deadline in case they approve the scope change.", "If you approve…"),
  S("co4", "cond", "Retro", ["conditional_second"], "Retrospective. Imagine yourself in the sponsor's position (hypothetically). Say what you'd do differently.", "If I were…"),
  S("co5", "cond", "Risks", ["conditional_first"], "Risk review. Possible scenario: no response from the client before Friday. Explain your plan for that case.", "If the client…"),
  S("co6", "cond", "Planning", ["conditional_second"], "Planning. Hypothetical situation: a budget twice as big. Explain the changes to the plan.", "If the budget…"),
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
