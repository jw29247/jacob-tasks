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
    timeEstimate: body.timeEstimate,
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

export const getTaskHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  const task = await ctx.runQuery(api.tasks.get, { id: body.id });
  
  return new Response(JSON.stringify({ task }), {
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
    order: body.order,
    timeEstimate: body.timeEstimate,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const deleteTaskHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  await ctx.runMutation(api.tasks.remove, { id: body.id });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const toggleTaskHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  await ctx.runMutation(api.tasks.toggleComplete, { id: body.id });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const bulkUpdateStatusHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  await ctx.runMutation(api.tasks.bulkUpdateStatus, {
    ids: body.ids,
    status: body.status,
  });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const bulkUpdatePriorityHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  await ctx.runMutation(api.tasks.bulkUpdatePriority, {
    ids: body.ids,
    priority: body.priority,
  });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const bulkUpdateListHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  await ctx.runMutation(api.tasks.bulkUpdateList, {
    ids: body.ids,
    list: body.list,
  });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const bulkDeleteHttp = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  await ctx.runMutation(api.tasks.bulkDelete, { ids: body.ids });
  
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
  path: "/api/tasks/get",
  method: "POST",
  handler: getTaskHttp,
});
http.route({
  path: "/api/tasks/update",
  method: "POST",
  handler: updateTaskHttp,
});
http.route({
  path: "/api/tasks/delete",
  method: "POST",
  handler: deleteTaskHttp,
});
http.route({
  path: "/api/tasks/toggle",
  method: "POST",
  handler: toggleTaskHttp,
});
http.route({
  path: "/api/tasks/bulk/status",
  method: "POST",
  handler: bulkUpdateStatusHttp,
});
http.route({
  path: "/api/tasks/bulk/priority",
  method: "POST",
  handler: bulkUpdatePriorityHttp,
});
http.route({
  path: "/api/tasks/bulk/list",
  method: "POST",
  handler: bulkUpdateListHttp,
});
http.route({
  path: "/api/tasks/bulk/delete",
  method: "POST",
  handler: bulkDeleteHttp,
});

export default http;
