import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import type { SystemAuditLog } from "@/types/database";

interface AdminsActivityTabProps {
  logs: (SystemAuditLog & { action_label: string; href?: string })[];
}

export function AdminsActivityTab({ logs }: AdminsActivityTabProps) {
  if (logs.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Admin işlem kaydı bulunmuyor.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {logs.map((log) => {
        const row = (
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{log.action_label}</p>
              <p className="text-sm text-muted-foreground">
                {log.actor?.full_name ?? "—"}
                {typeof log.metadata?.email === "string" &&
                  ` · ${log.metadata.email}`}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(log.created_at), "d MMM yyyy HH:mm", {
                locale: tr,
              })}
            </span>
          </div>
        );

        return (
          <li key={log.id}>
            {log.href ? (
              <Link href={log.href} className="block hover:bg-muted/50">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}
