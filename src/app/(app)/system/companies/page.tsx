import { PlusCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import {
  CompaniesKpiSectionWithSuspense,
  CompaniesTableSectionWithSuspense,
} from "@/components/system/companies-sections";

export default function SystemCompaniesPage() {
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

      <CompaniesKpiSectionWithSuspense />

      <CompaniesTableSectionWithSuspense />
    </div>
  );
}
