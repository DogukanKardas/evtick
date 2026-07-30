import { Suspense } from "react";
import {
  DashboardKpiSection,
  DashboardChartsSection,
  DashboardFeedsSection,
  DashboardUrgentSection,
  DashboardCompaniesSection,
} from "@/components/system/dashboard-sections";
import { DashboardQuickActions } from "@/components/system/dashboard-quick-actions";
import { DashboardSkeleton } from "@/components/system/dashboard-skeleton";

export default function SystemDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Sistem Paneli</h1>
          <p className="text-sm text-muted-foreground">
            Platform geneli yönetim ve istatistikler
          </p>
        </div>
        <DashboardQuickActions />
      </div>

      <Suspense fallback={<DashboardSkeleton section="kpi" />}>
        <DashboardKpiSection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton section="charts" />}>
        <DashboardChartsSection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton section="feeds" />}>
        <DashboardFeedsSection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton section="urgent" />}>
        <DashboardUrgentSection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton section="companies" />}>
        <DashboardCompaniesSection />
      </Suspense>
    </div>
  );
}
