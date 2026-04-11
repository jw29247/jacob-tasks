"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TaskForm } from "@/components/TaskForm";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Plane, Flame, Clock, CheckCircle2 } from "lucide-react";
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";

// Maldives travel dates
const MALDIVES_START = new Date("2026-04-18T00:00:00Z").getTime();
const MALDIVES_END = new Date("2026-05-04T23:59:59Z").getTime();

type TravelFilter = "all" | "pre-maldives" | "during-maldives" | "post-maldives";

function getTravelPeriod(dueDate?: number): "pre" | "during" | "post" | "none" {
  if (!dueDate) return "none";
  if (dueDate < MALDIVES_START) return "pre";
  if (dueDate >= MALDIVES_START && dueDate <= MALDIVES_END) return "during";
  return "post";
}

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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task: Task) => {
      const period = getTravelPeriod(task.dueDate);
      if (travelFilter === "pre-maldives" && period !== "pre") return false;
      if (travelFilter === "during-maldives" && period !== "during") return false;
      if (travelFilter === "post-maldives" && period !== "post") return false;
      if (search) {
        const s = search.toLowerCase();
        if (!task.title.toLowerCase().includes(s) && !(task.description?.toLowerCase().includes(s))) return false;
      }
      if (listFilter !== "all" && task.list !== listFilter) return false;
      return true;
    });
  }, [tasks, search, listFilter, travelFilter]);

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

  const activeTasks = filteredTasks?.filter((t: Task) => t.status !== "done").length || 0;
  const doneTasks = filteredTasks?.filter((t: Task) => t.status === "done").length || 0;

  const hardDeadlinesMissed = schedule?.filter((s) => s.willMissDeadline && s.deadlineType === "hard") || [];
  const softDeadlinesMissed = schedule?.filter((s) => s.willMissDeadline && s.deadlineType === "soft") || [];

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const maldivesDatesStr = `${formatDate(MALDIVES_START)} – ${formatDate(MALDIVES_END)}`;

  const listTabs: { value: List | "all"; label: string; icon: string }[] = [
    { value: "all", label: "All", icon: "📋" },
    { value: "personal", label: "Personal", icon: "👤" },
    { value: "weddings", label: "Weddings", icon: "💍" },
    { value: "house", label: "House", icon: "🏠" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafaf9]">
      <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8">
        {/* Header */}
        <header className="pt-6 pb-4 border-b border-[#1f1f1f] mb-4">
          <h1 className="font-heading text-2xl text-[#fafaf9] tracking-tight">
            Tasks
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            {activeTasks} active{doneTasks > 0 ? ` · ${doneTasks} done` : ""}
          </p>
        </header>

        {/* Alerts */}
        {bankHolidayInfo?.isBankHoliday && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-lg mb-3 text-sm">
            🎉 <strong>{bankHolidayInfo.name}</strong> — Bank Holiday (9 hours available)
          </div>
        )}

        {hardDeadlinesMissed.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-3 text-sm">
            <Flame className="h-4 w-4 inline mr-2" />
            <strong>{hardDeadlinesMissed.length} task{hardDeadlinesMissed.length > 1 ? "s" : ""} will miss hard deadlines</strong>
          </div>
        )}

        {softDeadlinesMissed.length > 0 && hardDeadlinesMissed.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-lg mb-3 text-sm">
            <Clock className="h-4 w-4 inline mr-2" />
            {softDeadlinesMissed.length} task{softDeadlinesMissed.length > 1 ? "s" : ""} will miss soft deadlines
          </div>
        )}

        {/* Maldives banner */}
        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-200/80 px-4 py-3 rounded-lg mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <strong className="text-amber-200">Maldives: {maldivesDatesStr}</strong>
              <div className="text-xs text-amber-200/60 mt-0.5">
                Tasks before {formatDate(MALDIVES_START)} = Pre-Maldives priority
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {/* List tabs */}
          {listTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setListFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                listFilter === tab.value
                  ? "bg-amber-500 text-[#0a0a0a] shadow-sm shadow-amber-500/20"
                  : "bg-[#141414] text-[#a1a1a1] hover:text-[#fafaf9] hover:bg-[#1a1a1a]"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}

          <div className="w-px h-5 bg-[#1f1f1f] mx-1" />

          {/* Travel filter */}
          {(["all", "pre-maldives"] as TravelFilter[]).map((f) => {
            const labels: Record<string, string> = { all: "All", "pre-maldives": "✈️ Pre" };
            return (
              <button
                key={f}
                onClick={() => setTravelFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  travelFilter === f
                    ? "bg-[#1f1f1f] text-amber-500 border border-amber-500/30"
                    : "bg-[#141414] text-[#737373] hover:text-[#a1a1a1]"
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#141414] border-[#1f1f1f] text-sm h-9 text-[#fafaf9] placeholder:text-[#525252] focus-visible:ring-amber-500/50 focus-visible:border-amber-500/30 rounded-lg pl-9"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Add Task Form */}
        {showForm && (
          <div className="mb-4">
            <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Task List */}
        {schedule === undefined ? (
          <div className="text-center py-16 text-[#525252]">
            <div className="text-3xl mb-3">⟳</div>
            <p className="text-sm">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-[#525252]">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-[#1f1f1f]" />
            <p className="font-heading text-lg text-[#737373]">All clear</p>
            <p className="text-sm mt-1">No tasks match your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task: Task) => {
              const scheduleEntry = schedule?.find((s) => s.task._id === task._id);
              return (
                <TaskCard
                  key={task._id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  predictedEndDate={scheduleEntry?.predictedEndDate}
                  willMissDeadline={scheduleEntry?.willMissDeadline}
                  getTravelPeriod={getTravelPeriod}
                />
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-[#1f1f1f]">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#525252]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> High</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#737373]" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#404040]" /> Low</span>
            <span>·</span>
            <span>Bold date = Hard deadline</span>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      {!showForm && !editingTaskId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto md:mt-4 md:flex md:justify-center">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-amber-500 hover:bg-amber-400 text-[#0a0a0a] font-semibold shadow-lg shadow-amber-500/20 rounded-full px-6 h-11 md:rounded-lg md:shadow-none"
          >
            <Plus className="h-5 w-5 mr-1.5" />
            Add Task
          </Button>
        </div>
      )}
    </div>
  );
}