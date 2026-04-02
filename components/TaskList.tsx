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
import { Task, Priority, DeadlineType, List, Status } from "@/types/task";
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
}

function SortableTask({ task, isSelected, onToggleSelect, onToggle, onEdit, onDelete }: SortableTaskProps) {
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
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 mt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
          <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
        </svg>
      </div>

      {/* Checkbox */}
      <div className="pt-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(task._id)}
        />
      </div>

      {/* Task card - clickable for edit */}
      <div className="flex-1">
        <TaskCard
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
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

  // Sort by order field, fallback to urgency sort if no order
  const sortedTasks = useMemo(() => {
    const hasOrder = filteredTasks.some(t => t.order !== undefined);
    
    if (hasOrder) {
      return [...filteredTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    // Fallback to original urgency sort
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

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.size} selected
          </span>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus("todo")}>
              Mark Todo
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus("in-progress")}>
              Mark In Progress
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus("done")}>
              Mark Done
            </Button>

            <Select onValueChange={(v) => handleBulkPriority(v as Priority)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">🔴 Critical</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="medium">🔵 Medium</SelectItem>
                <SelectItem value="low">⚪ Low</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => handleBulkList(v === "none" ? undefined : v as List)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="List" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No list</SelectItem>
                <SelectItem value="personal">👤 Personal</SelectItem>
                <SelectItem value="weddings">💒 Weddings</SelectItem>
                <SelectItem value="house">🏠 House</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </div>

          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Button>
        </div>
      )}

      {/* Select All */}
      {sortedTasks.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <Checkbox
            checked={selectedIds.size === sortedTasks.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-gray-600">Select all ({sortedTasks.length})</span>
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
          <div className="space-y-3">
            {displayTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-2">🔍</div>
                <p>No tasks match your filters</p>
              </div>
            ) : (
              displayTasks.map((task) => (
                <SortableTask
                  key={task._id}
                  task={task}
                  isSelected={selectedIds.has(task._id)}
                  onToggleSelect={toggleSelect}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
