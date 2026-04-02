/**
 * Task Manager API - Used by Henry for heartbeat task management
 * 
 * Base URL: https://small-newt-543.eu-west-1.convex.site
 * 
 * All endpoints accept POST with JSON body.
 */

const CONVEX_SITE_URL = "https://small-newt-543.eu-west-1.convex.site";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  dueDate?: number;
  startDate?: number;
  priority: "critical" | "high" | "medium" | "low";
  deadlineType: "hard" | "soft";
  status: "todo" | "in-progress" | "done";
  list?: "personal" | "weddings" | "house";
  order: number;
  createdAt: number;
  createdBy?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: number;
  startDate?: number;
  priority: "critical" | "high" | "medium" | "low";
  deadlineType: "hard" | "soft";
  list?: "personal" | "weddings" | "house";
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  dueDate?: number;
  startDate?: number;
  priority?: "critical" | "high" | "medium" | "low";
  deadlineType?: "hard" | "soft";
  status?: "todo" | "in-progress" | "done";
  list?: "personal" | "weddings" | "house";
}

/**
 * List all tasks
 */
export async function listTasks(): Promise<Task[]> {
  const response = await fetch(`${CONVEX_SITE_URL}/api/tasks/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list tasks: ${response.status}`);
  }
  
  const data = await response.json();
  return data.tasks || [];
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<string> {
  const response = await fetch(`${CONVEX_SITE_URL}/api/tasks/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      status: "todo",
      order: Date.now(),
      createdBy: "henry",
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.status}`);
  }
  
  const data = await response.json();
  return data.id;
}

/**
 * Update an existing task
 */
export async function updateTask(input: UpdateTaskInput): Promise<void> {
  const response = await fetch(`${CONVEX_SITE_URL}/api/tasks/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.status}`);
  }
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${CONVEX_SITE_URL}/api/tasks/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.status}`);
  }
}

/**
 * Toggle task completion
 */
export async function toggleTask(id: string): Promise<void> {
  const response = await fetch(`${CONVEX_SITE_URL}/api/tasks/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to toggle task: ${response.status}`);
  }
}

/**
 * Bulk update tasks
 */
export async function bulkUpdateTasks(ids: string[], updates: Partial<Task>): Promise<void> {
  const response = await fetch(`${CONVEX_SITE_URL}/api/tasks/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, updates }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to bulk update tasks: ${response.status}`);
  }
}

// Helper to convert date string to timestamp
export function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

// Helper to format timestamp for display
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
