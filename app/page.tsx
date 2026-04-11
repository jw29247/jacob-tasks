"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TaskForm } from "@/components/TaskForm";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, Plane, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";

const MALDIVES_START = new Date("2026-04-18T00:00:00Z").getTime();

type TimeGroup = "overdue" | "pre-maldives" | "this-week" | "later" | "done";

function getTimeGroup(task: Task): TimeGroup {
  if (task.status === "done") return "done";
  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
  if (task.dueDate && task.dueDate < now) return "overdue";
  if (task.dueDate && task.dueDate < MALDIVES_START) return "pre-maldives";
  if (task.dueDate && task.dueDate < weekFromNow) return "this-week";
  return "later";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<List | "all">("all");
  const [showDone, setShowDone] = useState(false);

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
    title: string; description?: string; dueDate?: number; startDate?: number;
    priority: Priority; deadlineType: DeadlineType; list?: List; status: Status;
  }) => {
    await updateTask({ id: task._id as Id<"tasks">, ...data });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this task?")) await deleteTask({ id: id as Id<"tasks"> });
  };

  const handleToggle = async (id: string) => {
    await toggleComplete({ id: id as Id<"tasks"> });
  };

  // Filter + group tasks
  const filteredAndGrouped: Record<TimeGroup, Task[]> = useMemo(() => {
    if (!tasks) return { overdue: [], "pre-maldives": [], "this-week": [], later: [], done: [] };
    const filtered = tasks.filter((task: Task) => {
      if (search) {
        const s = search.toLowerCase();
        if (!task.title.toLowerCase().includes(s) && !(task.description?.toLowerCase().includes(s))) return false;
      }
      if (listFilter !== "all" && task.list !== listFilter) return false;
      return true;
    });

    const groups: Record<TimeGroup, Task[]> = {
      overdue: [], "pre-maldives": [], "this-week": [], later: [], done: [],
    };

    filtered.forEach((task: Task) => {
      const group = getTimeGroup(task);
      groups[group].push(task);
    });

    return groups;
  }, [tasks, search, listFilter]);

  const activeCount = tasks?.filter((t: Task) => t.status !== "done").length ?? 0;
  const overdueCount = filteredAndGrouped.overdue?.length ?? 0;

  const listTabs: { value: List | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "personal", label: "Personal" },
    { value: "weddings", label: "Weddings" },
    { value: "house", label: "House" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafaf9]">
      <div className="max-w-2xl mx-auto px-4 pb-28 md:pb-8">
        {/* Header */}
        <header className="pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-[32px] leading-tight tracking-tight text-[#fafaf9]">
                Tasks
              </h1>
              <p className="text-sm text-[#525252] mt-1">
                {activeCount} active{overdueCount > 0 ? <span className="text-red-400"> · {overdueCount} overdue</span> : ""}
              </p>
            </div>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg hover:bg-[#141414] transition-colors"
            >
              {searchOpen ? <X className="h-5 w-5 text-[#a1a1a1]" /> : <Search className="h-5 w-5 text-[#525252]" />}
            </button>
          </div>

          {/* Search */}
          {searchOpen && (
            <div className="mt-3">
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#141414] border-[#1f1f1f] text-sm h-9 text-[#fafaf9] placeholder:text-[#404040] focus-visible:ring-amber-500/50 rounded-lg pl-9"
                autoFocus
              />
            </div>
          )}

          {/* Bank holiday */}
          {bankHolidayInfo?.isBankHoliday && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
              🎉 <strong>{bankHolidayInfo.name}</strong> — Bank Holiday
            </div>
          )}

          {/* Overdue alert */}
          {overdueCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-300">
              <AlertTriangle className="h-3.5 w-3.5" /> <strong>{overdueCount} overdue</strong> — needs attention
            </div>
          )}

          {/* Maldives banner */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2 text-xs text-amber-200/60">
            <Plane className="h-3.5 w-3.5 text-amber-500/60" />
            Maldives 18 Apr – 4 May · Tasks sorted by deadline
          </div>

          {/* List filter pills */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
            {listTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setListFilter(tab.value)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-wide whitespace-nowrap transition-all ${
                  listFilter === tab.value
                    ? "bg-amber-500 text-[#0a0a0a]"
                    : "bg-[#141414] text-[#525252] hover:text-[#a1a1a1] hover:bg-[#1a1a1a]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Add Task Form */}
        {showForm && (
          <div className="mb-6">
            <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Task groups */}
        {schedule === undefined ? (
          <div className="text-center py-20 text-[#404040]">
            <div className="text-3xl mb-2">⟳</div>
            <p className="text-sm">Loading...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overdue */}
            {filteredAndGrouped.overdue.length > 0 && (
              <TaskGroup label="Overdue" count={filteredAndGrouped.overdue.length} accent="red">
                {filteredAndGrouped.overdue.map((task: Task) => {
                  
                  return (
                    <TaskCard key={task._id} task={task} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete}
                      />
                  );
                })}
              </TaskGroup>
            )}

            {/* Pre-Maldives */}
            {filteredAndGrouped["pre-maldives"].length > 0 && (
              <TaskGroup label="Pre-Maldives" count={filteredAndGrouped["pre-maldives"].length} accent="amber" icon={<Plane className="h-3.5 w-3.5" />}>
                {filteredAndGrouped["pre-maldives"].map((task: Task) => {
                  
                  return (
                    <TaskCard key={task._id} task={task} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete}
                      />
                  );
                })}
              </TaskGroup>
            )}

            {/* This Week */}
            {filteredAndGrouped["this-week"].length > 0 && (
              <TaskGroup label="This Week" count={filteredAndGrouped["this-week"].length}>
                {filteredAndGrouped["this-week"].map((task: Task) => {
                  
                  return (
                    <TaskCard key={task._id} task={task} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete}
                      />
                  );
                })}
              </TaskGroup>
            )}

            {/* Later */}
            {filteredAndGrouped.later.length > 0 && (
              <TaskGroup label="Later" count={filteredAndGrouped.later.length} muted>
                {filteredAndGrouped.later.map((task: Task) => {
                  
                  return (
                    <TaskCard key={task._id} task={task} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete}
                      />
                  );
                })}
              </TaskGroup>
            )}

            {/* Done */}
            {filteredAndGrouped.done.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDone(!showDone)}
                  className="flex items-center gap-2 text-xs text-[#404040] hover:text-[#525252] transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {showDone ? "Hide" : "Show"} {filteredAndGrouped.done.length} completed
                </button>
                {showDone && (
                  <div className="mt-3 space-y-1">
                    {filteredAndGrouped.done.map((task: Task) => (
                      <TaskCard key={task._id} task={task} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {activeCount === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">✓</div>
                <p className="font-heading text-2xl text-[#525252]">All clear</p>
                <p className="text-sm text-[#404040] mt-1">Nothing to do. Enjoy it.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {!showForm && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto md:mt-6 md:flex md:justify-center z-50">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-amber-500 hover:bg-amber-400 text-[#0a0a0a] font-semibold shadow-lg shadow-amber-500/20 rounded-full px-8 h-12 md:rounded-lg md:shadow-none md:h-10 text-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Task
          </Button>
        </div>
      )}
    </div>
  );
}

function TaskGroup({ label, count, accent, muted, icon, children }: {
  label: string; count: number; accent?: string; muted?: boolean; icon?: React.ReactNode; children: React.ReactNode;
}) {
  const accentColor = accent === "amber" ? "bg-amber-500" : accent === "red" ? "bg-red-500" : "bg-[#2a2a2a]";
  const textColor = muted ? "text-[#404040]" : accent === "red" ? "text-red-400" : accent === "amber" ? "text-amber-400" : "text-[#737373]";

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-[2px] flex-1 ${accentColor}`} />
        <div className="flex items-center gap-1.5">
          {icon}
          <h2 className={`font-heading text-[15px] tracking-wide ${textColor}`}>
            {label}
          </h2>
          <span className={`text-[11px] ${muted ? "text-[#404040]" : "text-[#525252]"}`}>
            {count}
          </span>
        </div>
        <div className={`h-[2px] flex-1 ${accentColor}`} />
      </div>
      <div className="space-y-1.5">
        {children}
      </div>
    </section>
  );
}