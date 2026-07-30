import { requireRole } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import { UserRoleForm } from "@/components/admin/user-role-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Profile, UserRole } from "@/types/database";

const roleLabels: Record<UserRole, string> = {
  employee: "Çalışan",
  support: "IT Destek",
  admin: "Yönetici",
};

export default async function AdminUsersPage() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("full_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Şirket kullanıcılarının rollerini yönetin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Kullanıcılar ({users?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(users as Profile[] | null)?.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[user.role]}
                    {user.id === profile.id && " (siz)"}
                  </p>
                </div>
                {user.id !== profile.id && (
                  <UserRoleForm userId={user.id} currentRole={user.role} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
