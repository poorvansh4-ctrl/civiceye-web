import { Category, Department } from "@/lib/constants";
import { ArrowRight, Sparkles } from "lucide-react";

interface DepartmentAssignmentProps {
  category: Category;
  department: Department;
}

export function DepartmentAssignment({ category, department }: DepartmentAssignmentProps) {
  return (
    <div className="flex items-center gap-4 bg-[#1e2433] p-4 rounded-xl border border-[#2e3548]">
      <div className="flex-1 text-center py-2 px-3 bg-[#1a1f2e] rounded-lg border border-[#2e3548]">
        <p className="text-xs text-slate-400 mb-1">Detected Category</p>
        <p className="font-semibold text-slate-200">{category}</p>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3b82f6]/10 text-[#3b82f6] mb-1">
          <Sparkles className="w-3 h-3" />
          AI Assigned
        </span>
        <ArrowRight className="w-5 h-5 text-slate-500" />
      </div>

      <div className="flex-1 text-center py-2 px-3 bg-[#1a1f2e] rounded-lg border border-[#3b82f6]/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        <p className="text-xs text-slate-400 mb-1">Routed To</p>
        <p className="font-semibold text-slate-200">{department}</p>
      </div>
    </div>
  );
}
