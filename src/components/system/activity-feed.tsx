import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Building2, User, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformActivity } from "@/types/database";

const icons = {
  company: Building2,
  user: User,
  ticket: Ticket,
};

export function ActivityFeed({ items }: { items: PlatformActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Son Aktivite</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz aktivite yok.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const Icon = icons[item.type];
              const content = (
                <li className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 rounded-md bg-muted p-1.5">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </li>
              );

              return item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-lg transition-colors hover:bg-muted/50"
                >
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PlatformAlertsPanel({
  alerts,
}: {
  alerts: { id: string; type: string; message: string; href?: string }[];
}) {
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
            {alerts.map((alert) => (
              <li key={alert.id}>
                {alert.href ? (
                  <Link
                    href={alert.href}
                    className="block rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
                  >
                    {alert.message}
                  </Link>
                ) : (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/50">
                    {alert.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
