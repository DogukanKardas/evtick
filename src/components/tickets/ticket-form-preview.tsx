"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import type { TicketPriority } from "@/types/database";

interface TicketFormPreviewProps {
  title: string;
  description: string;
  categoryLabel: string;
  priority: TicketPriority;
}

export function TicketFormPreview({
  title,
  description,
  categoryLabel,
  priority,
}: TicketFormPreviewProps) {
  const displayTitle = title.trim() || "Talep başlığı önizlemesi";
  const displayDescription =
    description.trim() ||
    "Açıklama yazdıkça burada görünecek. Ne olduğunu, ne zaman başladığını ve denediğiniz adımları belirtin.";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Önizleme</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="line-clamp-2 font-medium">{displayTitle}</p>
            <StatusBadge status="open" />
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {displayDescription}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <PriorityBadge priority={priority} />
            <span>{categoryLabel}</span>
            <span>· Az önce</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
