"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

interface AIAnalysisStepProps {
  steps: { label: string; id: number }[];
  currentStep: number;
}

export function AIAnalysisStep({ steps, currentStep }: AIAnalysisStepProps) {
  return (
    <div className="space-y-4">
      {steps.map((step) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isPending = currentStep < step.id;

        return (
          <div key={step.id} className="flex items-center gap-4">
            <div className="relative">
              {isCompleted && (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              )}
              {isCurrent && (
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center relative">
                  <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
              )}
              {isPending && (
                <div className="w-10 h-10 rounded-full bg-[#1a1f2e] border border-[#2e3548] flex items-center justify-center">
                  <Circle className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <span
                className={cn(
                  "text-base font-medium transition-colors",
                  isCompleted && "text-emerald-400",
                  isCurrent && "text-blue-400",
                  isPending && "text-slate-600"
                )}
              >
                {step.label}
              </span>
              {isCurrent && (
                <div className="mt-2 h-1 w-full bg-[#1a1f2e] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-progress" style={{ width: "60%" }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
