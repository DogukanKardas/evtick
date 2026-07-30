import { PlusCircle } from "lucide-react";
import { getCompaniesWithStats } from "@/lib/system/actions";
import { CompaniesTable } from "@/components/system/companies-table";
import { LinkButton } from "@/components/ui/link-button";

export default async function SystemCompaniesPage() {
  const companies = await getCompaniesWithStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Şirketler</h1>
          <p className="text-sm text-muted-foreground">
            Arama, filtre ve sıralama ile tüm şirketler
          </p>
        </div>
        <LinkButton href="/system/companies/new" size="sm" className="min-h-10">
          <PlusCircle className="mr-1 h-4 w-4" />
          Yeni
        </LinkButton>
      </div>

      <CompaniesTable companies={companies} />
    </div>
  );
}
