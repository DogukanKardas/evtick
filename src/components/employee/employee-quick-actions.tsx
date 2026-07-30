"use client";

import { PlusCircle, Ticket, AlertCircle, MessageSquare } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeDashboardSummary } from "@/types/database";

export function EmployeeQuickActions({
  summary,
}: {
  summary: EmployeeDashboardSummary;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <LinkButton href="/tickets/new" size="sm" className="min-h-10">
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni Talep
        </LinkButton>
        <LinkButton href="/tickets?status=open" variant="outline" size="sm" className="min-h-10">
          <Ticket className="mr-2 h-4 w-4" />
          Açık Talepler ({summary.open})
        </LinkButton>
        {summary.urgent_open > 0 && (
          <LinkButton href="/tickets?filter=urgent" variant="outline" size="sm" className="min-h-10">
            <AlertCircle className="mr-2 h-4 w-4" />
            Acil ({summary.urgent_open})
          </LinkButton>
        )}
        {summary.awaiting_response > 0 && (
          <LinkButton href="/tickets?status=in_progress" variant="outline" size="sm" className="min-h-10">
            <MessageSquare className="mr-2 h-4 w-4" />
            Yanıt Bekleyen ({summary.awaiting_response})
          </LinkButton>
        )}
      </CardContent>
    </Card>
  );
}
