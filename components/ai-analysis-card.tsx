import { AnalysisResult } from "@/data/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { SeverityBadge } from "./severity-badge";
import { Severity } from "@/lib/constants";

interface AIAnalysisCardProps {
  analysis: AnalysisResult;
  className?: string;
}

export function AIAnalysisCard({ analysis, className }: AIAnalysisCardProps) {
  return (
    <Card className={cn("bg-[#1e2433] border-[#2e3548]", className)}>
      <CardHeader className="pb-2 border-b border-[#2e3548]">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-100">
          <Sparkles className="w-5 h-5 text-[#3b82f6]" />
          AI Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Detected Issue</p>
            <p className="font-medium text-slate-200">{analysis.detectedIssue}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#2e3548]"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#3b82f6]"
                  strokeWidth="3"
                  strokeDasharray={`${analysis.confidence * 100}, 100`}
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-200">
                {Math.round(analysis.confidence * 100)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Confidence</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-slate-400">Priority Score</p>
              <span className="text-sm font-bold text-slate-200">{analysis.priorityScore}/100</span>
            </div>
            <Progress value={analysis.priorityScore} className="h-2 bg-[#2e3548]" />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">Assessed Severity</p>
            <SeverityBadge severity={analysis.severity as Severity} />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">Assigned Department</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#3b82f6]/10 text-[#3b82f6]">
                <Sparkles className="w-3 h-3" />
                AI Assigned
              </span>
              <span className="font-medium text-slate-200">{analysis.recommendedDepartment}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
