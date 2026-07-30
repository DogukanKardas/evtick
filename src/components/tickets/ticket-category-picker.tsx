"use client";

import {
  Monitor,
  AppWindow,
  Wifi,
  Mail,
  HelpCircle,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TICKET_CATEGORIES } from "@/lib/tickets/constants";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Donanım: Monitor,
  Yazılım: AppWindow,
  Ağ: Wifi,
  "E-posta": Mail,
  Genel: HelpCircle,
  other: MoreHorizontal,
};

interface TicketCategoryPickerProps {
  value: string;
  customValue: string;
  onChange: (value: string) => void;
  onCustomChange: (value: string) => void;
  customError?: string;
}

export function TicketCategoryPicker({
  value,
  customValue,
  onChange,
  onCustomChange,
  customError,
}: TicketCategoryPickerProps) {
  const resolvedCategory =
    value === "other" && customValue.trim() ? customValue.trim() : value;

  return (
    <div className="space-y-3">
      <input type="hidden" name="category" value={value} />
      {value === "other" && (
        <input type="hidden" name="category_custom" value={customValue} />
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TICKET_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.value] ?? HelpCircle;
          const selected = value === cat.value;

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange(cat.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                selected
                  ? "border-primary bg-muted"
                  : "hover:bg-muted/50"
              )}
            >
              <Icon className={cn("mb-2 h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
              <p className="text-sm font-medium">{cat.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {cat.hint}
              </p>
            </button>
          );
        })}
      </div>

      {value === "other" && (
        <div className="space-y-2">
          <Label htmlFor="category_custom">Özel Kategori</Label>
          <Input
            id="category_custom"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="Kategori adını yazın"
            className="min-h-11"
          />
          {customError && (
            <p className="text-sm text-destructive">{customError}</p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Seçili:{" "}
        <span className="font-medium text-foreground">
          {value === "other"
            ? customValue.trim() || "Diğer (henüz girilmedi)"
            : TICKET_CATEGORIES.find((c) => c.value === value)?.label ??
              resolvedCategory}
        </span>
      </p>
    </div>
  );
}

export function getCategoryDisplayLabel(
  value: string,
  customValue: string
): string {
  if (value === "other") return customValue.trim() || "Diğer";
  return (
    TICKET_CATEGORIES.find((c) => c.value === value)?.label ?? value
  );
}
