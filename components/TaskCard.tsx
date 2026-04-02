"use client";

import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Clock 
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const now = Date.now();
  const isOverdue = task.dueDate && task.dueDate < now && task.status !== "done";
  
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

  return (
    <Card className={cn(
      "p-4 border-l-4 transition-all hover:shadow-md",
      getUrgencyColor()
    )}>
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-1 h-6 w-6 shrink-0"
          onClick={() => onToggle(task._id)}
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
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(task._id)}
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
            
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-600 font-semibold" : "text-gray-500"
              )}>
                <Clock className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
                {isOverdue && <span className="text-red-600"> (Overdue)</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
