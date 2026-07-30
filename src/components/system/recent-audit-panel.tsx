import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentAuditItem {
  id: string;
  action_label: string;
  actor?: { full_name?: string } | null;
  created_at: string;
  href?: string;
}

export function RecentAuditPanel({ logs }: { logs: RecentAuditItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Son Denetim Kayıtları</CardTitle>
        <Link
          href="/system/audit"
          className="text-xs text-primary hover:underline"
        >
          Tümünü gör
        </Link>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Denetim kaydı bulunmuyor.
          </p>
        ) : (
          <ul className="divide-y">
            {logs.map((log) => {
              const row = (
                <div className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{log.action_label}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.actor?.full_name ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
              );

              return (
                <li key={log.id}>
                  {log.href ? (
                    <Link
                      href={log.href}
                      className="block transition-colors hover:bg-muted/50"
                    >
                      {row}
                    </Link>
                  ) : (
                    row
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
