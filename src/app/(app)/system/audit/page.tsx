import {
  AuditKpiSectionWithSuspense,
  AuditTableSectionWithSuspense,
} from "@/components/system/audit-sections";

export default function SystemAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Denetim Kaydı</h1>
        <p className="text-sm text-muted-foreground">
          Sistem yöneticisi işlem geçmişi
        </p>
      </div>

      <AuditKpiSectionWithSuspense />
      <AuditTableSectionWithSuspense />
    </div>
  );
}
