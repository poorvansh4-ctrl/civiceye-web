import { cn } from "@/lib/utils";
import { Status, STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || "bg-slate-500 text-white";

  return (
    <Badge className={cn("flex items-center gap-1.5 font-medium border-0 w-fit", colorClass, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      <span>{status}</span>
    </Badge>
  );
}
