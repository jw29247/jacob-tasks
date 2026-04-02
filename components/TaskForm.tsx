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
import { Task, Priority, DeadlineType } from "@/types/task";

interface TaskFormProps {
  onSubmit: (task: {
    title: string;
    description?: string;
    dueDate?: number;
    priority: Priority;
    deadlineType: DeadlineType;
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
  const [priority, setPriority] = useState<Priority>(
    initialData?.priority || "medium"
  );
  const [deadlineType, setDeadlineType] = useState<DeadlineType>(
    initialData?.deadlineType || "soft"
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      title,
      description: description || undefined,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      priority,
      deadlineType,
    });
    
    if (!initialData) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setDeadlineType("soft");
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Task Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            className="mt-1"
          />
        </div>

        {showAdvanced && (
          <>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="mt-1">
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
                <Label>Deadline Type</Label>
                <Select value={deadlineType} onValueChange={(v) => setDeadlineType(v as DeadlineType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {initialData ? "Update Task" : "Add Task"}
          </Button>
          
          {!showAdvanced && !initialData && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(true)}
            >
              Options
            </Button>
          )}
          
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
