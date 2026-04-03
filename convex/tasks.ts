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

// UK Bank Holidays calculation
const getEasterSunday = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

const getFirstMonday = (year: number, month: number): Date => {
  const date = new Date(year, month, 1);
  const day = date.getDay();
  const offset = day === 1 ? 0 : (8 - day) % 7;
  return new Date(year, month, 1 + offset);
};

const getLastMonday = (year: number, month: number): Date => {
  const lastDay = new Date(year, month + 1, 0);
  const day = lastDay.getDay();
  const offset = day === 1 ? 0 : (day - 1);
  return new Date(year, month, lastDay.getDate() - offset);
};

const isBankHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const holidays: Date[] = [];
  
  // New Year's Day
  const newYear = new Date(year, 0, 1);
  holidays.push(newYear);
  
  // Good Friday & Easter Monday
  const easter = getEasterSunday(year);
  holidays.push(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2));
  holidays.push(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1));
  
  // Early May Bank Holiday (first Monday in May)
  holidays.push(getFirstMonday(year, 4));
  
  // Spring Bank Holiday (last Monday in May)
  holidays.push(getLastMonday(year, 4));
  
  // Summer Bank Holiday (last Monday in August)
  holidays.push(getLastMonday(year, 7));
  
  // Christmas Day & Boxing Day
  holidays.push(new Date(year, 11, 25));
  holidays.push(new Date(year, 11, 26));
  
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return holidays.some(h => {
    const hStr = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
    return hStr === dateStr;
  });
};

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
    
    // Calculate available hours per day (including bank holidays)
    const getAvailableHours = (date: Date) => {
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Bank holidays treated like weekends (9 hours)
      if (isBankHoliday(date)) return 9;
      
      // Weekend: 9am-6pm = 9 hours
      if (day === 0 || day === 6) return 9;
      // Weekday: 4pm-8pm = 4 hours
      return 4;
    };
    
    // Schedule tasks
    const schedule = [];
    let currentDay = new Date(now);
    currentDay.setHours(0, 0, 0, 0);
    
    // Determine if today is still available for work
    const currentHour = new Date(now).getHours();
    const currentDayOfWeek = currentDay.getDay();
    const todayIsBankHoliday = isBankHoliday(currentDay);
    
    // Weekend/bank holiday: 9am-6pm, Weekday: 4pm-8pm
    // Skip to next day if past working hours
    const isWeekendOrHoliday = currentDayOfWeek === 0 || currentDayOfWeek === 6 || todayIsBankHoliday;
    if (isWeekendOrHoliday) {
      // Weekend/bank holiday: work until 6pm
      if (currentHour >= 18) {
        currentDay.setDate(currentDay.getDate() + 1);
      }
    } else {
      // Weekday: work from 4pm-8pm
      if (currentHour >= 20 || currentHour < 16) {
        currentDay.setDate(currentDay.getDate() + 1);
      }
    }
    
    // Track remaining hours for each day
    const dayCapacity = new Map<string, number>();
    
    const getCapacityKey = (date: Date) => {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };
    
    const getRemainingHours = (date: Date) => {
      const key = getCapacityKey(date);
      if (!dayCapacity.has(key)) {
        dayCapacity.set(key, getAvailableHours(date));
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

// Get bank holiday info for today
export const getBankHolidayInfo = query({
  handler: async (ctx) => {
    const now = new Date();
    const year = now.getFullYear();
    
    // Get bank holidays for this year
    const holidays = getUKBankHolidays(year);
    
    // Check if today is a bank holiday
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayHoliday = holidays.find(h => {
      const hStr = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, '0')}-${String(h.date.getDate()).padStart(2, '0')}`;
      return hStr === todayStr;
    });
    
    return {
      isBankHoliday: !!todayHoliday,
      name: todayHoliday?.name || null,
      year: year
    };
  },
});

// Helper to get UK bank holidays for a year
function getUKBankHolidays(year: number): { date: Date; name: string }[] {
  const holidays: { date: Date; name: string }[] = [];
  
  // New Year's Day
  holidays.push({ date: new Date(year, 0, 1), name: "New Year's Day" });
  
  // Good Friday & Easter Monday
  const easter = getEasterSunday(year);
  holidays.push({ date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2), name: "Good Friday" });
  holidays.push({ date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1), name: "Easter Monday" });
  
  // Early May Bank Holiday (first Monday in May)
  holidays.push({ date: getFirstMonday(year, 4), name: "Early May Bank Holiday" });
  
  // Spring Bank Holiday (last Monday in May)
  holidays.push({ date: getLastMonday(year, 4), name: "Spring Bank Holiday" });
  
  // Summer Bank Holiday (last Monday in August)
  holidays.push({ date: getLastMonday(year, 7), name: "Summer Bank Holiday" });
  
  // Christmas Day & Boxing Day
  holidays.push({ date: new Date(year, 11, 25), name: "Christmas Day" });
  holidays.push({ date: new Date(year, 11, 26), name: "Boxing Day" });
  
  return holidays;
}
