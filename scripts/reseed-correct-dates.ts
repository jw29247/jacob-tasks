import fetch from "node-fetch";

const CONVEX_SITE_URL = "https://small-newt-543.eu-west-1.convex.site";

// CORRECT wedding dates from ClickUp
const weddings = [
  { couple: "Sian & Brandon", weddingDate: "2026-03-28" },
  { couple: "Jodie & Carl", weddingDate: "2026-05-07" },
  { couple: "Joy & Garry", weddingDate: "2026-05-13" },
  { couple: "Sarah & Rebecca", weddingDate: "2026-05-15" },
  { couple: "Jennifer & Matthew", weddingDate: "2026-05-17" },
  { couple: "Leah & Reuben", weddingDate: "2026-05-29" },
  { couple: "Kirsty & George", weddingDate: "2026-06-27" },
  { couple: "Megan & Michael", weddingDate: "2026-07-24" },
  { couple: "Hannah & Gary", weddingDate: "2026-07-25" },
  { couple: "Madeleine & Daniel", weddingDate: "2026-08-07" },
  { couple: "Josh and Emily", weddingDate: "2026-08-26" },
  { couple: "Janie & James", weddingDate: "2026-09-08" },
  { couple: "Frankie & Ben", weddingDate: "2026-09-18" },
  { couple: "Martin & George", weddingDate: "2026-10-28" },
];

// Deliverable timelines (days relative to wedding)
const deliverables: Record<string, { daysAfter: number; priority: "critical" | "high" | "medium"; deadline: "hard" | "soft" }> = {
  "Copy Footage": { daysAfter: 2, priority: "critical", deadline: "hard" },
  "Highlight": { daysAfter: 13, priority: "high", deadline: "hard" },
  "Full": { daysAfter: 55, priority: "high", deadline: "hard" },
  "QA & Send": { daysAfter: 55, priority: "medium", deadline: "soft" },
};

function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}

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
      createdBy: "reseed",
    }),
  });
  
  if (!response.ok) {
    console.error(`Failed: ${task.title}`);
    return null;
  }
  
  console.log(`✓ ${task.title}`);
  return response.json();
}

async function listTasks() {
  const response = await fetch(`${CONVEX_SITE_URL}/api/tasks/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  const data = await response.json();
  return data.tasks || [];
}

async function deleteTask(id: string) {
  await fetch(`${CONVEX_SITE_URL}/api/tasks/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

async function main() {
  console.log("Clearing existing tasks...\n");
  
  // Get all existing tasks
  const existing = await listTasks();
  console.log(`Found ${existing.length} tasks to delete\n`);
  
  // Delete all
  for (const task of existing) {
    await deleteTask(task._id);
  }
  
  console.log("✓ All tasks deleted\n");
  console.log("Seeding with correct ClickUp data...\n");
  
  // Seed non-wedding tasks
  const otherTasks = [
    { title: "Reply to Pippa", dueDate: dateToTimestamp("2026-04-02"), priority: "critical" as const, deadlineType: "hard" as const, list: "personal" as const, description: "Reply tonight" },
    { title: "Prepare tools for downstairs toilet", dueDate: dateToTimestamp("2026-04-02"), priority: "critical" as const, deadlineType: "hard" as const, list: "house" as const, description: "Get all tools ready for tomorrow's work" },
    { title: "Pack for Maldives", dueDate: dateToTimestamp("2026-04-07"), priority: "high" as const, deadlineType: "soft" as const, list: "personal" as const, description: "Honeymoon packing — passport, tickets, clothes" },
    { title: "File JAW Media company accounts", dueDate: dateToTimestamp("2026-10-30"), priority: "high" as const, deadlineType: "hard" as const, list: "personal" as const },
    { title: "Drone flyer and operator ID update", dueDate: dateToTimestamp("2026-03-27"), priority: "medium" as const, deadlineType: "soft" as const, list: "personal" as const },
    { title: "Check HMRC fine", priority: "high" as const, deadlineType: "hard" as const, list: "personal" as const, description: "Check if there's an HMRC fine and resolve" },
    { title: "Tax return", priority: "high" as const, deadlineType: "hard" as const, list: "personal" as const, description: "Complete and submit tax return" },
    { title: "Finish tidying garage", priority: "medium" as const, deadlineType: "soft" as const, list: "house" as const, description: "Several hours (3-5 hrs) — split across sessions" },
    { title: "Tidy junk bedroom", priority: "medium" as const, deadlineType: "soft" as const, list: "house" as const, description: "~1 hour" },
    { title: "Build extra chairs", dueDate: dateToTimestamp("2026-03-20"), priority: "medium" as const, deadlineType: "soft" as const, list: "house" as const },
    { title: "Living spotlights and soles", dueDate: dateToTimestamp("2026-03-31"), priority: "medium" as const, deadlineType: "soft" as const, list: "house" as const },
    { title: "Organise hangers for suits (Healing Manor)", dueDate: dateToTimestamp("2026-05-25"), priority: "low" as const, deadlineType: "soft" as const, list: "personal" as const, description: "~1 hour — plenty of time before wedding" },
    { title: "Sophie — Post-Wedding Edits", dueDate: dateToTimestamp("2026-04-06"), priority: "medium" as const, deadlineType: "soft" as const, list: "weddings" as const },
  ];
  
  for (const task of otherTasks) {
    await createTask(task);
    await new Promise(r => setTimeout(r, 50));
  }
  
  // Seed wedding tasks with CORRECT dates from ClickUp
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const wedding of weddings) {
    const weddingTs = dateToTimestamp(wedding.weddingDate);
    const weddingDateObj = new Date(wedding.weddingDate);
    
    // Only create tasks for weddings that have happened
    const alreadyHappened = weddingDateObj <= today;
    
    if (!alreadyHappened) {
      console.log(`⊘ ${wedding.couple} — Wedding not yet happened (${wedding.weddingDate})`);
      continue;
    }
    
    for (const [deliverable, config] of Object.entries(deliverables)) {
      const dueDate = addDays(weddingDateObj, config.daysAfter);
      const dueTs = dateToTimestamp(dueDate);
      
      await createTask({
        title: `${wedding.couple} — ${deliverable}`,
        startDate: weddingTs,
        dueDate: dueTs,
        priority: config.priority,
        deadlineType: config.deadline,
        list: "weddings",
      });
      
      await new Promise(r => setTimeout(r, 50));
    }
  }
  
  console.log("\n✓ Done!");
}

main().catch(console.error);