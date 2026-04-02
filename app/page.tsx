"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TaskCard } from "@/components/TaskCard";
import { TaskForm } from "@/components/TaskForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Task } from "@/types/task";

export default function Home() {
  const tasks = useQuery(api.tasks.list);
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.remove);
  const toggleComplete = useMutation(api.tasks.toggleComplete);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreate = async (data: {
    title: string;
    description?: string;
    dueDate?: number;
    priority: "critical" | "high" | "medium" | "low";
    deadlineType: "hard" | "soft";
  }) => {
    await createTask({ ...data, createdBy: "web" });
    setShowForm(false);
  };

  const handleUpdate = async (data: {
    title: string;
    description?: string;
    dueDate?: number;
    priority: "critical" | "high" | "medium" | "low";
    deadlineType: "hard" | "soft";
  }) => {
    if (!editingTask) return;
    await updateTask({
      id: editingTask._id as Id<"tasks">,
      ...data,
    });
    setEditingTask(null);
  };

  const handleDelete = async (id: string) => {
    await deleteTask({ id: id as Id<"tasks"> });
  };

  const handleToggle = async (id: string) => {
    await toggleComplete({ id: id as Id<"tasks"> });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Jacob&apos;s Tasks
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            {tasks?.filter((t: Task) => t.status !== "done").length || 0} tasks remaining
          </p>
        </div>

        {/* Add Task Form */}
        {showForm && !editingTask && (
          <div className="mb-6">
            <TaskForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Edit Task Form */}
        {editingTask && (
          <div className="mb-6">
            <TaskForm
              initialData={editingTask}
              onSubmit={handleUpdate}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        )}

        {/* Add Button */}
        {!showForm && !editingTask && (
          <div className="mb-6">
            <Button
              onClick={() => setShowForm(true)}
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
          {tasks === undefined ? (
            <div className="text-center py-12 text-slate-500">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">✨</div>
              <p>No tasks yet. Add one above!</p>
            </div>
          ) : (
            tasks.map((task: Task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={handleToggle}
                onEdit={setEditingTask}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2">Priority Legend:</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span>🔴 Critical + Hard Deadline</span>
            <span>🟠 High Priority</span>
            <span>🔵 Medium</span>
            <span>⚪ Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
