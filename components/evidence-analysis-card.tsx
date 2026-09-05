"use client";

import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Sparkles,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AuthenticityStatus =
  | "likely_authentic"
  | "suspicious"
  | "inconclusive";

interface EvidenceAnalysisCardProps {
  issueType: string;
  confidence: number;
  severity: string;
  priorityScore: number;
  department: string;
  reasons: string[];
  authenticityStatus: AuthenticityStatus;
  authenticityConfidence: number;
  authenticityExplanation: string;
}

const severityColor: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const authenticityMeta: Record<
  AuthenticityStatus,
  {
    label: string;
    sublabel: string;
    icon: typeof ShieldCheck;
    containerClass: string;
    badgeClass: string;
    iconClass: string;
  }
> = {
  likely_authentic: {
    label: "Likely Authentic",
    sublabel: "Likely authentic based on visible evidence",
    icon: ShieldCheck,
    containerClass: "border-emerald-500/30 bg-emerald-500/5",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    iconClass: "text-emerald-400",
  },
  suspicious: {
    label: "Suspicious",
    sublabel: "Suspicious — further verification recommended",
    icon: ShieldAlert,
    containerClass: "border-amber-500/30 bg-amber-500/5",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    iconClass: "text-amber-400",
  },
  inconclusive: {
    label: "Inconclusive",
    sublabel: "Inconclusive — insufficient evidence",
    icon: ShieldQuestion,
    containerClass: "border-slate-500/30 bg-slate-500/5",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    iconClass: "text-slate-300",
  },
};

export function EvidenceAnalysisCard(props: EvidenceAnalysisCardProps) {
  const {
    issueType,
    confidence,
    severity,
    priorityScore,
    department,
    reasons,
    authenticityStatus,
    authenticityConfidence,
    authenticityExplanation,
  } = props;

  const sevKey = severity.toLowerCase();
  const authMeta = authenticityMeta[authenticityStatus] ?? authenticityMeta.inconclusive;
  const AuthIcon = authMeta.icon;

  // Confidence values come from Gemini on a 0-100 scale.
  const confidencePct = Math.max(0, Math.min(100, Math.round(confidence)));
  const authPct = Math.max(0, Math.min(100, Math.round(authenticityConfidence)));

  return (
    <Card className="bg-[#1e2433] border-[#2e3548] overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#2e3548] bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-100">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          AI Evidence Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* ===== AI ISSUE ANALYSIS ===== */}
        <section>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
            AI Issue Analysis
          </p>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Detected Issue
              </p>
              <p className="text-xl font-bold text-white mt-1">{issueType}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#2e3548]"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-500"
                    strokeWidth="3"
                    strokeDasharray={`${confidencePct}, 100`}
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                  {confidencePct}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Confidence</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-[#1a1f2e] rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-2">Severity</p>
              <span
                className={cn(
                  "inline-flex px-3 py-1 rounded-full text-sm font-semibold border",
                  severityColor[sevKey] ?? severityColor.medium
                )}
              >
                {severity}
              </span>
            </div>
            <div className="bg-[#1a1f2e] rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-2">Priority Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{priorityScore}</span>
                <span className="text-sm text-slate-500">/100</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0f1419] rounded-lg p-4 border border-[#2e3548] mt-4">
            <p className="text-xs text-slate-500 mb-2">Recommended Department</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                AI Assigned
              </span>
              <span className="font-semibold text-white">{department}</span>
            </div>
          </div>

          {reasons?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                Why this priority?
              </p>
              <div className="space-y-2">
                {reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="border-t border-[#2e3548]" />

        {/* ===== EVIDENCE AUTHENTICITY ===== */}
        <section
          className={cn("rounded-xl border p-4", authMeta.containerClass)}
        >
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Evidence Authenticity
          </p>

          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-lg bg-black/20",
                authMeta.iconClass
              )}
            >
              <AuthIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border",
                    authMeta.badgeClass
                  )}
                >
                  Status: {authMeta.label}
                </span>
                <span className="text-xs text-slate-400">
                  {authPct}% confidence
                </span>
              </div>
              <p className="text-sm text-slate-200 mt-2 font-medium">
                {authMeta.sublabel}
              </p>
              {authenticityExplanation && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {authenticityExplanation}
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 italic">
            AI assessment is advisory. Manual review is recommended for high-impact decisions.
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
