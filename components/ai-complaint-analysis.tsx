"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Brain, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Target, Gauge, Building, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANALYZE_ENDPOINT } from "@/lib/api";

export interface AIAnalysisResult {
  category: "pothole" | "garbage" | "streetlight" | "water_leakage" | "road_damage" | "drainage" | "other";
  issue_title: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  priority_score: number;
  department: string;
  reason: string;
}

interface AIComplaintAnalysisProps {
  imageFile: File | null;
  description: string;
  onAnalysisComplete: (result: AIAnalysisResult) => void;
  onAnalysisError?: (error: string) => void;
  autoStart?: boolean;
}

type AnalysisStage = "idle" | "uploading" | "analyzing" | "detecting" | "severity" | "priority" | "department" | "complete" | "error";

const STAGES: { key: AnalysisStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "uploading", label: "Uploading evidence...", icon: FileText },
  { key: "analyzing", label: "Analyzing image with AI...", icon: Brain },
  { key: "detecting", label: "Detecting civic issue...", icon: Target },
  { key: "severity", label: "Evaluating severity...", icon: AlertTriangle },
  { key: "priority", label: "Calculating priority...", icon: Gauge },
  { key: "department", label: "Assigning department...", icon: Building },
];

const SEVERITY_COLORS = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const SEVERITY_GLOW = {
  critical: "shadow-red-500/20",
  high: "shadow-orange-500/20",
  medium: "shadow-yellow-500/20",
  low: "shadow-emerald-500/20",
};

export function AIComplaintAnalysis({
  imageFile,
  description,
  onAnalysisComplete,
  onAnalysisError,
  autoStart = false,
}: AIComplaintAnalysisProps) {
  const [stage, setStage] = useState<AnalysisStage>("idle");
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  const [animatedPriority, setAnimatedPriority] = useState(0);

  const analyze = useCallback(async () => {
    if (!imageFile) return;

    setStage("uploading");
    setCurrentStageIndex(0);
    setResult(null);
    setError(null);
    setAnimatedConfidence(0);
    setAnimatedPriority(0);

    try {
      for (let i = 0; i < STAGES.length; i++) {
        setStage(STAGES[i].key);
        setCurrentStageIndex(i);
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));
      }

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("description", description);

      const response = await fetch(ANALYZE_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Analysis failed: ${response.status}`);
      }

      const analysisResult: AIAnalysisResult = await response.json();

      setResult(analysisResult);
      setStage("complete");
      onAnalysisComplete(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Analysis failed";
      setError(errorMessage);
      setStage("error");
      onAnalysisError?.(errorMessage);
    }
  }, [imageFile, description, onAnalysisComplete, onAnalysisError]);

  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (autoStart && imageFile && stage === "idle" && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      analyze();
    }
  }, [autoStart, imageFile, stage, analyze]);

  useEffect(() => {
    if (result && stage === "complete") {
      const confidenceInterval = setInterval(() => {
        setAnimatedConfidence((prev) => {
          if (prev >= result.confidence) {
            clearInterval(confidenceInterval);
            return result.confidence;
          }
          return prev + 1;
        });
      }, 20);

      const priorityInterval = setInterval(() => {
        setAnimatedPriority((prev) => {
          if (prev >= result.priority_score) {
            clearInterval(priorityInterval);
            return result.priority_score;
          }
          return prev + 1;
        });
      }, 15);

      return () => {
        clearInterval(confidenceInterval);
        clearInterval(priorityInterval);
      };
    }
  }, [result, stage]);

  if (stage === "idle") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
          <Brain className="w-10 h-10 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">AI Analysis Ready</h3>
        <p className="text-slate-400 text-center max-w-md mb-6">
          Our AI will analyze your image to detect the civic issue, evaluate severity, and assign priority.
        </p>
        <button
          onClick={analyze}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
        >
          <Sparkles className="w-5 h-5 mr-2 inline" />
          Start AI Analysis
        </button>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
        <p className="text-slate-400 text-center max-w-md mb-2">{error}</p>
        <p className="text-slate-500 text-sm text-center max-w-md mb-6">
          You can retry the analysis or continue without AI insights.
        </p>
        <button
          onClick={analyze}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
        >
          <RefreshCw className="w-5 h-5 mr-2 inline" />
          Retry Analysis
        </button>
      </div>
    );
  }

  if (stage === "complete" && result) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Analysis Complete</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#0f1419] border border-[#2e3548]">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Detection</span>
            </div>
            <p className="text-lg font-bold text-white mb-1">{result.issue_title}</p>
            <p className="text-sm text-slate-400 capitalize">{result.category.replace("_", " ")}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">Confidence:</span>
              <span className="text-sm font-bold text-blue-400">{animatedConfidence}%</span>
            </div>
          </div>

          <div className={cn("p-4 rounded-xl border", SEVERITY_COLORS[result.severity], `shadow-lg ${SEVERITY_GLOW[result.severity]}`)}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Severity</span>
            </div>
            <p className="text-2xl font-bold uppercase">{result.severity}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0f1419] border border-[#2e3548]">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Priority Score</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{animatedPriority}</span>
              <span className="text-lg text-slate-500 mb-1">/100</span>
            </div>
            <div className="mt-3 h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${animatedPriority}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f1419] border border-[#2e3548]">
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Department</span>
            </div>
            <p className="text-lg font-bold text-white">{result.department}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f1419] border border-[#2e3548]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Reasoning</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{result.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-blue-500/10 animate-pulse" />
        <div className="absolute inset-0 rounded-full bg-[#1e2433] border border-blue-500/30 flex items-center justify-center">
          <Brain className="w-10 h-10 text-blue-400 animate-pulse" />
        </div>
      </div>

      <div className="w-full max-w-md space-y-3">
        {STAGES.map((stageItem, index) => {
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex;
          const StageIcon = stageItem.icon;

          return (
            <div
              key={stageItem.key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                isActive && "bg-blue-500/10 border border-blue-500/30",
                isComplete && "bg-emerald-500/5 border border-emerald-500/20",
                !isActive && !isComplete && "opacity-40"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  isActive && "bg-blue-500/20",
                  isComplete && "bg-emerald-500/20",
                  !isActive && !isComplete && "bg-[#2e3548]"
                )}
              >
                {isActive ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <StageIcon className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive && "text-blue-400",
                  isComplete && "text-emerald-400",
                  !isActive && !isComplete && "text-slate-500"
                )}
              >
                {stageItem.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AIComplaintAnalysis;
