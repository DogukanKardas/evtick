"use client";

import { useState } from "react";
import { CompanyDetailHeader } from "@/components/system/company-detail-header";
import { CompanyTabs } from "@/components/system/company-tabs";
import type {
  CompanyWithStats,
  Profile,
  SystemAuditLog,
  Ticket,
} from "@/types/database";

type Tab = "general" | "users" | "tickets" | "stats" | "activity";

interface CompanyDetailShellProps {
  company: CompanyWithStats;
  users: Profile[];
  tickets: Ticket[];
  stats: {
    statusCounts: Record<string, number>;
    last30Days: number;
    total: number;
  };
  auditLogs: (SystemAuditLog & { action_label: string; href?: string })[];
}

export function CompanyDetailShell({
  company,
  users,
  tickets,
  stats,
  auditLogs,
}: CompanyDetailShellProps) {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="space-y-6">
      <CompanyDetailHeader
        company={company}
        onTabChange={(t) => setTab(t as Tab)}
      />
      <CompanyTabs
        company={company}
        users={users}
        tickets={tickets}
        stats={stats}
        auditLogs={auditLogs}
        initialTab={tab}
        onTabChange={setTab}
      />
    </div>
  );
}
