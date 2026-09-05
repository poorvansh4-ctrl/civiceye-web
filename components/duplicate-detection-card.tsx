"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Merge, PlusCircle } from "lucide-react";

interface DuplicateDetectionCardProps {
  existingId: string;
  nearbyCount: number;
  distance: number;
  similarityScore: number;
  onMerge: () => void;
  onCreate: () => void;
}

export function DuplicateDetectionCard({
  existingId,
  nearbyCount,
  distance,
  similarityScore,
  onMerge,
  onCreate,
}: DuplicateDetectionCardProps) {
  return (
    <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">Possible Duplicate Issue</h3>
            <p className="text-sm text-slate-400 mb-4">
              We found a similar report near your location. Merging helps prioritize the issue faster.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#1a1f2e] rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Existing ID</p>
                <p className="font-bold text-white">{existingId}</p>
              </div>
              <div className="bg-[#1a1f2e] rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Nearby Reports</p>
                <p className="font-bold text-amber-400">{nearbyCount}</p>
              </div>
              <div className="bg-[#1a1f2e] rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Distance</p>
                <p className="font-bold text-white">{distance}m</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 bg-[#0f1419] rounded-lg border border-[#2e3548]">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Similarity</span>
                  <span className="text-amber-400 font-medium">{similarityScore}%</span>
                </div>
                <div className="h-2 bg-[#2e3548] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${similarityScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onMerge}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <Merge className="w-4 h-4 mr-2" />
                Merge With Existing
              </Button>
              <Button
                onClick={onCreate}
                variant="outline"
                className="flex-1 border-[#2e3548] text-slate-300 hover:bg-[#2e3548]"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Submit As New
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
