"use client";

import { cn } from "@/lib/utils";

interface PriorityScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function PriorityScore({ score, size = "md", showLabel = true }: PriorityScoreProps) {
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#ef4444", text: "text-red-400", label: "Critical" };
    if (s >= 60) return { stroke: "#f97316", text: "text-orange-400", label: "High" };
    if (s >= 40) return { stroke: "#eab308", text: "text-yellow-400", label: "Medium" };
    return { stroke: "#22c55e", text: "text-green-400", label: "Low" };
  };

  const color = getColor(score);
  const dimensions = {
    sm: { container: "w-12 h-12", text: "text-xs", label: "text-[10px]" },
    md: { container: "w-16 h-16", text: "text-sm", label: "text-xs" },
    lg: { container: "w-24 h-24", text: "text-xl", label: "text-sm" },
  };

  const dim = dimensions[size];
  const radius = size === "sm" ? 16 : size === "md" ? 22 : 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("relative flex items-center justify-center", dim.container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="#2e3548"
            strokeWidth="4"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className={cn("absolute font-bold", dim.text, color.text)}>
          {score}
        </span>
      </div>
      {showLabel && (
        <span className={cn("font-medium", dim.label, color.text)}>
          {color.label}
        </span>
      )}
    </div>
  );
}
