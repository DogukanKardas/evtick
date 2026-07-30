import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "@/components/system/create-user-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  await requireSuperAdmin();
  const { companyId } = await searchParams;
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name");

  const defaultCompanyId =
    companyId && companies?.some((c) => c.id === companyId)
      ? companyId
      : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Yeni Kullanıcı</h1>
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Oluştur</CardTitle>
          <CardDescription>
            Platforma yeni bir kullanıcı ekleyin. Oluşturulan hesap seçilen
            şirkete bağlanır ve belirlediğiniz şifre ile giriş yapabilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm
            companies={companies ?? []}
            defaultCompanyId={defaultCompanyId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
