import { Suspense } from "react";
import {
  getCompaniesWithStats,
} from "@/lib/system/actions";
import { getCompaniesPageSummary } from "@/lib/system/company-actions";
import { CompaniesKpiSummary } from "@/components/system/companies-kpi-summary";
import { CompaniesTablePro } from "@/components/system/companies-table";
import { CompaniesSkeleton } from "@/components/system/companies-skeleton";

export async function CompaniesKpiSection() {
  const summary = await getCompaniesPageSummary();
  return <CompaniesKpiSummary summary={summary} />;
}

export async function CompaniesTableSection() {
  const companies = await getCompaniesWithStats();
  return <CompaniesTablePro companies={companies} />;
}

export function CompaniesKpiSectionWithSuspense() {
  return (
    <Suspense fallback={<CompaniesSkeleton section="kpi" />}>
      <CompaniesKpiSection />
    </Suspense>
  );
}

export function CompaniesTableSectionWithSuspense() {
  return (
    <Suspense fallback={<CompaniesSkeleton section="table" />}>
      <CompaniesTableSection />
    </Suspense>
  );
}
