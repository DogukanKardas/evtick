import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/database";

const statusConfig: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: { label: "Açık", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  in_progress: { label: "İşlemde", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  resolved: { label: "Çözüldü", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "Kapalı", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export const priorityLabels: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "text-muted-foreground",
    medium: "text-foreground",
    high: "text-orange-600",
    urgent: "text-red-600 font-semibold",
  };

  return (
    <span className={cn("text-xs", colors[priority] ?? colors.medium)}>
      {priorityLabels[priority] ?? priority}
    </span>
  );
}
