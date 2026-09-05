"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CATEGORIES, DEPARTMENTS, SEVERITIES } from "@/lib/constants";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ComplaintRow {
  id: string;
  complaint_number: string;
  category: string;
  description: string;
  status: string;
  severity: string;
  priority_score: number;
  image_url: string | null;
  evidence_video_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  department: string;
  authenticity_status: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  streetlight: "Broken Streetlight",
  water_leakage: "Water Leakage",
  road_damage: "Road Damage",
  drainage: "Open Drain",
  other: "Other",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_OPTIONS = [
  { db: "submitted", label: "Submitted" },
  { db: "under_review", label: "Under Review" },
  { db: "assigned", label: "Assigned" },
  { db: "in_progress", label: "In Progress" },
  { db: "resolved", label: "Resolved" },
];

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function PriorityBadge({ priority }: { priority: number }) {
  if (priority >= 80) return <Badge variant="destructive">Critical ({priority})</Badge>;
  if (priority >= 60) return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">High ({priority})</Badge>;
  if (priority >= 40) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium ({priority})</Badge>;
  return <Badge className="bg-green-500 hover:bg-green-600 text-white">Low ({priority})</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const k = status.toLowerCase();
  if (k === "resolved") return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Resolved</Badge>;
  if (k === "in_progress") return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>;
  if (k === "assigned") return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Assigned</Badge>;
  if (k === "under_review") return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Under Review</Badge>;
  return <Badge variant="outline">Submitted</Badge>;
}

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity.toLowerCase()) {
    case "critical": return <Badge variant="destructive">Critical</Badge>;
    case "high": return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
    case "medium": return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
    default: return <Badge className="bg-green-500 hover:bg-green-600">Low</Badge>;
  }
}

function AuthenticityBadge({ status }: { status: string | null }) {
  const k = (status ?? "").toLowerCase();
  if (k === "likely_authentic") {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Authentic</Badge>;
  }
  if (k === "suspicious") {
    return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Suspicious</Badge>;
  }
  if (k === "inconclusive") {
    return <Badge className="bg-slate-500/15 text-slate-300 border-slate-500/30">Inconclusive</Badge>;
  }
  return <span className="text-slate-500 text-xs">—</span>;
}

const ITEMS_PER_PAGE = 10;

export default function ComplaintsManagement() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ComplaintRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("complaints")
        .select("id, complaint_number, category, description, status, severity, priority_score, image_url, evidence_video_url, address, latitude, longitude, department, authenticity_status, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to load complaints.");
        setComplaints([]);
      } else {
        setComplaints((data as ComplaintRow[]) ?? []);
      }
    } catch {
      toast.error("Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComplaints();
  }, [loadComplaints]);

  const filteredReports = useMemo(() => {
    return complaints.filter((r) => {
      const catLabel = CATEGORY_LABEL[r.category] ?? r.category;
      const matchesSearch =
        r.complaint_number.toLowerCase().includes(search.toLowerCase()) ||
        catLabel.toLowerCase().includes(search.toLowerCase()) ||
        (r.address ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || catLabel === categoryFilter;
      const matchesStatus = statusFilter === "All" || STATUS_LABEL[r.status] === statusFilter;
      const matchesSeverity = severityFilter === "All" || SEVERITY_LABEL[r.severity] === severityFilter;
      const matchesDepartment = departmentFilter === "All" || r.department === departmentFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesSeverity && matchesDepartment;
    });
  }, [complaints, search, categoryFilter, statusFilter, severityFilter, departmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openDialog = (report: ComplaintRow) => {
    setSelectedReport(report);
    setEditStatus(report.status);
    setEditDepartment(report.department ?? "Municipal Corporation");
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/complaints/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          department: editDepartment,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Update failed");
        return;
      }

      toast.success(`Status updated to "${STATUS_LABEL[editStatus] ?? editStatus}" for ${selectedReport.complaint_number}`);
      setIsDialogOpen(false);
      await loadComplaints();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Complaints Management
          </h1>
          <p className="text-slate-400 mt-1">
            {filteredReports.length} complaints found
          </p>
        </div>
      </div>

      <Card className="bg-[#1e2433] border-[#2e3548]">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by ID, issue, location..."
                className="pl-10 bg-[#0f1419] border-[#2e3548] text-white"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px] bg-[#0f1419] border-[#2e3548] text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2433] border-[#2e3548]">
                  <SelectItem value="All">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px] bg-[#0f1419] border-[#2e3548] text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2433] border-[#2e3548]">
                  <SelectItem value="All">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.db} value={s.label}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px] bg-[#0f1419] border-[#2e3548] text-white">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2433] border-[#2e3548]">
                  <SelectItem value="All">All Severities</SelectItem>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={(v) => { setDepartmentFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px] bg-[#0f1419] border-[#2e3548] text-white">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2433] border-[#2e3548]">
                  <SelectItem value="All">All Departments</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1e2433] border-[#2e3548] overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="ml-3 text-slate-400">Loading complaints…</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2e3548] hover:bg-transparent">
                    <TableHead className="text-slate-400 font-medium">ID</TableHead>
                    <TableHead className="text-slate-400 font-medium">Issue</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden md:table-cell">Location</TableHead>
                    <TableHead className="text-slate-400 font-medium">Severity</TableHead>
                    <TableHead className="text-slate-400 font-medium">Priority</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden lg:table-cell">Department</TableHead>
                    <TableHead className="text-slate-400 font-medium">Status</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden xl:table-cell">Authenticity</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-slate-400 font-medium">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="border-[#2e3548] hover:bg-[#242938] transition-colors"
                    >
                      <TableCell className="font-mono text-sm text-white">{report.complaint_number}</TableCell>
                      <TableCell className="text-white font-medium">{CATEGORY_LABEL[report.category] ?? report.category}</TableCell>
                      <TableCell className="text-slate-400 truncate max-w-[150px] hidden md:table-cell">
                        {report.address ?? "—"}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={report.severity} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={report.priority_score} />
                      </TableCell>
                      <TableCell className="text-slate-400 hidden lg:table-cell">{report.department}</TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <AuthenticityBadge status={report.authenticity_status} />
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm hidden md:table-cell">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(report)}
                            className="border-[#2e3548] text-slate-300 hover:bg-[#2e3548]"
                          >
                            Update
                          </Button>
                          <Link href={`/admin/complaints/${report.id}`}>
                            <Button size="sm" variant="outline" className="border-[#2e3548] text-slate-300 hover:bg-[#2e3548]">
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedReports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                        No complaints match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2e3548]">
              <p className="text-sm text-slate-400">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} of{" "}
                {filteredReports.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-[#2e3548] text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-600" : "border-[#2e3548] text-slate-300"}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#2e3548] text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1e2433] border-[#2e3548] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Issue {selectedReport?.complaint_number}: {selectedReport ? CATEGORY_LABEL[selectedReport.category] ?? selectedReport.category : ""}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Reported on {selectedReport?.created_at ? new Date(selectedReport.created_at).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="w-full h-40 bg-[#0f1419] rounded-lg border border-[#2e3548] flex items-center justify-center text-slate-500 overflow-hidden">
              {selectedReport?.image_url ? (
                <img src={selectedReport.image_url} alt="Report" className="w-full h-full object-cover" />
              ) : (
                <span>No image uploaded</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">Location</p>
                <p className="text-sm text-white">{selectedReport?.address ?? "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Department</p>
                <p className="text-sm text-white">{selectedReport?.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Severity & Priority</p>
                <div className="flex gap-2 mt-1">
                  {selectedReport && <SeverityBadge severity={selectedReport.severity} />}
                  {selectedReport && <PriorityBadge priority={selectedReport.priority_score} />}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Description</p>
              <p className="text-sm text-white bg-[#0f1419] p-3 rounded-lg border border-[#2e3548]">
                {selectedReport?.description}
              </p>
            </div>

            <div className="mt-4 border-t border-[#2e3548] pt-4 space-y-3">
              <p className="text-sm font-medium text-slate-400">Update Status</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Status</label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="w-full bg-[#0f1419] border-[#2e3548] text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e2433] border-[#2e3548]">
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.db} value={s.db}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Department</label>
                  <Select value={editDepartment} onValueChange={setEditDepartment}>
                    <SelectTrigger className="w-full bg-[#0f1419] border-[#2e3548] text-white">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e2433] border-[#2e3548]">
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save changes"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#2e3548] text-slate-300">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
