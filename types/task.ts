export type Priority = "critical" | "high" | "medium" | "low";
export type DeadlineType = "hard" | "soft";
export type Status = "todo" | "in-progress" | "done";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  dueDate?: number;
  priority: Priority;
  deadlineType: DeadlineType;
  status: Status;
  createdAt: number;
  createdBy?: string;
}
