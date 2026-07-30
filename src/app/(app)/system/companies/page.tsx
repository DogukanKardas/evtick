import { PlusCircle } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { getCompaniesWithStats } from "@/lib/system/actions";
import { CompanyCard } from "@/components/system/company-card";
import { LinkButton } from "@/components/ui/link-button";

export default async function SystemCompaniesPage() {
  await requireSuperAdmin();
  const companies = await getCompaniesWithStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Şirketler</h1>
          <p className="text-sm text-muted-foreground">
            Tüm kayıtlı şirketler ve kodları
          </p>
        </div>
        <LinkButton href="/system/companies/new" size="sm" className="min-h-10">
          <PlusCircle className="mr-1 h-4 w-4" />
          Yeni
        </LinkButton>
      </div>

      {companies.length > 0 ? (
        <div className="grid gap-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          Henüz şirket bulunmuyor.
        </p>
      )}
    </div>
  );
}
