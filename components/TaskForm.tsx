"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Task, Priority, DeadlineType, List } from "@/types/task";

interface TaskFormProps {
  onSubmit: (task: {
    title: string;
    description?: string;
    dueDate?: number;
    startDate?: number;
    priority: Priority;
    deadlineType: DeadlineType;
    list?: List;
    timeEstimate?: number;
  }) => void;
  onCancel?: () => void;
  initialData?: Task;
}

export function TaskForm({ onSubmit, onCancel, initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]
      : ""
  );
  const [priority, setPriority] = useState<Priority>(
    initialData?.priority || "medium"
  );
  const [deadlineType, setDeadlineType] = useState<DeadlineType>(
    initialData?.deadlineType || "soft"
  );
  const [list, setList] = useState<List | undefined>(
    initialData?.list
  );
  const [timeValue, setTimeValue] = useState(
    initialData?.timeEstimate ? initialData.timeEstimate.toString() : ""
  );
  const [timeUnit, setTimeUnit] = useState<"minutes" | "hours">("hours");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert time estimate to minutes
    let timeEstimate: number | undefined = undefined;
    if (timeValue) {
      const value = parseFloat(timeValue);
      if (!isNaN(value)) {
        timeEstimate = timeUnit === "hours" ? Math.round(value * 60) : value;
      }
    }

    onSubmit({
      title,
      description: description || undefined,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      priority,
      deadlineType,
      list,
      timeEstimate,
    });

    if (!initialData) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setStartDate("");
      setPriority("medium");
      setDeadlineType("soft");
      setList(undefined);
      setTimeValue("");
    }
  };

  return (
    <Card className="p-3 bg-[#141414] border-[#1f1f1f]">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="title" className="text-xs text-[#a1a1a1]">Task Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            className="mt-1 h-8 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] placeholder:text-[#a1a1a1] focus-visible:ring-[#5e5ce6]"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-xs text-[#a1a1a1]">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
            className="mt-1 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] placeholder:text-[#a1a1a1] focus-visible:ring-[#5e5ce6]"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="startDate" className="text-xs text-[#a1a1a1]">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 h-8 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-[#5e5ce6]"
            />
          </div>

          <div>
            <Label htmlFor="dueDate" className="text-xs text-[#a1a1a1]">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 h-8 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] focus-visible:ring-[#5e5ce6]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-[#a1a1a1]">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="mt-1 h-8 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
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
            <Select value={deadlineType} onValueChange={(v) => setDeadlineType(v as DeadlineType)}>
              <SelectTrigger className="mt-1 h-8 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs text-[#a1a1a1]">List</Label>
          <Select value={list || "none"} onValueChange={(v) => setList(v === "none" ? undefined : v as List)}>
            <SelectTrigger className="mt-1 h-8 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
              <SelectValue placeholder="Select list (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#1f1f1f]">
              <SelectItem value="none">No list</SelectItem>
              <SelectItem value="personal">👤 Personal</SelectItem>
              <SelectItem value="weddings">💒 Weddings</SelectItem>
              <SelectItem value="house">🏠 House</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="timeEstimate" className="text-xs text-[#a1a1a1]">Time Estimate</Label>
            <Input
              id="timeEstimate"
              type="number"
              min="0"
              step="0.5"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              placeholder="e.g. 2"
              className="mt-1 h-8 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa] placeholder:text-[#a1a1a1] focus-visible:ring-[#5e5ce6]"
            />
          </div>
          <div>
            <Label className="text-xs text-[#a1a1a1]">Unit</Label>
            <Select value={timeUnit} onValueChange={(v) => setTimeUnit(v as "minutes" | "hours")}>
              <SelectTrigger className="mt-1 h-8 text-sm bg-[#0a0a0a] border-[#1f1f1f] text-[#fafafa]">
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
          <Button type="submit" className="flex-1 h-8 text-sm bg-[#5e5ce6] hover:bg-[#5e5ce6]/90">
            {initialData ? "Update Task" : "Add Task"}
          </Button>
          
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="h-8 text-sm border-[#1f1f1f] text-[#fafafa] hover:bg-[#1a1a1a]">
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
