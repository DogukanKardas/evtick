import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { CompanyForm } from "@/components/system/company-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewCompanyPage() {
  await requireSuperAdmin();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Yeni Şirket</h1>
      <Card>
        <CardHeader>
          <CardTitle>Şirket Oluştur</CardTitle>
          <CardDescription>
            Manuel kod girin veya sistemin otomatik kod üretmesini sağlayın.
            Oluşturulan kod çalışanların kayıt olurken kullanacağı şirket
            kodudur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm />
        </CardContent>
      </Card>
    </div>
  );
}
