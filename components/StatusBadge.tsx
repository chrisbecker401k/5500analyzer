import { statusColors } from "@/data/mockData";
import { cn } from "@/lib/utils";
import type { PlanStatus } from "@/types/plan";

export function StatusBadge({ status, className }: { status: PlanStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold", statusColors[status], className)}>
      {status}
    </span>
  );
}
