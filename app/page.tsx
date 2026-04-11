"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TaskForm } from "@/components/TaskForm";
import { TaskCard } from "@/components/TaskCard";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, X, Plane, CheckCircle2,
  Calendar, FolderOpen, BarChart3, Inbox,
} from "lucide-react";
import { Task, Priority, DeadlineType, List, Status, ScheduleEntry } from "@/types/task";

const MALDIVES_START = new Date("2026-04-18T00:00:00Z").getTime();

type TimeGroup = "overdue" | "pre-maldives" | "this-week" | "later" | "done";
type View = "inbox" | "calendar" | "lists" | "insights";

function getTimeGroup(task: Task): TimeGroup {
  if (task.status === "done") return "done";
  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
  if (task.dueDate && task.dueDate < now) return "overdue";
  if (task.dueDate && task.dueDate < MALDIVES_START) return "pre-maldives";
  if (task.dueDate && task.dueDate < weekFromNow) return "this-week";
  return "later";
}

type EnrichedTask = Task & { predictedEndDate?: number; willMissDeadline?: boolean };

export default function Home() {
  const schedule = useQuery(api.tasks.getSchedule);
  const bankHolidayInfo = useQuery(api.tasks.getBankHolidayInfo);
  const tasks = schedule?.map((s: ScheduleEntry) => s.task);
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.remove);
  const toggleComplete = useMutation(api.tasks.toggleComplete);

  const [showForm, setShowForm] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<List | "all">("all");
  const [showDone, setShowDone] = useState(false);
  const [view, setView] = useState<View>("inbox");

  const handleCreate = async (data: {
    title: string; description?: string; dueDate?: number; startDate?: number;
    priority: Priority; deadlineType: DeadlineType; list?: List;
  }) => {
    await createTask({ ...data, createdBy: "web" });
    setShowForm(false);
  };

  const handleEdit = async (task: Task, data: {
    title: string; description?: string; dueDate?: number; startDate?: number;
    priority: Priority; deadlineType: DeadlineType; list?: List; status: Status;
    timeEstimate?: number;
  }) => {
    await updateTask({ id: task._id as Id<"tasks">, title: data.title, description: data.description,
      dueDate: data.dueDate, startDate: data.startDate, priority: data.priority,
      deadlineType: data.deadlineType, list: data.list, status: data.status });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this task?")) await deleteTask({ id: id as Id<"tasks"> });
  };

  const handleToggle = async (id: string) => {
    await toggleComplete({ id: id as Id<"tasks"> });
  };

  // Filter + group tasks
  const filteredAndGrouped: Record<TimeGroup, EnrichedTask[]> = useMemo(() => {
    if (!tasks || !schedule) return { overdue: [], "pre-maldives": [], "this-week": [], later: [], done: [] };
    const enriched: EnrichedTask[] = tasks.map((task: Task) => {
      const entry = schedule.find((s: ScheduleEntry) => s.task._id === task._id);
      return { ...task, predictedEndDate: entry?.predictedEndDate, willMissDeadline: entry?.willMissDeadline };
    });

    const filtered = enriched.filter((task) => {
      if (search) {
        const s = search.toLowerCase();
        if (!task.title.toLowerCase().includes(s) && !(task.description?.toLowerCase().includes(s))) return false;
      }
      if (listFilter !== "all" && task.list !== listFilter) return false;
      return true;
    });

    const groups: Record<TimeGroup, EnrichedTask[]> = {
      overdue: [], "pre-maldives": [], "this-week": [], later: [], done: [],
    };
    filtered.forEach((task) => { groups[getTimeGroup(task)].push(task); });
    return groups;
  }, [tasks, schedule, search, listFilter]);

  const activeCount = tasks?.filter((t: Task) => t.status !== "done").length ?? 0;
  const overdueCount = filteredAndGrouped.overdue.length;

  // List counts
  const listCounts = useMemo(() => {
    if (!tasks) return { all: 0, personal: 0, weddings: 0, house: 0 };
    return {
      all: tasks.filter((t: Task) => t.status !== "done").length,
      personal: tasks.filter((t: Task) => t.status !== "done" && t.list === "personal").length,
      weddings: tasks.filter((t: Task) => t.status !== "done" && t.list === "weddings").length,
      house: tasks.filter((t: Task) => t.status !== "done" && t.list === "house").length,
    };
  }, [tasks]);

  // Nav items
  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4" /> },
    { view: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
    { view: "lists", label: "Lists", icon: <FolderOpen className="h-4 w-4" /> },
    { view: "insights", label: "Insights", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-[220px] border-r border-[#1f1f1f] bg-[#0f0f0f] pt-4 pb-2">
        <div className="px-4 pb-4 mb-2 border-b border-[#1a1a1a]">
          <h1 className="text-sm font-semibold text-[#fafafa] tracking-tight">Tasks</h1>
          <p className="text-[11px] text-[#525252] mt-0.5">{activeCount} active</p>
        </div>

        {/* Views */}
        <div className="px-2 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                view === item.view
                  ? "bg-[#1a1a1a] text-[#fafafa]"
                  : "text-[#737373] hover:text-[#a1a1a1] hover:bg-[#141414]"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Lists */}
        <div className="px-2 mt-6">
          <p className="px-3 text-[10px] font-semibold tracking-widest uppercase text-[#404040] mb-1">Lists</p>
          {(["personal", "weddings", "house"] as List[]).map((list) => {
            const icons: Record<string, string> = { personal: "👤", weddings: "💍", house: "🏠" };
            return (
              <button
                key={list}
                onClick={() => { setListFilter(list); setView("inbox"); }}
                className={`flex items-center justify-between w-full px-3 py-1 rounded-md text-[13px] transition-colors ${
                  listFilter === list ? "bg-[#1a1a1a] text-[#fafafa]" : "text-[#525252] hover:text-[#a1a1a1]"
                }`}
              >
                <span className="flex items-center gap-2"><span className="text-xs">{icons[list]}</span> {list}</span>
                <span className="text-[11px] text-[#404040]">{listCounts[list]}</span>
              </button>
            );
          })}
        </div>

        {/* Maldives */}
        <div className="mt-auto px-3 pb-2">
          <div className="flex items-center gap-2 rounded-md bg-amber-500/5 border border-amber-500/10 px-3 py-2 text-[11px] text-amber-200/50">
            <Plane className="h-3 w-3 text-amber-500/40" />
            Maldives 18 Apr
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-[#fafafa]">
              {view === "inbox" ? (listFilter === "all" ? "Inbox" : listFilter.charAt(0).toUpperCase() + listFilter.slice(1))
                : view === "calendar" ? "Calendar" : view === "lists" ? "Lists" : "Insights"}
            </h2>
            {overdueCount > 0 && (
              <span className="text-[10px] font-medium bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">{overdueCount} overdue</span>
            )}
            {bankHolidayInfo?.isBankHoliday && (
              <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">🏦 {bankHolidayInfo.name}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {searchOpen ? (
              <div className="flex items-center gap-1">
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
                  className="h-7 w-44 text-xs bg-[#141414] border-[#1f1f1f] text-[#fafafa] placeholder:text-[#404040] focus-visible:ring-amber-500/30 rounded-md" />
                <button onClick={() => { setSearchOpen(false); setSearch(""); }} className="p-1 hover:bg-[#141414] rounded">
                  <X className="h-3.5 w-3.5 text-[#525252]" />
                </button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-1.5 hover:bg-[#141414] rounded">
                <Search className="h-4 w-4 text-[#525252]" />
              </button>
            )}
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-[#0a0a0a] text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors">
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {showForm && (
            <div className="border-b border-[#1a1a1a] p-4">
              <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {view === "inbox" && (
            <InboxView groups={filteredAndGrouped} showDone={showDone} setShowDone={setShowDone}
              onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} activeCount={activeCount} />
          )}
          {view === "calendar" && (
            <CalendarView tasks={tasks || []} />
          )}
          {view === "lists" && (
            <ListsView tasks={tasks || []} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          {view === "insights" && (
            <InsightsView tasks={tasks || []} schedule={schedule || []} />
          )}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#1f1f1f] bg-[#0f0f0f] flex items-center justify-around py-2 z-50">
        {navItems.map((item) => (
          <button key={item.view} onClick={() => setView(item.view)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${view === item.view ? "text-amber-500" : "text-[#525252]"}`}>
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── INBOX VIEW ──────────────────────────────────────────
function InboxView({ groups, showDone, setShowDone, onToggle, onEdit, onDelete, activeCount }: {
  groups: Record<TimeGroup, EnrichedTask[]>; showDone: boolean; setShowDone: (v: boolean) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task, updates: { title: string; description?: string; dueDate?: number; startDate?: number; priority: Priority; deadlineType: DeadlineType; list?: List; status: Status; timeEstimate?: number }) => void;
  onDelete: (id: string) => void; activeCount: number;
}) {
  const sectionOrder: { key: TimeGroup; label: string; accent: string }[] = [
    { key: "overdue", label: "Overdue", accent: "text-red-400" },
    { key: "pre-maldives", label: "Pre-Maldives", accent: "text-amber-400" },
    { key: "this-week", label: "This Week", accent: "text-[#a1a1a1]" },
    { key: "later", label: "Later", accent: "text-[#525252]" },
  ];

  return (
    <div className="p-4 pb-20 md:pb-4 space-y-6">
      {sectionOrder.map(({ key, label, accent }) => {
        const items = groups[key];
        if (!items || items.length === 0) return null;
        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-[11px] font-semibold tracking-widest uppercase ${accent}`}>{label}</h3>
              <span className="text-[11px] text-[#404040]">{items.length}</span>
            </div>
            <div className="space-y-0.5">
              {items.map((task: EnrichedTask) => (
                <TaskCard key={task._id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete}
                  predictedEndDate={task.predictedEndDate} willMissDeadline={task.willMissDeadline} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Done */}
      {groups.done.length > 0 && (
        <div>
          <button onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-1.5 text-[11px] text-[#404040] hover:text-[#525252] mb-2">
            <CheckCircle2 className="h-3 w-3" /> {showDone ? "Hide" : "Show"} {groups.done.length} completed
          </button>
          {showDone && (
            <div className="space-y-0.5">
              {groups.done.map((task: EnrichedTask) => (
                <TaskCard key={task._id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeCount === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[#404040]">All clear. Nothing to do.</p>
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────
function CalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = today.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  // Group tasks by due date
  const tasksByDate: Record<string, Task[]> = {};
  tasks.forEach((task: Task) => {
    if (task.dueDate && task.status !== "done") {
      const dateStr = new Date(task.dueDate).toISOString().split("T")[0];
      if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
      tasksByDate[dateStr].push(task);
    }
  });

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="p-4 pb-20 md:pb-4">
      <h3 className="text-sm font-medium text-[#fafafa] mb-4">{monthName}</h3>
      <div className="grid grid-cols-7 gap-px bg-[#1a1a1a] rounded-lg overflow-hidden">
        {dayNames.map((d) => (
          <div key={d} className="text-[10px] text-center text-[#404040] py-1 bg-[#0a0a0a]">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-[#0a0a0a] p-1 min-h-[48px]" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTasks = tasksByDate[dateStr] || [];
          const isToday = day === today.getDate();
          return (
            <div key={day} className={`bg-[#0a0a0a] p-1 min-h-[48px] ${isToday ? "ring-1 ring-amber-500/30 ring-inset" : ""}`}>
              <span className={`text-[10px] ${isToday ? "text-amber-500 font-semibold" : "text-[#525252]"}`}>{day}</span>
              {dayTasks.slice(0, 2).map((task: Task) => (
                <div key={task._id} className={`text-[9px] truncate mt-0.5 px-1 rounded ${
                  task.priority === "critical" ? "bg-red-500/15 text-red-400" :
                  task.priority === "high" ? "bg-amber-500/15 text-amber-400" :
                  "bg-[#141414] text-[#525252]"
                }`}>{task.title}</div>
              ))}
              {dayTasks.length > 2 && <div className="text-[9px] text-[#404040]">+{dayTasks.length - 2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LISTS VIEW ──────────────────────────────────────────
function ListsView({ tasks, onToggle, onEdit, onDelete }: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task, updates: { title: string; description?: string; dueDate?: number; startDate?: number; priority: Priority; deadlineType: DeadlineType; list?: List; status: Status; timeEstimate?: number }) => void;
  onDelete: (id: string) => void;
}) {
  const listConfig: { key: List; label: string; icon: string }[] = [
    { key: "personal", label: "Personal", icon: "👤" },
    { key: "weddings", label: "Weddings", icon: "💍" },
    { key: "house", label: "House", icon: "🏠" },
  ];

  return (
    <div className="p-4 pb-20 md:pb-4 space-y-6">
      {listConfig.map(({ key, label, icon }) => {
        const listTasks = tasks.filter((t: Task) => t.list === key && t.status !== "done");
        return (
          <section key={key}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-[#737373]">
                {icon} {label}
              </h3>
              <span className="text-[11px] text-[#404040]">{listTasks.length}</span>
            </div>
            <div className="space-y-0.5">
              {listTasks.length === 0 ? (
                <p className="text-[12px] text-[#404040] py-2">No tasks</p>
              ) : (
                listTasks.map((task: Task) => (
                  <TaskCard key={task._id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── INSIGHTS VIEW ───────────────────────────────────────
function InsightsView({ tasks, schedule }: { tasks: Task[]; schedule: ScheduleEntry[] }) {
  const activeTasks = tasks.filter((t: Task) => t.status !== "done");
  const overdueTasks = activeTasks.filter((t: Task) => t.dueDate && t.dueDate < Date.now());
  const willMiss = schedule?.filter((s: ScheduleEntry) => s.willMissDeadline) || [];
  const hardMiss = willMiss.filter((s: ScheduleEntry) => s.deadlineType === "hard");
  const softMiss = willMiss.filter((s: ScheduleEntry) => s.deadlineType === "soft");

  const byPriority = {
    critical: activeTasks.filter((t: Task) => t.priority === "critical").length,
    high: activeTasks.filter((t: Task) => t.priority === "high").length,
    medium: activeTasks.filter((t: Task) => t.priority === "medium").length,
    low: activeTasks.filter((t: Task) => t.priority === "low").length,
  };

  const totalEstimate = activeTasks.reduce((acc: number, t: Task) => acc + (t.timeEstimate || 0), 0);
  const totalHours = Math.round(totalEstimate / 60 * 10) / 10;

  return (
    <div className="p-4 pb-20 md:pb-4 space-y-6">
      <section>
        <h3 className="text-[11px] font-semibold tracking-widest uppercase text-[#737373] mb-3">Overview</h3>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Active" value={activeTasks.length} />
          <StatCard label="Overdue" value={overdueTasks.length} accent="red" />
          <StatCard label="Est. Hours" value={totalHours} />
          <StatCard label="Done" value={tasks.length - activeTasks.length} accent="amber" />
        </div>
      </section>

      {hardMiss.length > 0 && (
        <section>
          <h3 className="text-[11px] font-semibold tracking-widest uppercase text-red-400 mb-2">⚠ Hard Deadlines At Risk</h3>
          <div className="space-y-1">
            {hardMiss.map((s: ScheduleEntry) => (
              <div key={s.task._id} className="text-[12px] text-[#a1a1a1] bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2">
                {s.task.title}
              </div>
            ))}
          </div>
        </section>
      )}

      {softMiss.length > 0 && (
        <section>
          <h3 className="text-[11px] font-semibold tracking-widest uppercase text-amber-400 mb-2">Soft Deadlines At Risk</h3>
          <div className="space-y-1">
            {softMiss.map((s: ScheduleEntry) => (
              <div key={s.task._id} className="text-[12px] text-[#a1a1a1] bg-amber-500/5 border border-amber-500/10 rounded-md px-3 py-2">
                {s.task.title}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[11px] font-semibold tracking-widest uppercase text-[#737373] mb-3">By Priority</h3>
        <div className="space-y-1.5">
          <PriorityBar label="Critical" count={byPriority.critical} total={activeTasks.length} color="bg-red-500" />
          <PriorityBar label="High" count={byPriority.high} total={activeTasks.length} color="bg-amber-500" />
          <PriorityBar label="Medium" count={byPriority.medium} total={activeTasks.length} color="bg-[#525252]" />
          <PriorityBar label="Low" count={byPriority.low} total={activeTasks.length} color="bg-[#2a2a2a]" />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const textColor = accent === "red" ? "text-red-400" : accent === "amber" ? "text-amber-400" : "text-[#fafafa]";
  return (
    <div className="bg-[#141414] border border-[#1a1a1a] rounded-md p-3">
      <p className="text-[10px] text-[#525252] uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-semibold ${textColor} mt-0.5`}>{value}</p>
    </div>
  );
}

function PriorityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[#525252] w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-[#525252] w-4 text-right">{count}</span>
    </div>
  );
}