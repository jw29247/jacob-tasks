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
  Save
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
  }) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
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

export function TaskCard({ task, onToggle, onEdit, onDelete, isEditing }: TaskCardProps) {
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
  const [showEdit, setShowEdit] = useState(false);

  const now = Date.now();
  const isOverdue = task.dueDate && task.dueDate < now && task.status !== "done";
  const isStarted = task.startDate && task.startDate <= now;

  const getUrgencyColor = () => {
    if (task.status === "done") return "border-l-gray-300 bg-gray-50";
    if (isOverdue) return "border-l-red-500 bg-red-50 animate-pulse";
    if (task.priority === "critical" && task.deadlineType === "hard") {
      return "border-l-red-500 bg-red-50";
    }
    if (task.priority === "critical" || (task.priority === "high" && task.deadlineType === "hard")) {
      return "border-l-orange-500 bg-orange-50";
    }
    return "border-l-slate-300 bg-white";
  };

  const getPriorityBadge = () => {
    const colors = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-blue-500 text-white",
      low: "bg-gray-500 text-white",
    };
    return colors[task.priority];
  };

  const handleSave = () => {
    onEdit(task, {
      title: editTitle,
      description: editDescription || undefined,
      dueDate: editDueDate ? new Date(editDueDate).getTime() : undefined,
      startDate: editStartDate ? new Date(editStartDate).getTime() : undefined,
      priority: editPriority,
      deadlineType: editDeadlineType,
      list: editList,
      status: editStatus,
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
    setShowEdit(false);
  };

  if (showEdit || isEditing) {
    return (
      <Card className={cn(
        "p-4 border-l-4",
        getUrgencyColor()
      )}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit-title" className="text-xs">Title</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="edit-desc" className="text-xs">Description</Label>
            <Textarea
              id="edit-desc"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mt-1 text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-start" className="text-xs">Start Date</Label>
              <Input
                id="edit-start"
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="edit-due" className="text-xs">Due Date</Label>
              <Input
                id="edit-due"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">🔵 Medium</SelectItem>
                  <SelectItem value="low">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Deadline Type</Label>
              <Select value={editDeadlineType} onValueChange={(v) => setEditDeadlineType(v as DeadlineType)}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">List</Label>
              <Select value={editList || "none"} onValueChange={(v) => setEditList(v === "none" ? undefined : v as List)}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue placeholder="Select list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No list</SelectItem>
                  <SelectItem value="personal">👤 Personal</SelectItem>
                  <SelectItem value="weddings">💒 Weddings</SelectItem>
                  <SelectItem value="house">🏠 House</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Status)}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="flex-1">
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
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
        "p-4 border-l-4 transition-all hover:shadow-md cursor-pointer",
        getUrgencyColor()
      )}
      onClick={() => setShowEdit(true)}
    >
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-1 h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task._id);
          }}
        >
          {task.status === "done" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400" />
          )}
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              "font-medium text-sm md:text-base",
              task.status === "done" && "line-through text-gray-500"
            )}>
              {task.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowEdit(true);
                }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task._id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {task.description && (
            <p className={cn(
              "text-xs md:text-sm text-gray-600 mt-1",
              task.status === "done" && "line-through"
            )}>
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={cn("text-xs", getPriorityBadge())}>
              {task.priority}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {task.deadlineType}
            </Badge>
            
            <Badge variant="secondary" className="text-xs">
              {task.status === "in-progress" ? "In Progress" : task.status}
            </Badge>

            {task.list && (
              <Badge variant="outline" className="text-xs">
                {task.list === "personal" && "👤"}
                {task.list === "weddings" && "💒"}
                {task.list === "house" && "🏠"}
                {" "}{task.list}
              </Badge>
            )}

            {task.startDate && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isStarted ? "text-green-600 font-medium" : "text-gray-500"
              )}>
                <Play className="h-3 w-3" />
                <span>{formatDate(task.startDate)}</span>
              </div>
            )}
            
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-600 font-semibold" : "text-gray-500"
              )}>
                <Clock className="h-3 w-3" />
                <span>{formatDate(task.dueDate)}</span>
                {isOverdue && <span className="text-red-600"> (Overdue)</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
