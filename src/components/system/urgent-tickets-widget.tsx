import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import type { Ticket } from "@/types/database";

export function UrgentTicketsWidget({ tickets }: { tickets: Ticket[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Acil Talepler</CardTitle>
        <Link
          href="/system/tickets"
          className="text-xs text-primary hover:underline"
        >
          Tümünü gör
        </Link>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Acil talep yok.
          </p>
        ) : (
          <ul className="divide-y">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/system/tickets/${t.id}`}
                  className="flex flex-col gap-2 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.company?.name ?? "—"} ·{" "}
                      {format(new Date(t.created_at), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
