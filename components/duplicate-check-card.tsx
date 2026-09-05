"use client";

import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DuplicateCheckCardProps {
  isDuplicate: boolean;
  duplicateConfidence: number;
  duplicateComplaintId: string | null;
  duplicateComplaintNumber: string | null;
  duplicateDistanceMeters: number | null;
  duplicateReason: string;
  onSubmitAnyway?: () => void;
  showSubmitAnyway?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export function DuplicateCheckCard(props: DuplicateCheckCardProps) {
  const {
    isDuplicate,
    duplicateConfidence,
    duplicateComplaintId,
    duplicateComplaintNumber,
    duplicateDistanceMeters,
    duplicateReason,
    onSubmitAnyway,
    showSubmitAnyway = true,
  } = props;

  if (!isDuplicate) {
    return (
      <Card className="bg-[#1e2433] border-[#2e3548]">
        <CardHeader className="pb-3 border-b border-[#2e3548] bg-gradient-to-r from-emerald-500/5 to-blue-500/5">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-100">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            Duplicate Check
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-semibold text-emerald-300">
                ✓ No duplicate complaint found nearby
              </p>
              <p className="text-sm text-slate-300 mt-1">
                {duplicateReason ||
                  "We searched nearby unresolved complaints in your area and did not find a match."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1e2433] border-[#2e3548]">
      <CardHeader className="pb-3 border-b border-[#2e3548] bg-gradient-to-r from-amber-500/5 to-red-500/5">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-100">
          <div className="p-1.5 bg-amber-500/20 rounded-lg">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          Duplicate Check
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-amber-300">
                ⚠ Possible Duplicate
              </p>
              <p className="text-sm text-slate-300 mt-1">
                This issue may already have been reported nearby.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/30 bg-amber-500/15 text-amber-300 shrink-0">
              {duplicateConfidence}% match
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-[#0f1419] border border-[#2e3548]">
            <p className="text-xs text-slate-500 mb-1">Existing Complaint</p>
            <p className="font-mono font-medium text-white">
              {duplicateComplaintNumber || duplicateComplaintId}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#0f1419] border border-[#2e3548]">
            <p className="text-xs text-slate-500 mb-1">Distance</p>
            <p className="font-medium text-white">
              {duplicateDistanceMeters != null
                ? `${duplicateDistanceMeters} m away`
                : "—"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[#2e3548] bg-[#0f1419] p-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-300 leading-relaxed">
              {duplicateReason}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {duplicateComplaintId && (
            <Link
              href={`/reports/${duplicateComplaintId}`}
              className="w-full sm:flex-1"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[48px] h-12 border-[#2e3548] bg-[#0f1419] text-slate-200 hover:bg-[#1e2433]"
              >
                View Existing Report
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
          {showSubmitAnyway && onSubmitAnyway && (
            <Button
              type="button"
              onClick={onSubmitAnyway}
              className="w-full sm:flex-1 min-h-[48px] h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              Submit Anyway
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { STATUS_LABEL };
