"use client";

import { useState, useEffect, useRef } from "react";

interface AIAnalysisAnimationProps {
  isScanning: boolean;
  onComplete?: () => void;
}

const SCAN_STAGES = [
  { label: "UPLOADING EVIDENCE", duration: 800 },
  { label: "VISION ANALYSIS", duration: 1200 },
  { label: "ISSUE DETECTION", duration: 1000 },
  { label: "SEVERITY ANALYSIS", duration: 900 },
  { label: "DUPLICATE DETECTION", duration: 1100 },
  { label: "PRIORITY ENGINE", duration: 800 },
  { label: "DEPARTMENT ASSIGNMENT", duration: 700 },
];

export function AIAnalysisAnimation({ isScanning, onComplete }: AIAnalysisAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const wasScanningRef = useRef(false);

  useEffect(() => {
    if (!isScanning) {
      if (wasScanningRef.current) {
        setCurrentStage(0);
        setProgress(0);
        setStageProgress(0);
      }
      wasScanningRef.current = false;
      return;
    }

    wasScanningRef.current = true;

    startTimeRef.current = Date.now();
    const totalDuration = SCAN_STAGES.reduce((acc, stage) => acc + stage.duration, 0);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      let accumulated = 0;
      for (let i = 0; i < SCAN_STAGES.length; i++) {
        accumulated += SCAN_STAGES[i].duration;
        if (elapsed < accumulated) {
          setCurrentStage(i);
          const stageElapsed = elapsed - (accumulated - SCAN_STAGES[i].duration);
          setStageProgress((stageElapsed / SCAN_STAGES[i].duration) * 100);
          break;
        }
      }

      if (elapsed < totalDuration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning, onComplete]);

  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1419]/95 backdrop-blur-xl flex items-center justify-center">
      <div className="max-w-lg w-full px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-blue-400">AI ENGINE ACTIVE</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Analyzing Evidence</h2>
          <p className="text-slate-400 mt-2">Processing civic intelligence data</p>
        </div>

        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Overall Progress</span>
            <span className="text-white font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-[#1a1f2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-3">
          {SCAN_STAGES.map((stage, index) => {
            const isActive = index === currentStage;
            const isComplete = index < currentStage;

            return (
              <div
                key={stage.label}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : isComplete
                    ? "bg-emerald-500/5 border border-emerald-500/20"
                    : "bg-[#1a1f2e]/50 border border-transparent"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-blue-500/20"
                      : isComplete
                      ? "bg-emerald-500/20"
                      : "bg-[#0f1419]"
                  }`}
                >
                  {isActive ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : isComplete ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isActive ? "text-blue-400" : isComplete ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      {stage.label}
                    </span>
                    {isActive && (
                      <span className="text-xs text-blue-400 font-mono">{Math.round(stageProgress)}%</span>
                    )}
                  </div>
                  {isActive && (
                    <div className="mt-2 h-0.5 bg-[#0f1419] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-100"
                        style={{ width: `${stageProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}

export default AIAnalysisAnimation;
