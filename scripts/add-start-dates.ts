import fetch from "node-fetch";

const CONVEX_SITE_URL = "https://small-newt-543.eu-west-1.convex.site";

// Wedding dates extracted from ClickUp
const weddingDates: Record<string, string> = {
  "Leah & Reuben": "2026-03-31",
  "Jodie & Carl": "2026-03-27",
  "Joy & Garry": "2026-03-28",
  "Sarah & Rebecca": "2026-03-29",
  "Sian & Brandon": "2026-04-05",
  "Jennifer & Matthew": "2026-04-12",
  "Kirsty & George": "2026-04-19",
  "Megan & Michael": "2026-04-26",
  "Hannah & Gary": "2026-04-27",
  "Madeleine & Daniel": "2026-05-03",
  "Josh and Emily": "2026-05-16",
  "Janie & James": "2026-05-10",
  "Frankie & Ben": "2026-05-17",
  "Martin & George": "2026-05-24",
};

function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

async function main() {
  // First, get all tasks
  const listResponse = await fetch(`${CONVEX_SITE_URL}/api/tasks/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  if (!listResponse.ok) {
    const text = await listResponse.text();
    console.error("Failed to list tasks:", text);
    return;
  }
  
  const data = await listResponse.json();
  const tasks = data.tasks || [];
  
  console.log(`Found ${tasks.length} tasks\n`);
  
  // Filter wedding tasks that don't have start dates
  const weddingTasks = tasks.filter((t: any) => 
    t.list === "weddings" && !t.startDate
  );
  
  console.log(`Updating ${weddingTasks.length} wedding tasks with start dates...\n`);
  
  // Also update Highlight tasks that have start date but it might be wrong
  const highlightTasks = tasks.filter((t: any) => 
    t.list === "weddings" && t.title.includes("Highlight")
  );
  
  console.log(`Found ${highlightTasks.length} Highlight tasks to check...\n`);
  
  for (const task of weddingTasks) {
    // Extract couple name from task title
    const couple = Object.keys(weddingDates).find(c => task.title.includes(c));
    
    if (!couple) {
      console.log(`⚠ No wedding date for: ${task.title}`);
      continue;
    }
    
    const weddingTs = dateToTimestamp(weddingDates[couple]);
    
    // Update the task with start date
    const updateResponse = await fetch(`${CONVEX_SITE_URL}/api/tasks/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task._id,
        startDate: weddingTs,
      }),
    });
    
    if (updateResponse.ok) {
      console.log(`✓ ${task.title} → ${weddingDates[couple]}`);
    } else {
      console.log(`✗ Failed: ${task.title}`);
    }
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log("\n✓ Done!");
}

main().catch(console.error);
