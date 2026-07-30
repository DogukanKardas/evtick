import { notFound } from "next/navigation";
import { getCompanyById } from "@/lib/system/actions";
import { getCompanyAuditActivity } from "@/lib/system/company-actions";
import { getCompanyUsers } from "@/lib/system/user-actions";
import {
  getCompanyTickets,
  getCompanyTicketStats,
} from "@/lib/system/ticket-actions";
import { CompanyDetailShell } from "@/components/system/company-detail-shell";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { id } = await params;
  const [company, users, tickets, stats, auditLogs] = await Promise.all([
    getCompanyById(id),
    getCompanyUsers(id),
    getCompanyTickets(id),
    getCompanyTicketStats(id),
    getCompanyAuditActivity(id, 20),
  ]);

  if (!company) notFound();

  return (
    <CompanyDetailShell
      company={company}
      users={users}
      tickets={tickets}
      stats={stats}
      auditLogs={auditLogs}
    />
  );
}
