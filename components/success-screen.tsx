"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Building, Clock, ArrowRight, Copy, PartyPopper } from "lucide-react";
import { PriorityScore } from "./priority-score";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface SuccessScreenProps {
  complaintId: string;
  reportId: string;
  issue: string;
  location: string;
  priority: number;
  department: string;
  status: string;
  onReportAnother: () => void;
}

export function SuccessScreen({
  complaintId,
  reportId,
  issue,
  location,
  priority,
  department,
  status,
  onReportAnother,
}: SuccessScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaintId);
    setCopied(true);
    toast.success("Complaint ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Success Header */}
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
            <PartyPopper className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Issue Reported Successfully!</h2>
        <p className="text-slate-400 text-lg">
          Thank you for helping improve your city. Your complaint has been registered.
        </p>
      </div>

      {/* Complaint ID Card */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Complaint ID
              </p>
              <p className="text-2xl font-bold text-white font-mono">{complaintId}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyId}
              className="border-[#2e3548] text-slate-300 hover:bg-[#2e3548]"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card className="bg-[#1e2433] border-[#2e3548]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Complaint Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-[#1a1f2e] rounded-lg">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Issue</p>
                <p className="font-medium text-white">{issue}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#1a1f2e] rounded-lg">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MapPin className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="font-medium text-white text-sm">{location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#1a1f2e] rounded-lg">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Building className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Department</p>
                <p className="font-medium text-white">{department}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#1a1f2e] rounded-lg">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-medium text-amber-400">{status}</p>
              </div>
            </div>
          </div>

          {/* Priority Score */}
          <div className="flex items-center justify-center py-4">
            <PriorityScore score={priority} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href={`/reports/${reportId}`} className="flex-1">
          <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Track Complaint
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          onClick={onReportAnother}
          className="flex-1 border-[#2e3548] text-slate-300 hover:bg-[#2e3548]"
        >
          Report Another Issue
        </Button>
      </div>
    </div>
  );
}
