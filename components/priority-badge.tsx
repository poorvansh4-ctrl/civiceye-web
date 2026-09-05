import { cn } from "@/lib/utils";
import { PRIORITY_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  let label = "Low";
  let colorClass = PRIORITY_COLORS.Low;

  if (priority >= 90) {
    label = "Critical";
    colorClass = PRIORITY_COLORS.Critical;
  } else if (priority >= 70) {
    label = "High";
    colorClass = PRIORITY_COLORS.High;
  } else if (priority >= 40) {
    label = "Medium";
    colorClass = PRIORITY_COLORS.Medium;
  }

  return (
    <Badge className={cn("flex items-center gap-1 font-medium w-fit", colorClass, className)} variant="outline">
      <span>{label}</span>
      <span className="opacity-75">({priority})</span>
    </Badge>
  );
}
