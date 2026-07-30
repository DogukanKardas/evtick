import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Building2,
  User,
  Ticket,
  Shield,
  ScrollText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardAuditActivity } from "@/types/database";

const actionIcons: Record<string, typeof Building2> = {
  create_company: Building2,
  update_company: Building2,
  activate_company: Building2,
  deactivate_company: Building2,
  update_user_role: User,
  invite_super_admin: Shield,
  promote_super_admin: Shield,
  demote_super_admin: Shield,
  update_ticket: Ticket,
  company: Building2,
  user: User,
  ticket: Ticket,
};

export function AuditActivityFeed({
  items,
}: {
  items: DashboardAuditActivity[];
}) {
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
              const Icon =
                actionIcons[item.action] ?? actionIcons[item.entity_type] ?? ScrollText;
              const content = (
                <li className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 rounded-md bg-muted p-1.5">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.action_label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.actor_name}
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
