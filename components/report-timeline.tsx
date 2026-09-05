import { TimelineEvent } from "@/data/types";
import { Check, Circle } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

interface ReportTimelineProps {
  events: TimelineEvent[];
}

export function ReportTimeline({ events }: ReportTimelineProps) {
  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#2e3548] before:to-transparent">
      {events.map((event, index) => {
        const isCompleted = event.status === "completed";
        const isCurrent = event.status === "current";
        const isPending = event.status === "pending";

        return (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#1e2433] bg-[#1e2433] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 transform -translate-x-1/2">
              {isCompleted && (
                <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {isCurrent && (
                <div className="w-6 h-6 rounded-full bg-[#3b82f6]/20 flex items-center justify-center relative">
                  <span className="absolute inset-0 rounded-full bg-[#3b82f6] animate-ping opacity-50"></span>
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                </div>
              )}
              {isPending && (
                <div className="w-6 h-6 rounded-full bg-[#2e3548] flex items-center justify-center">
                  <Circle className="w-3.5 h-3.5 text-slate-500" />
                </div>
              )}
            </div>

            <div className={cn("w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] ml-12 md:ml-0", "md:group-odd:text-right p-4 rounded-xl border border-[#2e3548] bg-[#1e2433]")}>
              <div className="flex flex-col md:group-odd:items-end">
                 <time className="text-xs font-medium text-[#3b82f6] mb-1">
                  {event.timestamp ? formatDateTime(event.timestamp) : "Pending"}
                </time>
                <h4 className={cn("text-sm font-semibold", isPending ? "text-slate-400" : "text-slate-200")}>
                  {event.label}
                </h4>
                {event.description && (
                  <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
