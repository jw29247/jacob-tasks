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
    timeEstimate: v.optional(v.number()),
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
      timeEstimate: args.timeEstimate,
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
    timeEstimate: v.optional(v.number()),
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
      timeEstimate: args.timeEstimate,
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
    timeEstimate: v.optional(v.number()),
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
      
      // Fallback due dates for scoring (if not set)
      const fallbackDays = { critical: 3, high: 7, medium: 14, low: 28 };
      const effectiveDueDate = task.dueDate ?? (now + fallbackDays[task.priority] * 24 * 60 * 60 * 1000);
      
      // Overdue
      if (effectiveDueDate < now) {
        const daysOverdue = (now - effectiveDueDate) / (1000 * 60 * 60 * 24);
        return 100000 - daysOverdue * 100;
      }
      
      // Normal scoring
      const priorityBase = { critical: 4000, high: 3000, medium: 2000, low: 1000 };
      const deadlineMult = { hard: 1.5, soft: 1.0 };
      
      let score = priorityBase[task.priority] * deadlineMult[task.deadlineType];
      
      const daysUntilDue = (effectiveDueDate - now) / (1000 * 60 * 60 * 24);
      score += 5000 * Math.exp(-Math.max(0, daysUntilDue) / 5);
      
      // Time pressure: if due date is close and task is large, prioritize higher
      const hoursOfWork = (task.timeEstimate || 60) / 60; // convert to hours
      const hoursUntilDue = (effectiveDueDate - now) / (1000 * 60 * 60);
      
      // If work exceeds available time, boost urgency significantly
      if (hoursUntilDue > 0 && hoursOfWork > hoursUntilDue * 0.5) {
        // Task needs significant portion of remaining time
        score += (hoursOfWork / hoursUntilDue) * 500;
      }
      
      return score;
    };
    
    return tasks.sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
  },
});

// Get schedule with predicted completion dates
export const getSchedule = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    const now = Date.now();
    
    type TaskDoc = typeof tasks[0];
    
    // Define getUrgencyScore for sorting
    const getUrgencyScore = (task: TaskDoc): number => {
      if (task.status === "done") return -50000;
      if (task.startDate && task.startDate > now) return -10000;
      
      const fallbackDays = { critical: 3, high: 7, medium: 14, low: 28 };
      const effectiveDueDate = task.dueDate ?? (now + fallbackDays[task.priority] * 24 * 60 * 60 * 1000);
      
      if (effectiveDueDate < now) {
        const daysOverdue = (now - effectiveDueDate) / (1000 * 60 * 60 * 24);
        return 100000 - daysOverdue * 100;
      }
      
      const priorityBase = { critical: 4000, high: 3000, medium: 2000, low: 1000 };
      const deadlineMult = { hard: 1.5, soft: 1.0 };
      
      let score = priorityBase[task.priority] * deadlineMult[task.deadlineType];
      
      const daysUntilDue = (effectiveDueDate - now) / (1000 * 60 * 60 * 24);
      score += 5000 * Math.exp(-Math.max(0, daysUntilDue) / 5);
      
      const hoursOfWork = (task.timeEstimate || 60) / 60;
      const hoursUntilDueCalc = (effectiveDueDate - now) / (1000 * 60 * 60);
      
      if (hoursUntilDueCalc > 0 && hoursOfWork > hoursUntilDueCalc * 0.5) {
        score += (hoursOfWork / hoursUntilDueCalc) * 500;
      }
      
      return score;
    };
    
    // Filter to non-completed tasks, already sorted by urgency
    const activeTasks = tasks
      .filter(t => t.status !== "done")
      .sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
    
    // Calculate available hours per day
    const getAvailableHours = (date: Date) => {
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Weekend: 9am-6pm = 9 hours
      if (day === 0 || day === 6) return 9;
      // Weekday: 4pm-8pm = 4 hours
      return 4;
    };
    
    // Schedule tasks
    const schedule = [];
    let currentDay = new Date(now);
    currentDay.setHours(0, 0, 0, 0);
    
    // Skip to next available day if past working hours
    const currentHour = new Date(now).getHours();
    const currentDayOfWeek = currentDay.getDay();
    if (currentHour >= 20 || (currentHour < 16 && currentDayOfWeek >= 1 && currentDayOfWeek <= 5)) {
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    // Track remaining hours for each day
    const dayCapacity = new Map<string, number>();
    
    const getCapacityKey = (date: Date) => {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };
    
    const getRemainingHours = (date: Date) => {
      const key = getCapacityKey(date);
      if (!dayCapacity.has(key)) {
        const day = date.getDay();
        dayCapacity.set(key, day === 0 || day === 6 ? 9 : 4);
      }
      return dayCapacity.get(key)!;
    };
    
    for (const task of activeTasks) {
      const hoursNeeded = (task.timeEstimate || 60) / 60;
      let hoursRemaining = hoursNeeded;
      const taskStartDate = new Date(currentDay);
      let taskEndDate: Date | null = null;
      let workingDay = new Date(currentDay);
      
      while (hoursRemaining > 0) {
        let available = getRemainingHours(workingDay);
        
        if (available > 0) {
          const hoursToWork = Math.min(hoursRemaining, available);
          hoursRemaining -= hoursToWork;
          available -= hoursToWork;
          
          // Update capacity
          dayCapacity.set(getCapacityKey(workingDay), available);
          
          taskEndDate = new Date(workingDay);
        }
        
        // Only move to next day if current day is exhausted
        if (getRemainingHours(workingDay) <= 0) {
          workingDay.setDate(workingDay.getDate() + 1);
        }
      }
      
      // Update currentDay for next task
      currentDay = new Date(workingDay);
      
      schedule.push({
        task,
        predictedStartDate: taskStartDate.getTime(),
        predictedEndDate: taskEndDate!.getTime(),
        willMissDeadline: task.dueDate ? taskEndDate!.getTime() > task.dueDate : false,
        deadlineType: task.deadlineType
      });
    }
    
    return schedule;
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
