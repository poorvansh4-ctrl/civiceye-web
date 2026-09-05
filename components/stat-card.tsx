import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("bg-[#1e2433] border border-[#2e3548] rounded-xl p-6 flex items-center justify-between", className)}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
          {trend && (
            <span className={cn("text-xs font-medium flex items-center", trend.positive ? "text-green-500" : "text-red-500")}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
      <div className="h-12 w-12 rounded-full bg-[#2e3548] flex items-center justify-center text-[#3b82f6]">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
