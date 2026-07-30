import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformAlert } from "@/types/database";

export function PlatformAlertsPanel({ alerts }: { alerts: PlatformAlert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uyarılar</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aktif uyarı yok.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => {
              const isHighOpen = alert.type === "high_open_tickets";
              const Icon = isHighOpen ? AlertTriangle : Clock;
              const className = isHighOpen
                ? "border-red-200 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100"
                : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100";

              const inner = (
                <span className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  {alert.message}
                </span>
              );

              return (
                <li key={alert.id}>
                  {alert.href ? (
                    <Link
                      href={alert.href}
                      className={`block rounded-md border px-3 py-2 text-sm ${className}`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <p
                      className={`rounded-md border px-3 py-2 text-sm ${className}`}
                    >
                      {inner}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
