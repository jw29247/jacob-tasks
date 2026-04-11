"use client";

import { useState } from "react";
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Circle,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  Play,
  X,
  Save,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (
    task: Task,
    updates: {
      title: string;
      description?: string;
      dueDate?: number;
      startDate?: number;
      priority: Priority;
      deadlineType: DeadlineType;
      list?: List;
      status: Status;
      timeEstimate?: number;
    },
  ) => void;
  onDelete: (id: string) => void;
  predictedEndDate?: number;
  willMissDeadline?: boolean;
  getTravelPeriod?: (dueDate?: number) => "pre" | "during" | "post" | "none";
}

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  if (date < nextWeek) return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeEstimate(minutes: number | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours === Math.floor(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}

const priorityConfig: Record<Priority, { color: string; bg: string; border: string; dot: string; label: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-500", label: "Critical" },
  high: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", label: "High" },
  medium: { color: "text-[#a1a1a1]", bg: "bg-[#1f1f1f]", border: "border-[#2a2a2a]", dot: "bg-[#737373]", label: "Medium" },
  low: { color: "text-[#525252]", bg: "bg-transparent", border: "border-[#1f1f1f]", dot: "bg-[#404040]", label: "Low" },
};

const leftBorderMap: Record<Priority, string> = {
  critical: "border-l-red-500",
  high: "border-l-amber-500",
  medium: "border-l-[#2a2a2a]",
  low: "border-l-[#1f1f1f]",
};

export function TaskCard({ task, onToggle, onEdit, onDelete, predictedEndDate, willMissDeadline, getTravelPeriod }: TaskCardProps) {
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
  const isStarted = task.startDate && task.startDate <= now;
  const pri = priorityConfig[task.priority];
  const isDone = task.status === "done";

  const handleSave = () => {
    let timeEstimate: number | undefined = undefined;
    if (editTimeValue) {
      const value = parseFloat(editTimeValue);
      if (!isNaN(value)) {
        timeEstimate = editTimeUnit === "hours" ? Math.round(value * 60) : value;
      }
    }
    onEdit(task, {
      title: editTitle,
      description: editDescription || undefined,
      dueDate: editDueDate ? new Date(editDueDate).getTime() : undefined,
      startDate: editStartDate ? new Date(editStartDate).getTime() : undefined,
      priority: editPriority,
      deadlineType: editDeadlineType,
      list: editList,
      status: editStatus,
      timeEstimate,
    });
    setShowEdit(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setEditStartDate(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
    setEditPriority(task.priority);
    setEditDeadlineType(task.deadlineType);
    setEditList(task.list);
    setEditStatus(task.status);
    setEditTimeValue(task.timeEstimate ? task.timeEstimate.toString() : "");
    setEditTimeUnit("hours");
    setShowEdit(false);
  };

  // Edit mode
  if (showEdit) {
    return (
      <Card className="p-4 bg-[#141414] border border-[#1f1f1f] rounded-lg">
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit-title" className="text-xs text-[#737373]">Title</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] focus-visible:ring-amber-500/50 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="edit-desc" className="text-xs text-[#737373]">Description</Label>
            <Textarea
              id="edit-desc"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mt-1 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] focus-visible:ring-amber-500/50 rounded-lg"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-start" className="text-xs text-[#737373]">Start</Label>
              <Input id="edit-start" type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg" />
            </div>
            <div>
              <Label htmlFor="edit-due" className="text-xs text-[#737373]">Due</Label>
              <Input id="edit-due" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-[#737373]">Priority</Label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                <SelectTrigger className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">⚪ Medium</SelectItem>
                  <SelectItem value="low">⚫ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[#737373]">Deadline</Label>
              <Select value={editDeadlineType} onValueChange={(v) => setEditDeadlineType(v as DeadlineType)}>
                <SelectTrigger className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[#737373]">List</Label>
              <Select value={editList || "none"} onValueChange={(v) => setEditList(v === "none" ? undefined : v as List)}>
                <SelectTrigger className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="personal">👤 Personal</SelectItem>
                  <SelectItem value="weddings">💍 Weddings</SelectItem>
                  <SelectItem value="house">🏠 House</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-time" className="text-xs text-[#737373]">Time Estimate</Label>
              <Input id="edit-time" type="number" min="0" step="0.5" value={editTimeValue} onChange={(e) => setEditTimeValue(e.target.value)} placeholder="e.g. 2" className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] focus-visible:ring-amber-500/50 rounded-lg" />
            </div>
            <div>
              <Label className="text-xs text-[#737373]">Unit</Label>
              <Select value={editTimeUnit} onValueChange={(v) => setEditTimeUnit(v as "minutes" | "hours")}>
                <SelectTrigger className="mt-1 text-sm h-9 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafaf9] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

  // Display mode
  return (
    <Card
      className={cn(
        "border-l-[3px] bg-[#141414] border border-[#1f1f1f] border-l-[3px] rounded-lg transition-all hover:bg-[#1a1a1a] group",
        leftBorderMap[task.priority],
        isDone && "border-l-[#404040] opacity-60"
      )}
    >
      <div className="p-3 flex items-start gap-3">
        {/* Checkbox */}
        <button
          className="mt-0.5 shrink-0 focus:outline-none"
          onClick={() => onToggle(task._id)}
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        >
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 text-amber-500 task-complete" />
          ) : (
            <Circle className="h-5 w-5 text-[#404040] hover:text-amber-500/50 transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => setShowEdit(true)}>
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "text-sm font-medium leading-snug",
                isDone ? "line-through text-[#525252]" : "text-[#fafaf9]"
              )}
            >
              {task.title}
            </h3>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#1f1f1f]"
                  onClick={(e) => e.stopPropagation()}
                >
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

          {task.description && !isDone && (
            <p className="text-xs text-[#737373] mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Priority dot + label */}
            <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border", pri.bg, pri.border, pri.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", pri.dot)} />
              {pri.label}
            </span>

            {/* Deadline type */}
            {task.deadlineType === "hard" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1a1a1a] text-[#a1a1a1] border border-[#1f1f1f]">
                Hard
              </span>
            )}

            {/* Status */}
            {task.status === "in-progress" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Play className="h-2.5 w-2.5" /> In Progress
              </span>
            )}

            {/* List */}
            {task.list && (
              <span className="text-[10px] text-[#525252]">
                {task.list === "personal" && "👤"}
                {task.list === "weddings" && "💍"}
                {task.list === "house" && "🏠"}
              </span>
            )}

            {/* Travel badge */}
            {getTravelPeriod && task.dueDate && (() => {
              const period = getTravelPeriod(task.dueDate);
              if (period === "none") return null;
              const badges = {
                pre: { emoji: "✈️", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
                during: { emoji: "🏝️", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
                post: { emoji: "🌴", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
              };
              const b = badges[period];
              return <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border", b.cls)}>{b.emoji}</span>;
            })()}

            {/* Time estimate */}
            {task.timeEstimate && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#525252]">
                <Timer className="h-2.5 w-2.5" /> {formatTimeEstimate(task.timeEstimate)}
              </span>
            )}

            {/* Start date */}
            {task.startDate && (
              <span className={cn("inline-flex items-center gap-0.5 text-[10px]", isStarted ? "text-amber-500" : "text-[#525252]")}>
                <Play className="h-2.5 w-2.5" /> {formatDate(task.startDate)}
              </span>
            )}

            {/* Due date */}
            {task.dueDate && (
              <span className={cn("inline-flex items-center gap-0.5 text-[10px]", isOverdue ? "text-red-400 font-semibold" : task.deadlineType === "hard" ? "text-[#a1a1a1] font-medium" : "text-[#525252]")}>
                <Clock className="h-2.5 w-2.5" /> {formatDate(task.dueDate)}
                {isOverdue && <span className="text-red-400">!</span>}
              </span>
            )}

            {/* Predicted end */}
            {predictedEndDate && !isDone && (
              <span className="text-[10px] text-[#525252]">
                → {new Date(predictedEndDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                {willMissDeadline && <span className="text-red-400 ml-0.5">⚠</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}