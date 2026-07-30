"use client";

import { TICKET_PRIORITIES } from "@/lib/tickets/constants";
import type { TicketPriority } from "@/types/database";
import { cn } from "@/lib/utils";

interface TicketPriorityPickerProps {
  value: TicketPriority;
  onChange: (value: TicketPriority) => void;
}

export function TicketPriorityPicker({
  value,
  onChange,
}: TicketPriorityPickerProps) {
  return (
    <div className="space-y-3">
      <input type="hidden" name="priority" value={value} />

      <div className="grid gap-2 sm:grid-cols-2">
        {TICKET_PRIORITIES.map((p) => {
          const selected = value === p.value;

          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                selected
                  ? cn("border-primary bg-muted", p.borderClass)
                  : "hover:bg-muted/50"
              )}
            >
              <p className={cn("text-sm font-medium", p.colorClass)}>
                {p.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {p.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getPriorityDisplayLabel(value: TicketPriority): string {
  return (
    TICKET_PRIORITIES.find((p) => p.value === value)?.label ?? value
  );
}
