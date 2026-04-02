export type Priority = "critical" | "high" | "medium" | "low";
export type DeadlineType = "hard" | "soft";
export type Status = "todo" | "in-progress" | "done";
export type List = "personal" | "weddings" | "house";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  dueDate?: number;
  startDate?: number;
  priority: Priority;
  deadlineType: DeadlineType;
  status: Status;
  list?: List;
  order?: number;
  timeEstimate?: number; // in minutes
  createdAt: number;
  createdBy?: string;
}
