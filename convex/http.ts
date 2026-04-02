import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createTaskHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  const task = await ctx.runMutation(internal.tasks.createInternal, {
    title: body.title,
    description: body.description,
    dueDate: body.dueDate,
    startDate: body.startDate,
    priority: body.priority,
    deadlineType: body.deadlineType,
    list: body.list,
    status: body.status || "todo",
    order: body.order || Date.now(),
    createdBy: body.createdBy || "seed",
  });
  
  return new Response(JSON.stringify({ success: true, id: task }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const listTasksHttp = httpAction(async (ctx, request) => {
  const tasks = await ctx.runQuery(api.tasks.list);
  
  return new Response(JSON.stringify({ tasks }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const updateTaskHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  await ctx.runMutation(api.tasks.update, {
    id: body.id,
    startDate: body.startDate,
    dueDate: body.dueDate,
    priority: body.priority,
    deadlineType: body.deadlineType,
    status: body.status,
    title: body.title,
    description: body.description,
    list: body.list,
  });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

const http = httpRouter();
http.route({
  path: "/api/tasks/create",
  method: "POST",
  handler: createTaskHttp,
});
http.route({
  path: "/api/tasks/list",
  method: "POST",
  handler: listTasksHttp,
});
http.route({
  path: "/api/tasks/update",
  method: "POST",
  handler: updateTaskHttp,
});

export default http;
