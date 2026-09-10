// A hand-built knowledge base the AI Coach falls back to when no
// ANTHROPIC_API_KEY is configured (see lib/ai/provider.ts). It's not a real
// language model — it's keyword-matched — but each entry lists many phrasings
// so it recognizes a wide range of ways people actually ask these things.

export type CoachContext = {
  todayTaskCount: number;
  overdueCount: number;
  activeGoalTitles: string[];
  currentStreak: number;
};

type FaqEntry = {
  id: string;
  keywords: string[];
  reply: string | ((ctx: CoachContext) => string);
};

const APP_GUIDE = `
Go Sheros is a productivity app with these sections (left sidebar on desktop, bottom tab bar on mobile):
- Dashboard: daily overview — today's tasks, streak, quick stats.
- Today: the day's task list; add, complete, star (high priority), edit, or delete tasks; tasks can repeat on chosen days of the week.
- Goals: set a goal, timeframe, which days you'll work on it, hours/day, and any specific details — the planner breaks it into milestones and daily tasks you review before committing.
- Calendar: month/week view of all scheduled tasks.
- Habits: recurring habit tracking separate from one-off tasks.
- Focus: a focus-timer mode for single-tasking.
- Analytics: charts on completion rate, streaks, and time spent by category.
- AI Coach (this chat): goal planning and productivity Q&A.
- Settings: profile, password, optional 2FA, notification/email preferences, data export & account deletion, and an About tab with app version and credits.
Notifications: a bell icon (top-right on desktop, top of screen on mobile) shows in-app notifications with a badge for unread count; turn on push notifications in Settings to get real device notifications too.
`.trim();

export const FAQ_ENTRIES: FaqEntry[] = [
  // ---- Greetings & meta ----
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "yo ", "sup", "good morning", "good evening", "good afternoon"],
    reply: (ctx) =>
      ctx.todayTaskCount > 0
        ? `Hey! You've got ${ctx.todayTaskCount} task${ctx.todayTaskCount === 1 ? "" : "s"} on deck today. What's up?`
        : "Hey! Nothing on today's list yet — want help planning something, or just chatting?",
  },
  {
    id: "how-are-you",
    keywords: ["how are you", "how r u", "how you doing", "how are u"],
    reply: "Doing well, thanks for asking! More importantly — how are you doing with today's plan?",
  },
  {
    id: "identity",
    keywords: ["who are you", "what are you", "are you human", "are you a bot", "are you ai", "are you real"],
    reply: "I'm the Go Sheros AI Coach — part productivity coach, part app guide, and happy to just chat too. What's on your mind?",
  },
  {
    id: "capabilities",
    keywords: ["what can you do", "what do you do", "help me", "how do you work", "what are your features"],
    reply: `I can help you plan goals, prioritize your day, talk through motivation or focus, and answer questions about the app. Quick app tour:\n\n${APP_GUIDE}`,
  },
  {
    id: "app-info",
    keywords: [
      "what is this app",
      "what does this app do",
      "how does this app work",
      "tell me about go sheros",
      "about this app",
      "what is go sheros",
    ],
    reply: APP_GUIDE,
  },
  {
    id: "thanks",
    keywords: ["thank you", "thanks", "thx", "appreciate it", "ty "],
    reply: "Anytime! Let me know if you want help with anything else.",
  },
  {
    id: "goodbye",
    keywords: ["bye", "goodbye", "see you", "later", "gotta go", "cya"],
    reply: "See you — go crush today's tasks. 👋",
  },
  {
    id: "credit",
    keywords: ["who made this", "who built this", "who created this", "who developed this", "who made go sheros"],
    reply: "Go Sheros was made by Sher Singh. You can see the credit in Settings → About.",
  },
  {
    id: "joke",
    keywords: ["tell me a joke", "make me laugh", "joke please", "say something funny"],
    reply: "Why did the to-do list break up with the calendar? Too many unresolved commitments. 😄 Now — anything on your list I can help you tackle?",
  },

  // ---- App how-tos ----
  {
    id: "how-add-task",
    keywords: ["add a task", "create a task", "new task", "how do i add task", "how to add task"],
    reply: "Go to Today (or Dashboard), and use the add-task field there — give it a title, optional time, and estimated minutes. You can also make it repeat on specific days of the week.",
  },
  {
    id: "how-edit-delete-task",
    keywords: ["edit a task", "delete a task", "remove a task", "how do i edit", "change a task"],
    reply: "Tap the pencil icon on any task to edit it, or the X/trash icon to delete it. On mobile those icons are always visible; on desktop they show when you hover the task row.",
  },
  {
    id: "how-star-task",
    keywords: ["star a task", "high priority", "mark important", "favorite a task", "priority task"],
    reply: "Tap the star icon on a task to mark it high priority — starred tasks show a highlighted star and sort to the top of what needs attention.",
  },
  {
    id: "how-recurring",
    keywords: ["repeat task", "recurring task", "repeat every", "daily task", "weekly task", "same task every day"],
    reply: "When creating or editing a task, pick which days of the week it should repeat on — it'll then auto-generate for those days going forward.",
  },
  {
    id: "how-goal",
    keywords: ["create a goal", "new goal", "start a goal", "how do i make a goal", "set a goal"],
    reply: "Go to Goals → + New goal. Type your goal in your own words, add any specifics in Details, pick your date range, which days you'll work on it, and hours/day — then review and accept the generated plan (you can remove any task before accepting).",
  },
  {
    id: "how-goal-edit",
    keywords: ["edit a goal", "change my goal", "archive a goal", "delete a goal", "reactivate a goal"],
    reply: "Open the goal from the Goals page — you'll find edit, archive, and delete options on its detail page.",
  },
  {
    id: "how-calendar",
    keywords: ["calendar view", "see my schedule", "monthly view", "weekly view"],
    reply: "The Calendar tab shows all your scheduled tasks in month or week view, so you can see how a busy week is shaping up at a glance.",
  },
  {
    id: "how-habits",
    keywords: ["track a habit", "habit tracking", "what is habits page", "build a habit"],
    reply: "Habits is for recurring routines you want to track separately from one-off tasks — like daily journaling or a workout streak.",
  },
  {
    id: "how-focus",
    keywords: ["focus mode", "focus timer", "pomodoro", "single tasking"],
    reply: "Focus mode gives you a distraction-free timer for working on one task at a time. Great when you keep bouncing between tabs.",
  },
  {
    id: "how-analytics",
    keywords: ["analytics page", "see my stats", "completion rate", "how much time did i spend"],
    reply: "Analytics shows charts for your completion rate, streaks over time, and how your time splits across categories.",
  },
  {
    id: "how-notifications",
    keywords: ["turn on notifications", "enable push", "get notified", "notification not working", "push notification"],
    reply: "In Settings, toggle on \"Browser push notifications\" — your device will ask for permission, and once granted you'll get real notifications (with sound) even when the app isn't open, not just the in-app bell.",
  },
  {
    id: "how-2fa",
    keywords: ["two factor", "2fa", "authenticator app", "totp"],
    reply: "2FA is optional — turn it on in Settings with an authenticator app (Google Authenticator, Authy, etc.) for extra login security.",
  },
  {
    id: "how-export-delete",
    keywords: ["export my data", "download my data", "delete my account", "delete account"],
    reply: "Settings → Your data has both options: full data export any time, and permanent account deletion, entirely on your terms.",
  },
  {
    id: "how-password",
    keywords: ["change my password", "reset password", "forgot password"],
    reply: "You can change your password from Settings while logged in, or use \"Forgot password\" on the login screen if you're locked out.",
  },

  // ---- Productivity coaching ----
  {
    id: "procrastination",
    keywords: ["procrastinat", "can't start", "keep putting off", "avoiding", "putting it off", "not starting"],
    reply: "Procrastination is usually about the task feeling too big or too vague, not laziness. Pick the smallest possible first step — something under 5 minutes — and just do that. Momentum does the rest.",
  },
  {
    id: "overwhelmed",
    keywords: ["overwhelm", "too many", "so much to do", "drowning", "can't keep up", "busy"],
    reply: (ctx) =>
      ctx.todayTaskCount > 5
        ? `You've got ${ctx.todayTaskCount} tasks today. Pick the 3 with the nearest deadlines or highest priority and move the rest to tomorrow — a shorter honest list beats a long ignored one.`
        : `${ctx.todayTaskCount} tasks today is manageable. Start with whichever one you're most tempted to avoid.`,
  },
  {
    id: "motivation",
    keywords: ["unmotivated", "no motivation", "don't feel like", "lost motivation", "can't be bothered"],
    reply: "Motivation follows action more often than it leads it — starting a tiny piece of the task usually generates more motivation than waiting to feel ready. What's the smallest version of the next task you could start right now?",
  },
  {
    id: "streak",
    keywords: ["streak", "consisten", "staying on track", "keep it up"],
    reply: (ctx) =>
      ctx.currentStreak > 0
        ? `You're on a ${ctx.currentStreak}-day streak. One more meaningful task completed today keeps it alive.`
        : "No active streak yet — completing just one task today starts a new one.",
  },
  {
    id: "overdue",
    keywords: ["overdue", "missed deadline", "behind schedule", "fell behind"],
    reply: (ctx) =>
      ctx.overdueCount > 0
        ? `You have ${ctx.overdueCount} overdue task${ctx.overdueCount === 1 ? "" : "s"}. Want me to help you reschedule them, or should we leave them and focus on today?`
        : "You're not carrying any overdue tasks right now — nice.",
  },
  {
    id: "prioritize",
    keywords: ["what should i do first", "prioriti", "which task first", "what's most important"],
    reply: "A quick rule: do the task with the nearest real deadline first, then the one you're most avoiding (it's usually the highest-leverage one), then everything else in any order.",
  },
  {
    id: "time-management",
    keywords: ["not enough time", "no time", "time management", "too little time"],
    reply: "Usually it's not a time shortage but a planning gap — try blocking specific times for your top 2-3 tasks rather than leaving them as a loose list. What's eating most of your day right now?",
  },
  {
    id: "burnout",
    keywords: ["burnout", "burnt out", "exhausted", "so tired", "drained"],
    reply: "That's a sign to scale down, not push harder. Cut today's list to the one or two things that truly matter, and build in an actual break — burnout compounds if you just grind through it.",
  },
  {
    id: "focus-distraction",
    keywords: ["can't focus", "distracted", "keep getting distracted", "concentration"],
    reply: "Try Focus mode with a short timer (20-25 min) on a single task, phone out of reach. Distraction is often a sign the task's next step isn't clearly defined — write down the very next physical action before you start.",
  },
  {
    id: "deadline-pressure",
    keywords: ["deadline", "due soon", "running out of time", "last minute"],
    reply: "Break what's left into the smallest chunks that fit the time you actually have, and start with whichever chunk unblocks the rest. Want help splitting it up?",
  },
  {
    id: "goal-setting",
    keywords: ["how do i set a goal", "good goal", "smart goal", "setting goals"],
    reply: "A goal that sticks has a clear timeframe and a realistic daily time budget — vague goals with no deadline rarely get finished. Use the Goals page: name it, say roughly how much time/day you can give it, and let the plan adjust as you go.",
  },
  {
    id: "accountability",
    keywords: ["accountab", "stay on track", "keep myself honest"],
    reply: "Your streak and daily task list are your accountability here — check in once a day, even just to mark what you didn't get to, rather than letting a bad day go unlogged.",
  },
  {
    id: "morning-routine",
    keywords: ["morning routine", "start my day", "start the day right"],
    reply: "A simple, repeatable morning routine (even 3 things) beats an elaborate one you'll abandon. Pick one thing you'll always do first thing, and build from there.",
  },
  {
    id: "evening-routine",
    keywords: ["evening routine", "wind down", "end my day"],
    reply: "A quick end-of-day review — what got done, what's moving to tomorrow — takes 2 minutes and makes the next morning much easier to start.",
  },
  {
    id: "discipline",
    keywords: ["discipline", "willpower", "self control"],
    reply: "Willpower is a limited resource, so design around it rather than relying on it — remove friction from starting (have the task ready to go) and add friction to distractions.",
  },
  {
    id: "perfectionism",
    keywords: ["perfectionis", "never finish", "not good enough", "keep redoing"],
    reply: "Done beats perfect, especially for anything you can revise later. Set a \"good enough to ship\" bar before you start, not after.",
  },
  {
    id: "breaks",
    keywords: ["need a break", "take a break", "rest", "self care", "self-care"],
    reply: "Breaks aren't wasted time — they're part of the work. A short walk or step away from the screen usually pays for itself in focus when you come back.",
  },
  {
    id: "progress-review",
    keywords: ["how am i doing", "my progress", "review my week", "check my progress"],
    reply: (ctx) =>
      `Right now: ${ctx.todayTaskCount} tasks today, ${ctx.overdueCount} overdue, a ${ctx.currentStreak}-day streak, and active goals: ${ctx.activeGoalTitles.join(", ") || "none yet"}. Check the Analytics page for the full trend over time.`,
  },
  {
    id: "setback",
    keywords: ["missed a day", "fell off", "broke my streak", "messed up", "off track"],
    reply: "One missed day doesn't undo the progress before it — the only real failure is treating a slip as a reason to quit entirely. Just pick back up today.",
  },
];

/** Returns the first FAQ entry whose keyword appears in the message, or undefined. */
export function matchFaq(message: string): FaqEntry | undefined {
  const lower = message.toLowerCase();
  return FAQ_ENTRIES.find((entry) => entry.keywords.some((k) => lower.includes(k)));
}

export function resolveFaqReply(entry: FaqEntry, ctx: CoachContext): string {
  return typeof entry.reply === "function" ? entry.reply(ctx) : entry.reply;
}

export { APP_GUIDE };
