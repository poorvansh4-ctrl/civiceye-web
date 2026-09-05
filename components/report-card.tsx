"use client";

import { Report } from "@/data/types";
import { cn, formatDate } from "@/lib/utils";
import { MapPin, Calendar, Building, AlertTriangle, Droplet, Car, Zap, Trash2, HelpCircle } from "lucide-react";
import Link from "next/link";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";

import { LucideIcon } from "lucide-react";

interface ReportCardProps {
  report: Report;
  className?: string;
}

const CategoryIconMap: Record<string, LucideIcon> = {
  Pothole: Car,
  Garbage: Trash2,
  "Broken Streetlight": Zap,
  "Water Leakage": Droplet,
  "Road Damage": AlertTriangle,
  "Open Drain": Droplet,
  Other: HelpCircle,
};

export function ReportCard({ report, className }: ReportCardProps) {
  const Icon = CategoryIconMap[report.category] || HelpCircle;

  return (
    <Link href={`/reports/${report.id}`}>
      <div
        className={cn(
          "bg-[#1e2433] border border-[#2e3548] rounded-xl overflow-hidden",
          "hover:border-[#3b82f6]/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200",
          "group cursor-pointer",
          className
        )}
      >
        {/* Image Header */}
        <div className="relative h-36 bg-[#1a1f2e] overflow-hidden">
          {report.imageUrl && report.imageUrl.startsWith("http") ? (
            <img
              src={report.imageUrl}
              alt={report.category}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1f2e] to-[#242938]">
              <Icon className="w-12 h-12 text-slate-600" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <StatusBadge status={report.status} />
          </div>
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-mono text-slate-300">
              {report.id}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                {report.category}
              </h3>
              <p className="text-sm text-slate-400 line-clamp-2 mt-1">{report.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{report.location}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#2e3548]">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={report.priority} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                {report.department.split(" ")[0]}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(report.reportedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
