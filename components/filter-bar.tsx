"use client";

import { FilterState } from "@/data/types";
import { CATEGORIES, SEVERITIES, STATUSES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

type FilterValue = string | number | boolean | undefined;

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const updateFilter = (key: keyof FilterState, value: FilterValue) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-[#1e2433] border border-[#2e3548] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center w-full">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search issues..." 
          value={filters.search || ""}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-9 bg-[#1a1f2e] border-[#2e3548] text-slate-200"
        />
      </div>

      <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
        <Select value={filters.category || "All"} onValueChange={(val) => updateFilter("category", val === "All" ? undefined : val)}>
          <SelectTrigger className="w-[140px] bg-[#1a1f2e] border-[#2e3548] text-slate-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e2433] border-[#2e3548] text-slate-200">
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.severity || "All"} onValueChange={(val) => updateFilter("severity", val === "All" ? undefined : val)}>
          <SelectTrigger className="w-[140px] bg-[#1a1f2e] border-[#2e3548] text-slate-200">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e2433] border-[#2e3548] text-slate-200">
            <SelectItem value="All">All Severities</SelectItem>
            {SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.status || "All"} onValueChange={(val) => updateFilter("status", val === "All" ? undefined : val)}>
          <SelectTrigger className="w-[140px] bg-[#1a1f2e] border-[#2e3548] text-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e2433] border-[#2e3548] text-slate-200">
            <SelectItem value="All">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        
        <Select value={filters.priority || "All"} onValueChange={(val) => updateFilter("priority", val === "All" ? undefined : val)}>
          <SelectTrigger className="w-[140px] bg-[#1a1f2e] border-[#2e3548] text-slate-200">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e2433] border-[#2e3548] text-slate-200">
            <SelectItem value="All">All Priorities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
