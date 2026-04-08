"use client";

import { useState } from "react";
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Timer
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
  onEdit: (task: Task, updates: {
    title: string;
    description?: string;
    dueDate?: number;
    startDate?: number;
    priority: Priority;
    deadlineType: DeadlineType;
    list?: List;
    status: Status;
    timeEstimate?: number;
  }) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
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

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  if (date < nextWeek) {
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeEstimate(minutes: number | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = minutes / 60;
  if (hours === Math.floor(hours)) {
    return `${hours}h`;
  }
  return `${hours.toFixed(1)}h`;
}

export function TaskCard({ task, onToggle, onEdit, onDelete, isEditing, predictedEndDate, willMissDeadline, getTravelPeriod }: TaskCardProps) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editDueDate, setEditDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [editStartDate, setEditStartDate] = useState(
    task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : ""
  );
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDeadlineType, setEditDeadlineType] = useState<DeadlineType>(task.deadlineType);
  const [editList, setEditList] = useState<List | undefined>(task.list);
  const [editStatus, setEditStatus] = useState<Status>(task.status);
  const [editTimeValue, setEditTimeValue] = useState(
    task.timeEstimate ? task.timeEstimate.toString() : ""
  );
  const [editTimeUnit, setEditTimeUnit] = useState<"minutes" | "hours">("hours");
  const [showEdit, setShowEdit] = useState(false);

  const now = Date.now();
  const isOverdue = task.dueDate && task.dueDate < now && task.status !== "done";
  const isStarted = task.startDate && task.startDate <= now;

  const getUrgencyColor = () => {
    if (task.status === "done") return "border-l-gray-600";
    if (isOverdue) return "border-l-red-500";
    if (task.priority === "critical" && task.deadlineType === "hard") {
      return "border-l-red-500";
    }
    if (task.priority === "critical" || (task.priority === "high" && task.deadlineType === "hard")) {
      return "border-l-orange-500";
    }
    return "border-l-[#1f1f1f]";
  };

  const getPriorityBadge = () => {
    const colors = {
      critical: "bg-red-500/20 text-red-400 border-red-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[task.priority];
  };

  const handleSave = () => {
    // Convert time estimate to minutes
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

  if (showEdit || isEditing) {
    return (
      <Card className={cn(
        "p-3 border-l-4 bg-[#141414] border-[#1f1f1f]",
        getUrgencyColor()
      )}>
        <div className="space-y-2">
          <div>
            <Label htmlFor="edit-title" className="text-xs text-[#a1a1a1]">Title</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-[#5e5ce6]"
            />
          </div>

          <div>
            <Label htmlFor="edit-desc" className="text-xs text-[#a1a1a1]">Description</Label>
            <Textarea
              id="edit-desc"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mt-1 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-[#5e5ce6]"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="edit-start" className="text-xs text-[#a1a1a1]">Start Date</Label>
              <Input
                id="edit-start"
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-[#5e5ce6]"
              />
            </div>
            <div>
              <Label htmlFor="edit-due" className="text-xs text-[#a1a1a1]">Due Date</Label>
              <Input
                id="edit-due"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-[#5e5ce6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-[#a1a1a1]">Priority</Label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                <SelectTrigger className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">🔵 Medium</SelectItem>
                  <SelectItem value="low">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[#a1a1a1]">Deadline Type</Label>
              <Select value={editDeadlineType} onValueChange={(v) => setEditDeadlineType(v as DeadlineType)}>
                <SelectTrigger className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-[#a1a1a1]">List</Label>
              <Select value={editList || "none"} onValueChange={(v) => setEditList(v === "none" ? undefined : v as List)}>
                <SelectTrigger className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
                  <SelectValue placeholder="Select list" />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="none">No list</SelectItem>
                  <SelectItem value="personal">👤 Personal</SelectItem>
                  <SelectItem value="weddings">💒 Weddings</SelectItem>
                  <SelectItem value="house">🏠 House</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[#a1a1a1]">Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Status)}>
                <SelectTrigger className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="edit-time" className="text-xs text-[#a1a1a1]">Time Estimate</Label>
              <Input
                id="edit-time"
                type="number"
                min="0"
                step="0.5"
                value={editTimeValue}
                onChange={(e) => setEditTimeValue(e.target.value)}
                placeholder="e.g. 2"
                className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-[#5e5ce6]"
              />
            </div>
            <div>
              <Label className="text-xs text-[#a1a1a1]">Unit</Label>
              <Select value={editTimeUnit} onValueChange={(v) => setEditTimeUnit(v as "minutes" | "hours")}>
                <SelectTrigger className="mt-1 text-sm h-8 bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="flex-1 h-8 bg-[#5e5ce6] hover:bg-[#5e5ce6]/90">
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1 h-8 border-[#1f1f1f] text-[#fafafa] hover:bg-[#1a1a1a]">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "p-3 border-l-4 transition-all hover:bg-[#1a1a1a] cursor-pointer bg-[#141414] border-[#1f1f1f]",
        getUrgencyColor()
      )}
      onClick={() => setShowEdit(true)}
    >
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0 h-5 w-5 shrink-0 hover:bg-[#1a1a1a]"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task._id);
          }}
        >
          {task.status === "done" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-[#a1a1a1]" />
          )}
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              "font-medium text-sm",
              task.status === "done" ? "line-through text-[#a1a1a1]" : "text-[#fafafa]"
            )}>
              {task.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0 hover:bg-[#1a1a1a]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3 text-[#a1a1a1]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#141414] border-[#1f1f1f]">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowEdit(true);
                }} className="text-[#fafafa] hover:bg-[#1a1a1a]">
                  <Edit2 className="h-3 w-3 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task._id);
                  }}
                  className="text-red-400 hover:bg-[#1a1a1a]"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {task.description && (
            <p className={cn(
              "text-xs text-[#a1a1a1] mt-1",
              task.status === "done" && "line-through"
            )}>
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge className={cn("text-xs border", getPriorityBadge())}>
              {task.priority}
            </Badge>
            
            <Badge variant="outline" className="text-xs border-[#1f1f1f] text-[#a1a1a1]">
              {task.deadlineType}
            </Badge>
            
            <Badge variant="secondary" className="text-xs bg-[#1a1a1a] text-[#a1a1a1]">
              {task.status === "in-progress" ? "In Progress" : task.status}
            </Badge>

            {task.list && (
              <Badge variant="outline" className="text-xs border-[#1f1f1f] text-[#a1a1a1]">
                {task.list === "personal" && "👤"}
                {task.list === "weddings" && "💒"}
                {task.list === "house" && "🏠"}
                {" "}{task.list}
              </Badge>
            )}

            {getTravelPeriod && task.dueDate && (() => {
              const period = getTravelPeriod(task.dueDate);
              if (period === "none") return null;
              const travelBadges = {
                pre: { emoji: "✈️", label: "Pre-Maldives", class: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
                during: { emoji: "🏝️", label: "During Trip", class: "bg-red-500/20 text-red-400 border-red-500/30" },
                post: { emoji: "🌴", label: "Post-Maldives", class: "bg-green-500/20 text-green-400 border-green-500/30" },
              };
              const badge = travelBadges[period];
              if (!badge) return null;
              return (
                <Badge className={cn("text-xs border", badge.class)} title={badge.label}>
                  {badge.emoji}
                </Badge>
              );
            })()}

            {task.timeEstimate && (
              <Badge variant="outline" className="text-xs border-[#1f1f1f] text-[#a1a1a1]">
                <Timer className="h-3 w-3 mr-1" />
                {formatTimeEstimate(task.timeEstimate)}
              </Badge>
            )}

            {task.startDate && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isStarted ? "text-green-400" : "text-[#a1a1a1]"
              )}>
                <Play className="h-3 w-3" />
                <span>{formatDate(task.startDate)}</span>
              </div>
            )}
            
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-400 font-semibold" : "text-[#a1a1a1]"
              )}>
                <Clock className="h-3 w-3" />
                <span>{formatDate(task.dueDate)}</span>
                {isOverdue && <span className="text-red-400"> (Overdue)</span>}
              </div>
            )}
            
            {predictedEndDate && task.status !== "done" && (
              <div className="text-xs text-[#a1a1a1]">
                📅 Predicted: {new Date(predictedEndDate).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short"
                })}
                {willMissDeadline && <span className="text-red-400 ml-1">(⚠️ misses deadline)</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
