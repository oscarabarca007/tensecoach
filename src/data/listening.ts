export interface Speaker {
  name: string;
  role: string;
}

export interface ListeningLine {
  /** Index into `speakers`. */
  s: number;
  text: string;
}

export interface ListeningQuestion {
  q: string;
  options: string[]; // exactly 4
  answer: number; // index of the correct option
  /** Short explanation in Spanish quoting the evidence from the conversation. */
  why: string;
}

export interface ListeningItem {
  id: string;
  title: string;
  context: string;
  level: "B1" | "B2";
  speakers: Speaker[];
  lines: ListeningLine[];
  questions: ListeningQuestion[]; // exactly 3
  custom?: boolean;
}

const L = (s: number, text: string): ListeningLine => ({ s, text });

export const LISTENING: ListeningItem[] = [
  {
    id: "l-standup-api",
    title: "The API keys blocker",
    context: "Daily stand-up",
    level: "B1",
    speakers: [
      { name: "Laura", role: "Scrum Master" },
      { name: "Raj", role: "Backend developer" },
      { name: "Emma", role: "QA engineer" },
    ],
    lines: [
      L(0, "Good morning, everyone. Let's keep it short today. Raj, do you want to start?"),
      L(1, "Sure. Yesterday I finished the authentication endpoints and pushed them to the staging branch. Today I'm going to work on the payment integration, but I'm blocked. We still haven't received the API keys from the payment provider."),
      L(0, "When did you request them?"),
      L(1, "Last Thursday. I've sent two follow-up emails since then, but nobody has replied."),
      L(0, "Okay, I'll escalate it to their account manager after this meeting. Emma?"),
      L(2, "I've been testing the login flow since Monday. I found three bugs yesterday, and two of them are already fixed. The third one only happens on older Android phones, so I'm still investigating."),
      L(0, "Great. Do you need anything from the team?"),
      L(2, "Yes, it would help if Raj could pair with me for thirty minutes this afternoon."),
      L(1, "No problem. Let's do it at three."),
    ],
    questions: [
      {
        q: "Why is Raj blocked?",
        options: ["The staging server is down.", "He hasn't received the API keys from the payment provider.", "He is waiting for Emma's test results.", "The authentication endpoints aren't finished."],
        answer: 1,
        why: "Raj dice: «We still haven't received the API keys from the payment provider».",
      },
      {
        q: "What will Laura do after the meeting?",
        options: ["Fix the login bug.", "Send another email to the team.", "Escalate the issue to the provider's account manager.", "Cancel the payment integration."],
        answer: 2,
        why: "«I'll escalate it to their account manager after this meeting» — will para una decisión tomada en el momento.",
      },
      {
        q: "What is true about the bugs Emma found?",
        options: ["All three are fixed.", "Two are fixed and one is still being investigated.", "None of them are fixed yet.", "They only happen on iPhones."],
        answer: 1,
        why: "«Two of them are already fixed. The third one only happens on older Android phones, so I'm still investigating».",
      },
    ],
  },
  {
    id: "l-sprint-planning",
    title: "Too much for one sprint",
    context: "Sprint planning",
    level: "B1",
    speakers: [
      { name: "Daniel", role: "Product Owner" },
      { name: "Sofia", role: "Tech lead" },
    ],
    lines: [
      L(0, "So, for this sprint, the top priority is the new reporting dashboard. The sales team has been asking for it for months."),
      L(1, "I understand, but I've looked at the estimates, and the dashboard alone is about forty story points. Our average velocity is thirty-five."),
      L(0, "Can we split it?"),
      L(1, "Yes. We could deliver the basic charts this sprint and the export feature in the next one."),
      L(0, "Hmm. The export feature is what the sales director really wants."),
      L(1, "Then let's do the opposite. If we build the export first, we'll need about fifteen points, and we can add two simple charts."),
      L(0, "That works. What about the bug fixes from the last release?"),
      L(1, "We're going to reserve five points for bugs. Otherwise they'll keep piling up."),
      L(0, "Agreed. I'll update the backlog and share it with the sales director this afternoon."),
    ],
    questions: [
      {
        q: "What is the problem with the dashboard?",
        options: ["Nobody has asked for it.", "It's bigger than the team's average velocity.", "The design isn't ready.", "The sales director cancelled it."],
        answer: 1,
        why: "Sofía explica que el dashboard son «about forty story points» y la velocidad promedio es «thirty-five».",
      },
      {
        q: "What do they decide to build first?",
        options: ["The basic charts.", "The export feature plus two simple charts.", "Only bug fixes.", "The full dashboard."],
        answer: 1,
        why: "«If we build the export first, we'll need about fifteen points, and we can add two simple charts».",
      },
      {
        q: "How many points will they reserve for bugs?",
        options: ["Five.", "Fifteen.", "Thirty-five.", "Forty."],
        answer: 0,
        why: "«We're going to reserve five points for bugs» — going to para un plan decidido.",
      },
    ],
  },
  {
    id: "l-postmortem",
    title: "Saturday night outage",
    context: "Incident post-mortem",
    level: "B2",
    speakers: [
      { name: "Mark", role: "Engineering manager" },
      { name: "Priya", role: "DevOps engineer" },
    ],
    lines: [
      L(0, "Thanks for joining. Let's go through what happened on Saturday night."),
      L(1, "Sure. At around eleven p.m., the checkout service went down. Customers couldn't complete their orders for about forty minutes."),
      L(0, "What was the root cause?"),
      L(1, "We had deployed a configuration change on Friday afternoon. It reduced the database connection limit by mistake. Everything worked fine with normal traffic, but when the weekend promotion started, the service ran out of connections."),
      L(0, "How did we find out?"),
      L(1, "The monitoring alerts fired, but they went to an old email list that nobody checks anymore. A customer support agent noticed the complaints and called me."),
      L(0, "So we have two problems: the bad config and the alerting."),
      L(1, "Exactly. I've already fixed the connection limit, and I'm updating the alert routing today. I'd also suggest that we stop deploying on Friday afternoons."),
      L(0, "I agree. I'll propose it at the leadership meeting on Tuesday."),
    ],
    questions: [
      {
        q: "How long were customers unable to complete their orders?",
        options: ["About four minutes.", "About fourteen minutes.", "About forty minutes.", "The whole weekend."],
        answer: 2,
        why: "«Customers couldn't complete their orders for about forty minutes».",
      },
      {
        q: "What was the root cause?",
        options: ["A database server failure.", "A configuration change that reduced the connection limit.", "A bug in the promotion code.", "A mistake by customer support."],
        answer: 1,
        why: "«We had deployed a configuration change… It reduced the database connection limit by mistake» — past perfect: ocurrió antes del incidente.",
      },
      {
        q: "Why didn't the team react to the alerts?",
        options: ["The alerts were disabled.", "They went to an old email list that nobody checks.", "Priya was on vacation.", "There were no alerts."],
        answer: 1,
        why: "«They went to an old email list that nobody checks anymore».",
      },
    ],
  },
  {
    id: "l-scope-change",
    title: "Can we add a chat?",
    context: "Client call",
    level: "B2",
    speakers: [
      { name: "Ana", role: "Project manager" },
      { name: "Mr. Collins", role: "Client" },
    ],
    lines: [
      L(1, "Ana, I've been thinking about the mobile app. Our board wants to add a chat feature before launch."),
      L(0, "I see. Can you tell me a bit more about what they have in mind?"),
      L(1, "Just a simple chat so customers can talk to our support team."),
      L(0, "Okay. Just so you know, that's not in the current scope. A chat feature usually needs a backend service, notifications and moderation tools. Our team estimates something like that at around six weeks."),
      L(1, "Six weeks? The launch is in two months."),
      L(0, "Right. So we have a few options. We can move the launch date, or we can launch on time and add the chat in a second release. A third option is to integrate an existing chat tool, which would take about two weeks, but it has a monthly cost."),
      L(1, "The third option sounds interesting. How much would it cost?"),
      L(0, "I'll send you a comparison with prices by Thursday. Then we can decide together, and I'll prepare a formal change request."),
    ],
    questions: [
      {
        q: "What does the client want to add?",
        options: ["A payment system.", "A chat feature for customer support.", "A new login screen.", "Only push notifications."],
        answer: 1,
        why: "«Just a simple chat so customers can talk to our support team».",
      },
      {
        q: "Which option would take about two weeks?",
        options: ["Building the chat from scratch.", "Moving the launch date.", "Integrating an existing chat tool.", "Adding the chat in a second release."],
        answer: 2,
        why: "«A third option is to integrate an existing chat tool, which would take about two weeks».",
      },
      {
        q: "What will Ana send by Thursday?",
        options: ["The final invoice.", "A comparison with prices.", "The new launch date.", "The app's source code."],
        answer: 1,
        why: "«I'll send you a comparison with prices by Thursday».",
      },
    ],
  },
  {
    id: "l-vendor-delay",
    title: "The servers are late",
    context: "Vendor call",
    level: "B1",
    speakers: [
      { name: "Tom", role: "Project manager" },
      { name: "Kenji", role: "Vendor account manager" },
    ],
    lines: [
      L(0, "Hi Kenji, thanks for calling back. I wanted to check on the server delivery. It was supposed to arrive this week."),
      L(1, "Yes, I'm sorry, Tom. I was going to call you anyway. There's a problem with our supplier, and the servers won't ship until the end of the month."),
      L(0, "The end of the month? That's three weeks late. Our data center migration depends on that hardware."),
      L(1, "I understand. We can offer you temporary cloud capacity at no cost until the servers arrive."),
      L(0, "That could work, but my team would need to set it up, and that takes time too. Can you deliver part of the order earlier?"),
      L(1, "Let me check… We have four of the ten servers in stock. We could ship those on Monday."),
      L(0, "Okay, that helps. If we get four servers on Monday, we can start the migration with the less critical systems."),
      L(1, "Perfect. I'll confirm the shipment in writing today."),
    ],
    questions: [
      {
        q: "Why is the delivery late?",
        options: ["Tom cancelled the order.", "There's a problem with the vendor's supplier.", "The servers were damaged.", "The data center is closed."],
        answer: 1,
        why: "«There's a problem with our supplier, and the servers won't ship until the end of the month».",
      },
      {
        q: "How many servers can be shipped on Monday?",
        options: ["Two.", "Four.", "Six.", "Ten."],
        answer: 1,
        why: "«We have four of the ten servers in stock. We could ship those on Monday».",
      },
      {
        q: "What will Tom's team do with the first servers?",
        options: ["Send them back.", "Start the migration with the less critical systems.", "Use them only to test the cloud.", "Wait for the rest of the order."],
        answer: 1,
        why: "«If we get four servers on Monday, we can start the migration with the less critical systems» — primer condicional.",
      },
    ],
  },
  {
    id: "l-code-review",
    title: "Feedback on a pull request",
    context: "Code review",
    level: "B1",
    speakers: [
      { name: "Ben", role: "Senior developer" },
      { name: "Chloe", role: "Junior developer" },
    ],
    lines: [
      L(0, "Chloe, I've just reviewed your pull request. Nice work on the search feature."),
      L(1, "Thanks! Is there anything I should change?"),
      L(0, "A couple of things. First, the function that filters the results is almost two hundred lines long. It would be easier to test if you split it into smaller functions."),
      L(1, "Okay, that makes sense. What's the second thing?"),
      L(0, "You're calling the database inside a loop. With ten results it's fine, but with a thousand it'll be really slow."),
      L(1, "Oh, I didn't think about that. Should I load everything in one query?"),
      L(0, "Exactly. And please add a couple of unit tests for the empty search case. We had a bug like that last year."),
      L(1, "Got it. I'll update the pull request this afternoon."),
      L(0, "Great. Once the tests pass, I'll approve it."),
    ],
    questions: [
      {
        q: "What does Ben think about the filter function?",
        options: ["It's too short.", "It's too long and should be split.", "It has no bugs.", "It should be deleted."],
        answer: 1,
        why: "«It's almost two hundred lines long. It would be easier to test if you split it into smaller functions».",
      },
      {
        q: "Why is calling the database inside a loop a problem?",
        options: ["It's slow when there are many results.", "It costs too much money.", "The company doesn't allow it.", "It breaks the login."],
        answer: 0,
        why: "«With ten results it's fine, but with a thousand it'll be really slow».",
      },
      {
        q: "When will Ben approve the pull request?",
        options: ["Right now.", "Next year.", "When the tests pass.", "After the search feature is removed."],
        answer: 2,
        why: "«Once the tests pass, I'll approve it».",
      },
    ],
  },
  {
    id: "l-budget",
    title: "Seventy percent spent",
    context: "Budget review",
    level: "B2",
    speakers: [
      { name: "Helen", role: "Project sponsor" },
      { name: "Luis", role: "Project manager" },
    ],
    lines: [
      L(0, "Luis, I've seen the latest report. We've spent seventy percent of the budget, but we're only at the halfway point. What's going on?"),
      L(1, "You're right to ask. There are two main reasons. First, the cloud costs have been higher than we expected because of the load testing. Second, we brought in an external security consultant in July."),
      L(0, "Was the consultant necessary?"),
      L(1, "Yes. The audit found several vulnerabilities that we had to fix before going live. If we hadn't fixed them, we would have failed the compliance review."),
      L(0, "Fair enough. But how do we finish the project with thirty percent of the money?"),
      L(1, "I've prepared a plan. We're going to reduce the cloud environments from four to two, and we'll move the reporting module to phase two. With those changes, the forecast shows we'll finish about five percent over budget."),
      L(0, "Five percent I can probably approve. Send me the revised forecast, and I'll take it to the finance committee."),
    ],
    questions: [
      {
        q: "How much of the budget have they spent?",
        options: ["Thirty percent.", "Fifty percent.", "Seventy percent.", "Five percent."],
        answer: 2,
        why: "«We've spent seventy percent of the budget, but we're only at the halfway point».",
      },
      {
        q: "Why did they hire a security consultant?",
        options: ["To reduce cloud costs.", "To find and fix vulnerabilities before going live.", "To present to the finance committee.", "To build the reporting module."],
        answer: 1,
        why: "«The audit found several vulnerabilities that we had to fix before going live».",
      },
      {
        q: "Which change is part of Luis's plan?",
        options: ["Adding two more cloud environments.", "Moving the reporting module to phase two.", "Skipping the compliance review.", "Hiring another consultant."],
        answer: 1,
        why: "«We'll move the reporting module to phase two».",
      },
    ],
  },
  {
    id: "l-go-no-go",
    title: "Go or no-go tonight?",
    context: "Release meeting",
    level: "B2",
    speakers: [
      { name: "Nadia", role: "Release manager" },
      { name: "Omar", role: "QA lead" },
      { name: "Jake", role: "Operations engineer" },
    ],
    lines: [
      L(0, "Okay, it's ten o'clock. Let's decide if version three point two goes live tonight. Omar, how does testing look?"),
      L(1, "We've run the full regression suite. Ninety-eight percent of the tests passed. The two failures are in the PDF export, and they're minor formatting issues."),
      L(0, "Are they visible to customers?"),
      L(1, "Only if they export very long reports. We think it affects less than one percent of users."),
      L(0, "Jake, is operations ready?"),
      L(2, "Mostly. The database backup finished an hour ago, and the rollback script has been tested. The only concern is that the on-call engineer tonight is new."),
      L(0, "Can you stay online during the deployment, just in case?"),
      L(2, "Sure, I'll be available until midnight."),
      L(0, "Then my decision is go. Omar, please create tickets for the PDF issues so we fix them in the next patch."),
    ],
    questions: [
      {
        q: "What percentage of the tests passed?",
        options: ["Eighty percent.", "Ninety percent.", "Ninety-eight percent.", "One hundred percent."],
        answer: 2,
        why: "«Ninety-eight percent of the tests passed».",
      },
      {
        q: "What was Jake's concern?",
        options: ["The backup failed.", "The on-call engineer tonight is new.", "The rollback script doesn't work.", "Customers are complaining."],
        answer: 1,
        why: "«The only concern is that the on-call engineer tonight is new».",
      },
      {
        q: "What is the final decision?",
        options: ["Postpone the release.", "Go live tonight.", "Cancel version 3.2.", "Release only the PDF fix."],
        answer: 1,
        why: "«Then my decision is go».",
      },
    ],
  },
  {
    id: "l-onboarding",
    title: "First day on the team",
    context: "Onboarding",
    level: "B1",
    speakers: [
      { name: "Grace", role: "Team lead" },
      { name: "Leo", role: "New developer" },
    ],
    lines: [
      L(0, "Welcome to the team, Leo! How was your first morning?"),
      L(1, "Good, thanks. I've set up my laptop, but I still don't have access to the code repository."),
      L(0, "Ah, that's normal. IT usually takes a day. I'll ping them now. In the meantime, have you read the architecture document?"),
      L(1, "Not yet. Where can I find it?"),
      L(0, "It's on the team wiki, under Getting Started. Read that first, and then the coding guidelines."),
      L(1, "Okay. And how does the team usually work? Do you have daily meetings?"),
      L(0, "Yes, we have a stand-up every day at nine-thirty, and we plan the sprint every two weeks on Monday. On Fridays we usually do a short demo for the product team."),
      L(1, "Sounds good. Is there a small task I could start with?"),
      L(0, "Yes. Next week you're going to fix a few small bugs with Martin. He's been on the team for three years, so he's a great person to learn from."),
    ],
    questions: [
      {
        q: "What problem does Leo have?",
        options: ["His laptop is broken.", "He doesn't have access to the code repository yet.", "He can't find the office.", "He missed the stand-up."],
        answer: 1,
        why: "«I still don't have access to the code repository».",
      },
      {
        q: "When is the daily stand-up?",
        options: ["At nine o'clock.", "At nine-thirty.", "At ten-thirty.", "Every two weeks."],
        answer: 1,
        why: "«We have a stand-up every day at nine-thirty» — presente simple para una rutina.",
      },
      {
        q: "Who will Leo work with next week?",
        options: ["Grace.", "The IT team.", "Martin.", "The product team."],
        answer: 2,
        why: "«Next week you're going to fix a few small bugs with Martin».",
      },
    ],
  },
  {
    id: "l-retro",
    title: "Too many meetings",
    context: "Retrospective",
    level: "B1",
    speakers: [
      { name: "Irene", role: "Scrum Master" },
      { name: "Paul", role: "Developer" },
      { name: "Kim", role: "UX designer" },
    ],
    lines: [
      L(0, "Let's start with what went well this sprint."),
      L(2, "I think the collaboration between design and development was much better. We had the designs ready before the sprint started, which had never happened before."),
      L(1, "Agreed. And we finished all the stories we committed to."),
      L(0, "Great. What didn't go so well?"),
      L(1, "The meetings. I counted, and last week I spent almost eleven hours in meetings. I barely had time to write code."),
      L(2, "Same for me. Some meetings didn't have an agenda, so we kept discussing the same topics."),
      L(0, "That's useful feedback. What should we change?"),
      L(1, "Maybe we could have one meeting-free day per week. Wednesdays, for example."),
      L(2, "And every meeting should have an agenda. If there's no agenda, we don't go."),
      L(0, "I like both ideas. Let's try them for the next two sprints and see if they help."),
    ],
    questions: [
      {
        q: "What went well this sprint?",
        options: ["There were fewer meetings.", "The designs were ready before the sprint started.", "The team finished early.", "Paul wrote more code."],
        answer: 1,
        why: "«We had the designs ready before the sprint started».",
      },
      {
        q: "How much time did Paul spend in meetings last week?",
        options: ["About one hour.", "Almost eleven hours.", "Two full days.", "Seven hours."],
        answer: 1,
        why: "«Last week I spent almost eleven hours in meetings».",
      },
      {
        q: "What does the team decide?",
        options: ["To cancel all meetings.", "To try a meeting-free day and require agendas.", "To work only on Wednesdays.", "To hire a new designer."],
        answer: 1,
        why: "Irene: «I like both ideas. Let's try them for the next two sprints».",
      },
    ],
  },
];
