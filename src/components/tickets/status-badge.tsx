import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/database";

const statusConfig: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Açık",
    className: "border border-primary/25 bg-primary/10 text-primary",
  },
  in_progress: {
    label: "İşlemde",
    className: "border border-warning/25 bg-warning/10 text-warning",
  },
  resolved: {
    label: "Çözüldü",
    className: "border border-success/25 bg-success/10 text-success",
  },
  closed: {
    label: "Kapalı",
    className: "border border-border bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
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
    high: "text-warning",
    urgent: "font-medium text-destructive",
  };

  return (
    <span className={cn("text-xs", colors[priority] ?? colors.medium)}>
      {priorityLabels[priority] ?? priority}
    </span>
  );
}
