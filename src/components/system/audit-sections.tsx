import { Suspense } from "react";
import {
  getAuditActors,
  getAuditLogs,
  getAuditPageSummary,
} from "@/lib/system/audit";
import { AuditKpiSummary } from "@/components/system/audit-kpi-summary";
import { AuditLogTablePro } from "@/components/system/audit-log-table";
import { AuditSkeleton } from "@/components/system/audit-skeleton";

export async function AuditKpiSection() {
  const summary = await getAuditPageSummary();
  return <AuditKpiSummary summary={summary} />;
}

export async function AuditTableSection() {
  const [logs, actors] = await Promise.all([
    getAuditLogs(500),
    getAuditActors(),
  ]);

  return <AuditLogTablePro logs={logs} actors={actors} />;
}

export function AuditKpiSectionWithSuspense() {
  return (
    <Suspense fallback={<AuditSkeleton section="kpi" />}>
      <AuditKpiSection />
    </Suspense>
  );
}

export function AuditTableSectionWithSuspense() {
  return (
    <Suspense fallback={<AuditSkeleton section="table" />}>
      <AuditTableSection />
    </Suspense>
  );
}
