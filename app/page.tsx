"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Filters - simplified
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<List | "all">("all");

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

  const listOptions: { value: List | "all"; emoji: string }[] = [
    { value: "all", emoji: "📋" },
    { value: "personal", emoji: "👤" },
    { value: "weddings", emoji: "💒" },
    { value: "house", emoji: "🏠" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Compact Header */}
        <div className="flex items-center gap-2 mb-4">
          {/* Search - 60% width on mobile, 40% on desktop */}
          <div className="flex-1 max-w-[60%] md:max-w-[40%]">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#141414] border-[#1f1f1f] text-sm h-8 text-[#fafafa] placeholder:text-[#a1a1a1] focus-visible:ring-[#5e5ce6]"
            />
          </div>
          
          {/* List tabs - small chips */}
          <div className="flex gap-1">
            {listOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={listFilter === option.value ? "default" : "ghost"}
                onClick={() => setListFilter(option.value)}
                className="h-7 px-2 text-xs"
              >
                {option.emoji}
              </Button>
            ))}
          </div>
        </div>

        {/* Active count */}
        <div className="text-xs text-[#a1a1a1] mb-4">
          {activeTasks} active tasks
        </div>

        {/* Add Task Form */}
        {showForm && (
          <div className="mb-4">
            <TaskForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Add Button */}
        {!showForm && !editingTaskId && (
          <div className="mb-4">
            <Button 
              onClick={() => setShowForm(true)} 
              className="w-full md:w-auto bg-[#5e5ce6] hover:bg-[#5e5ce6]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        )}

        {/* Task List */}
        {tasks === undefined ? (
          <div className="text-center py-12 text-[#a1a1a1]">
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
            statusFilter="all"
            priorityFilter="all"
          />
        )}

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-[#1f1f1f]">
          <p className="text-xs text-[#a1a1a1] mb-2">Priority Legend:</p>
          <div className="flex flex-wrap gap-3 text-xs text-[#a1a1a1]">
            <span>🔴 Critical + Hard Deadline</span>
            <span>🟠 High Priority</span>
            <span>🔵 Medium</span>
            <span>⚪ Low</span>
          </div>
          <div className="mt-2 text-xs text-[#a1a1a1]">
            <span className="font-semibold text-[#fafafa]">Bold dates</span> = Hard deadline
          </div>
        </div>
      </div>
    </div>
  );
}
