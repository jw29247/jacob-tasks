"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TaskCard } from "@/components/TaskCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, Priority, DeadlineType, List, Status, ScheduleEntry } from "@/types/task";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskListProps {
  tasks: Task[];
  schedule?: ScheduleEntry[];
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
  search?: string;
  listFilter?: List | "all";
  statusFilter?: Status | "all";
  priorityFilter?: Priority | "all";
}

interface SortableTaskProps {
  task: Task;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
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
  predictedEndDate?: number;
  willMissDeadline?: boolean;
}

function SortableTask({ task, isSelected, onToggleSelect, onToggle, onEdit, onDelete, predictedEndDate, willMissDeadline }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative flex items-start gap-1">
      {/* Drag handle - ONLY here should have drag listeners */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#1a1a1a] mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a1a1a1]">
          <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
          <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
        </svg>
      </div>

      {/* Checkbox */}
      <div className="pt-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(task._id)}
          className="border-[#1f1f1f] data-[state=checked]:bg-[#5e5ce6] data-[state=checked]:border-[#5e5ce6]"
        />
      </div>

      {/* Task card - clickable for edit */}
      <div className="flex-1">
        <TaskCard
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          predictedEndDate={predictedEndDate}
          willMissDeadline={willMissDeadline}
        />
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  schedule,
  onToggle,
  onEdit,
  onDelete,
  search = "",
  listFilter = "all",
  statusFilter = "all",
  priorityFilter = "all",
}: TaskListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  const bulkUpdateStatus = useMutation(api.tasks.bulkUpdateStatus);
  const bulkUpdatePriority = useMutation(api.tasks.bulkUpdatePriority);
  const bulkUpdateList = useMutation(api.tasks.bulkUpdateList);
  const bulkDelete = useMutation(api.tasks.bulkDelete);
  const updateOrder = useMutation(api.tasks.updateOrder);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
      );
    }

    // List filter
    if (listFilter !== "all") {
      result = result.filter((task) => task.list === listFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    return result;
  }, [tasks, search, listFilter, statusFilter, priorityFilter]);

  // Tasks are already sorted by urgency from Convex
  // Only apply client-side reordering for drag-and-drop
  const sortedTasks = useMemo(() => {
    return filteredTasks;
  }, [filteredTasks]);

  // Initialize/update local tasks when sortedTasks changes
  useEffect(() => {
    if (sortedTasks.length > 0) {
      setLocalTasks(sortedTasks);
    }
  }, [sortedTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localTasks.findIndex((t) => t._id === active.id);
      const newIndex = localTasks.findIndex((t) => t._id === over.id);

      const newTasks = arrayMove(localTasks, oldIndex, newIndex);
      setLocalTasks(newTasks);

      // Update order in database
      for (let i = 0; i < newTasks.length; i++) {
        await updateOrder({
          id: newTasks[i]._id as Id<"tasks">,
          order: i,
        });
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedTasks.map((t) => t._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStatus = async (status: Status) => {
    const ids = Array.from(selectedIds) as Id<"tasks">[];
    await bulkUpdateStatus({ ids, status });
    setSelectedIds(new Set());
  };

  const handleBulkPriority = async (priority: Priority) => {
    const ids = Array.from(selectedIds) as Id<"tasks">[];
    await bulkUpdatePriority({ ids, priority });
    setSelectedIds(new Set());
  };

  const handleBulkList = async (list: List | undefined) => {
    const ids = Array.from(selectedIds) as Id<"tasks">[];
    await bulkUpdateList({ ids, list });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.size} tasks?`)) {
      const ids = Array.from(selectedIds) as Id<"tasks">[];
      await bulkDelete({ ids });
      setSelectedIds(new Set());
    }
  };

  const displayTasks = localTasks.length > 0 ? localTasks : sortedTasks;
  
  // Helper to get schedule data for a task
  const getScheduleForTask = (taskId: string) => {
    if (!schedule) return {};
    const entry = schedule.find(s => s.task._id === taskId);
    return {
      predictedEndDate: entry?.predictedEndDate,
      willMissDeadline: entry?.willMissDeadline
    };
  };

  return (
    <div className="space-y-3">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-lg p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#5e5ce6]">
            {selectedIds.size} selected
          </span>

          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus("todo")} className="h-7 text-xs border-[#1f1f1f] text-[#a1a1a1] hover:bg-[#1a1a1a]">
              Todo
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus("in-progress")} className="h-7 text-xs border-[#1f1f1f] text-[#a1a1a1] hover:bg-[#1a1a1a]">
              In Progress
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus("done")} className="h-7 text-xs border-[#1f1f1f] text-[#a1a1a1] hover:bg-[#1a1a1a]">
              Done
            </Button>

            <Select onValueChange={(v) => handleBulkPriority(v as Priority)}>
              <SelectTrigger className="w-24 h-7 text-xs bg-[#0a0a0a] border-[#1f1f1f] text-[#a1a1a1]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                <SelectItem value="critical">🔴 Critical</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="medium">🔵 Medium</SelectItem>
                <SelectItem value="low">⚪ Low</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => handleBulkList(v === "none" ? undefined : v as List)}>
              <SelectTrigger className="w-24 h-7 text-xs bg-[#0a0a0a] border-[#1f1f1f] text-[#a1a1a1]">
                <SelectValue placeholder="List" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                <SelectItem value="none">No list</SelectItem>
                <SelectItem value="personal">👤 Personal</SelectItem>
                <SelectItem value="weddings">💒 Weddings</SelectItem>
                <SelectItem value="house">🏠 House</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-7 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30">
              Delete
            </Button>
          </div>

          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-7 text-xs text-[#a1a1a1] hover:bg-[#1a1a1a]">
            Clear
          </Button>
        </div>
      )}

      {/* Select All */}
      {sortedTasks.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            checked={selectedIds.size === sortedTasks.length}
            onCheckedChange={toggleSelectAll}
            className="border-[#1f1f1f] data-[state=checked]:bg-[#5e5ce6] data-[state=checked]:border-[#5e5ce6]"
          />
          <span className="text-xs text-[#a1a1a1]">Select all ({sortedTasks.length})</span>
        </div>
      )}

      {/* Task List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={displayTasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {displayTasks.length === 0 ? (
              <div className="text-center py-12 text-[#a1a1a1]">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm">No tasks match your filters</p>
              </div>
            ) : (
              displayTasks.map((task) => {
                const { predictedEndDate, willMissDeadline } = getScheduleForTask(task._id);
                return (
                  <SortableTask
                    key={task._id}
                    task={task}
                    isSelected={selectedIds.has(task._id)}
                    onToggleSelect={toggleSelect}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    predictedEndDate={predictedEndDate}
                    willMissDeadline={willMissDeadline}
                  />
                );
              })
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
