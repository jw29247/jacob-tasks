"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { List } from "@/types/task";
import { X } from "lucide-react";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  listFilter: List | "all";
  onListFilterChange: (value: List | "all") => void;
}

export function TaskFilters({
  search,
  onSearchChange,
  listFilter,
  onListFilterChange,
}: TaskFiltersProps) {
  const listOptions: { value: List | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "All", emoji: "📋" },
    { value: "personal", label: "Personal", emoji: "👤" },
    { value: "weddings", label: "Weddings", emoji: "💒" },
    { value: "house", label: "House", emoji: "🏠" },
  ];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-[#141414] border-[#1f1f1f] text-sm h-8 pr-8 text-[#fafafa] placeholder:text-[#a1a1a1] focus-visible:ring-[#5e5ce6]"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a1a1a1] hover:text-[#fafafa]"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* List Tabs - small chips */}
      <div className="flex flex-wrap gap-1">
        {listOptions.map((option) => (
          <Button
            key={option.value}
            variant={listFilter === option.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onListFilterChange(option.value)}
            className="h-7 px-2 text-xs bg-[#5e5ce6] hover:bg-[#5e5ce6]/90 data-[variant=ghost]:bg-transparent data-[variant=ghost]:hover:bg-[#1a1a1a]"
          >
            <span className="mr-1">{option.emoji}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
