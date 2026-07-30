import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { getCompanyById } from "@/lib/system/actions";
import { CompanyEditForm } from "@/components/system/company-edit-form";
import { CompanyStatusBadge } from "@/components/system/company-status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  await requireSuperAdmin();
  const { id } = await params;
  const company = await getCompanyById(id);

  if (!company) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <CompanyStatusBadge isActive={company.is_active} />
        </div>
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <p className="font-mono text-muted-foreground">{company.code}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              Kullanıcı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{company.user_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              Talep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{company.ticket_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              Açık
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{company.open_tickets}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyEditForm company={company} />
        </CardContent>
      </Card>
    </div>
  );
}
