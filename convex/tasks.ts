import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal mutation for HTTP API
export const createInternal = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    deadlineType: v.union(v.literal("hard"), v.literal("soft")),
    list: v.optional(v.union(
      v.literal("personal"),
      v.literal("weddings"),
      v.literal("house")
    )),
    status: v.optional(v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done"))),
    order: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      startDate: args.startDate,
      priority: args.priority,
      deadlineType: args.deadlineType,
      list: args.list,
      order: args.order ?? Date.now(),
      status: args.status ?? "todo",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

// Create a new task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    deadlineType: v.union(v.literal("hard"), v.literal("soft")),
    list: v.optional(v.union(
      v.literal("personal"),
      v.literal("weddings"),
      v.literal("house")
    )),
    order: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      startDate: args.startDate,
      priority: args.priority,
      deadlineType: args.deadlineType,
      list: args.list,
      order: args.order ?? Date.now(),
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
    startDate: v.optional(v.number()),
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
    list: v.optional(v.union(
      v.literal("personal"),
      v.literal("weddings"),
      v.literal("house")
    )),
    order: v.optional(v.number()),
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
    const now = Date.now();
    
    type TaskDoc = typeof tasks[0];
    
    const getUrgencyScore = (task: TaskDoc): number => {
      // Completed tasks at bottom
      if (task.status === "done") return -50000;
      
      // Not yet started
      if (task.startDate && task.startDate > now) return -10000;
      
      // Overdue
      if (task.dueDate && task.dueDate < now) {
        const daysOverdue = (now - task.dueDate) / (1000 * 60 * 60 * 24);
        return 100000 - daysOverdue * 100;
      }
      
      // Normal scoring
      const priorityBase = { critical: 4000, high: 3000, medium: 2000, low: 1000 };
      const deadlineMult = { hard: 1.5, soft: 1.0 };
      
      let score = priorityBase[task.priority] * deadlineMult[task.deadlineType];
      
      if (task.dueDate) {
        const daysUntilDue = (task.dueDate - now) / (1000 * 60 * 60 * 24);
        score += 5000 * Math.exp(-Math.max(0, daysUntilDue) / 5);
      }
      
      return score;
    };
    
    return tasks.sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
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

// Bulk update status
export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("tasks")),
    status: v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { status: args.status });
    }
  },
});

// Bulk update priority
export const bulkUpdatePriority = mutation({
  args: {
    ids: v.array(v.id("tasks")),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { priority: args.priority });
    }
  },
});

// Bulk update list
export const bulkUpdateList = mutation({
  args: {
    ids: v.array(v.id("tasks")),
    list: v.optional(v.union(
      v.literal("personal"),
      v.literal("weddings"),
      v.literal("house")
    )),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { list: args.list });
    }
  },
});

// Bulk delete
export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

// Update task order
export const updateOrder = mutation({
  args: {
    id: v.id("tasks"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { order: args.order });
  },
});
