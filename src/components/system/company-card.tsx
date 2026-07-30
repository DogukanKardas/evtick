import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyStatusBadge } from "@/components/system/company-status-badge";
import type { CompanyWithStats } from "@/types/database";

export function CompanyCard({ company }: { company: CompanyWithStats }) {
  return (
    <Link href={`/system/companies/${company.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{company.name}</CardTitle>
              <p className="font-mono text-sm text-muted-foreground">
                {company.code}
              </p>
            </div>
            <CompanyStatusBadge isActive={company.is_active} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{company.user_count} kullanıcı</span>
            <span>{company.ticket_count} talep</span>
            <span>{company.open_tickets} açık</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
