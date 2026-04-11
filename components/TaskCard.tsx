"use client";

import { useState } from "react";
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, Circle, MoreVertical, Edit2, Trash2,
  Clock, Play, X, Save, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task, updates: {
    title: string; description?: string; dueDate?: number; startDate?: number;
    priority: Priority; deadlineType: DeadlineType; list?: List; status: Status;
    timeEstimate?: number;
  }) => void;
  onDelete: (id: string) => void;
}

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  if (date < nextWeek) return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function formatTimeEstimate(minutes: number | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return hours === Math.floor(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

// Priority determines SIZE and WEIGHT
const prioritySize: Record<Priority, { card: string; title: string; dot: string; border: string }> = {
  critical: {
    card: "p-4",
    title: "text-[15px] font-semibold",
    dot: "w-3 h-3 bg-red-500",
    border: "border-l-red-500",
  },
  high: {
    card: "p-3.5",
    title: "text-[14px] font-semibold",
    dot: "w-2.5 h-2.5 bg-amber-500",
    border: "border-l-amber-500",
  },
  medium: {
    card: "p-3",
    title: "text-[13px] font-medium",
    dot: "w-2 h-2 bg-[#737373]",
    border: "border-l-[#2a2a2a]",
  },
  low: {
    card: "p-2.5",
    title: "text-[12px] font-normal text-[#737373]",
    dot: "w-1.5 h-1.5 bg-[#404040]",
    border: "border-l-[#1f1f1f]",
  },
};

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editDueDate, setEditDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  const [editStartDate, setEditStartDate] = useState(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDeadlineType, setEditDeadlineType] = useState<DeadlineType>(task.deadlineType);
  const [editList, setEditList] = useState<List | undefined>(task.list);
  const [editStatus, setEditStatus] = useState<Status>(task.status);
  const [editTimeValue, setEditTimeValue] = useState(task.timeEstimate ? task.timeEstimate.toString() : "");
  const [editTimeUnit, setEditTimeUnit] = useState<"minutes" | "hours">("hours");
  const [showEdit, setShowEdit] = useState(false);

  const now = Date.now();
  const isOverdue = task.dueDate && task.dueDate < now && task.status !== "done";
  const isDone = task.status === "done";
  const size = prioritySize[task.priority];

  const handleSave = () => {
    let timeEstimate: number | undefined;
    if (editTimeValue) {
      const value = parseFloat(editTimeValue);
      if (!isNaN(value)) timeEstimate = editTimeUnit === "hours" ? Math.round(value * 60) : value;
    }
    onEdit(task, {
      title: editTitle, description: editDescription || undefined,
      dueDate: editDueDate ? new Date(editDueDate).getTime() : undefined,
      startDate: editStartDate ? new Date(editStartDate).getTime() : undefined,
      priority: editPriority, deadlineType: editDeadlineType, list: editList, status: editStatus, timeEstimate,
    });
    setShowEdit(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title); setEditDescription(task.description || "");
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setEditStartDate(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
    setEditPriority(task.priority); setEditDeadlineType(task.deadlineType); setEditList(task.list);
    setEditStatus(task.status); setEditTimeValue(task.timeEstimate ? task.timeEstimate.toString() : ""); setEditTimeUnit("hours");
    setShowEdit(false);
  };

  // Edit mode
  if (showEdit) {
    return (
      <Card className="p-4 bg-[#141414] border border-[#1f1f1f] rounded-lg">
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit-title" className="text-xs text-[#737373]">Title</Label>
            <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus
              className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] focus-visible:ring-amber-500/50 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="edit-desc" className="text-xs text-[#737373]">Description</Label>
            <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
              className="mt-1 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] focus-visible:ring-amber-500/50 rounded-lg" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="edit-start" className="text-xs text-[#737373]">Start</Label>
              <Input id="edit-start" type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg" /></div>
            <div><Label htmlFor="edit-due" className="text-xs text-[#737373]">Due</Label>
              <Input id="edit-due" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs text-[#737373]">Priority</Label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                <SelectTrigger className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="critical">🔴 Critical</SelectItem><SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">⚪ Medium</SelectItem><SelectItem value="low">⚫ Low</SelectItem>
                </SelectContent></Select></div>
            <div><Label className="text-xs text-[#737373]">Deadline</Label>
              <Select value={editDeadlineType} onValueChange={(v) => setEditDeadlineType(v as DeadlineType)}>
                <SelectTrigger className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="hard">Hard</SelectItem><SelectItem value="soft">Soft</SelectItem>
                </SelectContent></Select></div>
            <div><Label className="text-xs text-[#737373]">List</Label>
              <Select value={editList || "none"} onValueChange={(v) => setEditList(v === "none" ? undefined : v as List)}>
                <SelectTrigger className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="none">None</SelectItem><SelectItem value="personal">👤 Personal</SelectItem>
                  <SelectItem value="weddings">💍 Weddings</SelectItem><SelectItem value="house">🏠 House</SelectItem>
                </SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="edit-time" className="text-xs text-[#737373]">Time</Label>
              <Input id="edit-time" type="number" min="0" step="0.5" value={editTimeValue} onChange={(e) => setEditTimeValue(e.target.value)} placeholder="e.g. 2"
                className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] placeholder:text-[#404040] focus-visible:ring-amber-500/50 rounded-lg" /></div>
            <div><Label className="text-xs text-[#737373]">Unit</Label>
              <Select value={editTimeUnit} onValueChange={(v) => setEditTimeUnit(v as "minutes" | "hours")}>
                <SelectTrigger className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="hours">Hours</SelectItem><SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent></Select></div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} className="flex-1 h-9 bg-amber-500 hover:bg-amber-400 text-[#0a0a0a] font-semibold rounded-lg">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1 h-9 border-[#1f1f1f] text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-[#fafaf9] rounded-lg">
              <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Display — priority determines visual SIZE
  return (
    <Card
      className={cn(
        "border-l-[3px] bg-[#141414] border border-[#1f1f1f] rounded-lg transition-all hover:bg-[#1a1a1a] group",
        size.border,
        isDone && "border-l-[#404040] opacity-50"
      )}
    >
      <div className={cn("flex items-start gap-3", size.card)}>
        {/* Completion checkbox */}
        <button
          className="mt-0.5 shrink-0 focus:outline-none"
          onClick={() => onToggle(task._id)}
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        >
          {isDone ? (
            <CheckCircle2 className={cn("text-amber-500 task-complete", task.priority === "critical" ? "h-6 w-6" : "h-5 w-5")} />
          ) : (
            <Circle className={cn("text-[#404040] hover:text-amber-500/40 transition-colors",
              task.priority === "critical" ? "h-6 w-6" : task.priority === "high" ? "h-5 w-5" : "h-4 w-4")} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowEdit(true)}>
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("leading-snug", size.title, isDone && "line-through text-[#525252]!")}>
              {task.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#1f1f1f]"
                  onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-3.5 w-3.5 text-[#525252]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#141414] border-[#1f1f1f]">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowEdit(true); }} className="text-[#fafaf9] hover:bg-[#1a1a1a]">
                  <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="text-red-400 hover:bg-[#1a1a1a]">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description — hidden on low priority unless editing */}
          {task.description && task.priority !== "low" && !isDone && (
            <p className="text-xs text-[#525252] mt-1 line-clamp-2">{task.description}</p>
          )}

          {/* Meta row — scales with priority */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Priority dot */}
            <span className={cn("rounded-full shrink-0", size.dot)} />

            {task.deadlineType === "hard" && (
              <span className="text-[10px] font-semibold tracking-wide uppercase text-amber-500/80">HARD</span>
            )}

            {task.status === "in-progress" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                <Play className="h-2.5 w-2.5" /> In Progress
              </span>
            )}

            {task.list && (
              <span className="text-[10px] text-[#525252]">
                {task.list === "personal" && "👤"}
                {task.list === "weddings" && "💍"}
                {task.list === "house" && "🏠"}
              </span>
            )}

            {task.timeEstimate && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#525252]">
                <Timer className="h-2.5 w-2.5" /> {formatTimeEstimate(task.timeEstimate)}
              </span>
            )}

            {task.dueDate && (
              <span className={cn("inline-flex items-center gap-0.5 text-[10px]",
                isOverdue ? "text-red-400 font-semibold" : "text-[#525252]")}>
                <Clock className="h-2.5 w-2.5" /> {formatDate(task.dueDate)}
                {isOverdue && <span>!</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}