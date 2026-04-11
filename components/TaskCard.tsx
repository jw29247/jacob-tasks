"use client";

import { useState } from "react";
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, Circle, MoreVertical, Edit2, Trash2,
  Clock, AlertTriangle, X, Save, Timer,
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
  predictedEndDate?: number;
  willMissDeadline?: boolean;
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

// Compact priority indicators — dots not badges
const priorityDot: Record<Priority, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-[#525252]",
  low: "bg-[#2a2a2a]",
};

export function TaskCard({ task, onToggle, onEdit, onDelete, predictedEndDate, willMissDeadline }: TaskCardProps) {
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
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-md p-3">
        <div className="space-y-2.5">
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus
            className="text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-amber-500/30 rounded-md" />
          <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
            className="text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-amber-500/30 rounded-md" rows={2} placeholder="Description..." />
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px] text-[#525252]">Start</Label>
              <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)}
                className="mt-0.5 text-xs h-7 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] rounded-md" /></div>
            <div><Label className="text-[10px] text-[#525252]">Due</Label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                className="mt-0.5 text-xs h-7 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] rounded-md" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
              <SelectTrigger className="text-xs h-7 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] rounded-md"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                <SelectItem value="critical">🔴 Critical</SelectItem><SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="medium">⚪ Medium</SelectItem><SelectItem value="low">⚫ Low</SelectItem>
              </SelectContent></Select>
            <Select value={editDeadlineType} onValueChange={(v) => setEditDeadlineType(v as DeadlineType)}>
              <SelectTrigger className="text-xs h-7 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] rounded-md"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                <SelectItem value="hard">Hard</SelectItem><SelectItem value="soft">Soft</SelectItem>
              </SelectContent></Select>
            <Select value={editList || "none"} onValueChange={(v) => setEditList(v === "none" ? undefined : v as List)}>
              <SelectTrigger className="text-xs h-7 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] rounded-md"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                <SelectItem value="none">—</SelectItem><SelectItem value="personal">👤</SelectItem>
                <SelectItem value="weddings">💍</SelectItem><SelectItem value="house">🏠</SelectItem>
              </SelectContent></Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="flex-1 h-8 bg-amber-500 hover:bg-amber-400 text-[#0a0a0a] text-xs font-medium rounded-md">
              <Save className="h-3 w-3 mr-1" /> Save</Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1 h-8 border-[#1f1f1f] text-[#737373] text-xs rounded-md">
              <X className="h-3 w-3 mr-1" /> Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Display: compact row like Linear ───
  return (
    <div className={cn(
      "group flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors hover:bg-[#141414] cursor-pointer",
      isDone && "opacity-40"
    )}
      onClick={() => setShowEdit(true)}
    >
      {/* Priority dot */}
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityDot[task.priority])} />

      {/* Checkbox */}
      <button
        className="shrink-0 focus:outline-none"
        onClick={(e) => { e.stopPropagation(); onToggle(task._id); }}
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-amber-500" />
        ) : (
          <Circle className="h-4 w-4 text-[#2a2a2a] hover:text-[#525252] transition-colors" />
        )}
      </button>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-[13px] truncate", isDone ? "line-through text-[#525252]" : "text-[#e5e5e5]")}>
            {task.title}
          </span>
          {task.status === "in-progress" && (
            <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1 py-0.5 rounded font-medium">IN PROGRESS</span>
          )}
          {task.deadlineType === "hard" && !isDone && (
            <span className="text-[9px] text-[#525252] font-medium">HARD</span>
          )}
        </div>
        {/* Meta row */}
        <div className="flex items-center gap-2 mt-0.5">
          {task.dueDate && !isDone && (
            <span className={cn("text-[11px]", isOverdue ? "text-red-400 font-medium" : "text-[#525252]")}>
              <Clock className="h-2.5 w-2.5 inline mr-0.5" />
              {formatDate(task.dueDate)}
              {isOverdue && " !"}
            </span>
          )}
          {predictedEndDate && !isDone && (
            <span className={cn("text-[11px]", willMissDeadline ? "text-red-400" : "text-[#404040]")}>
              → {formatDate(predictedEndDate)}
              {willMissDeadline && <AlertTriangle className="h-2.5 w-2.5 inline ml-0.5" />}
            </span>
          )}
          {task.timeEstimate && !isDone && (
            <span className="text-[11px] text-[#404040]">
              <Timer className="h-2.5 w-2.5 inline mr-0.5" />{formatTimeEstimate(task.timeEstimate)}
            </span>
          )}
          {task.list && !isDone && (
            <span className="text-[11px] text-[#404040]">
              {task.list === "personal" && "👤"}{task.list === "weddings" && "💍"}{task.list === "house" && "🏠"}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#1a1a1a] rounded"
            onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="h-3.5 w-3.5 text-[#525252]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#141414] border-[#1f1f1f]">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowEdit(true); }} className="text-[#fafafa] hover:bg-[#1a1a1a] text-xs">
            <Edit2 className="h-3 w-3 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="text-red-400 hover:bg-[#1a1a1a] text-xs">
            <Trash2 className="h-3 w-3 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}