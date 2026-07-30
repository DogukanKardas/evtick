import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import {
  getAdminAuditActivity,
  getAdminsPageSummary,
  getPromotableUsers,
  getSuperAdmins,
} from "@/lib/system/admin-actions";
import { getCompaniesWithStats } from "@/lib/system/actions";
import { AdminsKpiSummary } from "@/components/system/admins-kpi-summary";
import { AdminsShell } from "@/components/system/admins-shell";
import { AdminsSkeleton } from "@/components/system/admins-skeleton";

export async function AdminsKpiSection() {
  const summary = await getAdminsPageSummary();
  return <AdminsKpiSummary summary={summary} />;
}

export async function AdminsShellSection() {
  const profile = await requireSuperAdmin();
  const [admins, promotableUsers, companies, auditLogs] = await Promise.all([
    getSuperAdmins(),
    getPromotableUsers(),
    getCompaniesWithStats(),
    getAdminAuditActivity(),
  ]);

  return (
    <AdminsShell
      admins={admins}
      promotableUsers={promotableUsers}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      auditLogs={auditLogs}
      currentProfileId={profile.id}
    />
  );
}

export function AdminsKpiSectionWithSuspense() {
  return (
    <Suspense fallback={<AdminsSkeleton section="kpi" />}>
      <AdminsKpiSection />
    </Suspense>
  );
}

export function AdminsShellSectionWithSuspense() {
  return (
    <Suspense fallback={<AdminsSkeleton section="shell" />}>
      <AdminsShellSection />
    </Suspense>
  );
}
