"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface AIAnalysisResultProps {
  issueType: string;
  confidence: number;
  severity: string;
  priorityScore: number;
  department: string;
  reasons: string[];
}

export function AIAnalysisResult({
  issueType,
  confidence,
  severity,
  priorityScore,
  department,
  reasons,
}: AIAnalysisResultProps) {
  const getSeverityColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "critical": return "bg-red-500/15 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
      default: return "bg-green-500/15 text-green-400 border-green-500/30";
    }
  };

  return (
    <Card className="bg-[#1e2433] border-[#2e3548] overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#2e3548] bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-100">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          AI Detection Results
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Issue Type & Confidence */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Detected Issue</p>
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
                  strokeDasharray={`${confidence}, 100`}
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Confidence</span>
          </div>
        </div>

        {/* Severity & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1f2e] rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-2">Severity</p>
            <span className={cn("inline-flex px-3 py-1 rounded-full text-sm font-semibold border", getSeverityColor(severity))}>
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

        {/* Department */}
        <div className="bg-[#0f1419] rounded-lg p-4 border border-[#2e3548]">
          <p className="text-xs text-slate-500 mb-2">Assigned Department</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Assigned
            </span>
            <span className="font-semibold text-white">{department}</span>
          </div>
        </div>

        {/* Reasons */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Why this priority?</p>
          <div className="space-y-2">
            {reasons.map((reason, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
