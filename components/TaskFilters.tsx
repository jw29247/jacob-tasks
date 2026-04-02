"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { List, Status, Priority } from "@/types/task";
import { Search, X } from "lucide-react";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  listFilter: List | "all";
  onListFilterChange: (value: List | "all") => void;
  statusFilter: Status | "all";
  onStatusFilterChange: (value: Status | "all") => void;
  priorityFilter: Priority | "all";
  onPriorityFilterChange: (value: Priority | "all") => void;
}

export function TaskFilters({
  search,
  onSearchChange,
  listFilter,
  onListFilterChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}: TaskFiltersProps) {
  const listOptions: { value: List | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "All", emoji: "📋" },
    { value: "personal", label: "Personal", emoji: "👤" },
    { value: "weddings", label: "Weddings", emoji: "💒" },
    { value: "house", label: "House", emoji: "🏠" },
  ];

  const statusOptions: { value: Status | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "todo", label: "Todo" },
    { value: "in-progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  const priorityOptions: { value: Priority | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "All", emoji: "" },
    { value: "critical", label: "Critical", emoji: "🔴" },
    { value: "high", label: "High", emoji: "🟠" },
    { value: "medium", label: "Medium", emoji: "🔵" },
    { value: "low", label: "Low", emoji: "⚪" },
  ];

  const clearFilters = () => {
    onSearchChange("");
    onListFilterChange("all");
    onStatusFilterChange("all");
    onPriorityFilterChange("all");
  };

  const hasActiveFilters =
    search !== "" ||
    listFilter !== "all" ||
    statusFilter !== "all" ||
    priorityFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* List Tabs */}
      <div className="flex flex-wrap gap-2">
        {listOptions.map((option) => (
          <Button
            key={option.value}
            variant={listFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onListFilterChange(option.value)}
            className="text-xs"
          >
            <span className="mr-1">{option.emoji}</span>
            {option.label}
          </Button>
        ))}
      </div>

      {/* Status & Priority Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Status:</span>
          <div className="flex gap-1">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onStatusFilterChange(option.value)}
                className="text-xs h-7"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Priority:</span>
          <div className="flex gap-1">
            {priorityOptions.map((option) => (
              <Button
                key={option.value}
                variant={priorityFilter === option.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onPriorityFilterChange(option.value)}
                className="text-xs h-7"
              >
                {option.emoji && <span className="mr-1">{option.emoji}</span>}
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
          Clear all filters
        </Button>
      )}
    </div>
  );
}
