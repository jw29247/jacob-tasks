import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
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
    status: v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done")),
    list: v.optional(v.union(
      v.literal("personal"),
      v.literal("weddings"),
      v.literal("house")
    )),
    order: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_due_date", ["dueDate"])
    .index("by_created", ["createdAt"])
    .index("by_list", ["list"])
    .index("by_order", ["order"]),
});
