import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    deadlineType: v.union(v.literal("hard"), v.literal("soft")),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      priority: args.priority,
      deadlineType: args.deadlineType,
      status: "todo",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

// Update a task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.optional(
      v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    deadlineType: v.optional(v.union(v.literal("hard"), v.literal("soft"))),
    status: v.optional(v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete a task
export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Toggle task completion
export const toggleComplete = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    
    const newStatus = task.status === "done" ? "todo" : "done";
    await ctx.db.patch(args.id, { status: newStatus });
  },
});

// Get all tasks sorted by urgency
export const list = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    
    // Sort by urgency
    const now = Date.now();
    
    type TaskDoc = typeof tasks[0];
    
    return tasks.sort((a: TaskDoc, b: TaskDoc) => {
      // Completed tasks at the bottom
      if (a.status === "done" && b.status !== "done") return 1;
      if (b.status === "done" && a.status !== "done") return -1;
      
      // Calculate urgency scores
      const getUrgencyScore = (task: typeof tasks[0]) => {
        let score = 0;
        
        // Overdue tasks get highest priority
        if (task.dueDate && task.dueDate < now && task.status !== "done") {
          return 10000 + (task.dueDate - now) / 1000000; // More overdue = higher
        }
        
        // Critical + Hard deadline = highest urgency (score 5000)
        if (task.priority === "critical" && task.deadlineType === "hard") {
          score = 5000;
        }
        // Critical + Soft deadline = high urgency (score 4000)
        else if (task.priority === "critical" && task.deadlineType === "soft") {
          score = 4000;
        }
        // High + Hard deadline = high urgency (score 4000)
        else if (task.priority === "high" && task.deadlineType === "hard") {
          score = 4000;
        }
        // High + Soft deadline
        else if (task.priority === "high" && task.deadlineType === "soft") {
          score = 3000;
        }
        // Medium
        else if (task.priority === "medium") {
          score = 2000;
        }
        // Low
        else {
          score = 1000;
        }
        
        // Add due date factor (closer due date = higher priority)
        if (task.dueDate && task.dueDate > now) {
          const daysUntilDue = (task.dueDate - now) / (1000 * 60 * 60 * 24);
          score += Math.max(0, 100 - daysUntilDue * 10);
        }
        
        return score;
      };
      
      return getUrgencyScore(b) - getUrgencyScore(a);
    });
  },
});

// Get a single task
export const get = query({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
