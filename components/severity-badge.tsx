import { cn } from "@/lib/utils";
import { Severity, SEVERITY_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const colorClass = SEVERITY_COLORS[severity] || "bg-slate-500 text-white";

  return (
    <Badge className={cn("font-medium border-0 w-fit", colorClass, className)}>
      {severity}
    </Badge>
  );
}
