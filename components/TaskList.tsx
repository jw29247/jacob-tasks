"use client";

import { Task, DeadlineType } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";

interface TaskListProps {
  tasks: Task[];
  schedule?: { task: Task; predictedEndDate: number; willMissDeadline: boolean; deadlineType: DeadlineType }[];
  onToggle: (id: string) => void;
  onEdit: (task: Task, updates: {
    title: string; description?: string; dueDate?: number; startDate?: number;
    priority: Task["priority"]; deadlineType: DeadlineType; list?: Task["list"]; status: Task["status"];
  }) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-[#404040]">
        <div className="text-4xl mb-2">✓</div>
        <p className="text-sm">No tasks match your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => (
        <TaskCard key={task._id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}