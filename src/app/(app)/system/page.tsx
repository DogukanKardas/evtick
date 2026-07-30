import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import {
  getPlatformStats,
  getCompaniesWithStats,
} from "@/lib/system/actions";
import { PlatformStatsCards } from "@/components/system/platform-stats-cards";
import { CompanyCard } from "@/components/system/company-card";
import { LinkButton } from "@/components/ui/link-button";

export default async function SystemDashboardPage() {
  await requireSuperAdmin();
  const stats = await getPlatformStats();
  const companies = await getCompaniesWithStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sistem Paneli</h1>
          <p className="text-sm text-muted-foreground">
            Platform geneli yönetim ve istatistikler
          </p>
        </div>
        <LinkButton href="/system/companies/new" className="min-h-11">
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni Şirket
        </LinkButton>
      </div>

      <PlatformStatsCards stats={stats} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Şirketler</h2>
          <Link
            href="/system/companies"
            className="text-sm text-primary hover:underline"
          >
            Tümünü gör
          </Link>
        </div>
        <div className="grid gap-3">
          {companies.slice(0, 5).map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>
    </div>
  );
}
