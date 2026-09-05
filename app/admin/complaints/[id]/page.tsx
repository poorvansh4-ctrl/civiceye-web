"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Video as VideoIcon,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Building,
  Sparkles,
  TrendingUp,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { DEPARTMENTS, type Status, type Severity } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIAnalysisResult as AIAnalysisResultComponent } from "@/components/ai-analysis-result";
import { EvidenceAnalysisCard, type AuthenticityStatus } from "@/components/evidence-analysis-card";
import { ReportTimeline } from "@/components/report-timeline";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { PriorityScore } from "@/components/priority-score";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface PageProps {
  params: Promise<{ id: string }>;
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

const TIMELINE_STEPS = [
  { status: "submitted", label: "Submitted", description: "Your report has been received" },
  { status: "under_review", label: "Under Review", description: "Municipal team is reviewing your report" },
  { status: "assigned", label: "Assigned", description: "Assigned to a department" },
  { status: "in_progress", label: "In Progress", description: "Field team is working on the issue" },
  { status: "resolved", label: "Resolved", description: "Issue has been resolved" },
];

interface ComplaintRow {
  id: string;
  complaint_number: string;
  category: string;
  description: string;
  image_url: string | null;
  evidence_video_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  ai_confidence: number | null;
  severity: string;
  priority_score: number;
  department: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  authenticity_status: AuthenticityStatus | null;
  authenticity_confidence: number | null;
  authenticity_explanation: string | null;
}

export default function AdminComplaintDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ComplaintRow | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingDept, setSavingDept] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("complaints")
          .select("id, complaint_number, category, description, image_url, evidence_video_url, address, latitude, longitude, ai_confidence, severity, priority_score, department, status, created_at, updated_at, user_id, authenticity_status, authenticity_confidence, authenticity_explanation")
          .eq("id", id)
          .maybeSingle();
        if (error) {
          toast.error("Failed to load complaint.");
          setReport(null);
        } else {
          setReport((data as ComplaintRow) ?? null);
        }
      } catch {
        toast.error("Unable to load complaint.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="ml-3 text-slate-400">Loading complaint…</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-slate-200 mb-4">Complaint not found</h1>
          <Button asChild>
            <Link href="/admin/complaints">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Complaints
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABEL[report.category] ?? report.category;
  const currentIdx = TIMELINE_STEPS.findIndex((s) => s.status === report.status);
  const timeline = TIMELINE_STEPS.map((s, idx) => {
    const completed = currentIdx >= 0 && idx <= currentIdx;
    const isCurrent = idx === currentIdx && report.status !== "resolved";
    return {
      label: s.label,
      description: s.description,
      timestamp: completed ? report.updated_at : report.created_at,
      completed,
      status: isCurrent ? "current" as const : (completed ? "completed" as const : "pending" as const),
    };
  });

  const priorityFactors = [
    { label: "Severity", level: report.severity, icon: AlertTriangle },
    { label: "Priority Score", level: String(report.priority_score), icon: TrendingUp },
    { label: "AI Confidence", level: report.ai_confidence ? `${Math.round(report.ai_confidence * 100)}%` : "—", icon: Sparkles },
    { label: "Department", level: report.department, icon: Building },
  ];

  const handleStatusChange = async (newStatus: string) => {
    setSavingStatus(true);
    try {
      const response = await fetch(`/api/admin/complaints/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to update status");
        return;
      }

      setReport({ ...report, status: newStatus, updated_at: new Date().toISOString() });
      toast.success(`Status updated to "${STATUS_LABEL[newStatus] ?? newStatus}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAssignDepartment = async (dept: string) => {
    if (!dept || dept === report.department) return;
    setSavingDept(true);
    try {
      const response = await fetch(`/api/admin/complaints/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: dept }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to assign department");
        return;
      }

      setReport({ ...report, department: dept, updated_at: new Date().toISOString() });
      toast.success(`Assigned to ${dept}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingDept(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/complaints"
            className="p-2 rounded-lg bg-[#1e2433] border border-[#2e3548] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Complaint {report.complaint_number}</h1>
              <StatusBadge status={STATUS_LABEL[report.status] as Status} />
            </div>
            <p className="text-slate-400 mt-1">Reported on {new Date(report.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report.evidence_video_url ? (
            <Link href={report.evidence_video_url} target="_blank">
              <Button variant="outline" className="border-[#2e3548] text-slate-300">
                <VideoIcon className="w-4 h-4 mr-2" /> View Video
              </Button>
            </Link>
          ) : report.image_url ? (
            <Link href={report.image_url} target="_blank">
              <Button variant="outline" className="border-[#2e3548] text-slate-300">
                View Image
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {report.authenticity_status === "suspicious" && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">AI flagged this evidence for manual verification.</p>
            <p className="text-sm text-amber-200/80 mt-1">
              The submitted video shows visual patterns that warrant a human
              review. The complaint has NOT been automatically rejected; an
              admin should inspect the evidence before routing it to a
              department.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#1e2433] border-[#2e3548] overflow-hidden">
            <div className="aspect-video bg-[#0f1419] flex items-center justify-center relative">
              {report.evidence_video_url ? (
                <video
                  src={report.evidence_video_url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                />
              ) : report.image_url && report.image_url.startsWith("http") ? (
                <img src={report.image_url} alt="Report" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-16 h-16 text-slate-700 mx-auto mb-2" />
                  <span className="text-slate-500">No media uploaded</span>
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Citizen Description</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{report.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#2e3548]">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">User ID</p>
                    <p className="text-sm text-white font-mono truncate max-w-[100px]" title={report.user_id}>{report.user_id.slice(0, 8)}…</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Reported</p>
                    <p className="text-sm text-white">{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-sm text-white">{report.address ?? "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="text-sm text-white">{report.department}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AIAnalysisResultComponent
            issueType={categoryLabel}
            confidence={(report.ai_confidence ?? 0) > 1 ? (report.ai_confidence ?? 0) / 100 : (report.ai_confidence ?? 0)}
            severity={(report.severity ?? "medium").toString().toUpperCase()}
            priorityScore={report.priority_score}
            department={report.department}
            reasons={[
              `Detected as ${categoryLabel} by CivicEye AI.`,
              report.address ? `Reported at ${report.address}.` : "Location captured from device GPS.",
              `Severity: ${report.severity}.`,
              `Recommended department: ${report.department}.`,
            ]}
          />

          {report.authenticity_status && (
            <EvidenceAnalysisCard
              issueType={categoryLabel}
              confidence={report.ai_confidence ?? 0}
              severity={(report.severity ?? "medium").toString().toUpperCase()}
              priorityScore={report.priority_score}
              department={report.department}
              reasons={[
                `Detected as ${categoryLabel} by CivicEye AI.`,
                report.address ? `Reported at ${report.address}.` : "Location captured from device GPS.",
              ]}
              authenticityStatus={report.authenticity_status}
              authenticityConfidence={report.authenticity_confidence ?? 0}
              authenticityExplanation={
                report.authenticity_explanation ?? "No authenticity explanation provided."
              }
            />
          )}

          <Card className="bg-[#1e2433] border-[#2e3548]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Complaint summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {priorityFactors.map((factor) => {
                  const Icon = factor.icon;
                  return (
                    <div key={factor.label} className="bg-[#0f1419] rounded-lg p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{factor.label}</p>
                      <p className="font-semibold text-white">{factor.level}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e2433] border-[#2e3548]">
            <CardHeader className="pb-3">
              <CardTitle>Progress Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTimeline events={timeline} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1e2433] border-[#2e3548]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Status</span>
                <StatusBadge status={STATUS_LABEL[report.status] as Status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Severity</span>
                <SeverityBadge severity={(report.severity.charAt(0).toUpperCase() + report.severity.slice(1)) as Severity} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Priority</span>
                <PriorityBadge priority={report.priority_score} />
              </div>
              <div className="flex justify-center py-4">
                <PriorityScore score={report.priority_score} size="md" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e2433] border-[#2e3548]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.db}
                    onClick={() => handleStatusChange(s.db)}
                    disabled={savingStatus}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center justify-between ${
                      report.status === s.db
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-[#0f1419] text-slate-400 border border-[#2e3548] hover:border-[#2e3548]/80 hover:text-white"
                    }`}
                  >
                    {s.label}
                    {report.status === s.db && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e2433] border-[#2e3548]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Department Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#0f1419] rounded-lg p-4 border border-[#2e3548]">
                <p className="text-xs text-slate-500 mb-1">Current Department</p>
                <p className="font-semibold text-white">{report.department}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Detected as {categoryLabel.toLowerCase()} issue with priority {report.priority_score}.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500">Change Department</label>
                <select
                  value={report.department}
                  onChange={(e) => handleAssignDepartment(e.target.value)}
                  disabled={savingDept}
                  className="w-full h-10 px-3 rounded-lg border border-[#2e3548] bg-[#0f1419] text-white text-sm"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e2433] border-[#2e3548]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {report.address && !/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(report.address)
                      ? `📍 ${report.address}`
                      : "Location name unavailable"}
                  </p>
                  {report.latitude != null && report.longitude != null && (
                    <p className="text-sm text-slate-400 font-mono mt-1">
                      Coordinates: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
