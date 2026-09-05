"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DuplicateDetectionDialogProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  existingId?: string;
  nearbyCount?: number;
  distance?: number;
  onMerge?: () => void;
  onCreate?: () => void;
  originalReportId?: string;
  similarityScore?: number;
}

export function DuplicateDetectionDialog({ 
  open, 
  onClose, 
  onOpenChange,
  existingId, 
  nearbyCount = 1, 
  distance = 100, 
  onMerge, 
  onCreate,
  originalReportId,
  similarityScore,
}: DuplicateDetectionDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose?.();
    }
    onOpenChange?.(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#1e2433] border-[#2e3548] text-slate-200 sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <DialogTitle className="text-center text-xl">Possible duplicate detected</DialogTitle>
          <DialogDescription className="text-center text-slate-400 pt-2">
            We found {nearbyCount} similar report(s) within {distance} meters of this location. The closest matches issue <strong className="text-slate-200">{existingId || originalReportId}</strong>
            {similarityScore && <> with {similarityScore}% similarity</>}.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-[#1a1f2e] border border-[#2e3548] p-4 rounded-lg my-4 text-sm text-slate-300">
          Merging this report will add your images and details to the existing issue, increasing its priority and helping the department resolve it faster.
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCreate} className="w-full sm:w-auto border-[#2e3548] hover:bg-[#2e3548] text-slate-300">
            Create New Issue
          </Button>
          <Button onClick={onMerge} className="w-full sm:w-auto bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white">
            Merge Reports
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
