"use client";

import { cn } from "@/lib/utils";
import { Car, Trash2, Zap, Droplet, Building, AlertTriangle, HelpCircle } from "lucide-react";

export const CATEGORY_CONFIG = {
  Pothole: { icon: Car, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  Garbage: { icon: Trash2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  "Broken Streetlight": { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  "Water Leakage": { icon: Droplet, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "Road Damage": { icon: Building, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  "Open Drain": { icon: AlertTriangle, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  Other: { icon: HelpCircle, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30" },
};

interface IssueCategoryCardProps {
  category: string;
  selected?: boolean;
  onClick?: () => void;
}

export function IssueCategoryCard({ category, selected, onClick }: IssueCategoryCardProps) {
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.Other;
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-lg",
        selected
          ? `${config.bg} ${config.border} shadow-md`
          : "bg-[#1a1f2e] border-[#2e3548] hover:border-[#3b82f6]/50"
      )}
    >
      <div className={cn("p-3 rounded-lg", config.bg)}>
        <Icon className={cn("w-6 h-6", config.color)} />
      </div>
      <span className={cn("text-sm font-medium", selected ? "text-white" : "text-slate-300")}>
        {category}
      </span>
    </button>
  );
}
