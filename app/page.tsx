"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Plane } from "lucide-react";
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";

// Maldives travel dates
const MALDIVES_START = new Date("2026-04-18T00:00:00Z").getTime();
const MALDIVES_END = new Date("2026-05-04T23:59:59Z").getTime();

type TravelFilter =
  | "all"
  | "pre-maldives"
  | "during-maldives"
  | "post-maldives";

export default function Home() {
  const schedule = useQuery(api.tasks.getSchedule);
  const bankHolidayInfo = useQuery(api.tasks.getBankHolidayInfo);
  const tasks = schedule?.map((s) => s.task);
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.remove);
  const toggleComplete = useMutation(api.tasks.toggleComplete);

  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<List | "all">("all");
  const [travelFilter, setTravelFilter] = useState<TravelFilter>("all");

  // Classify task relative to Maldives trip
  const getTravelPeriod = (
    dueDate?: number,
  ): "pre" | "during" | "post" | "none" => {
    if (!dueDate) return "none";
    if (dueDate < MALDIVES_START) return "pre";
    if (dueDate >= MALDIVES_START && dueDate <= MALDIVES_END) return "during";
    return "post";
  };

  // Filter tasks by travel period
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task: Task) => {
      const period = getTravelPeriod(task.dueDate);
      if (travelFilter === "all") return true;
      if (travelFilter === "pre-maldives") return period === "pre";
      if (travelFilter === "during-maldives") return period === "during";
      if (travelFilter === "post-maldives") return period === "post";
      return true;
    });
  }, [tasks, travelFilter]);

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

  const handleEdit = async (
    task: Task,
    data: {
      title: string;
      description?: string;
      dueDate?: number;
      startDate?: number;
      priority: Priority;
      deadlineType: DeadlineType;
      list?: List;
      status: Status;
    },
  ) => {
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

  // Count active tasks by travel period
  const activeTasks =
    filteredTasks?.filter((t: Task) => t.status !== "done").length || 0;

  // Check for missed deadlines
  const hardDeadlinesMissed =
    schedule?.filter((s) => s.willMissDeadline && s.deadlineType === "hard") ||
    [];
  const softDeadlinesMissed =
    schedule?.filter((s) => s.willMissDeadline && s.deadlineType === "soft") ||
    [];

  const listOptions: { value: List | "all"; emoji: string }[] = [
    { value: "all", emoji: "📋" },
    { value: "personal", emoji: "👤" },
    { value: "weddings", emoji: "💒" },
    { value: "house", emoji: "🏠" },
  ];

  const travelOptions: { value: TravelFilter; label: string; emoji: string }[] =
    [
      { value: "all", label: "All Tasks", emoji: "📋" },
      { value: "pre-maldives", label: "Pre-Maldives", emoji: "✈️" },
      { value: "during-maldives", label: "During Trip", emoji: "🏝️" },
      { value: "post-maldives", label: "Post-Maldives", emoji: "🌴" },
    ];

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

  const maldivesDatesStr = `${formatDate(MALDIVES_START)} – ${formatDate(MALDIVES_END)}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Maldives Travel Banner */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-100 px-4 py-3 rounded mb-4">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-cyan-400" />
            <div>
              <strong>Maldives Trip: {maldivesDatesStr}</strong>
              <div className="text-xs text-cyan-300/80 mt-0.5">
                Tasks due before {formatDate(MALDIVES_START)} are Pre-Maldives
                (priority). Tasks due after {formatDate(MALDIVES_END)} are
                Post-Maldives (plenty of time).
              </div>
            </div>
          </div>
        </div>

        {/* Bank Holiday Banner */}
        {bankHolidayInfo?.isBankHoliday && (
          <div className="bg-purple-500/20 border border-purple-500 text-purple-200 px-4 py-3 rounded mb-4">
            🎉 <strong>{bankHolidayInfo.name}</strong> — Bank Holiday (9 hours
            available)
          </div>
        )}

        {/* Warning Banners */}
        {hardDeadlinesMissed.length > 0 && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            ⚠️{" "}
            <strong>
              {hardDeadlinesMissed.length} tasks will miss hard deadlines
            </strong>
          </div>
        )}
        {softDeadlinesMissed.length > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-4 py-3 rounded mb-4">
            ⚠️ {softDeadlinesMissed.length} tasks will miss soft deadlines
          </div>
        )}

        {/* Compact Header */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 max-w-[60%] md:max-w-[40%]">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#141414] border-[#1f1f1f] text-sm h-8 text-[#fafafa] placeholder:text-[#a1a1a1] focus-visible:ring-[#f97316]"
            />
          </div>

          {/* List tabs */}
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

          {/* Travel filter */}
          <div className="flex gap-1 ml-auto">
            {travelOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={travelFilter === option.value ? "default" : "ghost"}
                onClick={() => setTravelFilter(option.value)}
                className="h-7 px-2 text-xs"
                title={option.label}
              >
                {option.emoji}
              </Button>
            ))}
          </div>
        </div>

        {/* Active count */}
        <div className="text-xs text-[#a1a1a1] mb-4">
          {activeTasks} active tasks
          {travelFilter !== "all" &&
            ` • ${travelOptions.find((o) => o.value === travelFilter)?.label} only`}
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
              className="w-full md:w-auto bg-[#f97316] hover:bg-[#f97316]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        )}

        {/* Task List */}
        {schedule === undefined ? (
          <div className="text-center py-12 text-[#a1a1a1]">
            Loading tasks...
          </div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            schedule={schedule}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
            search={search}
            listFilter={listFilter}
            statusFilter="all"
            priorityFilter="all"
            getTravelPeriod={getTravelPeriod}
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
            <span className="font-semibold text-[#fafafa]">Bold dates</span> =
            Hard deadline
          </div>
          <div className="mt-2 text-xs text-[#a1a1a1]">
            <span className="font-semibold text-[#fafafa]">Travel badges:</span>
            <span className="ml-2">✈️ Pre-Maldives (before 18 Apr)</span>
            <span className="ml-2">🏝️ During Trip (18 Apr – 4 May)</span>
            <span className="ml-2">🌴 Post-Maldives (after 4 May)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
