"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Video as VideoIcon,
  MapPin,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AIAnalysisResult } from "@/components/ai-analysis-result";
import { EvidenceAnalysisCard, type AuthenticityStatus } from "@/components/evidence-analysis-card";
import { ReportTimeline } from "@/components/report-timeline";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { PriorityScore } from "@/components/priority-score";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const TIMELINE_STEPS = [
  { status: "submitted", label: "Submitted", description: "Your report has been received" },
  { status: "under_review", label: "Under Review", description: "Municipal team is reviewing your report" },
  { status: "assigned", label: "Assigned", description: "Assigned to a department" },
  { status: "in_progress", label: "In Progress", description: "Field team is working on the issue" },
  { status: "resolved", label: "Resolved", description: "Issue has been resolved" },
];

const CATEGORY_LABEL: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  streetlight: "Broken Streetlight",
  water_leakage: "Water Leakage",
  road_damage: "Road Damage",
  drainage: "Open Drain",
  other: "Other",
};

interface ComplaintRow {
  id: string;
  complaint_number: string | null;
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
  department: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  authenticity_status: AuthenticityStatus | null;
  authenticity_confidence: number | null;
  authenticity_explanation: string | null;
}

export default function ReportDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ComplaintRow | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        const { data, error } = await supabase
          .from('complaints')
          .select('id, complaint_number, category, description, image_url, evidence_video_url, address, latitude, longitude, ai_confidence, severity, priority_score, department, status, created_at, updated_at, user_id, authenticity_status, authenticity_confidence, authenticity_explanation')
          .eq('id', id)
          .maybeSingle();
        if (error) {
          console.error('[ReportDetail] Supabase error:', error);
          toast.error(`Failed to load report: ${error.message}`);
          setReport(null);
          return;
        }
        if (!data) {
          console.warn(
            '[ReportDetail] No row found for id =',
            id,
            'user_id =',
            user.id
          );
          setReport(null);
          return;
        }
        if (data.user_id !== user.id) {
          console.warn(
            '[ReportDetail] Row found but user_id mismatch',
            'expected',
            user.id,
            'got',
            data.user_id
          );
          setReport(null);
          return;
        }
        setReport(data as ComplaintRow);
      } catch (err) {
        console.error('[ReportDetail] Unexpected error:', err);
        toast.error(
          err instanceof Error
            ? `Unable to load report: ${err.message}`
            : 'Unable to load report.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  const timeline = useMemo(() => {
    if (!report) return [];
    const currentIdx = TIMELINE_STEPS.findIndex((s) => s.status === report.status);
    return TIMELINE_STEPS.map((s, idx) => {
      const completed = currentIdx >= 0 && idx <= currentIdx;
      const isCurrent = idx === currentIdx && report.status !== 'resolved';
      return {
        label: s.label,
        description: s.description,
        timestamp: completed ? report.updated_at : report.created_at,
        completed,
        status: isCurrent ? 'current' as const : (completed ? 'completed' as const : 'pending' as const),
      };
    });
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading report…</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Report not found</h1>
          <p className="text-sm text-slate-400 mb-4 max-w-md text-center">
            We couldn&apos;t find this report in the database. It may have been
            removed, or your account doesn&apos;t have access to it.
          </p>
          <Button asChild>
            <Link href="/reports">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABEL[report.category] ?? 'Other';
  const statusLabel = STATUS_LABEL[report.status] ?? 'Submitted';
  const confidence = (report.ai_confidence ?? 0) / 100;
  const lat = report.latitude ?? 0;
  const lng = report.longitude ?? 0;
  const coordText = lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : '';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/reports"
          className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Reports
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 space-y-6">
            <div className="bg-[#242938] rounded-xl aspect-video flex flex-col items-center justify-center text-slate-500 overflow-hidden relative">
              {report.evidence_video_url ? (
                <video
                  src={report.evidence_video_url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                />
              ) : report.image_url ? (
                <img src={report.image_url} alt="Report" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-16 h-16 mb-2 opacity-30" />
                  <span className="text-sm">Report Image</span>
                </>
              )}
              <div className="absolute top-4 left-4">
                <StatusBadge status={statusLabel as unknown as import('@/lib/constants').Status} />
              </div>
            </div>

            {report.evidence_video_url && (
              <a
                href={report.evidence_video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
              >
                <VideoIcon className="w-4 h-4 mr-1" />
                Open video evidence in a new tab
              </a>
            )}

            {(report.authenticity_status || report.ai_confidence != null) && (
              <EvidenceAnalysisCard
                issueType={categoryLabel}
                confidence={report.ai_confidence ?? 0}
                severity={(report.severity ?? 'medium').toString().toUpperCase()}
                priorityScore={report.priority_score ?? 0}
                department={report.department ?? 'Municipal Corporation'}
                reasons={[
                  `Detected as ${categoryLabel} by CivicEye AI.`,
                  report.address ? `Reported at ${report.address}.` : 'Location captured from device GPS.',
                  `Severity: ${report.severity}.`,
                  `Recommended department: ${report.department}.`,
                ]}
                authenticityStatus={
                  (report.authenticity_status ?? 'inconclusive') as AuthenticityStatus
                }
                authenticityConfidence={report.authenticity_confidence ?? 0}
                authenticityExplanation={
                  report.authenticity_explanation ??
                  'Authenticity was not assessed for this report.'
                }
              />
            )}

            {!report.authenticity_status && (
              <AIAnalysisResult
                issueType={categoryLabel}
                confidence={confidence}
                severity={(report.severity ?? 'medium').toString().toUpperCase()}
                priorityScore={report.priority_score ?? 0}
                department={report.department ?? 'Municipal Corporation'}
                reasons={[
                  `Detected as ${categoryLabel} by CivicEye AI.`,
                  report.address ? `Reported at ${report.address}.` : 'Location captured from device GPS.',
                  `Severity: ${report.severity}.`,
                  `Recommended department: ${report.department}.`,
                ]}
              />
            )}

            <Card className="bg-[var(--bg-card)] border-[var(--border-primary)]">
              <CardHeader className="pb-3">
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-[var(--border-primary)]">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Complaint Number</p>
                    <p className="font-mono font-medium text-[var(--text-primary)]">{report.complaint_number ?? report.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Reported</p>
                    <p className="font-medium text-[var(--text-primary)]">{formatDateTime(report.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Last Updated</p>
                    <p className="font-medium text-[var(--text-primary)]">{formatDateTime(report.updated_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Category</p>
                    <p className="font-medium text-[var(--text-primary)]">{categoryLabel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:w-1/3 space-y-6">
            <Card className="bg-[var(--bg-card)] border-[var(--border-primary)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] text-sm">Status</span>
                  <StatusBadge status={statusLabel as unknown as import('@/lib/constants').Status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] text-sm">Severity</span>
                  <span className="text-sm font-medium text-white uppercase">{report.severity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] text-sm">Priority</span>
                  <PriorityBadge priority={report.priority_score ?? 0} />
                </div>
                <div className="flex justify-center py-4">
                  <PriorityScore score={report.priority_score ?? 0} size="md" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-card)] border-[var(--border-primary)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] break-words">
                      {report.address && !/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(report.address)
                        ? `📍 ${report.address}`
                        : 'Location name unavailable'}
                    </p>
                    {coordText && (
                      <p className="text-sm text-[var(--text-secondary)] font-mono mt-1">
                        Coordinates: {coordText}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {report.authenticity_status && (
              <Card className="bg-[var(--bg-card)] border-[var(--border-primary)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {report.authenticity_status === 'likely_authentic' && (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    )}
                    {report.authenticity_status === 'suspicious' && (
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                    )}
                    {report.authenticity_status === 'inconclusive' && (
                      <ShieldQuestion className="w-5 h-5 text-slate-300" />
                    )}
                    Evidence Authenticity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--text-primary)] font-medium capitalize">
                    {report.authenticity_status.replace(/_/g, ' ')}
                  </p>
                  {report.authenticity_confidence != null && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Confidence: {report.authenticity_confidence}%
                    </p>
                  )}
                  {report.authenticity_explanation && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                      {report.authenticity_explanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-[var(--bg-card)] border-[var(--border-primary)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Progress Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTimeline events={timeline} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
