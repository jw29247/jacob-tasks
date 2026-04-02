import fetch from "node-fetch";

// Convex configuration
const CONVEX_URL = "https://small-newt-543.eu-west-1.convex.cloud";
const CONVEX_SITE_URL = "https://small-newt-543.eu-west-1.convex.site";

// Helper to create task via Convex HTTP API
async function createTask(task: {
  title: string;
  description?: string;
  dueDate?: number;
  startDate?: number;
  priority: "critical" | "high" | "medium" | "low";
  deadlineType: "hard" | "soft";
  list?: "personal" | "weddings" | "house";
}) {
  const response = await fetch(`${CONVEX_SITE_URL}/api/tasks/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...task,
      status: "todo",
      order: Date.now(),
      createdBy: "seed",
    }),
  });
  
  if (!response.ok) {
    console.error(`Failed to create: ${task.title}`);
    return null;
  }
  
  const result = await response.json();
  console.log(`✓ Created: ${task.title}`);
  return result;
}

// Convert date string to timestamp
function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

// All tasks from ClickUp + Jacob's manual additions
const tasks = [
  // === TONIGHT (Critical) ===
  {
    title: "Reply to Pippa",
    dueDate: dateToTimestamp("2026-04-02"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "personal" as const,
    description: "Reply tonight",
  },
  {
    title: "Prepare tools for downstairs toilet",
    dueDate: dateToTimestamp("2026-04-02"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "house" as const,
    description: "Get all tools ready for tomorrow's work",
  },
  
  // === THIS WEEK ===
  {
    title: "Pack for Maldives",
    dueDate: dateToTimestamp("2026-04-07"),
    startDate: dateToTimestamp("2026-04-03"),
    priority: "high" as const,
    deadlineType: "soft" as const,
    list: "personal" as const,
    description: "Honeymoon packing — passport, tickets, clothes",
  },
  
  // === PERSONAL (ClickUp) ===
  {
    title: "File JAW Media company accounts",
    dueDate: dateToTimestamp("2026-10-30"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "personal" as const,
  },
  {
    title: "Drone flyer and operator ID update",
    dueDate: dateToTimestamp("2026-03-27"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "personal" as const,
  },
  {
    title: "Check HMRC fine",
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "personal" as const,
    description: "Check if there's an HMRC fine and resolve",
  },
  {
    title: "Tax return",
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "personal" as const,
    description: "Complete and submit tax return",
  },
  
  // === HOUSE ===
  {
    title: "Finish tidying garage",
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "house" as const,
    description: "Several hours (3-5 hrs) — split across sessions",
  },
  {
    title: "Tidy junk bedroom",
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "house" as const,
    description: "~1 hour",
  },
  {
    title: "Build extra chairs",
    dueDate: dateToTimestamp("2026-03-20"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "house" as const,
  },
  {
    title: "Living spotlights and soles",
    dueDate: dateToTimestamp("2026-03-31"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "house" as const,
  },
  
  // === WEDDING PREP ===
  {
    title: "Organise hangers for suits (Healing Manor)",
    dueDate: dateToTimestamp("2026-05-25"),
    priority: "low" as const,
    deadlineType: "soft" as const,
    list: "personal" as const,
    description: "~1 hour — plenty of time before wedding",
  },
  
  // === WEDDINGS (ClickUp - Copy Footage - URGENT) ===
  {
    title: "Sian & Brandon — Copy Footage",
    dueDate: dateToTimestamp("2026-04-06"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Jodie & Carl — Copy Footage",
    dueDate: dateToTimestamp("2026-04-07"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Joy & Garry — Copy Footage",
    dueDate: dateToTimestamp("2026-04-08"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Sarah & Rebecca — Copy Footage",
    dueDate: dateToTimestamp("2026-04-09"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Jennifer & Matthew — Copy Footage",
    dueDate: dateToTimestamp("2026-04-18"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Leah & Reuben — Copy Footage",
    dueDate: dateToTimestamp("2026-04-01"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Kirsty & George — Copy Footage",
    dueDate: dateToTimestamp("2026-04-25"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Megan & Michael — Copy Footage",
    dueDate: dateToTimestamp("2026-04-28"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Hannah & Gary — Copy Footage",
    dueDate: dateToTimestamp("2026-05-02"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Madeleine & Daniel — Copy Footage",
    dueDate: dateToTimestamp("2026-05-05"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Josh and Emily — Copy Footage",
    dueDate: dateToTimestamp("2026-05-03"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Janie & James — Copy Footage",
    dueDate: dateToTimestamp("2026-05-10"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Frankie & Ben — Copy Footage",
    dueDate: dateToTimestamp("2026-05-20"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Martin & George — Copy Footage",
    dueDate: dateToTimestamp("2026-05-28"),
    priority: "critical" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  
  // === WEDDINGS — Highlights (HIGH priority) ===
  {
    title: "Sian & Brandon — Highlight",
    dueDate: dateToTimestamp("2026-04-08"),
    startDate: dateToTimestamp("2026-04-06"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Jodie & Carl — Highlight",
    dueDate: dateToTimestamp("2026-04-17"),
    startDate: dateToTimestamp("2026-04-07"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Joy & Garry — Highlight",
    dueDate: dateToTimestamp("2026-04-23"),
    startDate: dateToTimestamp("2026-04-08"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Sarah & Rebecca — Highlight",
    dueDate: dateToTimestamp("2026-04-25"),
    startDate: dateToTimestamp("2026-04-09"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Jennifer & Matthew — Highlight",
    dueDate: dateToTimestamp("2026-05-02"),
    startDate: dateToTimestamp("2026-04-18"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Leah & Reuben — Highlight",
    dueDate: dateToTimestamp("2026-05-12"),
    startDate: dateToTimestamp("2026-04-01"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Kirsty & George — Highlight",
    dueDate: dateToTimestamp("2026-05-09"),
    startDate: dateToTimestamp("2026-04-25"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Megan & Michael — Highlight",
    dueDate: dateToTimestamp("2026-05-07"),
    startDate: dateToTimestamp("2026-04-28"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Hannah & Gary — Highlight",
    dueDate: dateToTimestamp("2026-05-05"),
    startDate: dateToTimestamp("2026-05-02"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Madeleine & Daniel — Highlight",
    dueDate: dateToTimestamp("2026-04-25"),
    startDate: dateToTimestamp("2026-05-05"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Janie & James — Highlight",
    dueDate: dateToTimestamp("2026-04-22"),
    startDate: dateToTimestamp("2026-05-10"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Frankie & Ben — Highlight",
    dueDate: dateToTimestamp("2026-04-01"),
    startDate: dateToTimestamp("2026-05-20"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Martin & George — Highlight",
    dueDate: dateToTimestamp("2026-05-12"),
    startDate: dateToTimestamp("2026-05-28"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  
  // === WEDDINGS — Full Films (HIGH priority) ===
  {
    title: "Sian & Brandon — Full Film",
    dueDate: dateToTimestamp("2026-04-18"),
    startDate: dateToTimestamp("2026-04-06"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Jodie & Carl — Full Film",
    dueDate: dateToTimestamp("2026-03-28"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Joy & Garry — Full Film",
    dueDate: dateToTimestamp("2026-03-30"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Sarah & Rebecca — Full Film",
    dueDate: dateToTimestamp("2026-03-30"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Jennifer & Matthew — Full Film",
    dueDate: dateToTimestamp("2026-04-11"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Leah & Reuben — Full Film",
    dueDate: dateToTimestamp("2026-04-21"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Kirsty & George — Full Film",
    dueDate: dateToTimestamp("2026-04-25"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Megan & Michael — Full Film",
    dueDate: dateToTimestamp("2026-04-26"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Hannah & Gary — Full Film",
    dueDate: dateToTimestamp("2026-04-27"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Madeleine & Daniel — Full Film",
    dueDate: dateToTimestamp("2026-05-02"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Janie & James — Full Film",
    dueDate: dateToTimestamp("2026-05-05"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Frankie & Ben — Full Film",
    dueDate: dateToTimestamp("2026-05-15"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  {
    title: "Martin & George — Full Film",
    dueDate: dateToTimestamp("2026-05-23"),
    priority: "high" as const,
    deadlineType: "hard" as const,
    list: "weddings" as const,
  },
  
  // === WEDDINGS — QA & Send (NORMAL priority) ===
  {
    title: "Sophie — Post-Wedding Edits",
    dueDate: dateToTimestamp("2026-04-14"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Sian & Brandon — QA & Send",
    dueDate: dateToTimestamp("2026-04-18"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Jodie & Carl — QA & Send",
    dueDate: dateToTimestamp("2026-03-28"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Joy & Garry — QA & Send",
    dueDate: dateToTimestamp("2026-03-30"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Sarah & Rebecca — QA & Send",
    dueDate: dateToTimestamp("2026-03-30"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Jennifer & Matthew — QA & Send",
    dueDate: dateToTimestamp("2026-04-11"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Leah & Reuben — QA & Send",
    dueDate: dateToTimestamp("2026-04-21"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Kirsty & George — QA & Send",
    dueDate: dateToTimestamp("2026-04-25"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Megan & Michael — QA & Send",
    dueDate: dateToTimestamp("2026-04-26"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Hannah & Gary — QA & Send",
    dueDate: dateToTimestamp("2026-04-27"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Madeleine & Daniel — QA & Send",
    dueDate: dateToTimestamp("2026-05-02"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Josh and Emily — QA & Send",
    dueDate: dateToTimestamp("2026-05-22"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Janie & James — QA & Send",
    dueDate: dateToTimestamp("2026-05-05"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Frankie & Ben — QA & Send",
    dueDate: dateToTimestamp("2026-05-15"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
  {
    title: "Martin & George — QA & Send",
    dueDate: dateToTimestamp("2026-05-23"),
    priority: "medium" as const,
    deadlineType: "soft" as const,
    list: "weddings" as const,
  },
];

// Run seed
async function seed() {
  console.log(`Seeding ${tasks.length} tasks...\n`);
  
  for (const task of tasks) {
    await createTask(task);
    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 100));
  }
  
  console.log("\n✓ Done!");
}

seed().catch(console.error);
