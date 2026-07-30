import { getAuditLogs } from "@/lib/system/audit";
import { AuditLogTable } from "@/components/system/audit-log-table";

export default async function SystemAuditPage() {
  const logs = await getAuditLogs(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Denetim Kaydı</h1>
        <p className="text-sm text-muted-foreground">
          Sistem yöneticisi işlem geçmişi
        </p>
      </div>

      <AuditLogTable logs={logs} />
    </div>
  );
}
