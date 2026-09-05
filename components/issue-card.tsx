"use client";

import { Report } from "@/data/types";
import { cn, formatDate } from "@/lib/utils";
import { MapPin, AlertTriangle, Droplet, Car, Zap, Trash2, Building } from "lucide-react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Status } from "@/lib/constants";

interface IssueCardProps {
  report: Report;
  onClick?: () => void;
  className?: string;
}

const CategoryIconMap: Record<string, LucideIcon> = {
  Pothole: Car,
  Garbage: Trash2,
  "Broken Streetlight": Zap,
  "Water Leakage": Droplet,
  "Road Damage": Building,
  "Open Drain": AlertTriangle,
  Other: AlertTriangle,
};

export function IssueCard({ report, onClick, className }: IssueCardProps) {
  const Icon = CategoryIconMap[report.category] || AlertTriangle;

  return (
    <Link href={`/reports/${report.id}`} onClick={onClick}>
      <Card className={cn("bg-[#1e2433] border-[#2e3548] hover:border-[#3b82f6]/30 transition-colors cursor-pointer", className)}>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#2e3548] rounded-lg text-[#3b82f6]">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">{report.id}</span>
                <p className="text-sm font-semibold text-slate-200">{report.category}</p>
              </div>
            </div>
            <StatusBadge status={report.status as Status} />
          </div>

          <p className="text-sm text-slate-300 line-clamp-2">{report.description}</p>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{report.location}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#2e3548]">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={report.priority} />
            </div>
            <div className="text-xs text-slate-400 flex flex-col items-end">
              <span className="font-medium text-slate-300">{report.department}</span>
              <span>{formatDate(report.reportedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
