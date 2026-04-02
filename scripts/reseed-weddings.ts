import fetch from "node-fetch";

const CONVEX_SITE_URL = "https://small-newt-543.eu-west-1.convex.site";

// Wedding dates and deliverable deadlines from ClickUp
const weddings = [
  { couple: "Leah & Reuben", weddingDate: "2026-03-31" },
  { couple: "Jodie & Carl", weddingDate: "2026-03-27" },
  { couple: "Joy & Garry", weddingDate: "2026-03-28" },
  { couple: "Sarah & Rebecca", weddingDate: "2026-03-29" },
  { couple: "Sian & Brandon", weddingDate: "2026-04-05" },
  { couple: "Jennifer & Matthew", weddingDate: "2026-04-12" },
  { couple: "Kirsty & George", weddingDate: "2026-04-19" },
  { couple: "Megan & Michael", weddingDate: "2026-04-26" },
  { couple: "Hannah & Gary", weddingDate: "2026-04-27" },
  { couple: "Madeleine & Daniel", weddingDate: "2026-05-03" },
  { couple: "Josh and Emily", weddingDate: "2026-05-16" },
  { couple: "Janie & James", weddingDate: "2026-05-10" },
  { couple: "Frankie & Ben", weddingDate: "2026-05-17" },
  { couple: "Martin & George", weddingDate: "2026-05-24" },
];

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
  list?: "weddings";
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

async function main() {
  console.log("Seeding wedding tasks with proper start dates...\n");
  
  for (const wedding of weddings) {
    const weddingTs = dateToTimestamp(wedding.weddingDate);
    const weddingDateObj = new Date(wedding.weddingDate);
    
    // Skip weddings that haven't happened yet
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weddingDateOnly = new Date(weddingDateObj);
    weddingDateOnly.setHours(0, 0, 0, 0);
    
    const alreadyHappened = weddingDateOnly <= today;
    
    // Copy Footage (Critical, Hard deadline, 1 day after wedding)
    if (alreadyHappened) {
      await createTask({
        title: `${wedding.couple} — Copy Footage`,
        startDate: weddingTs,
        dueDate: dateToTimestamp(addDays(weddingDateObj, 1)),
        priority: "critical",
        deadlineType: "hard",
        list: "weddings",
      });
      await new Promise(r => setTimeout(r, 50));
    }
    
    // Highlight (High priority, Hard deadline, ~10 days after wedding)
    if (alreadyHappened) {
      await createTask({
        title: `${wedding.couple} — Highlight`,
        startDate: weddingTs,
        dueDate: dateToTimestamp(addDays(weddingDateObj, 12)),
        priority: "high",
        deadlineType: "hard",
        list: "weddings",
      });
      await new Promise(r => setTimeout(r, 50));
    }
    
    // Full Film (High priority, Hard deadline, ~14 days after wedding)
    if (alreadyHappened) {
      await createTask({
        title: `${wedding.couple} — Full Film`,
        startDate: weddingTs,
        dueDate: dateToTimestamp(addDays(weddingDateObj, 14)),
        priority: "high",
        deadlineType: "hard",
        list: "weddings",
      });
      await new Promise(r => setTimeout(r, 50));
    }
    
    // QA & Send (Medium priority, Soft deadline)
    if (alreadyHappened) {
      await createTask({
        title: `${wedding.couple} — QA & Send`,
        startDate: weddingTs,
        dueDate: dateToTimestamp(addDays(weddingDateObj, 16)),
        priority: "medium",
        deadlineType: "soft",
        list: "weddings",
      });
      await new Promise(r => setTimeout(r, 50));
    }
  }
  
  console.log("\n✓ Wedding tasks seeded with start dates");
}

main().catch(console.error);
