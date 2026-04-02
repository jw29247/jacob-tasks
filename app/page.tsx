"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TaskForm } from "@/components/TaskForm";
import { TaskFilters } from "@/components/TaskFilters";
import { TaskList } from "@/components/TaskList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";

export default function Home() {
  const tasks = useQuery(api.tasks.list);
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.remove);
  const toggleComplete = useMutation(api.tasks.toggleComplete);

  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<List | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");

  const handleCreate = async (data: {
    title: string;
    description?: string;
    dueDate?: number;
    startDate?: number;
    priority: Priority;
    deadlineType: DeadlineType;
    list?: List;
  }) => {
    await createTask({ ...data, createdBy: "web" });
    setShowForm(false);
  };

  const handleEdit = async (task: Task, data: {
    title: string;
    description?: string;
    dueDate?: number;
    startDate?: number;
    priority: Priority;
    deadlineType: DeadlineType;
    list?: List;
    status: Status;
  }) => {
    await updateTask({
      id: task._id as Id<"tasks">,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      startDate: data.startDate,
      priority: data.priority,
      deadlineType: data.deadlineType,
      list: data.list,
      status: data.status,
    });
    setEditingTaskId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this task?")) {
      await deleteTask({ id: id as Id<"tasks"> });
    }
  };

  const handleToggle = async (id: string) => {
    await toggleComplete({ id: id as Id<"tasks"> });
  };

  // Count active tasks
  const activeTasks = tasks?.filter((t: Task) => t.status !== "done").length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Jacob&apos;s Tasks
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            {activeTasks} active tasks
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters
            search={search}
            onSearchChange={setSearch}
            listFilter={listFilter}
            onListFilterChange={setListFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
          />
        </div>

        {/* Add Task Form */}
        {showForm && (
          <div className="mb-6">
            <TaskForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Add Button */}
        {!showForm && !editingTaskId && (
          <div className="mb-6">
            <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        )}

        {/* Task List */}
        {tasks === undefined ? (
          <div className="text-center py-12 text-slate-500">
            Loading tasks...
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
            search={search}
            listFilter={listFilter}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
          />
        )}

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2">Priority Legend:</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span>🔴 Critical + Hard Deadline</span>
            <span>🟠 High Priority</span>
            <span>🔵 Medium</span>
            <span>⚪ Low</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span className="font-semibold">Bold dates</span> = Hard deadline
          </div>
        </div>
      </div>
    </div>
  );
}
