import {
  AdminsKpiSectionWithSuspense,
  AdminsShellSectionWithSuspense,
} from "@/components/system/admins-sections";

export default function SystemAdminsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sistem Yöneticileri</h1>
        <p className="text-sm text-muted-foreground">
          Super admin listesi, davet ve yükseltme
        </p>
      </div>

      <AdminsKpiSectionWithSuspense />
      <AdminsShellSectionWithSuspense />
    </div>
  );
}
