"use client";

import { Task, Priority, DeadlineType, List, Status } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";

interface TaskListProps {
  tasks: Task[];
  schedule?: { task: Task; predictedEndDate: number; willMissDeadline: boolean; deadlineType: DeadlineType }[];
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
    },
  ) => void;
  onDelete: (id: string) => void;
  getTravelPeriod?: (dueDate?: number) => "pre" | "during" | "post" | "none";
}

export function TaskList({
  tasks,
  schedule,
  onToggle,
  onEdit,
  onDelete,
  getTravelPeriod,
}: TaskListProps) {
  // Helper to get schedule data for a task
  const getScheduleForTask = (taskId: string) => {
    if (!schedule) return {};
    const entry = schedule.find((s) => s.task._id === taskId);
    return {
      predictedEndDate: entry?.predictedEndDate,
      willMissDeadline: entry?.willMissDeadline,
    };
  };

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <div className="text-center py-16 text-[#525252]">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-sm">No tasks match your filters</p>
        </div>
      ) : (
        tasks.map((task) => {
          const { predictedEndDate, willMissDeadline } = getScheduleForTask(task._id);
          return (
            <TaskCard
              key={task._id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              predictedEndDate={predictedEndDate}
              willMissDeadline={willMissDeadline}
              getTravelPeriod={getTravelPeriod}
            />
          );
        })
      )}
    </div>
  );
}