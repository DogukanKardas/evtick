import { getPlatformUsers } from "@/lib/system/user-actions";
import { getCompaniesWithStats } from "@/lib/system/actions";
import { UsersTable } from "@/components/system/users-table";
import { LinkButton } from "@/components/ui/link-button";
import { UserPlus } from "lucide-react";

export default async function SystemUsersPage() {
  const [users, companies] = await Promise.all([
    getPlatformUsers(),
    getCompaniesWithStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground">
            Platform geneli kullanıcı listesi ve rol yönetimi
          </p>
        </div>
        <LinkButton href="/system/users/new" className="shrink-0">
          <UserPlus className="mr-2 h-4 w-4" />
          Yeni Kullanıcı
        </LinkButton>
      </div>

      <UsersTable
        users={users}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
