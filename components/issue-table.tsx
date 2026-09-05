"use client";

import { Report } from "@/data/types";
import { Severity, Status } from "@/lib/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { SeverityBadge } from "./severity-badge";
import { MapPin, AlertTriangle, Droplet, Car, Zap, Trash2, Building } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface IssueTableProps {
  reports: Report[];
  onRowClick?: (id: string) => void;
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

export function IssueTable({ reports, onRowClick }: IssueTableProps) {
  return (
    <div className="rounded-xl border border-[#2e3548] overflow-hidden bg-[#1e2433]">
      <Table>
        <TableHeader className="bg-[#1a1f2e]">
          <TableRow className="border-[#2e3548] hover:bg-transparent">
            <TableHead className="text-slate-400">ID</TableHead>
            <TableHead className="text-slate-400">Issue</TableHead>
            <TableHead className="text-slate-400">Location</TableHead>
            <TableHead className="text-slate-400">Severity</TableHead>
            <TableHead className="text-slate-400">Priority</TableHead>
            <TableHead className="text-slate-400">Department</TableHead>
            <TableHead className="text-slate-400">Status</TableHead>
            <TableHead className="text-slate-400 text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const Icon = CategoryIconMap[report.category] || AlertTriangle;
            return (
              <TableRow 
                key={report.id} 
                className="border-[#2e3548] hover:bg-[#2e3548]/30 cursor-pointer transition-colors"
                onClick={() => onRowClick?.(report.id)}
              >
                <TableCell className="font-medium text-slate-300">{report.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <div className="p-1.5 bg-[#2e3548] rounded text-[#3b82f6] shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-200 truncate">{report.category}</p>
                      <p className="text-xs text-slate-400 truncate">{report.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-slate-300 text-sm max-w-[150px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{report.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={report.severity as Severity} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={report.priority} />
                </TableCell>
                <TableCell className="text-slate-300">{report.department}</TableCell>
                <TableCell>
                  <StatusBadge status={report.status as Status} />
                </TableCell>
                <TableCell className="text-right text-slate-400 text-sm">
                  {formatDate(report.reportedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
