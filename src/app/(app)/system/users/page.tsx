import { getPlatformUsers } from "@/lib/system/user-actions";
import { getCompaniesWithStats } from "@/lib/system/actions";
import { UsersTable } from "@/components/system/users-table";

export default async function SystemUsersPage() {
  const [users, companies] = await Promise.all([
    getPlatformUsers(),
    getCompaniesWithStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <p className="text-sm text-muted-foreground">
          Platform geneli kullanıcı listesi ve rol yönetimi
        </p>
      </div>

      <UsersTable
        users={users}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
